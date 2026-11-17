-- Lake Fresh compliant pilot
-- Storefront shows three delivery areas and five fish options.
-- The order by time is 8 PM Blantyre time for next day delivery.

alter table public.fish_products
  add column if not exists pilot_option text;

create unique index if not exists fish_products_brand_pilot_option_key
  on public.fish_products (brand_id, pilot_option)
  where pilot_option is not null;

do $$
declare
  v_brand uuid := '22222222-2222-2222-2222-222222222222';
  v_chambo uuid;
  v_usipa uuid;
  v_chisense uuid;
begin
  select id into v_chambo
  from public.fish_species
  where brand_id = v_brand and slug = 'chambo';

  select id into v_usipa
  from public.fish_species
  where brand_id = v_brand and slug = 'usipa';

  insert into public.fish_species (
    brand_id, name, slug, description, image, storage_info, handling_info, is_active, sort_order
  )
  values (
    v_brand,
    'Chisense',
    'chisense',
    'Fresh Chisense from Lake Malawi.',
    null,
    'Keep refrigerated at 0 to 4°C. Eat within 2 days of delivery.',
    'Handle with clean hands; rinse before cooking.',
    true,
    4
  )
  on conflict (brand_id, slug) do update
    set name = excluded.name,
        description = excluded.description,
        storage_info = excluded.storage_info,
        handling_info = excluded.handling_info,
        is_active = true,
        sort_order = excluded.sort_order,
        updated_at = now()
  returning id into v_chisense;

  -- Every seasoning works with every pilot fish, including Chisense.
  update public.lf_spices
  set recommended_species = case
    when v_chisense = any(coalesce(recommended_species, '{}'::uuid[]))
      then recommended_species
    else coalesce(recommended_species, '{}'::uuid[]) || v_chisense
  end,
      updated_at = now()
  where brand_id = v_brand and is_active
    and not (v_chisense = any(coalesce(recommended_species, '{}'::uuid[])));

  insert into public.fish_products (
    brand_id, species_id, name, description, price_per_kg_mwk,
    min_order_qty_kg, preparation_options, availability_status,
    image, is_active, sort_order, pilot_option
  )
  values
    (
      v_brand, v_chambo, 'Fresh Chambo',
      'Fresh Chambo from Lake Malawi. Whole, cleaned, cut or seasoned. Priced per kilogram.',
      4500, 0.500,
      '["whole","cleaned","portioned","seasoned"]'::jsonb,
      'available', '/brand/lake-fresh/fish-chambo.jpg', true, 1, 'fresh_chambo'
    ),
    (
      v_brand, v_usipa, 'Fresh Usipa',
      'Fresh Usipa from Lake Malawi. Cleaned or seasoned. Priced per kilogram.',
      2500, 0.500,
      '["whole","cleaned","seasoned"]'::jsonb,
      'available', '/brand/lake-fresh/fish-usipa.jpg', true, 2, 'fresh_usipa'
    ),
    (
      v_brand, v_chisense, 'Fresh Chisense',
      'Fresh Chisense from Lake Malawi. Cleaned or seasoned. Priced per kilogram.',
      3200, 0.500,
      '["whole","cleaned","seasoned"]'::jsonb,
      'available', null, true, 3, 'fresh_chisense'
    ),
    (
      '22222222-2222-2222-2222-222222222222', v_chambo, 'Chambo Cuts',
      'Fresh Chambo cleaned and cut into even pieces. Seasoned if you like. Priced per kilogram.',
      4800, 0.500,
      '["cleaned","portioned","seasoned"]'::jsonb,
      'available', '/brand/lake-fresh/fish-chambo.jpg', true, 4, 'fish_cuts'
    ),
    (
      '22222222-2222-2222-2222-222222222222', v_chambo, 'Family Fish Box',
      'A bigger box of fresh Chambo for the family. Cleaned, cut or seasoned. Priced per kilogram.',
      4200, 2.000,
      '["cleaned","portioned","seasoned"]'::jsonb,
      'available', '/brand/lake-fresh/fish-chambo.jpg', true, 5, 'family_box'
    )
  on conflict (brand_id, pilot_option) where pilot_option is not null do update
    set species_id = excluded.species_id,
        name = excluded.name,
        description = excluded.description,
        price_per_kg_mwk = excluded.price_per_kg_mwk,
        min_order_qty_kg = excluded.min_order_qty_kg,
        preparation_options = excluded.preparation_options,
        availability_status = excluded.availability_status,
        image = excluded.image,
        is_active = true,
        sort_order = excluded.sort_order,
        updated_at = now();

  -- Only the five pilot options stay visible in the storefront.
  update public.fish_products
  set is_active = false,
      pilot_option = null,
      updated_at = now()
  where brand_id = v_brand
    and (pilot_option is null or pilot_option not in (
      'fresh_chambo', 'fresh_usipa', 'fresh_chisense', 'fish_cuts', 'family_box'
    ));

  -- Stock for the new species. Existing species already have stock batches.
  insert into public.fish_inventory_batches (
    brand_id, species_id, received_date, expiry_date,
    weight_kg_received, weight_kg_available, freshness_grade, notes
  )
  select v_brand, v_chisense, (now() at time zone 'Africa/Blantyre')::date, null,
         24.000, 24.000, 'A', 'Pilot launch stock'
  where not exists (
    select 1
    from public.fish_inventory_batches
    where brand_id = v_brand
      and species_id = v_chisense
      and notes = 'Pilot launch stock'
  );

  -- Three pilot delivery areas only. Other zones stay in the database for admin use.
  update public.delivery_zones
  set is_active = slug = any(array['nkolokosa', 'soche-east', 'chitawira']),
      updated_at = now()
  where brand_id = v_brand;

  insert into public.brand_settings (brand_id, setting_key, setting_value)
  values (v_brand, 'delivery.cutoff', '"20:00"'::jsonb)
  on conflict (brand_id, setting_key) do update
    set setting_value = excluded.setting_value;
