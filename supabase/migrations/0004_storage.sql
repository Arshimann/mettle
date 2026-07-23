-- ============================================================================
-- Mettle — avatar storage. Run AFTER 0003_social.sql.
--
-- Public read bucket; each user may write only inside their own folder
-- (avatars/<uid>/...). The client uploads a 256×256 webp/jpeg, ~25 KB;
-- the 512 KB server cap is just a backstop.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 524288, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

drop policy if exists avatar_insert on storage.objects;
create policy avatar_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatar_update on storage.objects;
create policy avatar_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatar_delete on storage.objects;
create policy avatar_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
