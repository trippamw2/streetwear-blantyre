-- Lake Fresh subscription renewal planning and manual payment confirmation.
-- No automatic bank debit is created. Prices are always recomputed on the server.
-- Apply after 20261120000006_lf_admin_settings_refunds.sql

create table if not exists public.lf_subscription_charges (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '22222222-2222-2222-2222-222222222222' references public.brands(id) on delete cascade,
  subscription_id uuid not null references public.lf_subscriptions(id) on delete cascade,
  period_date date not null,
  amount_mwk integer not null,
  payment_reference text not null unique,
  status text not null default 'due' check (status in ('due', 'paid', 'cancelled')),
  order_id uuid references public.orders(id) on delete set null,
  gateway_reference text,
  reminded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subscription_id, period_date)
);

alter table public.lf_subscription_charges enable row level security;

drop policy if exists lf_subscription_charges_admin_all on public.lf_subscription_charges;
create policy lf_subscription_charges_admin_all on public.lf_subscription_charges
  for all to authenticated
  using (public.has_brand_access(brand_id))
  with check (public.has_brand_access(brand_id));

-- Plan the next due charge for every active subscription. Idempotent by period.
create or replace function public.lf_prepare_subscription_charges()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_brand_id uuid := '22222222-2222-2222-2222-222222222222';
  v_today date := (now() at time zone 'Africa/Blantyre')::date;
  v_setting record;
  v_fee_setting integer := 2000;
  v_free_threshold integer := 15000;
  v_sub record;
  v_price numeric;
  v_fee integer;
  v_subtotal integer;
  v_amount integer;
  v_short_id text;
  v_reference text;
  v_charge_id uuid;
  v_results jsonb := '[]'::jsonb;
