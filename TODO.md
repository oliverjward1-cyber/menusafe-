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
