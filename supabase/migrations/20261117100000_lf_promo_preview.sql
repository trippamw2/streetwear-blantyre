-- ---------------------------------------------------------------------------
-- Lake Fresh promo preview
--
-- The checkout shows the customer their saving before they pay, but
-- `promo_codes` is admin only. This function validates a code server side and
-- returns only the public facts needed for the preview, without exposing the
-- full promo table or letting the browser decide the discount. The real
-- discount is still applied by `lf_place_order`.
-- ---------------------------------------------------------------------------

create or replace function public.lf_preview_promo(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_brand uuid := '22222222-2222-2222-2222-222222222222';
  v_promo public.promo_codes%rowtype;
begin
  if nullif(trim(coalesce(p_code, '')), '') is null then
    return jsonb_build_object('ok', false, 'reason', 'empty');
  end if;

  select * into v_promo
  from public.promo_codes
  where brand_id = v_brand
    and upper(code) = upper(trim(p_code))
    and coalesce(is_active, true)
    and (start_date is null or start_date <= now())
    and (end_date is null or end_date >= now())
    and (max_uses is null or coalesce(used_count, 0) < max_uses)
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  return jsonb_build_object(
    'ok', true,
    'code', v_promo.code,
    'type', v_promo.type,
    'value', v_promo.value,
    'min_order', coalesce(v_promo.min_order, 0)
  );
end;
$$;

revoke execute on function public.lf_preview_promo(text) from public;
grant execute on function public.lf_preview_promo(text) to anon, authenticated;
