-- Stage 11: Lake Fresh subscriptions (consent-gated, no auto-charge)

create table if not exists public.lf_subscriptions (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '22222222-2222-2222-2222-222222222222' references public.brands(id),
  user_id uuid,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  plan text not null check (plan in ('weekly','biweekly','monthly')),
  delivery_zone_id uuid references public.delivery_zones(id),
  quantity_kg numeric not null default 1,
  preparation text not null default 'whole',
  status text not null default 'pending_consent' check (status in ('pending_consent','active','paused','cancelled')),
  consent_given boolean not null default false,
  consent_given_at timestamptz,
  mandate_ref text,
  next_charge_date date,
  last_charged_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lf_subscriptions enable row level security;

drop policy if exists lf_subscriptions_insert on public.lf_subscriptions;
create policy lf_subscriptions_insert on public.lf_subscriptions for insert with check (true);

drop policy if exists lf_subscriptions_owner on public.lf_subscriptions;
create policy lf_subscriptions_owner on public.lf_subscriptions for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists lf_subscriptions_admin_all on public.lf_subscriptions;
create policy lf_subscriptions_admin_all on public.lf_subscriptions for all using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create index if not exists idx_lf_subscriptions_brand on public.lf_subscriptions(brand_id);
create index if not exists idx_lf_subscriptions_user on public.lf_subscriptions(user_id);
