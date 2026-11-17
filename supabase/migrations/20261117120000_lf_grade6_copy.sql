-- Keep the Lake Fresh catalogue in grade 6, hyphen free language.
update public.fish_products
set description = 'Whole, cleaned or cut in pieces. Priced per kilogram.'
where brand_id = '22222222-2222-2222-2222-222222222222'
  and description ilike '%portioned%';
