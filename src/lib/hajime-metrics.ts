/**
 * Live KPIs and alerts derived from persisted AppData (Hajime B2B brief §6, §8, §16).
 * Available sellable units = sum of inventory rows with status "available" (bucketed model).
 * Brief “planning” view: reserved / in-production / in-transit are tracked separately for founder visibility.
 */
import type { AppData } from "@/types/app-data";
import type { InventoryItem, SalesOrder } from "@/data/mockData";
import { orderLineEntries } from "@/lib/order-lines";

const MS_DAY = 86400000;

/**
 * Anchor “today” for analytics windows: max(real now, latest order date).
 * Keeps seeded orders (e.g. dated next year) inside trailing 30/90d charts when the browser clock lags the demo timeline.
 */
export function analyticsAsOfDateFromOrders(orders: SalesOrder[]): Date {
  let maxT = Date.now();
  for (const o of orders) {
    const t = Date.parse(o.orderDate);
    if (!Number.isNaN(t)) maxT = Math.max(maxT, t);
  }
  return new Date(maxT);
}

function sumBottles(items: InventoryItem[], pred: (i: InventoryItem) => boolean): number {
  let s = 0;
  for (const i of items) {
    if (pred(i)) s += i.quantityBottles;
  }
  return s;
}

export function computeInventorySummary(inventory: InventoryItem[]) {
  const available = sumBottles(inventory, (i) => i.status === "available");
  const reserved = sumBottles(inventory, (i) => i.status === "reserved");
  const inTransit = sumBottles(inventory, (i) => i.status === "in-transit");
  const inProduction = sumBottles(inventory, (i) => i.status === "in-production");
  const damaged = sumBottles(inventory, (i) => i.status === "damaged");
  const totalOnHand = inventory.reduce((a, i) => a + i.quantityBottles, 0);
  return { totalOnHand, available, reserved, inTransit, inProduction, damaged };
}

/** Bottles sold (sell-in) per SKU from recent orders — uses orderDate within windowDays. */
export function velocityBySku(orders: SalesOrder[], windowDays = 90): Record<string, number> {
  const cutoff = Date.now() - windowDays * MS_DAY;
  const map: Record<string, number> = {};
  for (const o of orders) {
    if (o.status === "cancelled" || o.status === "draft") continue;
    const t = Date.parse(o.orderDate);
    if (Number.isNaN(t) || t < cutoff) continue;
    for (const line of orderLineEntries(o)) {
      map[line.sku] = (map[line.sku] ?? 0) + line.quantityBottles;
    }
  }
  return map;
}

export function computeSalesSummary(orders: SalesOrder[], now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const startWeek = new Date(y, m, d - 6).getTime();
  const startMonth = new Date(y, m, 1).getTime();
  const qStartMonth = m - (m % 3);
  const startQuarter = new Date(y, qStartMonth, 1).getTime();

  const revenueInRange = (start: number) =>
    orders
      .filter((o) => o.status !== "cancelled" && o.status !== "draft")
      .filter((o) => {
        const t = Date.parse(o.orderDate);
        return !Number.isNaN(t) && t >= start;
      })
      .reduce((a, o) => a + o.price, 0);

  const openOrders = orders.filter((o) => !["delivered", "cancelled", "draft"].includes(o.status)).length;

  return {
    thisWeek: revenueInRange(startWeek),
    thisMonth: revenueInRange(startMonth),
    thisQuarter: revenueInRange(startQuarter),
    openOrders,
    currency: "CAD" as const,
  };
}

export type DerivedAlert = {
  id: string;
  type: "low-stock" | "delay" | "reorder" | "shipment" | "payment" | "account" | "demand-spike" | "onboarding";
  message: string;
  time: string;
  severity: "high" | "medium" | "low";
};

function daysFromNow(iso: string): number | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.round((t - Date.now()) / MS_DAY);
}

