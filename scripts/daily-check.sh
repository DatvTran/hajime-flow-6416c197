#!/usr/bin/env bash
# =============================================================================
#  Hajime daily health check — run every working day before writing new code.
#
#  Tiers run in order; Tier 1 failures block the rest.
#  STOP CONDITIONS exit immediately and must be resolved before anything else.
#
#  Usage:
#    bash scripts/daily-check.sh               # full run (Tiers 1–4)
#    bash scripts/daily-check.sh --weekly      # full run + weekly add-ons
#    bash scripts/daily-check.sh --skip-fly    # skip fly CLI checks (offline)
#    bash scripts/daily-check.sh --skip-prod   # skip prod HTTP calls
#    bash scripts/daily-check.sh --tier 2      # start from tier N
#
#  Environment overrides:
#    HAJIME_FLY_APP      fly.io app name       (default: hajime-app)
#    HAJIME_BASE_URL     prod base URL         (default: https://hajime-app.fly.dev)
# =============================================================================
set -uo pipefail

# ── Defaults ──────────────────────────────────────────────────────────────────
APP_NAME="${HAJIME_FLY_APP:-hajime-app}"
BASE_URL="${HAJIME_BASE_URL:-https://hajime-app.fly.dev}"
HEALTH_URL="${BASE_URL}/api/health"
SKIP_FLY=""
SKIP_PROD=""
START_TIER=1
WEEKLY=""

# ── Argument parsing ──────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-fly)   SKIP_FLY=1 ;;
    --skip-prod)  SKIP_PROD=1 ;;
    --tier)       START_TIER="${2:?'--tier requires a number'}"; shift ;;
    --weekly)     WEEKLY=1 ;;
    *) echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
  shift
done

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'

# ── Counters (set per-tier, read in summary) ──────────────────────────────────
T1_FAILS=0; T2_FAILS=0; T3_FAILS=0; T4_FAILS=0

