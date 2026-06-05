import type { SalesOrder } from "@/data/mockData";
import { getOrders } from "@/lib/api-v1";
import { isPersistedApiOrderId, isServerOrderNumberRef } from "@/lib/sales-order-utils";

export function findSalesOrderByRef(
  orders: Pick<SalesOrder, "id" | "orderNumber">[],
  ref: string | null | undefined,
): SalesOrder | undefined {
  const t = String(ref ?? "").trim();
  if (!t) return undefined;
  return orders.find((o) => o.id === t || o.orderNumber === t);
}

/** Resolve client order id → API PK for status updates and deep links. */
export async function resolveOrderIdForApiUpdate(
  id: string,
  orders: Pick<SalesOrder, "id" | "orderNumber">[],
): Promise<string> {
  const raw = id.trim();
  if (!raw) return raw;
  if (isPersistedApiOrderId(raw)) return raw;
  if (isServerOrderNumberRef(raw)) return raw;

  const local = orders.find((o) => o.id === raw || o.orderNumber === raw);
  if (local && isPersistedApiOrderId(local.id)) return local.id;
  if (local && isServerOrderNumberRef(local.id)) return local.id;

  const orderNumber =
    local?.orderNumber?.trim() ||
    (local && isServerOrderNumberRef(local.id) ? local.id.trim() : null) ||
    (isServerOrderNumberRef(raw) ? raw : null);
  if (orderNumber) {
    try {
      const res = await getOrders({ limit: 5, order_number: orderNumber });
      const row = res.data?.find(
        (o) => String(o.order_number ?? "").trim() === orderNumber,
      );
      if (row?.id != null) return String(row.id);
    } catch {
      // fall through
    }
  }

  return raw;
}
