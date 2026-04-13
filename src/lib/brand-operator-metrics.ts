/**
 * Derived metrics for the Brand Operator control panel (HQ command center).
 */
import type { AppData } from "@/types/app-data";
import type { Account, InventoryItem, Product, SalesOrder, Shipment } from "@/data/mockData";
import { orderLineEntries } from "@/lib/order-lines";
import type { DerivedAlert } from "@/lib/hajime-metrics";
import {
  cityKeyFromMarket,
  computeInventorySummary,
  computeTopAccounts,
  computeReorderRecommendations,
  isRetailChannelOrder,
  velocityBySku,
} from "@/lib/hajime-metrics";

const MS_DAY = 86400000;

export type MarketPanelRow = {
  id: string;
  label: string;
  stockCases: number;
  sold30dCases: number;
  daysCover: number | null;
  health: "healthy" | "watch" | "low";
  note?: string;
};

export type PendingApprovalItem = {
  order: SalesOrder;
  account: Account | undefined;
  city: string;
  requestedCases: number;
  primarySku: string;
  availableCasesInMarket: number;
  orderDateLabel: string;
  accountLabel: string;
};

export type DecisionAlert = {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  body: string;
  action: string;
  source: string;
};

/** Maps `deriveAlerts` rows into the command-center card shape — same rules as Alerts hub. */
export function mapDerivedAlertsToDecisionAlerts(alerts: DerivedAlert[]): DecisionAlert[] {
  return alerts.map((a) => ({
    id: `queue-${a.id}`,
    severity: a.severity === "high" ? "high" : a.severity === "medium" ? "medium" : "low",
    title: derivedAlertTitle(a),
    body: a.message,
    action: derivedAlertAction(a.type),
    source: derivedAlertSource(a.type),
  }));
}

function derivedAlertTitle(a: DerivedAlert): string {
  switch (a.type) {
    case "low-stock":
      return a.message.split("—")[0]?.trim() ?? "Low stock";
    case "delay":
      return "Production delay";
    case "shipment":
      return "Shipment exception";
    case "payment":
      return "Payment overdue";
    case "reorder":
      return "Reorder signal";
    case "demand-spike":
      return "Demand spike";
    default:
      return "Operations";
  }
}

function derivedAlertAction(type: DerivedAlert["type"]): string {
  switch (type) {
    case "low-stock":
      return "Rebalance allocation or raise production for this SKU.";
    case "delay":
      return "Coordinate with the manufacturer and update dependent shipments.";
    case "shipment":
      return "Contact the carrier for status or send the customer a revised ETA.";
    case "payment":
      return "Send a payment reminder or hold release until settled.";
    case "reorder":
      return "Confirm PO coverage against lead time and safety stock.";
    case "demand-spike":
      return "Stage inventory or expedite inbound to protect fill rate.";
    default:
      return "Review in Orders or Inventory.";
  }
}

function derivedAlertSource(type: DerivedAlert["type"]): string {
  switch (type) {
    case "low-stock":
      return "Inventory";
    case "delay":
      return "Production";
    case "shipment":
      return "Logistics";
    case "payment":
      return "AR";
    case "reorder":
      return "Planning";
    case "demand-spike":
      return "Demand";
    default:
      return "HQ";
  }
}

export type VelocityPoint = { label: string; bottles: number; revenue: number };

export type TopAccountRow = {
  name: string;
  city: string;
  country: string;
  lastOrderDate: string;
  monthlyValue: number;
  trendPct: number;
  reorderLikelihood: "high" | "medium" | "low";
  strategic: boolean;
};

export type MarketReplenishmentSuggestion = {
  id: string;
  market: string;
  recommendedCases: number;
  reason: string;
  urgency: "high" | "medium" | "low";
};

function caseSizeForSku(products: Product[], sku: string): number {
  return products.find((p) => p.sku === sku)?.caseSize ?? 12;
}

