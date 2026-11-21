-- Safe read-only order detail for guests after payment return.
-- Returns only fields needed on the order confirmation page.
create or replace function public.lf_public_order_detail(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_items jsonb;
  v_reconciliation jsonb;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
    and brand_id = '22222222-2222-2222-2222-222222222222'::uuid;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
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

grant execute on function public.lf_public_order_detail(uuid) to anon, authenticated;
