-- ============================================================================
-- Mettle — schema for the LATER accounts/social phase.
-- NOT applied or used in v1 (the app is local-first and writes nothing to the
-- cloud yet). This is committed so the future phase drops in cleanly: create a
-- Supabase project, run this migration, then wire up auth + sync.
-- ============================================================================

-- Profiles: one row per authenticated user.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text unique,
  avatar text default '💪',
  share_code text unique,
  -- Opaque blob of the user's app data for cross-device sync.
  user_data jsonb,
  privacy jsonb default '{"shareWorkouts":true,"shareSplit":true,"shareGoals":true,"shareBodyWeight":true}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Friendships (directional rows; create both directions on accept).
create table if not exists public.friendships (
  user_id uuid references public.profiles (id) on delete cascade,
  friend_id uuid references public.profiles (id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, friend_id)
);

-- Reactions on a friend's workout.
create table if not exists public.workout_reactions (
  profile_id uuid references public.profiles (id) on delete cascade,
  workout_key text not null,
  reactor_id uuid references public.profiles (id) on delete cascade,
  emoji text not null,
  created_at timestamptz default now(),
  primary key (profile_id, workout_key, reactor_id)
);

-- Comments on a friend's workout.
create table if not exists public.workout_comments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete cascade,
  workout_key text not null,
  author_id uuid references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

-- Row Level Security (enable; policies authored when the phase is built).
alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.workout_reactions enable row level security;
alter table public.workout_comments enable row level security;
