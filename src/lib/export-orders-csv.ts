import type { SalesOrder } from "@/data/mockData";

function escCell(v: string | number | undefined): string {
  const s = v === undefined || v === null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Download current table as CSV (UTF-8). */
export function downloadSalesOrdersCsv(orders: SalesOrder[], filename = "hajime-orders.csv"): void {
  const headers = [
    "Order ID",
    "Account",
    "Market",
    "SKU",
    "Qty (bottles)",
    "Value (CAD)",
    "Sales rep",
    "Status",
    "Payment",
    "Order date",
  ];
  const lines = [headers.join(",")];
  for (const o of orders) {
    lines.push(
      [
        escCell(o.id),
        escCell(o.account),
        escCell(o.market),
        escCell(o.sku),
        escCell(o.quantity),
        escCell(o.price),
        escCell(o.salesRep),
        escCell(o.status),
        escCell(o.paymentStatus),
        escCell(o.orderDate),
      ].join(","),
    );
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
