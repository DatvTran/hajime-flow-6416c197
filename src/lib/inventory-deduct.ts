import type { InventoryItem } from "@/data/mockData";

/** FIFO deduct from `available` lines for a SKU, oldest production date first.
 *  Optionally filters by warehouse or locationType. */
export function deductFifoAvailableBottles(
  items: InventoryItem[],
  sku: string,
  qty: number,
  caseSize: number,
  opts?: { warehouse?: string; locationType?: InventoryItem["locationType"] },
): { next: InventoryItem[]; shortfall: number } {
  if (qty <= 0) return { next: items, shortfall: 0 };
  const working = [...items];
  const order = working
    .filter((r) => {
      if (r.sku !== sku || r.status !== "available") return false;
      if (opts?.warehouse && r.warehouse !== opts.warehouse) return false;
      if (opts?.locationType && r.locationType !== opts.locationType) return false;
      return true;
    })
    .sort((a, b) => a.productionDate.localeCompare(b.productionDate));
  let remaining = qty;
  for (const target of order) {
    if (remaining <= 0) break;
    const wi = working.findIndex((r) => r.id === target.id);
    if (wi < 0) continue;
    const row = working[wi];
    const take = Math.min(row.quantityBottles, remaining);
    const newBottles = row.quantityBottles - take;
    if (newBottles <= 0) {
      working.splice(wi, 1);
    } else {
      working[wi] = {
        ...row,
        quantityBottles: newBottles,
        quantityCases: Math.max(0, Math.floor(newBottles / caseSize)),
      };
    }
    remaining -= take;
  }
  return { next: working, shortfall: remaining };
}
