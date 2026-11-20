-- Refund audit, server owned status transitions and safer order tracking
-- Apply after 20261120000001_lf_refund_status.sql

create table if not exists public.lf_refund_audit (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  actor_id uuid references auth.users(id),
  amount_mwk integer not null,
  reason text not null,
  gateway_reference text,
  gateway_response jsonb,
  created_at timestamptz not null default now()
);

alter table public.lf_refund_audit enable row level security;

drop policy if exists lf_refund_audit_admin_all on public.lf_refund_audit;
create policy lf_refund_audit_admin_all on public.lf_refund_audit
  for all to authenticated
  using (public.has_brand_access(brand_id))
  with check (public.has_brand_access(brand_id));

-- One server owned status transition helper.
create or replace function public.lf_set_order_status(
  p_order_id uuid,
  p_status public.order_status,
  p_reason text default null
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
  set status = p_status, updated_at = now()
  where id = p_order_id;

  if p_status in ('cancelled', 'refunded') then
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
      brand_id, order_id, actor_id, amount_mwk, reason
    ) values (
      v_order.brand_id, v_order.id, auth.uid(), coalesce(v_order.total_mwk, 0), p_reason
    );
  end if;

  return jsonb_build_object('ok', true, 'status', p_status);
end;
$$;

grant execute on function public.lf_set_order_status(uuid, public.order_status, text) to authenticated;

-- Safer public order tracking: exact reference match, no prefix wildcard.
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
begin
  v_digits := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 9);

  if length(v_digits) < 7 then
    return jsonb_build_object('ok', false, 'reason', 'phone_required');
  end if;

  select * into v_order
  from public.orders
  where brand_id = '22222222-2222-2222-2222-222222222222'::uuid
    and right(regexp_replace(customer_phone, '\D', '', 'g'), 9) = v_digits
    and (v_ref is null
      or payment_reference = v_ref
      or id::text = v_ref)
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
    jsonb_build_object('key', 'placed', 'label', 'Order received', 'at', v_order.created_at, 'done', true),
    jsonb_build_object('key', 'paid', 'label', 'Payment confirmed', 'at', v_order.paid_at, 'done', v_order.payment_status = 'paid'),
    jsonb_build_object('key', 'preparing', 'label', 'Preparing your fish', 'at', null, 'done', v_order.status in ('processing', 'dispatched', 'delivered')),
    jsonb_build_object('key', 'dispatched', 'label', 'Out for delivery', 'at', null, 'done', v_order.status in ('dispatched', 'delivered')),
    jsonb_build_object('key', 'delivered', 'label', 'Delivered', 'at', null, 'done', v_order.status = 'delivered')
  );

  if v_order.status in ('cancelled', 'refunded') then
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
