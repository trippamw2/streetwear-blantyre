-- Restore guest access to the server validated order RPC only.
-- Direct anon access to orders and order_items stays blocked.
grant execute on function public.lf_place_order(
  text, text, uuid, uuid, jsonb, text, boolean, integer, text,
  text, text, double precision, double precision, text, text
) to anon;
