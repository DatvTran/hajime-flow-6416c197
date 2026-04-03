import type { Account, SalesOrder } from "@/data/mockData";
import { orderLineEntries } from "@/lib/order-lines";
import { cityKeyFromMarket } from "@/lib/hajime-metrics";

const MS_DAY = 86400000;

/** Average days between consecutive orders per account (sell-in), last 180d. */
export function reorderIntervalDaysByAccount(orders: SalesOrder[], windowDays = 180, now = new Date()): { name: string; avgDays: number | null; orders: number }[] {
  const cutoff = now.getTime() - windowDays * MS_DAY;
  const byAccount: Record<string, number[]> = {};
  for (const o of orders) {
    if (o.status === "cancelled" || o.status === "draft") continue;
    const t = Date.parse(o.orderDate);
    if (Number.isNaN(t) || t < cutoff) continue;
    if (!byAccount[o.account]) byAccount[o.account] = [];
    byAccount[o.account].push(t);
  }
  return Object.entries(byAccount)
    .map(([name, dates]) => {
      if (dates.length < 2) return { name, avgDays: null as number | null, orders: dates.length };
      dates.sort((a, b) => a - b);
      let sum = 0;
      for (let i = 1; i < dates.length; i++) sum += (dates[i] - dates[i - 1]) / MS_DAY;
      return { name, avgDays: Math.round((sum / (dates.length - 1)) * 10) / 10, orders: dates.length };
    })
    .filter((x) => x.orders >= 2)
    .sort((a, b) => (a.avgDays ?? 999) - (b.avgDays ?? 999))
    .slice(0, 8);
}

export type RegionPerformance = { region: string; revenue: number; orders: number };

export function topRegionsByRevenue(orders: SalesOrder[], windowDays = 90, now = new Date()): RegionPerformance[] {
  const cutoff = now.getTime() - windowDays * MS_DAY;
  const map: Record<string, { revenue: number; orders: number }> = {};
  for (const o of orders) {
    if (o.status === "cancelled" || o.status === "draft") continue;
    const t = Date.parse(o.orderDate);
    if (Number.isNaN(t) || t < cutoff) continue;
    const anchor = cityKeyFromMarket(o.market);
      const region = anchor ?? (o.market.trim() || "Other");
    if (!map[region]) map[region] = { revenue: 0, orders: 0 };
    map[region].revenue += o.price;
    map[region].orders += 1;
  }
  return Object.entries(map)
    .map(([region, v]) => ({ region, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);
}

function monthBuckets(monthsBack: number, now: Date) {
  const labels: { label: string; start: number }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push({
      label: d.toLocaleString("en", { month: "short" }),
      start: d.getTime(),
    });
  }
  return labels;
}

function endOfMonth(start: number) {
  return new Date(new Date(start).getFullYear(), new Date(start).getMonth() + 1, 0, 23, 59, 59, 999).getTime();
}

/** Monthly sell-in bottles (excl. draft/cancelled) — common proxy for depletion pacing before full sell-through feeds. */
export function monthlySellInBottlesSeries(orders: SalesOrder[], monthsBack = 6, now = new Date()) {
  return monthBuckets(monthsBack, now).map(({ label, start }) => {
    const end = endOfMonth(start);
    let bottles = 0;
    for (const o of orders) {
      if (o.status === "cancelled" || o.status === "draft") continue;
      const t = Date.parse(o.orderDate);
      if (Number.isNaN(t) || t < start || t > end) continue;
      bottles += orderLineEntries(o).reduce((a, l) => a + l.quantityBottles, o.quantity);
    }
    return { month: label, bottles };
  });
}

export function accountRevenueTrendRows(
  orders: SalesOrder[],
  accounts: Account[],
  windowDays = 30,
  now = new Date(),
): { name: string; recent: number; prior: number; deltaPct: number }[] {
  const end = now.getTime();
  const mid = end - windowDays * MS_DAY;
  const start = mid - windowDays * MS_DAY;
  const names = [...new Set(accounts.map((a) => a.tradingName))];
  return names
    .map((name) => {
      let recent = 0;
      let prior = 0;
      for (const o of orders) {
        if (o.account !== name || o.status === "cancelled" || o.status === "draft") continue;
        const t = Date.parse(o.orderDate);
        if (Number.isNaN(t)) continue;
        if (t >= mid && t <= end) recent += o.price;
        else if (t >= start && t < mid) prior += o.price;
      }
      const deltaPct = prior <= 0 ? (recent > 0 ? 100 : 0) : Math.round(((recent - prior) / prior) * 1000) / 10;
      return { name, recent, prior, deltaPct };
    })
    .filter((r) => r.recent > 0 || r.prior > 0)
    .sort((a, b) => b.recent - a.recent)
    .slice(0, 10);
}
