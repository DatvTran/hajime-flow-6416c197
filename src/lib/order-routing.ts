import type { Account, InventoryItem, OrderCreatedByRole, OrderRoutingTarget, RepApprovalStatus, SalesOrder } from "@/data/mockData";
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

/** Legacy approval check — draft orders pending rep review */
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

/** NEW: Get distributor inventory for an order (for inventory check widget) */
export function getDistributorInventoryForOrder(
  order: SalesOrder,
  inventoryItems: InventoryItem[],
  availableBottlesAtWarehouse: (sku: string, warehouse: string) => number,
): {
  available: number;
  needed: number;
  shortfall: number;
  warehouse: string;
} {
  const warehouse = "Toronto Main"; // Default distributor warehouse
  const needed = order.lines 
    ? order.lines.reduce((sum, line) => sum + line.quantityBottles, 0)
    : order.quantity;
  
  // Check inventory for each SKU in the order
  let totalAvailable = 0;
  if (order.lines && order.lines.length > 0) {
    for (const line of order.lines) {
      totalAvailable += availableBottlesAtWarehouse(line.sku, warehouse);
    }
  } else {
    totalAvailable = availableBottlesAtWarehouse(order.sku, warehouse);
  }
  
  const shortfall = Math.max(0, needed - totalAvailable);
  
  return {
    available: totalAvailable,
    needed,
    shortfall,
    warehouse,
  };
}

/** NEW: Two-step confirmation — sales rep checks inventory before confirming */
export function canSalesRepConfirmOrder(
  order: SalesOrder,
  accounts: Account[],
  sessionRepLabel: string,
  inventoryItems: InventoryItem[],
  availableBottlesAtWarehouse: (sku: string, warehouse: string) => number,
): {
  canConfirm: boolean;
  hasInventoryWarning: boolean;
  shortfall: number;
  inventoryCheck: ReturnType<typeof getDistributorInventoryForOrder>;
} {
  // First check basic approval eligibility
  const canApprove = canSalesRepApproveOrder(order, accounts, sessionRepLabel);
  
  if (!canApprove) {
    return {
      canConfirm: false,
      hasInventoryWarning: false,
      shortfall: 0,
      inventoryCheck: getDistributorInventoryForOrder(order, inventoryItems, availableBottlesAtWarehouse),
    };
  }
  
  // Check inventory levels
  const inventoryCheck = getDistributorInventoryForOrder(order, inventoryItems, availableBottlesAtWarehouse);
  const hasShortfall = inventoryCheck.shortfall > 0;
  
  // Can confirm even with shortfall (soft warning), but we flag it
  return {
    canConfirm: true,
    hasInventoryWarning: hasShortfall,
    shortfall: inventoryCheck.shortfall,
    inventoryCheck,
  };
}

export function canCollectPaymentForOrder(order: SalesOrder, accounts: Account[]): boolean {
  const rep = effectiveRepApprovalStatus(order, accounts);
  if (rep === "pending") return false;
  return true;
}

/** NEW: Check if order was created in proxy mode */
export function isProxyOrder(order: SalesOrder): boolean {
  return Boolean(order.placedByRole && order.onBehalfOfAccount);
}

/** NEW: Get the effective account for an order (handles proxy mode) */
export function getEffectiveAccountId(order: SalesOrder): string | undefined {
  // If placed on behalf of another account, return that account
  if (order.onBehalfOfAccount) {
    return order.onBehalfOfAccount;
  }
  // Otherwise, find account by trading name (legacy behavior)
  return undefined;
}

/** NEW: Get audit trail info for proxy orders */
export function getProxyAuditInfo(order: SalesOrder): {
  isProxy: boolean;
  placedByRole: OrderCreatedByRole | undefined;
  onBehalfOfAccount: string | undefined;
  auditMessage: string | null;
} {
  const isProxy = isProxyOrder(order);
  
  if (!isProxy) {
    return {
      isProxy: false,
      placedByRole: undefined,
      onBehalfOfAccount: undefined,
      auditMessage: null,
    };
  }
  
  const auditMessage = `Order placed by ${createdByLabel(order.placedByRole)} on behalf of account ${order.onBehalfOfAccount}`;
  
  return {
    isProxy: true,
    placedByRole: order.placedByRole,
    onBehalfOfAccount: order.onBehalfOfAccount,
    auditMessage,
  };
}
