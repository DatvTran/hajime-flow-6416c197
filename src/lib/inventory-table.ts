import type { InventoryItem } from "@/data/mockData";

/** Demand region inferred from warehouse location (V1 heuristic). */
export function marketFromWarehouse(warehouse: string): string {
  const w = warehouse.toLowerCase();
  if (w.includes("toronto")) return "Toronto / Ontario";
  if (w.includes("milan")) return "Milan";
  if (w.includes("paris")) return "Paris";
  if (w.includes("production")) return "Production (mfg)";
  return "Regional pool";
}

export type InventoryStockBuckets = {
  /** Sellable at this row */
  availableBottles: number;
  /** Allocated / held for orders (reserved rows) */
  allocatedBottles: number;
  reservedBottles: number;
  /** Inbound pipeline: in transit or still at manufacturer */
  incomingBottles: number;
};

export function stockBucketsForRow(item: InventoryItem): InventoryStockBuckets {
  const q = item.quantityBottles;
  const reserved = item.status === "reserved" ? q : 0;
  return {
    availableBottles: item.status === "available" ? q : 0,
    allocatedBottles: reserved,
    reservedBottles: reserved,
    incomingBottles: item.status === "in-transit" || item.status === "in-production" ? q : 0,
  };
}

export function totalAvailableBottlesForSku(items: InventoryItem[], sku: string): number {
  let s = 0;
  for (const i of items) {
    if (i.sku === sku && i.status === "available") s += i.quantityBottles;
  }
  return s;
}

export type InventoryHealth = "healthy" | "watch" | "low";

export function healthForInventoryRow(
  item: InventoryItem,
  allItems: InventoryItem[],
  safetyBySku: Record<string, number> | undefined,
  defaultSafety: number,
): InventoryHealth {
  if (item.status === "damaged") return "low";
  if (item.status === "reserved") return "watch";
  if (item.status === "in-transit" || item.status === "in-production") return "healthy";

  const th = safetyBySku?.[item.sku] ?? defaultSafety;
  const avail = totalAvailableBottlesForSku(allItems, item.sku);
  if (avail < th * 0.5) return "low";
  if (avail < th) return "watch";
  return "healthy";
}

export function healthLabel(h: InventoryHealth): string {
  if (h === "healthy") return "Healthy";
  if (h === "watch") return "Watch";
  return "Low";
}
