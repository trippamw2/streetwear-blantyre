-- SB merchandising content seed.
-- Populates the wardrobe with real products, variants, cross-category
-- collection/look membership, campaigns, placements and tags.
-- Every object is scoped to the SB brand. Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Subcategory taxonomy
-- ---------------------------------------------------------------------------
create table if not exists public.sb_product_subcategories (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null default '11111111-1111-1111-1111-111111111111'
    references public.brands(id) on delete cascade,
  product_type_code text not null,
  name text not null,
  slug text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (brand_id, product_type_code, slug),
  foreign key (brand_id, product_type_code)
    references public.sb_product_types(brand_id, code) on delete cascade
);

create index if not exists sb_product_subcategories_type_idx
  on public.sb_product_subcategories (brand_id, product_type_code, sort_order);

alter table public.sb_product_subcategories enable row level security;

drop policy if exists sb_product_subcategories_public_read on public.sb_product_subcategories;
create policy sb_product_subcategories_public_read on public.sb_product_subcategories
  for select to anon, authenticated
  using (
    is_active
    and brand_id = '11111111-1111-1111-1111-111111111111'::uuid
  );

drop policy if exists sb_product_subcategories_admin_all on public.sb_product_subcategories;
create policy sb_product_subcategories_admin_all on public.sb_product_subcategories
  for all to authenticated
  using (public.has_brand_access(brand_id))
  with check (public.has_brand_access(brand_id));

revoke all on table public.sb_product_subcategories from anon;
grant select on table public.sb_product_subcategories to anon, authenticated;
grant insert, update, delete on table public.sb_product_subcategories to authenticated;

insert into public.sb_product_subcategories
  (brand_id, product_type_code, name, slug, sort_order)
values
  ('11111111-1111-1111-1111-111111111111', 'TEE', 'Graphic', 'graphic', 10),
  ('11111111-1111-1111-1111-111111111111', 'TEE', 'Oversized', 'oversized', 20),
  ('11111111-1111-1111-1111-111111111111', 'TEE', 'Statement', 'statement', 30),
  ('11111111-1111-1111-1111-111111111111', 'TEE', 'Essential', 'essential', 40),
  ('11111111-1111-1111-1111-111111111111', 'TEE', 'Limited Drop', 'limited-drop', 50),
  ('11111111-1111-1111-1111-111111111111', 'VEST', 'Graphic', 'graphic', 10),
  ('11111111-1111-1111-1111-111111111111', 'VEST', 'Oversized', 'oversized', 20),
  ('11111111-1111-1111-1111-111111111111', 'VEST', 'Essential', 'essential', 30),
  ('11111111-1111-1111-1111-111111111111', 'VEST', 'Summer', 'summer', 40),
  ('11111111-1111-1111-1111-111111111111', 'SHORT_SLEEVE_SHIRT', 'Graphic', 'graphic', 10),
  ('11111111-1111-1111-1111-111111111111', 'SHORT_SLEEVE_SHIRT', 'Printed', 'printed', 20),
  ('11111111-1111-1111-1111-111111111111', 'SHORT_SLEEVE_SHIRT', 'Relaxed-Fit', 'relaxed-fit', 30),
  ('11111111-1111-1111-1111-111111111111', 'SHORT_SLEEVE_SHIRT', 'Statement', 'statement', 40),
  ('11111111-1111-1111-1111-111111111111', 'SHORTS', 'Street', 'street', 10),
  ('11111111-1111-1111-1111-111111111111', 'SHORTS', 'Graphic', 'graphic', 20),
  ('11111111-1111-1111-1111-111111111111', 'SHORTS', 'Relaxed', 'relaxed', 30),
  ('11111111-1111-1111-1111-111111111111', 'SHORTS', 'Utility', 'utility', 40),
  ('11111111-1111-1111-1111-111111111111', 'SHORTS', 'Matching Sets', 'matching-sets', 50)
on conflict (brand_id, product_type_code, slug) do update
set name = excluded.name, sort_order = excluded.sort_order, is_active = true;

alter table public.products add column if not exists subcategory text;

-- ---------------------------------------------------------------------------
-- 2. Retire legacy catalogue rows that are not part of the SB wardrobe
-- ---------------------------------------------------------------------------
update public.products
set is_active = false,
    status = 'archived',
    product_type_code = null
where brand_id = '11111111-1111-1111-1111-111111111111'::uuid
  and category = 'jerseys';

