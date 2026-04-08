# Fly.io Deployment Guide for Hajime

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

## Step 2: Create PostgreSQL Database

```bash
fly postgres create \
  --name hajime-db \
  --region nrt \
  --initial-cluster-size 1 \
  --vm-size shared-cpu-1x \
  --volume-size 1
```

Attach it to your app:
```bash
fly postgres attach hajime-db --app hajime-app
```

---

## Step 3: Set Environment Variables

Generate secrets:
```bash
# Generate secure random secrets
export ACCESS_TOKEN_SECRET=$(openssl rand -base64 64)
export REFRESH_TOKEN_SECRET=$(openssl rand -base64 64)
export SESSION_SECRET=$(openssl rand -base64 64)
```

Set all secrets:
```bash
fly secrets set --app hajime-app \
  NODE_ENV=production \
  FEATURE_FLAG_AUTH_ENABLED=true \
  FEATURE_FLAG_CSV_ENABLED=true \
  FEATURE_FLAG_DB_MIGRATION_STAGE=0 \
  ACCESS_TOKEN_SECRET="$ACCESS_TOKEN_SECRET" \
  REFRESH_TOKEN_SECRET="$REFRESH_TOKEN_SECRET" \
  SESSION_SECRET="$SESSION_SECRET" \
  STRIPE_SECRET_KEY="sk_live_your_key_here"
```

---

## Step 4: Deploy

```bash
# Build and deploy
fly deploy --app hajime-app

# Or with Stripe publishable key for frontend
fly deploy --app hajime-app --build-arg VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
```

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
```bash
# Check database status
fly status --app hajime-db

# View database logs
fly logs --app hajime-db
```

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

- [ ] Database created and attached
- [ ] All secrets set (ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, SESSION_SECRET)
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
