import type { Account, SalesOrder } from "@/data/mockData";
import { salesOwnerMatches } from "@/lib/sales-rep-scope";

export type SalesRepOpportunityType = "dormant" | "velocity_drop" | "prospect" | "reorder";

export interface SalesRepOpportunity {
  id: string;
  type: SalesRepOpportunityType;
  account: string;
  accountId: string;
  priority: "high" | "medium" | "low";
  value: number;
  lastOrderDays: number;
  reason: string;
  suggestedAction: string;
}

/** Prioritized pipeline signals for the signed-in rep — shared by Opportunities page + sales shell KPIs. */
export function computeSalesRepOpportunities(
  accounts: Account[],
  salesOrders: SalesOrder[],
  repName: string,
): SalesRepOpportunity[] {
  const ops: SalesRepOpportunity[] = [];

  const repAccounts = accounts.filter(
    (a) =>
      salesOwnerMatches(a.salesOwner, repName) &&
      ["retail", "bar", "restaurant", "hotel"].includes(a.type),
  );

  for (const account of repAccounts) {
    const accountOrders = salesOrders
      .filter((o) => o.account === account.tradingName && o.status !== "cancelled")
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

    const lastOrder = accountOrders[0];
    const lastOrderDate = lastOrder ? new Date(lastOrder.orderDate) : null;
    const daysSinceOrder = lastOrderDate ? Math.floor((Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)) : 999;

    const totalRevenue = accountOrders.reduce((sum, o) => sum + (o.totalValue ?? o.price ?? 0), 0);

    if (daysSinceOrder > 60 && accountOrders.length > 0) {
      ops.push({
        id: `dormant-${account.id}`,
        type: "dormant",
        account: account.tradingName || account.name,
        accountId: account.id,
        priority: totalRevenue > 5000 ? "high" : "medium",
        value: totalRevenue,
        lastOrderDays: daysSinceOrder,
        reason: `No orders in ${daysSinceOrder} days`,
        suggestedAction: "Call to check stock levels and reorder",
      });
    }

    if (accountOrders.length >= 3 && daysSinceOrder > 40) {
      const avgGap = daysSinceOrder / accountOrders.length;
      if (daysSinceOrder > avgGap * 1.5) {
        ops.push({
          id: `velocity-${account.id}`,
          type: "velocity_drop",
          account: account.tradingName || account.name,
          accountId: account.id,
          priority: "medium",
          value: totalRevenue,
          lastOrderDays: daysSinceOrder,
          reason: `Ordering pattern slowed (was every ~${Math.floor(avgGap)} days)`,
          suggestedAction: "Visit to discuss menu/promotions",
        });
      }
    }

    if (lastOrder && daysSinceOrder > 30 && daysSinceOrder < 60) {
      const estimatedConsumption = ((lastOrder.totalBottles ?? 0) / 30) * daysSinceOrder;
      if (estimatedConsumption >= (lastOrder.totalBottles ?? 0) * 0.8) {
        ops.push({
          id: `reorder-${account.id}`,
          type: "reorder",
          account: account.tradingName || account.name,
          accountId: account.id,
          priority: "high",
          value: lastOrder.totalValue ?? lastOrder.price ?? 0,
          lastOrderDays: daysSinceOrder,
          reason: "Estimated stock running low",
          suggestedAction: "Proactive reorder call",
        });
      }
    }

    if (accountOrders.length === 0 && account.status === "active") {
      ops.push({
        id: `prospect-${account.id}`,
        type: "prospect",
        account: account.tradingName || account.name,
        accountId: account.id,
        priority: "medium",
        value: 0,
        lastOrderDays: 999,
        reason: "New account — no orders yet",
        suggestedAction: "Schedule tasting / setup visit",
      });
    }
  }

  const priorityWeight = { high: 3, medium: 2, low: 1 };
  return ops.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
}
