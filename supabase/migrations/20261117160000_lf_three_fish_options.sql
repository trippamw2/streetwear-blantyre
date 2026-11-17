-- Lake Fresh three fish options
-- The pilot now offers Chambo, Micheni and Usipa only.
-- Cuts, family box and Chisense stay in the database for admin use, hidden from the storefront.

do $$
declare
  v_brand uuid := '22222222-2222-2222-2222-222222222222';
  v_chambo uuid;
  v_micheni uuid;
  v_usipa uuid;
  v_chisense uuid;
begin
  select id into v_chambo from public.fish_species where brand_id = v_brand and slug = 'chambo';
  select id into v_usipa from public.fish_species where brand_id = v_brand and slug = 'usipa';
  select id into v_chisense from public.fish_species where brand_id = v_brand and slug = 'chisense';
  select id into v_micheni from public.fish_species
  where brand_id = v_brand and slug in ('micheni', 'ncheni-micheni')
  order by case when slug = 'micheni' then 0 else 1 end
  limit 1;

  -- Show the Micheni name only. Keep the old row id so recipes and stock stay linked.
  update public.fish_species
  set name = 'Micheni',
      slug = 'micheni',
      description = 'Fresh Micheni from Lake Malawi.',
      is_active = true,
      sort_order = 2,
      updated_at = now()
  where id = v_micheni and brand_id = v_brand;

  -- Chisense is no longer part of the public pilot.
  update public.fish_species
  set is_active = false,
      updated_at = now()
  where id = v_chisense and brand_id = v_brand;

  -- Chambo, Micheni and Usipa are the only public products.
  update public.fish_products
  set name = 'Chambo',
      is_active = true,
      sort_order = 1,
      updated_at = now()
  where brand_id = v_brand and pilot_option = 'fresh_chambo';

  update public.fish_products
  set species_id = v_micheni,
      name = 'Micheni',
      description = 'Fresh Micheni from Lake Malawi. Cleaned or seasoned. Priced per kilogram.',
      price_per_kg_mwk = 3200,
      min_order_qty_kg = 0.500,
      preparation_options = '["whole","cleaned","seasoned"]'::jsonb,
      availability_status = 'available',
      is_active = true,
      sort_order = 2,
      pilot_option = 'fresh_micheni',
      updated_at = now()
  where brand_id = v_brand and pilot_option = 'fresh_chisense';

  update public.fish_products
  set name = 'Usipa',
      is_active = true,
      sort_order = 3,
      updated_at = now()
  where brand_id = v_brand and pilot_option = 'fresh_usipa';

  -- Keep previous options recoverable in admin, but out of the storefront.
  update public.fish_products
  set is_active = false,
      updated_at = now()
  where brand_id = v_brand
    and (pilot_option is null or pilot_option in ('fish_cuts', 'family_box', 'fresh_chisense'));

  -- Every seasoning is paired with the three current fish; remove old Chisense pairings.
  update public.lf_spices
  set recommended_species = case
        when v_micheni = any(coalesce(recommended_species, '{}'::uuid[]))
          then array_remove(coalesce(recommended_species, '{}'::uuid[]), v_chisense)
        else array_remove(coalesce(recommended_species, '{}'::uuid[]) || v_micheni, v_chisense)
      end,
      updated_at = now()
  where brand_id = v_brand and is_active;
end $$;