begin
  select
    coalesce(max(case when setting_key = 'delivery.fee_mwk' then (setting_value #>> '{}')::integer end), 2000),
    coalesce(max(case when setting_key = 'delivery.free_threshold_mwk' then (setting_value #>> '{}')::integer end), 15000)
  into v_fee_setting, v_free_threshold
  from public.brand_settings
  where brand_id = v_brand_id
    and setting_key in ('delivery.fee_mwk', 'delivery.free_threshold_mwk');

  for v_sub in
    select s.*
    from public.lf_subscriptions s
    where s.brand_id = v_brand_id
      and s.status = 'active'
      and s.consent_given
      and s.next_charge_date is not null
      and s.next_charge_date <= v_today
    order by s.next_charge_date, s.created_at
  loop
    select fp.price_per_kg_mwk
    into v_price
    from public.fish_products fp
    where fp.brand_id = v_brand_id
      and fp.is_active
      and (v_sub.fish_product_id is null or fp.id = v_sub.fish_product_id)
    order by case when fp.id = v_sub.fish_product_id then 0 else 1 end, fp.sort_order
    limit 1;

    if v_price is null then
      continue;
    end if;

    v_subtotal := round(coalesce(v_sub.quantity_kg, 0) * v_price)::integer;

    select coalesce(z.base_fee_mwk, v_fee_setting)
    into v_fee
    from public.delivery_zones z
    where z.id = v_sub.delivery_zone_id and z.brand_id = v_brand_id;

    if v_fee is null then
      v_fee := v_fee_setting;
    end if;

    if v_subtotal >= v_free_threshold then
      v_fee := 0;
    end if;

    v_amount := v_subtotal + v_fee;
    v_short_id := upper(substr(replace(v_sub.id::text, '-', ''), 1, 12));
    v_reference := 'LFSUB-' || v_short_id || '-' || to_char(v_sub.next_charge_date, 'YYYYMMDD');

    insert into public.lf_subscription_charges (
      brand_id, subscription_id, period_date, amount_mwk, payment_reference
    ) values (
      v_brand_id, v_sub.id, v_sub.next_charge_date, v_amount, v_reference
    )
    on conflict (subscription_id, period_date) do nothing
    returning id into v_charge_id;

    if v_charge_id is not null then
      v_results := v_results || jsonb_build_object(
        'charge_id', v_charge_id,
        'subscription_id', v_sub.id,
        'customer_name', v_sub.customer_name,
        'customer_email', v_sub.customer_email,
        'plan', v_sub.plan,
        'period_date', v_sub.next_charge_date,
        'amount_mwk', v_amount,
        'payment_reference', v_reference
      );
      v_charge_id := null;
    end if;
  end loop;

  return jsonb_build_object('ok', true, 'count', jsonb_array_length(v_results), 'charges', v_results);
end;
$$;

revoke all on function public.lf_prepare_subscription_charges() from public;
grant execute on function public.lf_prepare_subscription_charges() to service_role;

-- Mark a manual payment as received. This creates the recurring order and only
-- then advances the next charge date. Never trust a client supplied price.
create or replace function public.lf_confirm_subscription_charge(
  p_charge_id uuid,
  p_gateway_reference text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_brand_id uuid := '22222222-2222-2222-2222-222222222222';
  v_charge public.lf_subscription_charges%rowtype;
  v_sub public.lf_subscriptions%rowtype;
  v_product public.fish_products%rowtype;
  v_price numeric;
  v_fee integer;
  v_fee_setting integer := 2000;
  v_free_threshold integer := 15000;
  v_subtotal integer;
  v_fee_due integer;
  v_amount integer;
  v_cutoff time := time '20:00';
  v_delivery_days integer := 1;
  v_today date := (now() at time zone 'Africa/Blantyre')::date;
  v_local_time time := (now() at time zone 'Africa/Blantyre')::time;
  v_delivery_date date;
  v_slot_id uuid;
  v_preparation text;
  v_items jsonb;
  v_order_id uuid;
  v_paid jsonb;
  v_next_date date;
begin
  select * into v_charge
  from public.lf_subscription_charges
  where id = p_charge_id for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'charge_not_found');
  end if;

  select * into v_sub
  from public.lf_subscriptions
  where id = v_charge.subscription_id for update;

  if not found or v_sub.brand_id <> v_brand_id then
    return jsonb_build_object('ok', false, 'reason', 'subscription_not_found');
  end if;

  if not (auth.role() = 'service_role' or public.has_brand_access(v_sub.brand_id)) then
    return jsonb_build_object('ok', false, 'reason', 'no_access');
  end if;

  if v_charge.status <> 'due' then
    return jsonb_build_object('ok', false, 'reason', 'charge_already_handled');
  end if;

  if v_sub.status <> 'active' or not v_sub.consent_given then
    return jsonb_build_object('ok', false, 'reason', 'subscription_not_active');
  end if;

  select fp.price_per_kg_mwk
  into v_price
  from public.fish_products fp
  where fp.brand_id = v_brand_id
    and fp.is_active
    and (v_sub.fish_product_id is null or fp.id = v_sub.fish_product_id)
  order by case when fp.id = v_sub.fish_product_id then 0 else 1 end, fp.sort_order
  limit 1;

  if v_price is null then
    return jsonb_build_object('ok', false, 'reason', 'product_unavailable');
  end if;

  select * into v_product
  from public.fish_products fp
  where fp.brand_id = v_brand_id
    and fp.is_active
    and (v_sub.fish_product_id is null or fp.id = v_sub.fish_product_id)
  order by case when fp.id = v_sub.fish_product_id then 0 else 1 end, fp.sort_order
  limit 1;

  select
    coalesce(max(case when setting_key = 'delivery.fee_mwk' then (setting_value #>> '{}')::integer end), 2000),
    coalesce(max(case when setting_key = 'delivery.free_threshold_mwk' then (setting_value #>> '{}')::integer end), 15000),
    coalesce(max(case when setting_key = 'delivery.cutoff' then (setting_value #>> '{}')::time end), time '20:00'),
    coalesce(max(case when setting_key = 'delivery.delivery_days' then (setting_value #>> '{}')::integer end), 1)
  into v_fee_setting, v_free_threshold, v_cutoff, v_delivery_days
  from public.brand_settings
  where brand_id = v_brand_id
    and setting_key in (
      'delivery.fee_mwk', 'delivery.free_threshold_mwk',
      'delivery.cutoff', 'delivery.delivery_days'
    );

  v_delivery_days := greatest(v_delivery_days, 1);
  v_subtotal := round(coalesce(v_sub.quantity_kg, 0) * v_price)::integer;

  select coalesce(z.base_fee_mwk, v_fee_setting)
  into v_fee
  from public.delivery_zones z
  where z.id = v_sub.delivery_zone_id and z.brand_id = v_brand_id;

  if v_fee is null then
    v_fee := v_fee_setting;
  end if;

  v_fee_due := case when v_subtotal >= v_free_threshold then 0 else v_fee end;
  v_amount := v_subtotal + v_fee_due;

  update public.lf_subscription_charges
  set amount_mwk = v_amount, updated_at = now()
  where id = v_charge.id;

  if v_sub.delivery_zone_id is null then
    return jsonb_build_object('ok', false, 'reason', 'zone_required');
  end if;

  v_delivery_date := greatest(
    v_charge.period_date,
    v_today + v_delivery_days + case when v_local_time >= v_cutoff then 1 else 0 end
  );

  insert into public.delivery_slots (
    brand_id, zone_id, delivery_date, cutoff_at,
    capacity_orders, capacity_weight_kg, is_open
  ) values (
    v_brand_id, v_sub.delivery_zone_id, v_delivery_date,
    ((v_delivery_date - v_delivery_days)::timestamp + v_cutoff) at time zone 'Africa/Blantyre',
    20, 50, true
  )
  on conflict (brand_id, zone_id, delivery_date)
  do update set is_open = true
  returning id into v_slot_id;

  v_preparation := coalesce(v_product.preparation_options ->> 0, 'whole');
  v_items := jsonb_build_array(jsonb_build_object(
    'product_id', v_product.id,
    'weight_kg', v_sub.quantity_kg,
    'preparation', v_preparation
  ));

  v_order_id := public.lf_place_order(
    v_sub.customer_name,
    v_sub.customer_phone,
    v_sub.delivery_zone_id,
    v_slot_id,
    v_items,
    'Your subscription fish delivery',
    false,
    0,
    null,
    null,
    null,
    null,
    null,
    null,
    v_sub.customer_email
  );

  v_paid := public.process_order_paid(
    v_order_id,
    v_charge.payment_reference,
    p_gateway_reference,
    'manual'
  );

  if coalesce((v_paid ->> 'ok')::boolean, false) is not true then
    raise exception 'Subscription payment could not be confirmed for the new order';
  end if;

  update public.lf_subscription_charges
  set status = 'paid',
      order_id = v_order_id,
      gateway_reference = nullif(trim(coalesce(p_gateway_reference, '')), ''),
      updated_at = now()
  where id = v_charge.id;

  v_next_date := v_charge.period_date + case v_sub.plan
    when 'weekly' then interval '7 days'
    when 'biweekly' then interval '14 days'
    when 'monthly' then interval '1 month'
    else interval '7 days'
  end;

  if v_next_date <= v_today then
    v_next_date := v_today + case v_sub.plan
      when 'weekly' then interval '7 days'
      when 'biweekly' then interval '14 days'
      when 'monthly' then interval '1 month'
      else interval '7 days'
    end;
  end if;

  update public.lf_subscriptions
  set status = 'active',
      last_charged_at = now(),
      next_charge_date = v_next_date::date,
      payment_reference = v_charge.payment_reference,
      updated_at = now()
  where id = v_sub.id;

  return jsonb_build_object(
    'ok', true,
    'charge_id', v_charge.id,
    'order_id', v_order_id,
    'amount_mwk', v_amount,
    'next_charge_date', v_next_date::date
  );
end;
$$;

revoke all on function public.lf_confirm_subscription_charge(uuid, text) from public;
grant execute on function public.lf_confirm_subscription_charge(uuid, text) to authenticated, service_role;
