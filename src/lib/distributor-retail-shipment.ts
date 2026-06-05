import type { Account, Product, SalesOrder } from "@/data/mockData";
import type { TeamMember, Warehouse } from "@/types/app-data";
import { CASE_SIZE_DEFAULT, orderPoRef } from "@/lib/distributor-pick-pack";
import { orderLineEntries } from "@/lib/order-lines";
import { isPersistedApiOrderId } from "@/lib/sales-order-utils";
import { createShipment } from "@/lib/api-v1-mutations";

function isoDateEndOfDay(dateYmd: string): string {
  const d = new Date(`${dateYmd}T23:59:59`);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export function distributorOriginLocation(
  userEmail: string | undefined,
  teamMembers: TeamMember[] | undefined,
  warehouses: Warehouse[] | undefined,
): string {
  const em = String(userEmail ?? "")
    .trim()
    .toLowerCase();
  const tm = (teamMembers ?? []).find(
    (m) => m.role === "distributor" && String(m.email ?? "").trim().toLowerCase() === em,
  );
  const pw = tm?.primaryWarehouseId;
  if (pw != null && String(pw).trim() !== "") {
    const wh = (warehouses ?? []).find((w) => String(w.id) === String(pw).trim());
    if (wh?.name?.trim()) return wh.name.trim();
  }
  const linked = (warehouses ?? []).find(
    (w) =>
      tm &&
      w.linkedTeamMemberId != null &&
      String(w.linkedTeamMemberId) === String(tm.id),
  );
  if (linked?.name?.trim()) return linked.name.trim();
  return "Distribution center";
}

export function retailDeliveryLocation(order: SalesOrder, account: Account | undefined): string {
  const addr =
    order.shippingAddress?.trim() ||
    order.deliveryAddress?.trim() ||
    (account ? `${account.tradingName} — ${account.city}` : "");
  return addr.trim() || order.account;
}

export function salesOrderNumberForApi(order: SalesOrder): string {
  const num = order.orderNumber?.trim();
  if (num) return num;
  if (/^SO-\d{4}-\d+$/i.test(order.id.trim())) return order.id.trim();
  return orderPoRef(order);
}

export type PersistRetailOutboundParams = {
  order: SalesOrder;
  account: Account | undefined;
  products: { sku: string; name?: string; caseSize?: number }[];
  userEmail: string | undefined;
  teamMembers: TeamMember[] | undefined;
  warehouses: Warehouse[] | undefined;
  trackingNumber: string;
  carrier: string;
  dispatchDateYmd: string;
  etaYmd: string;
  notes: string;
};

/** Persists distributor → retail outbound shipment via POST /api/v1/shipments. */
export async function persistDistributorRetailOutboundShipment(
  params: PersistRetailOutboundParams,
): Promise<Record<string, unknown>> {
  const {
    order,
    account,
    products,
    userEmail,
    teamMembers,
    warehouses,
    trackingNumber,
    carrier,
    dispatchDateYmd,
    etaYmd,
    notes,
  } = params;

  const fromLocation = distributorOriginLocation(userEmail, teamMembers, warehouses);
  const toLocation = retailDeliveryLocation(order, account);
  const orderNumber = salesOrderNumberForApi(order);

  const itemsPayload: {
    sku: string;
    product_name: string;
    quantity: number;
  }[] = [];
  let totalBt = 0;

  for (const [idx, line] of orderLineEntries(order).entries()) {
    const product = products.find((p) => p.sku === line.sku);
    const caseSize =
      product?.caseSize && product.caseSize > 0 ? product.caseSize : CASE_SIZE_DEFAULT;
    const bottles = line.quantityBottles;
    if (bottles <= 0) continue;
    itemsPayload.push({
      sku: line.sku,
      product_name: product?.name?.trim() || line.sku,
      quantity: bottles,
    });
    totalBt += bottles;
  }

  const departed = new Date(
    dispatchDateYmd.includes("T") ? dispatchDateYmd : `${dispatchDateYmd}T12:00:00`,
  );
  if (Number.isNaN(departed.getTime())) {
    throw new Error("Invalid dispatch date");
  }

  const body: Parameters<typeof createShipment>[0] = {
    order_type: "sales_order",
    order_number: orderNumber,
    from_location: fromLocation,
    to_location: toLocation,
    carrier: carrier.trim() || undefined,
    tracking_number: trackingNumber.trim(),
    shipment_number: trackingNumber.trim(),
    ship_date: departed.toISOString(),
    estimated_delivery: isoDateEndOfDay(etaYmd.trim() || dispatchDateYmd),
    status: "in_transit",
    notes: notes.trim() || undefined,
    total_bottles: totalBt > 0 ? totalBt : undefined,
    items: itemsPayload.length > 0 ? itemsPayload : undefined,
  };

  if (isPersistedApiOrderId(order.id)) {
    body.order_id = Number(order.id);
  }

  const res = (await createShipment(body)) as { data?: Record<string, unknown> };
  if (!res?.data) {
    throw new Error("Shipment was not saved");
  }
  return res.data;
}