-- ---------------------------------------------------------------------------
-- 3. Enrich the existing SB products with real wardrobe data
-- ---------------------------------------------------------------------------
update public.products set
  subcategory = 'Statement',
  fit = 'Relaxed fit',
  material = '100% cotton',
  care_instructions = 'Machine wash cold, inside out. Do not bleach. Tumble dry low.',
  model_fit_note = $$Model is 6'0" and wears size L$$,
  image = coalesce(nullif(image, ''), '/images/sb/hero-campaign.jpg'),
  gallery_images = '["https://qhpemjwrnnuqhfgifxnh.supabase.co/storage/v1/object/public/product-images/products/1784901480773-un3elni.png", "/images/sb/hero-campaign.jpg", "/images/sb/street-campaign.jpg", "/images/sb/look-01.jpg"]'::jsonb,
  collection_name = 'SB Drop 001'
where id = 'prod-ts-001' and brand_id = '11111111-1111-1111-1111-111111111111'::uuid;

update public.products set
  subcategory = 'Graphic',
  fit = 'Relaxed fit',
  material = 'Cotton blend',
  care_instructions = 'Machine wash cold, inside out. Do not bleach. Tumble dry low.',
  model_fit_note = $$Model is 6'0" and wears size L$$,
  image = coalesce(nullif(image, ''), '/images/sb/hero-campaign.jpg'),
  gallery_images = '["https://qhpemjwrnnuqhfgifxnh.supabase.co/storage/v1/object/public/product-images/products/1784893403202-5a2gnv9.png", "/images/sb/hero-campaign.jpg", "/images/sb/street-campaign.jpg", "/images/sb/look-01.jpg"]'::jsonb,
  collection_name = 'SB Drop 001'
where id = 'prod-ts-002' and brand_id = '11111111-1111-1111-1111-111111111111'::uuid;

update public.products set
  subcategory = 'Graphic',
  fit = 'Relaxed fit',
  material = 'Cotton blend',
  care_instructions = 'Machine wash cold, inside out. Do not bleach. Tumble dry low.',
  model_fit_note = $$Model is 6'0" and wears size L$$,
  image = coalesce(nullif(image, ''), '/images/sb/street-campaign.jpg'),
  gallery_images = '["/images/sb/street-campaign.jpg", "/images/sb/hero-campaign.jpg", "/images/sb/look-01.jpg"]'::jsonb,
  collection_name = 'SB Drop 001'
where id in ('prod-ts-003', 'prod-ts-004')
  and brand_id = '11111111-1111-1111-1111-111111111111'::uuid;

update public.products set
  subcategory = case when id = 'sb-ss-001' then 'Relaxed-Fit' else 'Printed' end,
  fit = 'Relaxed fit',
  material = 'Lightweight cotton blend',
  care_instructions = 'Machine wash cold, inside out. Warm iron if needed.',
  model_fit_note = $$Model is 6'0" and wears size L$$,
  image = coalesce(nullif(image, ''), '/images/sb/street-campaign.jpg'),
  gallery_images = '["/images/sb/street-campaign.jpg", "/images/sb/hero-campaign.jpg", "/images/sb/look-01.jpg"]'::jsonb,
  collection_name = 'SB Drop 001'
where id in ('sb-ss-001', 'sb-ss-002')
  and brand_id = '11111111-1111-1111-1111-111111111111'::uuid;