function bottlesToCases(bottles: number, caseSize: number): number {
  if (caseSize <= 0) return 0;
  return Math.round((bottles / caseSize) * 10) / 10;
}

function sumWarehouseAvailable(inv: InventoryItem[], pred: (w: string) => boolean): number {
  let s = 0;
  for (const row of inv) {
    if (row.status !== "available") continue;
    if (pred(row.warehouse?.toLowerCase() || "")) s += row.quantityBottles;
  }
  return s;
}

function sumInTransitTo(inv: InventoryItem[], pred: (w: string) => boolean): number {
  let s = 0;
  for (const row of inv) {
    if (row.status !== "in-transit") continue;
    if (pred(row.warehouse?.toLowerCase() || "")) s += row.quantityBottles;
  }
  return s;
}

/** Approximate sellable pool addressable for a demand market (V1 heuristic). */
function stockBottlesForDemandMarket(inv: InventoryItem[], marketKey: string): number {
  const m = marketKey?.toLowerCase() || "";
  if (m === "toronto") {
    return sumWarehouseAvailable(inv, (w) => w.includes("toronto")) + sumInTransitTo(inv, (w) => w.includes("toronto"));
  }
  if (m === "milan") {
    return sumWarehouseAvailable(inv, (w) => w.includes("milan")) + sumInTransitTo(inv, (w) => w.includes("milan"));
  }
  if (m === "ontario lcbo" || m === "ontario") {
    return sumWarehouseAvailable(inv, (w) => w.includes("toronto")) * 0.55;
  }
  if (m === "paris") {
    return sumWarehouseAvailable(inv, (w) => w.includes("paris")) + sumInTransitTo(inv, (w) => w.includes("paris"));
  }
  return 0;
}

function orderBottlesInWindow(o: SalesOrder, startMs: number, endMs: number): number {
  const t = Date.parse(o.orderDate);
  if (Number.isNaN(t) || t < startMs || t > endMs) return 0;
  if (o.status === "cancelled" || o.status === "draft") return 0;
  return orderLineEntries(o).reduce((a, l) => a + l.quantityBottles, 0);
}

function soldBottles30dForMarketPredicate(
  orders: SalesOrder[],
  windowDays: number,
  pred: (market: string) => boolean,
  now = new Date(),
): number {
  const end = now.getTime();
  const start = end - windowDays * MS_DAY;
  let s = 0;
  for (const o of orders) {
    if (!pred(o.market)) continue;
    s += orderBottlesInWindow(o, start, end);
  }
  return s;
}

function healthFromDays(days: number | null): MarketPanelRow["health"] {
  if (days === null) return "watch";
  if (days >= 21) return "healthy";
  if (days >= 8) return "watch";
  return "low";
}

export function computeMarketPanelRows(data: AppData, windowDays: number, now = new Date()): MarketPanelRow[] {
  const { inventory, salesOrders } = data;
  const defaultCase = 12;

  const defs: { id: string; label: string; marketPred: (m: string) => boolean; stockKey: string }[] = [
    {
      id: "toronto",
      label: "Toronto",
      marketPred: (m) => cityKeyFromMarket(m) === "Toronto",
      stockKey: "toronto",
    },
    {
      id: "milan",
      label: "Milan",
      marketPred: (m) => cityKeyFromMarket(m) === "Milan",
      stockKey: "milan",
    },
    {
      id: "paris",
      label: "Paris",
      marketPred: (m) => cityKeyFromMarket(m) === "Paris",
      stockKey: "paris",
    },
    {
      id: "ontario",
      label: "Ontario LCBO",
      marketPred: (m) => (m?.toLowerCase() || "").includes("ontario"),
      stockKey: "ontario",
    },
    {
      id: "spain",
      label: "Spain",
      marketPred: (m) => (m?.toLowerCase() || "").includes("spain") || (m?.toLowerCase() || "").includes("madrid"),
      stockKey: "spain",
    },
  ];

  return defs.map((d) => {
    const stockBottles = stockBottlesForDemandMarket(inventory, d.stockKey);
    const soldBottles = soldBottles30dForMarketPredicate(salesOrders, windowDays, d.marketPred, now);
    const stockCases = bottlesToCases(stockBottles, defaultCase);
    const soldCases = bottlesToCases(soldBottles, defaultCase);
    const daily = soldBottles / Math.max(1, windowDays);
    const daysCover = daily > 0.5 ? stockBottles / daily : soldBottles > 0 ? null : null;
    const note =
      d.id === "paris" && stockBottles < 1 && soldBottles > 0
        ? "No local depot row — velocity from Paris sell-in"
        : d.id === "spain" && soldBottles < 1
          ? "No activity in seed data"
          : undefined;

    return {
      id: d.id,
      label: d.label,
      stockCases,
      sold30dCases: Math.round(soldCases * 10) / 10,
      daysCover: daysCover !== null ? Math.round(daysCover) : null,
      health: healthFromDays(daysCover),
      note,
    };
  });
}

