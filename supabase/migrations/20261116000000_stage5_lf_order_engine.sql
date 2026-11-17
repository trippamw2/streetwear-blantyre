-- Stage 5: Lake Fresh next-day ordering engine
-- Additive, brand-scoped changes. Existing SB rows are unaffected:
-- new order columns are nullable, new settings/product rows are Lake Fresh only.

-- ---------------------------------------------------------------------------
-- 1) Brand settings (configurable cut-off, fees and delivery window)
-- ---------------------------------------------------------------------------
create table if not exists public.brand_settings (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  setting_key text not null,
  setting_value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, setting_key)
);

alter table public.brand_settings enable row level security;

drop policy if exists brand_settings_admin_all on public.brand_settings;
create policy brand_settings_admin_all on public.brand_settings
  for all using (
    exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
  ) with check (
    exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
  );

insert into public.brand_settings (brand_id, setting_key, setting_value)
values
  ('22222222-2222-2222-2222-222222222222', 'delivery.cutoff', '"14:00"'::jsonb),
  ('22222222-2222-2222-2222-222222222222', 'delivery.delivery_days', '1'::jsonb),
  ('22222222-2222-2222-2222-222222222222', 'delivery.fee_mwk', '2000'::jsonb),
  ('22222222-2222-2222-2222-222222222222', 'delivery.free_threshold_mwk', '15000'::jsonb),
  ('22222222-2222-2222-2222-222222222222', 'delivery.max_advance_days', '7'::jsonb)
on conflict (brand_id, setting_key) do nothing;

-- ---------------------------------------------------------------------------
-- 2) Order-level delivery and payment fields (nullable, safe for SB)
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists delivery_zone_id uuid references public.delivery_zones(id) on delete set null,
  add column if not exists delivery_slot_id uuid references public.delivery_slots(id) on delete set null,
  add column if not exists delivery_date date,
  add column if not exists delivery_window text,
  add column if not exists payment_reference text;

create unique index if not exists orders_payment_reference_key
  on public.orders (payment_reference)
  where payment_reference is not null;

-- ---------------------------------------------------------------------------
-- 3) Seed the initial Lake Fresh catalogue (only where missing)
-- ---------------------------------------------------------------------------
insert into public.fish_products (
  brand_id, species_id, name, description, price_per_kg_mwk,
  min_order_qty_kg, preparation_options, availability_status, sort_order
)
select
  '22222222-2222-2222-2222-222222222222',
  s.id,
  'Lake Fresh ' || s.name,
  case s.slug
    when 'chambo' then 'Whole, cleaned or cut in pieces. Priced per kilogram.'
    when 'ncheni-micheni' then 'Fresh Ncheni / Micheni, cleaned or whole, priced per kilogram.'
    when 'usipa' then 'Fresh Usipa, sold whole by weight.'
    else 'Fresh fish from Lake Malawi, priced per kilogram.'
  end,
  case s.slug
    when 'chambo' then 4500
    when 'ncheni-micheni' then 3500
    when 'usipa' then 2500
    else 3500
  end,
  0.5,
  case s.slug
    when 'chambo' then '["whole","cleaned","portioned"]'::jsonb
    when 'usipa' then '["whole"]'::jsonb
    else '["whole","cleaned"]'::jsonb
  end,
  'available',
  s.sort_order
from public.fish_species s
where s.brand_id = '22222222-2222-2222-2222-222222222222'
  and s.is_active
  and not exists (
    select 1 from public.fish_products p
    where p.brand_id = '22222222-2222-2222-2222-222222222222'
      and p.species_id = s.id
  );

