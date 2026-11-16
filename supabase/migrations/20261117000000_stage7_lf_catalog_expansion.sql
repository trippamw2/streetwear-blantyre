-- Stage 7: Lake Fresh catalog expansion (spices, marinades, ready-to-cook, meal kits)

create table if not exists public.lf_spices (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '22222222-2222-2222-2222-222222222222' references public.brands(id),
  name text not null,
  description text,
  image text,
  price_mwk integer not null default 0,
  size_label text,
  ingredients text,
  stock_qty integer not null default 0,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lf_marinades (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '22222222-2222-2222-2222-222222222222' references public.brands(id),
  name text not null,
  description text,
  image text,
  price_mwk integer not null default 0,
  size_label text,
  ingredients text,
  storage_info text,
  stock_qty integer not null default 0,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lf_ready_to_cook (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '22222222-2222-2222-2222-222222222222' references public.brands(id),
  name text not null,
  description text,
  image text,
  price_mwk integer not null default 0,
  size_label text,
  storage_info text,
  cooking_info text,
  stock_qty integer not null default 0,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lf_meal_kits (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '22222222-2222-2222-2222-222222222222' references public.brands(id),
  name text not null,
  description text,
  image text,
  price_mwk integer not null default 0,
  discount_percent integer not null default 0,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lf_meal_kit_items (
  id uuid primary key default gen_random_uuid(),
  kit_id uuid not null references public.lf_meal_kits(id) on delete cascade,
  item_type text not null check (item_type in ('fish','spice','marinade','ready_to_cook','other')),
  item_name text not null,
  quantity numeric not null default 1,
  unit text,
  sort_order integer not null default 0
);

alter table public.lf_spices enable row level security;
alter table public.lf_marinades enable row level security;
alter table public.lf_ready_to_cook enable row level security;
alter table public.lf_meal_kits enable row level security;
alter table public.lf_meal_kit_items enable row level security;

-- Public read for active items
drop policy if exists lf_spices_public_read on public.lf_spices;
create policy lf_spices_public_read on public.lf_spices for select using (is_active = true);

drop policy if exists lf_marinades_public_read on public.lf_marinades;
create policy lf_marinades_public_read on public.lf_marinades for select using (is_active = true);

drop policy if exists lf_ready_public_read on public.lf_ready_to_cook;
create policy lf_ready_public_read on public.lf_ready_to_cook for select using (is_active = true);

drop policy if exists lf_kits_public_read on public.lf_meal_kits;
create policy lf_kits_public_read on public.lf_meal_kits for select using (is_active = true);

drop policy if exists lf_kit_items_public_read on public.lf_meal_kit_items;
create policy lf_kit_items_public_read on public.lf_meal_kit_items for select using (
  exists (select 1 from public.lf_meal_kits k where k.id = kit_id and k.is_active = true)
);

-- Admin/staff full access (service role and admins)
drop policy if exists lf_spices_admin_all on public.lf_spices;
create policy lf_spices_admin_all on public.lf_spices for all using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists lf_marinades_admin_all on public.lf_marinades;
create policy lf_marinades_admin_all on public.lf_marinades for all using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists lf_ready_admin_all on public.lf_ready_to_cook;
create policy lf_ready_admin_all on public.lf_ready_to_cook for all using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists lf_kits_admin_all on public.lf_meal_kits;
create policy lf_kits_admin_all on public.lf_meal_kits for all using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists lf_kit_items_admin_all on public.lf_meal_kit_items;
create policy lf_kit_items_admin_all on public.lf_meal_kit_items for all using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create index if not exists idx_lf_spices_brand on public.lf_spices(brand_id);
create index if not exists idx_lf_marinades_brand on public.lf_marinades(brand_id);
create index if not exists idx_lf_ready_brand on public.lf_ready_to_cook(brand_id);
create index if not exists idx_lf_kits_brand on public.lf_meal_kits(brand_id);
