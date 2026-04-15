# Multi-Node Inventory Refactor — Scope Document

## Problem Statement

Currently all 5 roles read/write the same `AppData.inventory` array. The `locationType` field exists but is decorative — **stock doesn't actually move** when transfer orders change status. Everyone sees the same pool, which breaks supply chain realism.

## Target Architecture

```
┌─────────────────────┐
│   MANUFACTURER      │  ← Kirin Brewery Co.
│  (in-production)    │     Only manufacturer sees this
└──────────┬──────────┘
           │ Production PO delivered
           ▼
┌─────────────────────┐
│ DISTRIBUTOR W/H     │  ← Toronto Main, Milan DC
│  (available stock)  │     Brand Op + Distributor + Sales Rep
└──────────┬──────────┘
           │ Transfer Order shipped
           ▼
┌─────────────────────┐
│    IN-TRANSIT       │  ← Temporary location during shipment
│  (allocated stock)  │     Source can't use it, destination can't see it yet
└──────────┬──────────┘
           │ Transfer Order delivered
           ▼
┌─────────────────────┐
│   RETAIL SHELF      │  ← The Drake, Eataly, etc.
│  (account stock)    │     Account holder + Distributor + Brand Op
└─────────────────────┘
```

## Data Model Changes

### 1. InventoryItem stays, but with stricter semantics

```typescript
type InventoryItem = {
  id: string;
  sku: string;
  batchLot: string;
  quantityBottles: number;
  
  // Location classification
  locationType: "manufacturer" | "distributor_warehouse" | "in_transit" | "retail_shelf";
  warehouse: string;  // physical location name
  
  // For in_transit: track the movement
  inTransitDetails?: {
    transferOrderId: string;
    fromWarehouse: string;
    toWarehouse: string;
    toAccountId?: string;
    shipDate: string;
    expectedDelivery: string;
  };
  
  // For retail_shelf: which account owns it
  retailAccountId?: string;
  
  status: "available" | "reserved" | "damaged";
};
```

### 2. Transfer Orders become stock movements

Current: TO just sits there, status changes don't affect inventory.

New behavior:

| TO Status | Inventory Action |
|-----------|------------------|
| `draft` | Nothing (planning) |
| `picked` | Reserve stock at source |
| `packed` | Still reserved at source |
| `shipped` | **Move** from source → `in_transit` |
| `delivered` | **Move** from `in_transit` → destination |
| `cancelled` | Release reservation or reverse movement |

### 3. Production Orders add inventory

When PO status → `delivered`:
- Create new `InventoryItem` at specified destination warehouse
- `locationType: "distributor_warehouse"`

## Role-Based Visibility

| Role | Can See Location Types | Can Create Transfer From |
|------|----------------------|--------------------------|
| `manufacturer` | `manufacturer` | — |
| `distributor` | `distributor_warehouse`, `in_transit` (their shipments), `retail_shelf` (their accounts) | `distributor_warehouse` → `retail_shelf` |
| `sales_rep` | `distributor_warehouse` (read-only), `retail_shelf` (their accounts) | — (read only) |
| `retail` | `retail_shelf` (their own) | — |
| `brand_operator` | ALL | ALL |
| `operations` | ALL | ALL |
| `founder_admin` | ALL | ALL |

## Implementation Phases

### Phase 1: Core Movement Engine (2-3 hours)

**Files to modify:**
1. `src/lib/inventory-movement.ts` — NEW
   - `moveInventory()` — atomic transfer between locations
   - `reserveInventory()` — soft-hold for picking
   - `releaseReservation()` — cancel/undo
   
2. `src/contexts/AppDataContext.tsx`
   - Update `useInventory()` hook with location-scoped queries
   - Add `moveInventory()` to hook return
   - Update `sumAvailableForSku()` to filter by location

3. `src/data/mockData.ts`
   - Update `InventoryItem` type with new fields
   - Update seed data with proper location assignments

### Phase 2: Transfer Order Integration (2 hours)

**Files to modify:**
1. `src/pages/PurchaseOrders.tsx`
   - On TO status change to `shipped`: call `moveInventory()`
   - On TO status change to `delivered`: call `moveInventory()`
   - Handle cancellation/rollback

2. `src/components/TransferOrderDetailDialog.tsx`
   - Add inventory movement preview
   - Show stock levels at source before allowing ship

### Phase 3: Production Order Integration (1 hour)

**Files to modify:**
1. `src/pages/PurchaseOrders.tsx`
   - On PO status → `delivered`: create inventory at destination
   - Use existing `addForPo()` but with proper location

### Phase 4: Role-Based Filtering (1-2 hours)

**Files to modify:**
1. `src/contexts/AppDataContext.tsx`
   - Add `useInventoryForRole()` hook
   - Filter by user's role + location access

2. `src/components/NewTransferOrderDialog.tsx`
   - Filter available stock by role visibility
   - Only show warehouses user can transfer FROM

### Phase 5: UI Updates (1 hour)

1. Add location badges to inventory lists
2. Show "in transit" as a separate section
3. Add stock location breakdown by SKU

## Migration Strategy

Current seed data needs to be audited:

```bash
# Check current locationType assignments
# All should be explicitly set, none undefined
```

Migration is backward-compatible:
- Existing `locationType: undefined` items default to `distributor_warehouse`
- Existing transfers without movement get retroactive movement on next status change

## Testing Checklist

- [ ] Create TO → ship → verify stock moved to `in_transit`
- [ ] Deliver TO → verify stock moved to destination
- [ ] Cancel TO after ship → verify stock returned
- [ ] Deliver PO → verify stock created at destination
- [ ] Login as distributor → only see allowed locations
- [ ] Login as manufacturer → only see production inventory
- [ ] Login as sales rep → see distributor stock (read) + their accounts' shelves

## Estimates

| Phase | Time | Risk |
|-------|------|------|
| 1: Movement Engine | 2-3h | Low — pure logic |
| 2: TO Integration | 2h | Medium — status change hooks |
| 3: PO Integration | 1h | Low — already have `addForPo` |
| 4: Role Filtering | 1-2h | Low — query filters |
| 5: UI Polish | 1h | Low — display only |
| **Total** | **7-9h** | **Low-Medium** |

## Success Criteria

1. Transfer order shipped → source warehouse stock decreases, `in_transit` stock appears
2. Transfer order delivered → `in_transit` stock disappears, destination stock increases
3. Each role only sees inventory they should see
4. No regressions in existing PO/SO flows
5. TypeScript compilation clean

---

**Next Step:** Approve scope → begin Phase 1 implementation.
