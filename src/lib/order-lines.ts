import type { SalesOrder, SalesOrderLine, Shipment } from "@/data/mockData";

export function orderLineEntries(o: SalesOrder): SalesOrderLine[] {
  if (o.lines && o.lines.length > 0) return o.lines;
  return [{ sku: o.sku, quantityBottles: o.quantity, lineTotal: o.price }];
}

/** Short display e.g. SO-2025-008 → #008 */
export function retailOrderDisplayId(orderId: string): string {
  const m = orderId.match(/^SO-\d{4}-(\d+)$/);
  return m ? `#${m[1]}` : orderId;
}

function formatCases(n: number): string {
  const r = Math.round(n * 1000) / 1000;
  if (Number.isInteger(r)) return String(r);
  return r.toFixed(2).replace(/\.?0+$/, "");
}

/** Shipment manifest for lists (distributor outbound prefers case language). */
export function shipmentLineContentsLabel(s: Shipment): string {
  const lines = s.lineItems;
  if (!lines?.length) return "";
  return lines
    .map((li) => {
      if (
        s.orderType === "sales_order" &&
        li.cases != null &&
        li.caseSize &&
        li.caseSize > 0
      ) {
        return `${li.sku}: ${formatCases(li.cases)} cs (${li.caseSize} bt/cs, ${li.quantity} bt)`;
      }
      return `${li.sku} × ${li.quantity}`;
    })
    .join(" · ");
}
