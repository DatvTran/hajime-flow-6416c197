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

### Row Level Security (Data API)

The app reads Postgres through Knex (`DATABASE_URL`, postgres role), not through PostgREST. Migrations **054** and **055** turn on RLS for every table in `public` and `hajime_dist_*` with **no policies**, and revoke `PUBLIC` / `anon` / `authenticated` (including schema usage). That closes Supabase linter findings `rls_disabled_in_public` and `sensitive_columns_exposed` (e.g. `users.password_hash`). Railway runs these on start via `migrate-release.mjs`.

After deploy, in the Supabase SQL editor this should return **no rows**:

```sql
select n.nspname, c.relname
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind = 'r'
  and (
    n.nspname = 'public'
    or n.nspname like 'hajime_dist_%'
  )
  and not c.relrowsecurity
order by 1, 2;
```

Then dismiss the advisor cards. Login through the Railway app should still work (postgres bypasses RLS). Do not add `USING (true)` policies and do not `FORCE ROW LEVEL SECURITY`.

## Auth

Until `SUPABASE_JWT_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` are set, login uses existing `public.users` password hashes and app JWTs (`ACCESS_TOKEN_SECRET`).

## Required Railway variables

`DATABASE_URL`, `DISTRIBUTOR_ISOLATION=schema`, `NODE_ENV=production`, `FEATURE_FLAG_AUTH_ENABLED`, `FEATURE_FLAG_CSV_ENABLED`, `FEATURE_FLAG_DB_MIGRATION_STAGE=3`, `REQUIRE_DB_PRIMARY_IN_PRODUCTION=true`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `SESSION_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `CLIENT_URL`, `ALLOWED_ORIGINS`.
