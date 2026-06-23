#!/usr/bin/env bash
# Verify Fly Postgres is healthy before deploy (avoids release_command migration failures).
set -euo pipefail

APP="${FLY_APP:-hajime-app}"
DB_APP="${FLY_DB_APP:-hajime-db}"

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

echo "==> Checking Postgres cluster: ${DB_APP}"

if ! "${FLY_CMD}" status --app "${DB_APP}" >/dev/null 2>&1; then
  echo "ERROR: Postgres app '${DB_APP}' not found."
  echo "Create it: ${FLY_CMD} postgres create --name ${DB_APP} --region nrt"
  exit 1
fi

STATUS_JSON="$("${FLY_CMD}" status --app "${DB_APP}" --json 2>/dev/null || echo '{}')"
HEALTH="$(
  echo "${STATUS_JSON}" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
except Exception:
    print('unhealthy\t0\tunknown')
    sys.exit(0)
rows = data if isinstance(data, list) else data.get('Machines', [])
if not rows:
    print('unhealthy\t0\tunknown')
    sys.exit(0)
passing = 0
total = 0
role = 'unknown'
healthy = True
for row in rows:
    checks = row.get('checks') or []
    if not checks:
        healthy = False
    for c in checks:
        total += 1
        if c.get('status') == 'passing':
            passing += 1
        else:
            healthy = False
        if c.get('name') == 'role':
            role = (c.get('output') or 'unknown').strip().split()[0] or 'unknown'
            if c.get('status') != 'passing' or 'error' in role.lower():
                healthy = False
print(('healthy' if healthy else 'unhealthy') + f'\t{passing}\t{role}')
"
)"

HEALTH_STATE="$(echo "${HEALTH}" | cut -f1)"
PASSING="$(echo "${HEALTH}" | cut -f2)"
ROLE="$(echo "${HEALTH}" | cut -f3)"

if [[ "${HEALTH_STATE}" != "healthy" ]]; then
  echo "WARN: Postgres looks unhealthy (role=${ROLE}, passing checks=${PASSING})."
  MACHINE_ID="$("${FLY_CMD}" machines list --app "${DB_APP}" --json 2>/dev/null | python3 -c "
import json, sys
rows = json.load(sys.stdin)
print(rows[0]['id'] if rows else '')
" 2>/dev/null || true)"

  if [[ -n "${MACHINE_ID}" ]]; then
    echo "==> Restarting postgres machine ${MACHINE_ID}…"
    "${FLY_CMD}" machine restart "${MACHINE_ID}" --app "${DB_APP}"
    echo "==> Waiting for postgres to become healthy…"
    sleep 5
    "${FLY_CMD}" status --app "${DB_APP}"
  else
    echo "ERROR: Could not find a postgres machine to restart."
    echo "Check: ${FLY_CMD} logs --app ${DB_APP}"
    exit 1
  fi
else
  "${FLY_CMD}" status --app "${DB_APP}"
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
  echo "Run: ${FLY_CMD} postgres attach ${DB_APP} --app ${APP}"
  exit 1
fi

echo "==> Postgres preflight OK for ${APP}"
