export type HqAnalyticsRangeId = "qtd" | "ytd" | "12mo";

export type HqAnalyticsMonthlyPoint = {
  month: string;
  revenue: number;
  /** Last bar shown lighter — partial period (e.g. May MTD). */
  partial?: boolean;
};

export type HqAnalyticsMarketRow = {
  market: string;
  revenue: number;
  barPct: number;
};

export type HqAnalyticsSkuRow = {
  name: string;
  sku?: string;
  cases: number;
  revenue: number;
  vsQ1: string;
};

export type HqAnalyticsSnapshot = {
  networkRevenue: number;
  networkRevenueSub: string;
  networkRevenueDelta: string;
  casesSold: number;
  casesSoldDelta: string;
  avgOrderValue: number;
  avgOrderSub: string;
  avgOrderDelta: string;
  retentionPct: number;
  monthly: HqAnalyticsMonthlyPoint[];
  byMarket: HqAnalyticsMarketRow[];
  topSkus: HqAnalyticsSkuRow[];
  partialMonthNote?: string;
};

/** Matches hq-operator-app.html PAGES.analytics — QTD baseline. */
const QTD_DEMO: HqAnalyticsSnapshot = {
  networkRevenue: 486_000,
  networkRevenueSub: "Q2 to date",
  networkRevenueDelta: "+16% vs Q1",
  casesSold: 4840,
  casesSoldDelta: "+12%",
  avgOrderValue: 3640,
  avgOrderSub: "+$340 vs prior",
  avgOrderDelta: "+10%",
  retentionPct: 92,
  monthly: [
    { month: "Nov", revenue: 118_000 },
    { month: "Dec", revenue: 132_000 },
    { month: "Jan", revenue: 128_000 },
    { month: "Feb", revenue: 154_000 },
    { month: "Mar", revenue: 168_000 },
    { month: "Apr", revenue: 182_000 },
    { month: "May", revenue: 164_000, partial: true },
  ],
  byMarket: [
    { market: "NYC", revenue: 51_400, barPct: 88 },
    { market: "Tokyo", revenue: 48_200, barPct: 82 },
    { market: "Chicago", revenue: 28_200, barPct: 48 },
    { market: "Paris", revenue: 19_600, barPct: 34 },
    { market: "Milan", revenue: 14_200, barPct: 24 },
  ],
  topSkus: [
    { name: "Florin Peaks", sku: "HJM-FP-750", cases: 2480, revenue: 238_000, vsQ1: "+18%" },
    { name: "Junmai Shiro", sku: "HJM-JN-720", cases: 1240, revenue: 79_000, vsQ1: "+9%" },
    { name: "Ryusui Reserve", sku: "HJM-RY-500", cases: 640, revenue: 105_000, vsQ1: "+24%" },
    { name: "First Press", sku: "EU-FP-750", cases: 480, revenue: 50_000, vsQ1: "+6%" },
  ],
  partialMonthNote: "May is partial (shown lighter)",
};

const YTD_DEMO: HqAnalyticsSnapshot = {
  ...QTD_DEMO,
  networkRevenue: 892_000,
  networkRevenueSub: "Year to date",
  networkRevenueDelta: "+14% vs prior YTD",
  casesSold: 8920,
  casesSoldDelta: "+11%",
  avgOrderValue: 3580,
  avgOrderSub: "rolling YTD",
  avgOrderDelta: "+8%",
  retentionPct: 91,
  monthly: [
    { month: "Jan", revenue: 128_000 },
    { month: "Feb", revenue: 154_000 },
    { month: "Mar", revenue: 168_000 },
    { month: "Apr", revenue: 182_000 },
    { month: "May", revenue: 164_000, partial: true },
    { month: "Jun", revenue: 96_000, partial: true },
  ],
  byMarket: QTD_DEMO.byMarket.map((r) => ({
    ...r,
    revenue: Math.round(r.revenue * 1.65),
    barPct: r.barPct,
  })),
  topSkus: QTD_DEMO.topSkus.map((r) => ({
    ...r,
    cases: Math.round(r.cases * 1.55),
    revenue: Math.round(r.revenue * 1.55),
  })),
  partialMonthNote: "Jun is partial (shown lighter)",
};

const TWELVE_MO_DEMO: HqAnalyticsSnapshot = {
  ...QTD_DEMO,
  networkRevenue: 1_046_000,
  networkRevenueSub: "Trailing 12 months",
  networkRevenueDelta: "+16% vs prior 12mo",
  casesSold: 10_240,
  casesSoldDelta: "+13%",
  avgOrderValue: 3520,
  avgOrderSub: "trailing 12 months",
  avgOrderDelta: "+9%",
  retentionPct: 92,
  monthly: QTD_DEMO.monthly,
  byMarket: [
    { market: "NYC", revenue: 112_000, barPct: 92 },
    { market: "Tokyo", revenue: 98_000, barPct: 80 },
    { market: "Chicago", revenue: 54_000, barPct: 44 },
    { market: "Paris", revenue: 36_000, barPct: 30 },
    { market: "Milan", revenue: 28_000, barPct: 24 },
  ],
  topSkus: [
    { name: "Florin Peaks", sku: "HJM-FP-750", cases: 5120, revenue: 492_000, vsQ1: "+18%" },
    { name: "Junmai Shiro", sku: "HJM-JN-720", cases: 2680, revenue: 168_000, vsQ1: "+11%" },
    { name: "Ryusui Reserve", sku: "HJM-RY-500", cases: 1180, revenue: 198_000, vsQ1: "+24%" },
    { name: "First Press", sku: "EU-FP-750", cases: 920, revenue: 96_000, vsQ1: "+7%" },
  ],
};

export function buildHqAnalyticsDemoSnapshot(range: HqAnalyticsRangeId): HqAnalyticsSnapshot {
  if (range === "ytd") return YTD_DEMO;
  if (range === "12mo") return TWELVE_MO_DEMO;
  return QTD_DEMO;
}

/** Use demo when scoped HQ orders are too sparse for charts. */
export function shouldUseHqAnalyticsDemo(liveRevenue: number, orderCount: number, marketCount: number): boolean {
  return liveRevenue < 80_000 || orderCount < 8 || marketCount < 2;
}

export function mergeHqAnalyticsSkuNames(
  rows: HqAnalyticsSkuRow[],
  products: { sku: string; name: string }[],
): HqAnalyticsSkuRow[] {
  return rows.map((row) => {
    if (!row.sku) return row;
    const product = products.find((p) => p.sku === row.sku);
    return product ? { ...row, name: product.name } : row;
  });
}
