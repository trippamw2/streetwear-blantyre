-- Lake Fresh P3 operations consolidation.
-- 1. Dispatch requires a lot, a passing quality check and no open recall.
-- 2. Team permissions are assigned through an audited server owned RPC.
-- 3. Named team permissions allow safe read access for Lake Fresh managers.

-- ---------------------------------------------------------------------------
-- 1. Named team permissions
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
      'lf.team.read', 'lf.team.write', 'suppliers.read', 'suppliers.write', 'audit.read'
    ]
    when 'lf_fulfillment' then array[
      'brand.access', 'email.transactional', 'lf.orders.read', 'lf.orders.write',
      'lf.reconcile.write', 'lf.stock.write', 'lf.delivery.write',
      'lf.suppliers.read', 'lf.traceability.read', 'lf.audit.read', 'lf.team.read'
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

-- Existing staff keep access to the new team screens after the role changes.
update public.staff_permissions
set permissions = coalesce(permissions, '{}'::jsonb)
  || jsonb_build_object('lf.team.read', true, 'lf.team.write', true)
where brand_id = '22222222-2222-2222-2222-222222222222'::uuid
  and lower(role) = 'lf_manager';

update public.staff_permissions
set permissions = coalesce(permissions, '{}'::jsonb)
  || jsonb_build_object('lf.team.read', true)
where brand_id = '22222222-2222-2222-2222-222222222222'::uuid
  and lower(role) = 'lf_fulfillment';

drop policy if exists lf_staff_permissions_read on public.staff_permissions;
create policy lf_staff_permissions_read on public.staff_permissions
  for select to authenticated
  using (
    brand_id = '22222222-2222-2222-2222-222222222222'::uuid
    and public.has_brand_permission(brand_id, 'lf.team.read')
  );

-- Staff writes now go through the audited functions below.
revoke insert, update, delete on table public.staff_permissions from authenticated;
grant select on table public.staff_permissions to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Audited team permission RPCs
-- ---------------------------------------------------------------------------
create or replace function public.lf_admin_set_staff_permission(
  p_user_id uuid,
  p_brand_id uuid,
  p_role text,
  p_permissions jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_is_service boolean := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  ) = 'service_role';
  v_allowed text[] := array[
    '*', 'brand.access', 'email.transactional', 'email.admin_notification', 'email.broadcast',
    'lf.orders.read', 'lf.orders.write', 'lf.reconcile.write', 'lf.stock.write',
    'lf.delivery.write', 'lf.suppliers.read', 'lf.suppliers.write',
    'lf.traceability.read', 'lf.traceability.write', 'lf.audit.read',
    'lf.team.read', 'lf.team.write'
  ];
  v_permissions jsonb := coalesce(p_permissions, '{}'::jsonb);
  v_key text;
  v_role text := lower(btrim(coalesce(p_role, '')));
begin
  if p_brand_id is distinct from '22222222-2222-2222-2222-222222222222'::uuid then
    return jsonb_build_object('ok', false, 'reason', 'no_access');
  end if;

  if p_user_id is null or v_role = '' then
    return jsonb_build_object('ok', false, 'reason', 'invalid_input');
  end if;

  if v_role not in ('owner', 'admin', 'lf_manager', 'lf_fulfillment') then
    return jsonb_build_object('ok', false, 'reason', 'invalid_role');
  end if;

  if not exists (select 1 from auth.users where id = p_user_id) then
    return jsonb_build_object('ok', false, 'reason', 'user_not_found');
  end if;

  if not v_is_service
     and not exists (
       select 1 from public.user_roles
       where user_id = v_caller and role = 'admin'
     )
     and not public.has_brand_permission(p_brand_id, 'lf.team.write') then
    return jsonb_build_object('ok', false, 'reason', 'no_access');
  end if;

  if jsonb_typeof(v_permissions) <> 'object' then
    return jsonb_build_object('ok', false, 'reason', 'invalid_permissions');
  end if;

  for v_key in select jsonb_object_keys(v_permissions) loop
    if not (v_key = any(v_allowed)) then
      return jsonb_build_object('ok', false, 'reason', 'invalid_permission');
    end if;
  end loop;

  insert into public.staff_permissions (user_id, brand_id, role, permissions)
  values (p_user_id, p_brand_id, v_role, v_permissions)
  on conflict (user_id, brand_id, role)
  do update set permissions = excluded.permissions;

  insert into public.auth_audit_log (
    admin_user_id, action, target_type, target_id, details, brand_id
  ) values (
    coalesce(v_caller, '00000000-0000-0000-0000-000000000000'::uuid),
    'lf_staff_permission_set', 'staff_permission', p_user_id::text,
    jsonb_build_object('brand_id', p_brand_id, 'role', v_role, 'permissions', v_permissions),
    p_brand_id
  );

  return jsonb_build_object('ok', true, 'user_id', p_user_id, 'role', v_role);
end;
$$;

create or replace function public.lf_admin_remove_staff_permission(
  p_user_id uuid,
  p_brand_id uuid,
  p_role text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_is_service boolean := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  ) = 'service_role';
  v_role text := lower(btrim(coalesce(p_role, '')));
  v_removed integer := 0;
begin
  if p_brand_id is distinct from '22222222-2222-2222-2222-222222222222'::uuid then
    return jsonb_build_object('ok', false, 'reason', 'no_access');
  end if;

  if not v_is_service
     and not exists (
       select 1 from public.user_roles
       where user_id = v_caller and role = 'admin'
     )
     and not public.has_brand_permission(p_brand_id, 'lf.team.write') then
    return jsonb_build_object('ok', false, 'reason', 'no_access');
  end if;

  delete from public.staff_permissions
  where user_id = p_user_id and brand_id = p_brand_id and lower(role) = v_role;
  get diagnostics v_removed = row_count;

  insert into public.auth_audit_log (
    admin_user_id, action, target_type, target_id, details, brand_id
  ) values (
    coalesce(v_caller, '00000000-0000-0000-0000-000000000000'::uuid),
    'lf_staff_permission_removed', 'staff_permission', p_user_id::text,
    jsonb_build_object('brand_id', p_brand_id, 'role', v_role, 'removed', v_removed),
    p_brand_id
  );

  return jsonb_build_object('ok', true, 'removed', v_removed);
end;
$$;

revoke all on function public.lf_admin_set_staff_permission(uuid, uuid, text, jsonb) from public, anon;
grant execute on function public.lf_admin_set_staff_permission(uuid, uuid, text, jsonb) to authenticated, service_role;
revoke all on function public.lf_admin_remove_staff_permission(uuid, uuid, text) from public, anon;
grant execute on function public.lf_admin_remove_staff_permission(uuid, uuid, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Dispatch quality guard
-- ---------------------------------------------------------------------------
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
  v_fish_reservations integer := 0;
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

  -- Fish leaving the pack house must have a lot, a passing check and no open
  -- recall. Seasoning only orders have no fish reservations and skip this guard.
  if v_order.brand_id = '22222222-2222-2222-2222-222222222222'::uuid
     and p_status = 'dispatched'::public.order_status then
    select count(*) into v_fish_reservations
    from public.fish_stock_reservations r
    where r.order_id = v_order.id
      and r.brand_id = v_order.brand_id
      and r.status = 'reserved';

    if v_fish_reservations > 0 then
      if exists (
        select 1
        from public.fish_stock_reservations r
        join public.fish_inventory_batches b on b.id = r.batch_id
        where r.order_id = v_order.id
          and r.brand_id = v_order.brand_id
          and r.status = 'reserved'
          and b.lot_id is null
      ) then
        return jsonb_build_object('ok', false, 'reason', 'lot_required');
      end if;

      if exists (
        select 1
        from public.fish_stock_reservations r
        join public.fish_inventory_batches b on b.id = r.batch_id
        join public.lf_qa_checks q
          on q.brand_id = v_order.brand_id
         and (q.batch_id = b.id or q.lot_id = b.lot_id)
        where r.order_id = v_order.id
          and r.brand_id = v_order.brand_id
          and r.status = 'reserved'
          and q.result in ('failed', 'holding')
      ) then
        return jsonb_build_object('ok', false, 'reason', 'qa_hold');
      end if;

      if exists (
        select 1
        from public.fish_stock_reservations r
        join public.fish_inventory_batches b on b.id = r.batch_id
        where r.order_id = v_order.id
          and r.brand_id = v_order.brand_id
          and r.status = 'reserved'
          and not exists (
            select 1
            from public.lf_qa_checks q
            where q.brand_id = v_order.brand_id
              and q.result = 'passed'
              and (q.batch_id = b.id or q.lot_id = b.lot_id)
          )
      ) then
        return jsonb_build_object('ok', false, 'reason', 'qa_required');
      end if;

      if exists (
        select 1
        from public.fish_stock_reservations r
        join public.fish_inventory_batches b on b.id = r.batch_id
        join public.lf_recall_lots rl on rl.lot_id = b.lot_id
        join public.lf_recall_events re on re.id = rl.recall_id
        where r.order_id = v_order.id
          and r.brand_id = v_order.brand_id
          and r.status = 'reserved'
          and re.brand_id = v_order.brand_id
          and re.status = 'open'
      ) then
        return jsonb_build_object('ok', false, 'reason', 'recall_hold');
      end if;
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
