-- SB product architecture.
-- 1. Extensible product types and richer product fields.
-- 2. True variants with SKU, price, stock, weight and availability.
-- 3. Cross category collections and drops.
-- 4. Shoppable looks, related products and complete-the-look rules.
-- 5. Editorial and campaign placement without code changes.
-- All new tables are brand scoped to Streetwear Blantyre and never touch LF.

-- ---------------------------------------------------------------------------
-- 1. Extensible product types
-- ---------------------------------------------------------------------------
create table if not exists public.sb_product_types (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '11111111-1111-1111-1111-111111111111'
    references public.brands(id) on delete cascade,
  code text not null,
  label text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, code)
);

alter table public.sb_product_types enable row level security;
drop trigger if exists sb_product_types_updated_at on public.sb_product_types;
create trigger sb_product_types_updated_at before update on public.sb_product_types
  for each row execute function public.set_updated_at();

drop policy if exists sb_product_types_public_read on public.sb_product_types;
create policy sb_product_types_public_read on public.sb_product_types
  for select to anon, authenticated
  using (
    is_active
    and brand_id = '11111111-1111-1111-1111-111111111111'::uuid
  );
drop policy if exists sb_product_types_admin_all on public.sb_product_types;
create policy sb_product_types_admin_all on public.sb_product_types
  for all to authenticated
  using (public.has_brand_access(brand_id))
  with check (public.has_brand_access(brand_id));

revoke all on table public.sb_product_types from anon;
grant select on table public.sb_product_types to anon, authenticated;
revoke insert, update, delete on table public.sb_product_types from authenticated;
grant insert, update, delete on table public.sb_product_types to authenticated;

insert into public.sb_product_types (brand_id, code, label, description, sort_order)
values
  ('11111111-1111-1111-1111-111111111111', 'TEE', 'T-Shirts', 'Graphic, oversized, statement, essential and limited drop tees.', 10),
  ('11111111-1111-1111-1111-111111111111', 'VEST', 'Vests', 'Graphic, oversized, essential and summer vests.', 20),
  ('11111111-1111-1111-1111-111111111111', 'SHORT_SLEEVE_SHIRT', 'Short-Sleeve Shirts', 'Graphic, printed, relaxed and statement shirts.', 30),
  ('11111111-1111-1111-1111-111111111111', 'SHORTS', 'Shorts', 'Street, graphic, relaxed, utility and matching sets.', 40),
  ('11111111-1111-1111-1111-111111111111', 'HOODIES', 'Hoodies', 'Future wardrobe expansion.', 50),
  ('11111111-1111-1111-1111-111111111111', 'SWEATSHIRTS', 'Sweatshirts', 'Future wardrobe expansion.', 60),
  ('11111111-1111-1111-1111-111111111111', 'JACKETS', 'Jackets', 'Future wardrobe expansion.', 70),
  ('11111111-1111-1111-1111-111111111111', 'TROUSERS', 'Trousers', 'Future wardrobe expansion.', 80),
  ('11111111-1111-1111-1111-111111111111', 'CAPS', 'Caps', 'Future wardrobe expansion.', 90),
  ('11111111-1111-1111-1111-111111111111', 'ACCESSORIES', 'Accessories', 'Future wardrobe expansion.', 100),
  ('11111111-1111-1111-1111-111111111111', 'SETS', 'Sets', 'Future wardrobe expansion.', 110)
on conflict (brand_id, code) do update
set label = excluded.label,
    description = excluded.description,
    sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- 2. Product columns and canonical category taxonomy
-- ---------------------------------------------------------------------------
alter table public.products
  add column if not exists slug text,
  add column if not exists sku text,
  add column if not exists description text,
  add column if not exists product_type_code text,
  add column if not exists collection_name text,
  add column if not exists fit text,
  add column if not exists material text,
  add column if not exists gender_classification text not null default 'unisex',
  add column if not exists compare_at_price integer,
  add column if not exists cost_price integer,
  add column if not exists status text not null default 'active',
  add column if not exists featured boolean not null default false,
  add column if not exists bestseller boolean not null default false,
  add column if not exists new_arrival boolean not null default false,
  add column if not exists limited_drop boolean not null default false,
  add column if not exists release_date date,
  add column if not exists care_instructions text,
  add column if not exists model_fit_note text,
  add column if not exists is_new_arrival boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists sb_products_updated_at on public.products;
