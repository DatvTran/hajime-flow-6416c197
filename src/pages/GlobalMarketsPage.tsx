import { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAppData } from "@/contexts/AppDataContext";
import {
  computeAnchorMarketsSnapshot,
  countActiveMarkets,
  computeRevenueGrowthPercent,
  revenueInWindow,
} from "@/lib/hajime-metrics";
import {
  computeMarketPanelRows,
  computeHQReplenishmentSuggestions,
  type MarketPanelRow,
} from "@/lib/brand-operator-metrics";
import {
  MARKETS_HQ_DEMO_ANCHOR,
  MARKETS_HQ_DEMO_KPI,
  MARKETS_HQ_DEMO_PANEL,
  MARKETS_HQ_DEMO_REPLENISH,
  marketsAsOfDate,
  resolveMarketsHqMode,
} from "@/data/markets-hq-demo";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { Info, LayoutGrid, Map, TrendingUp, Clock3 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import type { AnchorMarketSnapshotRow } from "@/lib/hajime-metrics";

/**
 * Hub positions by panel row id — matches Hub health table (Toronto / Milan / Paris / Ontario LCBO / Spain).
 * Percent of artboard; stylized, not Mercator.
 */
const MAP_POS_BY_PANEL_ID: Record<string, { left: string; top: string }> = {
  toronto: { left: "26%", top: "34%" },
  milan: { left: "52%", top: "36%" },
  paris: { left: "48%", top: "33%" },
  ontario: { left: "20%", top: "41%" },
  spain: { left: "44%", top: "45%" },
};

/**
 * Fixed positions for known hubs; unknown panel ids (live data) are laid out on an ellipse
 * so glyphs do not stack at the fallback center (which reads as an empty map).
 */
function mapPosForPanelRow(row: MarketPanelRow, index: number, total: number): { left: string; top: string } {
  const fixed = MAP_POS_BY_PANEL_ID[row.id];
  if (fixed) return fixed;

  const n = Math.max(total, 1);
  const t = (index / n) * 2 * Math.PI + Math.PI / 6;
  const cx = 50;
  const cy = 42;
  const rx = 30;
  const ry = 24;
  const left = cx + rx * Math.cos(t);
  const top = cy + ry * Math.sin(t);
  return { left: `${Math.round(left * 10) / 10}%`, top: `${Math.round(top * 10) / 10}%` };
}

function anchorSnapForPanelRow(row: MarketPanelRow, snap: AnchorMarketSnapshotRow[]): AnchorMarketSnapshotRow | undefined {
  const cityById: Record<string, string> = { toronto: "Toronto", milan: "Milan", paris: "Paris" };
  const city = cityById[row.id];
  return city ? snap.find((s) => s.city === city) : undefined;
}

/** Short label for glyph center (30d cases). */
function formatCasesGlyph(n: number): string {
  if (n <= 0) return "0";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 100) return String(Math.round(n / 10) * 10);
  return n % 1 === 0 ? String(Math.round(n)) : n.toFixed(1);
}