export function buildPendingApprovalItems(
  data: AppData,
): PendingApprovalItem[] {
  const { salesOrders, accounts, products, inventory } = data;
  const out: PendingApprovalItem[] = [];
  /** Same scope as Orders → Pending review tab (all drafts, incl. hotel / lifestyle). */
  for (const o of salesOrders) {
    if (o.status !== "draft") continue;
    const acc = accounts.find((a) => a.tradingName === o.account || a.legalName === o.account);
    const lines = orderLineEntries(o);
    const primary = lines[0];
    const sku = primary?.sku ?? o.sku;
    const cs = caseSizeForSku(products, sku);
    const reqBottles = lines.reduce((a, l) => a + l.quantityBottles, o.quantity);
    const requestedCases = bottlesToCases(reqBottles, cs);
    const mk = o.market?.toLowerCase() || "";
    let stockKey = "toronto";
    if (mk.includes("milan") || mk.includes("milano")) stockKey = "milan";
    if (mk.includes("paris")) stockKey = "paris";
    if (mk.includes("ontario")) stockKey = "ontario";
    let skuAvail = 0;
    for (const row of inventory) {
      if (row.sku !== sku || row.status !== "available") continue;
      const w = row.warehouse?.toLowerCase() || "";
      if (stockKey === "toronto" && w.includes("toronto")) skuAvail += row.quantityBottles;
      else if (stockKey === "milan" && w.includes("milan")) skuAvail += row.quantityBottles;
      else if (stockKey === "paris" && w.includes("paris")) skuAvail += row.quantityBottles;
      else if (stockKey === "ontario" && w.includes("toronto")) skuAvail += row.quantityBottles;
    }
    if (skuAvail < 1) {
      for (const row of inventory) {
        if (row.sku === sku && row.status === "available") skuAvail += row.quantityBottles;
      }
    }
    const availableCasesInMarket = bottlesToCases(skuAvail, cs);
    const keyAccount = acc?.tags?.includes("key-account");
    const accountLabel = keyAccount ? "Key account" : acc?.status === "active" ? "Active" : acc?.status ?? "Account";

    out.push({
      order: o,
      account: acc,
      city: acc?.city ?? o.market,
      requestedCases,
      primarySku: sku,
      availableCasesInMarket,
      orderDateLabel: o.orderDate,
      accountLabel,
    });
  }
  return out.sort((a, b) => b.order.orderDate.localeCompare(a.order.orderDate));
}

/** Order count per week (non-cancelled), aligned with velocity week buckets. */
export function computeWeeklyOrderCounts(orders: SalesOrder[], weeks = 10, now = new Date()) {
  const points: { label: string; orders: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date(now);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    const startMs = start.getTime();
    const endMs = end.getTime();
    let ordersN = 0;
    for (const o of orders) {
      if (o.status === "cancelled") continue;
      const t = Date.parse(o.orderDate);
      if (Number.isNaN(t) || t < startMs || t > endMs) continue;
      ordersN += 1;
    }
    const label = `${start.getMonth() + 1}/${start.getDate()}`;
    points.push({ label, orders: ordersN });
  }
  return points;
}

