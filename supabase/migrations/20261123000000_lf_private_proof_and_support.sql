-- Lake Fresh P2: private delivery proof and customer support.
-- 1. Proof photos live in a private bucket and are stored as object paths.
-- 2. Order completion validates the private path before writing it.
-- 3. Support tickets and messages give customers a tracked help path.
-- 4. SLA breaches are written to an append only event log.

-- ---------------------------------------------------------------------------
-- 1. Private delivery proof bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lf-delivery-proof',
  'lf-delivery-proof',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "LF delivery proof upload" on storage.objects;
create policy "LF delivery proof upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'lf-delivery-proof'
    and split_part(name, '/', 1) = 'lf'
    and name ~ '^lf/[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}\.(jpg|jpeg|png|webp)$'
    and public.has_brand_permission(
      '22222222-2222-2222-2222-222222222222'::uuid, 'lf.delivery.write'
    )
  );

drop policy if exists "LF delivery proof read" on storage.objects;
create policy "LF delivery proof read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'lf-delivery-proof'
    and split_part(name, '/', 1) = 'lf'
    and public.has_brand_permission(
      '22222222-2222-2222-2222-222222222222'::uuid, 'lf.orders.read'
    )
  );

drop policy if exists "LF delivery proof delete" on storage.objects;
create policy "LF delivery proof delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'lf-delivery-proof'
    and split_part(name, '/', 1) = 'lf'
    and public.has_brand_permission(
      '22222222-2222-2222-2222-222222222222'::uuid, 'lf.delivery.write'
    )
  );

-- Only accept new private object paths. Existing public URLs are left alone so
-- historical deliveries stay readable.
create or replace function public.lf_enforce_delivery_proof()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proof text := btrim(coalesce(new.delivery_proof_url, ''));
begin
  if new.brand_id = '22222222-2222-2222-2222-222222222222'::uuid
     and new.status = 'delivered'::public.order_status
     and old.status is distinct from 'delivered'::public.order_status then
    if v_proof = '' then
      raise exception 'Delivery proof is required before an order can be marked delivered';
    end if;

    if new.delivery_proof_url is distinct from old.delivery_proof_url
       and v_proof !~ '^lf/[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}\.(jpg|jpeg|png|webp)$' then
      raise exception 'Delivery proof must be a private Lake Fresh object path';
    end if;
  end if;

  return new;
end;
$$;

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
  v_proof_path text := btrim(coalesce(p_proof_url, ''));