-- ---------------------------------------------------------------------------
-- 4. The missing wardrobe categories: vests and shorts
-- ---------------------------------------------------------------------------
insert into public.products (
  id, brand_id, name, slug, sku, benefit, description, category,
  product_type_code, subcategory, collection_name, fit, material,
  gender_classification, status, price, compare_at_price, cost_price,
  featured, bestseller, new_arrival, limited_drop, release_date,
  care_instructions, model_fit_note, image, images, gallery_images,
  stock_quantity, is_active, sort_order, brand
)
values
  (
    'sb-vest-001', '11111111-1111-1111-1111-111111111111',
    'Blantyre Graphic Vest', 'blantyre-graphic-vest', 'SB-VST-GRP-001',
    'A statement vest built for layering.',
    'A sleeveless graphic vest with a relaxed drape. Wear it over a tee or on its own when the Blantyre heat picks up.',
    'vests', 'VEST', 'Graphic', 'SB Drop 001', 'Relaxed fit', 'Cotton blend',
    'unisex', 'active', 18500, 22000, 9000,
    true, false, true, false, current_date,
    'Machine wash cold, inside out. Do not bleach. Tumble dry low.',
    $$Model is 6'0" and wears size L$$,
    '/images/sb/street-campaign.jpg', '[]'::jsonb,
    '["/images/sb/street-campaign.jpg", "/images/sb/hero-campaign.jpg", "/images/sb/look-01.jpg"]'::jsonb,
    60, true, 50, 'sb-street'
  ),
  (
    'sb-vest-002', '11111111-1111-1111-1111-111111111111',
    'Summer Oversized Vest', 'summer-oversized-vest', 'SB-VST-OVR-002',
    'Easy, airy and made for layering.',
    'An oversized summer vest with a dropped shoulder and open armhole. Cut to move and made to be worn on repeat.',
    'vests', 'VEST', 'Oversized', 'SB Drop 001', 'Oversized fit', 'Cotton blend',
    'unisex', 'active', 17000, null, 8000,
    false, false, true, false, current_date,
    'Machine wash cold, inside out. Do not bleach. Tumble dry low.',
    $$Model is 6'0" and wears size L$$,
    '/images/sb/street-campaign.jpg', '[]'::jsonb,
    '["/images/sb/street-campaign.jpg", "/images/sb/hero-campaign.jpg", "/images/sb/look-01.jpg"]'::jsonb,
    48, true, 60, 'sb-street'
  ),
  (
    'sb-shorts-001', '11111111-1111-1111-1111-111111111111',
    'Street Utility Shorts', 'street-utility-shorts', 'SB-SHT-UTL-001',
    'Everyday shorts with utility details.',
    'Relaxed street shorts with reinforced pockets and a drawcord waist. Built to pair with any SB tee, vest or shirt.',
    'shorts', 'SHORTS', 'Utility', 'SB Drop 001', 'Relaxed fit', 'Cotton twill',
    'unisex', 'active', 22000, null, 11000,
    true, false, true, false, current_date,
    'Machine wash cold. Do not bleach. Hang dry.',
    $$Model is 6'0" and wears size L$$,
    '/images/sb/street-campaign.jpg', '[]'::jsonb,
    '["/images/sb/street-campaign.jpg", "/images/sb/hero-campaign.jpg", "/images/sb/look-01.jpg"]'::jsonb,
    55, true, 70, 'sb-street'
  ),
  (
    'sb-shorts-002', '11111111-1111-1111-1111-111111111111',
    'After Dark Matching Shorts', 'after-dark-matching-shorts', 'SB-SHT-MAT-002',
    'The matching half of the Blantyre After Dark look.',
    'Matching shorts with a clean finish and comfortable wide leg. Designed as the natural partner to the SB tee and vest.',
    'shorts', 'SHORTS', 'Matching Sets', 'SB Drop 001', 'Relaxed fit', 'Cotton blend',
    'unisex', 'active', 24000, 28000, 12000,
    false, false, true, true, current_date,
    'Machine wash cold. Do not bleach. Hang dry.',
    $$Model is 6'0" and wears size L$$,
    '/images/sb/look-01.jpg', '[]'::jsonb,
    '["/images/sb/look-01.jpg", "/images/sb/street-campaign.jpg", "/images/sb/hero-campaign.jpg"]'::jsonb,
    40, true, 80, 'sb-street'
  )
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  sku = excluded.sku,
  description = excluded.description,
  category = excluded.category,
  product_type_code = excluded.product_type_code,
  subcategory = excluded.subcategory,
  collection_name = excluded.collection_name,
  fit = excluded.fit,
  material = excluded.material,
  gender_classification = excluded.gender_classification,
  status = excluded.status,
  price = excluded.price,
  compare_at_price = excluded.compare_at_price,
  cost_price = excluded.cost_price,
  featured = excluded.featured,
  new_arrival = excluded.new_arrival,
  limited_drop = excluded.limited_drop,
  release_date = excluded.release_date,
  care_instructions = excluded.care_instructions,
  model_fit_note = excluded.model_fit_note,
  image = excluded.image,
  gallery_images = excluded.gallery_images,
  stock_quantity = excluded.stock_quantity,
  is_active = true,
  sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- 5. Structured variants: XS-XXL in Black, White and Blue
-- ---------------------------------------------------------------------------
insert into public.sb_product_variants (
  brand_id, product_id, sku, size_label, color,
  price_mwk, compare_at_price_mwk, cost_price_mwk,
  stock_qty, weight_grams, is_active
)
select
  '11111111-1111-1111-1111-111111111111'::uuid,
  p.id,
  'SBVAR2-' || upper(p.id) || '-' || s.size_label || '-' || upper(c.color),
  s.size_label,
  c.color,
  p.price,
  p.compare_at_price,
  p.cost_price,
  8 + ((row_number() over (order by p.id, s.size_label, c.color))::int % 17),
  250,
  true
