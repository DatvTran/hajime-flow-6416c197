import { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAppData } from "@/contexts/AppDataContext";
import { ManufacturerSkeleton } from "@/components/skeletons";
import type { SalesOrder } from "@/data/mockData";
import {
  MANUFACTURER_DEMAND_DEMO_30,
  MANUFACTURER_DEMAND_DEMO_90,
  marketsAsOfDate,
  resolveMarketsHqMode,
} from "@/data/markets-hq-demo";
import { cityKeyFromMarket } from "@/lib/hajime-metrics";
import { Info } from "lucide-react";

const MS_DAY = 86400000;

function aggregateByMarket(orders: SalesOrder[], days: number, now = new Date()) {
  const cutoff = now.getTime() - days * MS_DAY;
  const map: Record<string, { bottles: number; lines: number }> = {};
  for (const o of orders) {
    if (o.status === "cancelled" || o.status === "draft") continue;
    const t = Date.parse(o.orderDate);
    if (Number.isNaN(t) || t < cutoff) continue;
    const raw = o.market.trim();
    const key = cityKeyFromMarket(o.market) ?? (raw !== "" ? raw : "Other");
    if (!map[key]) map[key] = { bottles: 0, lines: 0 };
    map[key].bottles += o.quantity;
    map[key].lines += 1;
  }
  return Object.entries(map)
    .map(([market, v]) => ({ market, ...v }))
    .sort((a, b) => b.bottles - a.bottles);
}

export default function ManufacturerMarketDemandPage() {
  const { data, loading } = useAppData();

  if (loading) {
    return <ManufacturerSkeleton />;
  }

  const demand = useMemo(() => {
    const mode = resolveMarketsHqMode(data.salesOrders);
    const asOf = marketsAsOfDate(mode);
    let rows30 = aggregateByMarket(data.salesOrders, 30, asOf);
    let rows90 = aggregateByMarket(data.salesOrders, 90, asOf);
    if (mode === "illustrative") {
      rows30 = MANUFACTURER_DEMAND_DEMO_30;
      rows90 = MANUFACTURER_DEMAND_DEMO_90;
    }
    return { mode, rows30, rows90 };
  }, [data.salesOrders]);

  return (
    <div>
      <PageHeader
        title="Market demand"
        description="Aggregated sell-in volume by region — no retailer-level pricing or confidential account breakdown (spec §2.A, §6)."
      />

      {demand.mode === "snapshot" ? (
        <Alert className="mb-6">
          <Info className="h-4 w-4" aria-hidden />
          <AlertTitle>Demo timeline</AlertTitle>
          <AlertDescription>
            Demand windows use <strong>April 1, 2026</strong> so seeded orders stay in range when your system date is
            later.
          </AlertDescription>
        </Alert>
      ) : null}
      {demand.mode === "illustrative" ? (
        <Alert className="mb-6">
          <Info className="h-4 w-4" aria-hidden />
          <AlertTitle>Sample demand curve</AlertTitle>
          <AlertDescription>Illustrative regional volumes for onboarding — connect sell-in data to replace.</AlertDescription>
        </Alert>
      ) : null}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-display text-lg">How to use this view</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Quantities and order line counts help align production runs and shipment timing with downstream movement. Brand Operator links detailed
          approvals and POs in the same platform.
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Last 30 days</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2">Market / region</th>
                  <th className="pb-2">Lines</th>
                  <th className="pb-2">Bottles</th>
                </tr>
              </thead>
              <tbody>
                {demand.rows30.map((r) => (
                  <tr key={r.market} className="border-b border-border/60">
                    <td className="py-2 font-medium">{r.market}</td>
                    <td className="py-2 tabular-nums">{r.lines}</td>
                    <td className="py-2 tabular-nums">{r.bottles.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Last 90 days</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2">Market / region</th>
                  <th className="pb-2">Lines</th>
                  <th className="pb-2">Bottles</th>
                </tr>
              </thead>
              <tbody>
                {demand.rows90.map((r) => (
                  <tr key={r.market} className="border-b border-border/60">
                    <td className="py-2 font-medium">{r.market}</td>
                    <td className="py-2 tabular-nums">{r.lines}</td>
                    <td className="py-2 tabular-nums">{r.bottles.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
