-- Stage 6: payment hardening for the multi-brand platform.
--
-- Goals
--  * Give `orders` a real payment state instead of overloading the order status.
--  * Resolve PayChangu references deterministically (no fuzzy ILIKE scans).
--  * Process each callback exactly once, transactionally, with an audit trail.
--  * Confirm Lake Fresh reservations and deduct SB inventory on payment.
--  * Keep merchant references (`payment_reference`) separate from the provider
--    reference so the storefront can keep showing its own LF-/SB- ref.

-- ---------------------------------------------------------------------------
-- 1. Payment state columns
-- ---------------------------------------------------------------------------

alter table public.orders
  add column if not exists payment_status text not null default 'pending',
  add column if not exists paid_at timestamptz,
  add column if not exists charge_id text,
  add column if not exists payment_channel text,
  add column if not exists provider_reference text,
  add column if not exists inventory_committed_at timestamptz;

alter table public.gifts
  add column if not exists provider_reference text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.orders'::regclass
      and conname = 'orders_payment_status_check'
  ) then
    alter table public.orders
      add constraint orders_payment_status_check
      check (payment_status in ('pending', 'paid', 'failed', 'refunded', 'cancelled'));
  end if;
end $$;

-- Backfill from the historical status-only model so admin reporting and the
-- storefront agree immediately after the migration.
update public.orders
set payment_status = case
      when status = 'cancelled' then 'cancelled'
      when status in ('confirmed', 'processing', 'dispatched', 'delivered') then 'paid'
      else 'pending'
    end,
    paid_at = case
      when status in ('confirmed', 'processing', 'dispatched', 'delivered')
        then coalesce(paid_at, updated_at, created_at)
      else paid_at
    end,
    inventory_committed_at = case
      when status in ('confirmed', 'processing', 'dispatched', 'delivered')
        then coalesce(inventory_committed_at, updated_at, created_at)
      else inventory_committed_at
    end
where payment_status = 'pending'
   or payment_status is null;

create index if not exists idx_orders_brand_payment_ref
  on public.orders (brand_id, payment_reference);

create index if not exists idx_orders_brand_payment_status
  on public.orders (brand_id, payment_status);

-- ---------------------------------------------------------------------------
-- 2. Deterministic merchant references for rows created before/outside the
--    checkout code. LF orders already set their 12-char reference inside
--    lf_place_order; the trigger leaves that value untouched.
-- ---------------------------------------------------------------------------

create or replace function public.set_order_payment_reference()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.payment_reference is null or btrim(new.payment_reference) = '' then
    if new.brand_id = '22222222-2222-2222-2222-222222222222'::uuid then
      new.payment_reference :=
        'LF-' || upper(substr(replace(new.id::text, '-', ''), 1, 12));
    else
      new.payment_reference :=
        'SB-' || upper(substr(replace(new.id::text, '-', ''), 1, 8));
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_order_payment_reference on public.orders;
create trigger trg_set_order_payment_reference
  before insert on public.orders
  for each row execute function public.set_order_payment_reference();

create or replace function public.set_gift_payment_reference()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.payment_reference is null or btrim(new.payment_reference) = '' then
    new.payment_reference :=
      'SB-GIFT-' || upper(substr(replace(new.id::text, '-', ''), 1, 8));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_gift_payment_reference on public.gifts;
create trigger trg_set_gift_payment_reference
  before insert on public.gifts
  for each row execute function public.set_gift_payment_reference();

-- ---------------------------------------------------------------------------
-- 3. Audit trail. Every callback (valid, duplicate, rejected) is recorded.
-- ---------------------------------------------------------------------------

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id),
  order_id uuid references public.orders(id) on delete set null,
  gift_id uuid references public.gifts(id) on delete set null,
  provider text not null default 'paychangu',
  tx_ref text not null,
  provider_status text,
  provider_mode text,
  amount numeric,
  currency text,
  charge_id text,
  provider_reference text,
  channel text,
  outcome text not null default 'received',
  message text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_payment_events_tx_ref
  on public.payment_events (tx_ref);

create index if not exists idx_payment_events_order
  on public.payment_events (order_id);

alter table public.payment_events enable row level security;