# ── Helpers ───────────────────────────────────────────────────────────────────
pass()  { echo -e "  ${GREEN}✓${NC}  $*"; }
fail()  { echo -e "  ${RED}✗${NC}  $*"; }
warn()  { echo -e "  ${YELLOW}!${NC}  $*"; }
info()  { echo -e "  ${DIM}→${NC}  $*"; }
hdr()   { echo -e "\n${BOLD}${BLUE}━━━ $* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }
step()  { echo -e "\n${BOLD}$*${NC}"; }

has_cmd() { command -v "$1" &>/dev/null; }

# Stop conditions: print the condition and exit 2 (distinct from check failures)
stop() {
  echo ""
  echo -e "${RED}${BOLD}⛔  STOP CONDITION${NC}"
  echo -e "${RED}   $*${NC}"
  echo -e "${RED}   Resolve this before running any other tier.${NC}"
  echo ""
  exit 2
}

# Run a command; on failure increment $1 (nameref) and return 1
check() {
  local -n _counter=$1; shift
  if "$@"; then return 0; fi
  (( _counter++ )) || true
  return 1
}

# ── Ensure we run from the repo root ─────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}/.."

# =============================================================================
#  TIER 1 — Pulse check  (~5 min)
# =============================================================================
if [[ $START_TIER -le 1 ]]; then
hdr "TIER 1 — Pulse check  (~5 min)"

# ── 1a. Git baseline ──────────────────────────────────────────────────────────
step "1a. Git baseline"
if git fetch origin 2>/dev/null; then
  pass "git fetch origin"
else
  warn "git fetch failed — network issue or no remote configured"
fi

GIT_CHANGES=$(git status --porcelain 2>/dev/null || true)
if [[ -z "$GIT_CHANGES" ]]; then
  pass "Working tree clean"
else
  warn "Working tree has uncommitted changes:"
  git status --short | sed 's/^/       /'
fi

# ── 1b. Production health endpoint ───────────────────────────────────────────
step "1b. Production health endpoint"
if [[ -n "$SKIP_PROD" ]]; then
  warn "SKIP_PROD set — skipping health check"
elif ! has_cmd curl; then
  warn "curl not available — install it or set SKIP_PROD=1"
else
  HTTP_CODE=$(curl -s -o /tmp/hajime_health_$$.json \
    -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
  if [[ "$HTTP_CODE" == "200" ]]; then
    DB_VAL=$(grep -o '"database":"[^"]*"' /tmp/hajime_health_$$.json \
      2>/dev/null | cut -d'"' -f4 || echo "unknown")
    OK_VAL=$(grep -o '"ok":[a-z]*' /tmp/hajime_health_$$.json \
      2>/dev/null | cut -d: -f2 || echo "unknown")
    if [[ "$DB_VAL" == "connected" && "$OK_VAL" == "true" ]]; then
      pass "Health 200 OK — ok:true · database:connected"
    else
      fail "Health 200 but ok=$OK_VAL database=$DB_VAL"
      stop "Health endpoint returned ok=$OK_VAL database=$DB_VAL. Expected ok:true + database:connected."
    fi
  else
    fail "Health check failed (HTTP $HTTP_CODE)"
    stop "Health endpoint at $HEALTH_URL returned HTTP $HTTP_CODE. The app may be down."
  fi
  rm -f /tmp/hajime_health_$$.json
fi

# ── 1c. Fly.io machine status ─────────────────────────────────────────────────
step "1c. Fly.io machine status"
if [[ -n "$SKIP_FLY" ]]; then
  warn "SKIP_FLY set — skipping fly status"
elif ! has_cmd fly; then
  warn "fly CLI not found — install: curl -L https://fly.io/install.sh | sh"
else
  FLY_STATUS=$(fly status -a "$APP_NAME" 2>&1 || true)
  if echo "$FLY_STATUS" | grep -qiE "started|running"; then
    MACHINE_COUNT=$(echo "$FLY_STATUS" | grep -icE "started|running" || true)
    pass "fly status: $MACHINE_COUNT machine(s) running"
  else
    fail "fly status: no machines in started/running state"
    (( T1_FAILS++ )) || true
  fi
fi

# ── 1d. Error scan in logs (last 24h) ─────────────────────────────────────────
step "1d. Error scan in last-24h logs"
if [[ -n "$SKIP_FLY" ]]; then
  warn "SKIP_FLY set — skipping log scan"
elif ! has_cmd fly; then
  warn "fly CLI not found — skipping log scan"
else
  RAW_LOGS=$(fly logs -a "$APP_NAME" --since 24h 2>/dev/null || true)

  # RouteErrorBoundary hits mean a render crash reached a real user — stop immediately.
  REB_COUNT=$(echo "$RAW_LOGS" | grep -ci "RouteErrorBoundary" || true)
  if [[ "$REB_COUNT" -gt 0 ]]; then
    fail "$REB_COUNT RouteErrorBoundary hit(s) in last 24h — render crash reached users"
    echo "$RAW_LOGS" | grep -i "RouteErrorBoundary" | tail -5 | sed 's/^/       /'
    stop "RouteErrorBoundary in production logs. A render crash made it to a user — fix before anything else."
  fi

  LOG_ERRORS=$(echo "$RAW_LOGS" \
    | grep -ciE "error|unhandled|ECONN|5[0-9]{2}" || true)
  if [[ "$LOG_ERRORS" -eq 0 ]]; then
    pass "No error-class lines in last 24h"
  elif [[ "$LOG_ERRORS" -le 5 ]]; then
    warn "$LOG_ERRORS error-class line(s) — review:"
    info "fly logs -a $APP_NAME --since 24h | grep -iE 'error|unhandled|ECONN|5[0-9][0-9]'"
    (( T1_FAILS++ )) || true
  else
    fail "$LOG_ERRORS error-class lines in last 24h — likely a real issue"
    info "fly logs -a $APP_NAME --since 24h | grep -iE 'error|unhandled|ECONN|5[0-9][0-9]'"
    (( T1_FAILS++ )) || true
  fi
fi

if [[ $T1_FAILS -gt 0 ]]; then
  echo ""
  echo -e "${RED}Tier 1: $T1_FAILS check(s) need attention. Fix before proceeding.${NC}"
  exit 1
fi
fi  # end START_TIER <= 1

# =============================================================================
#  TIER 2 — Code health  (~10–15 min)
# =============================================================================
if [[ $START_TIER -le 2 ]]; then
hdr "TIER 2 — Code health  (~10–15 min)"

# ── 2a. TypeScript types ──────────────────────────────────────────────────────
step "2a. TypeScript — tsc --noEmit"
info "SWC/Vite strips types without checking them; tsc is the only gate."
if npx tsc --noEmit 2>&1; then
  pass "tsc: no type errors"
else
  fail "tsc: type errors found"
  stop "tsc --noEmit reported errors. Vite green ≠ types green — fix before anything else."
fi

# ── 2b. ESLint ────────────────────────────────────────────────────────────────
step "2b. ESLint"
if npm run lint --silent 2>&1; then
  pass "lint: 0 actionable warnings"
else
  fail "lint: warnings or errors found (see above)"
  (( T2_FAILS++ )) || true
fi

# ── 2c. Vitest unit tests ─────────────────────────────────────────────────────
step "2c. Vitest unit tests"
if npm test -- --reporter=verbose 2>&1; then
  pass "vitest: all tests pass"
else
  fail "vitest: test failures (see above)"
  (( T2_FAILS++ )) || true
fi

# ── 2d. Production build sanity ───────────────────────────────────────────────
step "2d. Vite production build"
if npx vite build --logLevel warn 2>&1; then
  pass "vite build: success"
else
  fail "vite build: failed"
  (( T2_FAILS++ )) || true
fi

# ── 2e. Sidebar → route resolution ───────────────────────────────────────────
step "2e. Sidebar → route audit"
if node scripts/audit-sidebar-links.mjs 2>&1; then
  pass "audit-sidebar-links: all URLs resolve"
else
  fail "audit-sidebar-links: broken sidebar links found"
  (( T2_FAILS++ )) || true
fi

# ── 2f. Import resolution ─────────────────────────────────────────────────────
step "2f. Import resolution audit"
if node scripts/audit-imports.mjs 2>&1; then
  pass "audit-imports: all imports resolve"
else
  fail "audit-imports: unresolved imports found"
  (( T2_FAILS++ )) || true
fi
fi  # end START_TIER <= 2

# =============================================================================
#  TIER 3 — Security & integrity  (~10–15 min)
# =============================================================================
if [[ $START_TIER -le 3 ]]; then
hdr "TIER 3 — Security & integrity  (~10–15 min)"

# ── 3a. Production secrets ────────────────────────────────────────────────────
step "3a. Production secrets (fly secrets list)"
if [[ -n "$SKIP_FLY" ]]; then
  warn "SKIP_FLY set — skipping secrets check"
elif ! has_cmd fly; then
  warn "fly CLI not found — skipping secrets check"
else
  SECRETS_LIST=$(fly secrets list -a "$APP_NAME" 2>/dev/null || echo "")
  REQUIRED_SECRETS=(
    ACCESS_TOKEN_SECRET
    REFRESH_TOKEN_SECRET
    SESSION_SECRET
    DB_PASSWORD
    STRIPE_SECRET_KEY
  )
  MISSING=()
  for secret in "${REQUIRED_SECRETS[@]}"; do
    if echo "$SECRETS_LIST" | grep -q "^${secret}"; then
      pass "Secret present: $secret"
    else
      fail "Secret missing: $secret"
      MISSING+=("$secret")
    fi
  done
  if [[ ${#MISSING[@]} -gt 0 ]]; then
    stop "Missing production secrets: ${MISSING[*]}"
  fi
fi

# ── 3b. Dependency vulnerabilities ───────────────────────────────────────────
step "3b. npm audit — root (runtime deps)"
if npm audit --omit=dev --audit-level=high 2>&1; then
  pass "npm audit (root): no high/critical vulns"
else
  fail "npm audit (root): high/critical vulnerabilities found"
  stop "npm audit reports a high/critical vulnerability in a runtime dep — fix before deploying."
fi

step "3c. npm audit — server/ (runtime deps)"
if npm audit --omit=dev --audit-level=high --prefix server 2>&1; then
  pass "npm audit (server): no high/critical vulns"
else
  fail "npm audit (server): high/critical vulnerabilities found"
  stop "npm audit (server) reports a high/critical vulnerability — fix before deploying."
fi

# ── 3d. Hardcoded tenant UUIDs ────────────────────────────────────────────────
step "3d. Hardcoded tenant UUIDs"
HARDCODED=$(grep -rn "tenant_id" server/ src/ 2>/dev/null \
  | grep -iE "['\"][0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}['\"]" \
  | grep -iv "DEFAULT" \
  | grep -iv "\.test\." \
  | grep -iv "\.spec\." \
  | grep -iv "seed" \
  || true)
if [[ -z "$HARDCODED" ]]; then
  pass "No non-default hardcoded tenant UUIDs found"
else
  fail "Hardcoded tenant UUID(s) found — may leak cross-tenant data:"
  echo "$HARDCODED" | sed 's/^/       /'
  (( T3_FAILS++ )) || true
fi

# ── 3e. Registration role guard ───────────────────────────────────────────────
step "3e. Self-registration role guard"
# SELF_REGISTERABLE_ROLES must not contain founder_admin or brand_operator
PRIV_IN_SELF_REG=$(grep -A 20 "SELF_REGISTERABLE_ROLES" \
  server/routes/auth.schemas.mjs 2>/dev/null \
  | grep -iE "founder_admin|brand_operator" || true)
if [[ -z "$PRIV_IN_SELF_REG" ]]; then
  pass "Role guard: founder_admin/brand_operator excluded from SELF_REGISTERABLE_ROLES"
else
  fail "Role guard: privileged role in SELF_REGISTERABLE_ROLES"
  echo "$PRIV_IN_SELF_REG" | sed 's/^/       /'
  stop "founder_admin or brand_operator is in SELF_REGISTERABLE_ROLES — anyone can self-register as admin."
fi

# ── 3f. Auth smoke tests against prod ────────────────────────────────────────
step "3f. Auth smoke — production"
if [[ -n "$SKIP_PROD" ]]; then
  warn "SKIP_PROD set — skipping auth smoke"
elif ! has_cmd curl; then
  warn "curl not found — skipping auth smoke"
else
  # GET /api/auth/me without token must 401
  ME_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    "${BASE_URL}/api/auth/me" 2>/dev/null || echo "000")
  if [[ "$ME_CODE" == "401" ]]; then
    pass "GET /api/auth/me (no token) → 401  ✓"
  else
    fail "GET /api/auth/me (no token) → $ME_CODE (expected 401)"
    (( T3_FAILS++ )) || true
  fi
fi

# ── 3g. auth_events spot-check (requires DATABASE_URL) ───────────────────────
step "3g. auth_events — last-24h spot-check"
DB_URL="${DATABASE_URL:-${DB_URL:-}}"
if [[ -z "$DB_URL" ]]; then
  warn "DATABASE_URL not set — skipping auth_events check (set it to enable)"
  info "export DATABASE_URL=<connection-string>  then re-run"
elif ! has_cmd psql; then
  warn "psql not found — skipping auth_events check"
else
  # permission_denied spikes, account_locked repeats, or privileged self-registration
  PRIV_REG=$(psql "$DB_URL" -At -c "
    SELECT COUNT(*) FROM auth_events
    WHERE event_type = 'register'
      AND role IN ('founder_admin','brand_operator')
      AND created_at > NOW() - INTERVAL '24 hours'
  " 2>/dev/null || echo "err")
  if [[ "$PRIV_REG" == "err" ]]; then
    warn "auth_events query failed — check DATABASE_URL"
  elif [[ "$PRIV_REG" -gt 0 ]]; then
    fail "auth_events: $PRIV_REG privileged self-registration event(s) in last 24h"
    stop "auth_events shows a successful register with founder_admin or brand_operator role."
  else
    pass "auth_events: no privileged self-registrations in last 24h"
  fi

  PD_COUNT=$(psql "$DB_URL" -At -c "
    SELECT COUNT(*) FROM auth_events
    WHERE event_type = 'permission_denied'
      AND created_at > NOW() - INTERVAL '24 hours'
  " 2>/dev/null || echo "err")
  LOCK_COUNT=$(psql "$DB_URL" -At -c "
    SELECT COUNT(*) FROM auth_events
    WHERE event_type = 'account_locked'
      AND created_at > NOW() - INTERVAL '24 hours'
  " 2>/dev/null || echo "err")
  if [[ "$PD_COUNT" != "err" && "$LOCK_COUNT" != "err" ]]; then
    if [[ "$PD_COUNT" -gt 20 || "$LOCK_COUNT" -gt 5 ]]; then
      warn "auth_events: $PD_COUNT permission_denied + $LOCK_COUNT account_locked in last 24h — investigate"
      (( T3_FAILS++ )) || true
    else
      pass "auth_events: $PD_COUNT permission_denied, $LOCK_COUNT account_locked — within normal range"
    fi
  fi
fi
fi  # end START_TIER <= 3

# =============================================================================
#  TIER 4 — Live smoke  (~5–10 min)
# =============================================================================
if [[ $START_TIER -le 4 ]]; then
hdr "TIER 4 — Live smoke  (~5–10 min)"
echo ""

if [[ -f "playwright.config.ts" ]] && has_cmd npx; then
  step "Running Playwright smoke suite (Chromium)…"
  if npx playwright test e2e/smoke.spec.ts --project=chromium --reporter=line 2>&1; then
    pass "Playwright smoke: all checks pass"
  else
    fail "Playwright smoke: failures detected — check output above"
    (( T4_FAILS++ )) || true
  fi
else
  warn "Playwright not configured — perform manual smoke:"
  echo ""
  echo "    Role              Path(s) to visit"
  echo "    ─────────────     ────────────────────────────────────────────────"
  echo "    Brand Operator    /orders · /inventory · /markets (Cartographic)"
  echo "    Sales Rep         / · /sales/accounts · create a draft order"
  echo "    Manufacturer      /manufacturer (portal + production runs visible)"
  echo "    Retail            /retail/orders · /shipments · confirm no /settings link"
  echo ""
  echo "  To run all 6 Playwright suites:"
  echo "    npx playwright test --project=chromium --reporter=line"
fi
fi  # end START_TIER <= 4

# =============================================================================
#  WEEKLY add-ons  (--weekly flag only)
# =============================================================================
if [[ -n "$WEEKLY" ]]; then
hdr "WEEKLY add-ons"

step "W1. Outdated packages — root"
npm outdated || true   # non-zero exit is normal when outdated packages exist

step "W2. Outdated packages — server/"
(cd server && npm outdated) || true

step "W3. Full Playwright run (all 6 suites, Chromium)"
if [[ -f "playwright.config.ts" ]] && has_cmd npx; then
  if npx playwright test --project=chromium --reporter=line 2>&1; then
    pass "Playwright full run: all suites pass"
  else
    fail "Playwright full run: failures detected — check output above"
    (( T4_FAILS++ )) || true
  fi
else
  warn "playwright.config.ts not found or npx unavailable"
fi

step "W4. Fly volumes — disk usage"
if [[ -n "$SKIP_FLY" ]]; then
  warn "SKIP_FLY set — skipping volumes check"
elif ! has_cmd fly; then
  warn "fly CLI not found — skipping volumes check"
else
  fly volumes list -a "$APP_NAME" 2>&1 || true
fi

step "W5. auth_events + audit_logs — 7-day review"
DB_URL="${DATABASE_URL:-${DB_URL:-}}"
if [[ -z "$DB_URL" ]]; then
  warn "DATABASE_URL not set — print the query to run manually:"
  echo ""
  echo "    SELECT event_type, COUNT(*), MIN(created_at), MAX(created_at)"
  echo "    FROM auth_events"
  echo "    WHERE created_at > NOW() - INTERVAL '7 days'"
  echo "    GROUP BY event_type ORDER BY COUNT(*) DESC;"
  echo ""
elif has_cmd psql; then
  psql "$DB_URL" -c "
    SELECT event_type, COUNT(*) AS n,
           MIN(created_at)::date AS first_seen,
           MAX(created_at)::date AS last_seen
    FROM auth_events
    WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY event_type ORDER BY n DESC
  " 2>/dev/null || warn "auth_events query failed — check DATABASE_URL"
fi

step "W6. Known open gaps — status reminder"
echo ""
echo "  These three gaps were deferred. Review if anything upstream changed:"
echo ""
echo "    1. Depletion reporting      — Sales Rep has no inventory visibility"
echo "    2. Sales Rep inventory view — widget not yet shipped"
echo "    3. Production PO gate       — inventory check before PO approval missing"
echo ""
echo "  If any of these is now higher priority, update the backlog before coding."
fi  # end WEEKLY

# =============================================================================
#  SUMMARY
# =============================================================================
TOTAL_FAILS=$(( T1_FAILS + T2_FAILS + T3_FAILS + T4_FAILS ))

echo ""
echo -e "${BOLD}${BLUE}━━━ SUMMARY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [[ $TOTAL_FAILS -eq 0 ]]; then
  echo -e "${GREEN}${BOLD}✓ All tiers green — safe to deploy.${NC}"
else
  echo -e "${YELLOW}${BOLD}! $TOTAL_FAILS check(s) need attention before deploying:${NC}"
  [[ $T1_FAILS -gt 0 ]] && echo -e "  ${RED}✗  Tier 1 (Pulse):      $T1_FAILS failure(s)${NC}"
  [[ $T2_FAILS -gt 0 ]] && echo -e "  ${RED}✗  Tier 2 (Code):       $T2_FAILS failure(s)${NC}"
  [[ $T3_FAILS -gt 0 ]] && echo -e "  ${RED}✗  Tier 3 (Security):   $T3_FAILS failure(s)${NC}"
  [[ $T4_FAILS -gt 0 ]] && echo -e "  ${RED}✗  Tier 4 (Smoke):      $T4_FAILS failure(s)${NC}"
fi

echo ""
if [[ -z "$WEEKLY" ]]; then
echo -e "${DIM}Weekly add-ons (run once a week):${NC}"
echo -e "${DIM}  bash scripts/daily-check.sh --weekly${NC}"
echo ""
fi

[[ $TOTAL_FAILS -eq 0 ]]  # exit 0 on success, 1 on any failures
