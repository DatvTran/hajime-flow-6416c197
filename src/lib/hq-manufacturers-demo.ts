import type { Account, PurchaseOrder } from "@/data/mockData";
import type { HqManufacturerPartnerId } from "@/lib/hq-manufacturer-partners";

const CASE = 12;

function productionPo(partial: PurchaseOrder & { cases?: number }): PurchaseOrder {
  const { cases, quantity, ...rest } = partial;
  return {
    poType: "production",
    paymentStatus: "pending",
    ...rest,
    quantity: quantity ?? (cases ?? 0) * CASE,
  };
}

/** Production requests aligned with hq-operator-app.html MFR_DETAIL. */
export const HQ_MANUFACTURER_DEMO_PURCHASE_ORDERS: PurchaseOrder[] = [
  // Kosapan
  productionPo({
    id: "PR-2026-0145",
    manufacturer: "Kosapan Distillery",
    manufacturerId: "kosapan",
    sku: "HJM-OG-750",
    quantity: 360 * CASE,
    status: "in-production",
    issueDate: "2026-05-30",
    requiredDate: "2026-06-20",
    region: "Tokyo HQ",
  }),
  productionPo({
    id: "PR-2026-0144",
    manufacturer: "Kosapan Distillery",
    manufacturerId: "kosapan",
    sku: "HJM-YZ-750",
    quantity: 240 * CASE,
    status: "approved",
    issueDate: "2026-05-28",
    requiredDate: "2026-06-15",
    region: "NYC",
  }),
  productionPo({
    id: "PR-2026-0139",
    manufacturer: "Kosapan Distillery",
    manufacturerId: "kosapan",
    sku: "Kosapan Reserve 720ml",
    quantity: 120 * CASE,
    status: "draft",
    issueDate: "2026-05-26",
    requiredDate: "2026-07-01",
    region: "Chicago",
  }),
  // Kuramoto
  productionPo({
    id: "PR-2026-0142",
    manufacturer: "Kuramoto Brewing",
    manufacturerId: "kuramoto",
    sku: "HJM-FP-750",
    quantity: 400 * CASE,
    status: "draft",
    issueDate: "2026-05-28",
    requiredDate: "2026-06-25",
    region: "Chicago",
  }),
  productionPo({
    id: "PR-2026-0141",
    manufacturer: "Kuramoto Brewing",
    manufacturerId: "kuramoto",
    sku: "HJM-RY-500",
    quantity: 120 * CASE,
    status: "draft",
    issueDate: "2026-05-26",
    requiredDate: "2026-06-18",
    region: "NYC",
  }),
  productionPo({
    id: "PR-2026-0138",
    manufacturer: "Kuramoto Brewing",
    manufacturerId: "kuramoto",
    sku: "HJM-JN-720",
    quantity: 300 * CASE,
    status: "delivered",
    issueDate: "2026-05-02",
    requiredDate: "2026-05-28",
    region: "Tokyo",
  }),
  productionPo({
    id: "PR-2026-0135",
    manufacturer: "Kuramoto Brewing",
    manufacturerId: "kuramoto",
    sku: "HJM-FP-750",
    quantity: 220 * CASE,
    status: "in-production",
    issueDate: "2026-05-10",
    requiredDate: "2026-06-12",
    region: "Paris",
  }),
  // Echigo
  productionPo({
    id: "PR-2026-0140",
    manufacturer: "Echigo Kura",
    manufacturerId: "echigo",
    sku: "EU-FP-750",
    quantity: 200 * CASE,
    status: "in-production",
    issueDate: "2026-05-20",
    requiredDate: "2026-06-18",
    region: "Milan",
  }),
  productionPo({
    id: "PR-2026-0133",
    manufacturer: "Echigo Kura",
    manufacturerId: "echigo",
    sku: "Shirogane Nigori 720ml",
    quantity: 150 * CASE,
    status: "delivered",
    issueDate: "2026-04-28",
    requiredDate: "2026-05-22",
    region: "Paris",
  }),
];

export function mergeHqManufacturerAccountsForDisplay(accounts: Account[]): Account[] {
  return accounts;
}

export function mergeHqManufacturerPurchaseOrdersForDisplay(
  purchaseOrders: PurchaseOrder[],
): PurchaseOrder[] {
  return purchaseOrders;
}

export function demoManufacturerIdForName(name: string): HqManufacturerPartnerId | undefined {
  const n = name.toLowerCase();
  if (n.includes("kosapan")) return "kosapan";
  if (n.includes("kuramoto")) return "kuramoto";
  if (n.includes("echigo")) return "echigo";
  return undefined;
}
