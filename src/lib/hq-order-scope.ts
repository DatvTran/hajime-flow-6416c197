import type { Account, InventoryItem, SalesOrder } from "@/data/mockData";
import type { AppData } from "@/types/app-data";
import { isRetailChannelOrder } from "@/lib/hajime-metrics";

export const HQ_OPERATOR_ROLES = new Set([
  "brand_operator",
  "founder_admin",
  "operations",
  "finance",
]);

export function isHqOperatorRole(role: string | undefined): boolean {
  return role != null && HQ_OPERATOR_ROLES.has(role);
}

function accountForOrder(order: SalesOrder, accounts: Account[]): Account | undefined {
  if (order.accountId) {
    const byId = accounts.find((a) => String(a.id) === String(order.accountId));
    if (byId) return byId;
  }
  const label = (order.account || "").trim().toLowerCase();
  if (!label) return undefined;
  return accounts.find(
    (a) =>
      (a.tradingName || "").trim().toLowerCase() === label ||
      (a.legalName || "").trim().toLowerCase() === label ||
      (a.name || "").trim().toLowerCase() === label,
  );
}

/** Brand HQ sell-in: platform orders to wholesaler / distributor accounts only. */
export function isWholesaleSellInOrder(order: SalesOrder, accounts: Account[]): boolean {
  if (order.distributorOrgId) return false;
  const acc = accountForOrder(order, accounts);
  if (!acc) return false;
  return acc.type === "distributor";
}

/** Retail & on-premise orders inside a wholesaler's isolated database. */
export function isNetworkRetailOrder(order: SalesOrder, accounts: Account[]): boolean {
  if (order.distributorOrgId) return true;
  return isRetailChannelOrder(order, accounts);
}

export function filterWholesaleOrdersForHq(orders: SalesOrder[], accounts: Account[]): SalesOrder[] {
  return orders.filter((o) => isWholesaleSellInOrder(o, accounts));
}

export function filterNetworkOrdersForOrg(orders: SalesOrder[], orgId: string): SalesOrder[] {
  return orders.filter((o) => String(o.distributorOrgId ?? "") === String(orgId));
}

export function filterRowsForOrg<T extends { distributorOrgId?: string }>(rows: T[], orgId: string): T[] {
  return rows.filter((r) => String(r.distributorOrgId ?? "") === String(orgId));
}

/** Platform CRM accounts only — network retail rows live under wholesaler partner detail. */
export function filterPlatformAccountsForHq(accounts: Account[]): Account[] {
  return accounts.filter((a) => !a.distributorOrgId);
}

/** Brand HQ warehouse inventory — partner stock lives under wholesaler detail. */
export function filterPlatformInventoryForHq(inventory: InventoryItem[]): InventoryItem[] {
  return inventory.filter((i) => !i.distributorOrgId);
}

/** Command-center view: wholesale sell-in + platform accounts/inventory only. */
export function scopeAppDataForHqOperator(data: AppData): AppData {
  const accounts = filterPlatformAccountsForHq(data.accounts);
  return {
    ...data,
    accounts,
    salesOrders: filterWholesaleOrdersForHq(data.salesOrders, accounts),
    inventory: filterPlatformInventoryForHq(data.inventory),
  };
}
