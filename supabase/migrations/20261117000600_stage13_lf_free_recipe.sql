-- Stage 13: free recipe attachment on orders + complete spice/marinade pairings
-- Every fish gets all five signature spices and all five marinades so each fish
-- always shows at least five selectable seasonings on the storefront.

alter table public.order_items
  add column if not exists recipe_id uuid references public.lf_recipes(id) on delete set null,
  add column if not exists recipe_title text;

-- All five spices pair with every Lake Fresh fish.
update public.lf_spices
set recommended_species = array(
  select id from public.fish_species
  where brand_id = '22222222-2222-2222-2222-222222222222'
  order by sort_order
)
where brand_id = '22222222-2222-2222-2222-222222222222';

-- All five marinades pair with every Lake Fresh fish.
update public.lf_marinades
set recommended_species = array(
  select id from public.fish_species
  where brand_id = '22222222-2222-2222-2222-222222222222'
  order by sort_order
)
where brand_id = '22222222-2222-2222-2222-222222222222';

-- Remove the leftover manual QA seasoning.
delete from public.lf_spices
where brand_id = '22222222-2222-2222-2222-222222222222'
  and name = 'QA Spice';

-- Extend the order engine so a free recipe can travel with each fish line.
create or replace function public.lf_place_order(
  p_customer_name text,
  p_customer_phone text,
  p_zone_id uuid,
  p_slot_id uuid,
  p_items jsonb,
  p_notes text default null,
  p_marketing_consent boolean default false
) returns uuid
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

  -- Price the order server-side. Recipes are free and never affect totals.
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
      elsif v_item_type = 'marinade' then
        select name, price_mwk, stock_qty into v_unit_name, v_unit_price, v_remaining
        from public.lf_marinades where id = v_unit_product_id and brand_id = v_brand_id and is_active;
      elsif v_item_type = 'ready' then
        select name, price_mwk, stock_qty into v_unit_name, v_unit_price, v_remaining
        from public.lf_ready_to_cook where id = v_unit_product_id and brand_id = v_brand_id and is_active;
      elsif v_item_type = 'kit' then
        select name, price_mwk, 999999 into v_unit_name, v_unit_price, v_remaining
        from public.lf_meal_kits where id = v_unit_product_id and brand_id = v_brand_id and is_active;
      else
        raise exception 'Unknown item type %', v_item_type;
      end if;

      if v_unit_name is null then
        raise exception 'A product in your order is no longer available';
      end if;

      if v_item_type <> 'kit' and v_remaining < v_unit_qty then
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

  -- Persist items.
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
      elsif v_item_type = 'marinade' then
        select name, price_mwk into v_unit_name, v_unit_price
        from public.lf_marinades where id = v_unit_product_id and brand_id = v_brand_id;
        update public.lf_marinades set stock_qty = stock_qty - v_unit_qty where id = v_unit_product_id;
      elsif v_item_type = 'ready' then
        select name, price_mwk into v_unit_name, v_unit_price
        from public.lf_ready_to_cook where id = v_unit_product_id and brand_id = v_brand_id;
        update public.lf_ready_to_cook set stock_qty = stock_qty - v_unit_qty where id = v_unit_product_id;
      elsif v_item_type = 'kit' then
        select name, price_mwk into v_unit_name, v_unit_price
        from public.lf_meal_kits where id = v_unit_product_id and brand_id = v_brand_id;
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
