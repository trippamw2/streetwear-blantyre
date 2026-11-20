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

-- 6. No legacy anon policies remain on core commerce tables
-- select tablename, policyname from pg_policies
-- where schemaname = 'public'
--   and tablename in ('orders','order_items','profiles')
--   and (policyname like 'Anon%' or policyname = 'public_read_orders');
-- expect 0 rows.

-- 7. Public LF reads are brand scoped
-- set role anon;
-- select count(*) from public.fish_products; -- expect only active LF rows
-- select count(*) from public.delivery_slots; -- expect only open LF slots
-- select count(*) from public.lf_spices; -- expect only active LF rows

-- 8. Guest insert is locked to SB brand for direct order writes
-- select count(*) from pg_policies
-- where schemaname='public' and tablename='orders'
--   and policyname='guest_checkout_orders_sb'; -- expect 1

-- 9. State changing RPCs are not callable by anon
-- select has_function_privilege('anon', 'public.lf_public_subscription_status(uuid,text)', 'EXECUTE'); -- expect false
-- select has_function_privilege('anon', 'public.lf_place_order(text,text,uuid,uuid,jsonb,text,boolean,integer,text,text,text,double precision,double precision,text,text)', 'EXECUTE'); -- expect true for guest checkout only

-- 10. Refund audit is admin only
-- select count(*) from pg_policies
-- where schemaname='public' and tablename='lf_refund_audit'
--   and policyname='lf_refund_audit_admin_all'; -- expect 1

-- 11. Brand admins, not only global admins, can read their own settings
-- select count(*) from pg_policies
-- where schemaname='public' and tablename='brand_settings'
--   and policyname='brand_settings_admin_all'; -- expect 1
-- select count(*) from public.brand_settings; -- as anon: expect 0 (RLS denies)
-- select count(*) from public.brand_settings
-- where brand_id = '11111111-1111-1111-1111-111111111111'; -- as LF admin: expect 0

-- 12. Only the refund aware five argument status helper remains callable
-- select has_function_privilege('anon', 'public.lf_set_order_status(uuid, public.order_status, text, text, jsonb)', 'EXECUTE'); -- expect false
-- select has_function_privilege('authenticated', 'public.lf_set_order_status(uuid, public.order_status, text, text, jsonb)', 'EXECUTE'); -- expect true
-- select count(*) from pg_proc p
-- join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname='public' and p.proname='lf_set_order_status'
--   and pg_get_function_identity_arguments(p.oid) = 'uuid, order_status, text'; -- expect 0

-- 13. Subscription charge planning is service only; confirmation is admin or service
-- select count(*) from pg_policies
-- where schemaname='public' and tablename='lf_subscription_charges'
--   and policyname='lf_subscription_charges_admin_all'; -- expect 1
-- select has_function_privilege('anon', 'public.lf_prepare_subscription_charges()', 'EXECUTE'); -- expect false
-- select has_function_privilege('authenticated', 'public.lf_prepare_subscription_charges()', 'EXECUTE'); -- expect false
-- select has_function_privilege('service_role', 'public.lf_prepare_subscription_charges()', 'EXECUTE'); -- expect true
-- select has_function_privilege('anon', 'public.lf_confirm_subscription_charge(uuid, text)', 'EXECUTE'); -- expect false
-- set role authenticated; -- as an SB scoped admin
-- select count(*) from public.lf_subscription_charges; -- expect 0

-- 14. Storage is size limited, typed and brand path isolated
-- select id, file_size_limit, allowed_mime_types
-- from storage.buckets where id='product-images';
-- expect file_size_limit = 5242880 and allowed_mime_types covering png, jpeg, webp, gif and pdf.
-- select count(*) from pg_policies
-- where schemaname='storage' and tablename='objects'
--   and policyname in ('product images public read','product images admin upload','product images admin update','product images admin delete');
-- expect 0 rows (legacy broad policies removed).
-- set role authenticated; -- as an SB scoped admin
-- select count(*) from storage.objects where bucket_id='product-images' and name like 'lf/%'; -- expect 0
-- select count(*) from storage.objects
-- where bucket_id='product-images' and name not like 'lf/%'; -- expect SB assets only

-- 15. Public order detail returns reconciliation, tracking uses exact reference
-- select count(*) from pg_proc p
-- join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname='public' and p.proname='lf_public_order_detail'; -- expect 1
-- select public.lf_track_order('0880000000', 'LF-ORDER-000001') ->> 'reason'; -- expect not_found for a partial reference
-- select public.lf_public_order_detail('<lf order uuid>') -> 'reconciliation' -> 'status'; -- expect pending or confirmed

-- 16. Least privilege grants after the hardening migrations
-- select proname, pg_get_function_identity_arguments(oid) as args
-- from pg_proc p join pg_namespace n on n.oid=p.pronamespace
-- where n.nspname='public'
--   and proname in ('mark_order_paid','lf_generate_delivery_slots','lf_set_order_status',
--                   'lf_confirm_subscription_charge','lf_prepare_subscription_charges')
--   and has_function_privilege('anon', p.oid, 'EXECUTE'); -- expect 0 rows
-- select has_function_privilege('service_role', 'public.lf_prepare_subscription_charges()', 'EXECUTE'); -- expect true
-- select has_function_privilege('anon', 'public.lf_public_order_detail(uuid)', 'EXECUTE'); -- expect true
-- select table_name, string_agg(privilege_type, ',' order by privilege_type) as anon_privs
-- from information_schema.role_table_grants
-- where grantee='anon' and table_schema='public'
--   and table_name in ('orders','order_items','lf_subscriptions','lf_quotes','lf_quote_items')
-- group by table_name;
-- expect INSERT only for those five tables.
-- select table_name from information_schema.role_table_grants
-- where grantee='anon' and table_schema='public'
--   and table_name in ('brand_settings','lf_refund_audit','lf_subscription_charges',
--                      'price_reconciliation','payment_events'); -- expect 0 rows

