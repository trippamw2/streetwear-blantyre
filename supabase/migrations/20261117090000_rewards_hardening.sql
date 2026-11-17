-- ---------------------------------------------------------------------------
-- Rewards and referral hardening
--
-- Supabase grants EXECUTE to PUBLIC by default, which made the previous
-- helpers callable by anonymous clients. Anyone could have credited arbitrary
-- loyalty points or completed a referral without a paid order. This migration
-- adds caller checks, a safe admin wrapper and a real redemption function.
-- ---------------------------------------------------------------------------

-- Internal helper: only SECURITY DEFINER functions may call it.
revoke execute on function public.credit_loyalty_points(uuid, uuid, integer, text, text, uuid) from anon, authenticated, public;

-- Referrals can only be completed by the referee (with their own paid order)
-- or by an admin of that brand.
create or replace function public.complete_referral(p_referee_id uuid, p_order_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref public.referral_transactions%rowtype;
  v_brand uuid;
  v_order_brand uuid;
  v_order_user uuid;
  v_order_paid text;
begin
  if p_order_id is not null then
    select brand_id, user_id, payment_status
      into v_order_brand, v_order_user, v_order_paid
    from public.orders
    where id = p_order_id;

    if not found then
      return jsonb_build_object('ok', false, 'reason', 'order_not_found');
    end if;

    if v_order_user is distinct from p_referee_id then
      return jsonb_build_object('ok', false, 'reason', 'order_not_referee');
    end if;

    if coalesce(v_order_paid, '') <> 'paid' then
      return jsonb_build_object('ok', false, 'reason', 'order_not_paid');
    end if;

    v_brand := v_order_brand;
  end if;

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

  if not (
    auth.uid() = v_ref.referee_id
    or public.has_brand_access(v_ref.brand_id)
  ) then
    return jsonb_build_object('ok', false, 'reason', 'not_allowed');
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

revoke execute on function public.complete_referral(uuid, uuid) from anon, public;
grant execute on function public.complete_referral(uuid, uuid) to authenticated;

-- Loyalty for an order may only be claimed by that order's customer or a
-- brand admin, and only once the order is paid.
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

  if not (
    auth.uid() = v_order.user_id
    or public.has_brand_access(v_order.brand_id)
  ) then
    return jsonb_build_object('ok', false, 'reason', 'not_allowed');
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

revoke execute on function public.award_loyalty_for_order(uuid) from anon, public;
grant execute on function public.award_loyalty_for_order(uuid) to authenticated;

-- Admin only wrapper for manual point adjustments (referral screens).
create or replace function public.admin_credit_loyalty_points(
  p_user_id uuid,
  p_brand_id uuid,
  p_points integer,
  p_description text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_brand_access(p_brand_id) then
    return jsonb_build_object('ok', false, 'reason', 'not_allowed');
  end if;

  perform public.credit_loyalty_points(
    p_user_id,
    p_brand_id,
    p_points,
    'referral_bonus',
    coalesce(nullif(trim(p_description), ''), 'Manual points adjustment'),
    null
  );

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.admin_credit_loyalty_points(uuid, uuid, integer, text) from anon, public;
grant execute on function public.admin_credit_loyalty_points(uuid, uuid, integer, text) to authenticated;

-- Customer redemption. Points are validated and deducted on the server so a
-- client can never invent a discount.
create or replace function public.redeem_loyalty_points(
  p_brand_id uuid,
  p_points integer,
  p_order_total numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_loyalty public.customer_loyalty%rowtype;
  v_program public.loyalty_programs%rowtype;
  v_step integer;
  v_value integer;
  v_max_discount numeric;
  v_max_points integer;
  v_points integer;
  v_discount integer;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'reason', 'sign_in_required');
  end if;

  if p_brand_id is null then
    return jsonb_build_object('ok', false, 'reason', 'brand_required');
  end if;

  select * into v_loyalty
  from public.customer_loyalty
  where user_id = v_user and brand_id = p_brand_id;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'no_loyalty');
  end if;

  select * into v_program
  from public.loyalty_programs
  where brand_id = p_brand_id and coalesce(is_active, true)
  order by created_at desc
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'no_program');
  end if;

  v_step := greatest(coalesce(v_program.points_to_redeem, 0), 1);
  v_value := greatest(coalesce(v_program.reward_value_mwk, 0), 0);
  v_max_discount := floor(
    greatest(coalesce(p_order_total, 0), 0)
    * coalesce(v_program.max_redeem_percent, 50)
    / 100.0
  );
  v_max_points := floor(v_max_discount / greatest(v_value, 1))::integer * v_step;

  v_points := least(
    greatest(coalesce(p_points, 0), 0),
    coalesce(v_loyalty.available_points, 0),
    v_max_points
  );
  v_points := floor(v_points::numeric / v_step)::integer * v_step;

  if v_points <= 0 then
    return jsonb_build_object(
      'ok', false,
      'reason', 'not_enough_points',
      'available', coalesce(v_loyalty.available_points, 0)
    );
  end if;

  v_discount := (v_points / v_step) * v_value;

  update public.customer_loyalty
  set available_points = greatest(available_points - v_points, 0),
      redeemed_points = coalesce(redeemed_points, 0) + v_points,
      last_activity_at = now(),
      updated_at = now()
  where user_id = v_user and brand_id = p_brand_id;

  insert into public.loyalty_transactions (user_id, brand_id, points, type, description)
  values (
    v_user,
    p_brand_id,
    -v_points,
    'redeemed',
    'Redeemed for ' || v_discount::text || ' MWK discount'
  );

  return jsonb_build_object('ok', true, 'points_used', v_points, 'discount', v_discount);
end;
$$;

revoke execute on function public.redeem_loyalty_points(uuid, integer, numeric) from anon, public;
grant execute on function public.redeem_loyalty_points(uuid, integer, numeric) to authenticated;
