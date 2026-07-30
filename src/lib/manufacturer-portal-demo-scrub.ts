import type { PurchaseOrder, Shipment, ProductionStatus } from "@/data/mockData";
import type { AppData } from "@/types/app-data";
import type { FinishedGoodsRow } from "@/lib/manufacturer-finished-goods";

/** Known seed-only SKUs from the old Kirin demo finished-goods list. */
const DEMO_FG_SKUS = new Set(["HJM-FP-750", "HJM-JN-720", "HJM-RY-500", "EU-FP-750"]);

/** Exact seed PO ids from `seed-app.json` — do not match live `PO-2025-*` / `PO-2026-*` HQ creates. */
const SEED_PO_IDS = new Set(["PO-2025-001", "PO-2025-002", "PO-2025-003", "PO-2024-047"]);

const SEED_SHIPMENT_IDS = new Set(["KH-9921", "KH-9918", "KH-9904", "SH-1001", "SH-1002", "SH-1003"]);

function isDemoPurchaseOrder(po: PurchaseOrder): boolean {
  if (SEED_PO_IDS.has(po.id)) return true;
  // Legacy Kirin seed rows only — never wipe real HQ partners (Kosapan, Kuramoto, Echigo).
  return /kirin/i.test(po.manufacturer ?? "");
}

function isDemoShipment(s: Shipment): boolean {
  const id = (s.waybillNumber ?? s.id ?? "").toUpperCase();
  if (SEED_SHIPMENT_IDS.has(id) || /^KH-99\d{2}$/i.test(id)) return true;
  const origin = (s.origin ?? "").toLowerCase();
  return origin.includes("kirin facility") || origin === "kirin facility";
}

function isDemoFinishedGoods(row: FinishedGoodsRow): boolean {
  return DEMO_FG_SKUS.has(row.sku) || /florin peaks|junmai shiro|ryusui reserve|first press/i.test(row.name);
}

/**
 * Manufacturer portal used to hydrate with Kirin/sake seed rows when the API was empty.
 * Strip those leftovers only — keep real HQ-issued production requests for any partner.
 */
export function scrubManufacturerPortalDemoData(data: AppData): AppData {
  const purchaseOrders = (data.purchaseOrders ?? []).filter((po) => !isDemoPurchaseOrder(po));
  const keptPoIds = new Set(purchaseOrders.map((po) => po.id));
  const productionStatuses = (data.productionStatuses ?? []).filter(
    (s: ProductionStatus) => keptPoIds.has(s.poId) && !SEED_PO_IDS.has(s.poId),
  );
  const shipments = (data.shipments ?? []).filter((s) => !isDemoShipment(s));
  const manufacturerFinishedGoods = (data.manufacturerFinishedGoods ?? []).filter(
    (row) => !isDemoFinishedGoods(row),
  );

  return {
    ...data,
    purchaseOrders,
    productionStatuses,
    shipments,
    manufacturerFinishedGoods,
  };
}