export function computeWeeklyVelocitySeries(
  orders: SalesOrder[],
  weeks = 10,
  now = new Date(),
): VelocityPoint[] {
  const points: VelocityPoint[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date(now);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    const startMs = start.getTime();
    const endMs = end.getTime();
    let bottles = 0;
    let revenue = 0;
    for (const o of orders) {
      if (o.status === "cancelled" || o.status === "draft") continue;
      const t = Date.parse(o.orderDate);
      if (Number.isNaN(t) || t < startMs || t > endMs) continue;
      revenue += o.price;
      bottles += orderLineEntries(o).reduce((a, l) => a + l.quantityBottles, o.quantity);
    }
    const label = `${start.getMonth() + 1}/${start.getDate()}`;
    points.push({ label, bottles, revenue });
  }
  return points;
}

export function computeVelocityByAccountLastWindow(
  orders: SalesOrder[],
  windowDays: number,
  now = new Date(),
): { name: string; bottles: number }[] {
  const end = now.getTime();
  const start = end - windowDays * MS_DAY;
  const map: Record<string, number> = {};
  for (const o of orders) {
    if (o.status === "cancelled" || o.status === "draft") continue;
    const t = Date.parse(o.orderDate);
    if (Number.isNaN(t) || t < start || t > end) continue;
    const k = o.account.trim() || "Unknown";
    map[k] = (map[k] ?? 0) + orderLineEntries(o).reduce((a, l) => a + l.quantityBottles, o.quantity);
  }
  return Object.entries(map)
    .map(([name, bottles]) => ({ name, bottles }))
    .sort((a, b) => b.bottles - a.bottles)
    .slice(0, 8);
}

export function computeVelocityByMarketLastWindow(
  orders: SalesOrder[],
  windowDays: number,
  now = new Date(),
): { name: string; bottles: number }[] {
  const end = now.getTime();
  const start = end - windowDays * MS_DAY;
  const map: Record<string, number> = {};
  for (const o of orders) {
    if (o.status === "cancelled" || o.status === "draft") continue;
    const t = Date.parse(o.orderDate);
    if (Number.isNaN(t) || t < start || t > end) continue;
    const k = o.market.trim() || "Other";
    map[k] = (map[k] ?? 0) + orderLineEntries(o).reduce((a, l) => a + l.quantityBottles, o.quantity);
  }
  return Object.entries(map)
    .map(([name, bottles]) => ({ name, bottles }))
    .sort((a, b) => b.bottles - a.bottles)
    .slice(0, 8);
}

export function computeVelocityByProduct(
  orders: SalesOrder[],
  windowDays: number,
  now = new Date(),
): { sku: string; bottles: number }[] {
  const v = velocityBySku(orders, windowDays);
  return Object.entries(v)
    .map(([sku, bottles]) => ({ sku, bottles }))
    .sort((a, b) => b.bottles - a.bottles)
    .slice(0, 8);
}

export function countShipmentEtaAlerts(shipments: Shipment[], now = new Date()): number {
  const today = now.toISOString().slice(0, 10);
  let n = 0;
  for (const s of shipments) {
    if (s.status === "delayed") n += 1;
    else if (!s.actualDelivery && s.eta && s.eta < today && s.status !== "delivered") n += 1;
  }
  return n;
}

