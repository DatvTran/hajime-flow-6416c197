import type { InventoryItem } from "@/data/mockData";

export function availableBottlesForSku(inventory: InventoryItem[], sku: string): number {
  let s = 0;
  for (const row of inventory) {
    if (row.sku === sku && row.status === "available") s += row.quantityBottles;
  }
  return s;
}

export function stockAvailabilityLabel(bottles: number, caseSize: number): { label: string; tone: "ok" | "low" | "out" } {
  if (bottles <= 0) return { label: "Out of stock", tone: "out" };
  if (bottles < caseSize * 2) return { label: "Low stock", tone: "low" };
  return { label: "In stock", tone: "ok" };
}
