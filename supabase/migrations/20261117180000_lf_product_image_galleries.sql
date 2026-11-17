-- Lake Fresh product photo galleries
-- Catch products and seasonings can store up to twelve photos each.
-- The single image field remains the cover photo for older screens.

alter table public.fish_products
  add column if not exists images jsonb not null default '[]'::jsonb;

alter table public.lf_spices
  add column if not exists images jsonb not null default '[]'::jsonb;

update public.fish_products
set images = jsonb_build_array(image)
where brand_id = '22222222-2222-2222-2222-222222222222'
  and image is not null
  and image <> ''
  and jsonb_array_length(images) = 0;

update public.lf_spices
set images = jsonb_build_array(image)
where brand_id = '22222222-2222-2222-2222-222222222222'
  and image is not null
  and image <> ''
  and jsonb_array_length(images) = 0;

-- The active Micheni row was repurposed from an older row and lost its photo.
update public.fish_products
set image = '/brand/lake-fresh/fish-micheni.jpg',
    images = jsonb_build_array('/brand/lake-fresh/fish-micheni.jpg')
where brand_id = '22222222-2222-2222-2222-222222222222'
  and pilot_option = 'fresh_micheni'
  and (image is null or image = '');

drop function if exists public.lf_public_catalog();

create or replace function public.lf_public_catalog()
returns table(
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
  images jsonb,
  storage_info text,
  handling_info text,
  available_kg numeric,
  sort_order integer,
  pilot_option text
)
language sql
stable
security definer
set search_path to 'public'
as $function$
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
    p.images,
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
$function$;

grant execute on function public.lf_public_catalog() to anon, authenticated, postgres, service_role;
