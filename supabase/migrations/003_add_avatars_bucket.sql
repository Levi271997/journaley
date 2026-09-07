-- Profile pictures.
--
-- Run once in the Supabase SQL Editor if your project predates them. New
-- projects get this from supabase/schema.sql already.
--
-- The bucket is public, so a browser can render an avatar with a plain <img>
-- and the CDN can cache it. What keeps one from being found is the file name:
-- the app stores each upload under a random UUID, so knowing an account tells
-- you nothing about where its picture lives. The URL itself is kept in the
-- account's user metadata, which only that account can read.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Writes are confined to a folder named after the caller's own user id, which
-- is what stops one account from overwriting another's picture.
drop policy if exists "avatars are readable" on storage.objects;
create policy "avatars are readable"
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');

drop policy if exists "a user uploads only into their own avatar folder" on storage.objects;
create policy "a user uploads only into their own avatar folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "a user replaces only their own avatar" on storage.objects;
create policy "a user replaces only their own avatar"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "a user deletes only their own avatar" on storage.objects;
create policy "a user deletes only their own avatar"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
