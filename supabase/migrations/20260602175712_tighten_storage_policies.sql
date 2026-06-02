-- Tighten storage RLS policies for model-svgs and user-shields buckets.

-- 1) model-svgs: restrict writes to service_role only.
drop policy if exists "model-svgs admin write" on storage.objects;
create policy "model-svgs service_role write"
  on storage.objects
  for insert
  to public
  with check (
    bucket_id = 'model-svgs'
    and auth.role() = 'service_role'
  );

drop policy if exists "model-svgs admin update" on storage.objects;
create policy "model-svgs service_role update"
  on storage.objects
  for update
  to public
  using (bucket_id = 'model-svgs' and auth.role() = 'service_role')
  with check (bucket_id = 'model-svgs' and auth.role() = 'service_role');

drop policy if exists "model-svgs admin delete" on storage.objects;
create policy "model-svgs service_role delete"
  on storage.objects
  for delete
  to public
  using (bucket_id = 'model-svgs' and auth.role() = 'service_role');

-- 2) user-shields: make private, owner-scoped SELECT, add UPDATE policy.
update storage.buckets set public = false where id = 'user-shields';

drop policy if exists "user-shields: public read" on storage.objects;
drop policy if exists "user-shields owner read" on storage.objects;
create policy "user-shields owner read"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'user-shields'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "user-shields owner update" on storage.objects;
create policy "user-shields owner update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'user-shields'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'user-shields'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
