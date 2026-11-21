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

-- 15. Public order detail is token aware, tracking uses exact reference
-- select public.lf_track_order('0880000000', 'LF-ORDER-000001') ->> 'reason'; -- expect not_found for a partial reference
-- select public.lf_public_order_detail('<lf order uuid>', null) ->> 'reason'; -- expect unauthorized for anon without a token
-- select public.lf_public_order_detail('<lf order uuid>', '<access token>') -> 'reconciliation' -> 'status'; -- expect pending or confirmed

-- 16. Least privilege grants after the hardening migrations
-- select proname, pg_get_function_identity_arguments(oid) as args
-- from pg_proc p join pg_namespace n on n.oid=p.pronamespace
-- where n.nspname='public'
--   and proname in ('mark_order_paid','lf_generate_delivery_slots','lf_set_order_status',
--                   'lf_confirm_subscription_charge','lf_prepare_subscription_charges')
--   and has_function_privilege('anon', p.oid, 'EXECUTE'); -- expect 0 rows
-- select has_function_privilege('service_role', 'public.lf_prepare_subscription_charges()', 'EXECUTE'); -- expect true
-- select has_function_privilege('anon', 'public.lf_public_order_detail(uuid, text)', 'EXECUTE'); -- expect true
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

-- 17. P0 guest access and delivery proof guarantees (20261121000000)
-- select count(*) from information_schema.columns
-- where table_name='orders' and column_name='guest_access_token'; -- expect 1
-- select count(*) from public.orders
-- where brand_id='22222222-2222-2222-2222-222222222222' and guest_access_token is null; -- expect 0
-- select has_function_privilege('anon', 'public.lf_place_order(text,text,uuid,uuid,jsonb,text,boolean,integer,text,text,text,double precision,double precision,text,text)', 'EXECUTE'); -- expect false
-- select has_function_privilege('anon', 'public.lf_place_order_guest(text,text,uuid,uuid,jsonb,text,boolean,integer,text,text,text,double precision,double precision,text,text)', 'EXECUTE'); -- expect true
-- select has_function_privilege('anon', 'public.lf_verify_order_access(uuid, text)', 'EXECUTE'); -- expect false

-- 18. Delivery proof is mandatory and status changes are server-owned
-- select tgname from pg_trigger t join pg_class c on c.oid=t.tgrelid
-- where c.relname='orders' and tgname='lf_enforce_delivery_proof'; -- expect 1 row
-- update public.orders set status='delivered', delivery_proof_url=null
-- where id='<dispatched lf order uuid>'; -- expect: Delivery proof is required
-- select count(*) from public.lf_delivery_events where order_id='<lf order uuid>'; -- expect 1 after driver completion

-- 19. Subscription references use one namespace
-- select count(*) from public.lf_subscription_charges where payment_reference like 'LFSUB-%'; -- expect 0
-- select count(*) from public.lf_subscription_charges where payment_reference like 'LF-SUB-%'; -- expect all renewal charges

-- 20. Server secret fallbacks are removed from Vercel handlers
-- grep -R "VITE_BREVO_API_KEY|VITE_SUPABASE_SERVICE_KEY|VITE_PAYCHANGU" api/ -- expect no matches

-- 21. P1 named permissions and append only records (20261122000000)
-- select public.has_brand_permission('22222222-2222-2222-2222-222222222222','lf.orders.write');
--   -- expect true only for an LF staff user with that named permission
-- select has_function_privilege('service_role', 'public.user_has_brand_permission(uuid, uuid, text)', 'EXECUTE'); -- expect true
-- select has_function_privilege('anon', 'public.user_has_brand_permission(uuid, uuid, text)', 'EXECUTE'); -- expect false
-- select tgname from pg_trigger t join pg_class c on c.oid=t.tgrelid
-- where c.relname in ('lf_reconciliation_audit','lf_refund_audit','auth_audit_log','lf_delivery_events')
--   and t.tgname like '%append_only%'; -- expect 4 rows

-- 22. P1 reconciliation is server owned and customer confirmed
-- select has_function_privilege('anon', 'public.lf_admin_save_preparation(uuid, numeric)', 'EXECUTE'); -- expect false
-- select has_function_privilege('anon', 'public.lf_customer_confirm_reconciliation(uuid, text)', 'EXECUTE'); -- expect true
-- select privilege_type from information_schema.role_table_grants
-- where grantee='authenticated' and table_name in ('order_preparation','price_reconciliation')
--   and privilege_type in ('INSERT','UPDATE','DELETE'); -- expect 0 rows
-- select count(*) from public.lf_reconciliation_audit where action='customer_confirmed'; -- expect 1 after confirmation

-- 23. P1 traceability tables are brand scoped
-- select tablename from pg_tables where schemaname='public'
--   and tablename in ('lf_lot_records','lf_qa_checks','lf_recall_events','lf_recall_lots'); -- expect 4 rows
-- select count(*) from information_schema.role_table_grants
-- where grantee='anon' and table_name like 'lf\_%' and table_name in
--   ('lf_lot_records','lf_qa_checks','lf_recall_events','lf_recall_lots'); -- expect 0

-- 24. P2 private proof and support (20261123000000)
-- select public = false from storage.buckets where id='lf-delivery-proof'; -- expect false
-- select count(*) from storage.objects where bucket_id='lf-delivery-proof'
--   and name not like 'lf/%'; -- expect 0
-- select count(*) from information_schema.role_table_grants
-- where grantee='anon' and table_name like 'lf\_support\_%'; -- expect 0
-- select has_function_privilege('anon', 'public.lf_staff_reply_ticket(uuid, text)', 'EXECUTE'); -- expect false
-- select has_function_privilege('anon', 'public.lf_public_order_proof(uuid, text)', 'EXECUTE'); -- expect true
-- select tgname from pg_trigger t join pg_class c on c.oid=t.tgrelid
-- where c.relname in ('lf_support_messages','lf_support_events')
--   and t.tgname like '%append_only%'; -- expect 2 rows
-- select public.lf_mark_support_sla_breaches(); -- expect ok true, service role only