from public.products p
cross join (select unnest(array['XS', 'S', 'M', 'L', 'XL', 'XXL']) as size_label) s
cross join (select unnest(array['Black', 'White', 'Blue']) as color) c
where p.brand_id = '11111111-1111-1111-1111-111111111111'::uuid
  and p.is_active = true
  and p.product_type_code in ('TEE', 'VEST', 'SHORT_SLEEVE_SHIRT', 'SHORTS')
on conflict (product_id, size_label, color) do nothing;

-- ---------------------------------------------------------------------------
-- 6. SB Drop 001: products across all four categories
-- ---------------------------------------------------------------------------
insert into public.sb_collection_products (brand_id, collection_id, product_id, sort_order)
select
  '11111111-1111-1111-1111-111111111111'::uuid,
  c.id,
  p.id,
  row_number() over (order by p.sort_order, p.id)::int * 10
from public.sb_collections c
cross join public.products p
where c.brand_id = '11111111-1111-1111-1111-111111111111'::uuid
  and c.kind = 'drop'
  and c.slug = 'sb-drop-001'
  and p.brand_id = c.brand_id
  and p.is_active = true
  and p.product_type_code in ('TEE', 'VEST', 'SHORT_SLEEVE_SHIRT', 'SHORTS')
on conflict (collection_id, product_id) do nothing;

-- ---------------------------------------------------------------------------
-- 7. LOOK 01 - BLANTYRE AFTER DARK: clickable, purchasable pieces
-- ---------------------------------------------------------------------------
update public.sb_looks
set title = 'LOOK 01 — BLANTYRE AFTER DARK',
    subtitle = 'A full SB streetwear outfit for nights out in Blantyre.',
    description = 'Every piece in this look is available to buy. Tap an item to shop it.',
    hero_image = '/images/sb/look-01.jpg',
    is_published = true,
    is_featured = true
where brand_id = '11111111-1111-1111-1111-111111111111'::uuid
  and slug = 'blantyre-after-dark';

insert into public.sb_look_items (
  brand_id, look_id, product_id, role, styling_note, is_purchasable, sort_order
)
select
  '11111111-1111-1111-1111-111111111111'::uuid,
  l.id,
  x.product_id,
  x.role,
  x.styling_note,
  true,
  x.sort_order
from public.sb_looks l
cross join (
  select 'prod-ts-001' as product_id, 'Tee' as role, 'The statement layer that starts the look.' as styling_note, 10 as sort_order
  union all select 'sb-vest-001', 'Vest', 'Layer it over the tee for depth.', 20
  union all select 'sb-ss-001', 'Shirt', 'Wear open as a lightweight overshirt.', 30
  union all select 'sb-shorts-001', 'Shorts', 'Ground the outfit with utility shorts.', 40
) x
where l.brand_id = '11111111-1111-1111-1111-111111111111'::uuid
  and l.slug = 'blantyre-after-dark'
on conflict (look_id, product_id) do update set
  role = excluded.role,
  styling_note = excluded.styling_note,
  is_purchasable = true,
  sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- 8. Campaigns and editorial placements
-- ---------------------------------------------------------------------------
insert into public.sb_campaigns (
  brand_id, name, slug, headline, description, hero_image, cta_label, cta_href, is_active
)
values
  ('11111111-1111-1111-1111-111111111111', 'Wear What Speaks', 'wear-what-speaks',
   'WEAR WHAT SPEAKS.', 'A full streetwear wardrobe from Blantyre, Malawi. Built to layer, mix and speak for itself.',
   '/images/sb/hero-campaign.jpg', 'Shop the collection', '/shop', true),
  ('11111111-1111-1111-1111-111111111111', 'The SB Tee', 'the-sb-tee',
   'THE GRAPHIC TEE', 'The piece that started the conversation.',
   '/images/sb/hero-campaign.jpg', 'Shop T-Shirts', '/shop?category=t-shirts', true),
  ('11111111-1111-1111-1111-111111111111', 'SB Street', 'sb-street',
   'SB STREET', 'Made in Blantyre. Worn everywhere. Tees, vests, shirts and shorts that work together.',
   '/images/sb/street-campaign.jpg', 'Shop the wardrobe', '/shop', true),
  ('11111111-1111-1111-1111-111111111111', 'Blantyre After Dark', 'blantyre-after-dark-campaign',
   'LOOK 01 — BLANTYRE AFTER DARK', 'Click each piece to shop the full look.',
   '/images/sb/look-01.jpg', 'Shop the look', '/looks/blantyre-after-dark', true)
