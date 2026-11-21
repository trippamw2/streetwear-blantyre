-- Lake Fresh P5 growth and retention.
-- 1. Customer reviews with moderation and brand isolation.
-- 2. Explicit newsletter consent with a Lake Fresh only list.
-- 3. First party, privacy safe growth events.
-- 4. Consent gated lifecycle messages processed by a protected cron.
-- 5. Simple rewards tuning for the Lake Fresh brand.

-- ---------------------------------------------------------------------------
-- 1. Named permissions
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
      'lf.team.read', 'lf.team.write', 'lf.reviews.read', 'lf.reviews.write',
      'lf.growth.read', 'suppliers.read', 'suppliers.write', 'audit.read'
    ]
    when 'lf_fulfillment' then array[
      'brand.access', 'email.transactional', 'lf.orders.read', 'lf.orders.write',
      'lf.reconcile.write', 'lf.stock.write', 'lf.delivery.write',
      'lf.suppliers.read', 'lf.traceability.read', 'lf.audit.read', 'lf.team.read',
      'lf.reviews.read', 'lf.growth.read'
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

update public.staff_permissions
set permissions = coalesce(permissions, '{}'::jsonb) || jsonb_build_object(
  'lf.reviews.read', true, 'lf.reviews.write', true, 'lf.growth.read', true
)
where brand_id = '22222222-2222-2222-2222-222222222222'::uuid
  and lower(role) in ('owner', 'admin', 'lf_manager');

update public.staff_permissions
set permissions = coalesce(permissions, '{}'::jsonb) || jsonb_build_object(
  'lf.reviews.read', true, 'lf.growth.read', true
)
where brand_id = '22222222-2222-2222-2222-222222222222'::uuid
  and lower(role) = 'lf_fulfillment';

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
    'lf.team.read', 'lf.team.write', 'lf.reviews.read', 'lf.reviews.write', 'lf.growth.read'
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

revoke all on function public.lf_admin_set_staff_permission(uuid, uuid, text, jsonb) from public, anon;
grant execute on function public.lf_admin_set_staff_permission(uuid, uuid, text, jsonb) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Reviews
-- ---------------------------------------------------------------------------
create table if not exists public.lf_reviews (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '22222222-2222-2222-2222-222222222222'
    references public.brands(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid,
  product_type text not null default 'order'
    check (product_type in ('order', 'fish', 'spice')),
  customer_user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  moderation_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists lf_reviews_order_unique
  on public.lf_reviews (brand_id, order_id) where product_id is null;
create unique index if not exists lf_reviews_order_product_unique
  on public.lf_reviews (brand_id, order_id, product_id) where product_id is not null;
create index if not exists lf_reviews_public_idx
  on public.lf_reviews (brand_id, status, created_at desc);

alter table public.lf_reviews enable row level security;

drop policy if exists lf_reviews_public_read on public.lf_reviews;
create policy lf_reviews_public_read on public.lf_reviews
  for select to anon, authenticated
  using (
    brand_id = '22222222-2222-2222-2222-222222222222'::uuid
    and status = 'approved'
  );

drop policy if exists lf_reviews_owner_read on public.lf_reviews;
create policy lf_reviews_owner_read on public.lf_reviews
  for select to authenticated
  using (
    brand_id = '22222222-2222-2222-2222-222222222222'::uuid
    and customer_user_id = auth.uid()
  );

drop policy if exists lf_reviews_staff_read on public.lf_reviews;
create policy lf_reviews_staff_read on public.lf_reviews
  for select to authenticated
  using (public.has_brand_permission(brand_id, 'lf.reviews.read'));

revoke all on table public.lf_reviews from anon;
grant select on table public.lf_reviews to anon;
revoke insert, update, delete on table public.lf_reviews from authenticated;
grant select on table public.lf_reviews to authenticated;

create or replace function public.lf_submit_review(
  p_order_id uuid,
  p_rating integer,
  p_body text,
  p_access_token text default null,
  p_product_id uuid default null,
  p_product_type text default 'order',
  p_title text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_user_id uuid := auth.uid();
  v_token uuid;
  v_type text := lower(btrim(coalesce(p_product_type, 'order')));
  v_title text := nullif(btrim(coalesce(p_title, '')), '');
  v_body text := btrim(coalesce(p_body, ''));
  v_review_id uuid;
begin
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_rating');
  end if;

  if v_type not in ('order', 'fish', 'spice') then
    return jsonb_build_object('ok', false, 'reason', 'invalid_product');
  end if;

  if v_title is not null and length(v_title) > 120 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_title');
  end if;

  if length(v_body) < 10 or length(v_body) > 2000 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_body');
  end if;

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
    and o.brand_id = '22222222-2222-2222-2222-222222222222'::uuid;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if v_order.status <> 'delivered'::public.order_status then
    return jsonb_build_object('ok', false, 'reason', 'order_not_delivered');
  end if;

  if not (
    (v_user_id is not null and v_order.user_id = v_user_id)
    or (v_token is not null and v_order.guest_access_token = v_token)
  ) then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;

  if p_product_id is not null then
    if not exists (
      select 1
      from public.order_items oi
      where oi.order_id = v_order.id
        and oi.brand_id = v_order.brand_id
        and (
          oi.product_key = p_product_id::text
          or oi.product_key = v_type || ':' || p_product_id::text
        )
    ) then
      return jsonb_build_object('ok', false, 'reason', 'product_not_in_order');
    end if;
  elsif v_type <> 'order' then
    return jsonb_build_object('ok', false, 'reason', 'product_required');
  end if;

  if exists (
    select 1 from public.lf_reviews r
    where r.brand_id = v_order.brand_id
      and r.order_id = v_order.id
      and r.product_id is not distinct from p_product_id
  ) then
    return jsonb_build_object('ok', true, 'already_submitted', true);
  end if;

  insert into public.lf_reviews (
    brand_id, order_id, product_id, product_type, customer_user_id,
    customer_name, rating, title, body, status
  ) values (
    v_order.brand_id, v_order.id, p_product_id, v_type, v_user_id,
    v_order.customer_name, p_rating, v_title, v_body, 'pending'
  )
  returning id into v_review_id;

  return jsonb_build_object('ok', true, 'review_id', v_review_id, 'status', 'pending');
end;
$$;

create or replace function public.lf_moderate_review(
  p_review_id uuid,
  p_status text,
  p_moderation_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_review public.lf_reviews%rowtype;
  v_status text := lower(btrim(coalesce(p_status, '')));
begin
  if v_status not in ('pending', 'approved', 'rejected') then
    return jsonb_build_object('ok', false, 'reason', 'invalid_status');
  end if;

  select * into v_review from public.lf_reviews where id = p_review_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if v_review.brand_id <> '22222222-2222-2222-2222-222222222222'::uuid
     or not public.has_brand_permission(v_review.brand_id, 'lf.reviews.write') then
    return jsonb_build_object('ok', false, 'reason', 'no_access');
  end if;

  update public.lf_reviews
  set status = v_status,
      approved_at = case when v_status = 'approved' then now() else null end,
      approved_by = case when v_status = 'approved' then auth.uid() else null end,
      moderation_note = nullif(btrim(coalesce(p_moderation_note, '')), ''),
      updated_at = now()
  where id = p_review_id;

  insert into public.auth_audit_log (
    admin_user_id, action, target_type, target_id, details, brand_id
  ) values (
    auth.uid(), 'lf_review_moderated', 'lf_review', p_review_id::text,
    jsonb_build_object('status', v_status, 'order_id', v_review.order_id),
    v_review.brand_id
  );

  return jsonb_build_object('ok', true, 'status', v_status);
end;
$$;

revoke all on function public.lf_submit_review(uuid, integer, text, text, uuid, text, text) from public;
grant execute on function public.lf_submit_review(uuid, integer, text, text, uuid, text, text) to anon, authenticated, service_role;
revoke all on function public.lf_moderate_review(uuid, text, text) from public, anon;
grant execute on function public.lf_moderate_review(uuid, text, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Newsletter consent
-- ---------------------------------------------------------------------------
create table if not exists public.lf_newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '22222222-2222-2222-2222-222222222222'
    references public.brands(id) on delete cascade,
  email text not null,
  name text,
  consent_given boolean not null default true,
  source text not null default 'lf_footer',
  created_at timestamptz not null default now(),
  unique (brand_id, email)
);

alter table public.lf_newsletter_subscribers enable row level security;
drop policy if exists lf_newsletter_staff_read on public.lf_newsletter_subscribers;
create policy lf_newsletter_staff_read on public.lf_newsletter_subscribers
  for select to authenticated
  using (public.has_brand_permission(brand_id, 'lf.growth.read'));

revoke all on table public.lf_newsletter_subscribers from anon, authenticated;
grant select on table public.lf_newsletter_subscribers to authenticated;

-- ---------------------------------------------------------------------------
-- 4. First party growth events
-- ---------------------------------------------------------------------------
create table if not exists public.lf_growth_events (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '22222222-2222-2222-2222-222222222222'
    references public.brands(id) on delete cascade,
  event_type text not null check (event_type in (
    'page_view', 'catalog_view', 'product_view', 'checkout_started', 'review_submitted'
  )),
  session_key text not null,
  path text,
  ref_code text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz not null default now()
);

create index if not exists lf_growth_events_recent_idx
  on public.lf_growth_events (brand_id, created_at desc);

alter table public.lf_growth_events enable row level security;
drop policy if exists lf_growth_staff_read on public.lf_growth_events;
create policy lf_growth_staff_read on public.lf_growth_events
  for select to authenticated
  using (public.has_brand_permission(brand_id, 'lf.growth.read'));

revoke all on table public.lf_growth_events from anon, authenticated;
grant select on table public.lf_growth_events to authenticated;

create or replace function public.lf_record_growth_event(
  p_event_type text,
  p_session_key text,
  p_path text default null,
  p_ref_code text default null,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type text := lower(btrim(coalesce(p_event_type, '')));
  v_session text := btrim(coalesce(p_session_key, ''));
begin
  if v_type not in ('page_view', 'catalog_view', 'product_view', 'checkout_started', 'review_submitted')
     or v_session !~ '^[0-9a-fA-F-]{36}$'
     or length(v_session) <> 36 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_event');
  end if;

  insert into public.lf_growth_events (
    brand_id, event_type, session_key, path, ref_code,
    utm_source, utm_medium, utm_campaign
  ) values (
    '22222222-2222-2222-2222-222222222222'::uuid,
    v_type,
    v_session,
    left(nullif(btrim(coalesce(p_path, '')), ''), 160),
    left(nullif(btrim(coalesce(p_ref_code, '')), ''), 40),
    left(nullif(btrim(coalesce(p_utm_source, '')), ''), 80),
    left(nullif(btrim(coalesce(p_utm_medium, '')), ''), 80),
    left(nullif(btrim(coalesce(p_utm_campaign, '')), ''), 120)
  );

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.lf_record_growth_event(text, text, text, text, text, text, text) from public;
grant execute on function public.lf_record_growth_event(text, text, text, text, text, text, text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. Consent gated lifecycle messages
-- ---------------------------------------------------------------------------
create table if not exists public.lf_lifecycle_outbox (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '22222222-2222-2222-2222-222222222222'
    references public.brands(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  kind text not null check (kind in ('review_request', 'reorder_reminder')),
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed')),
  due_at timestamptz not null,
  attempts integer not null default 0,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, order_id, kind)
);

alter table public.lf_lifecycle_outbox enable row level security;
drop policy if exists lf_lifecycle_staff_read on public.lf_lifecycle_outbox;
create policy lf_lifecycle_staff_read on public.lf_lifecycle_outbox
  for select to authenticated
  using (public.has_brand_permission(brand_id, 'lf.growth.read'));

revoke all on table public.lf_lifecycle_outbox from anon, authenticated;
grant select on table public.lf_lifecycle_outbox to authenticated;

create or replace function public.lf_queue_lifecycle_on_delivery()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.brand_id = '22222222-2222-2222-2222-222222222222'::uuid
     and new.status = 'delivered'::public.order_status
     and old.status is distinct from new.status then
    insert into public.lf_lifecycle_outbox (brand_id, order_id, kind, due_at)
    values (new.brand_id, new.id, 'review_request', now() + interval '2 days')
    on conflict (brand_id, order_id, kind) do nothing;

    insert into public.lf_lifecycle_outbox (brand_id, order_id, kind, due_at)
    values (new.brand_id, new.id, 'reorder_reminder', now() + interval '14 days')
    on conflict (brand_id, order_id, kind) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists lf_lifecycle_queue on public.orders;
create trigger lf_lifecycle_queue
  after update of status on public.orders
  for each row execute function public.lf_queue_lifecycle_on_delivery();

create or replace function public.lf_claim_lifecycle_messages(p_limit integer default 20)
returns table (
  id uuid,
  kind text,
  order_id uuid,
  to_email text,
  to_name text,
  link text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_service boolean := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  ) = 'service_role';
begin
  if not v_is_service then
    return;
  end if;

  return query
  with due as (
    select o.id, o.kind, o.order_id, ord.customer_email, ord.customer_name
    from public.lf_lifecycle_outbox o
    join public.orders ord on ord.id = o.order_id
    left join public.customer_profiles cp
      on cp.brand_id = o.brand_id and cp.user_id = ord.user_id
    where o.brand_id = '22222222-2222-2222-2222-222222222222'::uuid
      and o.status = 'pending'
      and o.due_at <= now()
      and ord.status = 'delivered'::public.order_status
      and nullif(btrim(coalesce(ord.customer_email, '')), '') is not null
      and coalesce(cp.marketing_consent, false) = true
    order by o.due_at
    for update of o skip locked
    limit greatest(1, least(coalesce(p_limit, 20), 50))
  ), claimed as (
    update public.lf_lifecycle_outbox o
    set status = 'sending',
        attempts = o.attempts + 1,
        updated_at = now()
    from due
    where o.id = due.id
    returning o.id, o.kind, o.order_id, due.customer_email, due.customer_name
  )
  select
    claimed.id,
    claimed.kind,
    claimed.order_id,
    claimed.customer_email,
    claimed.customer_name,
    case when claimed.kind = 'review_request'
      then 'https://lakefreshmw.com/reviews'
      else 'https://lakefreshmw.com/fish'
    end;
end;
$$;

create or replace function public.lf_finish_lifecycle_message(
  p_id uuid,
  p_sent boolean,
  p_error text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_service boolean := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  ) = 'service_role';
  v_row public.lf_lifecycle_outbox%rowtype;
  v_status text;
begin
  if not v_is_service then
    return jsonb_build_object('ok', false, 'reason', 'no_access');
  end if;

  select * into v_row from public.lf_lifecycle_outbox where id = p_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if p_sent then
    v_status := 'sent';
  else
    v_status := case when v_row.attempts >= 3 then 'failed' else 'pending' end;
  end if;

  update public.lf_lifecycle_outbox
  set status = v_status,
      sent_at = case when p_sent then now() else null end,
      last_error = left(nullif(btrim(coalesce(p_error, '')), ''), 500),
      updated_at = now()
  where id = p_id;

  return jsonb_build_object('ok', true, 'status', v_status);
end;
$$;

revoke all on function public.lf_claim_lifecycle_messages(integer) from public, anon, authenticated;
grant execute on function public.lf_claim_lifecycle_messages(integer) to service_role;
revoke all on function public.lf_finish_lifecycle_message(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.lf_finish_lifecycle_message(uuid, boolean, text) to service_role;

-- ---------------------------------------------------------------------------
-- 6. Simple Lake Fresh rewards tuning
-- ---------------------------------------------------------------------------
insert into public.loyalty_programs (
  brand_id, name, description, points_per_mwk, points_to_redeem,
  reward_value_mwk, min_order_mwk, max_redeem_percent, is_active
)
select
  '22222222-2222-2222-2222-222222222222'::uuid,
  'Lake Fresh Rewards',
  'Earn 1 point for every MK 1,000 you spend. Save 100 points for MK 1,000 off a future order.',
  1000, 100, 1000, 0, 50, true
where not exists (
  select 1 from public.loyalty_programs
  where brand_id = '22222222-2222-2222-2222-222222222222'::uuid
);

insert into public.loyalty_tiers (
  brand_id, name, min_lifetime_points, points_multiplier, discount_percent, free_delivery
)
select '22222222-2222-2222-2222-222222222222'::uuid, name, min_points, multiplier, discount, free_delivery
from (values
  ('bronze', 0, 1.0, 0, false),
  ('silver', 20, 1.25, 2, false),
  ('gold', 60, 1.5, 5, true),
  ('platinum', 150, 2.0, 10, true)
) as t(name, min_points, multiplier, discount, free_delivery)
on conflict (brand_id, name) do update
set min_lifetime_points = excluded.min_lifetime_points,
    points_multiplier = excluded.points_multiplier,
    discount_percent = excluded.discount_percent,
    free_delivery = excluded.free_delivery;
