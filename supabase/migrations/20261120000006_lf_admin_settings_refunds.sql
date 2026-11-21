-- Lake Fresh admin settings, refund auditing and delivery slot rules
-- Apply after 20261120000005_lf_public_order_detail.sql
-- Safe to re-run.

-- Brand admins can edit their own settings, not only global admins.
drop policy if exists brand_settings_admin_all on public.brand_settings;
create policy brand_settings_admin_all on public.brand_settings
  for all to authenticated
  using (public.has_brand_access(brand_id))
  with check (public.has_brand_access(brand_id));

-- Refund aware status helper. Direct order writes are no longer the admin path.
drop function if exists public.lf_set_order_status(uuid, public.order_status, text);
create or replace function public.lf_set_order_status(
  p_order_id uuid,
  p_status public.order_status,
  p_reason text default null,
  p_gateway_reference text default null,
  p_gateway_response jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'order_not_found');
  end if;

  if not public.has_brand_access(v_order.brand_id) then
    return jsonb_build_object('ok', false, 'reason', 'no_access');
  end if;

  if (v_order.status, p_status) not in (
    ('new', 'confirmed'),
    ('new', 'cancelled'),
    ('confirmed', 'processing'),
    ('confirmed', 'cancelled'),
    ('processing', 'dispatched'),
    ('processing', 'cancelled'),
    ('dispatched', 'delivered'),
    ('dispatched', 'cancelled'),
    ('delivered', 'refunded'),
    ('cancelled', 'refunded')
  ) then
    return jsonb_build_object('ok', false, 'reason', 'invalid_transition');
  end if;

  if p_status = 'refunded' and coalesce(trim(p_reason), '') = '' then
    return jsonb_build_object('ok', false, 'reason', 'reason_required');
  end if;

  update public.orders
  set status = p_status,
      payment_status = case when p_status = 'refunded' then 'refunded' else payment_status end,
      updated_at = now()
  where id = p_order_id;

  -- A cancelled order has already released stock and slot capacity.
  if v_order.status not in ('cancelled', 'refunded')
     and p_status in ('cancelled', 'refunded') then
    perform public.release_fish_reservation(id)
    from public.fish_stock_reservations
    where order_id = p_order_id and status = 'reserved';

    update public.delivery_slots s
    set booked_orders = greatest(0, s.booked_orders - 1),
        booked_weight_kg = greatest(0, s.booked_weight_kg - coalesce((
          select sum(oi.quantity * coalesce(op.requested_weight_kg, 0))
          from public.order_items oi
          left join public.order_preparation op on op.order_item_id = oi.id
          where oi.order_id = v_order.id
        ), 0))
    where s.id = v_order.delivery_slot_id;
  end if;

  if p_status = 'refunded' then
    insert into public.lf_refund_audit (
      brand_id, order_id, actor_id, amount_mwk, reason,
      gateway_reference, gateway_response
    ) values (
      v_order.brand_id, v_order.id, auth.uid(), coalesce(v_order.total_mwk, 0), p_reason,
      nullif(trim(coalesce(p_gateway_reference, '')), ''),
      coalesce(p_gateway_response, '{}'::jsonb)
    );
  end if;

  return jsonb_build_object('ok', true, 'status', p_status, 'order_id', p_order_id);
end;
$$;

drop function if exists public.lf_set_order_status(uuid, public.order_status, text);
grant execute on function public.lf_set_order_status(
  uuid, public.order_status, text, text, jsonb
) to authenticated;

-- Slot generation follows the admin owned delivery settings.
create or replace function public.lf_generate_delivery_slots(
  p_days integer default 14,
  p_capacity_orders integer default 20,
  p_capacity_weight_kg numeric default 50
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_brand_id uuid := '22222222-2222-2222-2222-222222222222';
  v_cutoff time := time '20:00';
  v_delivery_days integer := 1;
  v_max_advance_days integer := 7;
  v_today date := (now() at time zone 'Africa/Blantyre')::date;
  v_local_time time := (now() at time zone 'Africa/Blantyre')::time;
  v_start_offset integer;
  v_end_offset integer;
  v_count integer := 0;
begin
  if not public.has_brand_access(v_brand_id) then
    raise exception 'Admin access required';
  end if;

  select coalesce((setting_value #>> '{}')::time, time '20:00')
  into v_cutoff
  from public.brand_settings
  where brand_id = v_brand_id and setting_key = 'delivery.cutoff';

  select coalesce((setting_value #>> '{}')::integer, 1)
  into v_delivery_days
  from public.brand_settings
  where brand_id = v_brand_id and setting_key = 'delivery.delivery_days';

  select coalesce((setting_value #>> '{}')::integer, 7)
  into v_max_advance_days
  from public.brand_settings
  where brand_id = v_brand_id and setting_key = 'delivery.max_advance_days';

  v_delivery_days := greatest(v_delivery_days, 1);
  v_max_advance_days := greatest(v_max_advance_days, 1);
  v_start_offset := v_delivery_days + case when v_local_time >= v_cutoff then 1 else 0 end;
  v_end_offset := greatest(greatest(p_days, 1), v_delivery_days + v_max_advance_days + 1);

  insert into public.delivery_slots (
    brand_id, zone_id, delivery_date, cutoff_at,
    capacity_orders, capacity_weight_kg
  )
  select
    v_brand_id,
    z.id,
    d.delivery_date,
    ((d.delivery_date - v_delivery_days)::timestamp + v_cutoff) at time zone 'Africa/Blantyre',
    greatest(p_capacity_orders, 1),
    greatest(p_capacity_weight_kg, 1)
  from public.delivery_zones z
  cross join lateral (
    select generate_series(v_today + v_start_offset, v_today + v_end_offset, interval '1 day')::date as delivery_date
  ) d
  where z.brand_id = v_brand_id and z.is_active
  on conflict (brand_id, zone_id, delivery_date) do nothing;

  get diagnostics v_count = row_count;

  update public.delivery_slots s
  set cutoff_at = ((s.delivery_date - v_delivery_days)::timestamp + v_cutoff) at time zone 'Africa/Blantyre'
  where s.brand_id = v_brand_id
    and s.delivery_date >= v_today
    and s.cutoff_at <> ((s.delivery_date - v_delivery_days)::timestamp + v_cutoff) at time zone 'Africa/Blantyre';

  return v_count;
end;
$$;

revoke all on function public.lf_generate_delivery_slots(integer, integer, numeric) from public;
grant execute on function public.lf_generate_delivery_slots(integer, integer, numeric) to authenticated;
