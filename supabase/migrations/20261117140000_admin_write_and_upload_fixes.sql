-- Fix admin writes and uploads: brand scoped policies, staff friendly RPCs,
-- and PDF support for Lake Fresh recipe files.

begin;

-- Recipe PDFs are uploaded into the existing public bucket under lf/recipes.
update storage.buckets
set allowed_mime_types = array[
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'
]
where id = 'product-images';

-- The legacy policy allowed any signed in user to write to the shared bucket.
-- Brand aware policies below are the intended access path.
drop policy if exists "Admin Upload" on storage.objects;

-- Allow brand admins, not only global admins, to manage brand scoped records.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select p.tablename, p.policyname
    from pg_policies p
    where p.schemaname = 'public'
      and p.cmd = 'ALL'
      and p.tablename <> 'lf_saved_lists'
      and exists (
        select 1
        from information_schema.columns c
        where c.table_schema = 'public'
          and c.table_name = p.tablename
          and c.column_name = 'brand_id'
      )
      and (p.qual ilike '%has_role%' or p.with_check ilike '%has_role%')
  loop
    execute format('drop policy if exists %I on public.%I', policy_record.policyname, policy_record.tablename);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.has_brand_access(brand_id)) with check (public.has_brand_access(brand_id))',
      policy_record.policyname,
      policy_record.tablename
    );
  end loop;
end $$;

-- Mark paid should accept the brand admin who owns the order.
create or replace function public.mark_order_paid(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_brand_id uuid;
begin
  select brand_id into v_brand_id
  from public.orders
  where id = p_order_id;

  if v_brand_id is null then
    raise exception 'Order not found';
  end if;

  if not (public.has_brand_access(v_brand_id) or auth.role() = 'service_role') then
    raise exception 'Not authorised to mark orders paid';
  end if;

  return public.process_order_paid(p_order_id, null, null, 'manual');
end;
$$;

revoke all on function public.mark_order_paid(uuid) from public;
grant execute on function public.mark_order_paid(uuid) to authenticated;

-- Slot generation is Lake Fresh only, so check access to that brand.
create or replace function public.lf_generate_delivery_slots(
  p_days integer default 14,
  p_capacity_orders integer default 20,
  p_capacity_weight_kg numeric default 50
)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_brand_id uuid := '22222222-2222-2222-2222-222222222222';
  v_cutoff time := time '14:00';
  v_count integer := 0;
begin
  if not public.has_brand_access(v_brand_id) then
    raise exception 'Admin access required';
  end if;

  select coalesce((setting_value #>> '{}')::time, time '14:00')
  into v_cutoff
  from public.brand_settings
  where brand_id = v_brand_id and setting_key = 'delivery.cutoff';

  insert into public.delivery_slots (
    brand_id, zone_id, delivery_date, cutoff_at,
    capacity_orders, capacity_weight_kg
  )
  select
    v_brand_id,
    z.id,
    d.delivery_date,
    ((d.delivery_date - 1)::timestamp + v_cutoff) at time zone 'Africa/Blantyre',
    p_capacity_orders,
    p_capacity_weight_kg
  from public.delivery_zones z
  cross join lateral (
    select generate_series(
      (now() at time zone 'Africa/Blantyre')::date + 1,
      (now() at time zone 'Africa/Blantyre')::date + greatest(p_days, 1),
      interval '1 day'
    )::date as delivery_date
  ) d
  where z.brand_id = v_brand_id and z.is_active
  on conflict (brand_id, zone_id, delivery_date) do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.lf_generate_delivery_slots(integer, integer, numeric) from public;
grant execute on function public.lf_generate_delivery_slots(integer, integer, numeric) to authenticated;

commit;
