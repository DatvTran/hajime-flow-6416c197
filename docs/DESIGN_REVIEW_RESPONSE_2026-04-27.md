# Design Review Response — Hajime role journeys deck (April 27, 2026)

## Context
This response addresses Dat’s April 2026 design review notes and translates them into an implementation-ready track for UX + engineering.

## Executive response
We agree with the direction and priority order. The deck is strong conceptually; the main gap is production-level completeness (detail states, settings/alerts, conflict handling, and design-system rules around accents/chrome density).

## What we can confirm from current codebase
Several “missing module” items already have route shells/pages in the app and should be treated as **design depth gaps**, not net-new routing:
- Alerts hub: `src/pages/AlertsHubPage.tsx`
- Reports: `src/pages/Reports.tsx`
- Global markets: `src/pages/GlobalMarketsPage.tsx`, `src/pages/MarketsPage.tsx`
- Account surfaces: `src/pages/Accounts.tsx`, dialogs in `src/components/AccountDetailDialog.tsx`
- Settings: `src/pages/Settings.tsx`
- Manufacturer profile/surfaces: `src/pages/ManufacturerProfilePage.tsx`, `src/pages/Manufacturer.tsx`
- Distributor surfaces: `src/pages/DistributorHomePage.tsx`, `src/pages/DistributorInventoryAdjustmentsPage.tsx`, `src/pages/DistributorSellThroughPage.tsx`

So the immediate work is not “add routes,” it is “upgrade these surfaces to implementation-quality specs and state coverage.”

## Decisions requested by Dat (to lock this sprint)

### 1) Design system addendum (required before more screen production)
Add one-page addendum covering:
1. Accent policy: single accent vs role accents
2. Role color semantics (if adopted): token names + hex + allowed usage
3. Chrome density rationale by role (HQ dense, retail minimal, rep mobile)

**Deliverable**: update design-system docs + token references used by handoff deck.

### 2) State-completeness baseline for every shipped surface
For each role screen, add designs for:
- loading/skeleton
- empty-first-use
- error/blocking
- destructive confirmation
- success feedback

**Deliverable**: “state strips” appended to each key screen in the deck.

### 3) Missing critical flows to design before dev lock
- PO create/edit flow
- onboarding/login role picker
- offline conflict resolution
- voice-note lifecycle (record/edit/retry/delete)
- dispute/override flow for allocation conflicts

**Deliverable**: end-to-end interaction specs with edge states.

## Engineering translation (build-ready package)
To make this design executable in one pass, the UX handoff package should include:
1. Component mapping (shadcn primitive vs custom component)
2. Token mapping (which CSS vars/tokens are consumed)
3. Interaction rules (especially drag/drop + publish side-effects)
4. Accessibility checklist (focus order, icon-button labels, keyboard paths)
5. Copy taxonomy (titles/statuses/errors/tooltips) for localization readiness

## Proposed sprint plan (aligned to review priority)
1. Design-system addendum (accent/chrome/color semantics)
2. Brand Operator: Alerts hub + Settings completeness pass
3. Distributor: Inbound + Reports completeness pass
4. Cross-role detail pages (account, order, PO)
5. Universal state-completeness overlays
6. Component/spec annotation pack for implementation

## Ownership and cadence
- UX: screen/state/spec production + addendum
- Eng: feasibility flags + component map validation
- Product: decision owner for accent/chrome policy + scope cutlines

Weekly checkpoint recommended: 30 min design-engineering review with one “ready for build” gate per module.

## PR workflow note (Codex constraint)
If a PR branch is updated outside Codex, Codex may not be able to continue updating that same PR thread.
In that case, create a **new PR** from the latest branch head and continue review there to avoid tool-state conflicts.
