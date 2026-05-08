#!/usr/bin/env bash
# Daily health check for Hajime.
# Usage:
#   ./scripts/daily-check.sh          # tiers 1–4 (default)
#   ./scripts/daily-check.sh --tier 2 # run only a specific tier
#   ./scripts/daily-check.sh --weekly # tiers 1–4 + weekly add-ons
#
# Stop conditions (any tier) cause an early non-zero exit.
# Requires: fly CLI, curl, node, npm, npx.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

APP_HOST="${APP_HOST:-https://hajime-app.fly.dev}"
FLY_APP="${FLY_APP:-hajime-app}"

RUN_TIER="${1:-all}"
WEEKLY=false
if [[ "${1:-}" == "--weekly" ]]; then
  RUN_TIER="all"
  WEEKLY=true
elif [[ "${1:-}" == "--tier" && -n "${2:-}" ]]; then
  RUN_TIER="$2"
fi

# ── helpers ────────────────────────────────────────────────────────────────────
PASS=0
FAIL=0
STOP=false

green()  { printf '\033[32m✔\033[0m  %s\n' "$*"; }
red()    { printf '\033[31m✖\033[0m  %s\n' "$*"; }
yellow() { printf '\033[33m▲\033[0m  %s\n' "$*"; }
header() { printf '\n\033[1;34m══ %s ══\033[0m\n' "$*"; }

pass() { green "$1"; ((PASS++)); }
fail() {
  red "$1"
  ((FAIL++))
  if [[ "${2:-}" == "STOP" ]]; then
    STOP=true
  fi
}

require_cmd() {
  if ! command -v "$1" &>/dev/null; then
    yellow "Skipping check that requires '$1' (not installed)"
    return 1
  fi
  return 0
}

stop_if_needed() {
  if $STOP; then
    echo
    red "Stop condition reached — fix the above before continuing."
    summary
    exit 1
  fi
}

summary() {
  echo
  printf '\033[1m%s passed, %s failed\033[0m\n' "$PASS" "$FAIL"
}

# ── Tier 1: Pulse check ────────────────────────────────────────────────────────
tier1() {
  header "Tier 1 — Pulse check"

  # Git baseline
  if git fetch origin 2>&1 | grep -q "error\|fatal"; then
    fail "git fetch failed — check network or remote" STOP
  fi
  stop_if_needed

  local status
  status=$(git status --porcelain)
  if [[ -z "$status" ]]; then
    pass "Working tree clean"
  else
    yellow "Working tree has changes (expected if WIP):"
    echo "$status"
    ((PASS++))
  fi

  # Prod health
  if require_cmd curl; then
    local health
    health=$(curl -sf --max-time 10 "$APP_HOST/api/health" 2>&1 || true)
    if echo "$health" | grep -q '"ok":true' && echo "$health" | grep -qE '"database":"(connected|up)"'; then
      pass "Health endpoint OK — $health"
    else
      fail "Health endpoint unhealthy: $health" STOP
    fi
    stop_if_needed

    # Auth/me should 401
    local me_status
    me_status=$(curl -o /dev/null -sw '%{http_code}' --max-time 10 "$APP_HOST/api/auth/me" 2>/dev/null || true)
    if [[ "$me_status" == "401" ]]; then
      pass "Unauthenticated /api/auth/me returns 401"
    else
      fail "Unauthenticated /api/auth/me returned $me_status (expected 401)" STOP
    fi
    stop_if_needed
  fi

  # Fly machine status
  if require_cmd fly; then
    local fly_status
    fly_status=$(fly status -a "$FLY_APP" 2>&1 || true)
    if echo "$fly_status" | grep -qiE "restart|crashed|failed"; then
      fail "fly status shows restart loops or crashes — check immediately" STOP
    else
      pass "Fly machines healthy (no restart loops)"
    fi
    stop_if_needed

    # Log scan (last 24h)
    local log_errors
    log_errors=$(fly logs -a "$FLY_APP" --since 24h 2>/dev/null | grep -ciE "error|unhandled|ECONN|5[0-9]{2}" || true)
    if [[ "$log_errors" -eq 0 ]]; then
      pass "No error-class log lines in last 24h"
    else
      fail "Found $log_errors error-class line(s) in last 24h — review with: fly logs -a $FLY_APP --since 24h | grep -iE 'error|unhandled|ECONN|5[0-9]{2}'"
    fi
  fi
}

