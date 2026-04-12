import type { InventoryItem } from "@/data/mockData";

function escCell(v: string | number | undefined): string {
  const s = v === undefined || v === null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Download inventory as CSV (UTF-8). */
export function downloadInventoryCsv(items: InventoryItem[], filename = "hajime-inventory.csv"): void {
  const headers = [
    "SKU",
    "Product Name",
    "Location",
    "On Hand",
    "Reserved",
    "Available",
    "Status",
    "Reorder Point",
    "Market",
    "Last Updated",
  ];
  const lines = [headers.join(",")];
  for (const item of items) {
    const available = item.quantityBottles - (item.reservedQuantity ?? 0);
    lines.push(
      [
        escCell(item.sku),
        escCell(item.productName),
        escCell(item.location),
        escCell(item.quantityBottles),
        escCell(item.reservedQuantity ?? 0),
        escCell(available),
        escCell(item.status),
        escCell(item.reorderPoint ?? "—"),
        escCell(item.market),
        escCell(item.updatedAt ?? "—"),
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

/** Download low stock items only */
export function downloadLowStockCsv(items: InventoryItem[], filename = "hajime-low-stock.csv"): void {
  const lowStock = items.filter((item) => {
    const available = item.quantityBottles - (item.reservedQuantity ?? 0);
    return available <= (item.reorderPoint ?? 0);
  });
  downloadInventoryCsv(lowStock, filename);
}
