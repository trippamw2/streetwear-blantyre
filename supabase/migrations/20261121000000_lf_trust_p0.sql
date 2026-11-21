-- Lake Fresh P0 trust hardening.
-- 1. Orders carry a private guest access token and delivery attribution.
-- 2. Order detail and email context require ownership, a brand staff role or a
--    matching guest access token. UUIDs alone never unlock customer details.
-- 3. Delivery completion is server-owned and cannot happen without proof.
-- 4. Subscription renewal references use the same LF-SUB- namespace as checkout.

-- ---------------------------------------------------------------------------
-- 1. Order access columns
-- ---------------------------------------------------------------------------
alter table public.orders add column if not exists guest_access_token uuid;
alter table public.orders add column if not exists delivered_by uuid references auth.users(id) on delete set null;
alter table public.orders add column if not exists delivery_proof_url text;

update public.orders
set guest_access_token = gen_random_uuid()
where guest_access_token is null;

alter table public.orders alter column guest_access_token set default gen_random_uuid();

create index if not exists orders_guest_access_token_idx
  on public.orders (guest_access_token);

-- ---------------------------------------------------------------------------
-- 2. Guest-safe order placement returns a private confirmation token
-- ---------------------------------------------------------------------------
create or replace function public.lf_place_order_guest(
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
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_order_id uuid;
  v_token uuid;
begin
  -- lf_place_order owns all pricing, stock and slot validation.
  v_order_id := public.lf_place_order(
    p_customer_name,
    p_customer_phone,
    p_zone_id,
    p_slot_id,
    p_items,
    p_notes,
    p_marketing_consent,
    p_redeem_points,
    p_promo_code,
    p_house_number,
    p_street_name,
    p_delivery_lat,
    p_delivery_lng,
    p_delivery_place,
    p_customer_email
  );

  v_token := gen_random_uuid();

  update public.orders
  set guest_access_token = v_token
  where id = v_order_id
    and brand_id = '22222222-2222-2222-2222-222222222222'::uuid;

  return jsonb_build_object(
    'ok', true,
    'order_id', v_order_id,
    'access_token', v_token::text
  );
end;
$function$;

-- ---------------------------------------------------------------------------
-- 3. Token-aware order detail. Replaces the anonymous 1-argument function.
-- ---------------------------------------------------------------------------
drop function if exists public.lf_public_order_detail(uuid);

create or replace function public.lf_public_order_detail(
  p_order_id uuid,
  p_access_token text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_items jsonb;
  v_reconciliation jsonb;
  v_authorized boolean := false;
  v_token uuid;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
    and brand_id = '22222222-2222-2222-2222-222222222222'::uuid;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if auth.uid() is not null
     and (v_order.user_id = auth.uid() or public.has_brand_access(v_order.brand_id)) then
    v_authorized := true;
  elsif nullif(trim(coalesce(p_access_token, '')), '') is not null then
    begin
      v_token := trim(p_access_token)::uuid;
    exception when invalid_text_representation then
      return jsonb_build_object('ok', false, 'reason', 'unauthorized');
    end;

    if v_order.guest_access_token = v_token then
      v_authorized := true;
    end if;
  end if;

  if not v_authorized then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', oi.id,
    'product_name', oi.product_name,
    'unit_price_mwk', oi.unit_price_mwk,
    'quantity', oi.quantity,
    'recipe_title', oi.recipe_title,
    'preparation', jsonb_build_object(
      'preparation_type', op.preparation_type,
      'requested_weight_kg', op.requested_weight_kg,
      'packed_weight_kg', op.packed_weight_kg,
      'price_per_kg_mwk', op.price_per_kg_mwk,
      'final_price_mwk', op.final_price_mwk
    )
  ) order by oi.created_at), '[]'::jsonb)
  into v_items
  from public.order_items oi
  left join public.order_preparation op on op.order_item_id = oi.id
  where oi.order_id = v_order.id;

  select jsonb_build_object(
    'status', pr.status,
    'estimated_total_mwk', pr.estimated_total_mwk,
    'final_total_mwk', pr.final_total_mwk,
    'difference_mwk', pr.difference_mwk
  )
  into v_reconciliation
  from public.price_reconciliation pr
  where pr.order_id = v_order.id
  order by pr.created_at desc
  limit 1;

  return jsonb_build_object(
    'ok', true,
    'order', jsonb_build_object(
      'id', v_order.id,
      'status', v_order.status,
      'payment_status', v_order.payment_status,
      'customer_name', v_order.customer_name,
      'customer_phone', v_order.customer_phone,
      'customer_location', v_order.customer_location,
      'notes', v_order.notes,
      'subtotal_mwk', v_order.subtotal_mwk,
      'delivery_fee_mwk', v_order.delivery_fee_mwk,
      'discount_mwk', coalesce(v_order.discount_mwk, 0),
      'total_mwk', v_order.total_mwk,
      'payment_method', v_order.payment_method,
      'payment_reference', v_order.payment_reference,
      'delivery_date', v_order.delivery_date,
      'delivery_window', v_order.delivery_window,
      'created_at', v_order.created_at
    ),
    'items', v_items,
    'reconciliation', v_reconciliation
  );
end;
$$;

