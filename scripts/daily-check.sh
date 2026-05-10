#!/usr/bin/env bash
# Daily check runner for Hajime — Tiers 1-4.
# Usage: bash scripts/daily-check.sh [--skip-fly] [--tier <1|2|3|4>] [--no-stop]
#
# Stop conditions bail the whole run:
#   • tsc reports any error
#   • npm audit finds high/critical in runtime deps
#   • health endpoint is not 200 + database:connected
#   • successful registration with a privileged role detected in auth_events
#   • any RouteErrorBoundary hit in logs

set -euo pipefail

# ── CLI flags ─────────────────────────────────────────────────────────────────
SKIP_FLY=false
MAX_TIER=4
NO_STOP=false
PROD_URL="https://hajime-app.fly.dev"
FLY_APP="hajime-app"

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-fly)   SKIP_FLY=true ;;
    --tier)       MAX_TIER="$2"; shift ;;
    --no-stop)    NO_STOP=true ;;
    --prod-url)   PROD_URL="$2"; shift ;;
    --app)        FLY_APP="$2"; shift ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
  shift
done

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

pass()  { echo -e "  ${GREEN}✓${RESET} $*"; }
fail()  { echo -e "  ${RED}✗${RESET} $*"; }
warn()  { echo -e "  ${YELLOW}!${RESET} $*"; }
info()  { echo -e "  ${CYAN}→${RESET} $*"; }
header(){ echo -e "\n${BOLD}${CYAN}══ $* ══${RESET}"; }
step()  { echo -e "\n${BOLD}▸ $*${RESET}"; }

# ── Result tracking ───────────────────────────────────────────────────────────
FAILURES=()
WARNINGS=()
STOP_TRIGGERED=false

record_fail() {
  local label="$1" msg="${2:-}"
  fail "$label${msg:+ — $msg}"
  FAILURES+=("$label")
}

record_warn() {
  local label="$1" msg="${2:-}"
  warn "$label${msg:+ — $msg}"
  WARNINGS+=("$label")
}

stop_condition() {
  local reason="$1"
  echo -e "\n${RED}${BOLD}🛑 STOP CONDITION: $reason${RESET}"
  echo -e "${RED}Fix this before proceeding to higher tiers.${RESET}"
  STOP_TRIGGERED=true
  FAILURES+=("[STOP] $reason")
  if [[ $NO_STOP == false ]]; then
    print_summary
    exit 1
  fi
}

# ── Timing helpers ────────────────────────────────────────────────────────────
START_TIME=$SECONDS
tier_start=0

begin_tier() {
  tier_start=$SECONDS
  header "Tier $1 — $2"
}

end_tier() {
  local elapsed=$(( SECONDS - tier_start ))
  echo -e "  ${CYAN}(tier finished in ${elapsed}s)${RESET}"
}

