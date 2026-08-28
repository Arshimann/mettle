-- ============================================================================
-- Mettle — security hardening. Run AFTER 0007_fixes.sql.
--
-- The existing model is sound: RLS is on for every table, every policy keys off
-- auth.uid(), the SECURITY DEFINER helpers all pin search_path, and no
-- service-role key exists anywhere in the client. This migration closes the
-- gaps that remain, in severity order.
--
--   1. search_profiles() let anyone enumerate the entire user directory.
--   2. The avatars SELECT policy let anyone LIST the bucket, harvesting the
--      user id of every account.
--   3. Text other people can see had no length limits — a "reaction" could be
--      a megabyte of text, and one account's sync blob could be gigabytes.
--   4. Nothing stopped a script sending thousands of friend requests.
--   5. Definer RPCs were callable by anon.
--   6. Users could not delete their own synced data.
--
-- Everything here is idempotent and safe to run on a live database. The CHECK
-- constraints are added NOT VALID on purpose: they apply to every new write
-- immediately, without failing the migration on rows that already exist.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Stop directory enumeration.
--
-- The old body matched `display_name ilike q || '%'` with no minimum length and
-- no escaping. Three separate ways in:
--   . q = 'a'  -> ten users whose name starts with A; walk the alphabet, then
--                 two-letter prefixes, and you have every account.
--   . q = '%'  -> LIKE metacharacter, unescaped: matches everyone.
--   . q = ''   -> same, via the empty prefix.
-- Every row carries user_id, display name and avatar, and the function is
-- SECURITY DEFINER, so RLS never sees the query.
--
-- Share codes are the intended way to find a stranger: exact-match and
-- unguessable. Name search stays, but only as a way to find someone you can
-- already mostly name — three characters minimum, wildcards escaped.
-- ---------------------------------------------------------------------------
create or replace function public.search_profiles(q text)
returns table (user_id uuid, display_name text, avatar_url text)
language sql stable security definer set search_path = public as $fn$
  with input as (
    select
      nullif(trim(q), '') as raw,
      -- Escape LIKE metacharacters so a query can never widen its own match.
      replace(replace(replace(trim(q), '\', '\\'), '%', '\%'), '_', '\_') as safe
  )
  select sp.user_id, sp.display_name, sp.avatar_url
  from shared_profiles sp, input i
  where i.raw is not null
    and sp.user_id <> auth.uid()
    and sp.display_name is not null
    and (
      -- Exact share code: the deliberate "add me" path.
      sp.share_code = upper(i.raw)
      -- Or a name prefix, but only once it identifies rather than enumerates.
      or (char_length(i.raw) >= 3 and sp.display_name ilike i.safe || '%' escape '\')
    )
  limit 10;
$fn$;

-- ---------------------------------------------------------------------------
-- 2. Avatars: owner-only SELECT.
--
-- 0007 granted `using (bucket_id = 'avatars')` to everyone so that upsert could
-- read before writing. That also let anyone call the storage list API and read
-- back every object path — and the first path segment is the owner's user id,
-- so it handed out the full account list.
--
-- Friends' avatars still load: the bucket is public, and a public bucket is
-- served straight from the CDN without consulting these policies. This SELECT
-- is only reached through the storage API, where the owner is the one caller
-- that needs it.
-- ---------------------------------------------------------------------------
drop policy if exists avatar_select on storage.objects;
create policy avatar_select on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- 3. Bound every piece of text another person can see, and the sync blob.
--
-- NOT VALID: enforced on all new and updated rows, existing rows left alone.
-- ---------------------------------------------------------------------------
do $c$ begin
  alter table public.workout_comments
    add constraint workout_comments_body_len
    check (char_length(body) between 1 and 500) not valid;
exception when duplicate_object then null; end $c$;

do $c$ begin
  alter table public.workout_reactions
    add constraint workout_reactions_emoji_len
    check (char_length(emoji) between 1 and 8) not valid;
exception when duplicate_object then null; end $c$;

do $c$ begin
  alter table public.physique_reactions
    add constraint physique_reactions_emoji_len
    check (char_length(emoji) between 1 and 8) not valid;
exception when duplicate_object then null; end $c$;

do $c$ begin
  alter table public.shared_profiles
    add constraint shared_profiles_name_len
    check (display_name is null or char_length(display_name) between 1 and 24) not valid;
exception when duplicate_object then null; end $c$;

do $c$ begin
  alter table public.shared_profiles
    add constraint shared_profiles_avatar_len
    check (avatar_url is null or char_length(avatar_url) <= 512) not valid;
exception when duplicate_object then null; end $c$;

-- Codes are six characters from an unambiguous alphabet (see genShareCode in
-- src/lib/social.ts); the range is loose so a future format change doesn't
-- lock existing users out of publishing their profile.
do $c$ begin
  alter table public.shared_profiles
    add constraint shared_profiles_code_fmt
    check (share_code ~ '^[A-Z0-9]{4,16}$') not valid;
exception when duplicate_object then null; end $c$;

-- The sync blob is opaque and owner-only, but "opaque" is not "unlimited" —
-- without a ceiling, one account can fill the database. 2 MB of JSON is far
-- more than a lifetime of training history.
do $c$ begin
  alter table public.profiles
    add constraint profiles_user_data_size
    check (user_data is null or octet_length(user_data::text) <= 2097152) not valid;
exception when duplicate_object then null; end $c$;

-- ---------------------------------------------------------------------------
-- 4. Rate limits.
--
-- RLS answers "may this person write this row?" but never "how many?". These
-- triggers put a ceiling on the two things a script can flood: friend requests
-- aimed at strangers, and comments aimed at one person.
--
-- Deliberately generous — they exist to stop automation, not to get in the way
-- of somebody genuinely chatty.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_request_rate()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare recent int;
begin
  select count(*) into recent
  from friend_requests
  where from_id = new.from_id and created_at > now() - interval '1 hour';
  if recent >= 20 then
    raise exception 'Too many friend requests in the last hour. Try again later.'
      using errcode = 'check_violation';
  end if;
  return new;
end $fn$;

drop trigger if exists friend_requests_rate on public.friend_requests;
create trigger friend_requests_rate
  before insert on public.friend_requests
  for each row execute function public.enforce_request_rate();

create or replace function public.enforce_comment_rate()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare recent int;
begin
  select count(*) into recent
  from physique_comments
  where author_id = new.author_id and created_at > now() - interval '1 hour';
  if recent >= 60 then
    raise exception 'Too many comments in the last hour. Try again later.'
      using errcode = 'check_violation';
  end if;
  return new;
end $fn$;

drop trigger if exists physique_comments_rate on public.physique_comments;
create trigger physique_comments_rate
  before insert on public.physique_comments
  for each row execute function public.enforce_comment_rate();

-- ---------------------------------------------------------------------------
-- 5. Signed-out callers have no business calling these.
--
-- Each one filters on auth.uid(), so an anonymous call already returns nothing
-- — but an RPC that cannot be reached beats one that can be reached and
-- happens to be empty.
--
-- is_friend / can_view_physique / can_read_physique_object are deliberately NOT
-- revoked. They are called from inside RLS policy expressions, which are
-- evaluated with the querying user's function privileges — revoke EXECUTE and
-- every friend-visible SELECT starts failing with "permission denied for
-- function". Being able to ask "is this uuid my friend?" one uuid at a time is
-- a far smaller problem than breaking the entire friend graph.
-- ---------------------------------------------------------------------------
revoke execute on function public.search_profiles(text) from anon, public;
revoke execute on function public.accept_friend_request(uuid) from anon, public;
revoke execute on function public.pending_request_profiles() from anon, public;
revoke execute on function public.physique_notifications(timestamptz) from anon, public;

grant execute on function public.search_profiles(text) to authenticated;
grant execute on function public.accept_friend_request(uuid) to authenticated;
grant execute on function public.pending_request_profiles() to authenticated;
grant execute on function public.physique_notifications(timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Let people delete their own data.
--
-- profiles had select/insert/update but no delete, so "erase my account data"
-- was impossible to honour. Deleting the row cascades to shared_profiles,
-- workouts, friendships, posts, reactions and comments.
-- ---------------------------------------------------------------------------
drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own on public.profiles for delete
  using (auth.uid() = id);