-- Email proxy uses this to derive the recipient from the order instead of
-- trusting a caller supplied address. It never exposes notes or delivery PII.
create or replace function public.lf_verify_order_access(
  p_order_id uuid,
  p_access_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_token uuid;
  v_email text;
begin
  if nullif(trim(coalesce(p_access_token, '')), '') is null then
    return jsonb_build_object('ok', false, 'reason', 'missing_token');
  end if;

  begin
    v_token := trim(p_access_token)::uuid;
  exception when invalid_text_representation then
    return jsonb_build_object('ok', false, 'reason', 'invalid_token');
  end;

  select * into v_order
  from public.orders
  where id = p_order_id
    and brand_id = '22222222-2222-2222-2222-222222222222'::uuid
    and guest_access_token = v_token;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;

  v_email := nullif(trim(coalesce(v_order.customer_email, '')), '');

  return jsonb_build_object(
    'ok', v_email is not null,
    'reason', case when v_email is null then 'no_email' else null end,
    'order_id', v_order.id,
    'to_email', v_email,
    'to_name', v_order.customer_name,
    'brand', 'lake-fresh'
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Delivery completion is server-owned and proof is mandatory
-- ---------------------------------------------------------------------------
create table if not exists public.lf_delivery_events (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '22222222-2222-2222-2222-222222222222' references public.brands(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  proof_url text not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.lf_delivery_events enable row level security;

drop policy if exists lf_delivery_events_admin_read on public.lf_delivery_events;
create policy lf_delivery_events_admin_read on public.lf_delivery_events
  for select to authenticated
  using (public.has_brand_access(brand_id));

revoke all on table public.lf_delivery_events from anon;
revoke insert, update, delete on table public.lf_delivery_events from authenticated;
grant select on table public.lf_delivery_events to authenticated;

create or replace function public.lf_enforce_delivery_proof()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.brand_id = '22222222-2222-2222-2222-222222222222'::uuid
     and new.status = 'delivered'::public.order_status
     and old.status is distinct from 'delivered'::public.order_status
     and nullif(btrim(coalesce(new.delivery_proof_url, '')), '') is null then
    raise exception 'Delivery proof is required before an order can be marked delivered';
  end if;
  return new;
end;
$$;

drop trigger if exists lf_enforce_delivery_proof on public.orders;
create trigger lf_enforce_delivery_proof
  before update of status, delivery_proof_url on public.orders
  for each row execute function public.lf_enforce_delivery_proof();

create or replace function public.lf_mark_delivery_result(
  p_order_id uuid,
  p_proof_url text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_result jsonb;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if nullif(btrim(coalesce(p_proof_url, '')), '') is null then
    return jsonb_build_object('ok', false, 'reason', 'proof_required');
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
    and brand_id = '22222222-2222-2222-2222-222222222222'::uuid
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'order_not_found');
  end if;

  if auth.uid() is null or not public.has_brand_access(v_order.brand_id) then
    return jsonb_build_object('ok', false, 'reason', 'no_access');
  end if;

  update public.orders
  set delivery_proof_url = btrim(p_proof_url),
      delivered_by = auth.uid(),
      updated_at = now()
  where id = p_order_id;

  v_result := public.lf_set_order_status(
    p_order_id,
    'delivered'::public.order_status,
    coalesce(v_note, 'Delivery completed with photo proof'),
    null,
    jsonb_build_object('proof_url', btrim(p_proof_url))
  );

  if not coalesce((v_result ->> 'ok')::boolean, false) then
    return v_result;
  end if;

  update public.delivery_assignments
  set status = 'delivered',
      delivered_at = now(),
      notes = coalesce(v_note, notes)
  where order_id = p_order_id
    and brand_id = v_order.brand_id;

  insert into public.lf_delivery_events (brand_id, order_id, actor_id, proof_url, note)
  values (v_order.brand_id, p_order_id, auth.uid(), btrim(p_proof_url), v_note);

  return jsonb_build_object('ok', true, 'order_id', p_order_id, 'status', 'delivered');
end;
$$;

revoke all on function public.lf_mark_delivery_result(uuid, text, text) from public, anon;
grant execute on function public.lf_mark_delivery_result(uuid, text, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. Subscription references: one namespace, LF-SUB-
-- ---------------------------------------------------------------------------
update public.lf_subscription_charges
set payment_reference = 'LF-SUB-' || substr(payment_reference, 7)
where payment_reference like 'LFSUB-%';

create or replace function public.lf_prepare_subscription_charges()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_brand_id uuid := '22222222-2222-2222-2222-222222222222';
  v_today date := (now() at time zone 'Africa/Blantyre')::date;
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
    v_reference := 'LF-SUB-' || v_short_id || '-' || to_char(v_sub.next_charge_date, 'YYYYMMDD');

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

revoke all on function public.lf_prepare_subscription_charges() from public, anon, authenticated;
grant execute on function public.lf_prepare_subscription_charges() to service_role;

-- ---------------------------------------------------------------------------
-- 6. Final grant set for public LF entry points
-- ---------------------------------------------------------------------------
revoke all on function public.lf_place_order(
  text, text, uuid, uuid, jsonb, text, boolean, integer, text,
  text, text, double precision, double precision, text, text
) from public, anon;

revoke all on function public.lf_public_order_detail(uuid, text) from public;
grant execute on function public.lf_public_order_detail(uuid, text) to anon, authenticated;

revoke all on function public.lf_verify_order_access(uuid, text) from public, anon;
grant execute on function public.lf_verify_order_access(uuid, text) to authenticated, service_role;

grant execute on function public.lf_place_order_guest(
  text, text, uuid, uuid, jsonb, text, boolean, integer, text,
  text, text, double precision, double precision, text, text
) to anon, authenticated, service_role;
