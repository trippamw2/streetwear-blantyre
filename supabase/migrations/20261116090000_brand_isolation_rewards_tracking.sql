-- Brand isolation, Lake Fresh order tracking, recipe PDFs, loyalty and referrals
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- Brand access helpers
-- ---------------------------------------------------------------------------
create or replace function public.has_brand_access(_brand_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'::app_role
    )
    or exists (
      select 1 from public.staff_permissions sp
      where sp.user_id = auth.uid() and sp.brand_id = _brand_id
    );
$$;

grant execute on function public.has_brand_access(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Unique keys that make per brand loyalty and referral rows possible
-- ---------------------------------------------------------------------------
alter table public.customer_loyalty drop constraint if exists customer_loyalty_user_id_key;
alter table public.customer_loyalty drop constraint if exists customer_loyalty_user_brand_key;
alter table public.customer_loyalty add constraint customer_loyalty_user_brand_key unique (user_id, brand_id);

alter table public.user_referral_codes drop constraint if exists user_referral_codes_user_brand_key;
alter table public.user_referral_codes add constraint user_referral_codes_user_brand_key unique (user_id, brand_id);

alter table public.loyalty_tiers drop constraint if exists loyalty_tiers_name_key;
alter table public.loyalty_tiers drop constraint if exists loyalty_tiers_brand_name_key;
alter table public.loyalty_tiers add constraint loyalty_tiers_brand_name_key unique (brand_id, name);

-- ---------------------------------------------------------------------------
-- Recipe PDFs
-- ---------------------------------------------------------------------------
alter table public.lf_recipes add column if not exists pdf_url text;

-- ---------------------------------------------------------------------------
-- Brand communication centre
-- ---------------------------------------------------------------------------
create table if not exists public.brand_messages (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null,
  channel text not null default 'email',
  audience text not null default 'all_customers',
  subject text,
  body text not null,
  status text not null default 'draft',
  recipients_count integer not null default 0,
  sent_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.brand_messages enable row level security;

drop policy if exists brand_messages_admin_all on public.brand_messages;
create policy brand_messages_admin_all on public.brand_messages
  for all to authenticated
  using (public.has_brand_access(brand_id))
  with check (public.has_brand_access(brand_id));

-- ---------------------------------------------------------------------------
-- Replace global admin policies with brand scoped policies
-- ---------------------------------------------------------------------------
-- orders
drop policy if exists "Admin manage all orders" on public.orders;
drop policy if exists "Admins read all orders" on public.orders;
drop policy if exists "Admins update orders" on public.orders;
drop policy if exists orders_brand_admin_all on public.orders;
create policy orders_brand_admin_all on public.orders
  for all to authenticated
  using (public.has_brand_access(brand_id))
  with check (public.has_brand_access(brand_id));

-- order items
drop policy if exists "Admin manage order items" on public.order_items;
drop policy if exists "Admins read all order items" on public.order_items;
drop policy if exists order_items_brand_admin_all on public.order_items;
create policy order_items_brand_admin_all on public.order_items
  for all to authenticated
  using (public.has_brand_access(brand_id))
  with check (public.has_brand_access(brand_id));

-- products
drop policy if exists "Authenticated can delete products" on public.products;
drop policy if exists "Authenticated can insert products" on public.products;
drop policy if exists "Authenticated can update products" on public.products;
drop policy if exists products_brand_admin_all on public.products;
create policy products_brand_admin_all on public.products
  for all to authenticated
  using (public.has_brand_access(brand_id))
  with check (public.has_brand_access(brand_id));

-- loyalty
drop policy if exists "Admin manage customer_loyalty" on public.customer_loyalty;
drop policy if exists customer_loyalty_brand_admin_all on public.customer_loyalty;
create policy customer_loyalty_brand_admin_all on public.customer_loyalty
  for all to authenticated
  using (public.has_brand_access(brand_id))
  with check (public.has_brand_access(brand_id));

drop policy if exists "Admin manage loyalty_programs" on public.loyalty_programs;
drop policy if exists loyalty_programs_brand_admin_all on public.loyalty_programs;
create policy loyalty_programs_brand_admin_all on public.loyalty_programs
  for all to authenticated
  using (public.has_brand_access(brand_id))
  with check (public.has_brand_access(brand_id));

drop policy if exists "Admin manage loyalty_tiers" on public.loyalty_tiers;
drop policy if exists loyalty_tiers_brand_admin_all on public.loyalty_tiers;
create policy loyalty_tiers_brand_admin_all on public.loyalty_tiers
  for all to authenticated
  using (public.has_brand_access(brand_id))
  with check (public.has_brand_access(brand_id));

drop policy if exists "Admin manage loyalty_transactions" on public.loyalty_transactions;
drop policy if exists loyalty_transactions_brand_admin_all on public.loyalty_transactions;
create policy loyalty_transactions_brand_admin_all on public.loyalty_transactions
  for all to authenticated
  using (public.has_brand_access(brand_id))
  with check (public.has_brand_access(brand_id));

drop policy if exists "Admin manage referral_transactions" on public.referral_transactions;
drop policy if exists referral_transactions_brand_admin_all on public.referral_transactions;
create policy referral_transactions_brand_admin_all on public.referral_transactions
  for all to authenticated
  using (public.has_brand_access(brand_id))
  with check (public.has_brand_access(brand_id));

drop policy if exists "Admin manage user_referral_codes" on public.user_referral_codes;
drop policy if exists user_referral_codes_brand_admin_all on public.user_referral_codes;
create policy user_referral_codes_brand_admin_all on public.user_referral_codes
  for all to authenticated
  using (public.has_brand_access(brand_id))
  with check (public.has_brand_access(brand_id));

-- Lake Fresh operational tables
drop policy if exists fish_species_admin_all on public.fish_species;
create policy fish_species_admin_all on public.fish_species
  for all to authenticated
  using (public.has_brand_access(brand_id)) with check (public.has_brand_access(brand_id));

drop policy if exists fish_products_admin_all on public.fish_products;
create policy fish_products_admin_all on public.fish_products
  for all to authenticated
  using (public.has_brand_access(brand_id)) with check (public.has_brand_access(brand_id));

drop policy if exists fish_inventory_batches_admin_all on public.fish_inventory_batches;
create policy fish_inventory_batches_admin_all on public.fish_inventory_batches
  for all to authenticated
  using (public.has_brand_access(brand_id)) with check (public.has_brand_access(brand_id));

drop policy if exists lf_spices_admin_all on public.lf_spices;
create policy lf_spices_admin_all on public.lf_spices
  for all to authenticated
  using (public.has_brand_access(brand_id)) with check (public.has_brand_access(brand_id));

drop policy if exists lf_recipes_admin_all on public.lf_recipes;
create policy lf_recipes_admin_all on public.lf_recipes
  for all to authenticated
  using (public.has_brand_access(brand_id)) with check (public.has_brand_access(brand_id));

drop policy if exists order_preparation_admin_all on public.order_preparation;
create policy order_preparation_admin_all on public.order_preparation
  for all to authenticated
  using (public.has_brand_access(brand_id)) with check (public.has_brand_access(brand_id));

drop policy if exists delivery_zones_admin_all on public.delivery_zones;
create policy delivery_zones_admin_all on public.delivery_zones
  for all to authenticated
  using (public.has_brand_access(brand_id)) with check (public.has_brand_access(brand_id));

drop policy if exists delivery_slots_admin_all on public.delivery_slots;
create policy delivery_slots_admin_all on public.delivery_slots
  for all to authenticated
  using (public.has_brand_access(brand_id)) with check (public.has_brand_access(brand_id));

drop policy if exists lf_subscriptions_admin_all on public.lf_subscriptions;
create policy lf_subscriptions_admin_all on public.lf_subscriptions
  for all to authenticated
  using (public.has_brand_access(brand_id)) with check (public.has_brand_access(brand_id));

drop policy if exists lf_subscriptions_owner on public.lf_subscriptions;
create policy lf_subscriptions_owner on public.lf_subscriptions
  for select to authenticated
  using (auth.uid() = user_id or public.has_brand_access(brand_id));

drop policy if exists "Admin manage business accounts" on public.business_accounts;
drop policy if exists "Admins read business" on public.business_accounts;
create policy business_accounts_brand_admin_all on public.business_accounts
  for all to authenticated
  using (public.has_brand_access(brand_id)) with check (public.has_brand_access(brand_id));

drop policy if exists lf_quotes_admin_all on public.lf_quotes;
create policy lf_quotes_admin_all on public.lf_quotes
  for all to authenticated
  using (public.has_brand_access(brand_id)) with check (public.has_brand_access(brand_id));

-- ---------------------------------------------------------------------------
-- Loyalty credit helper
-- ---------------------------------------------------------------------------
create or replace function public.credit_loyalty_points(
  p_user_id uuid,
  p_brand_id uuid,
  p_points integer,
  p_type text,
  p_description text,
  p_order_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tier text := 'bronze';
  v_lifetime integer := 0;
begin
  if p_user_id is null or p_points is null or p_points = 0 then
    return;
  end if;

  insert into public.customer_loyalty (
    user_id, brand_id, total_points, available_points, redeemed_points,
    lifetime_spent_mwk, tier, last_activity_at
  ) values (
    p_user_id, p_brand_id, greatest(p_points, 0), greatest(p_points, 0), 0,
    0, 'bronze', now()
  )
  on conflict (user_id, brand_id) do update
  set total_points = greatest(public.customer_loyalty.total_points + p_points, 0),
      available_points = greatest(public.customer_loyalty.available_points + p_points, 0),
      redeemed_points = public.customer_loyalty.redeemed_points + (case when p_points < 0 then -p_points else 0 end),
      last_activity_at = now(),
      updated_at = now();

  insert into public.loyalty_transactions (user_id, brand_id, order_id, points, type, description)
  values (p_user_id, p_brand_id, p_order_id, p_points, p_type, p_description);

  select coalesce(total_points, 0) into v_lifetime
  from public.customer_loyalty
  where user_id = p_user_id and brand_id = p_brand_id;

  select name into v_tier
  from public.loyalty_tiers
  where brand_id = p_brand_id and min_lifetime_points <= v_lifetime
  order by min_lifetime_points desc
  limit 1;

  if v_tier is not null then
    update public.customer_loyalty
    set tier = v_tier
    where user_id = p_user_id and brand_id = p_brand_id;
  end if;
end;
$$;

-- Award points once a paid order is confirmed.
create or replace function public.award_loyalty_for_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_program public.loyalty_programs%rowtype;
  v_points integer := 0;
  v_base integer := 0;
begin
  select * into v_order from public.orders where id = p_order_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'order_not_found');
  end if;

  if v_order.payment_status <> 'paid' then
    return jsonb_build_object('ok', false, 'reason', 'not_paid');
  end if;

  if exists (
    select 1 from public.loyalty_transactions
    where order_id = p_order_id and type = 'earned'
  ) then
    return jsonb_build_object('ok', true, 'points', 0, 'reason', 'already_awarded');
  end if;

  select * into v_program
  from public.loyalty_programs
  where brand_id = v_order.brand_id and coalesce(is_active, true)
  order by created_at desc
  limit 1;

  if not found or coalesce(v_program.points_per_mwk, 0) <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'no_program');
  end if;

  v_base := greatest(coalesce(v_order.total_mwk, 0) - coalesce(v_order.delivery_fee_mwk, 0), 0);
  v_points := floor(v_base::numeric / v_program.points_per_mwk)::integer;

  if v_points <= 0 then
    return jsonb_build_object('ok', true, 'points', 0);
  end if;

  if v_order.user_id is null then
    return jsonb_build_object('ok', false, 'reason', 'no_customer');
  end if;

  perform public.credit_loyalty_points(
    v_order.user_id,
    v_order.brand_id,
    v_points,
    'earned',
    'Points earned from order ' || upper(substr(replace(p_order_id::text, '-', ''), 1, 8)),
    p_order_id
  );

  update public.customer_loyalty
  set lifetime_spent_mwk = coalesce(lifetime_spent_mwk, 0) + v_base,
      updated_at = now()
  where user_id = v_order.user_id and brand_id = v_order.brand_id;

  return jsonb_build_object('ok', true, 'points', v_points);
end;
$$;

-- ---------------------------------------------------------------------------
-- Referral application and completion
-- ---------------------------------------------------------------------------
create or replace function public.apply_referral_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_code public.user_referral_codes%rowtype;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'reason', 'sign_in_required');
  end if;

  select * into v_code
  from public.user_referral_codes
  where upper(code) = upper(trim(p_code))
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'invalid_code');
  end if;

  if v_code.user_id = v_user then
    return jsonb_build_object('ok', false, 'reason', 'own_code');
  end if;

  if exists (
    select 1 from public.referral_transactions
    where referee_id = v_user and brand_id = v_code.brand_id
  ) then
    return jsonb_build_object('ok', true, 'reason', 'already_applied');
  end if;

  insert into public.referral_transactions (
    referrer_id, referee_id, referral_code, brand_id, status
  ) values (
    v_code.user_id, v_user, upper(trim(p_code)), v_code.brand_id, 'pending'
  );

  return jsonb_build_object('ok', true, 'brand_id', v_code.brand_id);
