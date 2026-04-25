# App Journey & Database Storage Review (April 24, 2026)

## Scope
- Frontend journey and data flow across auth, data loading, and key mutation pages.
- API/storage consistency between browser local state and backend persistence.

## Key Findings

### 1) Mutation auth token mismatch can silently break writes
- Read APIs use `hajime_access_token` in `src/lib/api-v1.ts`.
- Mutation APIs were reading `token` in `src/lib/api-v1-mutations.ts`.
- Result: users can appear logged in but create/update calls fail with auth errors depending on which key exists.

### 2) Mutation client ignores `VITE_API_URL`
- Granular read client prefixes requests with `VITE_API_URL`.
- Mutation client previously used relative paths only.
- Result: in split-origin deploys, reads and writes can target different hosts.

### 3) App boot process favors local browser copy over server truth
- `AppDataProvider` loads local data first and merges server data with local-precedence semantics.
- This protects in-browser edits but can surface stale data and cross-device inconsistencies.

### 4) Journey friction remains in pages that update local-only state
- Several operational workflows still call `updateData(...)` without guaranteed API writes.
- Users can complete forms and believe changes are global when they are only browser-local.

## Improvements Implemented in This Changeset

### A) Standardized mutation auth token lookup
- Added `getAuthToken()` to mutations client with this order:
  1. `hajime_access_token`
  2. fallback `token` (legacy compatibility)

### B) Standardized API base URL for mutations
- Added `API_URL` support to mutation fetches (`fetch(${API_URL}${url}, ...)`).
- Reads and writes now follow the same origin configuration model.

## Recommended Journey Improvements (Next)

1. **Add persistence status in UI**
   - Show explicit save state on forms/pages: `Saved to server`, `Saved locally`, `Sync failed`.
   - Place near action buttons and in global header toast channel.

2. **Add conflict policy for local-vs-server merge**
   - Include `updated_at` on mutable entities.
   - Prefer newest record per entity, not blanket local precedence.
   - Capture conflict log for manual review in Settings.

3. **Convert high-impact local-only flows first**
   - Prioritize: order status changes, visit notes, support tickets, and settings-like operational config.
   - Remove silent local fallback where business impact is high.

4. **Define “draft vs committed” UX language**
   - Draft = local/temporary.
   - Committed = server persisted and visible to team.
   - Use explicit badges/chips so users trust the system state.

## Recommended Database/Storage Improvements (Next)

1. **Introduce an append-only event log for critical ops**
   - Tables/events: order status changes, inventory adjustments, shipment milestones, payment transitions.
   - Keep denormalized read models for UI speed.

2. **Add idempotency keys for create/update endpoints**
   - Prevent duplicate writes from retries/network flaps.

3. **Normalize operational config and team membership**
   - Create first-class tables instead of storing operational settings in generic app blobs.
   - Add role-based access controls at API route and query layer.

4. **Add data lifecycle controls**
   - Soft delete + audit columns (`created_at`, `updated_at`, `deleted_at`, `created_by`, `updated_by`).
   - Archive strategy for historical shipments/orders.

5. **Observability for persistence quality**
   - Emit metrics: write success rate, API latency, merge conflicts, local-only session count.
   - Add alerting for elevated local-only fallback usage.

## Suggested Delivery Sequence
1. Hardening (token + base URL parity) ✅
2. Save-status UX and explicit local/server badges
3. High-impact mutation endpoint wiring
4. Conflict-safe merge strategy using timestamps/versioning
5. Schema additions (operational settings, support tickets, tasks/opportunities)

