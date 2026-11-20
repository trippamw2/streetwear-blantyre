-- Allow guest orders through the server validated LF order RPC.
-- Apply after 20261120000002_lf_refund_audit.sql
-- Guest writes never touch customer_profiles or loyalty rows.

-- Capture the current deployed LF order function in source control.
-- Older overloads did not apply promo/loyalty discounts or store customer
-- address and coordinates, so they are removed in favour of this version.

drop function if exists public.lf_place_order(text, text, uuid, uuid, jsonb, text, boolean);
drop function if exists public.lf_place_order(text, text, uuid, uuid, jsonb, text, boolean, integer, text);

create or replace function public.lf_place_order(
  p_customer_name text,
  p_customer_phone text,
  p_zone_id uuid,
  p_slot_id uuid,
  p_items jsonb,
  p_notes text default null,
  p_marketing_consent boolean default false,
  p_redeem_points integer default 0,
  p_promo_code text default null,
  p_house_number text default null,
  p_street_name text default null,
  p_delivery_lat double precision default null,
  p_delivery_lng double precision default null,
  p_delivery_place text default null,
  p_customer_email text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
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
    user_id, customer_name, customer_phone, customer_email, customer_location, notes,
    subtotal_mwk, delivery_fee_mwk, discount_mwk, promo_code, total_mwk,
    payment_method, status, brand_id, delivery_zone_id, delivery_slot_id, delivery_date,
    house_number, street_name, delivery_lat, delivery_lng, delivery_place
  ) values (
    v_user_id, trim(p_customer_name), trim(p_customer_phone), nullif(trim(coalesce(p_customer_email, '')), ''), v_zone.name, p_notes,
    v_subtotal, v_delivery_fee, v_discount, nullif(trim(coalesce(p_promo_code, '')), ''),
    greatest(0, v_subtotal + v_delivery_fee - v_discount),
    'paychangu', 'new', v_brand_id, v_zone.id, v_slot.id, v_slot.delivery_date,
    nullif(trim(coalesce(p_house_number, '')), ''), nullif(trim(coalesce(p_street_name, '')), ''),
    p_delivery_lat, p_delivery_lng, nullif(trim(coalesce(p_delivery_place, '')), '')
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

  if v_user_id is not null then
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
  end if;

  insert into public.price_reconciliation (
    brand_id, order_id, estimated_total_mwk, status
  ) values (
    v_brand_id, v_order_id, v_subtotal, 'pending'
  );

  return v_order_id;
end;
$function$;

grant execute on function public.lf_place_order(
  text, text, uuid, uuid, jsonb, text, boolean, integer, text,
  text, text, double precision, double precision, text, text
) to authenticated, service_role;
