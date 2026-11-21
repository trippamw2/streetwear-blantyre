-- Lake Fresh hardening: brand isolation, safe RPCs and data checks
-- Apply one file at a time:
--   supabase.cmd db query --linked --file supabase/migrations/20261120000000_lf_hardening.sql
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Remove legacy anon policies that predate brand isolation
-- ---------------------------------------------------------------------------
do $$
declare
  v_table text;
  v_policy text;
begin
  for v_table, v_policy in
    select * from (values
      ('orders', 'Anon read orders'),
      ('orders', 'Anon create orders'),
      ('orders', 'Anon update orders'),
      ('orders', 'Anon orders'),
      ('orders', 'Anon orders all'),
      ('orders', 'public_read_orders'),
      ('order_items', 'Anon full access order_items'),
      ('order_items', 'Anon order_items'),
      ('order_items', 'Anon order_items all'),
      ('profiles', 'Anon read profiles'),
      ('profiles', 'Anon update profiles'),
      ('profiles', 'Anon profiles'),
      ('profiles', 'Anon profiles all')
    ) as x(t, p)
  loop
    execute format('drop policy if exists %I on public.%I', v_policy, v_table);
  end loop;
end $$;

-- Guest checkout must not allow anon reads or edits. SB guest insert is kept
-- but locked to the SB brand and a new order state.
revoke select, update, delete on table public.orders from anon;
revoke select, update, delete on table public.order_items from anon;
revoke all on table public.profiles from anon;

grant insert on table public.orders to anon;
grant insert on table public.order_items to anon;

drop policy if exists guest_checkout_orders_sb on public.orders;
create policy guest_checkout_orders_sb on public.orders
  for insert to anon
  with check (
    brand_id = '11111111-1111-1111-1111-111111111111'::uuid
    and status = 'new'
    and coalesce(total_mwk, 0) >= 0
  );

drop policy if exists guest_checkout_order_items_sb on public.order_items;
create policy guest_checkout_order_items_sb on public.order_items
  for insert to anon
  with check (
    brand_id = '11111111-1111-1111-1111-111111111111'::uuid
    and coalesce(quantity, 0) > 0
    and coalesce(unit_price_mwk, 0) >= 0
  );

-- ---------------------------------------------------------------------------
-- 2. Brand guards on all public LF read policies
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'fish_species','fish_products','delivery_zones',
    'lf_spices','lf_recipes','lf_wholesale_prices'
  ]) loop
    execute format('drop policy if exists %I on public.%I', t || '_public_read', t);
    execute format(
      'create policy %I on public.%I for select using (brand_id = ''22222222-2222-2222-2222-222222222222''::uuid and is_active = true)',
      t || '_public_read', t
    );
  end loop;
end $$;

-- delivery_slots uses is_open, not is_active
drop policy if exists delivery_slots_public_read on public.delivery_slots;
create policy delivery_slots_public_read on public.delivery_slots
  for select using (
    brand_id = '22222222-2222-2222-2222-222222222222'::uuid and is_open = true
  );

-- recipe products have no brand_id of their own, so guard through the recipe
drop policy if exists lf_recipe_products_public_read on public.lf_recipe_products;
create policy lf_recipe_products_public_read on public.lf_recipe_products
  for select using (
    exists (
      select 1 from public.lf_recipes r
      where r.id = recipe_id
        and r.brand_id = '22222222-2222-2222-2222-222222222222'::uuid
        and r.is_active = true
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Safe insert policies for subscriptions and quotes
-- ---------------------------------------------------------------------------
drop policy if exists lf_subscriptions_insert on public.lf_subscriptions;
create policy lf_subscriptions_insert on public.lf_subscriptions
  for insert to anon, authenticated
  with check (
    brand_id = '22222222-2222-2222-2222-222222222222'::uuid
    and plan in ('weekly','biweekly','monthly')
    and quantity_kg > 0
    and quantity_kg <= 1000
  );

drop policy if exists lf_quotes_insert on public.lf_quotes;
create policy lf_quotes_insert on public.lf_quotes
  for insert to anon, authenticated
  with check (
    brand_id = '22222222-2222-2222-2222-222222222222'::uuid
    and coalesce(total_mwk, 0) >= 0
  );

drop policy if exists lf_quote_items_insert on public.lf_quote_items;
create policy lf_quote_items_insert on public.lf_quote_items
  for insert to anon, authenticated
  with check (
    exists (
      select 1 from public.lf_quotes q
      where q.id = quote_id
        and q.brand_id = '22222222-2222-2222-2222-222222222222'::uuid
    )
    and coalesce(quantity, 0) > 0
    and coalesce(estimated_unit_price_mwk, 0) >= 0
  );

-- ---------------------------------------------------------------------------
-- 4. Close anon grants on state changing RPCs
-- ---------------------------------------------------------------------------
revoke all on function public.lf_place_order(
  text, text, uuid, uuid, jsonb, text, boolean, integer, text,
  text, text, double precision, double precision, text, text
) from anon;

revoke all on function public.lf_public_subscription_status(uuid, text) from anon;

-- Tracking stays public for guests. It is tightened in the next migration.

-- ---------------------------------------------------------------------------
-- 5. Database checks for prices, weights, stock and slot capacity
-- ---------------------------------------------------------------------------
do $$
begin
  alter table public.fish_products
    drop constraint if exists fish_products_price_positive;
  alter table public.fish_products
    add constraint fish_products_price_positive check (price_per_kg_mwk > 0);

  alter table public.fish_products
    drop constraint if exists fish_products_min_weight_positive;
  alter table public.fish_products
    add constraint fish_products_min_weight_positive check (min_order_qty_kg > 0);

  alter table public.fish_inventory_batches
    drop constraint if exists fish_batches_weights_non_negative;
  alter table public.fish_inventory_batches
    add constraint fish_batches_weights_non_negative check (
      weight_kg_received >= 0
      and weight_kg_available >= 0
      and weight_kg_reserved >= 0
      and weight_kg_sold >= 0
      and weight_kg_wasted >= 0
    );

  alter table public.delivery_zones
    drop constraint if exists delivery_zones_fee_non_negative;
  alter table public.delivery_zones
    add constraint delivery_zones_fee_non_negative check (base_fee_mwk >= 0 and min_order_mwk >= 0);

  alter table public.delivery_slots
    drop constraint if exists delivery_slots_capacity_non_negative;
  alter table public.delivery_slots
    add constraint delivery_slots_capacity_non_negative check (
      capacity_orders >= 0
      and capacity_weight_kg >= 0
      and booked_orders >= 0
      and booked_weight_kg >= 0
      and booked_orders <= capacity_orders
      and booked_weight_kg <= capacity_weight_kg
    );

  alter table public.lf_spices
    drop constraint if exists lf_spices_price_stock_non_negative;
  alter table public.lf_spices
    add constraint lf_spices_price_stock_non_negative check (price_mwk >= 0 and stock_qty >= 0);
end $$;
