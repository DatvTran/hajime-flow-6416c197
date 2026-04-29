# Hajime B2B Operations App

Premium B2B operations platform for Hajime: inventory, sales orders, account CRM, purchase orders, manufacturer coordination, shipments, forecasting, and reporting — one source of truth for commercial and supply operations.

**Product specification:** see [`docs/PRD.md`](docs/PRD.md) (full PRD split across `docs/PRD-part-*.md`). **Stakeholder brief vs code:** [`docs/BRIEF.md`](docs/BRIEF.md).

The live app persists state via `GET/PUT /api/app` (with optional `operationalSettings` and `auditLogs`). The PRD describes a target REST API and full auth service for later phases.

**Sign-in:** open [`/login`](http://localhost:8080/login) — demo auth (password optional). Roles: **Brand Operator (Hajime HQ)** = full access including Settings; **Manufacturer** = portal only; **Distributor** & **Sales Rep** = no Settings / no mfg portal; **Retail** = Dashboard, Orders, Shipments.

## Scripts

- `npm run dev` — Vite dev server (port 8080)
- `npm run dev:api` — backend API on port **4242**: persists app data + optional Stripe
- `npm run dev:full` — API + Vite together (`concurrently`)
- `npm run build` — production build
- `npm run test` — Vitest
- `npm run lint` — ESLint

### Backend & persistence

From `server/`: `npm install && npm start`. The API stores **inventory, products, accounts, sales orders, purchase orders, shipments, and production statuses** in `server/data/app-state.json` (created on first run from `src/data/seed-app.json`).

- `GET /api/app` — load full state
- `PUT /api/app` — save full state (the app debounces writes after edits)

Vite proxies `/api` to `localhost:4242` in development. For production, serve the API behind the same host or set `VITE_API_BASE_URL` to your API origin.

Stripe billing still uses the same server; configure `STRIPE_SECRET_KEY` in `server/.env`.

If you use Bun, run `bun install` to generate a fresh `bun.lock` from the public npm registry.

### Deploy on [Fly.io](https://fly.io/)

1. Install the [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) and run `fly auth login`.
2. From the repo root: `fly launch` (set app name and region, or edit `fly.toml` first). Use the included `Dockerfile`.
3. Set runtime secrets: `fly secrets set STRIPE_SECRET_KEY=sk_live_...` and optionally `ALLOWED_ORIGINS=https://your-domain.jp` if the browser origin differs from the API host.
4. Deploy with a **build arg** for the Stripe publishable key (baked into the Vite bundle):  
   `fly deploy --build-arg VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...`
5. **Persistent disk** (so `server/data` survives restarts): create a [volume](https://fly.io/docs/reference/configuration/#the-mounts-section) in the same region as the app, then add a `[mounts]` block in `fly.toml` with `destination = "/app/server/data"` (see comments in `fly.toml`).

Production serves the Vite `dist/` folder from the same Express process as `/api` when `dist/index.html` exists (see `server/index.mjs`). The container listens on `PORT` (8080 in `Dockerfile` / Fly `internal_port`).