drop policy if exists payment_events_admin_read on public.payment_events;
create policy payment_events_admin_read on public.payment_events
  for select using (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ---------------------------------------------------------------------------
-- 4. Shared paid transition. Runs inside the caller's transaction.
-- ---------------------------------------------------------------------------

create or replace function public.process_order_paid(
  p_order_id uuid,
  p_charge_id text default null,
  p_provider_reference text default null,
  p_channel text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_res record;
  v_product_id text;
begin
  select * into v_order from public.orders where id = p_order_id for update;

  if v_order.id is null then
    return jsonb_build_object('ok', false, 'outcome', 'order_not_found');
  end if;

  if v_order.payment_status = 'paid' then
    return jsonb_build_object(
      'ok', true,
      'outcome', 'already_paid',
      'kind', 'order',
      'order_id', v_order.id,
      'brand_id', v_order.brand_id,
      'total_mwk', v_order.total_mwk,
      'first_transition', false
    );
  end if;

  if v_order.status = 'cancelled' or v_order.payment_status in ('refunded', 'cancelled') then
    return jsonb_build_object(
      'ok', false,
      'outcome', 'order_not_payable',
      'kind', 'order',
      'order_id', v_order.id,
      'brand_id', v_order.brand_id
    );
  end if;

  update public.orders
  set status = case when status = 'new' then 'confirmed'::public.order_status else status end,
      payment_status = 'paid',
      paid_at = coalesce(paid_at, now()),
      charge_id = coalesce(p_charge_id, charge_id),
      provider_reference = coalesce(p_provider_reference, provider_reference),
      payment_channel = coalesce(p_channel, payment_channel),
      updated_at = now()
  where id = v_order.id
  returning * into v_order;

  if v_order.inventory_committed_at is null then
    if v_order.brand_id = '22222222-2222-2222-2222-222222222222'::uuid then
      -- Lake Fresh: reserved weight becomes sold weight.
      for v_res in
        select id from public.fish_stock_reservations
        where order_id = v_order.id and status = 'reserved'
      loop
        perform public.confirm_fish_reservation(v_res.id);
      end loop;
    elsif v_order.brand_id = '11111111-1111-1111-1111-111111111111'::uuid then
      -- SB: commit the sale against the product-level inventory row.
      -- order_items.product_key is "{product_id}-{variant_id}", so resolve the
      -- longest matching product id instead of splitting on "-" (product ids
      -- themselves contain hyphens).
      for v_item in
        select product_key, quantity from public.order_items where order_id = v_order.id
      loop
        v_product_id := null;

        select p.id into v_product_id
        from public.products p
        where p.brand_id = '11111111-1111-1111-1111-111111111111'::uuid
          and (
            p.id = v_item.product_key
            or v_item.product_key like p.id || '-%'
          )
        order by length(p.id) desc
        limit 1;

        if v_product_id is null then
          select i.product_id into v_product_id
          from public.inventory i
          where i.brand_id = '11111111-1111-1111-1111-111111111111'::uuid
            and i.product_id = v_item.product_key
          limit 1;
        end if;

        if v_product_id is not null then
          update public.inventory
          set quantity = greatest(0, quantity - greatest(0, coalesce(v_item.quantity, 0))),
              reserved_quantity = greatest(
                0,
                coalesce(reserved_quantity, 0) - greatest(0, coalesce(v_item.quantity, 0))
              ),
              updated_at = now()
          where brand_id = '11111111-1111-1111-1111-111111111111'::uuid
            and product_id = v_product_id;
        end if;
      end loop;
    end if;

    update public.orders
    set inventory_committed_at = now()
    where id = v_order.id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'outcome', 'paid',
    'kind', 'order',
    'order_id', v_order.id,
    'brand_id', v_order.brand_id,
    'total_mwk', v_order.total_mwk,
    'first_transition', true
  );
end;
$$;

revoke all on function public.process_order_paid(uuid, text, text, text) from public;
revoke all on function public.process_order_paid(uuid, text, text, text) from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Single entry point for PayChangu callbacks.
-- ---------------------------------------------------------------------------

create or replace function public.process_payment_event(
  p_tx_ref text,
  p_status text,
  p_amount numeric default null,
  p_currency text default null,
  p_charge_id text default null,
  p_provider_reference text default null,
  p_channel text default null,
  p_mode text default null,
  p_payload jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tx_ref text := btrim(coalesce(p_tx_ref, ''));
  v_status text := lower(btrim(coalesce(p_status, '')));
  v_currency text := upper(btrim(coalesce(p_currency, '')));
  v_kind text;
  v_is_success boolean := false;
  v_is_failure boolean := false;
  v_event_id uuid;
  v_brand_id uuid;
  v_order public.orders%rowtype;
  v_gift public.gifts%rowtype;
  v_order_id uuid;
  v_gift_id uuid;
  v_matches integer;
  v_hex text;
  v_result jsonb;
begin
  if v_tx_ref = '' then
    raise exception 'tx_ref is required';
  end if;

  insert into public.payment_events (
    tx_ref, provider_status, provider_mode, amount, currency, charge_id,
    provider_reference, channel, payload
  ) values (
    v_tx_ref, v_status, p_mode, p_amount, nullif(v_currency, ''), p_charge_id,
    p_provider_reference, p_channel, coalesce(p_payload, '{}'::jsonb)
  )
  returning id into v_event_id;

  v_is_success := v_status in ('success', 'successful', 'completed', 'paid');
  v_is_failure := v_status in ('failed', 'cancelled', 'canceled', 'expired', 'declined', 'refused');

  if v_tx_ref ilike 'SB-GIFT-%' then
    v_kind := 'gift';
  elsif v_tx_ref ilike 'LF-%' then
    v_kind := 'lf_order';
  elsif v_tx_ref ilike 'SB-%' then
    v_kind := 'sb_order';
  else
    update public.payment_events
    set outcome = 'ignored', message = 'Unknown tx_ref prefix'
    where id = v_event_id;

    return jsonb_build_object('ok', false, 'outcome', 'unknown_reference');
  end if;

  -- ---------------------------------------------------------------- gift ----
  if v_kind = 'gift' then
    v_brand_id := '11111111-1111-1111-1111-111111111111'::uuid;

    select * into v_gift
    from public.gifts
    where payment_reference = v_tx_ref
    order by created_at desc
    limit 1;

    if v_gift.id is null then
      -- Legacy gifts created before the reference trigger/update.
      v_hex := lower(substr(v_tx_ref, 9));
      if v_hex ~ '^[0-9a-f]{8}$' then
        select count(*) into v_matches
        from public.gifts
        where replace(id::text, '-', '') like v_hex || '%';

        if v_matches = 1 then
          select * into v_gift
          from public.gifts
          where replace(id::text, '-', '') like v_hex || '%'
          limit 1;
        end if;
      end if;
    end if;

    if v_gift.id is null then
      update public.payment_events
      set brand_id = v_brand_id, outcome = 'gift_not_found'
      where id = v_event_id;

      return jsonb_build_object('ok', false, 'outcome', 'gift_not_found');
    end if;

    v_gift_id := v_gift.id;

    if not v_is_success then
      if v_is_failure and not v_gift.is_paid then
        update public.gifts
        set payment_status = 'failed', updated_at = now()
        where id = v_gift_id;
      end if;

      update public.payment_events
      set brand_id = v_brand_id, gift_id = v_gift_id,
          outcome = case when v_is_failure then 'payment_failed' else 'pending' end,
          message = 'Provider status: ' || v_status
      where id = v_event_id;

      return jsonb_build_object(
        'ok', true, 'outcome', case when v_is_failure then 'payment_failed' else 'pending' end,
        'kind', 'gift', 'gift_id', v_gift_id
      );
    end if;

    if v_currency <> '' and v_currency <> 'MWK' then
      update public.payment_events
      set brand_id = v_brand_id, gift_id = v_gift_id,
          outcome = 'currency_mismatch'
      where id = v_event_id;

      return jsonb_build_object('ok', false, 'outcome', 'currency_mismatch', 'kind', 'gift');
    end if;

    if p_amount is null or p_amount < v_gift.total_mwk then
      update public.payment_events
      set brand_id = v_brand_id, gift_id = v_gift_id,
          outcome = 'amount_mismatch',
          message = 'Expected at least ' || v_gift.total_mwk || ' MWK, received ' || coalesce(p_amount::text, 'null')
      where id = v_event_id;

      return jsonb_build_object(
        'ok', false, 'outcome', 'amount_mismatch', 'kind', 'gift',
        'expected', v_gift.total_mwk, 'received', p_amount
      );
    end if;

    if v_gift.is_paid then
      update public.payment_events
      set brand_id = v_brand_id, gift_id = v_gift_id, outcome = 'duplicate_payment'
      where id = v_event_id;

      return jsonb_build_object(
        'ok', true, 'outcome', 'already_paid', 'kind', 'gift',
        'gift_id', v_gift_id, 'first_transition', false
      );
    end if;

    update public.gifts
    set is_paid = true,
        payment_status = 'paid',
        paid_at = coalesce(paid_at, now()),
        charge_id = coalesce(p_charge_id, charge_id),
        provider_reference = coalesce(p_provider_reference, provider_reference),
        status = 'paid',
        updated_at = now()
    where id = v_gift_id;

    insert into public.gift_tracking (gift_id, status, note)
    values (v_gift_id, 'paid', 'Payment confirmed via PayChangu');

    update public.payment_events
    set brand_id = v_brand_id, gift_id = v_gift_id, outcome = 'paid'
    where id = v_event_id;

    return jsonb_build_object(
      'ok', true, 'outcome', 'paid', 'kind', 'gift',
      'gift_id', v_gift_id, 'first_transition', true,
      'gift', jsonb_build_object(
        'recipient_email', v_gift.recipient_email,
        'recipient_name', v_gift.recipient_name,
        'sender_name', v_gift.sender_name,
        'tracking_token', v_gift.tracking_token
      )
    );
  end if;

  -- --------------------------------------------------------------- order ----
  v_brand_id := case
    when v_kind = 'lf_order' then '22222222-2222-2222-2222-222222222222'::uuid
    else '11111111-1111-1111-1111-111111111111'::uuid
  end;

  select * into v_order
  from public.orders
  where payment_reference = v_tx_ref
    and brand_id = v_brand_id
  order by created_at desc
  limit 1;

  if v_order.id is null then
    -- Deterministic id-prefix fallback for orders created before the trigger.
    if v_kind = 'lf_order' then
      v_hex := lower(substr(v_tx_ref, 4));
      if v_hex ~ '^[0-9a-f]{12}$' then
        select count(*) into v_matches
        from public.orders
        where brand_id = v_brand_id
          and replace(id::text, '-', '') like v_hex || '%';

        if v_matches = 1 then
          select * into v_order
          from public.orders
          where brand_id = v_brand_id
            and replace(id::text, '-', '') like v_hex || '%'
          limit 1;
        end if;
      end if;
    else
      v_hex := lower(substr(v_tx_ref, 4));
      if v_hex ~ '^[0-9a-f]{8}$' then
        select count(*) into v_matches
        from public.orders
        where brand_id = v_brand_id
          and replace(id::text, '-', '') like v_hex || '%';

        if v_matches = 1 then
          select * into v_order
          from public.orders
          where brand_id = v_brand_id
            and replace(id::text, '-', '') like v_hex || '%'
          limit 1;
        end if;
      end if;
    end if;
  end if;

  if v_order.id is null then
    update public.payment_events
    set brand_id = v_brand_id, outcome = 'order_not_found'
    where id = v_event_id;

    return jsonb_build_object('ok', false, 'outcome', 'order_not_found', 'kind', v_kind);
  end if;

  v_order_id := v_order.id;

  if not v_is_success then
    if v_is_failure and v_order.payment_status = 'pending' then
      update public.orders
      set payment_status = 'failed', updated_at = now()
      where id = v_order_id;
    end if;

    update public.payment_events
    set brand_id = v_brand_id, order_id = v_order_id,
        outcome = case when v_is_failure then 'payment_failed' else 'pending' end,
        message = 'Provider status: ' || v_status
    where id = v_event_id;

    return jsonb_build_object(
      'ok', true,
      'outcome', case when v_is_failure then 'payment_failed' else 'pending' end,
      'kind', v_kind, 'order_id', v_order_id, 'brand_id', v_brand_id
    );
  end if;

  if v_currency <> '' and v_currency <> 'MWK' then
    update public.payment_events
    set brand_id = v_brand_id, order_id = v_order_id,
        outcome = 'currency_mismatch'
    where id = v_event_id;

    return jsonb_build_object('ok', false, 'outcome', 'currency_mismatch', 'kind', v_kind, 'order_id', v_order_id);
  end if;

  if p_amount is null or p_amount < v_order.total_mwk then
    update public.payment_events
    set brand_id = v_brand_id, order_id = v_order_id,
        outcome = 'amount_mismatch',
        message = 'Expected at least ' || v_order.total_mwk || ' MWK, received ' || coalesce(p_amount::text, 'null')
    where id = v_event_id;

    return jsonb_build_object(
      'ok', false, 'outcome', 'amount_mismatch', 'kind', v_kind,
      'order_id', v_order_id, 'expected', v_order.total_mwk, 'received', p_amount
    );
  end if;

  v_result := public.process_order_paid(
    v_order_id, p_charge_id, p_provider_reference, p_channel
  );

  update public.payment_events
  set brand_id = v_brand_id,
      order_id = v_order_id,
      outcome = case
        when v_result->>'outcome' = 'paid' then 'paid'
        when v_result->>'outcome' = 'already_paid' then 'duplicate_payment'
        else coalesce(v_result->>'outcome', 'processed')
      end,
      message = case
        when (v_result->>'ok')::boolean then null
        else v_result->>'outcome'
      end
  where id = v_event_id;

  return v_result;
end;
$$;

revoke all on function public.process_payment_event(text, text, numeric, text, text, text, text, text, jsonb) from public;
revoke all on function public.process_payment_event(text, text, numeric, text, text, text, text, text, jsonb) from anon, authenticated;
grant execute on function public.process_payment_event(text, text, numeric, text, text, text, text, text, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- 6. Manual "mark paid" for staff. Keeps inventory/reservation bookkeeping in
--    one place instead of doing client-side inventory math.
-- ---------------------------------------------------------------------------

create or replace function public.mark_order_paid(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.has_role(auth.uid(), 'admin'::public.app_role) or auth.role() = 'service_role') then
    raise exception 'Not authorised to mark orders paid';
  end if;

  return public.process_order_paid(p_order_id, null, null, 'manual');
end;
$$;

revoke all on function public.mark_order_paid(uuid) from public;
grant execute on function public.mark_order_paid(uuid) to authenticated;
