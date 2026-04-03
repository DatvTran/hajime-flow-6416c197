import type { PurchaseOrder } from "@/data/mockData";

/** Next PO-YYYY-### id for the current calendar year. */
export function nextPoId(existing: PurchaseOrder[]): string {
  const year = new Date().getFullYear();
  let maxSeq = 0;
  for (const o of existing) {
    const m = o.id.match(/^PO-(\d{4})-(\d+)$/);
    if (m) {
      const y = parseInt(m[1], 10);
      const seq = parseInt(m[2], 10);
      if (y === year) maxSeq = Math.max(maxSeq, seq);
    }
  }
  return `PO-${year}-${String(maxSeq + 1).padStart(3, "0")}`;
}