end $$;

-- Existing slots must match the new 8 PM Blantyre cutoff.
update public.delivery_slots
set cutoff_at = ((delivery_date - 1)::timestamp + time '20:00') at time zone 'Africa/Blantyre'
where brand_id = '22222222-2222-2222-2222-222222222222';

-- Public catalogue now exposes the pilot option key so the storefront can limit the list.
drop function if exists public.lf_public_catalog();

create or replace function public.lf_public_catalog()
returns table (
  id uuid,
  species_id uuid,
  species_name text,
  species_slug text,
  name text,
  description text,
  price_per_kg_mwk integer,
  min_order_qty_kg numeric,
  preparation_options jsonb,
  availability_status text,
  image text,
  storage_info text,
  handling_info text,
  available_kg numeric,
  sort_order integer,
  pilot_option text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.species_id,
    s.name as species_name,
    s.slug as species_slug,
    p.name,
    p.description,
    p.price_per_kg_mwk,
    p.min_order_qty_kg,
    p.preparation_options,
    case
      when coalesce(b.available_kg, 0) > 0 then p.availability_status
      else 'sold_out'
    end as availability_status,
    p.image,
    s.storage_info,
    s.handling_info,
    coalesce(b.available_kg, 0) as available_kg,
    p.sort_order,
    p.pilot_option
  from public.fish_products p
  left join public.fish_species s
    on s.id = p.species_id and s.brand_id = p.brand_id
  left join (
    select species_id, sum(weight_kg_available) as available_kg
    from public.fish_inventory_batches
    where brand_id = '22222222-2222-2222-2222-222222222222'
      and weight_kg_available > 0
      and (expiry_date is null or expiry_date >= (now() at time zone 'Africa/Blantyre')::date)
    group by species_id
  ) b on b.species_id = p.species_id
  where p.brand_id = '22222222-2222-2222-2222-222222222222'
    and p.is_active
  order by p.sort_order, p.name;
$$;

revoke all on function public.lf_public_catalog() from public;
grant execute on function public.lf_public_catalog() to anon, authenticated;
