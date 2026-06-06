# mise — To-Do

## Supabase Migrations (run in Supabase SQL editor)

- [ ] Run migration `020_ai_usage_logs.sql` — creates `ai_usage_logs` table for Anthropic cost tracking
- [ ] Run migration `021_performance_indexes.sql` — 27 performance indexes (use CONCURRENTLY, run one at a time if needed)
- [ ] Run migration `022_stripe_billing.sql` — adds Stripe billing columns + `plan` column to `restaurants`

## Stripe Setup (required before billing goes live)

- [ ] Create three products/prices in Stripe Dashboard:
  - mise Core — £49/mo
  - mise Plus — £79/mo
  - mise Multi-site — £129/mo

- [ ] Add env vars to Vercel:
  - `STRIPE_SECRET_KEY` — Stripe Dashboard → Developers → API Keys
  - `STRIPE_WEBHOOK_SECRET` — Stripe Dashboard → Webhooks (after registering endpoint below)
  - `STRIPE_PRICE_CORE` — price ID for £49/mo product
  - `STRIPE_PRICE_PLUS` — price ID for £79/mo product
  - `STRIPE_PRICE_MULTI` — price ID for £129/mo product

- [ ] Register webhook endpoint in Stripe Dashboard → Webhooks → Add endpoint:
  - URL: `https://yourdomain.com/api/stripe/webhook`
  - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

## Vercel Env Vars

- [ ] Add `NEXT_PUBLIC_SITE_URL` — your production domain (e.g. `https://mise.kitchen`) — required for remind endpoint URL validation

## Supabase Migrations (continued)

- [ ] Run migration `023_waitlist.sql` — waitlist signups table

## Offline / EHO Backup (build tasks)

These protect restaurants when the app is down during an EHO inspection.

- [ ] **Printable compliance sheets** — add proper `@media print` CSS to EHO mode so every section (allergen matrix, temp logs, cleaning, staff training, audit, incidents) prints cleanly as A4. Owner can print a full compliance pack at any time.

- [ ] **Printable sheets for individual pages** — add print buttons/stylesheets to: Allergen Matrix, Temperature Logs, Cleaning Schedule, Delivery Log, Incident Log, Staff Training records.

- [ ] **Weekly automated PDF backup email** — every Monday, auto-email the owner a PDF snapshot of all compliance records (allergen matrix, last 4 weeks temp logs, cleaning sign-offs, staff training, last audit, incidents). Owner always has last week's records in their inbox even if the app is unreachable.
  - Requires: PDF generation library (e.g. `@react-pdf/renderer` or `puppeteer`), a scheduled Supabase Edge Function or Vercel cron job, and `RESEND_API_KEY` env var already in use.

- [ ] **Consider**: PWA offline mode — cache the last-known allergen matrix and compliance records in the browser so the app works without internet. More complex but means the app itself works during an outage.
