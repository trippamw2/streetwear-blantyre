# Multi-Brand Commerce Platform — Phase 1 Audit & Implementation Plan

**Project:** SB Streetwear (existing) → extend to SB Streetwear + Lake Fresh Fish Mart + Central Admin  
**Date:** 2026-11-15  
**Status:** Audit complete. No production code modified.

---

## 1. Executive Summary

SB Streetwear is a production React/Vite/TypeScript SPA backed by Supabase (Postgres + Auth + Storage + Edge Functions) and deployed to Vercel. It has a working commerce engine: products, variants (sizes), inventory with reservations, cart, checkout, PayChangu payments + webhook, orders, delivery tracking, admin dashboard, CRM, loyalty, referrals, promotions, and email (Brevo).

The platform is **single-brand today**. There is no `brand_id` anywhere in the schema or code. Extending to a second business requires:

1. Introducing explicit brand ownership at the data layer (with RLS).
2. Adding Lake Fresh–specific domain tables (weight-based fish inventory, batches, freshness, delivery zones/slots, preparation, reconciliation).
3. Building a separate Lake Fresh storefront experience (different IA, cart, pricing model).
4. Extending admin with a brand switcher and Lake Fresh operations.
5. Keeping SB 100% backward-compatible.

The audit below documents what exists, what can be reused, and what must be built.

---

## 2. Current Architecture (SB Streetwear)

### 2.1 Stack
| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite 5, React Router 6, TanStack Query 5, Tailwind 3, Radix UI, Framer Motion, react-helmet-async |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions/Deno) |
| Payments | PayChangu (client SDK + webhook edge function + verification) |
| Email | Brevo via Vercel serverless proxy (`api/send-email.ts`) |
| Notifications | WhatsApp deep-links (`src/lib/whatsapp.ts`) |
| Hosting | Vercel (SPA rewrite to `/`, serverless API routes) |
| Observability | Sentry (client DSN) |

### 2.2 Repository layout
```
src/
  App.tsx                 # all routes (storefront + /admin)
  components/             # UI, Layout, AdminLayout, ProductCard, ...
  contexts/               # AuthContext, CartContext, CompareContext
  hooks/                  # useProducts, useWearableCategories, useWishlist, ...
  integrations/supabase/  # client + generated types
  lib/                    # ai-*, whatsapp, utils
  pages/                  # storefront + admin/* + policy/*
  data/products.ts        # categories, brands, helpers, empty product fallback
api/                      # Vercel serverless (send-email, whatsapp-ai-webhook, payment/callback)
supabase/
  migrations/             # 60+ SQL migrations
  functions/              # paychangu-webhook, generate-content
  setup.sql, create-tables.sql
```

### 2.3 Routing
- Single `BrowserRouter` with one `Layout` (header/footer) for storefront and one `AdminLayout` under `/admin`.
- `ProtectedRoute` gates checkout/orders/gifts/loyalty by Supabase auth session.
- `AdminLayout` checks `user_roles.role = 'admin'` client-side.

### 2.4 Authentication
- Supabase Auth (email/password), session persisted in `localStorage`.
- `AuthContext` exposes `{ user, session, loading, signOut }`.
- `profiles` table: `id (uuid PK = auth user)`, `full_name`, `phone`, `location`, timestamps.
- `user_roles`: `user_id`, `role` (enum, currently `admin`). No brand scoping.

### 2.5 Data model (42 public tables)
Core commerce: `products`, `product_types` (sizes), `product_auth`, `product_ownership`, `inventory`, `inventory_transactions`, `orders`, `order_items`, `payment_links`.
Catalog/marketing: `wearable_categories`, `combos`, `combo_items`, `promotions`, `promo_codes`, `testimonials`, `culture_pillars`, `culture_stories`, `lookbooks`, `lookbook_items`.
Customers/CRM: `profiles`, `business_accounts`, `customer_subscribers`, `customer_loyalty`, `loyalty_programs`, `loyalty_tiers`, `loyalty_transactions`, `product_reviews`, `referral_rewards`, `referral_transactions`, `user_referral_codes`.
Operations: `delivery_companies`, `delivery_options`, `suppliers`, `gifts`, `gift_items`, `gift_reviews`, `gift_tracking`, `site_settings`, `scan_logs`, `auth_audit_log`, `whatsapp_campaigns`.

