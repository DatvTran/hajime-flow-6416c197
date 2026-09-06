#!/usr/bin/env bash
# Verify DATABASE_URL is set on the Fly app before deploy (Supabase or other Postgres).
set -euo pipefail

APP="${FLY_APP:-hajime-app}"

if [[ -n "${FLY_CMD:-}" ]]; then
  :
elif command -v flyctl >/dev/null 2>&1; then
  FLY_CMD=flyctl
elif command -v fly >/dev/null 2>&1; then
  FLY_CMD=fly
else
  echo "ERROR: fly or flyctl is required"
  exit 1
fi

echo "==> Checking DATABASE_URL secret on ${APP}"
if ! SECRETS_JSON="$("${FLY_CMD}" secrets list --app "${APP}" --json 2>&1)"; then
  echo "ERROR: Could not list secrets on ${APP} (CLI/API failure, not a missing secret):"
  echo "${SECRETS_JSON}"
  exit 1
fi

HAS_DB_URL="$(echo "${SECRETS_JSON}" | python3 -c "
import json, sys
rows = json.load(sys.stdin)
names = {row.get('name') for row in rows if isinstance(row, dict)}
print('yes' if 'DATABASE_URL' in names else 'no')
")"

if [[ "${HAS_DB_URL}" != "yes" ]]; then
  echo "ERROR: DATABASE_URL is not set on ${APP}."
  echo "Run: ${FLY_CMD} secrets set DATABASE_URL='postgresql://...' --app ${APP}"
  echo "See DEPLOY_SUPABASE.md"
  exit 1
fi

echo "==> Postgres preflight OK for ${APP}"