# ── Tier 2: Code health ────────────────────────────────────────────────────────
tier2() {
  header "Tier 2 — Code health"

  # TypeScript
  if npx tsc --noEmit 2>&1; then
    pass "tsc --noEmit clean"
  else
    fail "tsc --noEmit found type errors" STOP
  fi
  stop_if_needed

  # ESLint
  if npm run lint --silent 2>&1; then
    pass "ESLint clean"
  else
    fail "ESLint reported issues" STOP
  fi
  stop_if_needed

  # Vitest
  if npm test --silent 2>&1; then
    pass "Vitest unit tests pass"
  else
    fail "Vitest tests failed" STOP
  fi
  stop_if_needed

  # Production build
  if npx vite build --logLevel warn 2>&1; then
    pass "Vite production build succeeded"
  else
    fail "Vite production build failed" STOP
  fi
  stop_if_needed

  # Project-specific audits
  if node scripts/audit-sidebar-links.mjs; then
    pass "Sidebar links audit clean"
  else
    fail "Sidebar links audit found broken routes" STOP
  fi
  stop_if_needed

  if node scripts/audit-imports.mjs; then
    pass "Import resolution audit clean"
  else
    fail "Import resolution audit found broken imports" STOP
  fi
  stop_if_needed
}

# ── Tier 3: Security & integrity ───────────────────────────────────────────────
tier3() {
  header "Tier 3 — Security & integrity"

  # Secrets presence
  if require_cmd fly; then
    local secrets
    secrets=$(fly secrets list -a "$FLY_APP" 2>/dev/null || true)
    local missing=()
    for key in ACCESS_TOKEN_SECRET REFRESH_TOKEN_SECRET SESSION_SECRET DB_PASSWORD STRIPE_SECRET_KEY; do
      if echo "$secrets" | grep -q "$key"; then
        pass "Secret present: $key"
      else
        missing+=("$key")
        fail "Secret MISSING: $key" STOP
      fi
    done
    stop_if_needed
  fi

  # npm audit — root (frontend)
  local audit_out
  audit_out=$(npm audit --omit=dev --audit-level=high --json 2>/dev/null || true)
  local high_count
  high_count=$(echo "$audit_out" | node -e "
    let d=''; process.stdin.on('data',c=>d+=c).on('end',()=>{
      try{ const r=JSON.parse(d); process.stdout.write(String((r.metadata?.vulnerabilities?.high||0)+(r.metadata?.vulnerabilities?.critical||0))); }
      catch{ process.stdout.write('0'); }
    });
  " 2>/dev/null || echo "0")
  if [[ "$high_count" -eq 0 ]]; then
    pass "No high/critical npm audit findings (frontend)"
  else
    fail "Found $high_count high/critical vuln(s) in frontend — run: npm audit --omit=dev --audit-level=high" STOP
  fi
  stop_if_needed

  # npm audit — server
  if [[ -d server ]]; then
    local server_audit
    server_audit=$(cd server && npm audit --omit=dev --audit-level=high --json 2>/dev/null || true)
    local server_high
    server_high=$(echo "$server_audit" | node -e "
      let d=''; process.stdin.on('data',c=>d+=c).on('end',()=>{
        try{ const r=JSON.parse(d); process.stdout.write(String((r.metadata?.vulnerabilities?.high||0)+(r.metadata?.vulnerabilities?.critical||0))); }
        catch{ process.stdout.write('0'); }
      });
    " 2>/dev/null || echo "0")
    if [[ "$server_high" -eq 0 ]]; then
      pass "No high/critical npm audit findings (server)"
    else
      fail "Found $server_high high/critical vuln(s) in server — run: cd server && npm audit --omit=dev --audit-level=high" STOP
    fi
    stop_if_needed
  fi

  # Hardcoded tenant UUIDs (excluding intentional DEFAULT constants)
  local uuid_hits
  uuid_hits=$(grep -rn "tenant_id" server/ src/ 2>/dev/null \
    | grep -iE "['\"][0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}['\"]" \
    | grep -iv "DEFAULT" | grep -iv "\.test\." | grep -iv "spec\." || true)
  if [[ -z "$uuid_hits" ]]; then
    pass "No hardcoded tenant UUIDs found in source"
  else
    fail "Hardcoded tenant UUID(s) detected:"
    echo "$uuid_hits"
    ((FAIL--))  # already counted above, just display
  fi

  # Registration role guard — founder_admin must not be self-registerable
  local reg_roles
  reg_roles=$(node -e "
    const src = require('fs').readFileSync('server/routes/auth.schemas.mjs','utf8');
    const m = src.match(/SELF_REGISTERABLE_ROLES\s*=\s*\[([\s\S]*?)\]/);
    if (!m) { console.log('PARSE_ERROR'); process.exit(1); }
    const roles = m[1].replace(/Role\.\w+/g, r => {
      const name = r.split('.')[1];
      return name;
    });
    if (src.includes('FOUNDER_ADMIN') && m[0].includes('FOUNDER_ADMIN')) {
      console.log('UNSAFE');
    } else {
      console.log('SAFE');
    }
  " 2>/dev/null || echo "PARSE_ERROR")
  if [[ "$reg_roles" == "SAFE" ]]; then
    pass "founder_admin not in SELF_REGISTERABLE_ROLES"
  elif [[ "$reg_roles" == "UNSAFE" ]]; then
    fail "founder_admin is in SELF_REGISTERABLE_ROLES — critical security bug" STOP
  else
    yellow "Could not parse SELF_REGISTERABLE_ROLES — verify manually in server/routes/auth.schemas.mjs"
  fi
  stop_if_needed

  # brand_operator must not be self-registerable
  local bp_check
  bp_check=$(grep -A 20 "SELF_REGISTERABLE_ROLES" server/routes/auth.schemas.mjs | grep "BRAND_OPERATOR" || true)
  if [[ -z "$bp_check" ]]; then
    pass "brand_operator not in SELF_REGISTERABLE_ROLES"
  else
    fail "brand_operator appears in SELF_REGISTERABLE_ROLES — verify intent" STOP
  fi
  stop_if_needed
}

# ── Tier 4: Live smoke ─────────────────────────────────────────────────────────
tier4() {
  header "Tier 4 — Live smoke"

  # If Playwright is available, run the smoke suite
  if require_cmd npx && [[ -f playwright.config.ts ]]; then
    yellow "Running Playwright smoke suite (chromium only)..."
    if npx playwright test --project=chromium e2e/smoke.spec.ts --reporter=line 2>&1; then
      pass "Playwright smoke tests passed"
    else
      fail "Playwright smoke tests failed — RouteErrorBoundary or render crash possible" STOP
    fi
    stop_if_needed
  else
    yellow "No Playwright config found — skip automated smoke; run manual click-through:"
    echo "  • Brand Operator → /orders, /inventory, /map"
    echo "  • Sales Rep → /, /sales/accounts, create draft order"
    echo "  • Manufacturer → /manufacturer"
    echo "  • Retail → /retail/orders, /retail/account (no settings link)"
  fi

  # Check logs for RouteErrorBoundary hits
  if require_cmd fly; then
    local rbe_hits
    rbe_hits=$(fly logs -a "$FLY_APP" --since 24h 2>/dev/null \
      | grep -ic "RouteErrorBoundary\|render crash\|ChunkLoadError" || true)
    if [[ "$rbe_hits" -eq 0 ]]; then
      pass "No RouteErrorBoundary hits in prod logs (last 24h)"
    else
      fail "Found $rbe_hits RouteErrorBoundary/crash hit(s) — a user saw an error page" STOP
    fi
    stop_if_needed
  fi
}

# ── Weekly add-ons ─────────────────────────────────────────────────────────────
weekly() {
  header "Weekly add-ons"

  yellow "npm outdated (frontend):"
  npm outdated || true

  if [[ -d server ]]; then
    yellow "npm outdated (server):"
    cd server && npm outdated || true; cd ..
  fi

  if require_cmd npx && [[ -f playwright.config.ts ]]; then
    yellow "Full Playwright run (all suites)..."
    if npx playwright test --reporter=line 2>&1; then
      pass "All Playwright suites passed"
    else
      fail "Some Playwright suites failed"
    fi
  fi

  if require_cmd fly; then
    yellow "Fly volume usage:"
    fly volumes list -a "$FLY_APP" 2>/dev/null || true
  fi

  echo
  yellow "Known open gaps to review priority:"
  echo "  1. Depletion reporting completeness"
  echo "  2. Sales rep inventory visibility widget"
  echo "  3. Production PO inventory gate"
}

# ── Runner ─────────────────────────────────────────────────────────────────────
case "$RUN_TIER" in
  1|tier1) tier1 ;;
  2|tier2) tier2 ;;
  3|tier3) tier3 ;;
  4|tier4) tier4 ;;
  all)
    tier1
    tier2
    tier3
    tier4
    $WEEKLY && weekly
    ;;
  *)
    echo "Usage: $0 [--tier 1|2|3|4] [--weekly]"
    exit 1
    ;;
esac

summary

if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