export function sellThroughPercent30d(orders: SalesOrder[], inventory: InventoryItem[], now = new Date()): number {
  const summary = computeInventorySummary(inventory);
  const pool = summary.available + summary.reserved;
  const end = now.getTime();
  const start = end - 30 * MS_DAY;
  let sold = 0;
  for (const o of orders) {
    if (o.status === "cancelled" || o.status === "draft") continue;
    const t = Date.parse(o.orderDate);
    if (Number.isNaN(t) || t < start || t > end) continue;
    sold += orderLineEntries(o).reduce((a, l) => a + l.quantityBottles, o.quantity);
  }
  if (pool < 1) return sold > 0 ? 100 : 0;
  return Math.min(999, Math.round((sold / pool) * 1000) / 10);
}

export function countLowStockMarkets(rows: MarketPanelRow[]): number {
  return rows.filter((r) => r.health === "low").length;
}

export function computeBrandOperatorDecisionAlerts(data: AppData, now = new Date()): DecisionAlert[] {
  const alerts: DecisionAlert[] = [];
  const panels = computeMarketPanelRows(data, 30, now);
  for (const p of panels) {
    if (p.health === "low" && p.daysCover !== null && p.daysCover < 14) {
      alerts.push({
        id: `mkt-${p.id}`,
        severity: p.daysCover < 8 ? "critical" : "high",
        title: `Low cover — ${p.label}`,
        body: `About ${p.daysCover} days of stock at current ${p.sold30dCases.toFixed(1)} cases / 30d velocity.`,
        action: p.id === "milan" ? "Approve replenishment or reallocate from Toronto hub." : "Review PO pipeline and rebalance allocation.",
        source: "Inventory model",
      });
    }
  }

  const stalled = data.salesOrders.filter((o) => {
    if (o.status !== "draft" || !isRetailChannelOrder(o, data.accounts)) return false;
    const t = Date.parse(o.orderDate);
    return !Number.isNaN(t) && now.getTime() - t > 5 * MS_DAY;
  });
  if (stalled.length) {
    alerts.push({
      id: "stalled-approvals",
      severity: "medium",
      title: "Stalled order approvals",
      body: `${stalled.length} retail draft(s) waiting more than 5 days.`,
      action: "Clear the approval queue or follow up with the account.",
      source: "Orders",
    });
  }

  for (const acc of data.accounts) {
    if (!acc.tags.includes("key-account") || acc.status !== "active") continue;
    const last = acc.lastOrderDate ? Date.parse(acc.lastOrderDate) : NaN;
    if (Number.isNaN(last) || now.getTime() - last < 75 * MS_DAY) continue;
    alerts.push({
      id: `inactive-${acc.id}`,
      severity: "medium",
      title: `Quiet key account — ${acc.tradingName}`,
      body: `No order in ~${Math.round((now.getTime() - last) / MS_DAY)} days (${acc.city}).`,
      action: "Schedule a rep touchpoint or share a targeted allocation offer.",
      source: "Accounts",
    });
  }

  const recs = computeReorderRecommendations(data, now).filter((r) => r.urgency === "high");
  for (const r of recs.slice(0, 2)) {
    alerts.push({
      id: `reorder-${r.sku}`,
      severity: "high",
      title: `Backorder risk — ${r.sku}`,
      body: r.summary,
      action: "Raise or expedite a production request for this SKU.",
      source: "Planning",
    });
  }

  alerts.sort((a, b) => {
    const rank = { critical: 0, high: 1, medium: 2, low: 3 };
    return rank[a.severity] - rank[b.severity];
  });
  return alerts.slice(0, 12);
}

