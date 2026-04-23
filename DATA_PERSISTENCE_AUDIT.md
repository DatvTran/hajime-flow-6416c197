# Data Persistence Audit — Hajime App

## Executive Summary

**7 pages write user data to localStorage only** (browser-only, invisible to other users/devices).  
**2 pages properly call backend APIs.**  
**21 pages have UI but no write logic at all.**

The backend already has most of the required REST endpoints — the frontend just doesn't call them.

---

## 🔴 CRITICAL — Pages Writing to localStorage Only

These pages collect user input but never hit the API. Data dies with the browser tab.

### 1. SalesRepHomePage.tsx
| Form | Current Behavior | Should Call |
|------|-----------------|-------------|
| **Add visit note** (account dropdown + textarea) | `updateData()` → localStorage | `POST /api/v1/visit-notes` |
| **Legacy visit migration** | Copies old localStorage → app state | Remove after migration period |

**Code to fix:**
```tsx
// CURRENT (lines ~345):
const addVisit = () => {
  const row: VisitNoteEntry = { id: `v-${Date.now()}`, ... };
  updateData((d) => ({ ...d, visitNotes: [row, ...d.visitNotes ?? []] }));
  // ❌ Never calls API
};

// SHOULD BE:
import { createVisitNote } from "@/lib/api-v1-mutations";
const addVisit = async () => {
  const account = myAccounts.find(a => a.tradingName === visitAccount);
  await createVisitNote({
    account_id: account?.id,
    note: visitBody,
    visit_date: new Date().toISOString(),
  });
  // Then refresh from API or optimistically update
};
```

---

### 2. SalesVisitNotesPage.tsx
| Form | Current Behavior | Should Call |
|------|-----------------|-------------|
| **Visit note form** (account select + date + type + note) | `updateData()` → localStorage | `POST /api/v1/visit-notes` |

**Code to fix (lines ~120-145):**
```tsx
// CURRENT:
const handleSubmit = (e) => {
  const newNote = { id: `v-${Date.now()}`, ... };
  updateData(d => ({ ...d, visitNotes: [newNote, ...(d.visitNotes || [])] }));
  // ❌ Never calls API
};

// SHOULD BE:
const handleSubmit = async (e) => {
  const account = repAccounts.find(a => a.id === selectedAccount);
  await createVisitNote({
    account_id: selectedAccount,
    note: `[${visitType.toUpperCase()}] ${noteText.trim()}`,
    visit_date: `${visitDate}T${new Date().toTimeString().slice(0, 5)}`,
  });
  // Refresh list from API
  const refreshed = await getVisitNotes({ sales_rep: repName });
  updateData(d => ({ ...d, visitNotes: refreshed.data }));
};
```

---

### 3. SalesSectionPage.tsx
| Form | Current Behavior | Should Call |
|------|-----------------|-------------|
| **Task/opportunity form** | `updateData()` → localStorage | Needs custom endpoint |

This page stores "tasks" and "opportunities" in app state but there's no matching API table. Needs a new backend table + endpoints.

**Gap:** No `tasks` or `opportunities` table in migrations. No API endpoints.

---

### 4. Orders.tsx
| Form | Current Behavior | Should Call |
|------|-----------------|-------------|
| **Order status updates** | `updateData()` → localStorage | `PATCH /api/v1/orders/:id/status` |
| **Shipment linking** | `updateData()` → localStorage | `POST /api/v1/shipments` + link |
| **Billing updates** | `updateData()` → localStorage | `PUT /api/v1/orders/:id` |

**Code to find:** Search for `updateData` in Orders.tsx — it's used for inline status changes and shipment creation.

---

### 5. Settings.tsx
| Form | Current Behavior | Should Call |
|------|-----------------|-------------|
| **Team member add** | `updateData()` → localStorage | Needs custom endpoint |
| **Team member remove** | `updateData()` → localStorage | Needs custom endpoint |
| **Operational settings** (lead time, safety stock, shelf threshold) | `updateData()` → localStorage | Needs custom endpoint |
| **Product add/edit/delete** | ✅ Already uses `useProducts()` API | ✅ Already wired |

**Gap:** `teamMembers` and `operationalSettings` exist only in `AppData` / localStorage. No database tables, no API endpoints.

**New backend needed:**
```
POST /api/v1/team-members
DELETE /api/v1/team-members/:id
PUT /api/v1/operational-settings
```

---

### 6. RetailSupportPage.tsx
| Form | Current Behavior | Should Call |
|------|-----------------|-------------|
| **Support ticket create** | `updateData()` → localStorage | Needs custom endpoint |
| **Support ticket reply** | `updateData()` → localStorage | Needs custom endpoint |

**Gap:** No `support_tickets` table in migrations. No API endpoints.

---

### 7. ManufacturerProfilePage.tsx
| Form | Current Behavior | Should Call |
|------|-----------------|-------------|
| **Profile edit form** (27 inputs) | `updateData()` → localStorage | Needs custom endpoint |

**Gap:** No `manufacturer_profiles` table. No API endpoints.

---

## 🟡 Pages With UI but No Write Logic

These have form inputs but the handlers just show toasts like "Coming soon" or don't exist.

