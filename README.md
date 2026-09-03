# Hajime B2B Operations App

Premium B2B operations platform for Hajime: inventory, sales orders, account CRM, purchase orders, manufacturer coordination, shipments, forecasting, and reporting — one source of truth for commercial and supply operations.

**Product specification:** see [`docs/PRD.md`](docs/PRD.md) (full PRD split across `docs/PRD-part-*.md`). **Stakeholder brief vs code:** [`docs/BRIEF.md`](docs/BRIEF.md).

The live app persists state via `GET/PUT /api/app` (with optional `operationalSettings` and `auditLogs`). The PRD describes a target REST API and full auth service for later phases.

**Sign-in:** [`/login`](http://localhost:8080/login) uses **`POST /api/auth/login`** when `FEATURE_FLAG_AUTH_ENABLED=true` (requires **`npm run dev:api`** or equivalent so `/api` reaches Postgres auth). **Retail demo:** `retail@hajime.jp` / `retail123!`, or roster personas (`jeff@thedrake.ca`, etc.) with the same password after DB seed — pick **Ordering as** to select which storefront filters orders. Other roles use seeded HQ/manufacturer/distributor accounts from `server/seeds/001_initial_data.mjs`.

## Scripts

- `npm run dev` — Vite dev server (port 8080)
- `npm run dev:api` — backend API on port **4242**: persists app data + optional Stripe
- `npm run dev:full` — API + Vite together (`concurrently`)
- `npm run build` — production build
- `npm run test` — Vitest
- `npm run lint` — ESLint

### Backend & persistence

From `server/`: `npm install && node index.mjs` (or `npm start`, which maps to `node index.mjs`). The API stores **inventory, products, accounts, sales orders, purchase orders, shipments, and production statuses** in `server/data/app-state.json` (created on first run from `src/data/seed-app.json`).

- `GET /api/app` — load full state
- `PUT /api/app` — save full state (the app debounces writes after edits)

Vite proxies `/api` to `localhost:4242` in development. For production, serve the API behind the same host or set `VITE_API_BASE_URL` to your API origin.

Stripe billing still uses the same server; configure `STRIPE_SECRET_KEY` in `server/.env`.

> ⚠️ `server/stripe-server.mjs` is a deprecated legacy entrypoint. It now refuses startup by default and requires `HAJIME_ALLOW_UNSAFE_LEGACY_SERVER=true` to run for explicit dev-only debugging. Operators should not use it in normal workflows or deployment.

If you use Bun, run `bun install` to generate a fresh `bun.lock` from the public npm registry.

### Production: [Railway](https://railway.app) + [Supabase](https://supabase.com/)

The Node API and UI run on Railway. Postgres is Supabase. See [`DEPLOY_SUPABASE.md`](DEPLOY_SUPABASE.md).

```bash
railway login
railway up --service hajime-app --yes
```

Production URL: https://hajime-app-production.up.railway.app  
Custom domain: `supply.drinkhajime.jp` (CNAME in that doc).