on conflict (brand_id, slug) do update set
  name = excluded.name,
  headline = excluded.headline,
  description = excluded.description,
  hero_image = excluded.hero_image,
  cta_label = excluded.cta_label,
  cta_href = excluded.cta_href,
  is_active = true;

delete from public.sb_editorial_placements
where brand_id = '11111111-1111-1111-1111-111111111111'::uuid
  and section_key in ('home_hero', 'new_arrivals', 'sb_tee', 'complete_look', 'sb_street');

insert into public.sb_editorial_placements (
  brand_id, section_key, campaign_id, product_id, look_id, collection_id,
  headline, body, cta_label, cta_href, image_override, sort_order, is_active
)
select
  '11111111-1111-1111-1111-111111111111'::uuid,
  x.section_key,
  (select id from public.sb_campaigns where brand_id = '11111111-1111-1111-1111-111111111111'::uuid and slug = x.campaign_slug),
  x.product_id,
  (select id from public.sb_looks where brand_id = '11111111-1111-1111-1111-111111111111'::uuid and slug = 'blantyre-after-dark'),
  (select id from public.sb_collections where brand_id = '11111111-1111-1111-1111-111111111111'::uuid and kind = 'drop' and slug = 'sb-drop-001'),
  x.headline, x.body, x.cta_label, x.cta_href, x.image_override, x.sort_order, true
from (
  select 'home_hero' as section_key, 'wear-what-speaks' as campaign_slug,
         null::text as product_id, 'WEAR WHAT SPEAKS.' as headline,
         'A full streetwear wardrobe from Blantyre, Malawi. Built to layer, mix and speak for itself.' as body,
         'Shop the collection' as cta_label, '/shop' as cta_href,
         '/images/sb/hero-campaign.jpg'::text as image_override, 10 as sort_order
  union all select 'new_arrivals', 'wear-what-speaks', null,
         'NEW ARRIVALS', 'Fresh pieces across tees, vests, shirts and shorts.',
         'Shop all new arrivals', '/shop?sort=new', '/images/sb/street-campaign.jpg', 10
  union all select 'sb_tee', 'the-sb-tee', 'prod-ts-001',
         'THE GRAPHIC TEE', 'The piece that started the conversation.',
         'Shop T-Shirts', '/shop?category=t-shirts', '/images/sb/hero-campaign.jpg', 10
  union all select 'complete_look', 'blantyre-after-dark-campaign', null,
         'COMPLETE THE LOOK', 'Tee and shorts. Vest and shorts. Shirt and shorts. Built to layer.',
         'Explore all looks', '/looks', '/images/sb/look-01.jpg', 10
  union all select 'sb_street', 'sb-street', null,
         'SB STREET', 'Made in Blantyre. Worn everywhere.',
         'Shop the wardrobe', '/shop', '/images/sb/street-campaign.jpg', 10
) x;

-- ---------------------------------------------------------------------------
-- 9. Product tags for merchandising
-- ---------------------------------------------------------------------------
insert into public.sb_product_tags (brand_id, product_id, tag, sort_order)
select
  '11111111-1111-1111-1111-111111111111'::uuid,
  p.id,
  t.tag,
  t.sort_order
from public.products p
cross join (
  select 'sb-drop-001' as tag, 10 as sort_order
  union all select 'new-arrival', 20
  union all select 'complete-the-look', 30
) t
where p.brand_id = '11111111-1111-1111-1111-111111111111'::uuid
  and p.is_active = true
  and p.product_type_code in ('TEE', 'VEST', 'SHORT_SLEEVE_SHIRT', 'SHORTS')
on conflict (brand_id, product_id, tag) do nothing;

insert into public.sb_product_tags (brand_id, product_id, tag, sort_order)
values
  ('11111111-1111-1111-1111-111111111111', 'sb-shorts-002', 'limited-drop', 40),
  ('11111111-1111-1111-1111-111111111111', 'prod-ts-001', 'statement', 40),
  ('11111111-1111-1111-1111-111111111111', 'sb-vest-001', 'graphic', 40)
on conflict (brand_id, product_id, tag) do nothing;
