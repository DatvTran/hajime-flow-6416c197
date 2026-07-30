#!/usr/bin/env bash
# Run Knex migrations against Fly.io Postgres (hajime-db) via fly proxy.
# Use this when you do not run a local Postgres container.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP="${FLY_APP:-hajime-app}"
DB_APP="${FLY_DB_APP:-hajime-db}"
PROXY_PORT="${FLY_DB_PROXY_PORT:-15432}"

if ! command -v fly >/dev/null 2>&1; then
  echo "ERROR: fly CLI not found. Install: https://fly.io/docs/hands-on/install-flyctl/"
  exit 1
fi

echo "==> Reading DATABASE_URL from ${APP}…"
RAW_URL="$(
  fly ssh console -a "$APP" -C "printenv DATABASE_URL" 2>/dev/null \
    | tr -d '\r' \
    | grep -E '^postgres(ql)?://' \
    | tail -1
)"
if [[ -z "$RAW_URL" ]]; then
  echo "ERROR: DATABASE_URL not found on ${APP}."
  echo "Attach Postgres: fly postgres attach ${DB_APP} --app ${APP}"
  exit 1
fi

export DATABASE_URL="$(
  cd "$ROOT" && node --input-type=module -e "
    import { rewriteDatabaseUrlForProxy } from './server/config/fly-database-url.mjs';
    console.log(rewriteDatabaseUrlForProxy(process.argv[1], { port: Number(process.argv[2]) }));
  " "$RAW_URL" "$PROXY_PORT"
)"

echo "==> Starting fly proxy 127.0.0.1:${PROXY_PORT} -> ${DB_APP}:5432 …"
fly proxy "${PROXY_PORT}:5432" -a "$DB_APP" >/tmp/hajime-fly-proxy.log 2>&1 &
PROXY_PID=$!
cleanup() {
  if kill -0 "$PROXY_PID" 2>/dev/null; then
    kill "$PROXY_PID" 2>/dev/null || true
    wait "$PROXY_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

for i in $(seq 1 20); do
  if node --input-type=module -e "
    import net from 'net';
    const s = net.connect({ host: '127.0.0.1', port: ${PROXY_PORT} });
    s.setTimeout(1000);
    s.on('connect', () => { s.destroy(); process.exit(0); });
    s.on('error', () => process.exit(1));
    s.on('timeout', () => { s.destroy(); process.exit(1); });
  " 2>/dev/null; then
    break
  fi
  if [[ "$i" -eq 20 ]]; then
    echo "ERROR: fly proxy did not become ready. Log:"
    tail -20 /tmp/hajime-fly-proxy.log || true
    exit 1
  fi
  sleep 1
done

echo "==> Running migrations against Fly Postgres…"
cd "$ROOT/server"
export NODE_ENV=production
npx knex migrate:latest --knexfile knexfile.mjs

echo "==> Done."
