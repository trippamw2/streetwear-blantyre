-- Lake Fresh P1 trust follow up.
-- 1. Named brand permissions replace broad brand membership.
-- 2. Packed weights and final totals are written only through server owned RPCs.
-- 3. Customers confirm the final total; dispatch and delivery wait for that confirmation.
-- 4. Audit records are append only and brand scoped.
-- 5. Lot, supplier, QA and recall records give the fish a traceable paper trail.

-- ---------------------------------------------------------------------------
-- 1. Named brand permissions
-- ---------------------------------------------------------------------------
create or replace function public.lf_permissions_for_role(p_role text)
returns text[]
language sql
immutable
set search_path = public
as $$
  select case lower(coalesce(p_role, ''))
    when 'owner' then array['*']
    when 'admin' then array['*']
    when 'lf_manager' then array[
      'brand.access', 'email.transactional', 'email.admin_notification', 'email.broadcast',
      'lf.orders.read', 'lf.orders.write', 'lf.reconcile.write', 'lf.stock.write',
      'lf.delivery.write', 'lf.suppliers.read', 'lf.suppliers.write',
      'lf.traceability.read', 'lf.traceability.write', 'lf.audit.read',
      'suppliers.read', 'suppliers.write', 'audit.read'
    ]
    when 'lf_fulfillment' then array[
      'brand.access', 'email.transactional', 'lf.orders.read', 'lf.orders.write',
      'lf.reconcile.write', 'lf.stock.write', 'lf.delivery.write',
      'lf.suppliers.read', 'lf.traceability.read', 'lf.audit.read'
    ]
    when 'sb_manager' then array[
      'brand.access', 'email.transactional', 'email.admin_notification', 'email.broadcast',
      'sb.orders.read', 'sb.orders.write', 'suppliers.read', 'suppliers.write', 'audit.read'
    ]
    when 'sb_fulfillment' then array[
      'brand.access', 'email.transactional', 'sb.orders.read', 'sb.orders.write', 'suppliers.read'
    ]
    else array['brand.access']
  end;
$$;

