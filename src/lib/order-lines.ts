import type { SalesOrder, SalesOrderLine } from "@/data/mockData";

export function orderLineEntries(o: SalesOrder): SalesOrderLine[] {
  if (o.lines && o.lines.length > 0) return o.lines;
  return [{ sku: o.sku, quantityBottles: o.quantity, lineTotal: o.price }];
}

/** Short display e.g. SO-2025-008 → #008 */
export function retailOrderDisplayId(orderId: string): string {
  const m = orderId.match(/^SO-\d{4}-(\d+)$/);
  return m ? `#${m[1]}` : orderId;
}
