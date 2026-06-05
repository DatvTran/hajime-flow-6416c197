import type { SalesOrder, Shipment } from "@/data/mockData";
import { orderTabForOrder } from "@/lib/order-lifecycle";

/** Map shipment.linkedOrder (DB id, order number, or client id) to a sales order id. */
export function resolveSalesOrderIdFromShipmentLink(
  linkedOrder: string | undefined,
  salesOrders: Pick<SalesOrder, "id" | "orderNumber">[],
  linkedOrderDbId?: string,
): string | undefined {
  const dbId = String(linkedOrderDbId ?? "").trim();
  if (dbId) {
    const byDb = salesOrders.find((o) => o.id === dbId || String(o.id) === dbId);
    if (byDb) return byDb.id;
  }

  const t = String(linkedOrder ?? "").trim();
  if (!t) return undefined;
  for (const o of salesOrders) {
    if (o.id === t || String(o.id) === t) return o.id;
    const num = o.orderNumber?.trim();
    if (num && num === t) return o.id;
  }
  return undefined;
}

/** Orders list with detail dialog — full order fields (status, notes, lines context). */
export function distributorOrdersDetailPath(
  orderId: string,
  order?: Pick<SalesOrder, "status">,
): string {
  const tab = order ? orderTabForOrder(order as SalesOrder) : "distributor";
  return `/distributor/orders?order=${encodeURIComponent(orderId)}&tab=${tab}`;
}

/** Primary fulfillment screen for editing pick / dispatch on an order. */
export function distributorFulfillmentEditPath(order: Pick<SalesOrder, "id" | "status">): string {
  if (order.status === "confirmed") {
    return `/distributor/pick-pack?order=${encodeURIComponent(order.id)}`;
  }
  if (order.status === "packed" || order.status === "shipped") {
    return `/distributor/log-shipment?order=${encodeURIComponent(order.id)}`;
  }
  return distributorOrdersDetailPath(order.id, order);
}

/** Where to send the user when they click a shipment row. */
export function distributorShipmentEditPath(
  shipment: Shipment,
  salesOrders: Pick<SalesOrder, "id" | "orderNumber" | "status">[],
): string {
  const orderId = resolveSalesOrderIdFromShipmentLink(
    shipment.linkedOrder,
    salesOrders,
    shipment.linkedOrderDbId,
  );
  if (orderId) {
    const order = salesOrders.find((o) => o.id === orderId);
    if (order) return distributorFulfillmentEditPath(order);
    return `/distributor/log-shipment?order=${encodeURIComponent(orderId)}`;
  }
  const q = shipment.id?.trim() || shipment.linkedOrder?.trim();
  if (q) return `/distributor/shipments?q=${encodeURIComponent(q)}`;
  return "/distributor/shipments";
}