export default function GlobalMarketsPage() {
  const { data } = useAppData();

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

  const timelineShipments = useMemo(() => {
    return [...data.shipments].sort((a, b) => Date.parse(b.shipDate) - Date.parse(a.shipDate)).slice(0, 12);
  }, [data.shipments]);

  return (
    <div>
        <PageHeader
          title="Global markets"
          description="Three lenses on the same dataset — sell-through, stock cover, and in-flight logistics across markets. Brand Operator exploration surface."
        />

        {view.mode === "snapshot" ? (
          <Alert className="mb-6">
            <Info className="h-4 w-4" aria-hidden />
            <AlertTitle>Demo timeline</AlertTitle>
            <AlertDescription>
              Figures use <strong>April 1, 2026</strong> as “today” when seeded orders fall outside your rolling window.
            </AlertDescription>
          </Alert>
        ) : null}

        {view.mode === "illustrative" ? (
          <Alert className="mb-6">
            <Info className="h-4 w-4" aria-hidden />
            <AlertTitle>Illustrative sample</AlertTitle>
            <AlertDescription>
              No qualifying sell-in in the last 90 days — showing representative HQ numbers. Same logic as Markets.
            </AlertDescription>
          </Alert>
        ) : null}

        <Tabs defaultValue="classic" className="w-full">
          <TabsList className="mb-6 grid h-auto w-full gap-1 rounded-lg bg-muted/50 p-1 sm:grid-cols-3">
            <TabsTrigger value="classic" className="gap-2 py-2.5 font-medium">
              <LayoutGrid className="h-4 w-4 shrink-0" />
              Classic KPI board
            </TabsTrigger>
            <TabsTrigger value="cartographic" className="gap-2 py-2.5 font-medium">
              <Map className="h-4 w-4 shrink-0" />
              Cartographic
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2 py-2.5 font-medium">
              <Clock3 className="h-4 w-4 shrink-0" />
              Ops timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="classic" className="mt-0 space-y-6 outline-none">
            <p className="text-sm text-muted-foreground">
              Familiar tabular view — lowest cognitive lift; emphasis on KPIs, chart, and hub health flags.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-5">
                  <p className="text-xs text-muted-foreground">Active regions (90d)</p>
                  <p className="font-display text-2xl font-semibold tabular-nums">{view.active}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <p className="text-xs text-muted-foreground">Sell-in (30d)</p>
                  <p className="font-display text-2xl font-semibold tabular-nums">${view.rev30.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <p className="text-xs text-muted-foreground">Sell-in vs prior 30d</p>
                  <p className="flex items-center gap-2 font-display text-2xl font-semibold tabular-nums">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" aria-hidden />
                    {view.growth30 >= 0 ? "+" : ""}
                    {view.growth30}%
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 pt-5">
                  <LayoutGrid className="h-8 w-8 shrink-0 text-muted-foreground" aria-hidden />
                  <p className="text-sm text-muted-foreground">Anchor hubs — same model as Markets command view.</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid min-w-0 gap-4 lg:grid-cols-3">
              <Card className="min-w-0 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Sell-in by hub (30d)</CardTitle>
                </CardHeader>
                <CardContent className="min-w-0">
                  <div className="h-[260px] w-full min-w-0">
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
                        <RechartsTooltip
                          formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]}
                          contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                        />
                        <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg">Replenishment flags</CardTitle>
                </CardHeader>
                <CardContent>
                  {view.replenishment.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No replenishment rows.</p>
                  ) : (
                    <ul className="space-y-3 text-sm">
                      {view.replenishment.map((r) => (
                        <li key={r.id} className="rounded-lg border p-3">
                          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                            <span className="font-medium">{r.market}</span>
                            <StatusBadge status={r.urgency} />
                          </div>
                          <p className="text-xs text-muted-foreground">{r.reason}</p>
                          <p className="mt-2 text-xs font-medium tabular-nums">~{r.recommendedCases} cases</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Hub health &amp; cover (30d velocity)</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cartographic" className="mt-0 space-y-4 outline-none">
            <p className="text-sm text-muted-foreground">
              Stylized map — same five hubs as the Classic tab&apos;s Hub health table. Glyph size scales with 30d sell-through (cases); color reflects health. Not photoreal.
            </p>
            <Card className="relative min-h-[520px] overflow-hidden">
              <CardContent className="p-0">
                <TooltipProvider>
                  <CartographicBoard panelRows={view.panelRows} anchorSnap={view.snap} />
                </TooltipProvider>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="mt-0 space-y-4 outline-none">
            <p className="text-sm text-muted-foreground">
              Horizontal spine of shipments — foregrounds motion and logistics rhythm (inbound + outbound from live data).
            </p>
            <Card>
              <CardContent className="p-4 sm:p-6">
                <OpsTimeline shipments={timelineShipments} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}

function CartographicBoard({
  panelRows,
  anchorSnap,
}: {
  panelRows: MarketPanelRow[];
  anchorSnap: AnchorMarketSnapshotRow[];
}) {
  if (panelRows.length === 0) {
    return (
      <div className="flex min-h-[520px] items-center justify-center text-sm text-muted-foreground">
        No market data in range — switch to Classic view.
      </div>
    );
  }

  const maxSold = Math.max(...panelRows.map((r) => r.sold30dCases), 0.01);
  const sorted = [...panelRows].sort((a, b) => a.sold30dCases - b.sold30dCases);

  const healthRing: Record<MarketPanelRow["health"], string> = {
    healthy: "ring-emerald-500/50 shadow-emerald-900/10",
    watch: "ring-amber-500/50 shadow-amber-900/10",
    low: "ring-red-500/40 shadow-red-900/10",
  };

  const healthBg: Record<MarketPanelRow["health"], string> = {
    healthy: "bg-emerald-600 text-white",
    watch: "bg-amber-500 text-amber-950 dark:text-amber-950",
    low: "bg-red-600 text-white",
  };

  const artboardStyle = { height: "min(520px, 70vh)" } as const;

  return (
    <div className="relative w-full overflow-hidden bg-[hsl(40_18%_96%)] dark:bg-[hsl(24_10%_8%)]">
      <div className="pointer-events-none w-full shrink-0" style={artboardStyle} aria-hidden />
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-25"
          style={{
            backgroundImage: "radial-gradient(hsl(var(--muted-foreground) / 0.22) 1px, transparent 1px)",
            backgroundSize: "10px 10px",
          }}
        />
        <div className="pointer-events-none absolute inset-[8%] rounded-[40%] border border-border/20 bg-gradient-to-br from-muted/30 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute bottom-[12%] left-[8%] h-[35%] w-[38%] rounded-full bg-muted/20 blur-2xl" />
        <div className="pointer-events-none absolute right-[12%] top-[18%] h-[40%] w-[35%] rounded-full bg-muted/15 blur-2xl" />

        {sorted.map((row, idx) => {
          const pos = mapPosForPanelRow(row, idx, sorted.length);
          const t = row.sold30dCases / maxSold;
          const minS = 30;
          const maxS = 76;
          const size = Math.max(minS, minS + t * (maxS - minS));
          const anchor = anchorSnapForPanelRow(row, anchorSnap);
          const z = 10 + Math.round(t * 20);

          return (
            <Tooltip key={row.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-background font-mono font-bold tabular-nums shadow-md ring-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring",
                    healthBg[row.health],
                    healthRing[row.health],
                  )}
                  style={{
                    left: pos.left,
                    top: pos.top,
                    width: size,
                    height: size,
                    fontSize: Math.max(9, Math.min(15, size / 5)),
                    zIndex: z,
                    opacity: row.sold30dCases <= 0 && row.stockCases <= 0 ? 0.75 : 1,
                  }}
                >
                  {formatCasesGlyph(row.sold30dCases)}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="font-display font-semibold">{row.label}</p>
                <p className="text-xs text-muted-foreground">
                  Sold 30d: <strong className="text-foreground">{row.sold30dCases.toLocaleString()}</strong> cases · Est. stock:{" "}
                  {row.stockCases.toLocaleString()} cases
                  {row.daysCover !== null ? ` · ~${row.daysCover}d cover` : ""}
                </p>
                {anchor ? (
                  <p className="mt-1 border-t border-border/60 pt-1 text-[11px] text-muted-foreground">
                    Anchor sell-in (30d): ${anchor.revenue.toLocaleString()} · {anchor.orderCount} orders · {anchor.bottles.toLocaleString()}{" "}
                    btl
                  </p>
                ) : null}
                {row.note ? <p className="mt-1 text-[11px] text-muted-foreground">{row.note}</p> : null}
              </TooltipContent>
            </Tooltip>
          );
        })}

        <div className="absolute bottom-3 left-3 right-3 z-[5] flex flex-wrap gap-3 text-[11px] text-muted-foreground">
          <span className="rounded-md bg-background/90 px-2 py-1 shadow-sm backdrop-blur-sm dark:bg-background/70">
            Size ∝ 30d cases (same as Hub health)
          </span>
          <span className="rounded-md bg-background/90 px-2 py-1 shadow-sm backdrop-blur-sm dark:bg-background/70">
            Green / amber / red = healthy / watch / low
          </span>
        </div>
      </div>
    </div>
  );
}

function OpsTimeline({
  shipments,
}: {
  shipments: {
    id: string;
    origin: string;
    destination: string;
    carrier: string;
    shipDate: string;
    eta: string;
    status: string;
  }[];
}) {
  if (shipments.length === 0) {
    return <p className="text-sm text-muted-foreground">No shipments in app data — check Shipments after orders flow.</p>;
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-0 right-0 top-[22px] z-0 h-0.5 bg-border" />
      <div className="scrollbar-thin relative z-[1] flex gap-4 overflow-x-auto pb-2 pt-1">
        {shipments.map((s) => (
          <div
            key={s.id}
            className="min-w-[200px] max-w-[240px] shrink-0 rounded-xl border border-border/80 bg-card p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] font-medium text-muted-foreground">{s.id}</span>
              <StatusBadge status={s.status} />
            </div>
            <p className="mt-2 font-display text-sm font-semibold leading-snug">{s.destination}</p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              {s.origin} → {s.destination}
            </p>
            <div className="mt-3 space-y-1 border-t border-border/60 pt-3 text-[11px]">
              <div>
                <span className="text-muted-foreground">Ship </span>
                <span className="font-mono font-medium">{s.shipDate}</span>
              </div>
              <div>
                <span className="text-muted-foreground">ETA </span>
                <span className="font-mono font-medium">{s.eta || "—"}</span>
              </div>
              <div className="truncate text-muted-foreground">{s.carrier}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
