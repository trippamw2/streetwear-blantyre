-- Product tags for the SB wardrobe.
-- Tags are first-class merchandising data so products can be grouped by mood,
-- story, capsule or campaign without hard-coding category logic.

create table if not exists public.sb_product_tags (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '11111111-1111-1111-1111-111111111111'
    references public.brands(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  tag text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (brand_id, product_id, tag)
);

create index if not exists sb_product_tags_product_idx
  on public.sb_product_tags (brand_id, product_id, sort_order);

alter table public.sb_product_tags enable row level security;

drop policy if exists sb_product_tags_public_read on public.sb_product_tags;
create policy sb_product_tags_public_read on public.sb_product_tags
  for select to anon, authenticated
  using (
    brand_id = '11111111-1111-1111-1111-111111111111'::uuid
  );

drop policy if exists sb_product_tags_admin_all on public.sb_product_tags;
create policy sb_product_tags_admin_all on public.sb_product_tags
  for all to authenticated
  using (public.has_brand_access(brand_id))
  with check (public.has_brand_access(brand_id));

revoke all on table public.sb_product_tags from anon;
grant select on table public.sb_product_tags to anon, authenticated;
revoke insert, update, delete on table public.sb_product_tags from authenticated;
grant insert, update, delete on table public.sb_product_tags to authenticated;
