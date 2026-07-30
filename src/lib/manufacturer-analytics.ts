export type MonthlyProductionPoint = {
  month: string;
  cases: number;
  partial?: boolean;
};

export type MonthlyTrendPoint = {
  month: string;
  quality: number;
  yield: number;
};

export type SkuProductionRow = {
  name: string;
  cases: number;
  grade: string;
  yield: string;
  premium: string;
};

export type AnalyticsSummary = {
  casesProducedQ2: string;
  casesProducedSub: string;
  qualityPassRate: string;
  qualitySub: string;
  yieldEfficiency: string;
  yieldSub: string;
  productionPremium: string;
  premiumSub: string;
};

export const ANALYTICS_MONTHS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"] as const;

/** Empty until production metrics are calculated from real batches / shipments. */
export const MONTHLY_PRODUCTION: MonthlyProductionPoint[] = [];

export const MONTHLY_TRENDS: MonthlyTrendPoint[] = [];

export const SKU_PRODUCTION: SkuProductionRow[] = [];

export const ANALYTICS_SUMMARY: AnalyticsSummary = {
  casesProducedQ2: "0",
  casesProducedSub: "No production recorded yet",
  qualityPassRate: "—",
  qualitySub: "No QC batches yet",
  yieldEfficiency: "—",
  yieldSub: "No yield data yet",
  productionPremium: "—",
  premiumSub: "No premiums calculated",
};

export function maxProductionCases(points: MonthlyProductionPoint[] = MONTHLY_PRODUCTION): number {
  if (points.length === 0) return 1;
  return Math.max(1, ...points.map((p) => p.cases));
}

export function yieldTextClass(yieldPct: string): string {
  const value = Number.parseFloat(yieldPct);
  if (Number.isNaN(value)) return "text-muted-foreground";
  return value < 93 ? "text-[hsl(38_90%_40%)]" : "text-[hsl(158_56%_32%)]";
}
