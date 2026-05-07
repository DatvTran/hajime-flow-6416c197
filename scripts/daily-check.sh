#!/usr/bin/env bash
# Daily health & security check for Hajime.
# Run from repository root: bash scripts/daily-check.sh
# Tiers run in order; a stop-condition failure exits immediately.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# ── Colour helpers ─────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'
pass()  { echo -e "${GREEN}✔  $*${RESET}"; }
warn()  { echo -e "${YELLOW}⚠  $*${RESET}"; }
fail()  { echo -e "${RED}✘  $*${RESET}"; }
info()  { echo -e "${CYAN}▸  $*${RESET}"; }
header(){ echo -e "\n${BOLD}$*${RESET}"; }

ERRORS=0
STOP=0   # set to 1 to trigger immediate exit after current tier

stop_condition() {
  fail "STOP CONDITION: $*"
  fail "Fix this before proceeding with lower tiers."
  STOP=1
  ERRORS=$((ERRORS + 1))
}

check_stop() {
  if [[ $STOP -eq 1 ]]; then
    echo ""
    fail "Halted on stop condition. Address the issue above before re-running."
    exit 1
  fi
}

START_TIME=$(date +%s)

# ── Tier 1 — Pulse check ───────────────────────────────────────────────────
header "━━━  Tier 1 — Pulse check  ━━━"

info "Git baseline..."
git fetch origin 2>&1 | tail -3 || warn "git fetch failed (offline?)"
GIT_STATUS=$(git status --short)
if [[ -z "$GIT_STATUS" ]]; then
  pass "Working tree clean"
else
  warn "Uncommitted changes:"
  git status --short
fi