### 2.6 Products & inventory
- `products.id` is TEXT (not UUID) — e.g. `prod-ts-001`, `sb-jersey-001`.
- Fields: name, benefit, price (integer MWK), category (text), brand (text), image, is_active/featured/best_seller/on_sale/new_arrival, discount_percent, stock_quantity (denormalized), sort_order, supplier_id, culture_pillar, wearable_category, images/gallery_images (jsonb), specs (jsonb), reward_points, rating.
- Variants via `product_types` (id, product_id, name=size, sort_order). No colour/weight model.
- Inventory: `inventory` (id uuid, product_id text, sku, quantity, reserved_quantity, reorder_level, cost_price_mwk, location, last_restocked). Atomic-ish via reserved_quantity.
- `inventory_transactions` audit (quantity_change, type, reference_id, notes).
- **No brand column on products or inventory.**

### 2.7 Cart & checkout
- `CartContext` persists cart in `localStorage` (key `sb-cart`). Items: `{ productKey, productId?, name, price, image, quantity }`. productKey = `${productId}-${sizeId}`.
- Checkout (`src/pages/Checkout.tsx`) validates stock via `inventory` (by productId), creates order + order_items, initiates PayChangu, redirects.
- Stock deduction happens in the PayChangu webhook (not at order creation) — reserves at checkout? Actually reservation logic not fully verified; webhook deducts quantity & reserved_quantity.

### 2.8 Payments
- PayChangu: client public key (`VITE_PAYCHANGU_PUBLIC_KEY`), secret (`PAYCHANGU_SECRET_KEY`), webhook secret.
- Webhook edge function (`supabase/functions/paychangu-webhook`) verifies HMAC signature, finds order by tx_ref prefix, deducts inventory, marks order `confirmed`/paid.
- `payment_links` table tracks payment attempts.
- **Issue:** webhook finds order by `id.ilike.%prefix%` — fragile; no explicit payment reference column on orders. Needs hardening for multi-brand (brand-scoped tx refs).

### 2.9 Orders
- `orders`: customer_name, customer_phone, customer_location, total/subtotal/delivery_fee/discount_mwk, payment_method, status (enum), notes, whatsapp_sent, promo_code, timestamps.
- `order_items`: product_key, product_name, unit_price_mwk, quantity.
- Status enum values not fully enumerated here; admin transitions managed in `AdminOrders`.
- **No brand column on orders.**

### 2.10 Admin
- `AdminLayout` + 26 admin pages (products, categories, combos, orders, promotions, promos, crm, testimonials, business, inventory, settings, delivery, suppliers, loyalty, referrals, authentication, customers, analytics, gifts, culture-stories, lookbooks).
- Role gating: `user_roles.role = 'admin'` (single role). No staff/brand scoping.

### 2.11 Delivery
- `delivery_companies`, `delivery_options` (per order: company, tracking, fee, status, estimated/actual delivery date, note).
- `AdminDelivery` manages companies/options.
- No neighbourhood zones, slots, or next-day scheduling logic exists yet.

### 2.12 Notifications
- Brevo email proxy (send-email, subscribe). Sender hardcoded "Streetwear Blantyre" / `orders@wearsb.com`.
- WhatsApp deep-link messages (no API sending).
- No brand-specific templates.

