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

## Post-Deploy Validation Runbook (DB Migration Stage 3+)

Use this checklist immediately after deploys that touch API persistence, migration flags, or database connectivity.

### 1) Health gate: confirm migration stage
- Call API health endpoint:
  - `curl -sS "$API_BASE_URL/api/health" | jq`
- Confirm reported migration stage is **3 or higher** before running write tests.
- Expected indicators:
  - `FEATURE_FLAG_DB_MIGRATION_STAGE >= 3`
  - DB-backed subsystem checks are green/ok.

### 2) Write through app APIs (sample records)
- Create (or update) sample tenant-scoped records through app APIs for:
  - products
  - accounts
  - sales orders
  - inventory
  - shipments
- Use a dedicated test tenant and deterministic IDs/refs (for easy lookup).
- Capture request/response payloads and status codes in deploy notes.

### 3) Restart API process
- Restart the running API service/process using the environment-standard mechanism (systemd/PM2/container rollout).
- Verify process comes back healthy (`/api/health` still stage 3+).

### 4) Re-read records to verify persistence after restart
- Re-fetch each previously created/updated record via app APIs.
- Validate:
  - records still exist;
  - key fields are unchanged;
  - tenant scoping is correct;
  - no fallback-to-local behavior is masking server failures.

### 5) Pass criteria
- All sample writes succeed before restart.
- All sample records remain readable and unchanged after restart.
- Health endpoint remains at stage 3+ throughout.

## SQL Verification Snippets (Tenant Scoped)

> Replace `:tenant_id` with the tenant used in your post-deploy API checks.

```sql
-- products
SELECT id, tenant_id, sku, name, updated_at
FROM products
WHERE tenant_id = :tenant_id
ORDER BY updated_at DESC
LIMIT 50;

-- accounts
SELECT id, tenant_id, account_code, name, updated_at
FROM accounts
WHERE tenant_id = :tenant_id
ORDER BY updated_at DESC
LIMIT 50;

-- sales_orders
SELECT id, tenant_id, order_number, status, updated_at
FROM sales_orders
WHERE tenant_id = :tenant_id
ORDER BY updated_at DESC
LIMIT 50;

-- inventory
SELECT id, tenant_id, product_id, quantity_on_hand, updated_at
FROM inventory
WHERE tenant_id = :tenant_id
ORDER BY updated_at DESC
LIMIT 50;

-- shipments
SELECT id, tenant_id, shipment_number, status, updated_at
FROM shipments
WHERE tenant_id = :tenant_id
ORDER BY updated_at DESC
LIMIT 50;
```

## Failure Triage (Symptoms → Likely Causes)

| Symptom | Likely Cause | What to Check First |
|---|---|---|
| `/api/health` shows stage `< 3` | `FEATURE_FLAG_DB_MIGRATION_STAGE` not set or misconfigured in runtime env | Compare deploy env var values vs expected; confirm process picked up latest env on restart |
| Writes fail across endpoints with DB/connectivity errors | DB connection env incorrect (`DATABASE_URL`, host, creds, SSL mode, network policy) | Verify effective DB env in running process and test direct DB reachability from API runtime |
| Writes appear successful, but data missing after API restart | Legacy/local-only script or non-DB path still in use for mutations | Confirm endpoints invoke DB-backed repositories/services, not legacy scripts or local state fallbacks |
| Some entities persist, others do not | Partial migration path (mixed handlers), stale feature flag routing | Validate per-endpoint code path and feature-flag branch selection |
| SQL results empty for expected data | Wrong `tenant_id` used in verification or tenant propagation bug | Cross-check tenant in auth context, API payloads, and DB query filter |

### Triage escalation notes
- Always capture: health payload, failing request IDs, tenant_id, and API logs around restart window.
- If issue is stage/env related, fix env + redeploy before re-running sample writes.
- If issue is legacy-script usage, disable old path and re-run full post-deploy checklist.
