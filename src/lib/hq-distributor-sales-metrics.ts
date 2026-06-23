import type { Account, SalesOrder } from "@/data/mockData";
import type { TeamMember } from "@/types/app-data";
import { filterRowsForOrg } from "@/lib/hq-order-scope";

const ON_PREMISE = new Set(["retail", "bar", "restaurant", "hotel", "lifestyle"]);

const MS_DAY = 86400000;

function inLastDays(iso: string, days: number, now = Date.now()): boolean {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  return t >= now - days * MS_DAY;
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

export type RepPerformanceRow = {
  id: string;
  name: string;
  territory: string;
  q2Sales: string;
  q2SalesRaw: number;
  accounts: number;
  quota: string;
};

export type RetailSalesRow = {
  id: string;
  name: string;
  type: string;
  revenue: string;
  revenueRaw: number;
  orders: number;
  statusTone: "green" | "amber" | "red";
  statusLabel: string;
};

export type DistributorSalesSnapshot = {
  market: string;
  q2Revenue: string;
  q2RevenueRaw: number;
  casesMoved: number;
  reps: RepPerformanceRow[];
  retail: RetailSalesRow[];
};

export function computeDistributorSalesSnapshot(
  orgId: string,
  orders: SalesOrder[],
  accounts: Account[],
  teamMembers: TeamMember[],
  windowDays = 90,
): DistributorSalesSnapshot {
  const networkOrders = filterRowsForOrg(orders, orgId).filter(
    (o) => o.status !== "cancelled" && o.status !== "draft",
  );
  const windowOrders = networkOrders.filter((o) => inLastDays(o.orderDate, windowDays));

  const platformDist = accounts.find(
    (a) => a.type === "distributor" && String(a.distributorOrgId ?? "") === String(orgId),
  );
  const market =
    platformDist?.city ||
    windowOrders.find((o) => o.market)?.market ||
    networkOrders.find((o) => o.market)?.market ||
    "—";

  const q2RevenueRaw = windowOrders.reduce((s, o) => s + (o.price || 0), 0);
  const casesMoved = windowOrders.reduce((s, o) => {
    if (o.lines?.length) {
      return s + o.lines.reduce((ls, l) => ls + (l.quantity || 0), 0);
    }
    return s + Math.ceil((o.quantity || 0) / 12);
  }, 0);

  const salesReps = filterRowsForOrg(teamMembers, orgId).filter((m) => m.role === "sales_rep");

  const repRows: RepPerformanceRow[] = salesReps.map((rep) => {
    const repOrders = windowOrders.filter(
      (o) => (o.salesRep || "").trim().toLowerCase() === rep.displayName.trim().toLowerCase(),
    );
    const revenue = repOrders.reduce((s, o) => s + (o.price || 0), 0);
    const acctSet = new Set(repOrders.map((o) => o.account).filter(Boolean));
    const quotaPct = repOrders.length > 0 ? Math.min(99, Math.round((revenue / Math.max(q2RevenueRaw, 1)) * 100)) : 0;
    const territory =
      repOrders.find((o) => o.market)?.market ||
      accounts.find((a) => a.salesOwner === rep.displayName)?.city ||
      "—";
    return {
      id: rep.id,
      name: rep.displayName,
      territory,
      q2Sales: formatMoney(revenue),
      q2SalesRaw: revenue,
      accounts: acctSet.size,
      quota: quotaPct > 0 ? `${quotaPct}%` : "—",
    };
  });

  if (repRows.length === 0) {
    const byRep = new Map<string, SalesOrder[]>();
    for (const o of windowOrders) {
      const key = (o.salesRep || "Unassigned").trim();
      const list = byRep.get(key) ?? [];
      list.push(o);
      byRep.set(key, list);
    }
    for (const [name, repOrders] of byRep) {
      const revenue = repOrders.reduce((s, o) => s + (o.price || 0), 0);
      repRows.push({
        id: name,
        name,
        territory: repOrders.find((o) => o.market)?.market || "—",
        q2Sales: formatMoney(revenue),
        q2SalesRaw: revenue,
        accounts: new Set(repOrders.map((o) => o.account)).size,
        quota: q2RevenueRaw > 0 ? `${Math.round((revenue / q2RevenueRaw) * 100)}%` : "—",
      });
    }
  }

  repRows.sort((a, b) => b.q2SalesRaw - a.q2SalesRaw);

  const retailAccounts = filterRowsForOrg(accounts, orgId).filter((a) => ON_PREMISE.has(String(a.type)));

  const retailByName = new Map<string, { orders: SalesOrder[]; account?: Account }>();
  for (const o of windowOrders) {
    const key = o.account || "Unknown";
    const cur = retailByName.get(key) ?? { orders: [] };
    cur.orders.push(o);
    if (!cur.account) {
      cur.account = retailAccounts.find(
        (a) =>
          a.tradingName === key ||
          a.legalName === key ||
          a.name === key,
      );
    }
    retailByName.set(key, cur);
  }

  const retailRows: RetailSalesRow[] = [];

  for (const [name, { orders: acctOrders, account }] of retailByName) {
    const revenue = acctOrders.reduce((s, o) => s + (o.price || 0), 0);
    const st = account?.status === "active" ? "green" : account?.status === "inactive" ? "red" : "amber";
    retailRows.push({
      id: account?.id ?? name,
      name,
      type: account?.type ? account.type.charAt(0).toUpperCase() + account.type.slice(1) : "Retail",
      revenue: formatMoney(revenue),
      revenueRaw: revenue,
      orders: acctOrders.length,
      statusTone: st === "green" ? "green" : st === "red" ? "red" : "amber",
      statusLabel: st === "green" ? "active" : st === "red" ? "inactive" : "watch",
    });
  }

  for (const acc of retailAccounts) {
    if (retailRows.some((r) => r.id === acc.id || r.name === acc.tradingName)) continue;
    retailRows.push({
      id: acc.id,
      name: acc.tradingName,
      type: acc.type.charAt(0).toUpperCase() + acc.type.slice(1),
      revenue: formatMoney(salesByAccountName(windowOrders, acc.tradingName)),
      revenueRaw: salesByAccountName(windowOrders, acc.tradingName),
      orders: windowOrders.filter((o) => o.account === acc.tradingName).length,
      statusTone: acc.status === "active" ? "green" : "amber",
      statusLabel: acc.status === "active" ? "active" : "watch",
    });
  }

  retailRows.sort((a, b) => b.revenueRaw - a.revenueRaw);

  return {
    market,
    q2Revenue: formatMoney(q2RevenueRaw),
    q2RevenueRaw,
    casesMoved,
    reps: repRows,
    retail: retailRows,
  };
}

function salesByAccountName(orders: SalesOrder[], name: string): number {
  return orders.filter((o) => o.account === name).reduce((s, o) => s + (o.price || 0), 0);
}