/** Last-7d vs prior-7d sell-in (excludes draft/cancelled) for spike detection. */
function segmentSellIn(
  orders: SalesOrder[],
  startMs: number,
  endMs: number,
  city: "Toronto" | "Milan" | "global",
): { revenue: number; count: number } {
  let revenue = 0;
  let count = 0;
  for (const o of orders) {
    if (o.status === "cancelled" || o.status === "draft") continue;
    const t = Date.parse(o.orderDate);
    if (Number.isNaN(t) || t < startMs || t >= endMs) continue;
    const m = o.market?.trim().toLowerCase() || "";
    if (city === "Toronto" && !m.includes("toronto") && !m.includes("ontario")) continue;
    if (city === "Milan" && !m.includes("milan") && !m.includes("milano")) continue;
    revenue += o.price;
    count += 1;
  }
  return { revenue, count };
}

function isDemandSpike(recent: { revenue: number; count: number }, prior: { revenue: number; count: number }): boolean {
  if (recent.count < 2) return false;
  if (prior.count === 0) return recent.count >= 2;
  if (recent.count >= Math.ceil(prior.count * 1.5)) return true;
  if (prior.revenue > 0 && recent.revenue >= prior.revenue * 1.5) return true;
  return false;
}

function appendDemandSpikeAlerts(alerts: DerivedAlert[], orders: SalesOrder[], now: Date) {
  const t0 = now.getTime();
  const lastStart = t0 - 7 * MS_DAY;
  const prevStart = t0 - 14 * MS_DAY;
  const segments: { id: string; label: string; city: "Toronto" | "Milan" | "global" }[] = [
    { id: "demand-spike-toronto", label: "Toronto", city: "Toronto" },
    { id: "demand-spike-milan", label: "Milan", city: "Milan" },
    { id: "demand-spike-global", label: "All markets", city: "global" },
  ];
  for (const seg of segments) {
    const recent = segmentSellIn(orders, lastStart, t0, seg.city);
    const prior = segmentSellIn(orders, prevStart, lastStart, seg.city);
    if (!isDemandSpike(recent, prior)) continue;
    const revR = `$${recent.revenue.toLocaleString()}`;
    const revP = `$${prior.revenue.toLocaleString()}`;
    const scope = seg.city === "global" ? "Sell-in" : `${seg.label} market`;
    alerts.push({
      id: seg.id,
      type: "demand-spike",
      message: `${scope} demand spike — ${recent.count} orders (${revR}) last 7d vs ${prior.count} orders (${revP}) prior 7d`,
      time: "now",
      severity: prior.count > 0 && recent.count >= prior.count * 2 ? "high" : "medium",
    });
  }
}

