#!/usr/bin/env bash
# =============================================================================
#  Hajime daily health check — run every working day before writing new code.
#
#  Tiers run in order; Tier 1 failures block the rest.
#  STOP CONDITIONS exit immediately and must be resolved before anything else.
#
#  Usage:
#    bash scripts/daily-check.sh               # full run (Tiers 1-4)
#    bash scripts/daily-check.sh --weekly      # Tiers 1-4 + weekly add-ons
#    bash scripts/daily-check.sh --skip-fly    # skip fly CLI checks (offline)
#    bash scripts/daily-check.sh --skip-prod   # skip prod HTTP calls
#    bash scripts/daily-check.sh --tier 2      # start from tier N
#
#  Environment overrides:
#    HAJIME_FLY_APP      fly.io app name       (default: hajime-app)
#    HAJIME_BASE_URL     prod base URL         (default: https://hajime-app.fly.dev)
#    TENANT_A_TOKEN      access token for cross-tenant smoke test (optional)
#    TENANT_B_UUID       target tenant UUID for cross-tenant smoke test (optional)
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
    --weekly)     WEEKLY=1 ;;
    --tier)       START_TIER="${2:?'--tier requires a number'}"; shift ;;
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

  # Stop condition: RouteErrorBoundary in logs means a render crash reached users.
  REB_HITS=$(echo "$RAW_LOGS" | grep -c "RouteErrorBoundary" || true)
  if [[ "$REB_HITS" -gt 0 ]]; then
    fail "$REB_HITS RouteErrorBoundary hit(s) in last 24h — render crash(es) reached users"
    stop "RouteErrorBoundary found in production logs ($REB_HITS hit(s)). A component crash made it to a user — fix before proceeding."
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

  # Cross-tenant isolation: tenant A token must not read tenant B data (→ 403)
  # Set TENANT_A_TOKEN and TENANT_B_UUID to enable this check.
  if [[ -n "${TENANT_A_TOKEN:-}" && -n "${TENANT_B_UUID:-}" ]]; then
    step "3g. Cross-tenant isolation smoke"
    CROSS_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "Authorization: Bearer ${TENANT_A_TOKEN}" \
      "${BASE_URL}/api/products?tenantId=${TENANT_B_UUID}" 2>/dev/null || echo "000")
    if [[ "$CROSS_CODE" == "403" ]]; then
      pass "Cross-tenant GET /api/products?tenantId=<B> → 403  ✓"
    elif [[ "$CROSS_CODE" == "401" ]]; then
      warn "Cross-tenant check → 401 (token may be expired — re-export TENANT_A_TOKEN)"
    else
      fail "Cross-tenant GET → $CROSS_CODE (expected 403) — possible tenant isolation breach"
      stop "Cross-tenant isolation check returned $CROSS_CODE instead of 403. Investigate before deploying."
    fi
  else
    info "Cross-tenant smoke skipped — set TENANT_A_TOKEN + TENANT_B_UUID to enable"
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
#  WEEKLY ADD-ONS  (run with --weekly; too noisy for every day)
# =============================================================================
if [[ -n "$WEEKLY" ]]; then
hdr "WEEKLY — Maintenance add-ons"
W_FAILS=0

step "W1. Root outdated packages"
npx --yes npm-check-updates --format group 2>/dev/null \
  || npm outdated 2>&1 || true
pass "Root package report done (review above for minor/patch bumps)"

step "W2. Server outdated packages"
(cd server && npm outdated 2>&1 || true)
pass "Server package report done"

step "W3. Full Playwright suite (all 6 suites)"
if [[ -f "playwright.config.ts" ]] && has_cmd npx; then
  if npx playwright test --project=chromium --reporter=line 2>&1; then
    pass "Full Playwright: all suites green"
  else
    fail "Full Playwright: failures detected"
    (( W_FAILS++ )) || true
  fi
else
  warn "Playwright not configured — run manually: npx playwright test --reporter=line"
fi

step "W4. Fly volumes (disk usage)"
if [[ -n "$SKIP_FLY" ]]; then
  warn "SKIP_FLY set — skipping volumes check"
elif ! has_cmd fly; then
  warn "fly CLI not found — skipping volumes check"
else
  fly volumes list -a "$APP_NAME" 2>&1 || true
  pass "Volume list above — confirm server/data is not ballooning (Stage 1 expected)"
fi

step "W5. Known gaps review (manual)"
echo ""
echo "  Review the three known feature gaps and check if upstream changes affect priority:"
echo "    1. Depletion reporting — no automated report; must be done manually"
echo "    2. Sales Rep inventory visibility — widget not shipped yet"
echo "    3. Production PO inventory gate — gate logic not enforced yet"
echo ""
echo "  Also review auth_events + audit_logs for the past 7 days:"
echo "    • permission_denied spikes?"
echo "    • repeated account_locked events?"
echo "    • unexpected register events (especially founder_admin / brand_operator)?"
echo ""

if [[ $W_FAILS -gt 0 ]]; then
  echo -e "${YELLOW}Weekly: $W_FAILS check(s) need attention${NC}"
fi
fi  # end WEEKLY

# =============================================================================
#  SUMMARY
# =============================================================================
W_FAILS="${W_FAILS:-0}"
TOTAL_FAILS=$(( T1_FAILS + T2_FAILS + T3_FAILS + T4_FAILS + W_FAILS ))

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
  [[ $W_FAILS  -gt 0 ]] && echo -e "  ${RED}✗  Weekly:              $W_FAILS failure(s)${NC}"
fi

if [[ -z "$WEEKLY" ]]; then
  echo ""
  echo -e "${DIM}Run with --weekly once a week for: npm outdated, full Playwright suite, volumes, gap review${NC}"
  echo -e "${DIM}Set TENANT_A_TOKEN + TENANT_B_UUID to enable cross-tenant isolation smoke (3g)${NC}"
fi
echo ""

[[ $TOTAL_FAILS -eq 0 ]]  # exit 0 on success, 1 on any failures