create trigger sb_products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products drop constraint if exists products_status_check;
alter table public.products add constraint products_status_check
  check (status in ('draft', 'active', 'archived'));

alter table public.products drop constraint if exists products_brand_type_fkey;
alter table public.products add constraint products_brand_type_fkey
  foreign key (brand_id, product_type_code)
  references public.sb_product_types(brand_id, code)
  on update cascade on delete set null;

create unique index if not exists products_brand_slug_key
  on public.products (brand_id, slug) where slug is not null;

update public.products
set slug = coalesce(
      nullif(slug, ''),
      regexp_replace(lower(coalesce(name, 'product')), '[^a-z0-9]+', '-', 'g') || '-' || left(id, 8)
    ),
    product_type_code = coalesce(product_type_code, case
      when lower(coalesce(category, '')) in ('t-shirts', 'tshirts', 't-shirt') then 'TEE'
      when lower(coalesce(category, '')) in ('vests', 'vest') then 'VEST'
      when lower(coalesce(category, '')) in ('short-sleeve-shirts', 'shirts', 'shirt') then 'SHORT_SLEEVE_SHIRT'
      when lower(coalesce(category, '')) in ('shorts', 'short') then 'SHORTS'
      else null
    end),
    featured = coalesce(featured, coalesce(is_featured, false)),
    bestseller = coalesce(bestseller, coalesce(is_best_seller, false)),
    new_arrival = coalesce(new_arrival, coalesce(is_new_arrival, false)),
    is_new_arrival = coalesce(is_new_arrival, new_arrival)
where brand_id = '11111111-1111-1111-1111-111111111111'::uuid;

update public.products
set is_featured = featured,
    is_best_seller = bestseller,
    is_new_arrival = new_arrival
where brand_id = '11111111-1111-1111-1111-111111111111'::uuid;

insert into public.wearable_categories (name, slug, description, sort_order, is_active)
values
  ('T-Shirts', 't-shirts', 'Graphic, oversized, statement, essential and limited drop tees.', 10, true),
  ('Vests', 'vests', 'Graphic, oversized, essential and summer vests.', 20, true),
  ('Short-Sleeve Shirts', 'short-sleeve-shirts', 'Graphic, printed, relaxed and statement shirts.', 30, true),
  ('Shorts', 'shorts', 'Street, graphic, relaxed, utility and matching sets.', 40, true)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    sort_order = excluded.sort_order,
    is_active = true;

