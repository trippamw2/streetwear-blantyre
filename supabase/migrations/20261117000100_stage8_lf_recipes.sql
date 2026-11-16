-- Stage 8: Lake Fresh recipe card system

create table if not exists public.lf_recipes (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '22222222-2222-2222-2222-222222222222' references public.brands(id),
  title text not null,
  slug text not null unique,
  species_id uuid references public.fish_species(id),
  image text,
  prep_time_min integer,
  cook_time_min integer,
  servings integer,
  cooking_method text,
  ingredients jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  recommended_spice text,
  recommended_marinade text,
  safety_notes text,
  qr_target_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lf_recipe_products (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.lf_recipes(id) on delete cascade,
  fish_product_id uuid references public.fish_products(id) on delete set null,
  product_type text not null default 'fish',
  product_name text,
  sort_order integer not null default 0
);

alter table public.lf_recipes enable row level security;
alter table public.lf_recipe_products enable row level security;

drop policy if exists lf_recipes_public_read on public.lf_recipes;
create policy lf_recipes_public_read on public.lf_recipes for select using (is_active = true);

drop policy if exists lf_recipe_products_public_read on public.lf_recipe_products;
create policy lf_recipe_products_public_read on public.lf_recipe_products for select using (
  exists (select 1 from public.lf_recipes r where r.id = recipe_id and r.is_active = true)
);

drop policy if exists lf_recipes_admin_all on public.lf_recipes;
create policy lf_recipes_admin_all on public.lf_recipes for all using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists lf_recipe_products_admin_all on public.lf_recipe_products;
create policy lf_recipe_products_admin_all on public.lf_recipe_products for all using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create index if not exists idx_lf_recipes_brand on public.lf_recipes(brand_id);
create index if not exists idx_lf_recipes_species on public.lf_recipes(species_id);
create index if not exists idx_lf_recipes_slug on public.lf_recipes(slug);
