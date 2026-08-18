-- ============================================================================
-- Mettle — notification centre. Run AFTER 0005_physique.sql.
--
-- No new tables: notifications are derived from rows that already exist
-- (reactions, comments, friend requests). This migration only adds the
-- Realtime publication membership that makes them arrive live, plus the
-- indexes the "newer than my watermark" queries need.
--
-- RLS is untouched. Realtime evaluates the existing select policies per
-- subscriber, and is_friend() / can_view_physique() are SECURITY DEFINER, so
-- they work inside that check.
-- ============================================================================

-- ALTER PUBLICATION ... ADD TABLE errors if the table is already a member, so
-- each add is guarded.
do $$
declare t text;
begin
  foreach t in array array[
    'workout_reactions',
    'workout_comments',
    'friend_requests',
    'physique_reactions',
    'physique_comments'
  ] loop
    if to_regclass('public.' || t) is not null
       and not exists (
         select 1 from pg_publication_tables
         where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
       )
    then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- friend_requests has no created_at in 0003; the watermark query needs one.
alter table public.friend_requests
  add column if not exists created_at timestamptz not null default now();

-- Watermark queries are all "rows aimed at me, newer than X".
create index if not exists workout_reactions_profile_created
  on public.workout_reactions (profile_id, created_at desc);
create index if not exists workout_comments_profile_created
  on public.workout_comments (profile_id, created_at desc);
create index if not exists friend_requests_to_created
  on public.friend_requests (to_id, created_at desc);
create index if not exists physique_reactions_created
  on public.physique_reactions (created_at desc);
create index if not exists physique_comments_created
  on public.physique_comments (created_at desc);

-- ---------------------------------------------------------------------------
-- Physique reactions/comments key off a post rather than an owner column, so
-- "aimed at me" needs a join. Doing that client-side would mean fetching every
-- post first; this keeps it to one round trip.
-- ---------------------------------------------------------------------------
create or replace function public.physique_notifications(since timestamptz)
returns table (
  kind text,
  id uuid,
  post_id uuid,
  actor_id uuid,
  body text,
  created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select 'reaction'::text, null::uuid, r.post_id, r.reactor_id, r.emoji, r.created_at
  from physique_reactions r
  join physique_posts p on p.id = r.post_id
  where p.user_id = auth.uid() and r.reactor_id <> auth.uid() and r.created_at > since
  union all
  select 'comment'::text, c.id, c.post_id, c.author_id, c.body, c.created_at
  from physique_comments c
  join physique_posts p on p.id = c.post_id
  where p.user_id = auth.uid() and c.author_id <> auth.uid() and c.created_at > since
  order by created_at desc
  limit 50;
$$;
