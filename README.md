# HospoPilot

Allergen compliance, recipe costing, menus, and staff training for UK independent restaurants.

Built with **Next.js 14** (App Router) + TypeScript, **Tailwind CSS**, **Supabase** (Postgres + auth), **Resend** (transactional email), and the **Anthropic API** (menu/allergen import and AI descriptions).

## Run locally

```bash
npm install
npm run dev
```

Then visit http://localhost:3000.

Scripts:

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint with `next lint` |

## Environment variables

Create `.env.local` with:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Transactional email (Resend)
RESEND_API_KEY=

# AI (Anthropic)
ANTHROPIC_API_KEY=

# Admin dashboard
ADMIN_PASSWORD=

# Protects scheduled (cron) endpoints — digest, temperature checks
CRON_SECRET=
```

## Structure

```
app/
  (auth)/            login, signup, password reset
  (dashboard)/       owner + chef dashboards (recipes, menus, compliance, training)
  kitchen/[slug]/    staff kitchen portal (PIN login)
  menu/[slug]/       public QR allergen menu
  admin/             internal back office (route renders the dashboard below)
  api/               route handlers (compliance, email, AI import, cron jobs)
components/          shared UI, nav, marketing landing, allergen widgets
lib/                 Supabase clients, constants, utils
public/admin/        admin dashboard front-end (React via CDN, served at /admin)
supabase/migrations/ database schema
```

## Brand quick reference

- Name **HospoPilot**, 2×2 grid mark with one gold tile
- Palette (Tailwind `hospopilot-*` tokens): deep green `#1B4332` · mid `#2D6A4F` · fresh `#52B788` · gold `#D4A017` · cream `#F8F4E3` · ink `#1C2B24`
- Display serif: Cormorant Garamond · UI/body: Hanken Grotesk
- Transactional email sends from `support@hospopilot.co.uk`
