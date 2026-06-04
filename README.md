# mise — site & admin

Two static front-ends for **mise** (allergens · menus · training for UK restaurants).
No build step, no framework install — just open or serve the folder.

| Page | URL | What it is |
|------|-----|------------|
| Landing page | `index.html` | Public marketing site |
| Admin dashboard | `admin.html` | Internal back office (overview, customers, subscriptions, billing, waitlist) |

## Run locally
Serve the folder (needed so the admin's module files load):

```
python3 -m http.server
```

Then visit http://localhost:8000 (landing) and http://localhost:8000/admin.html (admin).

> Opening `index.html` straight from disk works for the landing page, but the admin
> dashboard should be **served** (as above) so its script files load correctly.

## Deploy (GitHub Pages)
1. Push this folder to a repo.
2. **Settings → Pages → Source: Deploy from a branch**, pick your branch + `/root`.
3. Landing = your Pages URL; admin = `<pages-url>/admin.html`.

## Structure
```
index.html              landing page
styles.css, app.js      landing assets
tweaks-*.jsx            landing "Tweaks" panel (optional)
admin.html              admin dashboard entry
admin/
  admin.css             dashboard styles
  data.js               sample data (replace with live data later)
  components.jsx        shared UI (KPIs, tables, drawer, modals, charts)
  screens.jsx           the 5 screens
  drawer.jsx            customer drawer + action modals
  app.jsx               app shell, routing, actions, tweaks
  tweaks-panel.jsx      tweaks controls
```

## Notes
- The admin dashboard uses **sample data** in `admin/data.js` — swap it for real data when ready.
- Plan names/prices (Core £49 / Plus £79 / Multi-site £129) are **placeholders**.
- Fonts load from Google Fonts; React/Babel load from a CDN — an internet connection is required.

## Brand quick reference
- Name **mise** (always lowercase), 2×2 grid mark with one gold tile
- Deep green `#1B4332` · gold `#D4A017` · cream `#F8F4E3`
- Display serif: Cormorant Garamond · UI/body: Hanken Grotesk
