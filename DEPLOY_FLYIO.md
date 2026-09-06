# Fly.io compute + Supabase Postgres/Auth
# Database and login live on Supabase. See DEPLOY_SUPABASE.md.
# This file only covers running the Node/Vite app on Fly Machines.

## Prerequisites

1. Fly.io account (https://fly.io)
2. Fly CLI installed
3. Authenticated: `fly auth login`

## Step 1: Authenticate

```bash
export FLYCTL_INSTALL="/root/.fly"
export PATH="$FLYCTL_INSTALL/bin:$PATH"
fly auth login
```

This opens a browser for authentication.

---

## Step 2: PostgreSQL (Supabase)

Do **not** create a new Fly Postgres cluster. Follow [`DEPLOY_SUPABASE.md`](DEPLOY_SUPABASE.md) for dump/restore and `DATABASE_URL`.

---

## Step 3: Set Environment Variables

Generate secrets:
```bash
# Generate secure random secrets
export ACCESS_TOKEN_SECRET=$(openssl rand -base64 64)
export REFRESH_TOKEN_SECRET=$(openssl rand -base64 64)
export SESSION_SECRET=$(openssl rand -base64 64)
```

Set all secrets (production standard is DB-primary stage 3+):
```bash
fly secrets set --app hajime-app \
  NODE_ENV=production \
  FEATURE_FLAG_AUTH_ENABLED=true \
  FEATURE_FLAG_CSV_ENABLED=true \
  FEATURE_FLAG_DB_MIGRATION_STAGE=3 \
  REQUIRE_DB_PRIMARY_IN_PRODUCTION=true \
  DATABASE_URL="postgresql://postgres.ref:pw@db.ref.supabase.co:5432/postgres?sslmode=require" \
  ACCESS_TOKEN_SECRET="$ACCESS_TOKEN_SECRET" \
  SUPABASE_URL="https://your-project.supabase.co" \
  SUPABASE_ANON_KEY="eyJ..." \
  SUPABASE_SERVICE_ROLE_KEY="eyJ..." \
  SUPABASE_JWT_SECRET="your-jwt-secret" \
  REFRESH_TOKEN_SECRET="$REFRESH_TOKEN_SECRET" \
  SESSION_SECRET="$SESSION_SECRET" \
  STRIPE_SECRET_KEY="sk_live_your_key_here"
```

> Stage 0 (JSON-backed) should be treated as local legacy troubleshooting only.

---

## Step 4: Deploy

```bash
# Build and deploy
fly deploy --app hajime-app

# Or with Stripe publishable key for frontend
fly deploy --app hajime-app --build-arg VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
```

Runtime entrypoint policy:

- Use only `node index.mjs` (or `npm start` in `server/`, which resolves to `node index.mjs`).
- Do **not** use `stripe-server.mjs` for deploys or normal operations; it is deprecated and blocked by default.

---

## Step 5: Run Migrations

```bash
# SSH into the app
fly ssh console --app hajime-app

# Inside the container, run:
cd /app/server
npx knex migrate:latest

# Exit SSH
exit
```

---

## Step 6: Seed Database (Optional)

```bash
fly ssh console --app hajime-app
cd /app/server
npx knex seed:run
exit
```

Default credentials after seed:
- Email: `admin@hajime.jp`
- Password: `admin123!`

---

## Verify Deployment

```bash
# Check app status
fly status --app hajime-app

# View logs
fly logs --app hajime-app

# Test health endpoint
curl https://hajime-app.fly.dev/api/health
```

---

## Troubleshooting

### Database connection issues
See the Supabase project dashboard (Database → Health). Keep Fly Postgres until cutover is verified.

### Migration failures
```bash
# SSH and check migration status
fly ssh console --app hajime-app
cd /app/server
npx knex migrate:status
```

### Rollback deployment
```bash
# View previous releases
fly releases --app hajime-app

# Rollback to previous version
fly deploy --app hajime-app --image flyio/hajime-app:previous-tag
```

---

## Production Checklist

- [ ] `DATABASE_URL` points at Supabase (direct :5432)
- [ ] Supabase Auth secrets set
- [ ] Stripe keys configured
- [ ] Migrations run successfully
- [ ] Health endpoint responding (https://hajime-app.fly.dev/api/health)
- [ ] Login working with test credentials
- [ ] Logs showing no errors

---

## Monitoring

```bash
# Live logs
fly logs --app hajime-app --follow

# Metrics dashboard
fly dashboard --app hajime-app
```
