-- Lake Fresh: make subscriptions payable and store the chosen catch type.

begin;

alter table public.lf_subscriptions
  drop constraint if exists lf_subscriptions_status_check;

alter table public.lf_subscriptions
  add constraint lf_subscriptions_status_check
  check (status in ('pending_consent', 'pending_payment', 'active', 'paused', 'cancelled'));

alter table public.lf_subscriptions
  add column if not exists fish_product_id uuid references public.fish_products(id);

alter table public.lf_subscriptions
  add column if not exists price_per_kg_mwk numeric not null default 4500;

alter table public.lf_subscriptions
  add column if not exists payment_reference text;

alter table public.payment_events
  add column if not exists subscription_id uuid references public.lf_subscriptions(id);
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
  v_subscription public.lf_subscriptions%rowtype;
  v_subscription_id uuid;
  v_expected_amount numeric;
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
  elsif v_tx_ref ilike 'LF-SUB-%' then
    v_kind := 'lf_subscription';
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

  -- -------------------------------------------------------- subscription ----
  if v_kind = 'lf_subscription' then
    v_brand_id := '22222222-2222-2222-2222-222222222222'::uuid;
    v_hex := lower(substr(v_tx_ref, 8));

    if v_hex ~ '^[0-9a-f]{12}$' then
      select count(*) into v_matches
      from public.lf_subscriptions
      where brand_id = v_brand_id
        and replace(id::text, '-', '') like v_hex || '%';

      if v_matches = 1 then
        select * into v_subscription
        from public.lf_subscriptions
        where brand_id = v_brand_id
          and replace(id::text, '-', '') like v_hex || '%'
        limit 1;
      end if;
    end if;

    if v_subscription.id is null then
      select * into v_subscription
      from public.lf_subscriptions
      where brand_id = v_brand_id
        and (mandate_ref = v_tx_ref or payment_reference = v_tx_ref)
      order by created_at desc
      limit 1;
    end if;

    if v_subscription.id is null then
      update public.payment_events
      set brand_id = v_brand_id, outcome = 'subscription_not_found'
      where id = v_event_id;

      return jsonb_build_object('ok', false, 'outcome', 'subscription_not_found', 'kind', v_kind);
    end if;

    v_subscription_id := v_subscription.id;
    v_expected_amount := round(
      coalesce(v_subscription.quantity_kg, 0) * coalesce(v_subscription.price_per_kg_mwk, 4500) +
      coalesce((select base_fee_mwk from public.delivery_zones where id = v_subscription.delivery_zone_id), 0)
    );

    if not v_is_success then
      update public.payment_events
      set brand_id = v_brand_id, outcome = case when v_is_failure then 'payment_failed' else 'pending' end,
          message = 'Provider status: ' || v_status
      where id = v_event_id;

      return jsonb_build_object(
        'ok', true,
        'outcome', case when v_is_failure then 'payment_failed' else 'pending' end,
        'kind', v_kind, 'subscription_id', v_subscription_id, 'brand_id', v_brand_id
      );
    end if;

    if v_currency <> '' and v_currency <> 'MWK' then
      update public.payment_events
      set brand_id = v_brand_id, outcome = 'currency_mismatch'
      where id = v_event_id;

      return jsonb_build_object('ok', false, 'outcome', 'currency_mismatch', 'kind', v_kind, 'subscription_id', v_subscription_id);
    end if;

    if p_amount is null or p_amount < v_expected_amount then
      update public.payment_events
      set brand_id = v_brand_id, outcome = 'amount_mismatch',
          message = 'Expected at least ' || v_expected_amount || ' MWK, received ' || coalesce(p_amount::text, 'null')
      where id = v_event_id;

      return jsonb_build_object(
        'ok', false, 'outcome', 'amount_mismatch', 'kind', v_kind,
        'subscription_id', v_subscription_id, 'expected', v_expected_amount, 'received', p_amount
      );
    end if;

    if v_subscription.status = 'active' then
      update public.payment_events
      set brand_id = v_brand_id, outcome = 'duplicate_payment'
      where id = v_event_id;

      return jsonb_build_object(
        'ok', true, 'outcome', 'already_paid', 'kind', v_kind,
        'subscription_id', v_subscription_id, 'first_transition', false
      );
    end if;

    update public.lf_subscriptions
    set status = 'active',
        payment_reference = v_tx_ref,
        mandate_ref = coalesce(p_charge_id, v_tx_ref),
        last_charged_at = now(),
        next_charge_date = now()::date + case plan
          when 'weekly' then 7
          when 'biweekly' then 14
          when 'monthly' then 30
          else 7
        end,
        updated_at = now()
    where id = v_subscription_id;

    update public.payment_events
    set brand_id = v_brand_id, subscription_id = v_subscription_id, outcome = 'paid'
    where id = v_event_id;

    return jsonb_build_object(
      'ok', true, 'outcome', 'paid', 'kind', v_kind,
      'subscription_id', v_subscription_id, 'first_transition', true
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


commit;