export function deriveAlerts(data: AppData, now = new Date()): DerivedAlert[] {
  const alerts: DerivedAlert[] = [];
  const settings = data.operationalSettings;
  const inv = data.inventory;
  const bySkuAvailable: Record<string, number> = {};
  for (const row of inv) {
    if (row.status !== "available") continue;
    bySkuAvailable[row.sku] = (bySkuAvailable[row.sku] ?? 0) + row.quantityBottles;
  }

  const safety = settings?.safetyStockBySku ?? {};
  const defaultSafety = 120;
  for (const sku of new Set(inv.map((i) => i.sku))) {
    const avail = bySkuAvailable[sku] ?? 0;
    const th = safety[sku] ?? defaultSafety;
    if (avail < th) {
      alerts.push({
        id: `low-${sku}`,
        type: "low-stock",
        message: `${sku} — available ${avail.toLocaleString()} bottles (below threshold ${th})`,
        time: "now",
        severity: avail < th * 0.5 ? "high" : "medium",
      });
    }
  }

  const shelfTh = settings?.retailerStockThresholdBottles ?? 48;
  const shelfMap = data.retailerShelfStock ?? {};
  const retailTypes = new Set(["retail", "bar", "restaurant", "hotel", "lifestyle"]);
  for (const acc of data.accounts) {
    if (!retailTypes.has(acc.type)) continue;
    const perSku = shelfMap[acc.id];
    if (!perSku) continue;
    for (const [sku, bottles] of Object.entries(perSku)) {
      if (bottles >= shelfTh) continue;
      alerts.push({
        id: `retail-shelf-${acc.id}-${sku}`,
        type: "low-stock",
        message: `${acc.tradingName} — on-premise ${sku}: ${bottles} bottles (below retail threshold ${shelfTh}) — reorder or escalate`,
        time: "now",
        severity: bottles < shelfTh * 0.5 ? "high" : "medium",
      });
    }
  }

  appendDemandSpikeAlerts(alerts, data.salesOrders, now);

  for (const po of data.purchaseOrders) {
    if (po.status === "delayed") {
      alerts.push({
        id: `po-delay-${po.id}`,
        type: "delay",
        message: `${po.id} production delayed — ${po.notes || "See PO details"}`,
        time: po.issueDate,
        severity: "high",
      });
    }
  }

  const today = now.toISOString().slice(0, 10);
  for (const sh of data.shipments) {
    if (sh.status === "delayed") {
      alerts.push({
        id: `sh-${sh.id}`,
        type: "shipment",
        message: `Shipment ${sh.id} delayed — ${sh.destination}`,
        time: sh.shipDate,
        severity: "medium",
      });
    } else if (!sh.actualDelivery && sh.eta && sh.eta < today && sh.status !== "delivered") {
      alerts.push({
        id: `sh-late-${sh.id}`,
        type: "shipment",
        message: `Shipment ${sh.id} past ETA (${sh.eta}) — ${sh.destination}`,
        time: sh.eta,
        severity: "high",
      });
    }
  }

  for (const o of data.salesOrders) {
    if (o.paymentStatus === "overdue") {
      alerts.push({
        id: `pay-${o.id}`,
        type: "payment",
        message: `Overdue payment — ${o.account} (${o.id})`,
        time: o.orderDate,
        severity: "medium",
      });
    }
  }

  const recs = computeReorderRecommendations(data, now);
  for (const r of recs.filter((x) => x.urgency === "high")) {
    alerts.push({
      id: `reorder-${r.sku}`,
      type: "reorder",
      message: r.summary,
      time: "now",
      severity: "high",
    });
  }

  // Onboarding pipeline alerts for distributors and brand operators
  const onboardingAccounts = data.accounts.filter(
    (a) => a.onboardingPipeline === "sales_intake" || a.onboardingPipeline === "brand_review"
  );
  for (const acc of onboardingAccounts) {
    const stage = acc.onboardingPipeline === "sales_intake" ? "Wholesaler review" : "Brand approval";
    const severity = acc.onboardingPipeline === "brand_review" ? "high" : "medium";
    alerts.push({
      id: `onboarding-${acc.id}`,
      type: "onboarding",
      message: `${acc.tradingName} — retailer onboarding awaiting ${stage}`,
      time: acc.applicationSubmittedAt?.slice(0, 10) || "now",
      severity,
    });
  }

  alerts.sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 };
    return rank[a.severity] - rank[b.severity];
  });

  return alerts.slice(0, 20);
}

export type ReorderRec = {
  sku: string;
  summary: string;
  suggestedBottles: number;
  daysCover: number | null;
  urgency: "high" | "medium" | "low";
};

