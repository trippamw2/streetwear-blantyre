-- Lake Fresh recipe copy cleanup
-- Recipe text uses plain words: no letter-to-letter hyphens and no marinade wording.

create or replace function public.lf_clean_copy(value text)
returns text
language sql
immutable
as $$
  select case
    when value is null then null
    else regexp_replace(
      regexp_replace(
        regexp_replace(value, '\ymarinades?\y', 'spice blend', 'gi'),
        '[—–·]',
        ' ',
        'g'
      ),
      '([A-Za-z])-([A-Za-z])',
      '\1 \2',
      'g'
    )
  end;
$$;

update public.lf_recipes
set
  title = public.lf_clean_copy(title),
  cooking_method = public.lf_clean_copy(cooking_method),
  recommended_spice = public.lf_clean_copy(recommended_spice),
  safety_notes = public.lf_clean_copy(safety_notes),
  ingredients = case
    when jsonb_typeof(ingredients) = 'array' then coalesce(
      (
        select jsonb_agg(public.lf_clean_copy(item #>> '{}') order by position)
        from jsonb_array_elements(ingredients) with ordinality as t(item, position)
      ),
      '[]'::jsonb
    )
    else ingredients
  end,
  steps = case
    when jsonb_typeof(steps) = 'array' then coalesce(
      (
        select jsonb_agg(public.lf_clean_copy(item #>> '{}') order by position)
        from jsonb_array_elements(steps) with ordinality as t(item, position)
      ),
      '[]'::jsonb
    )
    else steps
  end,
  updated_at = now()
where brand_id = '22222222-2222-2222-2222-222222222222';

drop function if exists public.lf_clean_copy(text);
