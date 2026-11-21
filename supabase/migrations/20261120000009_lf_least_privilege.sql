-- Least privilege follow up after the hardening migrations.
-- Supabase grants broad EXECUTE and table rights to the anon role by default.
-- Row level security still applies, but admin only functions and tables should
-- not be reachable by anonymous callers at all.
-- Apply after 20261120000008_lf_storage_hardening.sql
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. State changing functions that must never be callable by anon
-- ---------------------------------------------------------------------------
revoke all on function public.mark_order_paid(uuid) from public, anon;
grant execute on function public.mark_order_paid(uuid) to authenticated, service_role;

revoke all on function public.lf_generate_delivery_slots(integer, integer, numeric) from public, anon;
grant execute on function public.lf_generate_delivery_slots(integer, integer, numeric) to authenticated, service_role;

revoke all on function public.lf_set_order_status(
  uuid, public.order_status, text, text, jsonb
) from public, anon;
grant execute on function public.lf_set_order_status(
  uuid, public.order_status, text, text, jsonb
) to authenticated, service_role;

revoke all on function public.lf_confirm_subscription_charge(uuid, text) from public, anon;
grant execute on function public.lf_confirm_subscription_charge(uuid, text) to authenticated, service_role;

revoke all on function public.lf_prepare_subscription_charges() from public, anon, authenticated;
grant execute on function public.lf_prepare_subscription_charges() to service_role;

-- Internal stock and order helpers are called by security definer functions,
-- not by browser sessions.
revoke all on function public.reserve_fish_stock(uuid, uuid, numeric) from public, anon;
revoke all on function public.confirm_fish_reservation(uuid) from public, anon;
revoke all on function public.release_fish_reservation(uuid) from public, anon;
revoke all on function public.release_stock_on_cancel() from public, anon;
revoke all on function public.handle_new_user() from public, anon;
revoke all on function public.set_order_payment_reference() from public, anon;
revoke all on function public.set_gift_payment_reference() from public, anon;
revoke all on function public.set_culture_story_slug() from public, anon;
revoke all on function public.set_lookbook_slug() from public, anon;
revoke all on function public.generate_order_item_qr(uuid) from public, anon;
revoke all on function public.generate_qr_token() from public, anon;
revoke all on function public.generate_serial_number() from public, anon;
revoke all on function public.update_gift_status(uuid, text, text) from public, anon;

-- ---------------------------------------------------------------------------
-- 2. Table grants: keep public reads and guest inserts, remove anon writes
-- ---------------------------------------------------------------------------
-- Admin only tables. No anonymous read or write is needed.
revoke all on table public.brand_settings from anon;
revoke all on table public.lf_refund_audit from anon;
revoke all on table public.lf_subscription_charges from anon;
revoke all on table public.price_reconciliation from anon;
revoke all on table public.payment_events from anon;
revoke all on table public.user_roles from anon;
revoke all on table public.staff_permissions from anon;
revoke all on table public.delivery_assignments from anon;
revoke all on table public.fish_inventory_batches from anon;
revoke all on table public.fish_stock_reservations from anon;
revoke all on table public.order_preparation from anon;
revoke all on table public.scan_logs from anon;
revoke all on table public.auth_audit_log from anon;

-- Public catalog tables: SELECT only through their brand scoped read policies.
revoke insert, update, delete, truncate, references, trigger on table public.fish_species from anon;
revoke insert, update, delete, truncate, references, trigger on table public.fish_products from anon;
revoke insert, update, delete, truncate, references, trigger on table public.delivery_zones from anon;
revoke insert, update, delete, truncate, references, trigger on table public.delivery_slots from anon;
revoke insert, update, delete, truncate, references, trigger on table public.lf_spices from anon;
revoke insert, update, delete, truncate, references, trigger on table public.lf_recipes from anon;
revoke insert, update, delete, truncate, references, trigger on table public.lf_recipe_products from anon;
revoke insert, update, delete, truncate, references, trigger on table public.lf_wholesale_prices from anon;

-- Guest insert tables: INSERT only. All other access stays blocked.
revoke all on table public.orders from anon;
grant insert on table public.orders to anon;
revoke all on table public.order_items from anon;
grant insert on table public.order_items to anon;
revoke all on table public.lf_subscriptions from anon;
grant insert on table public.lf_subscriptions to anon;
revoke all on table public.lf_quotes from anon;
grant insert on table public.lf_quotes to anon;
revoke all on table public.lf_quote_items from anon;
grant insert on table public.lf_quote_items to anon;

-- Keep the intentionally public READ functions available to guests.
grant execute on function public.lf_place_order(
  text, text, uuid, uuid, jsonb, text, boolean, integer, text,
  text, text, double precision, double precision, text, text
) to anon;
grant execute on function public.lf_public_order_detail(uuid) to anon;
grant execute on function public.lf_track_order(text, text) to anon;
grant execute on function public.lf_public_catalog() to anon;
grant execute on function public.lf_public_config() to anon;
grant execute on function public.lf_preview_promo(text) to anon;
grant execute on function public.apply_referral_code(text) to anon;
grant execute on function public.generate_gift_tracking_token() to anon;
grant execute on function public.record_scan(
  uuid, text, text, text, text, text, text, text
) to anon;