/** Rules-based reorder (brief §5.E, §8.9): velocity + on-hand + in-production + lead time + safety stock. */
export function computeReorderRecommendations(data: AppData, now = new Date()): ReorderRec[] {
  const leadDays = data.operationalSettings?.manufacturerLeadTimeDays ?? 45;
  const safetyMap = data.operationalSettings?.safetyStockBySku ?? {};
  const defaultSafety = 200;
  const velocity = velocityBySku(data.salesOrders, 120);
  const inv = data.inventory;
  const availableBySku: Record<string, number> = {};
  const inProdBySku: Record<string, number> = {};
  for (const row of inv) {
    if (row.status === "available") availableBySku[row.sku] = (availableBySku[row.sku] ?? 0) + row.quantityBottles;
    if (row.status === "in-production") inProdBySku[row.sku] = (inProdBySku[row.sku] ?? 0) + row.quantityBottles;
  }

  const skus = new Set([...Object.keys(availableBySku), ...Object.keys(velocity), ...data.products.map((p) => p.sku)]);
  const out: ReorderRec[] = [];
  const monthsLead = leadDays / 30;
  for (const sku of skus) {
    const v = velocity[sku] ?? 0;
    const monthly = v / 4; /* velocity is over ~120d ≈ 4 months */
    const avail = availableBySku[sku] ?? 0;
    const inProd = inProdBySku[sku] ?? 0;
    const safety = safetyMap[sku] ?? defaultSafety;
    const demandDuringLead = monthly * monthsLead;
    const target = demandDuringLead + safety;
    const pipeline = avail + inProd;
    const suggestedBottles = Math.max(0, Math.ceil(target - pipeline));
    const daily = monthly / 30;
    const daysCover = daily > 0 ? pipeline / daily : null;

    let urgency: ReorderRec["urgency"] = "low";
    if (daysCover !== null && daysCover < leadDays * 0.5) urgency = "high";
    else if (daysCover !== null && daysCover < leadDays) urgency = "medium";
    else if (suggestedBottles > 500) urgency = "medium";

    if (suggestedBottles < 1 && (daysCover === null || daysCover > leadDays * 1.5)) continue;

    out.push({
      sku,
      suggestedBottles,
      daysCover,
      urgency,
      summary:
        suggestedBottles > 0
          ? `${sku}: suggest +${suggestedBottles.toLocaleString()} bottles (cover ~${daysCover === null ? "—" : Math.round(daysCover)}d, lead ${leadDays}d)`
          : `${sku}: monitor — ~${daysCover === null ? "—" : Math.round(daysCover)}d cover`,
    });
  }
  out.sort((a, b) => {
    const u = { high: 0, medium: 1, low: 2 };
    if (u[a.urgency] !== u[b.urgency]) return u[a.urgency] - u[b.urgency];
    return (a.daysCover ?? 999) - (b.daysCover ?? 999);
  });
  return out;
}

