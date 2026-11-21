-- Keep the shared product bucket brand safe and within the 5 MB file limit.
-- Lake Fresh admins own lf/ paths. Streetwear admins own every other path.

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array[
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'
    ]
where id = 'product-images';

-- Remove the old any-authenticated-user policies if they still exist.
drop policy if exists "Admin Upload" on storage.objects;
drop policy if exists "Admin Update" on storage.objects;
drop policy if exists "Admin Delete" on storage.objects;

drop policy if exists "Brand admins upload product images" on storage.objects;
create policy "Brand admins upload product images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and (
      (split_part(name, '/', 1) = 'lf' and public.has_brand_access('22222222-2222-2222-2222-222222222222'::uuid))
      or (split_part(name, '/', 1) <> 'lf' and public.has_brand_access('11111111-1111-1111-1111-111111111111'::uuid))
    )
  );

drop policy if exists "Brand admins update product images" on storage.objects;
create policy "Brand admins update product images" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'product-images'
    and (
      (split_part(name, '/', 1) = 'lf' and public.has_brand_access('22222222-2222-2222-2222-222222222222'::uuid))
      or (split_part(name, '/', 1) <> 'lf' and public.has_brand_access('11111111-1111-1111-1111-111111111111'::uuid))
    )
  )
  with check (
    bucket_id = 'product-images'
    and (
      (split_part(name, '/', 1) = 'lf' and public.has_brand_access('22222222-2222-2222-2222-222222222222'::uuid))
      or (split_part(name, '/', 1) <> 'lf' and public.has_brand_access('11111111-1111-1111-1111-111111111111'::uuid))
    )
  );

drop policy if exists "Brand admins delete product images" on storage.objects;
create policy "Brand admins delete product images" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'product-images'
    and (
      (split_part(name, '/', 1) = 'lf' and public.has_brand_access('22222222-2222-2222-2222-222222222222'::uuid))
      or (split_part(name, '/', 1) <> 'lf' and public.has_brand_access('11111111-1111-1111-1111-111111111111'::uuid))
    )
  );