info "Production health endpoint..."
HEALTH_RESPONSE=$(curl -sf --max-time 10 https://hajime-app.fly.dev/api/health 2>/dev/null || echo "UNREACHABLE")
if [[ "$HEALTH_RESPONSE" == "UNREACHABLE" ]]; then
  stop_condition "Health endpoint unreachable — https://hajime-app.fly.dev/api/health"
else
  HEALTH_OK=$(echo "$HEALTH_RESPONSE" | grep -o '"ok":true' || echo "")
  HEALTH_DB=$(echo "$HEALTH_RESPONSE" | grep -o '"database":"connected"' || echo "")
  if [[ -z "$HEALTH_OK" ]]; then
    stop_condition "Health endpoint returned ok != true → $HEALTH_RESPONSE"
  elif [[ -z "$HEALTH_DB" ]]; then
    stop_condition "Database not connected → $HEALTH_RESPONSE"
  else
    pass "Health OK — DB connected"
  fi
fi

check_stop

info "Fly machines status..."
if command -v fly &>/dev/null; then
  FLY_STATUS=$(fly status -a hajime-app 2>&1 || echo "FLY_ERROR")
  if echo "$FLY_STATUS" | grep -qiE "failed|restart loop|FLY_ERROR"; then
    stop_condition "fly status reports unhealthy machines"
  else
    echo "$FLY_STATUS"
    pass "Fly machines look healthy"
  fi

  info "Scanning last 24 h of logs for errors..."
  LOG_HITS=$(fly logs -a hajime-app --since 24h 2>/dev/null \
    | grep -iE "error|unhandled|ECONN|5[0-9]{2}" \
    | grep -v "HealthCheck\|health_check\|/api/health" \
    || true)
  if [[ -n "$LOG_HITS" ]]; then
    warn "Error-pattern lines found in logs (review before deploying):"
    echo "$LOG_HITS" | tail -20
    ERRORS=$((ERRORS + 1))
  else
    pass "No error spam in last 24 h of logs"
  fi
else
  warn "fly CLI not found — skipping machine status and log checks"
fi

check_stop

# ── Tier 2 — Code health ───────────────────────────────────────────────────
header "━━━  Tier 2 — Code health  ━━━"

info "TypeScript (tsc --noEmit)..."
if npx tsc --noEmit 2>&1; then
  pass "No type errors"
else
  stop_condition "tsc --noEmit reported errors — fix types before proceeding"
fi

check_stop

info "ESLint..."
if npm run lint --silent 2>&1; then
  pass "Lint clean"
else
  fail "Lint reported issues"
  ERRORS=$((ERRORS + 1))
fi

info "Unit tests (Vitest)..."
if npm test --silent 2>&1; then
  pass "Unit tests passed"
else
  fail "Unit tests failed"
  ERRORS=$((ERRORS + 1))
fi

info "Production build sanity (vite build)..."
if npx vite build --logLevel warn 2>&1; then
  pass "Vite build succeeded"
else
  fail "Vite build failed"
  ERRORS=$((ERRORS + 1))
fi

info "Audit: legacy startup validation..."
if node scripts/validate-legacy-startup.mjs 2>&1; then
  pass "Legacy startup validation passed"
else
  fail "Legacy startup validation failed"
  ERRORS=$((ERRORS + 1))
fi

info "Audit: no-legacy-start guard..."
if node scripts/check-no-legacy-start.mjs 2>&1; then
  pass "No legacy start script present"
else
  fail "Legacy start script detected"
  ERRORS=$((ERRORS + 1))
fi

check_stop

# ── Tier 3 — Security & integrity ─────────────────────────────────────────
header "━━━  Tier 3 — Security & integrity  ━━━"

info "Fly secrets presence check..."
if command -v fly &>/dev/null; then
  SECRETS=$(fly secrets list -a hajime-app 2>/dev/null || echo "")
  REQUIRED_SECRETS=("ACCESS_TOKEN_SECRET" "REFRESH_TOKEN_SECRET" "SESSION_SECRET" "DB_PASSWORD" "STRIPE_SECRET_KEY")
  MISSING_SECRETS=()
  for s in "${REQUIRED_SECRETS[@]}"; do
    if ! echo "$SECRETS" | grep -q "^$s"; then
      MISSING_SECRETS+=("$s")
    fi
  done
  if [[ ${#MISSING_SECRETS[@]} -gt 0 ]]; then
    stop_condition "Missing required secrets: ${MISSING_SECRETS[*]}"
  else
    pass "All 5 required secrets present"
  fi
else
  warn "fly CLI not found — skipping secrets check"
fi

check_stop

info "npm audit (root, high+)..."
NPM_AUDIT_ROOT=$(npm audit --omit=dev --audit-level=high --json 2>/dev/null || echo '{"metadata":{"vulnerabilities":{"high":99}}}')
HIGH_ROOT=$(echo "$NPM_AUDIT_ROOT" | grep -o '"high":[0-9]*' | grep -o '[0-9]*' | head -1 || echo "0")
CRIT_ROOT=$(echo "$NPM_AUDIT_ROOT" | grep -o '"critical":[0-9]*' | grep -o '[0-9]*' | head -1 || echo "0")
if [[ "$HIGH_ROOT" -gt 0 || "$CRIT_ROOT" -gt 0 ]]; then
  stop_condition "npm audit (root): $CRIT_ROOT critical, $HIGH_ROOT high vulnerabilities in runtime deps"
else
  pass "Root npm audit clean (no high/critical)"
fi

check_stop

info "npm audit (server, high+)..."
NPM_AUDIT_SERVER=$(cd server && npm audit --omit=dev --audit-level=high --json 2>/dev/null || echo '{"metadata":{"vulnerabilities":{"high":99}}}')
HIGH_SERVER=$(echo "$NPM_AUDIT_SERVER" | grep -o '"high":[0-9]*' | grep -o '[0-9]*' | head -1 || echo "0")
CRIT_SERVER=$(echo "$NPM_AUDIT_SERVER" | grep -o '"critical":[0-9]*' | grep -o '[0-9]*' | head -1 || echo "0")
if [[ "$HIGH_SERVER" -gt 0 || "$CRIT_SERVER" -gt 0 ]]; then
  stop_condition "npm audit (server): $CRIT_SERVER critical, $HIGH_SERVER high vulnerabilities in runtime deps"
else
  pass "Server npm audit clean (no high/critical)"
fi

check_stop

info "Scanning for hardcoded tenant UUIDs..."
HARDCODED_UUIDS=$(grep -rn "tenant_id" server/ src/ \
  | grep -iE "['\"][0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}['\"]" \
  | grep -iv "DEFAULT\|placeholder\|example\|test\|seed\|fixture\|spec\|\.test\.\|\.spec\." \
  || true)
if [[ -n "$HARDCODED_UUIDS" ]]; then
  fail "Hardcoded tenant UUIDs found (review for accidental fallback exposure):"
  echo "$HARDCODED_UUIDS"
  ERRORS=$((ERRORS + 1))
else
  pass "No unexpected hardcoded tenant UUIDs"
fi

info "Registration role guard check..."
REGISTER_BLOCK=$(grep -A 10 "router.post.*register" server/routes/auth.mjs \
  | grep -iE "founder_admin|role.*body|body.*role" \
  || true)
if [[ -n "$REGISTER_BLOCK" ]]; then
  warn "Possible role-from-body in register route — verify it is guarded by schema, not open:"
  echo "$REGISTER_BLOCK"
  ERRORS=$((ERRORS + 1))
else
  pass "No unguarded role assignment visible in register route"
fi

# Verify schema enforces allowed roles (schema-level guard)
SCHEMA_ROLES=$(grep -A 5 "role" server/routes/auth.schemas.mjs 2>/dev/null \
  | grep -iE "founder_admin|brand_operator" \
  || true)
if [[ -n "$SCHEMA_ROLES" ]]; then
  warn "Privileged roles (founder_admin/brand_operator) appear in register schema — confirm they are EXCLUDED not allowed:"
  echo "$SCHEMA_ROLES"
fi

info "Auth smoke: /api/auth/me must return 401 without token..."
ME_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
  https://hajime-app.fly.dev/api/auth/me 2>/dev/null || echo "000")
if [[ "$ME_STATUS" == "401" ]]; then
  pass "/api/auth/me → 401 (unauthenticated, correct)"
elif [[ "$ME_STATUS" == "000" ]]; then
  warn "/api/auth/me unreachable (network issue?)"
else
  fail "/api/auth/me returned $ME_STATUS instead of 401 — potential auth bypass"
  ERRORS=$((ERRORS + 1))
fi

check_stop

# ── Tier 4 — Live smoke hint ───────────────────────────────────────────────
header "━━━  Tier 4 — Live smoke (manual or Playwright)  ━━━"

info "Checking for Playwright installation..."
if npx playwright --version &>/dev/null 2>&1; then
  info "Running Playwright smoke suite (chromium)..."
  if npx playwright test e2e/smoke.spec.ts --project=chromium --reporter=line 2>&1; then
    pass "Playwright smoke passed"
  else
    fail "Playwright smoke failed — check e2e/smoke.spec.ts"
    ERRORS=$((ERRORS + 1))
  fi
else
  warn "Playwright not installed — run manual smoke:"
  echo "  • Brand Operator  → /orders /inventory /map (Cartographic)"
  echo "  • Sales Rep       → home, accounts list, create draft order"
  echo "  • Manufacturer    → portal, production runs"
  echo "  • Retail          → orders + shipments, confirm no settings link"
  echo "  Install with: npx playwright install --with-deps chromium"
fi

# ── Summary ────────────────────────────────────────────────────────────────
END_TIME=$(date +%s)
ELAPSED=$(( END_TIME - START_TIME ))

header "━━━  Summary  ━━━"
echo "Elapsed: ${ELAPSED}s"
if [[ $ERRORS -eq 0 ]]; then
  pass "All checks passed. Good to go."
else
  fail "$ERRORS issue(s) found. Review output above before deploying."
  exit 1
fi
