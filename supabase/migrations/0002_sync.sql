-- ============================================================================
-- Mettle — Phase 5: cloud sync policies.
-- Run AFTER 0001_init.sql. This turns on the access a signed-in user needs to
-- back up and restore their own data via profiles.user_data, and nothing more.
--
-- Sync model: the whole app state is stored as one opaque JSON blob in
-- profiles.user_data, last-write-wins. No social access is granted here — the
-- friendships/reactions/comments tables stay locked (deferred phase).
-- ============================================================================

-- A user may read only their own profile row.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- A user may create only their own profile row (id must equal their uid).
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- A user may update only their own profile row.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Keep updated_at honest on every write (used for last-write-wins).
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();