begin
  if v_proof_path = '' then
    return jsonb_build_object('ok', false, 'reason', 'proof_required');
  end if;

  if v_proof_path !~ '^lf/[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}\.(jpg|jpeg|png|webp)$' then
    return jsonb_build_object('ok', false, 'reason', 'invalid_proof_path');
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

  if split_part(v_proof_path, '/', 2) <> v_order.id::text then
    return jsonb_build_object('ok', false, 'reason', 'proof_order_mismatch');
  end if;

  update public.orders
  set delivery_proof_url = v_proof_path,
      delivered_by = auth.uid(),
      updated_at = now()
  where id = p_order_id;

  v_result := public.lf_set_order_status(
    p_order_id,
    'delivered'::public.order_status,
    coalesce(v_note, 'Delivery completed with photo proof'),
    null,
    jsonb_build_object('proof_path', v_proof_path)
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
  values (v_order.brand_id, p_order_id, auth.uid(), v_proof_path, v_note);

  return jsonb_build_object('ok', true, 'order_id', p_order_id, 'status', 'delivered');
end;
$$;

revoke all on function public.lf_mark_delivery_result(uuid, text, text) from public, anon;
grant execute on function public.lf_mark_delivery_result(uuid, text, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Support tickets
-- ---------------------------------------------------------------------------
create table if not exists public.lf_support_tickets (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '22222222-2222-2222-2222-222222222222'
    references public.brands(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  requester_user_id uuid references auth.users(id) on delete set null,
  access_token uuid,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  subject text not null,
  category text not null default 'delivery',
  status text not null default 'open'
    check (status in ('open', 'waiting', 'resolved', 'closed')),
  priority text not null default 'normal' check (priority in ('normal', 'urgent')),
  sla_due_at timestamptz not null default (now() + interval '4 hours'),
  sla_breached_at timestamptz,
  first_response_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lf_support_messages (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '22222222-2222-2222-2222-222222222222'
    references public.brands(id) on delete cascade,
  ticket_id uuid not null references public.lf_support_tickets(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text not null check (actor_role in ('customer', 'staff')),
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.lf_support_events (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '22222222-2222-2222-2222-222222222222'
    references public.brands(id) on delete cascade,
  ticket_id uuid references public.lf_support_tickets(id) on delete cascade,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists lf_support_tickets_brand_idx
  on public.lf_support_tickets (brand_id, status, created_at desc);
create index if not exists lf_support_messages_ticket_idx
  on public.lf_support_messages (ticket_id, created_at);

alter table public.lf_support_tickets enable row level security;
alter table public.lf_support_messages enable row level security;
alter table public.lf_support_events enable row level security;

drop policy if exists lf_support_tickets_staff_read on public.lf_support_tickets;
create policy lf_support_tickets_staff_read on public.lf_support_tickets
  for select to authenticated
  using (public.has_brand_permission(brand_id, 'lf.orders.read'));
drop policy if exists lf_support_tickets_owner_read on public.lf_support_tickets;
create policy lf_support_tickets_owner_read on public.lf_support_tickets
  for select to authenticated
  using (requester_user_id = auth.uid());

drop policy if exists lf_support_messages_staff_read on public.lf_support_messages;
create policy lf_support_messages_staff_read on public.lf_support_messages
  for select to authenticated
  using (public.has_brand_permission(brand_id, 'lf.orders.read'));
drop policy if exists lf_support_messages_owner_read on public.lf_support_messages;
create policy lf_support_messages_owner_read on public.lf_support_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.lf_support_tickets t
      where t.id = lf_support_messages.ticket_id and t.requester_user_id = auth.uid()
    )
  );

drop policy if exists lf_support_events_read on public.lf_support_events;
create policy lf_support_events_read on public.lf_support_events
  for select to authenticated
  using (public.has_brand_permission(brand_id, 'lf.audit.read'));

revoke all on table public.lf_support_tickets from anon;
revoke all on table public.lf_support_messages from anon;
revoke all on table public.lf_support_events from anon;
revoke insert, update, delete on table public.lf_support_tickets from authenticated;
revoke insert, update, delete on table public.lf_support_messages from authenticated;
revoke insert, update, delete on table public.lf_support_events from authenticated;
grant select on table public.lf_support_tickets to authenticated;
grant select on table public.lf_support_messages to authenticated;
grant select on table public.lf_support_events to authenticated;

drop trigger if exists lf_support_messages_append_only on public.lf_support_messages;
create trigger lf_support_messages_append_only
  before update or delete on public.lf_support_messages
  for each row execute function public.lf_reject_audit_changes();
drop trigger if exists lf_support_events_append_only on public.lf_support_events;
create trigger lf_support_events_append_only
  before update or delete on public.lf_support_events
  for each row execute function public.lf_reject_audit_changes();

create or replace function public.lf_customer_open_ticket(
  p_order_id uuid default null,
  p_access_token text default null,
  p_subject text default null,
  p_category text default 'delivery',
  p_body text default null,
  p_priority text default 'normal',
  p_customer_email text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_token uuid;
  v_user_id uuid := auth.uid();
  v_ticket_id uuid;
  v_name text;
  v_phone text;
  v_email text;
  v_authorized boolean := false;
  v_priority text := case when lower(coalesce(p_priority, '')) = 'urgent' then 'urgent' else 'normal' end;
begin
  if nullif(btrim(coalesce(p_subject, '')), '') is null
     or length(btrim(p_subject)) > 120
     or nullif(btrim(coalesce(p_body, '')), '') is null
     or length(btrim(p_body)) > 4000 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_message');
  end if;

  if nullif(btrim(coalesce(p_access_token, '')), '') is not null then
    begin
      v_token := nullif(btrim(p_access_token), '')::uuid;
    exception when invalid_text_representation then
      return jsonb_build_object('ok', false, 'reason', 'unauthorized');
    end;
  end if;

  if p_order_id is not null then
    select o.* into v_order
    from public.orders o
    where o.id = p_order_id
      and o.brand_id = '22222222-2222-2222-2222-222222222222'::uuid;

    if not found then
      return jsonb_build_object('ok', false, 'reason', 'not_found');
    end if;

    if v_user_id is not null and v_order.user_id = v_user_id then
      v_authorized := true;
    elsif v_token is not null and v_order.guest_access_token = v_token then
      v_authorized := true;
    end if;

    if not v_authorized then
      return jsonb_build_object('ok', false, 'reason', 'unauthorized');
    end if;

    v_name := v_order.customer_name;
    v_phone := v_order.customer_phone;
    v_email := nullif(trim(coalesce(v_order.customer_email, '')), '');
  else
    if v_user_id is null then
      return jsonb_build_object('ok', false, 'reason', 'order_required');
    end if;
    v_authorized := true;
    v_name := coalesce(nullif(trim(coalesce(auth.jwt() ->> 'user_metadata', '')), ''), 'Customer');
    select email into v_email from auth.users where id = v_user_id;
  end if;

  insert into public.lf_support_tickets (
    brand_id, order_id, requester_user_id, access_token,
    customer_name, customer_phone, customer_email,
    subject, category, priority, sla_due_at
  ) values (
    '22222222-2222-2222-2222-222222222222'::uuid,
    p_order_id,
    case when v_token is not null and v_user_id is null then null else v_user_id end,
    v_token,
    coalesce(nullif(btrim(v_name), ''), 'Customer'),
    v_phone,
    coalesce(nullif(btrim(coalesce(p_customer_email, v_email, '')), ''), null),
    btrim(p_subject),
    case when p_category in ('delivery', 'fish', 'payment', 'other') then p_category else 'delivery' end,
    v_priority,
    now() + case when v_priority = 'urgent' then interval '1 hour' else interval '4 hours' end
  )
  returning id into v_ticket_id;

  insert into public.lf_support_messages (brand_id, ticket_id, actor_user_id, actor_role, body)
  values (
    '22222222-2222-2222-2222-222222222222'::uuid,
    v_ticket_id,
    v_user_id,
    'customer',
    btrim(p_body)
  );

  insert into public.lf_support_events (brand_id, ticket_id, action, details)
  values (
    '22222222-2222-2222-2222-222222222222'::uuid,
    v_ticket_id,
    'ticket_opened',
    jsonb_build_object('priority', v_priority, 'category', p_category)
  );

  return jsonb_build_object(
    'ok', true,
    'ticket_id', v_ticket_id,
    'access_token', case when v_user_id is null then v_token::text else null end
  );
end;
$$;

create or replace function public.lf_public_order_proof(
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
  v_token uuid;
  v_authorized boolean := false;
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

  if v_order.status <> 'delivered'::public.order_status
     or nullif(trim(coalesce(v_order.delivery_proof_url, '')), '') is null then
    return jsonb_build_object('ok', false, 'reason', 'no_proof');
  end if;

  return jsonb_build_object('ok', true, 'proof_path', v_order.delivery_proof_url);
end;
$$;

revoke all on function public.lf_public_order_proof(uuid, text) from public;
grant execute on function public.lf_public_order_proof(uuid, text) to anon, authenticated, service_role;

create or replace function public.lf_public_support_ticket(
  p_ticket_id uuid,
  p_access_token text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket public.lf_support_tickets%rowtype;
  v_token uuid;
  v_messages jsonb;
begin
  if nullif(btrim(coalesce(p_access_token, '')), '') is not null then
    begin
      v_token := nullif(btrim(p_access_token), '')::uuid;
    exception when invalid_text_representation then
      return jsonb_build_object('ok', false, 'reason', 'unauthorized');
    end;
  end if;

  select t.* into v_ticket
  from public.lf_support_tickets t
  where t.id = p_ticket_id
    and t.brand_id = '22222222-2222-2222-2222-222222222222'::uuid;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if not (
    (auth.uid() is not null and (v_ticket.requester_user_id = auth.uid()
      or public.has_brand_permission(v_ticket.brand_id, 'lf.orders.read')))
    or (v_token is not null and v_ticket.access_token = v_token)
  ) then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', m.id,
    'actor_role', m.actor_role,
    'body', m.body,
    'created_at', m.created_at
  ) order by m.created_at), '[]'::jsonb)
  into v_messages
  from public.lf_support_messages m
  where m.ticket_id = v_ticket.id;

  return jsonb_build_object(
    'ok', true,
    'ticket', jsonb_build_object(
      'id', v_ticket.id,
      'subject', v_ticket.subject,
      'category', v_ticket.category,
      'status', v_ticket.status,
      'priority', v_ticket.priority,
      'created_at', v_ticket.created_at,
      'sla_due_at', v_ticket.sla_due_at,
      'first_response_at', v_ticket.first_response_at,
      'resolved_at', v_ticket.resolved_at
    ),
    'messages', v_messages
  );
end;
$$;

create or replace function public.lf_customer_reply_ticket(
  p_ticket_id uuid,
  p_access_token text,
  p_body text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket public.lf_support_tickets%rowtype;
  v_token uuid;
begin
  if nullif(btrim(coalesce(p_body, '')), '') is null or length(btrim(p_body)) > 4000 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_message');
  end if;

  if nullif(btrim(coalesce(p_access_token, '')), '') is not null then
    begin
      v_token := btrim(p_access_token)::uuid;
    exception when invalid_text_representation then
      return jsonb_build_object('ok', false, 'reason', 'unauthorized');
    end;
  end if;

  select t.* into v_ticket
  from public.lf_support_tickets t
  where t.id = p_ticket_id
    and t.brand_id = '22222222-2222-2222-2222-222222222222'::uuid
  for update of t;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if not (
    (auth.uid() is not null and v_ticket.requester_user_id = auth.uid())
    or (v_token is not null and v_ticket.access_token = v_token)
  ) then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;

  insert into public.lf_support_messages (brand_id, ticket_id, actor_user_id, actor_role, body)
  values (
    v_ticket.brand_id, v_ticket.id, auth.uid(), 'customer', btrim(p_body)
  );

  update public.lf_support_tickets
  set status = 'open', resolved_at = null, updated_at = now()
  where id = v_ticket.id;

  return jsonb_build_object('ok', true, 'ticket_id', v_ticket.id);
end;
$$;

create or replace function public.lf_staff_reply_ticket(p_ticket_id uuid, p_body text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket public.lf_support_tickets%rowtype;
begin
  if nullif(btrim(coalesce(p_body, '')), '') is null or length(btrim(p_body)) > 4000 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_message');
  end if;

  select t.* into v_ticket
  from public.lf_support_tickets t
  where t.id = p_ticket_id
  for update of t;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if auth.uid() is null
     or not public.has_brand_permission(v_ticket.brand_id, 'lf.orders.write') then
    return jsonb_build_object('ok', false, 'reason', 'no_access');
  end if;

  insert into public.lf_support_messages (brand_id, ticket_id, actor_user_id, actor_role, body)
  values (
    v_ticket.brand_id, v_ticket.id, auth.uid(), 'staff', btrim(p_body)
  );

  update public.lf_support_tickets
  set status = 'waiting',
      first_response_at = coalesce(first_response_at, now()),
      sla_breached_at = null,
      sla_due_at = now() + interval '4 hours',
      updated_at = now()
  where id = v_ticket.id;

  return jsonb_build_object('ok', true, 'ticket_id', v_ticket.id);
end;
$$;

create or replace function public.lf_set_ticket_status(p_ticket_id uuid, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket public.lf_support_tickets%rowtype;
  v_status text := lower(coalesce(p_status, ''));
begin
  if v_status not in ('open', 'waiting', 'resolved', 'closed') then
    return jsonb_build_object('ok', false, 'reason', 'invalid_status');
  end if;

  select t.* into v_ticket
  from public.lf_support_tickets t
  where t.id = p_ticket_id
  for update of t;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if auth.uid() is null
     or not public.has_brand_permission(v_ticket.brand_id, 'lf.orders.write') then
    return jsonb_build_object('ok', false, 'reason', 'no_access');
  end if;

  update public.lf_support_tickets
  set status = v_status,
      first_response_at = coalesce(first_response_at, case when v_status <> 'open' then now() else null end),
      resolved_at = case when v_status in ('resolved', 'closed') then now() else null end,
      updated_at = now()
  where id = v_ticket.id;

  insert into public.lf_support_events (brand_id, ticket_id, action, details)
  values (
    v_ticket.brand_id, v_ticket.id, 'status_changed',
    jsonb_build_object('from', v_ticket.status, 'to', v_status)
  );

  return jsonb_build_object('ok', true, 'status', v_status);
end;
$$;

create or replace function public.lf_mark_support_sla_breaches()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  v_ticket record;
begin
  for v_ticket in
    select id, brand_id
    from public.lf_support_tickets
    where brand_id = '22222222-2222-2222-2222-222222222222'::uuid
      and status in ('open', 'waiting')
      and sla_breached_at is null
      and sla_due_at < now()
    for update
  loop
    update public.lf_support_tickets
    set sla_breached_at = now(), updated_at = now()
    where id = v_ticket.id;

    insert into public.lf_support_events (brand_id, ticket_id, action, details)
    values (
      v_ticket.brand_id, v_ticket.id, 'sla_breached',
      jsonb_build_object('checked_at', now())
    );

    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('ok', true, 'breached', v_count);
end;
$$;

revoke all on function public.lf_customer_open_ticket(uuid, text, text, text, text, text, text) from public;
grant execute on function public.lf_customer_open_ticket(uuid, text, text, text, text, text, text) to anon, authenticated, service_role;
revoke all on function public.lf_public_support_ticket(uuid, text) from public;
grant execute on function public.lf_public_support_ticket(uuid, text) to anon, authenticated, service_role;
revoke all on function public.lf_customer_reply_ticket(uuid, text, text) from public;
grant execute on function public.lf_customer_reply_ticket(uuid, text, text) to anon, authenticated, service_role;
revoke all on function public.lf_staff_reply_ticket(uuid, text) from public, anon;
grant execute on function public.lf_staff_reply_ticket(uuid, text) to authenticated, service_role;
revoke all on function public.lf_set_ticket_status(uuid, text) from public, anon;
grant execute on function public.lf_set_ticket_status(uuid, text) to authenticated, service_role;
revoke all on function public.lf_mark_support_sla_breaches() from public, anon, authenticated;
grant execute on function public.lf_mark_support_sla_breaches() to service_role;