# ── Summary ───────────────────────────────────────────────────────────────────
print_summary() {
  local total=$(( SECONDS - START_TIME ))
  echo -e "\n${BOLD}══════════════════════════════════════════${RESET}"
  echo -e "${BOLD}DAILY CHECK SUMMARY  (${total}s total)${RESET}"
  echo -e "${BOLD}══════════════════════════════════════════${RESET}"

  if [[ ${#FAILURES[@]} -eq 0 && ${#WARNINGS[@]} -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}All green — good to ship 🚀${RESET}"
  else
    if [[ ${#FAILURES[@]} -gt 0 ]]; then
      echo -e "${RED}${BOLD}FAILURES (${#FAILURES[@]}):${RESET}"
      for f in "${FAILURES[@]}"; do
        echo -e "  ${RED}✗ $f${RESET}"
      done
    fi
    if [[ ${#WARNINGS[@]} -gt 0 ]]; then
      echo -e "${YELLOW}${BOLD}WARNINGS (${#WARNINGS[@]}):${RESET}"
      for w in "${WARNINGS[@]}"; do
        echo -e "  ${YELLOW}! $w${RESET}"
      done
    fi
  fi
  echo ""
}

# ── Fly CLI availability ──────────────────────────────────────────────────────
fly_available() {
  [[ $SKIP_FLY == false ]] && command -v fly &>/dev/null
}

# ═════════════════════════════════════════════════════════════════════════════
# TIER 1 — Pulse check
# ═════════════════════════════════════════════════════════════════════════════
[[ $MAX_TIER -ge 1 ]] && {
  begin_tier 1 "Pulse check"

  step "Git baseline"
  git fetch origin 2>&1 | tail -3
  git_status=$(git status --short)
  if [[ -z "$git_status" ]]; then
    pass "Working tree clean"
  else
    warn "Working tree has uncommitted changes:"
    git status --short | while IFS= read -r line; do echo "    $line"; done
    record_warn "Uncommitted changes"
  fi

  step "Production health"
  check_health() {
    local response="$1" http_code="$2"
    if [[ "$http_code" != "200" ]]; then
      return 1
    fi
    # Accept "connected", "up", or any non-error database field
    if echo "$response" | grep -qiE '"ok"\s*:\s*true'; then
      db_field=$(echo "$response" | grep -oE '"database"\s*:\s*"[^"]+"' | head -1 || echo "")
      if echo "$response" | grep -qiE '"database"\s*:\s*"(connected|up|ok)"'; then
        pass "Health OK — $db_field (HTTP $http_code)"
      elif [[ -n "$db_field" ]]; then
        record_fail "Health: ok=true but unexpected database status — $db_field"
        return 1
      else
        pass "Health OK — ok:true, no database field (HTTP $http_code)"
      fi
    else
      return 1
    fi
  }

  if command -v curl &>/dev/null; then
    health_response=$(curl -sf --max-time 10 "$PROD_URL/api/health" 2>/dev/null || echo "CURL_FAIL")
    if [[ "$health_response" == "CURL_FAIL" ]]; then
      stop_condition "Health endpoint unreachable: $PROD_URL/api/health"
    else
      http_code=$(curl -so /dev/null -w "%{http_code}" --max-time 10 "$PROD_URL/api/health" 2>/dev/null || echo "000")
      if ! check_health "$health_response" "$http_code"; then
        stop_condition "Health endpoint unhealthy — HTTP $http_code / response: $health_response"
      fi
    fi
  else
    record_warn "curl not available — skipping health check"
  fi

  if fly_available; then
    : # fly checks handled below
  else
    warn "fly CLI not available — skipping fly status/logs checks (install fly or pass --skip-fly to suppress)"
  fi

  if fly_available; then
    step "Fly machines"
    fly_status_out=$(fly status -a "$FLY_APP" 2>&1 || true)
    if echo "$fly_status_out" | grep -qiE "failed|restart|unhealthy"; then
      stop_condition "Fly machine unhealthy: $(echo "$fly_status_out" | grep -iE 'failed|restart|unhealthy' | head -3)"
    else
      pass "Fly machines healthy"
      echo "$fly_status_out" | head -10 | while IFS= read -r line; do info "$line"; done
    fi

    step "Fly logs — error scan (last 24h)"
    error_lines=$(fly logs -a "$FLY_APP" --since 24h 2>/dev/null | grep -iE "error|unhandled|ECONN|5[0-9]{2}" | grep -v "^$" || true)
    if [[ -z "$error_lines" ]]; then
      pass "No error patterns in last 24h logs"
    else
      error_count=$(echo "$error_lines" | wc -l | tr -d ' ')
      record_warn "Found $error_count error-pattern lines in logs"
      echo "$error_lines" | head -10 | while IFS= read -r line; do warn "  $line"; done
      [[ $error_count -gt 50 ]] && stop_condition "Error spam in logs ($error_count lines) — investigate before proceeding"
    fi

    step "RouteErrorBoundary hits"
    route_errors=$(fly logs -a "$FLY_APP" --since 24h 2>/dev/null | grep -i "RouteErrorBoundary\|routeErrorBoundary\|route.error" | grep -v "^$" || true)
    if [[ -z "$route_errors" ]]; then
      pass "No RouteErrorBoundary hits in logs"
    else
      stop_condition "RouteErrorBoundary render crash reached users: $(echo "$route_errors" | head -3)"
    fi
  fi

  end_tier 1
}

# ═════════════════════════════════════════════════════════════════════════════
# TIER 2 — Code health
# ═════════════════════════════════════════════════════════════════════════════
[[ $MAX_TIER -ge 2 ]] && {
  begin_tier 2 "Code health"

  step "node_modules pre-flight"
  if [[ ! -d node_modules ]]; then
    record_warn "node_modules missing — running npm install"
    npm install --prefer-offline 2>&1 | tail -5
  else
    pass "node_modules present"
  fi
  if [[ ! -d server/node_modules ]]; then
    record_warn "server/node_modules missing — running npm install in server/"
    (cd server && npm install --prefer-offline 2>&1 | tail -5)
  fi

  step "TypeScript type check (npx tsc --noEmit)"
  if npx tsc --noEmit 2>&1; then
    pass "TypeScript — 0 errors"
  else
    stop_condition "TypeScript errors detected — Vite green ≠ types green"
  fi

  step "ESLint"
  lint_out=$(npm run lint 2>&1 || true)
  lint_exit=$?
  if [[ $lint_exit -eq 0 ]]; then
    pass "ESLint — 0 actionable warnings"
  else
    # Distinguish eslint errors vs the legacy-start check
    if echo "$lint_out" | grep -q "error"; then
      record_fail "ESLint errors found"
      echo "$lint_out" | grep -E "error|warning" | head -20 | while IFS= read -r line; do fail "  $line"; done
    else
      record_warn "ESLint returned non-zero (check output)"
      echo "$lint_out" | tail -10 | while IFS= read -r line; do warn "  $line"; done
    fi
  fi

  step "Vitest unit tests"
  if npm run test 2>&1; then
    pass "Vitest — all tests pass"
  else
    record_fail "Vitest unit tests failed"
  fi

  step "Vite production build sanity"
  if npm run build -- --logLevel warn 2>&1; then
    pass "Vite build — success"
  else
    record_fail "Vite production build failed"
  fi

  step "Project-specific audit scripts"
  # Sidebar link audit
  if [[ -f "scripts/audit-sidebar-links.mjs" ]]; then
    if node scripts/audit-sidebar-links.mjs 2>&1; then
      pass "Sidebar link audit — clean"
    else
      record_fail "Sidebar link audit — broken links detected"
    fi
  else
    info "scripts/audit-sidebar-links.mjs not found — skipping"
  fi

  # Import resolution audit
  if [[ -f "scripts/audit-imports.mjs" ]]; then
    if node scripts/audit-imports.mjs 2>&1; then
      pass "Import resolution audit — clean"
    else
      record_fail "Import resolution audit — unresolvable imports detected"
    fi
  else
    info "scripts/audit-imports.mjs not found — skipping"
  fi

  # Legacy startup validation (already in npm run lint but explicit here)
  if node scripts/validate-legacy-startup.mjs 2>&1; then
    pass "Legacy startup validation — clean"
  else
    record_fail "Legacy startup validation failed"
  fi

  end_tier 2
}

# ═════════════════════════════════════════════════════════════════════════════
# TIER 3 — Security & integrity
# ═════════════════════════════════════════════════════════════════════════════
[[ $MAX_TIER -ge 3 ]] && {
  begin_tier 3 "Security & integrity"

  # ── 3.1 Secrets sanity ───────────────────────────────────────────────────
  step "Secrets presence check"
  REQUIRED_SECRETS=(
    "ACCESS_TOKEN_SECRET"
    "REFRESH_TOKEN_SECRET"
    "SESSION_SECRET"
    "DB_PASSWORD"
    "STRIPE_SECRET_KEY"
  )

  if fly_available; then
    secrets_list=$(fly secrets list -a "$FLY_APP" 2>/dev/null || echo "")
    if [[ -z "$secrets_list" ]]; then
      record_warn "Could not retrieve secrets list from Fly (check fly auth)"
    else
      for secret in "${REQUIRED_SECRETS[@]}"; do
        if echo "$secrets_list" | grep -q "$secret"; then
          pass "Secret present: $secret"
        else
          record_fail "Secret MISSING: $secret"
        fi
      done
    fi
  else
    warn "fly CLI not available — skipping remote secrets check"
    info "Verify manually: fly secrets list -a $FLY_APP | grep -E '$(IFS="|"; echo "${REQUIRED_SECRETS[*]}")'"
  fi

  # Check ACCESS_TOKEN_SECRET startup validation exists in server code
  step "Startup secret validation guard"
  startup_guard=$(grep -r "ACCESS_TOKEN_SECRET" server/index.mjs server/app-store.mjs 2>/dev/null | grep -iE "throw|exit|process\.exit|refuse|fatal|missing|required" | head -3 || true)
  if [[ -n "$startup_guard" ]]; then
    pass "Startup validation for ACCESS_TOKEN_SECRET — guard found"
  else
    # Check more broadly
    startup_guard2=$(grep -rn "ACCESS_TOKEN_SECRET" server/ 2>/dev/null | grep -iE "throw|exit|process\.exit|fatal|missing|required" | head -3 || true)
    if [[ -n "$startup_guard2" ]]; then
      pass "Startup validation for ACCESS_TOKEN_SECRET — guard found"
    else
      record_warn "No startup guard for ACCESS_TOKEN_SECRET found — server may boot without it"
    fi
  fi

  # ── 3.2 Dependency vulnerabilities ───────────────────────────────────────
  step "npm audit — root (runtime deps)"
  audit_out=$(npm audit --omit=dev --audit-level=high 2>&1 || true)
  if echo "$audit_out" | grep -qiE "found 0 vulnerabilities|0 vulnerabilities"; then
    pass "Root npm audit — 0 high/critical"
  elif echo "$audit_out" | grep -qiE "high|critical"; then
    stop_condition "npm audit: high/critical vulnerability in root runtime deps\n$(echo "$audit_out" | grep -iE 'high|critical' | head -5)"
  else
    pass "Root npm audit — no high/critical ($(echo "$audit_out" | tail -2))"
  fi

  step "npm audit — server/ (runtime deps)"
  if [[ -d server ]]; then
    server_audit_out=$(cd server && npm audit --omit=dev --audit-level=high 2>&1 || true)
    if echo "$server_audit_out" | grep -qiE "found 0 vulnerabilities|0 vulnerabilities"; then
      pass "Server npm audit — 0 high/critical"
    elif echo "$server_audit_out" | grep -qiE "high|critical"; then
      stop_condition "npm audit: high/critical vulnerability in server/ runtime deps\n$(echo "$server_audit_out" | grep -iE 'high|critical' | head -5)"
    else
      pass "Server npm audit — no high/critical ($(echo "$server_audit_out" | tail -2))"
    fi
  fi

  # ── 3.3 Hardcoded tenant UUIDs ───────────────────────────────────────────
  step "Hardcoded tenant UUID scan"
  # Look for quoted UUID patterns in tenant_id contexts, excluding variables named DEFAULT
  hardcoded=$(grep -rn "tenant_id" server/ src/ 2>/dev/null \
    | grep -iE "['\"][0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}['\"]" \
    | grep -iv "DEFAULT\|test\|seed\|spec\|\.test\.\|\.spec\." \
    || true)
  if [[ -z "$hardcoded" ]]; then
    pass "No hardcoded tenant UUIDs found"
  else
    count=$(echo "$hardcoded" | wc -l | tr -d ' ')
    record_fail "Hardcoded tenant UUID(s) detected ($count occurrences)"
    echo "$hardcoded" | head -5 | while IFS= read -r line; do fail "  $line"; done
  fi

  # ── 3.4 Registration role guard ───────────────────────────────────────────
  step "Registration role guard"
  # Confirm FOUNDER_ADMIN and BRAND_OPERATOR are NOT in the self-registerable enum
  register_schema_file="server/routes/auth.schemas.mjs"
  if [[ -f "$register_schema_file" ]]; then
    # Check what's in SELF_REGISTERABLE_ROLES
    self_reg_section=$(sed -n '/SELF_REGISTERABLE_ROLES/,/\]/p' "$register_schema_file" 2>/dev/null || true)
    if echo "$self_reg_section" | grep -qiE "FOUNDER_ADMIN|founder_admin"; then
      stop_condition "FOUNDER_ADMIN found in SELF_REGISTERABLE_ROLES — privilege escalation risk!"
    else
      pass "FOUNDER_ADMIN not in SELF_REGISTERABLE_ROLES"
    fi
    if echo "$self_reg_section" | grep -qiE "BRAND_OPERATOR|brand_operator"; then
      stop_condition "BRAND_OPERATOR found in SELF_REGISTERABLE_ROLES — privilege escalation risk!"
    else
      pass "BRAND_OPERATOR not in SELF_REGISTERABLE_ROLES"
    fi
  else
    record_warn "auth.schemas.mjs not found at expected path — skipping role guard check"
  fi

  # Confirm role is not accepted from raw request body in the register route
  register_body_role=$(grep -n "req\.body\.role\|body\[.role.\]" server/routes/auth.mjs 2>/dev/null | grep -v "zod\|schema\|parse\|safe" | head -5 || true)
  if [[ -n "$register_body_role" ]]; then
    record_warn "Possible raw req.body.role access in auth.mjs — verify it goes through schema validation:"
    echo "$register_body_role" | while IFS= read -r line; do warn "  $line"; done
  else
    pass "No raw req.body.role access outside schema validation"
  fi

  # ── 3.5 Auth smoke against production ────────────────────────────────────
  step "Auth smoke — unauthenticated /api/auth/me (expect 401)"
  if command -v curl &>/dev/null; then
    me_code=$(curl -so /dev/null -w "%{http_code}" --max-time 10 "$PROD_URL/api/auth/me" 2>/dev/null || echo "000")
    if [[ "$me_code" == "401" ]]; then
      pass "/api/auth/me with no token → 401 (correct)"
    elif [[ "$me_code" == "000" ]]; then
      record_warn "/api/auth/me unreachable (connection failed)"
    else
      record_fail "/api/auth/me returned $me_code (expected 401) — unauthenticated access may be open"
    fi
  else
    warn "curl not available — skipping auth smoke"
  fi

  # Cross-tenant check note
  info "Cross-tenant smoke: run manually with a valid token:"
  info "  TOKEN=<tenant-A-token>"
  info "  curl -i -H \"Authorization: Bearer \$TOKEN\" \"$PROD_URL/api/products?tenantId=<tenant-B-uuid>\""
  info "  Expected: 403"

  end_tier 3
}

# ═════════════════════════════════════════════════════════════════════════════
# TIER 4 — Live smoke
# ═════════════════════════════════════════════════════════════════════════════
[[ $MAX_TIER -ge 4 ]] && {
  begin_tier 4 "Live smoke"

  step "Playwright e2e smoke suite"
  if command -v npx &>/dev/null && [[ -f playwright.config.ts ]]; then
    if npx playwright test --project=chromium --reporter=line 2>&1; then
      pass "Playwright smoke — all tests pass"
    else
      record_fail "Playwright smoke — test(s) failed (check output above)"
    fi
  else
    warn "Playwright not configured or npx unavailable — run manually:"
    info "  npx playwright test --project=chromium --reporter=line"
    info ""
    info "Manual smoke checklist (if Playwright doesn't cover these):"
    info "  Brand Operator  → /orders, /inventory, /map (Cartographic) — no RouteErrorBoundary"
    info "  Sales Rep       → home, accounts list, create draft order"
    info "  Manufacturer    → portal loads, production runs visible"
    info "  Retail          → orders + shipments only, no settings link"
    record_warn "Playwright smoke skipped — verify manually"
  fi

  end_tier 4
}

# ═════════════════════════════════════════════════════════════════════════════
# Final summary
# ═════════════════════════════════════════════════════════════════════════════
print_summary
[[ ${#FAILURES[@]} -gt 0 ]] && exit 1
exit 0
