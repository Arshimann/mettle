-- ============================================================================
-- Mettle — social phase: friends, shared profiles, published workouts,
-- reactions & comments.  Run AFTER 0001_init.sql and 0002_sync.sql.
--
-- Model
--  · profiles.user_data stays the owner-only sync blob (policies from 0002
--    untouched). Nothing a friend can ever read lives there.
--  · shared_profiles is a denormalized public snapshot the CLIENT publishes;
--    privacy is enforced at publish time (unshared fields are null/empty), so
--    row-level policies never need per-field logic.
--  · workouts holds one row per finished workout. client_id is the local
--    HistoryEntry.id — it doubles as the workout_key used by the
--    workout_reactions / workout_comments tables from 0001.
--  · The legacy profiles.display_name / avatar / share_code / privacy columns
--    are superseded by shared_profiles and left in place, unused.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Friendship check used inside policies. SECURITY DEFINER so it can read
-- friendships regardless of RLS — this is what prevents policy recursion
-- (no policy below references a table whose policy references back).
-- ---------------------------------------------------------------------------
create or replace function public.is_friend(other uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.friendships
    where user_id = auth.uid() and friend_id = other
  );
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.shared_profiles (
  user_id          uuid primary key references public.profiles (id) on delete cascade,
  display_name     text unique,
  avatar_url       text,
  share_code       text unique not null,
  streak           int  not null default 0,
  -- ISO dates trained in the last 84 days (12-week consistency grid).
  trained_dates    jsonb not null default '[]',
  -- [{exercise, weight, reps, date}] — published only when workouts are shared.
  prs              jsonb not null default '[]',
  -- [{name, group}] — the user's custom movement library.
  custom_exercises jsonb not null default '[]',
  -- [{name, exercises:[{name,targetSets,targetReps}]}] or null when private.
  split            jsonb,
  privacy          jsonb not null default
    '{"shareWorkouts":true,"shareSplit":true,"shareGoals":true,"shareBodyWeight":true}'::jsonb,
  updated_at       timestamptz not null default now()
);

create table if not exists public.workouts (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  client_id    text not null,             -- HistoryEntry.id → the workout_key
  date         date not null,
  day_name     text,
  exercises    jsonb not null,            -- ExerciseEntry[] verbatim (canonical kg)
  duration_sec int,
  pr_names     text[] not null default '{}',
  created_at   timestamptz not null default now(),
  primary key (user_id, client_id)
);
create index if not exists workouts_user_date on public.workouts (user_id, date desc);

create table if not exists public.friend_requests (
  id         uuid primary key default gen_random_uuid(),
  from_id    uuid not null references public.profiles (id) on delete cascade,
  to_id      uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (from_id, to_id),
  check (from_id <> to_id)
);

alter table public.shared_profiles enable row level security;
alter table public.workouts        enable row level security;
alter table public.friend_requests enable row level security;

-- Keep updated_at honest (touch_updated_at() ships in 0002).
drop trigger if exists shared_profiles_touch_updated_at on public.shared_profiles;
create trigger shared_profiles_touch_updated_at
  before update on public.shared_profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Policies: shared_profiles — read own or friends'; write own.
-- ---------------------------------------------------------------------------
drop policy if exists sp_select on public.shared_profiles;
create policy sp_select on public.shared_profiles for select
  using (user_id = auth.uid() or public.is_friend(user_id));

drop policy if exists sp_insert on public.shared_profiles;
create policy sp_insert on public.shared_profiles for insert
  with check (user_id = auth.uid());

drop policy if exists sp_update on public.shared_profiles;
create policy sp_update on public.shared_profiles for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists sp_delete on public.shared_profiles;
create policy sp_delete on public.shared_profiles for delete
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Policies: workouts — read own or friends'; full write own.
-- ---------------------------------------------------------------------------
drop policy if exists w_select on public.workouts;
create policy w_select on public.workouts for select
  using (user_id = auth.uid() or public.is_friend(user_id));