-- ---------------------------------------------------------------------------
-- 4) Public Lake Fresh catalogue: product data + aggregate availability.
--    Batch-level stock stays private; only the aggregate weight is exposed.
-- ---------------------------------------------------------------------------
create or replace function public.lf_public_catalog()
returns table (
  id uuid,
  species_id uuid,
  species_name text,
  species_slug text,
  name text,
  description text,
  price_per_kg_mwk integer,
  min_order_qty_kg numeric,
  preparation_options jsonb,
  availability_status text,
  image text,
  storage_info text,
  handling_info text,
  available_kg numeric,
  sort_order integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.species_id,
    s.name as species_name,
    s.slug as species_slug,
    p.name,
    p.description,
    p.price_per_kg_mwk,
    p.min_order_qty_kg,
    p.preparation_options,
    case
      when coalesce(b.available_kg, 0) > 0 then p.availability_status
      else 'sold_out'
    end as availability_status,
    p.image,
    s.storage_info,
    s.handling_info,
    coalesce(b.available_kg, 0) as available_kg,
    p.sort_order
  from public.fish_products p
  left join public.fish_species s
    on s.id = p.species_id and s.brand_id = p.brand_id
  left join (
    select species_id, sum(weight_kg_available) as available_kg
    from public.fish_inventory_batches
    where brand_id = '22222222-2222-2222-2222-222222222222'
      and weight_kg_available > 0
      and (expiry_date is null or expiry_date >= (now() at time zone 'Africa/Blantyre')::date)
    group by species_id
  ) b on b.species_id = p.species_id
  where p.brand_id = '22222222-2222-2222-2222-222222222222'
    and p.is_active
  order by p.sort_order, p.name;
$$;

revoke all on function public.lf_public_catalog() from public;
grant execute on function public.lf_public_catalog() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5) Public Lake Fresh settings (no secrets: cut-off and delivery policy only)
-- ---------------------------------------------------------------------------
create or replace function public.lf_public_config()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_object_agg(setting_key, setting_value), '{}'::jsonb)
  from public.brand_settings
  where brand_id = '22222222-2222-2222-2222-222222222222';
$$;

revoke all on function public.lf_public_config() from public;
grant execute on function public.lf_public_config() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6) Delivery slot generation (admin only), plus initial slot seed
-- ---------------------------------------------------------------------------
create or replace function public.lf_generate_delivery_slots(
  p_days integer default 14,
  p_capacity_orders integer default 20,
  p_capacity_weight_kg numeric default 50
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_brand_id uuid := '22222222-2222-2222-2222-222222222222';
  v_cutoff time := time '14:00';
  v_count integer := 0;
begin
  if not exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  ) then
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

-- Initial 14-day slot calendar for the launch zones.
insert into public.delivery_slots (
  brand_id, zone_id, delivery_date, cutoff_at,
  capacity_orders, capacity_weight_kg
)
select
  '22222222-2222-2222-2222-222222222222',
  z.id,
  d.delivery_date,
  ((d.delivery_date - 1)::timestamp + time '14:00') at time zone 'Africa/Blantyre',
  20,
  50
from public.delivery_zones z
cross join lateral (
  select generate_series(
    (now() at time zone 'Africa/Blantyre')::date + 1,
    (now() at time zone 'Africa/Blantyre')::date + 14,
    interval '1 day'
  )::date as delivery_date
) d
where z.brand_id = '22222222-2222-2222-2222-222222222222'
  and z.is_active
on conflict (brand_id, zone_id, delivery_date) do nothing;

-- ---------------------------------------------------------------------------
-- 7) Transactional Lake Fresh order placement
--    - client sends product IDs, weights and preparation only
--    - prices, fees, brand, stock and slot capacity are resolved server-side
-- ---------------------------------------------------------------------------
drop function if exists public.lf_place_order(text, text, uuid, uuid, jsonb, text);

