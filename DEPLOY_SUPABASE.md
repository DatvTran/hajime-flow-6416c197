# Hajime production: Supabase Postgres + Railway app

The Node API and Vite UI run on **Railway**. Postgres is **Supabase** (`hchjcpcnhurzrphtwwtq`, us-west-2). Fly.io is retired.

Public app (Railway default): https://hajime-app-production.up.railway.app  
Custom domain (after DNS): https://supply.drinkhajime.jp

## Railway

Project `hajime`, service `hajime-app`. Deploy from this directory:

```bash
export PATH="$HOME/.npm-global/bin:$PATH"
railway login
railway link   # project hajime
railway up --service hajime-app --yes
```

`railway.toml` uses the repo `Dockerfile` and runs Knex migrations on start.

### Custom domain DNS (Cloudflare / registrar for drinkhajime.jp)

| Type | Name | Value |
|------|------|--------|
| CNAME | `supply` | `jfoiokbd.up.railway.app` |
| TXT | `_railway-verify.supply` | `railway-verify=7aad397f39a179e496d209ec211cca6bcb392d019314b752030f4e0d5ecc32e2` |

Proxy status: DNS only (grey cloud) until the certificate issues, then you can enable orange-cloud if you want.

## Database

Use the **session pooler** (`aws-0-us-west-2.pooler.supabase.com:5432`, user `postgres.<ref>`). Direct `db.<ref>.supabase.co` is IPv6-only.

Knex migrations must **not** use the transaction pooler (`:6543`).

Distributor isolation is **schemas** (`hajime_dist_*`), not extra databases. `DISTRIBUTOR_ISOLATION=schema`.

`uuid-ossp` lives in `extensions`; `public.uuid_generate_v4()` is a wrapper used by restored tables.

## Auth

Until `SUPABASE_JWT_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` are set, login uses existing `public.users` password hashes and app JWTs (`ACCESS_TOKEN_SECRET`).

## Required Railway variables

`DATABASE_URL`, `DISTRIBUTOR_ISOLATION=schema`, `NODE_ENV=production`, `FEATURE_FLAG_AUTH_ENABLED`, `FEATURE_FLAG_CSV_ENABLED`, `FEATURE_FLAG_DB_MIGRATION_STAGE=3`, `REQUIRE_DB_PRIMARY_IN_PRODUCTION=true`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `SESSION_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `CLIENT_URL`, `ALLOWED_ORIGINS`.
