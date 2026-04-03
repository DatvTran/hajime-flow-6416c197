import type { SalesOrder } from "@/data/mockData";
import type { AnchorMarketSnapshotRow } from "@/lib/hajime-metrics";
import { revenueInWindow } from "@/lib/hajime-metrics";
import type { MarketPanelRow, MarketReplenishmentSuggestion } from "@/lib/brand-operator-metrics";

/** Fixed “as of” date aligned with seeded order lines (March 2026) when the user’s clock has moved past that window. */
export const MARKETS_SNAPSHOT_AS_OF = new Date("2026-04-01T12:00:00Z");

export type MarketsHqMode = "live" | "snapshot" | "illustrative";

export function resolveMarketsHqMode(orders: SalesOrder[]): MarketsHqMode {
  if (revenueInWindow(orders, 90, new Date()) > 0) return "live";
  if (revenueInWindow(orders, 90, MARKETS_SNAPSHOT_AS_OF) > 0) return "snapshot";
  return "illustrative";
}

export function marketsAsOfDate(mode: MarketsHqMode): Date {
  return mode === "live" ? new Date() : MARKETS_SNAPSHOT_AS_OF;
}

export const MARKETS_HQ_DEMO_ANCHOR: AnchorMarketSnapshotRow[] = [
  { city: "Toronto", revenue: 75_230, orderCount: 6, bottles: 1008 },
  { city: "Milan", revenue: 17_840, orderCount: 2, bottles: 216 },
  { city: "Paris", revenue: 6480, orderCount: 1, bottles: 72 },
];

export const MARKETS_HQ_DEMO_KPI = {
  activeRegions90d: 4,
  sellIn30d: 99_550,
  growthVsPrior30d: 12.4,
};

export const MARKETS_HQ_DEMO_PANEL: MarketPanelRow[] = [
  {
    id: "toronto",
    label: "Toronto",
    stockCases: 142,
    sold30dCases: 84,
    daysCover: 28,
    health: "healthy",
  },
  {
    id: "milan",
    label: "Milan",
    stockCases: 58,
    sold30dCases: 18,
    daysCover: 22,
    health: "healthy",
  },
  {
    id: "paris",
    label: "Paris",
    stockCases: 0,
    sold30dCases: 6,
    daysCover: null,
    health: "watch",
    note: "No local depot row — velocity from Paris sell-in",
  },
  {
    id: "ontario",
    label: "Ontario LCBO",
    stockCases: 78,
    sold30dCases: 52,
    daysCover: 15,
    health: "watch",
  },
  {
    id: "spain",
    label: "Spain",
    stockCases: 0,
    sold30dCases: 0,
    daysCover: null,
    health: "watch",
    note: "No activity in seed data",
  },
];

export const MARKETS_HQ_DEMO_REPLENISH: MarketReplenishmentSuggestion[] = [
  {
    id: "repl-demo-ontario",
    market: "Ontario LCBO",
    recommendedCases: 48,
    reason: "Stock ~78 cases vs ~52 cases / 30d — keep LCBO lane ahead of provincial buy cycle.",
    urgency: "medium",
  },
  {
    id: "repl-demo-paris",
    market: "Paris",
    recommendedCases: 24,
    reason: "Inbound Milan depot + Galeries velocity — pre-build Paris-forward pool.",
    urgency: "medium",
  },
];

/** Manufacturer “market demand” tables when there are no rows to aggregate. */
export const MANUFACTURER_DEMAND_DEMO_30 = [
  { market: "Toronto", lines: 6, bottles: 1008 },
  { market: "Milan", lines: 2, bottles: 216 },
  { market: "Paris", lines: 1, bottles: 72 },
];

export const MANUFACTURER_DEMAND_DEMO_90 = [
  { market: "Toronto", lines: 8, bottles: 1320 },
  { market: "Milan", lines: 3, bottles: 312 },
  { market: "Paris", lines: 2, bottles: 144 },
  { market: "Ontario", lines: 4, bottles: 720 },
];