-- ---------------------------------------------------------------------------
-- 3. Product variants
-- ---------------------------------------------------------------------------
create table if not exists public.sb_product_variants (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '11111111-1111-1111-1111-111111111111'
    references public.brands(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  sku text not null,
  size_label text not null,
  color text not null default 'Black',
  price_mwk integer not null check (price_mwk >= 0),
  compare_at_price_mwk integer,
  cost_price_mwk integer,
  stock_qty integer not null default 0 check (stock_qty >= 0),
  reserved_qty integer not null default 0 check (reserved_qty >= 0),
  weight_grams integer,
  availability text not null default 'in_stock'
    check (availability in ('in_stock', 'low_stock', 'out_of_stock', 'disabled')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, sku),
  unique (product_id, size_label, color)
);

create index if not exists sb_product_variants_product_idx
  on public.sb_product_variants (brand_id, product_id, is_active);

alter table public.sb_product_variants enable row level security;
drop trigger if exists sb_product_variants_updated_at on public.sb_product_variants;
create trigger sb_product_variants_updated_at before update on public.sb_product_variants
  for each row execute function public.set_updated_at();

create or replace function public.sb_variant_availability()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.is_active = false then
    new.availability := 'disabled';
  elsif new.stock_qty <= new.reserved_qty then
    new.availability := 'out_of_stock';
  elsif new.stock_qty - new.reserved_qty <= 5 then
    new.availability := 'low_stock';
  else
    new.availability := 'in_stock';
  end if;
  return new;
end;
$$;

drop trigger if exists sb_variant_availability_set on public.sb_product_variants;
create trigger sb_variant_availability_set
  before insert or update of stock_qty, reserved_qty, is_active on public.sb_product_variants
  for each row execute function public.sb_variant_availability();

drop policy if exists sb_product_variants_public_read on public.sb_product_variants;
create policy sb_product_variants_public_read on public.sb_product_variants
  for select to anon, authenticated
  using (
    is_active
    and brand_id = '11111111-1111-1111-1111-111111111111'::uuid
    and exists (
      select 1 from public.products p
      where p.id = sb_product_variants.product_id
        and p.brand_id = sb_product_variants.brand_id
        and p.is_active = true
    )
  );
drop policy if exists sb_product_variants_admin_all on public.sb_product_variants;
create policy sb_product_variants_admin_all on public.sb_product_variants
  for all to authenticated
  using (public.has_brand_access(brand_id))
  with check (public.has_brand_access(brand_id));

revoke all on table public.sb_product_variants from anon;
grant select on table public.sb_product_variants to anon, authenticated;
revoke insert, update, delete on table public.sb_product_variants from authenticated;
grant insert, update, delete on table public.sb_product_variants to authenticated;

-- Backfill variants from the legacy size option list. Remove only the rows
-- this backfill owns so the migration is safe to re-run after a partial apply.
delete from public.sb_product_variants
where brand_id = '11111111-1111-1111-1111-111111111111'::uuid
  and sku like 'SBVAR-%';

insert into public.sb_product_variants (
  brand_id, product_id, sku, size_label, color, price_mwk, compare_at_price_mwk,
  cost_price_mwk, stock_qty, weight_grams
)
select
  p.brand_id,
  p.id,
  'SBVAR-' || p.id || '-' || regexp_replace(upper(pt.name), '[^A-Z0-9]', '', 'g'),
  pt.name,
  'Black',
  p.price,
  p.compare_at_price,
  p.cost_price,
  greatest(0, coalesce(i.quantity, p.stock_quantity, 0)),
  null
from public.products p
join public.product_types pt on pt.product_id = p.id
left join public.inventory i on i.product_id = p.id
where p.brand_id = '11111111-1111-1111-1111-111111111111'::uuid
  and p.product_type_code in ('TEE', 'VEST', 'SHORT_SLEEVE_SHIRT', 'SHORTS')
  and nullif(btrim(pt.name), '') is not null
on conflict (product_id, size_label, color) do nothing;

-- ---------------------------------------------------------------------------
-- 4. Collections and drops
-- ---------------------------------------------------------------------------
create table if not exists public.sb_collections (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '11111111-1111-1111-1111-111111111111'
    references public.brands(id) on delete cascade,
  kind text not null default 'collection' check (kind in ('collection', 'drop')),
  name text not null,
  slug text not null,
  description text,
  hero_image text,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  release_date date,
  limited_drop boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, kind, slug)
);

create table if not exists public.sb_collection_products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '11111111-1111-1111-1111-111111111111'
    references public.brands(id) on delete cascade,
  collection_id uuid not null references public.sb_collections(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (collection_id, product_id)
);

create index if not exists sb_collection_products_collection_idx
  on public.sb_collection_products (collection_id, sort_order);

alter table public.sb_collections enable row level security;
alter table public.sb_collection_products enable row level security;
drop trigger if exists sb_collections_updated_at on public.sb_collections;
create trigger sb_collections_updated_at before update on public.sb_collections
  for each row execute function public.set_updated_at();

drop policy if exists sb_collections_public_read on public.sb_collections;
create policy sb_collections_public_read on public.sb_collections
  for select to anon, authenticated
  using (
    is_active
    and brand_id = '11111111-1111-1111-1111-111111111111'::uuid
  );
drop policy if exists sb_collections_admin_all on public.sb_collections;
create policy sb_collections_admin_all on public.sb_collections
  for all to authenticated
  using (public.has_brand_access(brand_id))
  with check (public.has_brand_access(brand_id));

drop policy if exists sb_collection_products_public_read on public.sb_collection_products;
create policy sb_collection_products_public_read on public.sb_collection_products
  for select to anon, authenticated
  using (
    brand_id = '11111111-1111-1111-1111-111111111111'::uuid
    and exists (
      select 1 from public.sb_collections c
      where c.id = sb_collection_products.collection_id
        and c.is_active
        and c.brand_id = sb_collection_products.brand_id
    )
  );
drop policy if exists sb_collection_products_admin_all on public.sb_collection_products;
create policy sb_collection_products_admin_all on public.sb_collection_products
  for all to authenticated
  using (public.has_brand_access(brand_id))
  with check (public.has_brand_access(brand_id));

