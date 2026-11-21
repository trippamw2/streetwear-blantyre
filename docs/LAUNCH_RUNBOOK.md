# Lake Fresh launch runbook

Use this checklist before and after a Lake Fresh production release. The storefront is `https://lakefresh.vercel.app` and the public domain is `https://lakefreshmw.com`. The SB storefront must never link to or display Lake Fresh pages.

## 1. Pre release

1. Run all checks on a clean checkout:
   - `npx tsc --noEmit --strict`
   - `npm test -- --run`
   - `npm run build`
2. Confirm only expected files are staged. Never stage `.omo/*`, `.playwright-mcp/*`, `mobile-audit/*`, `supabase/.temp/*` or any `.env` file.
3. Confirm no `VITE_*` fallback, hard coded Supabase URL or personal email fallback exists in `api/`.
4. Confirm LF copy has no `LF-`, em dashes, en dashes, middle dots, `meal kits`, `marinades`, `ready to cook`, `cold chain`, `signature`, `guarantee`, `prep`, `prepared` or hard coded area names outside the delivery section and functional selectors.
5. Confirm the three pilot fish are exactly Chambo, Micheni and Usipa, and the headline is exactly `Lake Fresh Fish Delivered to your door`.
6. Confirm order copy says `Order by 8 PM, delivered tomorrow` and never promises same day delivery.
7. Confirm seasonings are shown as extra cost and the free recipe is one recipe chosen by the customer per order.
8. Confirm subscriptions are manual payment only, with the published total formula and first payment covering one delivery only.

## 2. Database

Apply migrations one at a time, in order, against the linked project:

```powershell
supabase.cmd db query --linked --file supabase/migrations/20261121000000_lf_trust_p0.sql
supabase.cmd db query --linked --file supabase/migrations/20261122000000_lf_trust_p1.sql
supabase.cmd db query --linked --file supabase/migrations/20261123000000_lf_private_proof_and_support.sql
supabase.cmd db query --linked --file supabase/migrations/20261124000000_lf_ops_consolidation.sql
supabase.cmd db query --linked --file supabase/migrations/20261125000000_lf_growth_retention.sql
```

Do not use `supabase db push`; it fails because legacy types already exist.

Run the checks in `docs/RLS_ISOLATION_TESTS.sql` and the P5 live checks file used during development. Every check must pass. Confirm:
- every LF table carries the LF `brand_id` and RLS blocks SB staff;
- public reviews expose only `approved` rows;
- growth, newsletter, lifecycle and staff tables have no direct anon or authenticated write grants;
- lifecycle claim and finish RPCs are service role only;
- seasonal cannon and fish dispatch guards are enabled.

## 3. Environment

Set these on Vercel production. Never place secrets in `VITE_*` variables.

- `VITE_BRAND_SITE=lf` for the LF root deployment; `/lf` QA routes stay on the dual local build.
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` for the browser client.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` for server functions.
- `BREVO_API_KEY`, `BREVO_LIST_ID` for SB, `LF_BREVO_LIST_ID` for LF consent.
- `ADMIN_EMAIL` for admin notifications. No default fallback is allowed.
- `CRON_SECRET` for `/api/cron/*`.
- PayChangu secrets and webhook URL from the dashboard.
- Real LF WhatsApp, phone, email, address and registration values; hide any channel that is not configured.

Rotate the service role JWT that appeared in deleted `powerpod-life/*` git history and any credentials present in untracked `.env` files before release.

## 4. Cron and email

`vercel.json` schedules:
- `0 6 * * *` `/api/cron/charge-subscriptions`
- `0 * * * *` `/api/cron/support-sla`
- `30 7 * * *` `/api/cron/lf-lifecycle`

Confirm each cron is visible in the Vercel dashboard and responds to an authorised `Bearer <CRON_SECRET>` request. Confirm lifecycle messages are sent only from the LF sender, only to customers with `marketing_consent`, and only for delivered orders.

## 5. Smoke test

On the LF deployment, open each route and confirm the LF logo, Nunito font, palette and navigation:

`/`, `/fish`, `/fish/<id>`, `/spices`, `/recipes`, `/reviews`, `/support`, `/track`, `/cart`, `/orders`, `/checkout`, `/loyalty`, `/subscribe`, `/pro`, `/admin`, `/admin/operations`.

Also check:
- `/api/health` returns configuration presence only, never secret values.
- `/sitemap.xml` contains clean LF URLs without `/lf`.
- `robots.txt` points to both brand sitemaps.
- A hard refresh and browser back navigation never show the SB icon.
- The service worker never caches `/api`, `/admin`, `/auth`, `/orders`, `/track`, `/support`, `/driver`, `/checkout`, `/cart` or URLs containing `token`, `access`, `payment`, `ref`, `order`, `ticket`.

## 6. Live transaction checklist

With real stock loaded and real admin credentials:

1. Load current Chambo, Micheni and Usipa batches with future expiry dates. Expired stock must not appear in checkout.
2. Place a test order. Confirm server calculated totals, zone fee, recipe selection and paid extras.
3. Confirm PayChangu callback and verification work with the dashboard webhook URL.
4. Confirm order confirmation, payment received, dispatched, delivered and review request emails use the LF sender and LF links.
5. Upload private delivery proof and confirm it is only reachable through the authenticated proof RPC.
6. Dispatch requires a reserved lot, passing QA and no open recall. A seasoning only order may skip the fish guard.
7. Reply to a support ticket and confirm the SLA cron records breaches.
8. Submit a review and confirm it stays pending until an LF admin approves it.
9. Subscribe through the footer and confirm the LF subscriber row and Brevo list mapping.
10. Open a `?ref=` and UTM link and confirm one first party growth event is recorded without personal data.
11. Sign in as LF admin, confirm MFA enrolment and that Reviews and Growth tabs load only LF data.

## 7. Post release

- Confirm `https://lakefresh.vercel.app` and the public domain serve the same LF build.
- Confirm SB admin and storefront show no LF data or links.
- Watch error logs and Brevo delivery for the first 24 hours.
- Record the deployed commit SHA and the migration versions applied.
- If rollback is needed, redeploy the previous known good commit and keep the database migrations in place unless a migration is proven unsafe.
