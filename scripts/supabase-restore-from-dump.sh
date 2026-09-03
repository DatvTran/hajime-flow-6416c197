#!/usr/bin/env bash
# Restore Fly dumps into a single Supabase database.
# - platform.dump → public schema
# - hajime_dist_*.dump → schema with the same name (objects moved off public)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IN_DIR="${DUMP_DIR:-$ROOT/.supabase-migrate}"
: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL to the Supabase direct postgres URI (:5432)}"

psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'

if [[ -f "${IN_DIR}/platform.dump" ]]; then
  echo "Restoring platform.dump"
  pg_restore --no-owner --no-acl --dbname="$SUPABASE_DB_URL" "${IN_DIR}/platform.dump" || true
else
  echo "WARNING: missing ${IN_DIR}/platform.dump"
fi

shopt -s nullglob
for dump in "${IN_DIR}"/hajime_dist_*.dump; do
  name="$(basename "$dump" .dump)"
  echo "Restoring ${name} into schema ${name}"
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c "CREATE SCHEMA IF NOT EXISTS \"${name}\";"
  tmp_sql="$(mktemp)"
  pg_restore --no-owner --no-acl -f "$tmp_sql" "$dump"
  # Dist dumps are whole databases whose objects live in public; rewrite to the org schema.
  perl -pe "s/\\bpublic\\./${name}./g; s/SET search_path = public/SET search_path = ${name}, pg_catalog/" \
    "$tmp_sql" | psql "$SUPABASE_DB_URL" || true
  rm -f "$tmp_sql"
done

echo "Checking knex_migrations on platform:"
psql "$SUPABASE_DB_URL" -c 'SELECT id, name FROM knex_migrations ORDER BY id DESC LIMIT 15;'
echo "Next: cd server && DATABASE_URL=\$SUPABASE_DB_URL npx knex migrate:status --knexfile knexfile.mjs"
