# mise — To-Do

## Supabase Migrations (run in Supabase SQL editor)

- [ ] Run migration `020_ai_usage_logs.sql` — creates `ai_usage_logs` table for Anthropic cost tracking
- [ ] Run migration `021_performance_indexes.sql` — 27 performance indexes (use CONCURRENTLY, run one at a time if needed)
- [ ] Run migration `022_stripe_billing.sql` — adds Stripe billing columns + `plan` column to `restaurants`
- [ ] Run migration `023_waitlist.sql` — waitlist signups table

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

## Offline / EHO Backup (build tasks)

These protect restaurants when the app is down during an EHO inspection.

- [ ] **Printable compliance sheets** — add proper `@media print` CSS to EHO mode so every section (allergen matrix, temp logs, cleaning, staff training, audit, incidents) prints cleanly as A4. Owner can print a full compliance pack at any time.
- [ ] **Printable sheets for individual pages** — add print buttons/stylesheets to: Allergen Matrix, Temperature Logs, Cleaning Schedule, Delivery Log, Incident Log, Staff Training records.
- [ ] **Weekly automated PDF backup email** — every Monday, auto-email the owner a PDF snapshot of all compliance records. Requires `@react-pdf/renderer` or `puppeteer`, a Vercel cron job, and `RESEND_API_KEY`.
- [ ] **PWA offline mode** — cache allergen matrix and compliance records in the browser so the app loads without internet. Service worker + cache strategy. ~2-3 weeks effort.

---

## Till System Integration

- [ ] **Research & pick first integration target** — Square recommended as quickest to prototype (excellent API, widely used in UK independents). Others: Lightspeed, Tevalis, Zonal, EPOS Now.
- [ ] **Menu sync** — till sends new/removed dishes to mise automatically, no double entry
- [ ] **Price sync** — till price changes update recipe GP% in mise in real time
- [ ] **Sales data sync** — daily sales volumes feed into mise for actual GP per dish per day
- [ ] **OAuth connect flow** — one-button till connection in Kitchen Settings (same pattern as Stripe)

---

## Features to Take from Trail (priority order)

### 🔴 Priority 1 — Build in next 90 days

- [ ] **Push notifications for missed tasks** — if a fridge log isn't submitted by 9am, manager gets a push notification. Single most practically useful compliance feature. Requires PWA + Web Push API.
- [ ] **Owen's Law landing page & positioning** — zero build effort, immediate differentiation. Trail says nothing about Owen's Law. Own that conversation entirely with a dedicated page + in-app "Owen's Law ready" messaging.
- [ ] **Mandatory photo evidence on issue flags** — when a temp is out of range or incident is logged, require a photo before the entry closes. Timestamped photo evidence is legally stronger than text. Requires camera access + Supabase Storage.
- [ ] **Daily email digest to owner** — every morning, automated email showing yesterday's compliance score, outstanding items, and what's due today. Low build effort, high perceived value.
- [ ] **Corrective actions workflow** — when something fails (temp breach, failed audit, incident), automatically create a follow-up task assigned to a named person with a deadline. Chase it until resolved. Transforms the incident log from a record into a system.

### 🟡 Priority 2 — Next features after above

- [ ] **Ad hoc task creation** — simple "add task" button so staff can log unscheduled jobs (one-off cleaning, unexpected delivery, maintenance issue) outside the normal workflow.
- [ ] **Document storage** — let owners upload and store HACCP plan, training certificates, insurance documents and supplier contracts inside the app. EHO wants to see the HACCP document — it should live in the same place as everything else. Requires Supabase Storage.
- [ ] **Custom user roles & permissions** — regional manager, site manager, FOH supervisor as distinct roles with different views. Especially important for multi-site.
- [ ] **Allergen scenario training for FOH** — interactive scenarios (customer says they have a nut allergy — walk through what happens step by step). Proves applied competence not just task completion. No competitor does this well.
- [ ] **Supplier ingredient change alerts** — when a recipe ingredient is flagged as changed on delivery, automatically alert the head chef and update the allergen matrix for review.

### 🟢 Priority 3 — Competitive moat features

- [ ] **Ingredient-level audit trail** — when any allergen matrix entry changes, log who changed it, what it was before, and what it is now. Legal defence feature — in a reaction claim, show exactly who changed what and when. Trail cannot replicate this (no ingredient data).
- [ ] **Multi-site allergen consistency checker** — flag when the same dish has different allergen information across locations. Impossible for Trail to build. Critical for restaurant groups.
- [ ] **Allergen matrix as sales centrepiece** — make it the opening feature of every demo and sales conversation. Trail cannot and will not build a recipe-level allergen database.
- [ ] **EHO Inspection Mode marketing** — already built, now market it. Dedicated section on landing page, named "Inspection Mode" in all comms. Trail has nothing equivalent.
- [ ] **"Built for UK food law" positioning** — bake UK-specific rules into every label, prompt and warning (14 allergens, FHRS scoring, Natasha's Law, Owen's Law, UK safe temp ranges). Generic international platforms like Trail can't match this specificity.

---

## Things That Make mise Better Than Trail (already built — market these)

- ✅ Recipe-level allergen matrix — Trail has nothing equivalent
- ✅ Customer-facing QR allergen menu — Trail is 100% internal, we face outward
- ✅ Owen's Law compliance — Trail doesn't mention it anywhere
- ✅ EHO Inspection Mode — one-button compliance dashboard Trail doesn't have
- ✅ Monthly rolling, no 12-month contract — Trail starts at £38/mo with 12-month minimum
- ✅ Built specifically for UK food law — Trail is a generic international platform