drop policy if exists w_insert on public.workouts;
create policy w_insert on public.workouts for insert
  with check (user_id = auth.uid());

drop policy if exists w_update on public.workouts;
create policy w_update on public.workouts for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists w_delete on public.workouts;
create policy w_delete on public.workouts for delete
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Policies: friend_requests — both parties see; sender creates; either side
-- deletes (decline or cancel). Accept happens only through the RPC below.
-- ---------------------------------------------------------------------------
drop policy if exists fr_select on public.friend_requests;
create policy fr_select on public.friend_requests for select
  using (from_id = auth.uid() or to_id = auth.uid());

drop policy if exists fr_insert on public.friend_requests;
create policy fr_insert on public.friend_requests for insert
  with check (from_id = auth.uid() and not public.is_friend(to_id));

drop policy if exists fr_delete on public.friend_requests;
create policy fr_delete on public.friend_requests for delete
  using (from_id = auth.uid() or to_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Policies: friendships (table from 0001, previously locked).
-- Rows are only created by accept_friend_request(); either side may sever.
-- ---------------------------------------------------------------------------
drop policy if exists f_select on public.friendships;
create policy f_select on public.friendships for select
  using (user_id = auth.uid());

drop policy if exists f_delete on public.friendships;
create policy f_delete on public.friendships for delete
  using (user_id = auth.uid() or friend_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Policies: reactions & comments (tables from 0001).
-- Visible to the workout owner and the owner's friends. You write your own;
-- the owner may also remove comments on their workouts (moderation).
-- ---------------------------------------------------------------------------
drop policy if exists wr_select on public.workout_reactions;
create policy wr_select on public.workout_reactions for select
  using (profile_id = auth.uid() or public.is_friend(profile_id));

drop policy if exists wr_insert on public.workout_reactions;
create policy wr_insert on public.workout_reactions for insert
  with check (
    reactor_id = auth.uid()
    and (profile_id = auth.uid() or public.is_friend(profile_id))
  );

drop policy if exists wr_delete on public.workout_reactions;
create policy wr_delete on public.workout_reactions for delete
  using (reactor_id = auth.uid());

drop policy if exists wc_select on public.workout_comments;
create policy wc_select on public.workout_comments for select
  using (profile_id = auth.uid() or public.is_friend(profile_id));

drop policy if exists wc_insert on public.workout_comments;
create policy wc_insert on public.workout_comments for insert
  with check (
    author_id = auth.uid()
    and (profile_id = auth.uid() or public.is_friend(profile_id))
  );

drop policy if exists wc_delete on public.workout_comments;
create policy wc_delete on public.workout_comments for delete
  using (author_id = auth.uid() or profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RPC: accept a request as the recipient — atomically create both friendship
-- directions and clear any pending requests either way.
-- ---------------------------------------------------------------------------
create or replace function public.accept_friend_request(req uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  select * into r from friend_requests where id = req and to_id = auth.uid();
  if r is null then
    raise exception 'request not found';
  end if;
  insert into friendships (user_id, friend_id) values (r.from_id, r.to_id)
    on conflict do nothing;
  insert into friendships (user_id, friend_id) values (r.to_id, r.from_id)
    on conflict do nothing;
  delete from friend_requests
    where (from_id = r.from_id and to_id = r.to_id)
       or (from_id = r.to_id and to_id = r.from_id);
end $$;

-- ---------------------------------------------------------------------------
-- RPC: find people without opening shared_profiles to non-friends —
-- exact share code (case-insensitive) or display-name prefix, capped at 10.
-- ---------------------------------------------------------------------------
create or replace function public.search_profiles(q text)
returns table (user_id uuid, display_name text, avatar_url text)
language sql stable security definer set search_path = public as $$
  select user_id, display_name, avatar_url
  from shared_profiles
  where user_id <> auth.uid()
    and display_name is not null
    and (share_code = upper(trim(q)) or display_name ilike trim(q) || '%')
  limit 10;
$$;
