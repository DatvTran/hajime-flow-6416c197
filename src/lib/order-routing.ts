import type { Account, OrderCreatedByRole, OrderRoutingTarget, RepApprovalStatus, SalesOrder } from "@/data/mockData";
import type { HajimeRole } from "@/contexts/AuthContext";
import { isRetailChannelOrder } from "@/lib/hajime-metrics";

export type { OrderCreatedByRole, OrderRoutingTarget, RepApprovalStatus };

export function orderCreatedByFromRole(role: HajimeRole): OrderCreatedByRole {
  switch (role) {
    case "brand_operator":
      return "brand_operator";
    case "distributor":
      return "distributor";
    case "sales_rep":
      return "sales_rep";
    case "manufacturer":
      return "manufacturer";
    case "retail":
      return "retail";
    default:
      return "brand_operator";
  }
}

/** Retail multi-line drafts without explicit field: treat as pending rep approval. */
export function effectiveRepApprovalStatus(order: SalesOrder, accounts: Account[]): RepApprovalStatus {
  if (order.repApprovalStatus) return order.repApprovalStatus;
  if (order.status !== "draft") return "not_required";
  if (isRetailChannelOrder(order, accounts) && order.lines && order.lines.length > 0) return "pending";
  return "not_required";
}

export function routingTargetLabel(t: OrderRoutingTarget | undefined): string {
  if (!t) return "—";
  const map: Record<OrderRoutingTarget, string> = {
    manufacturer: "Manufacturer / production",
    wholesaler: "Wholesaler / DC",
    sales_rep: "Field sales",
    retail: "Retail store",
  };
  return map[t];
}

export function createdByLabel(r: OrderCreatedByRole | undefined): string {
  if (!r) return "—";
  const map: Record<OrderCreatedByRole, string> = {
    brand_operator: "Brand HQ",
    distributor: "Wholesaler",
    sales_rep: "Sales rep",
    retail: "Retail",
    manufacturer: "Manufacturer",
  };
  return map[r];
}

export function canSalesRepApproveOrder(
  order: SalesOrder,
  accounts: Account[],
  sessionRepLabel: string,
): boolean {
  if (order.status !== "draft") return false;
  if (effectiveRepApprovalStatus(order, accounts) !== "pending") return false;
  if (!isRetailChannelOrder(order, accounts)) return false;
  return order.salesRep.trim() === sessionRepLabel.trim();
}

export function canCollectPaymentForOrder(order: SalesOrder, accounts: Account[]): boolean {
  const rep = effectiveRepApprovalStatus(order, accounts);
  if (rep === "pending") return false;
  return true;
}
