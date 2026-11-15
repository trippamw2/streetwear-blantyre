-- Stage 1: Brand foundation (multi-brand commerce platform)
-- Reversible: all changes are additive columns with defaults + new tables.
-- Backfills existing rows to the SB brand.

create table if not exists public.brands (
  id uuid primary key,
  slug text not null unique,
  name text not null,
  domain text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.brands (id, slug, name, domain, is_active)
values
  ('11111111-1111-1111-1111-111111111111','sb','SB Streetwear','wearsb.com',true),
  ('22222222-2222-2222-2222-222222222222','lake-fresh','Lake Fresh Fish Mart',null,true)
on conflict (id) do nothing;

create table if not exists public.staff_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete cascade,
  role text not null,
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, brand_id, role)
);

create table if not exists public.customer_profiles (
  brand_id uuid not null references public.brands(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  location text,
  marketing_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (brand_id, user_id)
);

-- Add brand_id to all brand-scoped commerce tables
do $$
declare t text;
begin
  for t in select unnest(array[
    'products','product_types','inventory','inventory_transactions','orders','order_items',
    'payment_links','promotions','promo_codes','combos','combo_items','delivery_companies',
    'delivery_options','site_settings','customer_subscribers','gifts','gift_items','gift_reviews',
    'gift_tracking','testimonials','suppliers','product_reviews','wearable_categories',
    'business_accounts','culture_pillars','culture_stories','lookbooks','lookbook_items',
    'customer_loyalty','loyalty_programs','loyalty_tiers','loyalty_transactions',
    'user_referral_codes','referral_rewards','referral_transactions','whatsapp_campaigns',
    'product_auth','product_ownership'
  ]) loop
    execute format('alter table public.%I add column if not exists brand_id uuid references public.brands(id)', t);
    execute format('update public.%I set brand_id = ''11111111-1111-1111-1111-111111111111'' where brand_id is null', t);
    execute format('alter table public.%I alter column brand_id set default ''11111111-1111-1111-1111-111111111111''', t);
    execute format('alter table public.%I alter column brand_id set not null', t);
  end loop;
end $$;

-- RLS for new tables
alter table public.brands enable row level security;
alter table public.staff_permissions enable row level security;
alter table public.customer_profiles enable row level security;

drop policy if exists "brands_public_read" on public.brands;
create policy "brands_public_read" on public.brands for select using (is_active = true);
drop policy if exists "brands_admin_all" on public.brands;
create policy "brands_admin_all" on public.brands for all using (
  exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
) with check (
  exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
);

drop policy if exists "staff_permissions_self_read" on public.staff_permissions;
create policy "staff_permissions_self_read" on public.staff_permissions for select using (user_id = auth.uid());
drop policy if exists "staff_permissions_admin_all" on public.staff_permissions;
create policy "staff_permissions_admin_all" on public.staff_permissions for all using (
  exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
) with check (
  exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
);

drop policy if exists "customer_profiles_self" on public.customer_profiles;
create policy "customer_profiles_self" on public.customer_profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "customer_profiles_admin_all" on public.customer_profiles;
create policy "customer_profiles_admin_all" on public.customer_profiles for all using (
  exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
) with check (
  exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
);
