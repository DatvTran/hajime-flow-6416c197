#!/usr/bin/env bash
# Dump Fly Postgres (platform + hajime_dist_* databases) for restore into one Supabase DB.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${DUMP_DIR:-$ROOT/.supabase-migrate}"
FLY_DB_APP="${FLY_DB_APP:-hajime-db}"
PROXY_PORT="${FLY_PG_PROXY_PORT:-15432}"

mkdir -p "$OUT_DIR"

echo "Starting fly proxy ${FLY_DB_APP} -> 127.0.0.1:${PROXY_PORT}"
echo "In another terminal, set DATABASE_URL to the Fly Postgres URI rewritten to 127.0.0.1:${PROXY_PORT}"
echo
echo "Then dump the platform DB:"
echo "  pg_dump --format=custom --no-owner --no-acl -h 127.0.0.1 -p ${PROXY_PORT} -d hajime_app -f ${OUT_DIR}/platform.dump"
echo
echo "List extra databases:"
echo "  psql -h 127.0.0.1 -p ${PROXY_PORT} -d postgres -tAc \"SELECT datname FROM pg_database WHERE datname LIKE 'hajime_dist_%'\""
echo
echo "For each dist DB:"
echo "  pg_dump --format=custom --no-owner --no-acl -h 127.0.0.1 -p ${PROXY_PORT} -d <name> -f ${OUT_DIR}/<name>.dump"
echo
echo "Or run a live dump if PGPASSWORD / DATABASE_URL is already set:"

if [[ -n "${DATABASE_URL:-}" ]]; then
  python3 - <<'PY' || true
import os, urllib.parse
url = os.environ["DATABASE_URL"]
u = urllib.parse.urlparse(url)
print(f"host={u.hostname} port={u.port or 5432} user={u.username} db={u.path.lstrip('/')}")
PY
  PGDATABASE="${PGDATABASE:-hajime_app}"
  pg_dump --format=custom --no-owner --no-acl "$DATABASE_URL" -f "${OUT_DIR}/platform.dump"
  echo "Wrote ${OUT_DIR}/platform.dump"
  DBS=$(psql "$DATABASE_URL" -tAc "SELECT datname FROM pg_database WHERE datname LIKE 'hajime_dist_%'" || true)
  for db in $DBS; do
    echo "Dumping $db"
    parsed="${DATABASE_URL%/*}/$db"
    pg_dump --format=custom --no-owner --no-acl "$parsed" -f "${OUT_DIR}/${db}.dump"
  done
else
  echo "Set DATABASE_URL (or use fly proxy as above) and re-run to dump automatically."
  echo "Starting fly proxy (Ctrl+C to stop)..."
  exec fly proxy "${PROXY_PORT}:5432" --app "$FLY_DB_APP"
fi
