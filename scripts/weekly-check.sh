#!/usr/bin/env bash
# =============================================================================
#  Hajime weekly checks — run once a week; too noisy for daily cadence.
#
#  Usage:
#    bash scripts/weekly-check.sh
#    npm run check:weekly
#
#  Environment overrides:
#    HAJIME_FLY_APP      fly.io app name   (default: hajime-app)
# =============================================================================
set -uo pipefail

APP_NAME="${HAJIME_FLY_APP:-hajime-app}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'

FAILS=0

pass()    { echo -e "  ${GREEN}✓${NC}  $*"; }
fail()    { echo -e "  ${RED}✗${NC}  $*"; (( FAILS++ )) || true; }
warn()    { echo -e "  ${YELLOW}!${NC}  $*"; }
info()    { echo -e "  ${DIM}→${NC}  $*"; }
hdr()     { echo -e "\n${BOLD}${BLUE}━━━ $* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }
step()    { echo -e "\n${BOLD}$*${NC}"; }
has_cmd() { command -v "$1" &>/dev/null; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}/.."

echo -e "${BOLD}${BLUE}Hajime weekly checks — $(date '+%Y-%m-%d')${NC}"

# =============================================================================
#  W1 — Dependency freshness
# =============================================================================
hdr "W1 — Dependency freshness"

step "W1a. npm outdated — root"
OUTDATED_ROOT=$(npm outdated 2>/dev/null || true)
if [[ -z "$OUTDATED_ROOT" ]]; then
  pass "All root packages current"
else
  warn "Outdated root packages (review minor/patch bumps):"
  echo "$OUTDATED_ROOT" | sed 's/^/       /'
fi

step "W1b. npm outdated — server/"
OUTDATED_SERVER=$(cd server && npm outdated 2>/dev/null || true)
if [[ -z "$OUTDATED_SERVER" ]]; then
  pass "All server/ packages current"
else
  warn "Outdated server/ packages (review minor/patch bumps):"
  echo "$OUTDATED_SERVER" | sed 's/^/       /'
fi

# =============================================================================
#  W2 — Full Playwright suite
# =============================================================================
hdr "W2 — Full Playwright suite (all 6 suites)"

step "W2. npx playwright test --project=chromium"
if [[ ! -f "playwright.config.ts" ]]; then
  warn "playwright.config.ts not found — skipping"
elif ! has_cmd npx; then
  warn "npx not found — skipping"
else
  if npx playwright test --project=chromium --reporter=line 2>&1; then
    pass "Playwright: all suites pass"
  else
    fail "Playwright: failures detected — see output above"
  fi
fi

# =============================================================================
#  W3 — Fly.io disk usage
# =============================================================================
hdr "W3 — Fly.io disk usage"

step "W3. fly volumes list"
if ! has_cmd fly; then
  warn "fly CLI not found — skipping volume check"
else
  FLY_VOLS=$(fly volumes list -a "$APP_NAME" 2>/dev/null || echo "")
  if [[ -z "$FLY_VOLS" ]]; then
    pass "No Fly.io volumes found (expected for managed-DB apps)"
  else
    echo "$FLY_VOLS" | sed 's/^/       /'
    warn "Review disk usage above — server/data should not be ballooning"
  fi
fi

# =============================================================================
#  W4 — Auth event anomalies (last 7 days)
# =============================================================================
hdr "W4 — Auth event review (last 7 days)"

step "W4. auth_events anomaly queries"
echo ""
echo "  Run these against the production DB (fly postgres connect or psql):"
echo ""
echo "  -- 1. Unexpected registrations"
echo "  SELECT created_at, metadata->>'role' AS role, ip_address"
echo "    FROM auth_events"
echo "   WHERE event_type = 'register'"
echo "     AND created_at > NOW() - INTERVAL '7 days'"
echo "   ORDER BY created_at DESC;"
echo ""
echo "  -- 2. permission_denied spikes"
echo "  SELECT DATE_TRUNC('hour', created_at) AS hour, COUNT(*) AS n"
echo "    FROM auth_events"
echo "   WHERE event_type = 'permission_denied'"
echo "     AND created_at > NOW() - INTERVAL '7 days'"
echo "   GROUP BY 1 ORDER BY 1 DESC LIMIT 24;"
echo ""
echo "  -- 3. Repeated account lockouts"
echo "  SELECT user_id, COUNT(*) AS lockouts"
echo "    FROM auth_events"
echo "   WHERE event_type = 'account_locked'"
echo "     AND created_at > NOW() - INTERVAL '7 days'"
echo "   GROUP BY 1 ORDER BY 2 DESC LIMIT 10;"
echo ""
info "Red flags: registration with founder_admin/brand_operator · >10 permission_denied/hour · repeated lockouts on same account"

# =============================================================================
#  W5 — Known gap review
# =============================================================================
hdr "W5 — Known gaps review"

echo ""
echo "  Check whether any of these gaps have changed priority:"
echo ""
echo "  1. Depletion reporting"
echo "     Sales reps create draft orders inventory-blind. The stock widget"
echo "     has not shipped yet. Expected: blocked until widget is live."
echo ""
echo "  2. Sales rep inventory visibility"
echo "     No read-only stock count on the draft-order screen."
echo "     Impact: reps may commit stock that doesn't exist."
echo ""
echo "  3. Production PO inventory gate"
echo "     Manufacturers can raise production orders without an inventory"
echo "     deduction check. Impact: double-allocation risk in parallel runs."
echo ""
warn "Update this list (and this script) as gaps are closed or reprioritized."

# =============================================================================
#  SUMMARY
# =============================================================================
echo ""
echo -e "${BOLD}${BLUE}━━━ WEEKLY SUMMARY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
if [[ $FAILS -eq 0 ]]; then
  echo -e "${GREEN}${BOLD}✓ All automated weekly checks passed.${NC}"
  echo -e "${DIM}  Remember to review W4 (auth_events) and W5 (gaps) manually.${NC}"
else
  echo -e "${YELLOW}${BOLD}! $FAILS automated check(s) need attention.${NC}"
  echo -e "${DIM}  Also review W4 (auth_events) and W5 (gaps) manually.${NC}"
fi
echo ""
[[ $FAILS -eq 0 ]]
