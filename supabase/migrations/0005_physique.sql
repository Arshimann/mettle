-- ============================================================================
-- Mettle — physique board. Run AFTER 0004_storage.sql.
--
-- Photos live in a PRIVATE bucket, unlike the public `avatars` bucket in 0004.
-- Readability is decided by the post row rather than the object path, so
-- flipping a post private↔shared is a single UPDATE and never a storage move
-- (a move is copy+delete, which can fail halfway and lose the only copy of a
-- sensitive photo).
--
-- Default visibility is 'private'. Sharing a photo of your body has to be a
-- deliberate act, never a default.
-- ============================================================================

do $$ begin
  create type public.physique_visibility as enum ('private', 'friends');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.physique_posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  taken_on    date not null default current_date,
  pose        text not null default 'front'
                check (pose in ('front', 'side', 'back', 'other')),
  caption     text check (char_length(caption) <= 280),
  weight_kg   numeric(5,2),
  visibility  public.physique_visibility not null default 'private',
  path        text not null,          -- '<uid>/<postId>.webp'
  thumb_path  text not null,          -- '<uid>/<postId>_t.webp'
  width       int,
  height      int,
  created_at  timestamptz not null default now()
);

create index if not exists physique_posts_user_taken on public.physique_posts (user_id, taken_on desc);
create index if not exists physique_posts_feed on public.physique_posts (created_at desc)
  where visibility = 'friends';
create unique index if not exists physique_posts_path on public.physique_posts (path);
create unique index if not exists physique_posts_thumb on public.physique_posts (thumb_path);

-- Reactions and comments get their own tables rather than reusing the workout
-- ones, for two reasons that matter: a real FK gives cascade delete (the
-- workout tables key off an untyped text column, so deleting a workout leaves
-- its reactions orphaned forever), and a dedicated policy can join back to the
-- post to check visibility — which the shared table cannot express, meaning a
-- friend who guessed a private post's uuid could attach a comment to it.
create table if not exists public.physique_reactions (
  post_id    uuid not null references public.physique_posts (id) on delete cascade,
  reactor_id uuid not null references public.profiles (id) on delete cascade,
  emoji      text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, reactor_id)
);

create table if not exists public.physique_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.physique_posts (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists physique_comments_post_created
  on public.physique_comments (post_id, created_at);

alter table public.physique_posts     enable row level security;
alter table public.physique_reactions enable row level security;
alter table public.physique_comments  enable row level security;

-- ---------------------------------------------------------------------------
-- One place that answers "may auth.uid() see this post?", reused by the
-- reaction, comment and storage policies. SECURITY DEFINER for the same
-- anti-recursion reason as is_friend() in 0003.
-- ---------------------------------------------------------------------------
create or replace function public.can_view_physique(post uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from physique_posts p
    where p.id = post
      and (p.user_id = auth.uid()
           or (p.visibility = 'friends' and public.is_friend(p.user_id)))
  );
$$;

-- posts: always see your own; friends' only once shared. Write your own only.
drop policy if exists pp_select on public.physique_posts;
create policy pp_select on public.physique_posts for select
  using (user_id = auth.uid()
         or (visibility = 'friends' and public.is_friend(user_id)));

drop policy if exists pp_insert on public.physique_posts;
create policy pp_insert on public.physique_posts for insert with check (user_id = auth.uid());

drop policy if exists pp_update on public.physique_posts;
create policy pp_update on public.physique_posts for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists pp_delete on public.physique_posts;
create policy pp_delete on public.physique_posts for delete using (user_id = auth.uid());

-- reactions / comments: gated on the post being visible to you.
drop policy if exists pr_select on public.physique_reactions;
create policy pr_select on public.physique_reactions for select
  using (public.can_view_physique(post_id));

drop policy if exists pr_insert on public.physique_reactions;
create policy pr_insert on public.physique_reactions for insert
  with check (reactor_id = auth.uid() and public.can_view_physique(post_id));

drop policy if exists pr_update on public.physique_reactions;
create policy pr_update on public.physique_reactions for update
  using (reactor_id = auth.uid()) with check (reactor_id = auth.uid());

drop policy if exists pr_delete on public.physique_reactions;
create policy pr_delete on public.physique_reactions for delete using (reactor_id = auth.uid());

drop policy if exists pc_select on public.physique_comments;
create policy pc_select on public.physique_comments for select
  using (public.can_view_physique(post_id));

drop policy if exists pc_insert on public.physique_comments;
create policy pc_insert on public.physique_comments for insert
  with check (author_id = auth.uid() and public.can_view_physique(post_id));

-- The author deletes their own; the post owner can moderate their own board.
drop policy if exists pc_delete on public.physique_comments;
create policy pc_delete on public.physique_comments for delete
  using (author_id = auth.uid()
         or exists (select 1 from public.physique_posts p
                    where p.id = post_id and p.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- Storage: a PRIVATE bucket. Because public = false there is no public URL at
-- all, and createSignedUrl is itself authorised by this select policy — so a
-- non-friend cannot even mint a URL, let alone use one.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('physique', 'physique', false, 3145728, array['image/webp', 'image/jpeg'])
on conflict (id) do nothing;

create or replace function public.can_read_physique_object(object_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from physique_posts p
    where (p.path = object_name or p.thumb_path = object_name)
      and (p.user_id = auth.uid()
           or (p.visibility = 'friends' and public.is_friend(p.user_id)))
  );
$$;

drop policy if exists physique_select on storage.objects;
create policy physique_select on storage.objects for select to authenticated
  using (bucket_id = 'physique'
         -- Your own folder short-circuits, so an upload is readable before its
         -- row is committed.
         and ((storage.foldername(name))[1] = auth.uid()::text
              or public.can_read_physique_object(name)));

drop policy if exists physique_insert on storage.objects;
create policy physique_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'physique' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists physique_update on storage.objects;
create policy physique_update on storage.objects for update to authenticated
  using (bucket_id = 'physique' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'physique' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists physique_delete on storage.objects;
create policy physique_delete on storage.objects for delete to authenticated
  using (bucket_id = 'physique' and (storage.foldername(name))[1] = auth.uid()::text);
