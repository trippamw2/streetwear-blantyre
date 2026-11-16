-- RLS / brand isolation verification queries (run against a test Supabase project)
-- Expectations: anonymous users cannot read non-public rows; LF rows are invisible
-- to SB-scoped queries and vice versa.

-- 1. Anonymous cannot read orders
-- set role anon;
-- select count(*) from public.orders; -- expect 0 (RLS denies)

-- 2. LF fish products are scoped to LF brand
-- select distinct brand_id from public.fish_products; -- expect only LF uuid for LF rows

-- 3. LF delivery zones do not leak SB brand
-- select count(*) from public.delivery_zones where brand_id = '11111111-1111-1111-1111-111111111111';
-- expect 0 for LF-only tables.

-- 4. payment_events readable only by admins
-- set role authenticated; -- as non-admin user
-- select count(*) from public.payment_events; -- expect 0

-- 5. process_payment_event not callable by anon/authenticated
-- select has_function_privilege('anon', 'public.process_payment_event(text,text,numeric,text,text,text,text,text,jsonb)', 'EXECUTE'); -- expect false