| Page | What UI Shows | What Happens on Submit |
|------|--------------|----------------------|
| **BackordersPage.tsx** | Inventory adjustment form | Nothing wired |
| **Dashboard.tsx** | Quick action buttons | Navigate only, no writes |
| **DistributorDepletionsPage.tsx** | Depletion report form | Read-only display |
| **DistributorInventoryAdjustmentsPage.tsx** | Adjustment form | Read-only display |
| **DistributorSellThroughPage.tsx** | Sell-through data | Read-only display |
| **FinancePaymentsPage.tsx** | Payment status UI | Read-only display |
| **IncentiveManagerPage.tsx** | Incentive list | Read-only display |
| **Inventory.tsx** | Inventory table | Filter/search only |
| **Manufacturer.tsx** | Production updates | Uses `updateData` (localStorage) |
| **ManufacturerProductRequestsPage.tsx** | Product request form | Read-only display |
| **ProductDevelopmentPage.tsx** | Product ideas | Read-only display |
| **PurchaseOrders.tsx** | PO list | Read-only display |
| **Reports.tsx** | Report filters | Read-only display |
| **RetailAccountPage.tsx** | Account settings | Read-only display |
| **RetailMyOrdersPage.tsx** | Order history | Read-only display |
| **RetailNewOrderPage.tsx** | Order form | Not wired to API |
| **SalesOpportunitiesPage.tsx** | Opportunity list | Read-only display |
| **SalesTargetsPage.tsx** | Target display | Read-only display |
| **Shipments.tsx** | Shipment tracker | Read-only display |

---

## ✅ Already Properly Wired

| Page | API Endpoints Used |
|------|-------------------|
| **Accounts.tsx** | `POST /api/v1/accounts`, `PUT /api/v1/accounts/:id`, `DELETE /api/v1/accounts/:id` |
| **NewWholesaleOrderPage.tsx** | `POST /api/v1/orders`, product/account lookups |
| **Settings.tsx** (products section) | `POST /api/v1/products`, `PUT /api/v1/products/:id`, `DELETE /api/v1/products/:id` |

---

## Backend API Inventory

### Endpoints that exist (can be used immediately):
| Endpoint | Purpose | Used By |
|----------|---------|---------|
| `POST /api/v1/visit-notes` | Create visit note | ❌ Nobody |
| `GET /api/v1/visit-notes` | List visit notes | ❌ Nobody |
| `POST /api/v1/orders` | Create order | ✅ NewWholesaleOrderPage |
| `PUT /api/v1/orders/:id` | Update order | ❌ Nobody |
| `PATCH /api/v1/orders/:id/status` | Update order status | ❌ Nobody |
| `POST /api/v1/accounts` | Create account | ✅ Accounts.tsx |
| `PUT /api/v1/accounts/:id` | Update account | ✅ Accounts.tsx |
| `POST /api/v1/shipments` | Create shipment | ❌ Nobody |
| `PUT /api/v1/shipments/:id` | Update shipment | ❌ Nobody |
| `POST /api/v1/depletion-reports` | Create depletion report | ❌ Nobody |
| `POST /api/v1/purchase-orders` | Create PO | ❌ Nobody |
| `POST /api/v1/incentives` | Create incentive | ❌ Nobody |

### Missing endpoints (need new backend work):
| Endpoint | Needed By |
|----------|-----------|
| `POST /api/v1/team-members` | Settings.tsx |
| `DELETE /api/v1/team-members/:id` | Settings.tsx |
| `PUT /api/v1/operational-settings` | Settings.tsx |
| `POST /api/v1/support-tickets` | RetailSupportPage.tsx |
| `POST /api/v1/support-tickets/:id/reply` | RetailSupportPage.tsx |
| `PUT /api/v1/manufacturer-profile` | ManufacturerProfilePage.tsx |
| `POST /api/v1/tasks` | SalesSectionPage.tsx |
| `POST /api/v1/opportunities` | SalesSectionPage.tsx |

---

## Recommended Priority Order

### Phase 1: Quick wins (wire existing APIs)
1. **SalesRepHomePage.tsx** — Wire visit notes to `POST /api/v1/visit-notes`
2. **SalesVisitNotesPage.tsx** — Wire visit notes to `POST /api/v1/visit-notes`
3. **Orders.tsx** — Wire status updates to `PATCH /api/v1/orders/:id/status`

### Phase 2: New backend tables needed
4. **Settings.tsx** — Create `team_members` table + `operational_settings` table
5. **RetailSupportPage.tsx** — Create `support_tickets` table
6. **ManufacturerProfilePage.tsx** — Create `manufacturer_profiles` table
7. **SalesSectionPage.tsx** — Create `tasks` + `opportunities` tables

---

## Files Referenced

- `/src/pages/SalesRepHomePage.tsx` (visit notes form)
- `/src/pages/SalesVisitNotesPage.tsx` (visit notes form)
- `/src/pages/SalesSectionPage.tsx` (tasks/opportunities)
- `/src/pages/Orders.tsx` (order actions)
- `/src/pages/Settings.tsx` (team, settings)
- `/src/pages/RetailSupportPage.tsx` (support tickets)
- `/src/pages/ManufacturerProfilePage.tsx` (profile edit)
- `/src/lib/api-v1-mutations.ts` (existing API client functions)
- `/server/routes/api-v1.mjs` (backend endpoints)