export function computeMarketReplenishmentSuggestions(data: AppData, now = new Date()): MarketReplenishmentSuggestion[] {
  const panels = computeMarketPanelRows(data, 30, now);
  const leadDays = data.operationalSettings?.manufacturerLeadTimeDays ?? 45;
  const out: MarketReplenishmentSuggestion[] = [];
  for (const p of panels) {
    if (p.health === "healthy" && (p.daysCover === null || p.daysCover > 25)) continue;
    const dailyCases = p.sold30dCases / 30;
    const targetDays = leadDays + 14;
    const needCases = Math.max(0, Math.ceil(dailyCases * targetDays - p.stockCases));
    if (needCases < 2 && p.health !== "low" && p.health !== "watch") continue;
    const urgency: MarketReplenishmentSuggestion["urgency"] =
      p.health === "low" || (p.daysCover !== null && p.daysCover < 10) ? "high" : "medium";
    out.push({
      id: `repl-${p.id}`,
      market: p.label,
      recommendedCases: Math.max(needCases, p.health === "low" ? 12 : 6),
      reason: `Stock ~${p.stockCases} cases, ${p.sold30dCases.toFixed(1)} cases / 30d, lead ~${leadDays}d.`,
      urgency,
    });
  }
  return out.slice(0, 5);
}

/** One line per open PO — ties replenishment narrative to production requests (same rows as /purchase-orders). */
export function computeProductionLinkedReplenishment(data: AppData): MarketReplenishmentSuggestion[] {
  const open = data.purchaseOrders.filter((p) => !["delivered", "completed", "shipped"].includes(p.status));
  return open.map((po) => ({
    id: `repl-po-${po.id}`,
    market: po.marketDestination,
    recommendedCases: Math.max(6, Math.ceil(po.quantity / 12)),
    reason: `${po.id} (${po.status}) — ${po.sku} · ${po.quantity.toLocaleString()} btl to ${po.marketDestination}; ship target ${po.requestedShipDate}.`,
    urgency: po.status === "delayed" ? "high" : po.status === "draft" ? "medium" : "medium",
  }));
}

/**
 * Command center + Markets: market velocity first, then open PO lines (same POs as /purchase-orders) by id.
 * If velocity yields nothing, surface PO hints so Replenishment stays tied to Production requests.
 */
export function computeHQReplenishmentSuggestions(data: AppData, now = new Date()): MarketReplenishmentSuggestion[] {
  const market = computeMarketReplenishmentSuggestions(data, now);
  const poHints = computeProductionLinkedReplenishment(data);
  const ids = new Set(market.map((m) => m.id));
  const out = [...market];
  for (const p of poHints) {
    if (out.length >= 8) break;
    if (!ids.has(p.id)) {
      out.push(p);
      ids.add(p.id);
    }
  }
  if (out.length > 0) return out.slice(0, 8);
  return poHints.slice(0, 5);
}

export function computeBrandOperatorTopAccounts(
  orders: SalesOrder[],
  accounts: Account[],
  now = new Date(),
): TopAccountRow[] {
  const base = computeTopAccounts(orders, 12);
  const end = now.getTime();
  const mid = end - 30 * MS_DAY;
  const start = mid - 30 * MS_DAY;

  return base.map((row) => {
    const acc = accounts.find((a) => a.tradingName === row.name);
    let recent = 0;
    let prior = 0;
    for (const o of orders) {
      if (o.account !== row.name || o.status === "cancelled" || o.status === "draft") continue;
      const t = Date.parse(o.orderDate);
      if (Number.isNaN(t)) continue;
      if (t >= mid && t <= end) recent += o.price;
      else if (t >= start && t < mid) prior += o.price;
    }
    const trendPct = prior <= 0 ? (recent > 0 ? 100 : 0) : Math.round(((recent - prior) / prior) * 1000) / 10;
    const last = acc?.lastOrderDate ?? "";
    const lastMs = last ? Date.parse(last) : NaN;
    const daysSince = Number.isNaN(lastMs) ? 999 : Math.round((end - lastMs) / MS_DAY);
    let reorderLikelihood: TopAccountRow["reorderLikelihood"] = "medium";
    if (daysSince > 28 && row.revenue > 20000) reorderLikelihood = "high";
    else if (daysSince < 10) reorderLikelihood = "low";

    return {
      name: row.name,
      city: acc?.city ?? "—",
      country: acc?.country ?? "—",
      lastOrderDate: last || "—",
      monthlyValue: recent,
      trendPct,
      reorderLikelihood,
      strategic: Boolean(acc?.tags.includes("key-account")),
    };
  });
}

