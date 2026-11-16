-- Stage 10: Lake Fresh PRO (wholesale / B2B)

alter table public.business_accounts
  add column if not exists approval_status text not null default 'pending',
  add column if not exists approved_by uuid,
  add column if not exists approved_at timestamptz,
  add column if not exists wholesale_discount_percent integer not null default 0,
  add column if not exists min_order_mwk integer not null default 0,
  add column if not exists notes_internal text;

do $$ begin
  if not exists (select 1 from pg_constraint where conrelid='public.business_accounts'::regclass and conname='business_accounts_approval_status_check') then
    alter table public.business_accounts add constraint business_accounts_approval_status_check check (approval_status in ('pending','approved','rejected'));
  end if;
end $$;

create table if not exists public.lf_wholesale_prices (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '22222222-2222-2222-2222-222222222222' references public.brands(id),
  product_type text not null check (product_type in ('fish','spice','marinade','ready','kit')),
  product_id uuid not null,
  product_name text not null,
  wholesale_price_mwk integer not null default 0,
  min_qty numeric not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lf_quotes (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '22222222-2222-2222-2222-222222222222' references public.brands(id),
  business_account_id uuid references public.business_accounts(id) on delete set null,
  requester_name text not null,
  requester_email text,
  requester_phone text,
  status text not null default 'pending' check (status in ('pending','quoted','accepted','rejected','converted')),
  notes text,
  total_mwk integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lf_quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.lf_quotes(id) on delete cascade,
  product_type text not null,
  product_name text not null,
  quantity numeric not null default 1,
  unit text,
  estimated_unit_price_mwk integer,
  notes text
);

create table if not exists public.lf_saved_lists (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '22222222-2222-2222-2222-222222222222' references public.brands(id),
  user_id uuid,
  business_account_id uuid references public.business_accounts(id) on delete set null,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.lf_saved_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lf_saved_lists(id) on delete cascade,
  product_type text not null,
  product_id uuid,
  product_name text not null,
  quantity numeric not null default 1,
  unit text
);

alter table public.lf_wholesale_prices enable row level security;
alter table public.lf_quotes enable row level security;
alter table public.lf_quote_items enable row level security;
alter table public.lf_saved_lists enable row level security;
alter table public.lf_saved_list_items enable row level security;

-- Wholesale prices readable by approved business users? Keep admin-only for now, public read active.
drop policy if exists lf_wholesale_prices_public_read on public.lf_wholesale_prices;
create policy lf_wholesale_prices_public_read on public.lf_wholesale_prices for select using (is_active = true);

drop policy if exists lf_wholesale_prices_admin_all on public.lf_wholesale_prices;
create policy lf_wholesale_prices_admin_all on public.lf_wholesale_prices for all using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Quotes: anyone can create (request), admins manage.
drop policy if exists lf_quotes_insert on public.lf_quotes;
create policy lf_quotes_insert on public.lf_quotes for insert with check (true);

drop policy if exists lf_quotes_admin_all on public.lf_quotes;
create policy lf_quotes_admin_all on public.lf_quotes for all using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists lf_quote_items_insert on public.lf_quote_items;
create policy lf_quote_items_insert on public.lf_quote_items for insert with check (true);

drop policy if exists lf_quote_items_admin_all on public.lf_quote_items;
create policy lf_quote_items_admin_all on public.lf_quote_items for all using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Saved lists: owner or admin.
drop policy if exists lf_saved_lists_owner on public.lf_saved_lists;
create policy lf_saved_lists_owner on public.lf_saved_lists for all using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'::public.app_role)) with check (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists lf_saved_list_items_owner on public.lf_saved_list_items;
create policy lf_saved_list_items_owner on public.lf_saved_list_items for all using (
  exists (select 1 from public.lf_saved_lists l where l.id = list_id and (l.user_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role)))
) with check (
  exists (select 1 from public.lf_saved_lists l where l.id = list_id and (l.user_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role)))
);

create index if not exists idx_lf_wholesale_prices_brand on public.lf_wholesale_prices(brand_id);
create index if not exists idx_lf_quotes_brand on public.lf_quotes(brand_id);
create index if not exists idx_lf_saved_lists_user on public.lf_saved_lists(user_id);
