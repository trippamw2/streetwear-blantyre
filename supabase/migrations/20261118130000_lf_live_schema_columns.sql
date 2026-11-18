-- Capture live Lake Fresh columns that were added outside checked-in migrations.
-- The order function, route map, driver screen and pilot filtering all rely on them.

alter table public.fish_products
  add column if not exists pilot_option text;

alter table public.orders
  add column if not exists customer_email text,
  add column if not exists house_number text,
  add column if not exists street_name text,
  add column if not exists delivery_lat double precision,
  add column if not exists delivery_lng double precision,
  add column if not exists delivery_place text,
  add column if not exists delivery_proof_url text,
  add column if not exists delivery_window text;

-- The three pilot zones were activated in the live database before their
-- insert statements were checked in.
insert into public.delivery_zones (
  brand_id, name, slug, description, is_active, base_fee_mwk, min_order_mwk, sort_order
)
values
  ('22222222-2222-2222-2222-222222222222', 'Nkolokosa', 'nkolokosa', 'Nkolokosa delivery area', true, 2000, 0, 1),
  ('22222222-2222-2222-2222-222222222222', 'Soche East', 'soche-east', 'Soche East delivery area', true, 2000, 0, 2),
  ('22222222-2222-2222-2222-222222222222', 'Chitawira', 'chitawira', 'Chitawira delivery area', true, 2000, 0, 3)
on conflict (brand_id, slug) do update
set name = excluded.name,
    description = excluded.description,
    is_active = true,
    base_fee_mwk = excluded.base_fee_mwk,
    min_order_mwk = excluded.min_order_mwk,
    sort_order = excluded.sort_order,
    updated_at = now();