end;
$$;

create or replace function public.complete_referral(p_referee_id uuid, p_order_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref public.referral_transactions%rowtype;
  v_brand uuid;
begin
  select brand_id into v_brand from public.orders where id = p_order_id;

  select * into v_ref
  from public.referral_transactions
  where referee_id = p_referee_id
    and status = 'pending'
    and (v_brand is null or brand_id = v_brand)
  order by created_at
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'no_pending_referral');
  end if;

  update public.referral_transactions
  set status = 'completed', order_id = coalesce(p_order_id, order_id)
  where id = v_ref.id;

  if coalesce(v_ref.referrer_reward, 0) > 0 then
    perform public.credit_loyalty_points(
      v_ref.referrer_id, v_ref.brand_id, v_ref.referrer_reward, 'referral',
      'Referral reward', p_order_id
    );
  end if;

  if coalesce(v_ref.referee_reward, 0) > 0 then
    perform public.credit_loyalty_points(
      v_ref.referee_id, v_ref.brand_id, v_ref.referee_reward, 'referral',
      'Welcome referral reward', p_order_id
    );
  end if;

  return jsonb_build_object('ok', true, 'referrer_reward', v_ref.referrer_reward, 'referee_reward', v_ref.referee_reward);
end;
$$;

-- ---------------------------------------------------------------------------
-- Public Lake Fresh order tracking (phone + optional reference)
-- ---------------------------------------------------------------------------
create or replace function public.lf_track_order(p_phone text, p_reference text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_digits text;
  v_ref text := nullif(trim(coalesce(p_reference, '')), '');
  v_items jsonb;
  v_steps jsonb;
  v_reached boolean;
begin
  v_digits := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 9);

  if length(v_digits) < 7 then
    return jsonb_build_object('ok', false, 'reason', 'phone_required');
  end if;

  select * into v_order
  from public.orders
  where brand_id = '22222222-2222-2222-2222-222222222222'
    and right(regexp_replace(customer_phone, '\D', '', 'g'), 9) = v_digits
    and (v_ref is null
      or payment_reference ilike v_ref || '%'
      or id::text ilike v_ref || '%')
  order by created_at desc
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'name', oi.product_name,
    'quantity', oi.quantity,
    'price_mwk', oi.unit_price_mwk,
    'recipe_title', oi.recipe_title,
    'recipe_id', oi.recipe_id
  ) order by oi.created_at), '[]'::jsonb)
  into v_items
  from public.order_items oi
  where oi.order_id = v_order.id;

  v_steps := jsonb_build_array(
    jsonb_build_object('key', 'placed', 'label', 'Order received', 'at', v_order.created_at,
      'done', true),
    jsonb_build_object('key', 'paid', 'label', 'Payment confirmed',
      'at', v_order.paid_at,
      'done', v_order.payment_status = 'paid'),
    jsonb_build_object('key', 'preparing', 'label', 'Preparing your fish',
      'at', null,
      'done', v_order.status in ('processing', 'dispatched', 'delivered')),
    jsonb_build_object('key', 'dispatched', 'label', 'Out for delivery',
      'at', null,
      'done', v_order.status in ('dispatched', 'delivered')),
    jsonb_build_object('key', 'delivered', 'label', 'Delivered',
      'at', null,
      'done', v_order.status = 'delivered')
  );

  if v_order.status = 'cancelled' then
    v_steps := v_steps || jsonb_build_array(
      jsonb_build_object('key', 'cancelled', 'label', 'Order cancelled', 'at', v_order.updated_at, 'done', true)
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'order', jsonb_build_object(
      'id', v_order.id,
      'reference', v_order.payment_reference,
      'status', v_order.status,
      'payment_status', v_order.payment_status,
      'total_mwk', v_order.total_mwk,
      'subtotal_mwk', v_order.subtotal_mwk,
      'delivery_fee_mwk', v_order.delivery_fee_mwk,
      'discount_mwk', coalesce(v_order.discount_mwk, 0),
      'delivery_date', v_order.delivery_date,
      'delivery_window', v_order.delivery_window,
      'customer_name', split_part(v_order.customer_name, ' ', 1),
      'created_at', v_order.created_at
    ),
    'items', v_items,
    'timeline', v_steps
  );
