import type { SalesOrder, Shipment } from "@/data/mockData";
import { orderLineEntries, retailOrderDisplayId, shipmentLineContentsLabel } from "@/lib/order-lines";
import { retailStatusLabel } from "@/components/retail/RetailStatusChip";

export type DeliveryFilter = "all" | "in_transit" | "delivered" | "pending";

/** Match trading name to shipment destination (e.g. "The Drake Hotel" vs "The Drake Hotel - 1150 Queen St W"). */
export function retailShipmentMatchesStore(destination: string, storeName: string): boolean {
  if (!storeName) return false;
  if (destination === storeName) return true;
  return destination.startsWith(`${storeName} -`) || destination.startsWith(`${storeName},`);
}

export type DeliveryRow =
  | { kind: "shipment"; shipment: Shipment; order?: SalesOrder }
  | { kind: "order_pending"; order: SalesOrder };

export function shipmentBucket(s: Shipment): DeliveryFilter {
  if (s.status === "delivered") return "delivered";
  if (s.status === "delayed" || s.status === "in-transit") return "in_transit";
  return "pending";
}

export function rowBucket(row: DeliveryRow): DeliveryFilter {
  if (row.kind === "order_pending") return "pending";
  return shipmentBucket(row.shipment);
}

export function buildRetailDeliveryRows(
  shipments: Shipment[],
  orders: SalesOrder[],
  storeName: string | null,
): DeliveryRow[] {
  if (!storeName) return [];

  const storeOrders = orders.filter((o) => o.account === storeName && o.status !== "cancelled");
  const storeShipments = shipments.filter((s) => retailShipmentMatchesStore(s.destination, storeName));

  const orderById = new Map(storeOrders.map((o) => [o.id, o]));
  const linkedOrderIds = new Set(storeShipments.map((s) => s.linkedOrder).filter(Boolean));

  const rows: DeliveryRow[] = storeShipments.map((shipment) => ({
    kind: "shipment",
    shipment,
    order: shipment.linkedOrder ? orderById.get(shipment.linkedOrder) : undefined,
  }));

  for (const order of storeOrders) {
    if (order.status === "delivered") continue;
    if (linkedOrderIds.has(order.id)) continue;
    if (["draft", "confirmed"].includes(order.status)) {
      rows.push({ kind: "order_pending", order });
    }
  }

  const sortKey = (r: DeliveryRow) => {
    if (r.kind === "shipment") {
      return Date.parse(r.shipment.shipDate || r.shipment.eta) || 0;
    }
    return Date.parse(r.order.orderDate) || 0;
  };

  return rows.sort((a, b) => {
    const aDone = rowBucket(a) === "delivered";
    const bDone = rowBucket(b) === "delivered";
    if (aDone !== bDone) return aDone ? 1 : -1;
    return sortKey(b) - sortKey(a);
  });
}

export function deliveryHeaderMeta(row: DeliveryRow): string {
  if (row.kind === "order_pending") {
    const o = row.order;
    const suffix = o.status === "draft" ? " · awaiting HQ" : "";
    return `${retailOrderDisplayId(o.id)} · Placed ${o.orderDate}${suffix}`;
  }
  const { shipment, order } = row;
  const po = order ? retailOrderDisplayId(order.id) : shipment.linkedOrder ?? shipment.id;
  if (shipment.status === "delivered" && order?.actualDeliveryDate) {
    return `${po} · Delivered ${order.actualDeliveryDate}`;
  }
  if (order) return `${po} · Placed ${order.orderDate}`;
  return `${po} · ${shipment.shipDate ? `Shipped ${shipment.shipDate}` : "Scheduled"}`;
}

export function deliveryDescription(row: DeliveryRow, products: { sku: string; name: string }[]): string {
  if (row.kind === "order_pending") {
    return orderLineEntries(row.order)
      .map((l) => {
        const p = products.find((x) => x.sku === l.sku);
        return `${l.quantityBottles}× ${p?.name ?? l.sku}`;
      })
      .join(", ");
  }
  const s = row.shipment;
  const manifest = shipmentLineContentsLabel(s);
  if (manifest) return manifest.replace(/ · /g, ", ");
  if (s.lineItems?.length) {
    return s.lineItems
      .map((li) => `${li.cases ?? li.quantity}× ${li.productName ?? li.sku}`)
      .join(", ");
  }
  if (row.order) {
    return orderLineEntries(row.order)
      .map((l) => {
        const p = products.find((x) => x.sku === l.sku);
        return `${l.quantityBottles}× ${p?.name ?? l.sku}`;
      })
      .join(", ");
  }
  return `${s.origin} → ${s.destination}`;
}

export function deliveryEtaLabel(row: DeliveryRow): string {
  if (row.kind === "order_pending") {
    if (row.order.status === "draft") return "Pending HQ approval";
    return row.order.requestedDelivery ? `Requested ${row.order.requestedDelivery}` : "Awaiting fulfillment";
  }
  const s = row.shipment;
  if (s.status === "delivered") {
    return s.actualDelivery || row.order?.actualDeliveryDate || "Delivered";
  }
  return s.eta;
}

export function deliveryPill(row: DeliveryRow): { status: string; label: string } {
  if (row.kind === "order_pending") {
    return { status: row.order.status, label: row.order.status === "draft" ? "pending" : retailStatusLabel(row.order.status) };
  }
  const s = row.shipment;
  if (s.status === "delivered") return { status: "delivered", label: "delivered" };
  if (s.status === "in-transit") return { status: "shipped", label: "in-transit" };
  if (s.status === "delayed") return { status: "shipped", label: "delayed" };
  if (s.status === "preparing") return { status: "packed", label: "preparing" };
  const orderStatus = row.order?.status ?? "shipped";
  return { status: orderStatus, label: retailStatusLabel(orderStatus) };
}

export function deliveryTrackerStatus(row: DeliveryRow): string {
  if (row.kind === "order_pending") return row.order.status;
  return row.order?.status ?? (row.shipment.status === "delivered" ? "delivered" : "shipped");
}

export function deliveryTrackerDates(row: DeliveryRow): (string | undefined)[] {
  if (row.kind === "order_pending") {
    const o = row.order;
    return [o.orderDate, undefined, undefined, undefined, undefined];
  }
  const o = row.order;
  const s = row.shipment;
  return [
    o?.orderDate,
    o?.orderDate,
    s.shipDate || undefined,
    s.status === "in-transit" || s.status === "delayed" ? s.shipDate : undefined,
    s.status === "delivered" ? s.actualDelivery || o?.actualDeliveryDate : s.eta,
  ];
}

export function deliveryTotal(row: DeliveryRow): number | null {
  if (row.kind === "order_pending") return row.order.price;
  return row.order?.price ?? null;
}

export function deliveryTracking(row: DeliveryRow): string | null {
  if (row.kind === "order_pending") return null;
  return row.shipment.waybillNumber || null;
}

export function deliveryCarrier(row: DeliveryRow): string {
  if (row.kind === "order_pending") return "—";
  return row.shipment.carrier || "—";
}

export function deliveryDetailHref(row: DeliveryRow): string | null {
  if (row.kind === "order_pending") {
    return `/retail/orders/${encodeURIComponent(row.order.id)}`;
  }
  if (row.order) return `/retail/orders/${encodeURIComponent(row.order.id)}`;
  if (row.shipment.linkedOrder) return `/retail/orders/${encodeURIComponent(row.shipment.linkedOrder)}`;
  return null;
}
