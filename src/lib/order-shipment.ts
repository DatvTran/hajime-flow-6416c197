import type { Account, SalesOrder, Shipment } from "@/data/mockData";

export function nextShipmentId(existing: Shipment[]): string {
  let max = 0;
  for (const s of existing) {
    const m = s.id.match(/^SH-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `SH-${max + 1}`;
}

/** Create an outbound DC shipment when an order moves to shipped (one per order id). */
export function buildOutboundShipmentForOrder(order: SalesOrder, accounts: Account[], existing: Shipment[]): Shipment | null {
  if (existing.some((s) => s.linkedOrder === order.id && s.type === "outbound")) return null;
  const acc = accounts.find((a) => a.tradingName === order.account);
  const destination = order.deliveryAddress?.trim() || (acc ? `${acc.tradingName} — ${acc.city}` : order.account);
  const shipDate = new Date().toISOString().slice(0, 10);
  const eta = order.requestedDelivery || shipDate;
  return {
    id: nextShipmentId(existing),
    origin: "Toronto Main Warehouse",
    destination,
    carrier: "Metro Logistics",
    shipDate,
    eta,
    actualDelivery: "",
    linkedOrder: order.id,
    type: "outbound",
    status: "preparing",
    notes: `Auto-created when order ${order.id} marked shipped`,
  };
}