### 2.13 Environment variables
Required (names only, values not disclosed):
- Supabase: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`
- PayChangu: `VITE_PAYCHANGU_PUBLIC_KEY`, `PAYCHANGU_SECRET_KEY`, `PAYCHANGU_WEBHOOK_SECRET` (and VITE_ variants)
- Brevo: `BREVO_API_KEY` (and `VITE_BREVO_API_KEY`)
- Store config: `VITE_STORE_NAME`, `VITE_STORE_TAGLINE`, `VITE_SUPPORT_EMAIL`, `VITE_ADMIN_EMAIL`, `VITE_PAYMENT_PHONE`, `VITE_WHATSAPP_NUMBER/BUSINESS/MESSAGE/LINK`, `VITE_FACEBOOK_URL`, `VITE_SENTRY_DSN`, `VITE_BREVO_LIST_ID`, `VITE_DELIVERY_FEE`, `VITE_EXPRESS_DELIVERY_FEE`, `VITE_FREE_DELIVERY_THRESHOLD`

### 2.14 Security / RLS
- RLS enabled on most tables (per migrations). Policies include anon read for products/promotions, authenticated user access to own orders/profiles, admin full access via `user_roles`.
- `business_accounts`, `suppliers`, `inventory_transactions` exist.
- **Risk:** `user_roles` has only `admin` role; no granular staff permissions. Client-side role check is not a security boundary by itself (must be paired with RLS — verify policies).
- **Risk:** webhook uses service role key and updates orders by fuzzy match.
- **Risk:** no brand isolation exists anywhere.

### 2.15 Reusable UI/infra
- Design system: shadcn/ui components, Tailwind tokens, Logo, skeletons, SEO component, PolicyLayout.
- Shared utilities: `formatMWK`, cart context, compare context, wishlist (localStorage), auth context.
- React Query for server state.

---

## 3. Reuse vs. Build Matrix

| Capability | SB Status | Reuse for Lake Fresh? | Action |
|---|---|---|---|
| Supabase infra (DB/Auth/Storage/Edge) | Working | ✅ Yes | Reuse same project, add brand-scoped tables/policies |
| Auth (email/password, sessions) | Working | ✅ Yes | Shared auth; brand-specific profiles/consent |
| PayChangu integration (client + webhook) | Working (fragile order lookup) | ✅ Reuse + harden | Add `brand_id` + explicit payment reference; idempotent callbacks |
| Brevo email proxy | Working | ✅ Reuse | Brand-specific sender/templates/keys |
| WhatsApp deep-links | Working | ✅ Reuse | Brand-specific numbers/templates |
| Cart context (localStorage) | Working | ⚠️ Adapt | Separate cart storage key per brand; new weight-based cart model for LF |
| Product catalog (clothing) | Working | ❌ No | Keep SB-specific; build LF fish catalog tables |
| Inventory (qty + reserved) | Working | ⚠️ Extend | Add batches, weight-based stock, freshness, reservations |
| Orders / order_items | Working | ⚠️ Extend | Add `brand_id`, delivery slot, preparation, reconciliation fields |
| Admin layout + role gating | Working | ⚠️ Extend | Add brand switcher + staff permissions + LF ops pages |
| Delivery companies/options | Working | ⚠️ Extend | Add zones, slots, next-day scheduling, assignments |
| Promotions / promo codes | Working | ✅ Reuse pattern | Brand-scoped promotions |
| Loyalty / referrals | Working | ✅ Reuse pattern (SB only initially) | Keep SB-specific; LF optional later |
| Gift system | Working | ✅ Reuse pattern | Brand-scoped |
| SEO / helmets | Working | ✅ Reuse | Brand-specific metadata |
| UI components (shadcn) | Working | ✅ Reuse | Shared package |
| Combos/kits | Working | ⚠️ Adapt | LF "bundles" optional later |

**Summary:** ~60% reuse of infrastructure; ~40% new (LF storefront, fish inventory/delivery engine, admin LF ops, brand isolation layer).

---

## 4. Data Architecture & Isolation Plan

### 4.1 Introduce `brands`
New table:
```
brands(id uuid PK, slug text unique, name text, domain text, is_active bool, created_at)
```
Seed: `sb`, `lake-fresh`.

### 4.2 Brand-scoped ownership
Add `brand_id uuid FK -> brands.id` (NOT NULL) to:
- `products`, `product_types`, `inventory`, `inventory_transactions`
- `orders`, `order_items`, `payment_links`
- `promotions`, `promo_codes`, `combos`, `combo_items`
- `delivery_companies`, `delivery_options`
- `site_settings`, `testimonials`, `culture_*`, `lookbooks` (SB-only but scoped)
- `customer_subscribers`, `gifts`, `gift_items`

**No cross-brand reads:** RLS policies filter by brand membership.

### 4.3 Customer separation
- Keep Supabase Auth shared (one identity).
- Add `customer_profiles(brand_id, user_id, full_name, phone, location, marketing_consent, created_at)` with PK `(brand_id, user_id)`.
- `orders.brand_id` ties orders to brand. Order history queried by `(brand_id, user_id)`.
- Marketing lists (`customer_subscribers`) scoped by `brand_id`.

### 4.4 SB-specific (keep as-is, scoped to `brand_id = sb`)
- Clothing: sizes via `product_types`, colours (if added), SKUs, variants.
- Culture pillars/stories, lookbooks, testimonials, editorial, gifts, loyalty, referrals.

### 4.5 Lake Fresh–specific (new tables)
```
fish_species (id, brand_id, name, slug, description, image, storage_info, handling_info, is_active, sort_order)
fish_products (id, brand_id, species_id, name, description, price_per_kg_mwk, min_order_qty_kg, preparation_options jsonb, availability_status, image, is_active, sort_order)
fish_inventory_batches (id, brand_id, species_id, received_date, expiry_date, weight_kg_received, weight_kg_available, weight_kg_reserved, weight_kg_sold, weight_kg_wasted, freshness_grade, notes, created_at)
fish_stock_reservations (id, brand_id, batch_id, order_id, weight_kg, status, expires_at, created_at)
delivery_zones (id, brand_id, name, slug, description, is_active, base_fee_mwk, min_order_mwk, sort_order)
delivery_slots (id, brand_id, zone_id, delivery_date, cutoff_at, capacity_orders, capacity_weight_kg, booked_orders, booked_weight_kg, is_open)
delivery_assignments (id, brand_id, order_id, slot_id, driver_name, status, dispatched_at, delivered_at, failed_reason, notes)
order_preparation (id, brand_id, order_item_id, preparation_type, requested_weight_kg, packed_weight_kg, price_per_kg_mwk, final_price_mwk, reconciled_at, reconciled_by)
price_reconciliation (id, brand_id, order_id, estimated_total_mwk, final_total_mwk, difference_mwk, status, customer_confirmed_at, confirmed_by)
```
Preparation types: `whole`, `cleaned`, `portioned` (configurable per product).

### 4.6 Security / RLS
- Every brand-scoped table gets RLS with policies:
  - `anon`: read active products/promotions for that brand (by slug/domain, not client-supplied id trust — resolve brand from domain/host or a verified claim).
  - `authenticated customer`: read/write own profile & orders where `brand_id` matches and `user_id = auth.uid()`.
  - `staff`: read/write only brands in their `staff_permissions`.
  - `owner`: full access.
- Never trust client-supplied `brand_id` for authorization. Resolve brand from subdomain/domain on the server (Vercel middleware/edge) or from a verified JWT claim set at login. For API routes, require `brand_id` in body but validate against the authenticated user's permissions.
- Admin operations require `user_roles`/`staff_permissions` check server-side (Supabase RLS + edge functions), not just client.

### 4.7 Staff permissions
New table:
```
staff_permissions(id, user_id, brand_id, role, permissions jsonb, created_at)
```
Roles: `owner`, `sb_manager`, `sb_fulfillment`, `lf_manager`, `lf_fulfillment`. Owner has `brand_id = null` (all brands).

---

## 5. Lake Fresh Storefront Requirements Mapping

| Requirement | Implementation approach |
|---|---|
| Brand identity (navy/cyan/ice) | Separate theme tokens + Tailwind config per app; new logo assets |
| Homepage (hero, delivery prop, featured fish, categories, how-it-works, coverage, trust) | New `lf-store` pages |
| Initial species: Chambo, Ncheni/Micheni, Usipa | Seed `fish_species` + `fish_products` |
| Weight selection, preparation options, min qty, storage/handling info | `fish_products` fields + product detail UI |
| Weight-based cart (kg), multi-species, prep selections, item pricing, subtotal, delivery fee, total, eligibility | New cart context/model for LF |
| Next-day delivery default | `delivery_slots` + cutoff config in `site_settings` (brand-scoped) |
| Delivery zones (Chimwankhunda, Chilobwe, Zingwangwa, Mkolokosa, Naperi, Chitawira, surrounding) | Seed `delivery_zones` |
| Atomic stock reservations | `fish_stock_reservations` + Postgres function `reserve_fish_stock` (row-level locks) |
| Preparation workflow (whole/cleaned/portioned) | `order_preparation` rows per item |
| Order statuses (pending payment → delivered/refunded) | Extend `orders.status` enum or brand-specific status text |
| Weight/price reconciliation (estimated vs packed weight, difference, confirmation) | `price_reconciliation` + admin reconciliation UI |
| Delivery management (group by date/zone, assignment, dispatch, confirmation, failed) | Admin LF delivery pages |
| Brand-specific notifications | Brand-scoped templates in email/WhatsApp helpers |

---

## 6. SB Preservation Plan

- No changes to SB routes, components, or business logic unless required for shared infra.
- SB product/cart/checkout/order flows remain identical.
- Add `brand_id = sb` to existing SB rows via migration (default).
- SB admin remains accessible; becomes one view behind the brand switcher.
- Regression tests: existing Vitest (23) + manual smoke of Home/Shop/Product/Checkout/Admin.

---

## 7. Central Admin Design

- Single `/admin` entry with brand switcher: **All / SB / Lake Fresh**.
- Combined dashboard: sales, orders, revenue, payments, recent activity (filterable by brand + period).
- SB admin: existing pages unchanged.
- LF admin: fish catalog, pricing, batches, freshness, reservations, orders, preparation, delivery calendar, zones, assignments, customers, refunds/reconciliation.
- Staff permissions enforced by `staff_permissions` + RLS.

---

## 8. Payments & Notifications

- Reuse PayChangu client + webhook, but:
  - Add `brand_id` to `orders`/`payment_links`.
  - Use explicit `payment_reference` (not fuzzy id prefix) for webhook lookup.
  - Make callback idempotent (check already-paid before deducting).
  - Brand-specific sender names/emails in Brevo proxy (pass brand param).
- Notifications: brand-specific templates for LF (order received, payment confirmed, confirmed, prep started, packed, out for delivery, delivered). SB retains existing.

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Cross-brand data leakage | `brand_id` + RLS on every scoped table; server-side brand resolution; isolation tests |
| Webhook fuzzy order lookup | Replace with exact `payment_reference` match; idempotency guard |
| Inventory oversell (fish) | Atomic reservation function with row locks; available = received − reserved − sold − wasted |
| Silent price changes | Reconciliation record + customer confirmation before final charge |
| SB regression | No SB code changes except additive `brand_id`; full regression test suite |
| Secret exposure in audit | Env var *names* only documented; values never included |
| Delivery date hardcoding | All cutoffs/zones/slots in DB, admin-configurable |
| Admin role too coarse | New `staff_permissions` table + RLS; keep `user_roles` for backward compat |

---

## 10. Implementation Stages (No code yet — plan only)

1. **Stage 0 — Audit & plan** (this document). ✅ Complete.
2. **Stage 1 — Brand foundation (DB only, reversible migration)**  
   Create `brands`, add `brand_id` (default SB) to scoped tables, seed brands, RLS policies, `staff_permissions`, `customer_profiles`. No frontend changes.
3. **Stage 2 — Lake Fresh data model (DB only)**  
   Create fish species/products/batches/reservations/zones/slots/assignments/preparation/reconciliation tables + functions. Seed 7 zones + 3 species.
4. **Stage 3 — Shared package extraction**  
   Extract auth, payments, notifications, UI into `packages/` (or keep in `src/lib` with brand param) — least disruptive option first.
5. **Stage 4 — Lake Fresh storefront (new app or `/lf` routes)**  
   Brand identity, homepage, catalog, product detail, weight-based cart, checkout, delivery scheduling.
6. **Stage 5 — Next-day delivery engine**  
   Cutoff config, slot generation, capacity, reservations, admin delivery console.
7. **Stage 6 — Admin centralization**  
   Brand switcher, combined dashboard, LF ops pages, staff permissions UI.
8. **Stage 7 — Payments hardening**  
   Explicit references, idempotency, brand scoping, brand-specific notifications.
9. **Stage 8 — Testing & deployment**  
   SB regression, LF e2e, isolation tests, separate domains, env config, reversible migrations.

Each stage will report: files created/modified, DB changes, functionality, tests, outstanding issues, deployment implications.

---

## 11. Open Questions for the Owner

1. Should Lake Fresh be a **separate Vercel project** (own domain, own build) or a **brand-aware route** within the existing app (`/lf/*`)? Recommendation: separate app in a monorepo sharing `packages/`, deployed to its own domain, reusing Supabase.
2. Is PayChangu the payment provider for Lake Fresh too, or a different gateway? (Assume reuse.)
3. What are the actual fish selling units — per kg only, or also per piece/pack? (Model supports both via `price_per_kg_mwk` + min qty.)
4. Who are the Lake Fresh staff accounts, and do they already exist in Supabase Auth?
5. What is the initial daily cut-off time and delivery capacity?

---

*End of Phase 1 audit. Awaiting approval before any DB or code changes.*
