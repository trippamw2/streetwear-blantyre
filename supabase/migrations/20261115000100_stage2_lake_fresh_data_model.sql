-- Stage 2: Lake Fresh Fish Mart data model (DB only)
-- All tables are brand-scoped to Lake Fresh (brand_id default = LF brand).

-- Fish species
create table if not exists public.fish_species (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade default '22222222-2222-2222-2222-222222222222',
  name text not null,
  slug text not null,
  description text,
  image text,
  storage_info text,
  handling_info text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, slug)
);

-- Fish products (weight-based)
create table if not exists public.fish_products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade default '22222222-2222-2222-2222-222222222222',
  species_id uuid references public.fish_species(id) on delete set null,
  name text not null,
  description text,
  price_per_kg_mwk integer not null,
  min_order_qty_kg numeric(10,3) not null default 0.5,
  preparation_options jsonb not null default '[]'::jsonb,
  availability_status text not null default 'available',
  image text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Inventory batches (freshness tracking)
create table if not exists public.fish_inventory_batches (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade default '22222222-2222-2222-2222-222222222222',
  species_id uuid references public.fish_species(id) on delete set null,
  received_date date not null,
  expiry_date date,
  weight_kg_received numeric(10,3) not null,
  weight_kg_available numeric(10,3) not null default 0,
  weight_kg_reserved numeric(10,3) not null default 0,
  weight_kg_sold numeric(10,3) not null default 0,
  weight_kg_wasted numeric(10,3) not null default 0,
  freshness_grade text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Stock reservations (atomic)
create table if not exists public.fish_stock_reservations (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade default '22222222-2222-2222-2222-222222222222',
  batch_id uuid not null references public.fish_inventory_batches(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  weight_kg numeric(10,3) not null,
  status text not null default 'reserved',
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- Delivery zones
create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade default '22222222-2222-2222-2222-222222222222',
  name text not null,
  slug text not null,
  description text,
  is_active boolean not null default true,
  base_fee_mwk integer not null default 0,
  min_order_mwk integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, slug)
);

-- Delivery slots (next-day scheduling)
create table if not exists public.delivery_slots (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade default '22222222-2222-2222-2222-222222222222',
  zone_id uuid references public.delivery_zones(id) on delete cascade,
  delivery_date date not null,
  cutoff_at timestamptz not null,
  capacity_orders integer not null default 0,
  capacity_weight_kg numeric(10,3) not null default 0,
  booked_orders integer not null default 0,
  booked_weight_kg numeric(10,3) not null default 0,
  is_open boolean not null default true,
  created_at timestamptz not null default now(),
  unique (brand_id, zone_id, delivery_date)
);

-- Delivery assignments
create table if not exists public.delivery_assignments (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade default '22222222-2222-2222-2222-222222222222',
  order_id uuid references public.orders(id) on delete cascade,
  slot_id uuid references public.delivery_slots(id) on delete set null,
  driver_name text,
  status text not null default 'assigned',
  dispatched_at timestamptz,
  delivered_at timestamptz,
  failed_reason text,
  notes text,
  created_at timestamptz not null default now()
);

-- Per-item preparation tracking
create table if not exists public.order_preparation (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade default '22222222-2222-2222-2222-222222222222',
  order_item_id uuid references public.order_items(id) on delete cascade,
  preparation_type text not null,
  requested_weight_kg numeric(10,3),
  packed_weight_kg numeric(10,3),
  price_per_kg_mwk integer,
  final_price_mwk integer,
  reconciled_at timestamptz,
  reconciled_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Price reconciliation (estimated vs final packed weight)
create table if not exists public.price_reconciliation (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade default '22222222-2222-2222-2222-222222222222',
  order_id uuid references public.orders(id) on delete cascade,
  estimated_total_mwk integer not null,
  final_total_mwk integer,
  difference_mwk integer,
  status text not null default 'pending',
  customer_confirmed_at timestamptz,
  confirmed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Atomic reservation function
create or replace function public.reserve_fish_stock(p_batch_id uuid, p_order_id uuid, p_weight_kg numeric)
returns uuid
language plpgsql
security definer
as $$
declare
  v_available numeric;
  v_reservation_id uuid;
  v_brand_id uuid;
begin
  select weight_kg_available, brand_id into v_available, v_brand_id
  from public.fish_inventory_batches
  where id = p_batch_id
  for update;

  if v_available is null then
    raise exception 'Batch not found';
  end if;

  if v_available < p_weight_kg then
    raise exception 'Insufficient stock: available %, requested %', v_available, p_weight_kg;
  end if;

  update public.fish_inventory_batches
  set weight_kg_available = weight_kg_available - p_weight_kg,
      weight_kg_reserved = weight_kg_reserved + p_weight_kg,
      updated_at = now()
  where id = p_batch_id;

  insert into public.fish_stock_reservations (brand_id, batch_id, order_id, weight_kg, status)
  values (v_brand_id, p_batch_id, p_order_id, p_weight_kg, 'reserved')
  returning id into v_reservation_id;

  return v_reservation_id;
end;
$$;

create or replace function public.release_fish_reservation(p_reservation_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_batch_id uuid;
  v_weight numeric;
  v_status text;
begin
  select batch_id, weight_kg, status into v_batch_id, v_weight, v_status
  from public.fish_stock_reservations
  where id = p_reservation_id
  for update;

  if v_batch_id is null then
    raise exception 'Reservation not found';
  end if;

  if v_status <> 'reserved' then
    return; -- already confirmed/released
  end if;

  update public.fish_inventory_batches
  set weight_kg_available = weight_kg_available + v_weight,
      weight_kg_reserved = greatest(0, weight_kg_reserved - v_weight),
      updated_at = now()
  where id = v_batch_id;

  update public.fish_stock_reservations
  set status = 'released'
  where id = p_reservation_id;
end;
$$;

create or replace function public.confirm_fish_reservation(p_reservation_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_batch_id uuid;
  v_weight numeric;
  v_status text;
begin
  select batch_id, weight_kg, status into v_batch_id, v_weight, v_status
  from public.fish_stock_reservations
  where id = p_reservation_id
  for update;

  if v_batch_id is null then
    raise exception 'Reservation not found';
  end if;

  if v_status <> 'reserved' then
    return;
  end if;

  update public.fish_inventory_batches
  set weight_kg_reserved = greatest(0, weight_kg_reserved - v_weight),
      weight_kg_sold = weight_kg_sold + v_weight,
      updated_at = now()
  where id = v_batch_id;

  update public.fish_stock_reservations
  set status = 'confirmed'
  where id = p_reservation_id;
end;
$$;

-- RLS
alter table public.fish_species enable row level security;
alter table public.fish_products enable row level security;
alter table public.fish_inventory_batches enable row level security;
alter table public.fish_stock_reservations enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.delivery_slots enable row level security;
alter table public.delivery_assignments enable row level security;
alter table public.order_preparation enable row level security;
alter table public.price_reconciliation enable row level security;

-- Public read for active fish products/species (anon)
create policy "fish_species_public_read" on public.fish_species for select using (is_active = true);
create policy "fish_products_public_read" on public.fish_products for select using (is_active = true);
create policy "delivery_zones_public_read" on public.delivery_zones for select using (is_active = true);
create policy "delivery_slots_public_read" on public.delivery_slots for select using (is_open = true);

-- Admin full access (owner/admin) for all LF tables
do $$
declare t text;
begin
  for t in select unnest(array[
    'fish_species','fish_products','fish_inventory_batches','fish_stock_reservations',
    'delivery_zones','delivery_slots','delivery_assignments','order_preparation','price_reconciliation'
  ]) loop
    execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
    execute format('create policy %I on public.%I for all using (
      exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = ''admin'')
    ) with check (
      exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = ''admin'')
    )', t || '_admin_all', t);
  end loop;
end $$;

-- Seed delivery zones (LF)
insert into public.delivery_zones (brand_id, name, slug, description, base_fee_mwk, min_order_mwk, sort_order)
values
  ('22222222-2222-2222-2222-222222222222','Chimwankhunda','chimwankhunda','Chimwankhunda area',2000,0,1),
  ('22222222-2222-2222-2222-222222222222','Chilobwe','chilobwe','Chilobwe area',2000,0,2),
  ('22222222-2222-2222-2222-222222222222','Zingwangwa','zingwangwa','Zingwangwa area',2000,0,3),
  ('22222222-2222-2222-2222-222222222222','Mkolokosa','mkolokosa','Mkolokosa area',2500,0,4),
  ('22222222-2222-2222-2222-222222222222','Naperi','naperi','Naperi area',2000,0,5),
  ('22222222-2222-2222-2222-222222222222','Chitawira','chitawira','Chitawira area',2000,0,6),
  ('22222222-2222-2222-2222-222222222222','Surrounding areas','surrounding-areas','Surrounding areas',3000,0,7)
on conflict (brand_id, slug) do nothing;

-- Seed fish species (LF)
insert into public.fish_species (brand_id, name, slug, description, storage_info, handling_info, sort_order)
values
  ('22222222-2222-2222-2222-222222222222','Chambo','chambo','Fresh Chambo from Lake Malawi.','Keep refrigerated at 0-4°C. Consume within 2 days of delivery.','Handle with clean hands; rinse before cooking.',1),
  ('22222222-2222-2222-2222-222222222222','Ncheni / Micheni','ncheni-micheni','Fresh Ncheni/Micheni.','Keep refrigerated at 0-4°C. Consume within 2 days of delivery.','Handle with clean hands; rinse before cooking.',2),
  ('22222222-2222-2222-2222-222222222222','Usipa','usipa','Fresh Usipa.','Keep refrigerated at 0-4°C. Consume within 2 days of delivery.','Handle with clean hands; rinse before cooking.',3)
on conflict (brand_id, slug) do nothing;