create or replace function public.user_has_brand_permission(
  p_user_id uuid,
  p_brand_id uuid,
  p_permission text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_permission text := lower(btrim(coalesce(p_permission, '')));
begin
  if p_user_id is null or p_brand_id is null or v_permission = '' then
    return false;
  end if;

  if not exists (select 1 from public.brands where id = p_brand_id and is_active = true) then
    return false;
  end if;

  if exists (
    select 1 from public.user_roles
    where user_id = p_user_id and role = 'admin'::app_role
  ) then
    return true;
  end if;

  return exists (
    select 1
    from public.staff_permissions sp
    where sp.user_id = p_user_id
      and (
        sp.brand_id = p_brand_id
        or (sp.brand_id is null and sp.role = 'owner')
      )
      and (
        coalesce(sp.permissions ->> '*', '') = 'true'
        or sp.permissions ? v_permission
        or v_permission = any(public.lf_permissions_for_role(sp.role))
      )
  );
end;
$$;

create or replace function public.has_brand_permission(p_brand_id uuid, p_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.user_has_brand_permission(auth.uid(), p_brand_id, p_permission);
$$;

-- Backfill existing staff rows so named permissions do not lock anyone out.
do $$
declare
  r record;
  v_permissions jsonb;
  v_permission text;
begin
  for r in select id, role, permissions from public.staff_permissions loop
    v_permissions := coalesce(r.permissions, '{}'::jsonb);
    if jsonb_typeof(v_permissions) <> 'object' then
      v_permissions := '{}'::jsonb;
    end if;

    foreach v_permission in array public.lf_permissions_for_role(r.role) loop
      v_permissions := jsonb_set(v_permissions, array[v_permission], 'true'::jsonb, true);
    end loop;

    update public.staff_permissions
    set permissions = v_permissions
    where id = r.id;
  end loop;
end $$;

create or replace function public.lf_apply_default_permissions()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_permission text;
begin
  new.permissions := coalesce(new.permissions, '{}'::jsonb);
  if jsonb_typeof(new.permissions) <> 'object' then
    new.permissions := '{}'::jsonb;
  end if;

  foreach v_permission in array public.lf_permissions_for_role(new.role) loop
    new.permissions := jsonb_set(new.permissions, array[v_permission], 'true'::jsonb, true);
  end loop;

  return new;
end;
$$;

drop trigger if exists lf_staff_permissions_defaults on public.staff_permissions;
create trigger lf_staff_permissions_defaults
  before insert or update of role, permissions on public.staff_permissions
  for each row execute function public.lf_apply_default_permissions();

-- Keep the old helper working for code that only needs brand entry, but make it
-- depend on the named permission instead of raw membership.
create or replace function public.has_brand_access(_brand_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_brand_permission(_brand_id, 'brand.access');
$$;

revoke all on function public.user_has_brand_permission(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.user_has_brand_permission(uuid, uuid, text) to service_role;
revoke all on function public.has_brand_permission(uuid, text) from anon;
grant execute on function public.has_brand_permission(uuid, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Append only guard
-- ---------------------------------------------------------------------------
create or replace function public.lf_reject_audit_changes()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Audit records cannot be changed or removed';
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Server owned reconciliation
-- ---------------------------------------------------------------------------
create table if not exists public.lf_reconciliation_audit (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  reconciliation_id uuid references public.price_reconciliation(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  estimated_total_mwk integer,
  final_total_mwk integer,
  difference_mwk integer,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists lf_reconciliation_audit_order_idx
  on public.lf_reconciliation_audit (order_id, created_at desc);

alter table public.lf_reconciliation_audit enable row level security;
drop policy if exists lf_reconciliation_audit_read on public.lf_reconciliation_audit;
create policy lf_reconciliation_audit_read on public.lf_reconciliation_audit
  for select to authenticated
  using (public.has_brand_permission(brand_id, 'lf.audit.read'));

revoke all on table public.lf_reconciliation_audit from anon;
revoke insert, update, delete on table public.lf_reconciliation_audit from authenticated;
grant select on table public.lf_reconciliation_audit to authenticated;

drop trigger if exists lf_reconciliation_audit_append_only on public.lf_reconciliation_audit;
create trigger lf_reconciliation_audit_append_only
  before update or delete on public.lf_reconciliation_audit
  for each row execute function public.lf_reject_audit_changes();

create or replace function public.lf_admin_save_preparation(
  p_preparation_id uuid,
  p_packed_weight_kg numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prep public.order_preparation%rowtype;
  v_order public.orders%rowtype;
  v_reconciliation public.price_reconciliation%rowtype;
  v_line_final integer;
  v_difference integer;
  v_final_total integer;
begin
  if auth.uid() is null or p_packed_weight_kg is null or p_packed_weight_kg <= 0
     or p_packed_weight_kg > 1000 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_weight');
  end if;

  select op.* into v_prep
  from public.order_preparation op
  where op.id = p_preparation_id
  for update of op;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if v_prep.brand_id <> '22222222-2222-2222-2222-222222222222'::uuid
     or not public.has_brand_permission(v_prep.brand_id, 'lf.reconcile.write') then
    return jsonb_build_object('ok', false, 'reason', 'no_access');
  end if;

  if v_prep.price_per_kg_mwk is null or v_prep.price_per_kg_mwk <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'price_missing');
  end if;

  select o.* into v_order
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where oi.id = v_prep.order_item_id
  for update of o;

  if not found or v_order.status in (
    'delivered'::public.order_status,
    'cancelled'::public.order_status,
    'refunded'::public.order_status
  ) then
    return jsonb_build_object('ok', false, 'reason', 'order_not_editable');
  end if;

  v_line_final := round(v_prep.price_per_kg_mwk::numeric * p_packed_weight_kg)::integer;

  update public.order_preparation
  set packed_weight_kg = p_packed_weight_kg,
      final_price_mwk = v_line_final,
      reconciled_at = now(),
      reconciled_by = auth.uid()
  where id = p_preparation_id;

  select pr.* into v_reconciliation
  from public.price_reconciliation pr
  where pr.order_id = v_order.id
  order by pr.created_at desc
  limit 1
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'reconciliation_missing');
  end if;

  select coalesce(sum(round(
    op.final_price_mwk::numeric
    - coalesce(op.requested_weight_kg, 0)::numeric * coalesce(op.price_per_kg_mwk, 0)::numeric
  ))::integer, 0)
  into v_difference
  from public.order_preparation op
  join public.order_items oi on oi.id = op.order_item_id
  where oi.order_id = v_order.id
    and op.final_price_mwk is not null;

  v_final_total := v_reconciliation.estimated_total_mwk + v_difference;

  update public.price_reconciliation
  set final_total_mwk = v_final_total,
      difference_mwk = v_difference,
      status = 'awaiting_confirmation',
      customer_confirmed_at = null,
      confirmed_by = null
  where id = v_reconciliation.id;

  insert into public.lf_reconciliation_audit (
    brand_id, reconciliation_id, order_id, actor_id, action,
    estimated_total_mwk, final_total_mwk, difference_mwk, details
  ) values (
    v_reconciliation.brand_id, v_reconciliation.id, v_order.id, auth.uid(),
    'admin_final_weight', v_reconciliation.estimated_total_mwk, v_final_total,
    v_difference, jsonb_build_object(
      'preparation_id', p_preparation_id,
      'packed_weight_kg', p_packed_weight_kg,
      'line_final_mwk', v_line_final
    )
  );

  return jsonb_build_object(
    'ok', true,
    'preparation_id', p_preparation_id,
    'final_total_mwk', v_final_total,
    'difference_mwk', v_difference,
    'status', 'awaiting_confirmation'
  );
end;
$$;

create or replace function public.lf_customer_confirm_reconciliation(
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
  v_reconciliation public.price_reconciliation%rowtype;
  v_user_id uuid := auth.uid();
  v_token uuid;
  v_method text;
begin
  if nullif(btrim(coalesce(p_access_token, '')), '') is not null then
    begin
      v_token := nullif(btrim(p_access_token), '')::uuid;
    exception when invalid_text_representation then
      return jsonb_build_object('ok', false, 'reason', 'unauthorized');
    end;
  end if;

  select o.* into v_order
  from public.orders o
  where o.id = p_order_id
    and o.brand_id = '22222222-2222-2222-2222-222222222222'::uuid
  for update of o;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if v_user_id is not null and v_order.user_id = v_user_id then
    v_method := 'account';
  elsif v_token is not null and v_order.guest_access_token = v_token then
    v_method := 'guest_token';
  else
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;

  select pr.* into v_reconciliation
  from public.price_reconciliation pr
  where pr.order_id = v_order.id
  order by pr.created_at desc
  limit 1
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if v_reconciliation.status = 'confirmed' then
    return jsonb_build_object('ok', true, 'already_confirmed', true);
  end if;

  if v_reconciliation.final_total_mwk is null
     or v_reconciliation.status <> 'awaiting_confirmation' then
    return jsonb_build_object('ok', false, 'reason', 'not_ready');
  end if;

  update public.price_reconciliation
  set status = 'confirmed',
      customer_confirmed_at = now(),
      confirmed_by = case when v_method = 'account' then v_user_id else null end
  where id = v_reconciliation.id;

  insert into public.lf_reconciliation_audit (
    brand_id, reconciliation_id, order_id, actor_id, action,
    estimated_total_mwk, final_total_mwk, difference_mwk, details
  ) values (
    v_reconciliation.brand_id, v_reconciliation.id, v_order.id, v_user_id,
    'customer_confirmed', v_reconciliation.estimated_total_mwk,
    v_reconciliation.final_total_mwk, v_reconciliation.difference_mwk,
    jsonb_build_object('method', v_method)
  );

  return jsonb_build_object(
    'ok', true,
    'status', 'confirmed',
    'final_total_mwk', v_reconciliation.final_total_mwk
  );
end;
$$;

revoke all on function public.lf_admin_save_preparation(uuid, numeric) from public, anon;
grant execute on function public.lf_admin_save_preparation(uuid, numeric) to authenticated, service_role;
revoke all on function public.lf_customer_confirm_reconciliation(uuid, text) from public;
grant execute on function public.lf_customer_confirm_reconciliation(uuid, text) to anon, authenticated, service_role;

revoke insert, update, delete on table public.order_preparation from authenticated;
grant select on table public.order_preparation to authenticated;
revoke insert, update, delete on table public.price_reconciliation from authenticated;
grant select on table public.price_reconciliation to authenticated;

-- Order detail now shows whether the customer has agreed to the final total.
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
     and (v_order.user_id = auth.uid()
          or public.has_brand_permission(v_order.brand_id, 'lf.orders.read')) then
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
    'difference_mwk', pr.difference_mwk,
    'customer_confirmed_at', pr.customer_confirmed_at
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

-- Status changes now require a named permission and customer confirmation.
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
  v_reconciliation_status text;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'order_not_found');
  end if;

  if not public.has_brand_permission(v_order.brand_id, 'lf.orders.write') then
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

  if v_order.brand_id = '22222222-2222-2222-2222-222222222222'::uuid
     and p_status in ('dispatched'::public.order_status, 'delivered'::public.order_status) then
    select pr.status into v_reconciliation_status
    from public.price_reconciliation pr
    where pr.order_id = v_order.id
    order by pr.created_at desc
    limit 1;

    if v_reconciliation_status is distinct from 'confirmed' then
      return jsonb_build_object('ok', false, 'reason', 'confirmation_required');
    end if;
  end if;

  if p_status = 'refunded' and coalesce(trim(p_reason), '') = '' then
    return jsonb_build_object('ok', false, 'reason', 'reason_required');
  end if;

  update public.orders
  set status = p_status,
      payment_status = case when p_status = 'refunded' then 'refunded' else payment_status end,
      updated_at = now()
  where id = p_order_id;

  if v_order.status not in ('cancelled'::public.order_status, 'refunded'::public.order_status)
     and p_status in ('cancelled'::public.order_status, 'refunded'::public.order_status) then
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

revoke all on function public.lf_set_order_status(
  uuid, public.order_status, text, text, jsonb
) from public, anon;
grant execute on function public.lf_set_order_status(
  uuid, public.order_status, text, text, jsonb
) to authenticated, service_role;

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

  if auth.uid() is null
     or not public.has_brand_permission(v_order.brand_id, 'lf.delivery.write') then
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
-- 4. Append only audit policies
-- ---------------------------------------------------------------------------
drop policy if exists lf_refund_audit_admin_all on public.lf_refund_audit;
create policy lf_refund_audit_read on public.lf_refund_audit
  for select to authenticated
  using (public.has_brand_permission(brand_id, 'lf.audit.read'));

revoke insert, update, delete on table public.lf_refund_audit from authenticated;
grant select on table public.lf_refund_audit to authenticated;

drop trigger if exists lf_refund_audit_append_only on public.lf_refund_audit;
create trigger lf_refund_audit_append_only
  before update or delete on public.lf_refund_audit
  for each row execute function public.lf_reject_audit_changes();

alter table public.auth_audit_log
  add column if not exists brand_id uuid references public.brands(id) on delete cascade
  default '11111111-1111-1111-1111-111111111111';
update public.auth_audit_log
set brand_id = '11111111-1111-1111-1111-111111111111'
where brand_id is null;

drop policy if exists "Admins can manage audit log" on public.auth_audit_log;
create policy auth_audit_log_read on public.auth_audit_log
  for select to authenticated
  using (public.has_brand_permission(brand_id, 'audit.read'));

revoke update, delete on table public.auth_audit_log from authenticated;
grant select on table public.auth_audit_log to authenticated;

drop trigger if exists lf_auth_audit_append_only on public.auth_audit_log;
create trigger lf_auth_audit_append_only
  before update or delete on public.auth_audit_log
  for each row execute function public.lf_reject_audit_changes();

drop policy if exists lf_delivery_events_admin_read on public.lf_delivery_events;
create policy lf_delivery_events_admin_read on public.lf_delivery_events
  for select to authenticated
  using (public.has_brand_permission(brand_id, 'lf.audit.read'));

drop trigger if exists lf_delivery_events_append_only on public.lf_delivery_events;
create trigger lf_delivery_events_append_only
  before update or delete on public.lf_delivery_events
  for each row execute function public.lf_reject_audit_changes();

-- ---------------------------------------------------------------------------
-- 5. Lot, supplier, QA and recall traceability
-- ---------------------------------------------------------------------------
create unique index if not exists suppliers_id_brand_idx
  on public.suppliers (id, brand_id);

drop policy if exists "Public read suppliers" on public.suppliers;
drop policy if exists "Admin manage suppliers" on public.suppliers;
create policy suppliers_brand_read on public.suppliers
  for select to authenticated
  using (public.has_brand_permission(brand_id, 'suppliers.read'));
create policy suppliers_brand_write on public.suppliers
  for all to authenticated
  using (public.has_brand_permission(brand_id, 'suppliers.write'))
  with check (public.has_brand_permission(brand_id, 'suppliers.write'));

revoke all on table public.suppliers from anon;
grant select, insert, update, delete on table public.suppliers to authenticated;

create table if not exists public.lf_lot_records (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '22222222-2222-2222-2222-222222222222'
    references public.brands(id) on delete cascade,
  lot_code text not null,
  species_id uuid references public.fish_species(id) on delete set null,
  supplier_id uuid,
  supplier_brand_id uuid default '22222222-2222-2222-2222-222222222222'
    references public.brands(id) on delete set null,
  source_location text,
  received_date date not null default current_date,
  expiry_date date,
  weight_kg_received numeric(10,3) not null default 0,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, lot_code)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'lf_lot_records_supplier_fk'
  ) then
    alter table public.lf_lot_records
      add constraint lf_lot_records_supplier_fk
      foreign key (supplier_id, supplier_brand_id)
      references public.suppliers (id, brand_id)
      on delete set null;
  end if;
end $$;

create table if not exists public.lf_qa_checks (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '22222222-2222-2222-2222-222222222222'
    references public.brands(id) on delete cascade,
  lot_id uuid references public.lf_lot_records(id) on delete cascade,
  batch_id uuid references public.fish_inventory_batches(id) on delete cascade,
  check_type text not null,
  result text not null check (result in ('passed', 'failed', 'holding')),
  checked_by uuid references auth.users(id) on delete set null,
  checked_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.lf_recall_events (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '22222222-2222-2222-2222-222222222222'
    references public.brands(id) on delete cascade,
  recall_ref text not null,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  started_at timestamptz not null default now(),
  closed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (brand_id, recall_ref)
);

create table if not exists public.lf_recall_lots (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '22222222-2222-2222-2222-222222222222'
    references public.brands(id) on delete cascade,
  recall_id uuid not null references public.lf_recall_events(id) on delete cascade,
  lot_id uuid not null references public.lf_lot_records(id) on delete cascade,
  affected_weight_kg numeric(10,3),
  action_taken text,
  created_at timestamptz not null default now(),
  unique (recall_id, lot_id)
);

alter table public.fish_inventory_batches
  add column if not exists lot_id uuid references public.lf_lot_records(id) on delete set null,
  add column if not exists supplier_id uuid,
  add column if not exists supplier_brand_id uuid default '22222222-2222-2222-2222-222222222222'
    references public.brands(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'fish_inventory_batches_supplier_fk'
  ) then
    alter table public.fish_inventory_batches
      add constraint fish_inventory_batches_supplier_fk
      foreign key (supplier_id, supplier_brand_id)
      references public.suppliers (id, brand_id)
      on delete set null;
  end if;
end $$;

create index if not exists lf_lot_records_brand_idx on public.lf_lot_records (brand_id, received_date desc);
create index if not exists lf_qa_checks_brand_idx on public.lf_qa_checks (brand_id, checked_at desc);
create index if not exists lf_recall_events_brand_idx on public.lf_recall_events (brand_id, started_at desc);

alter table public.lf_lot_records enable row level security;
alter table public.lf_qa_checks enable row level security;
alter table public.lf_recall_events enable row level security;
alter table public.lf_recall_lots enable row level security;

drop policy if exists lf_lot_records_read on public.lf_lot_records;
create policy lf_lot_records_read on public.lf_lot_records
  for select to authenticated
  using (public.has_brand_permission(brand_id, 'lf.traceability.read'));
drop policy if exists lf_lot_records_write on public.lf_lot_records;
create policy lf_lot_records_write on public.lf_lot_records
  for all to authenticated
  using (public.has_brand_permission(brand_id, 'lf.traceability.write'))
  with check (public.has_brand_permission(brand_id, 'lf.traceability.write'));

drop policy if exists lf_qa_checks_read on public.lf_qa_checks;
create policy lf_qa_checks_read on public.lf_qa_checks
  for select to authenticated
  using (public.has_brand_permission(brand_id, 'lf.traceability.read'));
drop policy if exists lf_qa_checks_write on public.lf_qa_checks;
create policy lf_qa_checks_write on public.lf_qa_checks
  for all to authenticated
  using (public.has_brand_permission(brand_id, 'lf.traceability.write'))
  with check (public.has_brand_permission(brand_id, 'lf.traceability.write'));

drop policy if exists lf_recall_events_read on public.lf_recall_events;
create policy lf_recall_events_read on public.lf_recall_events
  for select to authenticated
  using (public.has_brand_permission(brand_id, 'lf.traceability.read'));
drop policy if exists lf_recall_events_write on public.lf_recall_events;
create policy lf_recall_events_write on public.lf_recall_events
  for all to authenticated
  using (public.has_brand_permission(brand_id, 'lf.traceability.write'))
  with check (public.has_brand_permission(brand_id, 'lf.traceability.write'));

drop policy if exists lf_recall_lots_read on public.lf_recall_lots;
create policy lf_recall_lots_read on public.lf_recall_lots
  for select to authenticated
  using (public.has_brand_permission(brand_id, 'lf.traceability.read'));
drop policy if exists lf_recall_lots_write on public.lf_recall_lots;
create policy lf_recall_lots_write on public.lf_recall_lots
  for all to authenticated
  using (public.has_brand_permission(brand_id, 'lf.traceability.write'))
  with check (public.has_brand_permission(brand_id, 'lf.traceability.write'));

revoke all on table public.lf_lot_records from anon;
revoke all on table public.lf_qa_checks from anon;
revoke all on table public.lf_recall_events from anon;
revoke all on table public.lf_recall_lots from anon;
grant select, insert, update, delete on table public.lf_lot_records to authenticated;
grant select, insert, update, delete on table public.lf_qa_checks to authenticated;
grant select, insert, update, delete on table public.lf_recall_events to authenticated;
grant select, insert, update, delete on table public.lf_recall_lots to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Stale privilege cleanup
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regprocedure('public.lf_public_order_detail(uuid)') is not null then
    execute 'revoke all on function public.lf_public_order_detail(uuid) from public, anon, authenticated';
  end if;
end $$;