end;
$$;

grant execute on function public.lf_track_order(text, text) to anon, authenticated;
grant execute on function public.apply_referral_code(text) to authenticated;
grant execute on function public.complete_referral(uuid, uuid) to authenticated;
grant execute on function public.award_loyalty_for_order(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Lake Fresh order placement with server validated discounts
-- ---------------------------------------------------------------------------
drop function if exists public.lf_place_order(text, text, uuid, uuid, jsonb, text, boolean);

create or replace function public.lf_place_order(
  p_customer_name text,
  p_customer_phone text,
  p_zone_id uuid,
  p_slot_id uuid,
  p_items jsonb,
  p_notes text default null,
  p_marketing_consent boolean default false,
  p_redeem_points integer default 0,
  p_promo_code text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_brand_id uuid := '22222222-2222-2222-2222-222222222222';
  v_user_id uuid := auth.uid();
  v_zone public.delivery_zones%rowtype;
  v_slot public.delivery_slots%rowtype;
  v_product public.fish_products%rowtype;
  v_order_id uuid;
  v_payment_ref text;
  v_item jsonb;
  v_kind text;
  v_item_type text;
  v_unit_product_id uuid;
  v_unit_name text;
  v_unit_price integer;
  v_unit_qty numeric;
  v_unit_line_total integer;
  v_prep text;
  v_weight numeric;
  v_eff_weight numeric;
  v_line_total integer;
  v_recipe_id uuid;
  v_recipe_title text;
  v_subtotal integer := 0;
  v_total_weight numeric := 0;
  v_delivery_fee integer := 0;
  v_fee_setting integer := 2000;
  v_free_threshold integer := 15000;
  v_order_item_id uuid;
  v_batch record;
  v_remaining numeric;
  v_take numeric;
  v_program public.loyalty_programs%rowtype;
  v_loyalty public.customer_loyalty%rowtype;
  v_available integer := 0;
  v_points_used integer := 0;
  v_loyalty_discount integer := 0;
  v_promo_discount integer := 0;
  v_discount integer := 0;
  v_promo public.promo_codes%rowtype;
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

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_kind := coalesce(v_item ->> 'kind', 'fish');

    if v_kind = 'unit' then
      v_item_type := coalesce(v_item ->> 'item_type', 'other');
      v_unit_product_id := (v_item ->> 'product_id')::uuid;
      v_unit_qty := coalesce((v_item ->> 'quantity')::numeric, 1);
      if v_unit_qty <= 0 then
        raise exception 'Quantity must be greater than zero';
      end if;

      if v_item_type = 'spice' then
        select name, price_mwk, stock_qty into v_unit_name, v_unit_price, v_remaining
        from public.lf_spices where id = v_unit_product_id and brand_id = v_brand_id and is_active;
      else
        raise exception 'Unknown item type %', v_item_type;
      end if;

      if v_unit_name is null then
        raise exception 'A product in your order is no longer available';
      end if;

      if v_remaining < v_unit_qty then
        raise exception 'Only % of % is available right now', v_remaining, v_unit_name;
      end if;

      v_unit_line_total := round(v_unit_price * v_unit_qty)::integer;
      v_subtotal := v_subtotal + v_unit_line_total;
    else
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

      v_recipe_id := nullif(v_item ->> 'recipe_id', '')::uuid;
      if v_recipe_id is not null then
        select title into v_recipe_title
        from public.lf_recipes
        where id = v_recipe_id
          and brand_id = v_brand_id
          and is_active
          and (species_id is null or species_id = v_product.species_id);

        if not found then
          raise exception 'The selected recipe is not available for %', v_product.name;
        end if;
      end if;

      v_eff_weight := greatest(v_weight, v_product.min_order_qty_kg);
      v_line_total := round(v_product.price_per_kg_mwk * v_eff_weight)::integer;

      v_subtotal := v_subtotal + v_line_total;
      v_total_weight := v_total_weight + v_eff_weight;
    end if;
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

  -- Loyalty redemption is validated on the server; the client can only ask
  -- for points to be used, never set the discount amount.
  if coalesce(p_redeem_points, 0) > 0 then
    select * into v_program
    from public.loyalty_programs
    where brand_id = v_brand_id and coalesce(is_active, true)
    order by created_at desc
    limit 1;

    select * into v_loyalty
    from public.customer_loyalty
    where user_id = v_user_id and brand_id = v_brand_id;

    v_available := coalesce(v_loyalty.available_points, 0);

    if found and v_program.points_to_redeem > 0 and v_available >= v_program.points_to_redeem then
      v_points_used := least(p_redeem_points, v_available);
      v_points_used := (v_points_used / v_program.points_to_redeem) * v_program.points_to_redeem;
      v_loyalty_discount := (v_points_used / v_program.points_to_redeem) * v_program.reward_value_mwk;
      v_loyalty_discount := least(
        v_loyalty_discount,
        floor(v_subtotal::numeric * coalesce(v_program.max_redeem_percent, 50) / 100)::integer
      );
      if v_loyalty_discount < 0 then
        v_loyalty_discount := 0;
      end if;
    end if;
  end if;

  if nullif(trim(coalesce(p_promo_code, '')), '') is not null then
    select * into v_promo
    from public.promo_codes
    where brand_id = v_brand_id
      and upper(code) = upper(trim(p_promo_code))
      and coalesce(is_active, true)
      and (start_date is null or start_date <= now())
      and (end_date is null or end_date >= now())
      and (max_uses is null or used_count < max_uses)
    limit 1;

    if found and v_subtotal >= coalesce(v_promo.min_order, 0) then
      if v_promo.type in ('percentage', 'percent') then
        v_promo_discount := floor(v_subtotal::numeric * v_promo.value / 100)::integer;
      else
        v_promo_discount := v_promo.value::integer;
      end if;
      update public.promo_codes set used_count = coalesce(used_count, 0) + 1 where id = v_promo.id;
    end if;
  end if;

  v_discount := least(v_subtotal, greatest(0, v_loyalty_discount + v_promo_discount));

  insert into public.orders (
    user_id, customer_name, customer_phone, customer_location, notes,
    subtotal_mwk, delivery_fee_mwk, discount_mwk, promo_code, total_mwk,
    payment_method, status, brand_id, delivery_zone_id, delivery_slot_id, delivery_date
  ) values (
    v_user_id, trim(p_customer_name), trim(p_customer_phone), v_zone.name, p_notes,
    v_subtotal, v_delivery_fee, v_discount, nullif(trim(coalesce(p_promo_code, '')), ''),
    greatest(0, v_subtotal + v_delivery_fee - v_discount),
    'paychangu', 'new', v_brand_id, v_zone.id, v_slot.id, v_slot.delivery_date
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_kind := coalesce(v_item ->> 'kind', 'fish');

    if v_kind = 'unit' then
      v_item_type := coalesce(v_item ->> 'item_type', 'other');
      v_unit_product_id := (v_item ->> 'product_id')::uuid;
      v_unit_qty := coalesce((v_item ->> 'quantity')::numeric, 1);

      if v_item_type = 'spice' then
        select name, price_mwk into v_unit_name, v_unit_price
        from public.lf_spices where id = v_unit_product_id and brand_id = v_brand_id;
        update public.lf_spices set stock_qty = stock_qty - v_unit_qty where id = v_unit_product_id;
      else
        raise exception 'Unknown item type %', v_item_type;
      end if;

      v_unit_line_total := round(v_unit_price * v_unit_qty)::integer;

      insert into public.order_items (
        order_id, product_key, product_name, unit_price_mwk, quantity, brand_id
      ) values (
        v_order_id, v_item_type || ':' || v_unit_product_id::text, v_unit_name, v_unit_line_total, v_unit_qty, v_brand_id
      );
    else
      select * into v_product
      from public.fish_products
      where id = (v_item ->> 'product_id')::uuid and brand_id = v_brand_id;

      v_prep := coalesce(v_item ->> 'preparation', 'whole');
      v_weight := coalesce((v_item ->> 'weight_kg')::numeric, 0);
      v_eff_weight := greatest(v_weight, v_product.min_order_qty_kg);
      v_line_total := round(v_product.price_per_kg_mwk * v_eff_weight)::integer;

      v_recipe_id := nullif(v_item ->> 'recipe_id', '')::uuid;
      v_recipe_title := null;
      if v_recipe_id is not null then
        select title into v_recipe_title from public.lf_recipes where id = v_recipe_id;
      end if;

      insert into public.order_items (
        order_id, product_key, product_name, unit_price_mwk, quantity, brand_id,
        recipe_id, recipe_title
      ) values (
        v_order_id, v_product.id::text, v_product.name, v_line_total, 1, v_brand_id,
        v_recipe_id, v_recipe_title
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

  if v_points_used > 0 then
    update public.customer_loyalty
    set available_points = greatest(available_points - v_points_used, 0),
        redeemed_points = coalesce(redeemed_points, 0) + v_points_used,
        last_activity_at = now(),
        updated_at = now()
    where user_id = v_user_id and brand_id = v_brand_id;

    insert into public.loyalty_transactions (user_id, brand_id, order_id, points, type, description)
    values (v_user_id, v_brand_id, v_order_id, -v_points_used, 'redeemed',
      'Redeemed for ' || v_loyalty_discount || ' MWK discount');
  end if;

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
$function$;

grant execute on function public.lf_place_order(text, text, uuid, uuid, jsonb, text, boolean, integer, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Public assets bucket for Lake Fresh images and recipe PDFs
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "Brand admins upload product images" on storage.objects;
create policy "Brand admins upload product images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.has_brand_access('22222222-2222-2222-2222-222222222222'::uuid) or bucket_id = 'product-images' and public.has_brand_access('11111111-1111-1111-1111-111111111111'::uuid));

drop policy if exists "Brand admins update product images" on storage.objects;
create policy "Brand admins update product images" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and (public.has_brand_access('22222222-2222-2222-2222-222222222222'::uuid) or public.has_brand_access('11111111-1111-1111-1111-111111111111'::uuid)));

drop policy if exists "Brand admins delete product images" on storage.objects;
create policy "Brand admins delete product images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and (public.has_brand_access('22222222-2222-2222-2222-222222222222'::uuid) or public.has_brand_access('11111111-1111-1111-1111-111111111111'::uuid)));
