import { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppData } from "@/contexts/AppDataContext";
import { MarketsSkeleton } from "@/components/skeletons";
import {
  computeAnchorMarketsSnapshot,
  countActiveMarkets,
  computeRevenueGrowthPercent,
  revenueInWindow,
} from "@/lib/hajime-metrics";
import { computeMarketPanelRows, computeHQReplenishmentSuggestions } from "@/lib/brand-operator-metrics";
import {
  MARKETS_HQ_DEMO_ANCHOR,
  MARKETS_HQ_DEMO_KPI,
  MARKETS_HQ_DEMO_PANEL,
  MARKETS_HQ_DEMO_REPLENISH,
  marketsAsOfDate,
  resolveMarketsHqMode,
} from "@/data/markets-hq-demo";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Globe, Info, TrendingUp } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

export default function MarketsPage() {
  const { data, loading } = useAppData();

  const view = useMemo(() => {
    const mode = resolveMarketsHqMode(data.salesOrders);
    const asOf = marketsAsOfDate(mode);
    if (mode === "illustrative") {
      return {
        mode,
        snap: MARKETS_HQ_DEMO_ANCHOR,
        active: MARKETS_HQ_DEMO_KPI.activeRegions90d,
        rev30: MARKETS_HQ_DEMO_KPI.sellIn30d,
        growth30: MARKETS_HQ_DEMO_KPI.growthVsPrior30d,
        panelRows: MARKETS_HQ_DEMO_PANEL,
        replenishment: MARKETS_HQ_DEMO_REPLENISH,
      };
    }
    return {
      mode,
      snap: computeAnchorMarketsSnapshot(data.salesOrders, 30, asOf),
      active: countActiveMarkets(data.salesOrders, 90, asOf),
      rev30: revenueInWindow(data.salesOrders, 30, asOf),
      growth30: computeRevenueGrowthPercent(data.salesOrders, 30, asOf),
      panelRows: computeMarketPanelRows(data, 30, asOf),
      replenishment: computeHQReplenishmentSuggestions(data, asOf),
    };
  }, [data]);

  const chartData = useMemo(() => view.snap.map((r) => ({ market: r.city, revenue: r.revenue })), [view.snap]);

  if (loading) {
    return <MarketsSkeleton />;
  }

  return (
    <div>
      <PageHeader
        title="Markets"
        description="Allocation and performance by region — Brand Operator control tower (spec §2.B, §4 stage 4)."
      />

      {view.mode === "snapshot" ? (
        <Alert className="mb-6">
          <Info className="h-4 w-4" aria-hidden />
          <AlertTitle>Demo timeline</AlertTitle>
          <AlertDescription>
            Figures use <strong>April 1, 2026</strong> as “today” so seeded March 2026 sell-in stays visible when your
            computer clock is later. Live rolling windows apply once new orders fall inside the last 90 days.
          </AlertDescription>
        </Alert>
      ) : null}

      {view.mode === "illustrative" ? (
        <Alert className="mb-6">
          <Info className="h-4 w-4" aria-hidden />
          <AlertTitle>Illustrative sample</AlertTitle>
          <AlertDescription>
            No qualifying sell-in in the last 90 days in this workspace — showing representative HQ numbers. Add or
            import orders to drive this page from your data.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-interactive p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Active regions (90d)</p>
          <p className="font-display text-2xl font-semibold tabular-nums">{view.active}</p>
        </div>
        <div className="card-interactive p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Sell-in (30d)</p>
          <p className="font-display text-2xl font-semibold tabular-nums">${view.rev30.toLocaleString()}</p>
        </div>
        <div className="card-interactive p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Sell-in vs prior 30d</p>
          <p className="flex items-center gap-2 font-display text-2xl font-semibold tabular-nums">
            <TrendingUp className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} aria-hidden />
            {view.growth30 >= 0 ? "+" : ""}
            {view.growth30}%
          </p>
        </div>
        <div className="card-interactive p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Hub coverage</p>
          <p className="mt-1 text-sm text-muted-foreground leading-snug">
            Toronto hub covers Ontario LCBO + GTA retail; Milan and Paris use depot-level allocation.
          </p>
        </div>
      </div>

      <div className="mb-6 grid min-w-0 gap-4 lg:grid-cols-5">
        <div className="card-elevated min-w-0 lg:col-span-3">
          <div className="border-b border-border/50 p-5 pb-3">
            <h3 className="font-display text-lg font-semibold">Anchor hubs — sell-in (30d)</h3>
          </div>
          <div className="min-w-0 p-5">
            <div className="h-[280px] w-full min-h-[240px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="market" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    width={48}
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(v) => (v >= 1000 ? `$${v / 1000}K` : `$${v}`)}
                  />
                  <Tooltip
                    formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]}
                    contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {view.snap.map((row) => (
                <div key={row.city} className="card-interactive p-3 text-sm">
                  <p className="font-medium">{row.city}</p>
                  <p className="text-muted-foreground">
                    {row.orderCount} orders · {row.bottles.toLocaleString()} bottles
                  </p>
                  <p className="mt-1 font-display text-lg font-semibold tabular-nums">${row.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card-elevated min-w-0 lg:col-span-2">
          <div className="border-b border-border/50 p-5 pb-3">
            <h3 className="font-display text-lg font-semibold">Replenishment queue</h3>
          </div>
          <div className="p-5">
            {view.replenishment.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Globe className="h-7 w-7 text-muted-foreground/20" strokeWidth={1} />
                <p className="text-sm text-muted-foreground">No replenishment rows</p>
                <p className="text-[11px] text-muted-foreground/60">Check production requests and inventory.</p>
              </div>
            ) : (
              <ul className="space-y-3 text-sm">
                {view.replenishment.map((r) => (
                  <li key={r.id} className="card-interactive p-3">
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{r.market}</span>
                      <StatusBadge status={r.urgency} />
                    </div>
                    <p className="text-xs text-muted-foreground">{r.reason}</p>
                    <p className="mt-2 text-xs font-medium tabular-nums">
                      Suggested release: ~{r.recommendedCases} cases
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="card-elevated overflow-hidden">
        <div className="border-b border-border/50 p-5 pb-3">
          <h3 className="font-display text-lg font-semibold">Hub health &amp; cover (30d velocity)</h3>
        </div>
        <div className="overflow-x-auto p-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Market</TableHead>
                <TableHead className="text-right tabular-nums">Est. stock (cases)</TableHead>
                <TableHead className="text-right tabular-nums">Sold 30d (cases)</TableHead>
                <TableHead className="text-right tabular-nums">Days cover</TableHead>
                <TableHead>Health</TableHead>
                <TableHead className="hidden md:table-cell">Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {view.panelRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.stockCases.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.sold30dCases.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.daysCover === null ? "—" : row.daysCover}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.health} />
                  </TableCell>
                  <TableCell className="hidden max-w-[280px] text-muted-foreground md:table-cell">
                    {row.note ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
