import type { InventoryItem } from "@/data/mockData";

/** Next INV-### id based on existing rows. */
export function nextInventoryId(existing: InventoryItem[]): string {
  let max = 0;
  for (const i of existing) {
    const m = i.id.match(/^INV-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `INV-${String(max + 1).padStart(3, "0")}`;
}