create or replace function public.lf_place_order(
  p_customer_name text,
  p_customer_phone text,
  p_zone_id uuid,
  p_slot_id uuid,
  p_items jsonb,
  p_notes text default null,
  p_marketing_consent boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_brand_id uuid := '22222222-2222-2222-2222-222222222222';
  v_user_id uuid := auth.uid();
  v_zone public.delivery_zones%rowtype;
  v_slot public.delivery_slots%rowtype;
  v_product public.fish_products%rowtype;
  v_order_id uuid;
  v_payment_ref text;
  v_item jsonb;
  v_prep text;
  v_weight numeric;
  v_eff_weight numeric;
  v_line_total integer;
  v_subtotal integer := 0;
  v_total_weight numeric := 0;
  v_delivery_fee integer := 0;
  v_fee_setting integer := 2000;
  v_free_threshold integer := 15000;
  v_order_item_id uuid;
  v_batch record;
  v_remaining numeric;
  v_take numeric;
begin
  if v_user_id is null then
    raise exception 'Sign in required to place an order';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order is empty';
  end if;

  if coalesce(trim(p_customer_name), '') = '' or coalesce(trim(p_customer_phone), '') = '' then
    raise exception 'Name and phone number are required';
  end if;

  select * into v_zone
  from public.delivery_zones
  where id = p_zone_id and brand_id = v_brand_id and is_active;

  if not found then
    raise exception 'Delivery zone is not available';
  end if;

  select * into v_slot
  from public.delivery_slots
  where id = p_slot_id
    and brand_id = v_brand_id
    and zone_id = p_zone_id
    and is_open;

  if not found then
    raise exception 'Delivery slot is not available';
  end if;

  if v_slot.cutoff_at <= now() then
    raise exception 'The cut-off for this delivery date has passed';
  end if;

  if v_slot.booked_orders >= v_slot.capacity_orders then
    raise exception 'This delivery slot is full';
  end if;

  select coalesce((setting_value #>> '{}')::integer, 2000)
  into v_fee_setting
  from public.brand_settings
  where brand_id = v_brand_id and setting_key = 'delivery.fee_mwk';

  select coalesce((setting_value #>> '{}')::integer, 15000)
  into v_free_threshold
  from public.brand_settings
  where brand_id = v_brand_id and setting_key = 'delivery.free_threshold_mwk';

  -- Price the order server-side.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product
    from public.fish_products
    where id = (v_item ->> 'product_id')::uuid
      and brand_id = v_brand_id
      and is_active;

    if not found then
      raise exception 'A fish product in your order is no longer available';
    end if;

    if v_product.availability_status <> 'available' then
      raise exception '% is not available', v_product.name;
    end if;

    v_prep := coalesce(v_item ->> 'preparation', 'whole');
    if not (v_product.preparation_options ? v_prep) then
      raise exception 'Preparation "%" is not offered for %', v_prep, v_product.name;
    end if;

    v_weight := coalesce((v_item ->> 'weight_kg')::numeric, 0);
    if v_weight <= 0 then
      raise exception 'Enter a weight for %', v_product.name;
    end if;

    v_eff_weight := greatest(v_weight, v_product.min_order_qty_kg);
    v_line_total := round(v_product.price_per_kg_mwk * v_eff_weight)::integer;

    v_subtotal := v_subtotal + v_line_total;
    v_total_weight := v_total_weight + v_eff_weight;
  end loop;

  if v_subtotal <= 0 then
    raise exception 'Order total must be greater than zero';
  end if;

  if v_zone.min_order_mwk > 0 and v_subtotal < v_zone.min_order_mwk then
    raise exception 'The minimum order for % is % MWK', v_zone.name, v_zone.min_order_mwk;
  end if;

  if v_slot.booked_weight_kg + v_total_weight > v_slot.capacity_weight_kg then
    raise exception 'This delivery slot cannot carry that weight, please choose another date';
  end if;

  v_delivery_fee := case
    when v_subtotal >= v_free_threshold then 0
    when v_zone.base_fee_mwk > 0 then v_zone.base_fee_mwk
    else v_fee_setting
  end;

  insert into public.orders (
    user_id, customer_name, customer_phone, customer_location, notes,
    subtotal_mwk, delivery_fee_mwk, total_mwk, payment_method, status,
    brand_id, delivery_zone_id, delivery_slot_id, delivery_date
  ) values (
    v_user_id, trim(p_customer_name), trim(p_customer_phone), v_zone.name, p_notes,
    v_subtotal, v_delivery_fee, v_subtotal + v_delivery_fee, 'paychangu', 'new',
    v_brand_id, v_zone.id, v_slot.id, v_slot.delivery_date
  )
  returning id into v_order_id;

  -- Persist items, preparation requirements and FIFO stock reservations.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product
    from public.fish_products
    where id = (v_item ->> 'product_id')::uuid and brand_id = v_brand_id;

    v_prep := coalesce(v_item ->> 'preparation', 'whole');
    v_weight := coalesce((v_item ->> 'weight_kg')::numeric, 0);
    v_eff_weight := greatest(v_weight, v_product.min_order_qty_kg);
    v_line_total := round(v_product.price_per_kg_mwk * v_eff_weight)::integer;

    insert into public.order_items (
      order_id, product_key, product_name, unit_price_mwk, quantity, brand_id
    ) values (
      v_order_id, v_product.id::text, v_product.name, v_line_total, 1, v_brand_id
    )
    returning id into v_order_item_id;

    insert into public.order_preparation (
      brand_id, order_item_id, preparation_type, requested_weight_kg,
      price_per_kg_mwk
    ) values (
      v_brand_id, v_order_item_id, v_prep, v_eff_weight,
      v_product.price_per_kg_mwk
    );

    v_remaining := v_eff_weight;
    for v_batch in
      select id, weight_kg_available
      from public.fish_inventory_batches
      where brand_id = v_brand_id
        and species_id = v_product.species_id
        and weight_kg_available > 0
        and (expiry_date is null or expiry_date >= (now() at time zone 'Africa/Blantyre')::date)
      order by received_date, created_at
      for update
    loop
      exit when v_remaining <= 0;
      v_take := least(v_remaining, v_batch.weight_kg_available);
      perform public.reserve_fish_stock(v_batch.id, v_order_id, v_take);
      v_remaining := v_remaining - v_take;
    end loop;

    if v_remaining > 0 then
      raise exception 'Only % kg of % is available right now', (v_eff_weight - v_remaining), v_product.name;
    end if;
  end loop;

  update public.delivery_slots
  set booked_orders = booked_orders + 1,
      booked_weight_kg = booked_weight_kg + v_total_weight
  where id = v_slot.id
    and is_open
    and booked_orders < capacity_orders
    and booked_weight_kg + v_total_weight <= capacity_weight_kg;

  if not found then
    raise exception 'Delivery capacity changed while placing the order, please pick another slot';
  end if;

  v_payment_ref := 'LF-' || upper(substr(replace(v_order_id::text, '-', ''), 1, 12));

  update public.orders
  set payment_reference = v_payment_ref
  where id = v_order_id;

  insert into public.customer_profiles (
    brand_id, user_id, full_name, phone, location, marketing_consent
  ) values (
    v_brand_id, v_user_id, trim(p_customer_name), trim(p_customer_phone), v_zone.name, p_marketing_consent
  )
  on conflict (brand_id, user_id) do update
  set full_name = excluded.full_name,
      phone = excluded.phone,
      location = excluded.location,
      marketing_consent = public.customer_profiles.marketing_consent or excluded.marketing_consent,
      updated_at = now();

  insert into public.price_reconciliation (
    brand_id, order_id, estimated_total_mwk, status
  ) values (
    v_brand_id, v_order_id, v_subtotal, 'pending'
  );

  return v_order_id;
end;
$$;

revoke all on function public.lf_place_order(text, text, uuid, uuid, jsonb, text, boolean) from public;
grant execute on function public.lf_place_order(text, text, uuid, uuid, jsonb, text, boolean) to authenticated;
