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


## Operational Runbook: Persistence Verification After Entity Mutation

Use this runbook after any product/account/inventory/order/shipment create or update to verify persistence in the expected environment.

### Preconditions
- Confirm target tenant identifier (`tenant_id`) and environment (`stage`) before making any mutation.
- Ensure API instance is running the intended config/env values.

### Procedure
1. **Create or update a test entity**
   - Execute a controlled create/update in the application (or API client) for one of the scoped entities.
   - Capture the entity key (`id`/reference), `tenant_id`, and timestamp of the mutation.

2. **Restart API service**
   - Restart the API process/deployment so in-memory/cache-only state is removed.
   - Wait until startup completes and health endpoint is available.

3. **Verify API health pass criteria**
   - Call `GET /api/health`.
   - Pass criteria:
     - `stage` equals the expected deployment stage (for example: `dev`, `staging`, or `prod`).
     - `db.connected` is `true`.
   - If either value does not match, treat as **failed verification** and apply rollback criteria below.

4. **Re-read the same entity**
   - Fetch the exact entity after restart using the normal read API.
   - Confirm the returned record still contains the expected mutation values for the same `tenant_id`.

5. **Run SQL persistence probes (tenant-scoped)**
   - Run the following SQL checks with the same `tenant_id` used in step 1:

```sql
-- products
SELECT id, tenant_id, name, updated_at
FROM products
WHERE tenant_id = :tenant_id
ORDER BY updated_at DESC
LIMIT 20;

-- accounts
SELECT id, tenant_id, name, updated_at
FROM accounts
WHERE tenant_id = :tenant_id
ORDER BY updated_at DESC
LIMIT 20;

-- inventory
SELECT id, tenant_id, product_id, quantity_on_hand, updated_at
FROM inventory
WHERE tenant_id = :tenant_id
ORDER BY updated_at DESC
LIMIT 20;

-- sales_orders
SELECT id, tenant_id, account_id, status, updated_at
FROM sales_orders
WHERE tenant_id = :tenant_id
ORDER BY updated_at DESC
LIMIT 20;

-- shipments
SELECT id, tenant_id, sales_order_id, status, updated_at
FROM shipments
WHERE tenant_id = :tenant_id
ORDER BY updated_at DESC
LIMIT 20;
```

### Pass/Fail Decision
- **Pass**: `/api/health` values match expected stage and DB connectivity, post-restart entity re-read succeeds, and SQL probe rows reflect the same mutation for the same `tenant_id`.
- **Fail**: Any mismatch in health data, missing/incorrect mutated record, or cross-tenant inconsistency.

### Rollback Criteria (when persistence checks fail)
Immediately start rollback if any fail condition is detected:
1. **Disable traffic** to the affected API deployment (remove from load balancer / scale ingress route to zero / maintenance gate).
2. **Correct stage/environment configuration** (stage label, DB URL, tenant scoping variables, secrets).
3. **Re-run required migrations** for the target environment and verify schema/version alignment.
4. Re-run this full runbook (create/update -> restart -> health -> re-read -> SQL probes) before re-enabling traffic.