revoke all on table public.sb_collections, public.sb_collection_products from anon;
grant select on table public.sb_collections, public.sb_collection_products to anon, authenticated;
revoke insert, update, delete on table public.sb_collections, public.sb_collection_products from authenticated;
grant insert, update, delete on table public.sb_collections, public.sb_collection_products to authenticated;

insert into public.sb_collections (
  brand_id, kind, name, slug, description, is_active, is_featured, release_date, limited_drop, sort_order
)
values (
  '11111111-1111-1111-1111-111111111111', 'drop', 'SB Drop 001', 'sb-drop-001',
  'The first full SB wardrobe drop. Tees, vests, shirts and shorts made to work together.',
  true, true, current_date, true, 10
)
on conflict (brand_id, kind, slug) do update
set name = excluded.name,
    description = excluded.description,
    is_active = true,
    is_featured = true,
    limited_drop = true;

-- ---------------------------------------------------------------------------
-- 5. Shoppable looks, related products and complete-the-look rules
-- ---------------------------------------------------------------------------
create table if not exists public.sb_looks (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '11111111-1111-1111-1111-111111111111'
    references public.brands(id) on delete cascade,
  title text not null,
  slug text not null,
  subtitle text,
  description text,
  hero_image text,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, slug)
);

create table if not exists public.sb_look_items (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '11111111-1111-1111-1111-111111111111'
    references public.brands(id) on delete cascade,
  look_id uuid not null references public.sb_looks(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  variant_id uuid references public.sb_product_variants(id) on delete set null,
  role text,
  styling_note text,
  is_purchasable boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (look_id, product_id)
);

create table if not exists public.sb_product_relations (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '11111111-1111-1111-1111-111111111111'
    references public.brands(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  related_product_id text not null references public.products(id) on delete cascade,
  relation_type text not null default 'complete_look'
    check (relation_type in ('related', 'complete_look')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (brand_id, product_id, related_product_id, relation_type),
  check (product_id <> related_product_id)
);

create table if not exists public.sb_complete_look_rules (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '11111111-1111-1111-1111-111111111111'
    references public.brands(id) on delete cascade,
  source_type_code text not null,
  suggested_type_code text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  unique (brand_id, source_type_code, suggested_type_code),
  foreign key (brand_id, source_type_code)
    references public.sb_product_types(brand_id, code) on delete cascade,
  foreign key (brand_id, suggested_type_code)
    references public.sb_product_types(brand_id, code) on delete cascade
);

alter table public.sb_looks enable row level security;
alter table public.sb_look_items enable row level security;
alter table public.sb_product_relations enable row level security;
alter table public.sb_complete_look_rules enable row level security;

drop trigger if exists sb_looks_updated_at on public.sb_looks;
create trigger sb_looks_updated_at before update on public.sb_looks
  for each row execute function public.set_updated_at();

drop policy if exists sb_looks_public_read on public.sb_looks;
create policy sb_looks_public_read on public.sb_looks
  for select to anon, authenticated
  using (
    is_published
    and brand_id = '11111111-1111-1111-1111-111111111111'::uuid
  );
drop policy if exists sb_looks_admin_all on public.sb_looks;
create policy sb_looks_admin_all on public.sb_looks
  for all to authenticated
  using (public.has_brand_access(brand_id))
  with check (public.has_brand_access(brand_id));

drop policy if exists sb_look_items_public_read on public.sb_look_items;
create policy sb_look_items_public_read on public.sb_look_items
  for select to anon, authenticated
  using (
    brand_id = '11111111-1111-1111-1111-111111111111'::uuid
    and is_purchasable
    and exists (
      select 1 from public.sb_looks l
      where l.id = sb_look_items.look_id
        and l.is_published
        and l.brand_id = sb_look_items.brand_id
    )
  );
drop policy if exists sb_look_items_admin_all on public.sb_look_items;
create policy sb_look_items_admin_all on public.sb_look_items
  for all to authenticated
  using (public.has_brand_access(brand_id))
  with check (public.has_brand_access(brand_id));

drop policy if exists sb_product_relations_public_read on public.sb_product_relations;
create policy sb_product_relations_public_read on public.sb_product_relations
  for select to anon, authenticated
  using (brand_id = '11111111-1111-1111-1111-111111111111'::uuid);
drop policy if exists sb_product_relations_admin_all on public.sb_product_relations;
create policy sb_product_relations_admin_all on public.sb_product_relations
  for all to authenticated
  using (public.has_brand_access(brand_id))
  with check (public.has_brand_access(brand_id));

drop policy if exists sb_complete_look_rules_public_read on public.sb_complete_look_rules;
create policy sb_complete_look_rules_public_read on public.sb_complete_look_rules
  for select to anon, authenticated
  using (
    is_active
    and brand_id = '11111111-1111-1111-1111-111111111111'::uuid
  );
drop policy if exists sb_complete_look_rules_admin_all on public.sb_complete_look_rules;
create policy sb_complete_look_rules_admin_all on public.sb_complete_look_rules
  for all to authenticated
  using (public.has_brand_access(brand_id))
  with check (public.has_brand_access(brand_id));

revoke all on table public.sb_looks, public.sb_look_items, public.sb_product_relations,
  public.sb_complete_look_rules from anon;
grant select on table public.sb_looks, public.sb_look_items, public.sb_product_relations,
  public.sb_complete_look_rules to anon, authenticated;
revoke insert, update, delete on table public.sb_looks, public.sb_look_items,
  public.sb_product_relations, public.sb_complete_look_rules from authenticated;
grant insert, update, delete on table public.sb_looks, public.sb_look_items,
  public.sb_product_relations, public.sb_complete_look_rules to authenticated;

insert into public.sb_looks (
  brand_id, title, slug, subtitle, description, is_published, is_featured, sort_order
)
values (
  '11111111-1111-1111-1111-111111111111',
  'Blantyre After Dark',
  'blantyre-after-dark',
  'Look 01',
  'A full SB streetwear outfit for nights out in Blantyre. Click each piece to shop the look.',
  true, true, 10
)
on conflict (brand_id, slug) do update
set title = excluded.title,
    subtitle = excluded.subtitle,
    description = excluded.description,
    is_published = true,
    is_featured = true;

insert into public.sb_complete_look_rules (brand_id, source_type_code, suggested_type_code, sort_order)
values
  ('11111111-1111-1111-1111-111111111111', 'TEE', 'SHORTS', 10),
  ('11111111-1111-1111-1111-111111111111', 'VEST', 'SHORTS', 20),
  ('11111111-1111-1111-1111-111111111111', 'SHORT_SLEEVE_SHIRT', 'SHORTS', 30),
  ('11111111-1111-1111-1111-111111111111', 'SHORTS', 'TEE', 40),
  ('11111111-1111-1111-1111-111111111111', 'TEE', 'SHORT_SLEEVE_SHIRT', 50)
on conflict (brand_id, source_type_code, suggested_type_code) do update
set sort_order = excluded.sort_order,
    is_active = true;

-- ---------------------------------------------------------------------------
-- 6. Editorial and campaign placement
-- ---------------------------------------------------------------------------
create table if not exists public.sb_campaigns (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '11111111-1111-1111-1111-111111111111'
    references public.brands(id) on delete cascade,
  name text not null,
  slug text not null,
  headline text,
  description text,
  hero_image text,
  cta_label text,
  cta_href text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, slug)
);

create table if not exists public.sb_editorial_placements (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '11111111-1111-1111-1111-111111111111'
    references public.brands(id) on delete cascade,
  section_key text not null
    check (section_key in ('home_hero', 'new_arrivals', 'sb_tee', 'complete_look', 'sb_street')),
  campaign_id uuid references public.sb_campaigns(id) on delete set null,
  product_id text references public.products(id) on delete cascade,
  look_id uuid references public.sb_looks(id) on delete cascade,
  collection_id uuid references public.sb_collections(id) on delete cascade,
  headline text,
  body text,
  cta_label text,
  cta_href text,
  image_override text,
  sort_order integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sb_editorial_placements_section_idx
  on public.sb_editorial_placements (brand_id, section_key, is_active, sort_order);

alter table public.sb_campaigns enable row level security;
alter table public.sb_editorial_placements enable row level security;

drop trigger if exists sb_campaigns_updated_at on public.sb_campaigns;
create trigger sb_campaigns_updated_at before update on public.sb_campaigns
  for each row execute function public.set_updated_at();
drop trigger if exists sb_editorial_placements_updated_at on public.sb_editorial_placements;
create trigger sb_editorial_placements_updated_at before update on public.sb_editorial_placements
  for each row execute function public.set_updated_at();

create or replace function public.sb_placement_is_live(
  p_starts_at timestamptz,
  p_ends_at timestamptz
)
returns boolean
language sql
stable
set search_path = public
as $$
  select (p_starts_at is null or p_starts_at <= now())
     and (p_ends_at is null or p_ends_at >= now());
$$;

drop policy if exists sb_campaigns_public_read on public.sb_campaigns;
create policy sb_campaigns_public_read on public.sb_campaigns
  for select to anon, authenticated
  using (
    is_active
    and brand_id = '11111111-1111-1111-1111-111111111111'::uuid
    and public.sb_placement_is_live(starts_at, ends_at)
  );
drop policy if exists sb_campaigns_admin_all on public.sb_campaigns;
create policy sb_campaigns_admin_all on public.sb_campaigns
  for all to authenticated
  using (public.has_brand_access(brand_id))
  with check (public.has_brand_access(brand_id));

drop policy if exists sb_editorial_placements_public_read on public.sb_editorial_placements;
create policy sb_editorial_placements_public_read on public.sb_editorial_placements
  for select to anon, authenticated
  using (
    is_active
    and brand_id = '11111111-1111-1111-1111-111111111111'::uuid
    and public.sb_placement_is_live(starts_at, ends_at)
  );
drop policy if exists sb_editorial_placements_admin_all on public.sb_editorial_placements;
create policy sb_editorial_placements_admin_all on public.sb_editorial_placements
  for all to authenticated
  using (public.has_brand_access(brand_id))
  with check (public.has_brand_access(brand_id));

revoke all on table public.sb_campaigns, public.sb_editorial_placements from anon;
grant select on table public.sb_campaigns, public.sb_editorial_placements to anon, authenticated;
revoke insert, update, delete on table public.sb_campaigns, public.sb_editorial_placements from authenticated;
grant insert, update, delete on table public.sb_campaigns, public.sb_editorial_placements to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Server owned variant stock changes
-- ---------------------------------------------------------------------------
create or replace function public.sb_set_variant_stock(
  p_variant_id uuid,
  p_stock_qty integer,
  p_reserved_qty integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_variant public.sb_product_variants%rowtype;
begin
  if p_stock_qty is null or p_stock_qty < 0 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_quantity');
  end if;

  select * into v_variant from public.sb_product_variants where id = p_variant_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if v_variant.brand_id <> '11111111-1111-1111-1111-111111111111'::uuid
     or not public.has_brand_access(v_variant.brand_id) then
    return jsonb_build_object('ok', false, 'reason', 'no_access');
  end if;

  update public.sb_product_variants
  set stock_qty = p_stock_qty,
      reserved_qty = coalesce(p_reserved_qty, reserved_qty),
      updated_at = now()
  where id = p_variant_id;

  return jsonb_build_object('ok', true, 'variant_id', p_variant_id);
end;
$$;

create or replace function public.sb_adjust_variant_stock(
  p_variant_id uuid,
  p_delta integer,
  p_reserve boolean default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_variant public.sb_product_variants%rowtype;
  v_is_service boolean := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  ) = 'service_role';
begin
  if not v_is_service then
    return jsonb_build_object('ok', false, 'reason', 'no_access');
  end if;
  if p_delta is null or p_delta < 1 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_quantity');
  end if;

  select * into v_variant from public.sb_product_variants where id = p_variant_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if p_reserve is true then
    if v_variant.stock_qty - v_variant.reserved_qty < p_delta then
      return jsonb_build_object('ok', false, 'reason', 'insufficient_stock');
    end if;
    update public.sb_product_variants
    set reserved_qty = reserved_qty + p_delta, updated_at = now()
    where id = p_variant_id;
  elsif p_reserve is false then
    update public.sb_product_variants
    set reserved_qty = greatest(0, reserved_qty - p_delta),
        updated_at = now()
    where id = p_variant_id;
  else
    update public.sb_product_variants
    set stock_qty = greatest(0, stock_qty - p_delta),
        reserved_qty = greatest(0, reserved_qty - p_delta),
        updated_at = now()
    where id = p_variant_id;
  end if;

  return jsonb_build_object('ok', true, 'variant_id', p_variant_id);
end;
$$;

revoke all on function public.sb_set_variant_stock(uuid, integer, integer) from public, anon;
grant execute on function public.sb_set_variant_stock(uuid, integer, integer) to authenticated, service_role;
revoke all on function public.sb_adjust_variant_stock(uuid, integer, boolean) from public, anon, authenticated;
grant execute on function public.sb_adjust_variant_stock(uuid, integer, boolean) to service_role;