export function computeTopAccounts(orders: SalesOrder[], limit = 8) {
  const byAccount: Record<string, { revenue: number; orders: number }> = {};
  for (const o of orders) {
    if (o.status === "cancelled" || o.status === "draft") continue;
    if (!byAccount[o.account]) byAccount[o.account] = { revenue: 0, orders: 0 };
    byAccount[o.account].revenue += o.price;
    byAccount[o.account].orders += 1;
  }
  return Object.entries(byAccount)
    .map(([name, v]) => ({ name, revenue: v.revenue, orders: v.orders, trend: 0 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

/** Aggregate revenue by calendar month from order dates (sell-in). */
export function computeSalesByMonth(orders: SalesOrder[], monthsBack = 6, now = new Date()) {
  const labels: { key: string; label: string; start: number }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    labels.push({
      key,
      label: d.toLocaleString("en", { month: "short" }),
      start: d.getTime(),
    });
  }
  const monthEnd = (start: number) => new Date(new Date(start).getFullYear(), new Date(start).getMonth() + 1, 0, 23, 59, 59, 999).getTime();
  return labels.map(({ key, label, start }) => {
    const end = monthEnd(start);
    const revenue = orders
      .filter((o) => o.status !== "cancelled" && o.status !== "draft")
      .filter((o) => {
        const t = Date.parse(o.orderDate);
        return !Number.isNaN(t) && t >= start && t <= end;
      })
      .reduce((a, o) => a + o.price, 0);
    return { month: label, key, revenue };
  });
}

export function inventoryByStatusForChart(summary: ReturnType<typeof computeInventorySummary>) {
  return [
    { status: "Available", count: summary.available, color: "hsl(152, 60%, 40%)" },
    { status: "Reserved", count: summary.reserved, color: "hsl(38, 80%, 55%)" },
    { status: "In Transit", count: summary.inTransit, color: "hsl(210, 80%, 52%)" },
    { status: "In Production", count: summary.inProduction, color: "hsl(220, 20%, 46%)" },
    { status: "Damaged", count: summary.damaged, color: "hsl(0, 72%, 51%)" },
  ].filter((x) => x.count > 0);
}

export function countPendingPurchaseOrders(pos: AppData["purchaseOrders"]) {
  return pos.filter((p) => p.status === "draft" || p.status === "approved").length;
}

export function countDelayedShipments(shipments: AppData["shipments"]) {
  return shipments.filter((s) => s.status === "delayed").length;
}

/** Map order market / region labels to anchor cities for executive view. */
export function cityKeyFromMarket(market: string): "Toronto" | "Milan" | "Paris" | null {
  if (!market) return null;
  const m = market.trim().toLowerCase();
  if (m.includes("toronto") || m.includes("ontario")) return "Toronto";
  if (m.includes("milan") || m.includes("milano")) return "Milan";
  if (m.includes("paris") || m.includes("île-de-france") || m.includes("ile-de-france")) return "Paris";
  return null;
}

export type AnchorMarketSnapshotRow = {
  city: "Toronto" | "Milan" | "Paris";
  revenue: number;
  orderCount: number;
  bottles: number;
};

/** Sell-in by anchor hub (Toronto = Ontario + Toronto markets, Milan, Paris). */
export function computeAnchorMarketsSnapshot(
  orders: SalesOrder[],
  windowDays = 30,
  now = new Date(),
): AnchorMarketSnapshotRow[] {
  const cutoff = now.getTime() - windowDays * MS_DAY;
  const keys = ["Toronto", "Milan", "Paris"] as const;
  const map: Record<(typeof keys)[number], { revenue: number; orderCount: number; bottles: number }> = {
    Toronto: { revenue: 0, orderCount: 0, bottles: 0 },
    Milan: { revenue: 0, orderCount: 0, bottles: 0 },
    Paris: { revenue: 0, orderCount: 0, bottles: 0 },
  };
  for (const o of orders) {
    if (o.status === "cancelled" || o.status === "draft") continue;
    const t = Date.parse(o.orderDate);
    if (Number.isNaN(t) || t < cutoff) continue;
    const c = cityKeyFromMarket(o.market);
    if (!c) continue;
    map[c].revenue += o.price;
    map[c].orderCount += 1;
    map[c].bottles += o.quantity;
  }
  return keys.map((city) => ({ city, ...map[city] }));
}

/** Side-by-side market performance for executive reporting (Toronto vs Milan). */
export function computeTorontoMilanSnapshot(orders: SalesOrder[], windowDays = 30, now = new Date()) {
  const rows = computeAnchorMarketsSnapshot(orders, windowDays, now);
  return [rows[0], rows[1]] as const;
}

export type LocalAccountPerfRow = {
  account: string;
  revenue: number;
  orderCount: number;
  bottles: number;
  /** Relative to top account in the same city (0–100). */
  barPct: number;
};

/**
 * Ranked account sell-in within each anchor city (Ontario+Toronto → Toronto; Milan).
 * Bars are normalized within that city only (for single-market views, not city-vs-city).
 */
export function computeLocalAccountPerformanceByCity(
  orders: SalesOrder[],
  windowDays = 30,
  now = new Date(),
): { Toronto: LocalAccountPerfRow[]; Milan: LocalAccountPerfRow[] } {
  const cutoff = now.getTime() - windowDays * MS_DAY;
  const agg: Record<"Toronto" | "Milan", Record<string, { revenue: number; orderCount: number; bottles: number }>> = {
    Toronto: {},
    Milan: {},
  };
  for (const o of orders) {
    if (o.status === "cancelled" || o.status === "draft") continue;
    const t = Date.parse(o.orderDate);
    if (Number.isNaN(t) || t < cutoff) continue;
    const c = cityKeyFromMarket(o.market);
    if (c !== "Toronto" && c !== "Milan") continue;
    const name = o.account.trim() || "—";
    const bucket = agg[c];
    if (!bucket[name]) bucket[name] = { revenue: 0, orderCount: 0, bottles: 0 };
    bucket[name].revenue += o.price;
    bucket[name].orderCount += 1;
    bucket[name].bottles += o.quantity;
  }
  const finalize = (city: "Toronto" | "Milan"): LocalAccountPerfRow[] => {
    const rows = Object.entries(agg[city])
      .map(([account, v]) => ({ account, ...v }))
      .sort((a, b) => b.revenue - a.revenue);
    const maxRev = Math.max(...rows.map((r) => r.revenue), 1);
    return rows.map((r) => ({ ...r, barPct: Math.round((r.revenue / maxRev) * 100) }));
  };
  return { Toronto: finalize("Toronto"), Milan: finalize("Milan") };
}

export function revenueInWindow(orders: SalesOrder[], windowDays: number, now = new Date()): number {
  const cutoff = now.getTime() - windowDays * MS_DAY;
  let s = 0;
  for (const o of orders) {
    if (o.status === "cancelled" || o.status === "draft") continue;
    const t = Date.parse(o.orderDate);
    if (Number.isNaN(t) || t < cutoff) continue;
    s += o.price;
  }
  return s;
}

/** Compare last `windowDays` to the prior `windowDays` period (sell-in revenue). */
export function computeRevenueGrowthPercent(orders: SalesOrder[], windowDays = 30, now = new Date()): number {
  const end = now.getTime();
  const mid = end - windowDays * MS_DAY;
  const start = mid - windowDays * MS_DAY;
  let recent = 0;
  let prior = 0;
  for (const o of orders) {
    if (o.status === "cancelled" || o.status === "draft") continue;
    const t = Date.parse(o.orderDate);
    if (Number.isNaN(t)) continue;
    if (t >= mid && t <= end) recent += o.price;
    else if (t >= start && t < mid) prior += o.price;
  }
  if (prior <= 0) return recent > 0 ? 100 : 0;
  return Math.round(((recent - prior) / prior) * 1000) / 10;
}

export function countActiveMarkets(orders: SalesOrder[], windowDays = 90, now = new Date()): number {
  const cutoff = now.getTime() - windowDays * MS_DAY;
  const set = new Set<string>();
  for (const o of orders) {
    if (o.status === "cancelled" || o.status === "draft") continue;
    const t = Date.parse(o.orderDate);
    if (Number.isNaN(t) || t < cutoff) continue;
    const k = o.market.trim();
    if (k) set.add(k);
  }
  return set.size;
}

const ANCHOR_CITIES = ["Toronto", "Milan", "Paris"] as const;

export function computeSalesByAnchorCities(orders: SalesOrder[], windowDays = 30, now = new Date()) {
  const cutoff = now.getTime() - windowDays * MS_DAY;
  const map: Record<(typeof ANCHOR_CITIES)[number], number> = { Toronto: 0, Milan: 0, Paris: 0 };
  for (const o of orders) {
    if (o.status === "cancelled" || o.status === "draft") continue;
    const t = Date.parse(o.orderDate);
    if (Number.isNaN(t) || t < cutoff) continue;
    const c = cityKeyFromMarket(o.market);
    if (c) map[c] += o.price;
  }
  return ANCHOR_CITIES.map((city) => ({ city, revenue: map[city] }));
}

/** Bottles staged as manufacturer → warehouse network → retail allocation. */
export function computeInventoryFlowStages(inventory: InventoryItem[]) {
  const manufacturer = sumBottles(inventory, (i) => i.status === "in-production");
  const warehouse = sumBottles(
    inventory,
    (i) => i.status === "available" || i.status === "in-transit" || i.status === "damaged",
  );
  const retail = sumBottles(inventory, (i) => i.status === "reserved");
  const total = manufacturer + warehouse + retail;
  return { manufacturer, warehouse, retail, total };
}

/**
 * Four organizational layers in one connected system (not silos).
 * Manufacturer: in production. Brand Operator: HQ sellable pool (available).
 * Distributor: in motion between hubs / wholesale channel. Retail: allocated to sell-in.
 * Excludes damaged (quarantine) from this pipeline view.
 */
export function computeSupplyChainLayers(inventory: InventoryItem[]) {
  const manufacturer = sumBottles(inventory, (i) => i.status === "in-production");
  const brandOperator = sumBottles(inventory, (i) => i.status === "available");
  const distributor = sumBottles(inventory, (i) => i.status === "in-transit");
  const retail = sumBottles(inventory, (i) => i.status === "reserved");
  const total = manufacturer + brandOperator + distributor + retail;
  return { manufacturer, brandOperator, distributor, retail, total };
}

function accountByTradingName(accounts: AppData["accounts"], tradingName: string) {
  return accounts.find((a) => a.tradingName === tradingName || a.legalName === tradingName);
}

/** Retail-channel orders: on-premise venue types (hotel, bar, …) or explicit retail routing. */
export function isRetailChannelOrder(order: SalesOrder, accounts: AppData["accounts"]): boolean {
  if (order.orderRoutingTarget === "retail") return true;
  const acc = accountByTradingName(accounts, order.account);
  if (!acc) return true;
  const venueTypes = new Set(["retail", "bar", "restaurant", "hotel", "lifestyle"]);
  return venueTypes.has(acc.type);
}

export type RetailOrderPipeline = {
  incoming: number;
  pending: number;
  approvedInFlight: number;
  rejected: number;
  delivered: number;
};

/** Pipeline labels map to existing order statuses (demo). */
export function computeRetailOrderPipeline(orders: SalesOrder[], accounts: AppData["accounts"]): RetailOrderPipeline {
  const base = { incoming: 0, pending: 0, approvedInFlight: 0, rejected: 0, delivered: 0 };
  for (const o of orders) {
    if (!isRetailChannelOrder(o, accounts)) continue;
    switch (o.status) {
      case "draft":
        base.pending += 1;
        break;
      case "confirmed":
      case "packed":
        base.incoming += 1;
        break;
      case "shipped":
        base.approvedInFlight += 1;
        break;
      case "delivered":
        base.delivered += 1;
        break;
      case "cancelled":
        base.rejected += 1;
        break;
      default:
        break;
    }
  }
  return base;
}

export type SpotlightAlert = {
  id: string;
  message: string;
  severity: DerivedAlert["severity"];
};

/** Curated executive alerts (Milan / Toronto / shipments) using live inventory + shipments. */
export function computeSpotlightAlerts(data: AppData, now = new Date()): SpotlightAlert[] {
  const out: SpotlightAlert[] = [];
  const milanAvail = sumBottles(
    data.inventory,
    (i) => i.status === "available" && (i.warehouse?.toLowerCase() || "").includes("milan"),
  );
  const torontoAvail = sumBottles(
    data.inventory,
    (i) => i.status === "available" && (i.warehouse?.toLowerCase() || "").includes("toronto"),
  );
  if (milanAvail < 400) {
    out.push({
      id: "spotlight-milan-low",
      message: `Low stock in Milan — ${milanAvail.toLocaleString()} sellable bottles at Milan Depot`,
      severity: milanAvail < 200 ? "high" : "medium",
    });
  }
  if (torontoAvail > 2800) {
    out.push({
      id: "spotlight-toronto-over",
      message: `Toronto overstocked — ${torontoAvail.toLocaleString()} available at Toronto Main (consider rebalancing)`,
      severity: "low",
    });
  }
  const delayed = data.shipments.filter((s) => s.status === "delayed");
  if (delayed.length > 0) {
    const s = delayed[0];
    out.push({
      id: `spotlight-ship-${s.id}`,
      message: `Shipment delay — ${s.id} to ${s.destination}`,
      severity: "high",
    });
  } else {
    const today = now.toISOString().slice(0, 10);
    const late = data.shipments.find(
      (sh) => !sh.actualDelivery && sh.eta && sh.eta < today && sh.status !== "delivered",
    );
    if (late) {
      out.push({
        id: `spotlight-ship-late-${late.id}`,
        message: `Shipment delay — ${late.id} past ETA (${late.eta})`,
        severity: "high",
      });
    }
  }
  return out;
}

export type ManufacturerDashboardStatus = {
  inProductionCount: number;
  inProductionSkus: string[];
  nextInboundEta: string | null;
  nextInboundLabel: string | null;
};

export function computeManufacturerDashboardStatus(data: AppData, now = new Date()): ManufacturerDashboardStatus {
  const inProdPos = data.purchaseOrders.filter((p) => p.status === "in-production");
  const skus = [...new Set(inProdPos.map((p) => p.sku))];
  const inbound = data.shipments.filter(
    (s) => s.type === "inbound" && s.status !== "delivered" && !s.actualDelivery,
  );
  inbound.sort((a, b) => a.eta.localeCompare(b.eta));
  const next = inbound[0];
  return {
    inProductionCount: inProdPos.length,
    inProductionSkus: skus,
    nextInboundEta: next?.eta ?? null,
    nextInboundLabel: next ? `${next.id} → ${next.destination}` : null,
  };
}
