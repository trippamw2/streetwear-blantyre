-- Keep the shared public bucket brand-safe: Lake Fresh owns lf/ paths and
-- Streetwear owns the remaining paths (for example products/).

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
  );
