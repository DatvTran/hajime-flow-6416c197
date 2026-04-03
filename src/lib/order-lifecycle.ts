import type { SalesOrder } from "@/data/mockData";

/** Same lifecycle as the Orders page — single source of truth for HQ / field / retail. */
export const ORDER_TABS = [
  { id: "pending-review", label: "Pending review" },
  { id: "approved", label: "Approved" },
  { id: "distributor", label: "Distributor processing" },
  { id: "delivered", label: "Delivered" },
  { id: "rejected", label: "Rejected" },
] as const;

export type OrderTabId = (typeof ORDER_TABS)[number]["id"];

export function isOrderTabId(v: string | null): v is OrderTabId {
  return ORDER_TABS.some((t) => t.id === v);
}

export function matchesOrderTab(o: SalesOrder, tab: OrderTabId): boolean {
  switch (tab) {
    case "pending-review":
      return o.status === "draft";
    case "approved":
      return o.status === "confirmed" || o.status === "packed";
    case "distributor":
      return o.status === "shipped";
    case "delivered":
      return o.status === "delivered";
    case "rejected":
      return o.status === "cancelled";
    default:
      return true;
  }
}

export function computeOrderTabCounts(orders: SalesOrder[]): Record<OrderTabId, number> {
  const c: Record<OrderTabId, number> = {
    "pending-review": 0,
    approved: 0,
    distributor: 0,
    delivered: 0,
    rejected: 0,
  };
  for (const o of orders) {
    for (const t of ORDER_TABS) {
      if (matchesOrderTab(o, t.id)) c[t.id] += 1;
    }
  }
  return c;
}
