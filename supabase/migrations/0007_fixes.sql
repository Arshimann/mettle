-- ============================================================================
-- Mettle — fixes found in first real use. Run AFTER 0006_notifications.sql.
--
-- Three things, all of which caused visible failures in production:
--   1. Avatar upload died with "new row violates row-level security policy",
--      because 0004 gave the avatars bucket insert/update/delete policies but
--      no SELECT — and upsert has to read the existing object first.
--   2. Physique upload died with "mime type image/png is not supported":
--      Safari's canvas silently encodes PNG when asked for WebP, so a PNG
--      arrived at a bucket that only allowed webp/jpeg. The client now detects
--      that properly; this widens the allowlist as a safety net.
--   3. Friend requests showed "Lifter" instead of a name, because a pending
--      requester is not yet a friend and so their shared_profiles row is
--      unreadable under sp_select.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Avatars need a read policy. The bucket is already public:true and avatars
--    are served by public URL, so public read is the intended posture — this
--    just makes the storage API agree with it.
-- ---------------------------------------------------------------------------
drop policy if exists avatar_select on storage.objects;
create policy avatar_select on storage.objects for select
  using (bucket_id = 'avatars');

-- ---------------------------------------------------------------------------
-- 2. Accept PNG on the physique bucket too. The client re-encodes and prefers
--    webp/jpeg; this only stops a Safari fallback from being rejected outright.
--    (The bucket stays private — this changes the format allowlist, nothing else.)
-- ---------------------------------------------------------------------------
update storage.buckets
   set allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png']
 where id = 'physique';

-- ---------------------------------------------------------------------------
-- 3. Let each side of a PENDING friend request see the other's name and photo.
--
--    Security definer for the same anti-recursion reason as is_friend(). It
--    deliberately returns only display_name and avatar_url, and only for people
--    already in a request relationship with the caller — it is not a directory.
-- ---------------------------------------------------------------------------
create or replace function public.pending_request_profiles()
returns table (user_id uuid, display_name text, avatar_url text)
language sql stable security definer set search_path = public as $$
  select sp.user_id, sp.display_name, sp.avatar_url
  from shared_profiles sp
  where sp.user_id in (
    select case when fr.from_id = auth.uid() then fr.to_id else fr.from_id end
    from friend_requests fr
    where fr.from_id = auth.uid() or fr.to_id = auth.uid()
  );
$$;