export function mapShipmentStatusLabel(s: Shipment): string {
  if (s.status === "delayed") return "Delayed";
  if (s.status === "delivered") return "Delivered";
  if (s.type === "inbound" && s.status === "in-transit") return "In transit / customs";
  if (s.status === "preparing") return "Preparing";
  return "In transit";
}

/** Depletion-based velocity: bottles sold from distributor reports (actual sell-through). */
export function computeDepletionVelocity(
  depletionReports: import("@/data/mockData").DepletionReport[],
  days = 30,
  now = new Date(),
): number {
  const cutoff = now.getTime() - days * MS_DAY;
  return depletionReports
    .filter((r) => Date.parse(r.periodEnd) >= cutoff)
    .reduce((sum, r) => sum + r.bottlesSold, 0);
}

/** Depletion-based sell-through %: sold / (sold + on-hand at end of period). */
export function computeDepletionSellThrough(
  depletionReports: import("@/data/mockData").DepletionReport[],
  days = 30,
  now = new Date(),
): number {
  const cutoff = now.getTime() - days * MS_DAY;
  const relevant = depletionReports.filter((r) => Date.parse(r.periodEnd) >= cutoff);
  const sold = relevant.reduce((sum, r) => sum + r.bottlesSold, 0);
  const onHand = relevant.reduce((sum, r) => sum + r.bottlesOnHandAtEnd, 0);
  const total = sold + onHand;
  if (total <= 0) return 0;
  return Math.min(100, Math.round((sold / total) * 1000) / 10);
}

/** Per-account depletion summary for Brand Operator dashboards. */
export type AccountDepletionSummary = {
  accountId: string;
  accountName: string;
  totalSold30d: number;
  totalOnHand: number;
  sellThroughPct: number;
  flagged: boolean;
  lastReportDate: string;
  topSku: string;
};

export function computeAccountDepletionSummaries(
  depletionReports: import("@/data/mockData").DepletionReport[],
  accounts: Account[],
  days = 30,
  now = new Date(),
): AccountDepletionSummary[] {
  const cutoff = now.getTime() - days * MS_DAY;
  const byAccount = new Map<string, import("@/data/mockData").DepletionReport[]>();
  for (const r of depletionReports) {
    if (Date.parse(r.periodEnd) < cutoff) continue;
    const arr = byAccount.get(r.accountId) ?? [];
    arr.push(r);
    byAccount.set(r.accountId, arr);
  }

  const out: AccountDepletionSummary[] = [];
  for (const [accountId, reports] of byAccount) {
    const acc = accounts.find((a) => a.id === accountId);
    const totalSold = reports.reduce((s, r) => s + r.bottlesSold, 0);
    const totalOnHand = reports.reduce((s, r) => s + r.bottlesOnHandAtEnd, 0);
    const total = totalSold + totalOnHand;
    const sellThroughPct = total <= 0 ? 0 : Math.min(100, Math.round((totalSold / total) * 1000) / 10);
    const flagged = reports.some((r) => r.flaggedForReplenishment);
    const lastReport = reports.sort((a, b) => Date.parse(b.periodEnd) - Date.parse(a.periodEnd))[0];
    const skuCounts = new Map<string, number>();
    for (const r of reports) {
      skuCounts.set(r.sku, (skuCounts.get(r.sku) ?? 0) + r.bottlesSold);
    }
    const topSku = Array.from(skuCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
    out.push({
      accountId,
      accountName: acc?.tradingName || acc?.legalName || accountId,
      totalSold30d: totalSold,
      totalOnHand,
      sellThroughPct,
      flagged,
      lastReportDate: lastReport?.periodEnd ?? "",
      topSku,
    });
  }
  return out.sort((a, b) => b.totalSold30d - a.totalSold30d);
}
