import { useMemo, useEffect, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useSearchParams } from "react-router-dom";
import { useAppData } from "@/contexts/AppDataContext";
import {
  computeInventorySummary,
  computeTopAccounts,
  computeSalesByMonth,
  computeTorontoMilanSnapshot,
  inventoryByStatusForChart,
} from "@/lib/hajime-metrics";
import {
  accountRevenueTrendRows,
  monthlySellInBottlesSeries,
  reorderIntervalDaysByAccount,
  topRegionsByRevenue,
} from "@/lib/analytics-display";

export default function Reports() {
  const { data } = useAppData();
  const [searchParams] = useSearchParams();
  const focus = searchParams.get("focus");
  const revenueMonthRef = useRef<HTMLDivElement>(null);
  const quarterRef = useRef<HTMLDivElement>(null);

  const salesByMonth = useMemo(() => computeSalesByMonth(data.salesOrders), [data.salesOrders]);
  const inventoryByStatus = useMemo(
    () => inventoryByStatusForChart(computeInventorySummary(data.inventory)),
    [data.inventory],
  );
  const topAccounts = useMemo(() => computeTopAccounts(data.salesOrders), [data.salesOrders]);
  const topRev = topAccounts[0]?.revenue ?? 1;

  useEffect(() => {
    const target = focus === "month" ? revenueMonthRef.current : focus === "quarter" ? quarterRef.current : null;
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [focus]);

  const ordersByStatus = useMemo(
    () =>
      data.salesOrders.reduce<Record<string, number>>((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      }, {}),
    [data.salesOrders],
  );

  const orderStatusData = Object.entries(ordersByStatus).map(([status, count]) => ({ status, count }));

  const torontoMilan = useMemo(() => {
    const snap = computeTorontoMilanSnapshot(data.salesOrders, 30);
    const maxRev = Math.max(snap[0].revenue, snap[1].revenue, 1);
    return snap.map((row) => ({ ...row, barPct: Math.round((row.revenue / maxRev) * 100) }));
  }, [data.salesOrders]);

  const topRegions = useMemo(() => topRegionsByRevenue(data.salesOrders, 90), [data.salesOrders]);
  const accountTrends = useMemo(
    () => accountRevenueTrendRows(data.salesOrders, data.accounts, 30),
    [data.salesOrders, data.accounts],
  );
  const reorderIntervals = useMemo(() => reorderIntervalDaysByAccount(data.salesOrders, 180), [data.salesOrders]);
  const bottleTrend = useMemo(() => monthlySellInBottlesSeries(data.salesOrders, 6), [data.salesOrders]);

  return (
    <div>
      <PageHeader
        title="Analytics"
        description={
          focus === "month"
            ? "Monthly sell-in revenue from live sales orders"
            : focus === "quarter"
              ? "Quarter context — top accounts from recorded orders"
              : "Market and account trends, reorder cadence, regional performance, and sell-in volume over time"
        }
        actions={
          <Button variant="outline" size="sm" className="w-full justify-center touch-manipulation sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Export All CSV
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">Market performance — Toronto vs Milan</CardTitle>
            <p className="text-sm text-muted-foreground">Trailing 30 days sell-in (excludes draft and cancelled orders).</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              {torontoMilan.map((row) => (
                <div key={row.city} className="rounded-xl border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{row.city}</p>
                  <p className="mt-2 font-display text-2xl font-semibold tabular-nums">${row.revenue.toLocaleString()}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {row.orderCount} order{row.orderCount !== 1 ? "s" : ""} · {row.bottles.toLocaleString()} bottles
                  </p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${row.barPct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div ref={revenueMonthRef} id="reports-revenue-month" className="scroll-mt-24 lg:col-span-1">
        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Sell-in revenue trend</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[200px] w-full sm:h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v / 1000}K`} />
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]} contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 13 }} />
                <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Inventory by status</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[200px] w-full sm:h-[240px]">
              {inventoryByStatus.length === 0 ? (
                <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No inventory rows.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inventoryByStatus}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ status, count }) => `${status}: ${count}`}
                      labelLine={{ stroke: "hsl(var(--muted-foreground))" }}
                      fontSize={11}
                    >
                      {inventoryByStatus.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Orders by Status</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[200px] w-full sm:h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderStatusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="status" type="category" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" width={80} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 13 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div ref={quarterRef} id="reports-quarter-focus" className="scroll-mt-24">
        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Top Accounts by Revenue</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topAccounts.map((acc, i) => (
                <div key={acc.name} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{acc.name}</span>
                      <span className="text-sm font-medium">${acc.revenue.toLocaleString()}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${(acc.revenue / topRev) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">Sell-in volume over time</CardTitle>
            <p className="text-sm text-muted-foreground">Monthly bottles (confirmed sell-in) — proxy for throughput until full sell-through feeds land.</p>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bottleTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Line type="monotone" dataKey="bottles" name="Bottles" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Top regions (90d)</CardTitle>
            <p className="text-sm text-muted-foreground">By order market / anchor city.</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {topRegions.map((r) => (
              <div key={r.region} className="flex justify-between gap-2 border-b border-border/40 py-2 last:border-0">
                <span className="font-medium">{r.region}</span>
                <span className="tabular-nums text-muted-foreground">
                  ${r.revenue.toLocaleString()} · {r.orders} ord
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Account trends (30d)</CardTitle>
            <p className="text-sm text-muted-foreground">Vs prior 30 days sell-in.</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {accountTrends.slice(0, 8).map((a) => (
              <div key={a.name} className="flex justify-between gap-2 border-b border-border/40 py-2 last:border-0">
                <span className="min-w-0 truncate font-medium">{a.name}</span>
                <span className="shrink-0 tabular-nums">
                  ${a.recent.toLocaleString()}{" "}
                  <span className={a.deltaPct >= 0 ? "text-emerald-600" : "text-destructive"}>
                    ({a.deltaPct >= 0 ? "+" : ""}
                    {a.deltaPct}%)
                  </span>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">Reorder frequency</CardTitle>
            <p className="text-sm text-muted-foreground">Average days between orders per account (last 180d, 2+ orders).</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {reorderIntervals.length === 0 ? (
                <p className="text-sm text-muted-foreground">Not enough repeat orders in window.</p>
              ) : (
                reorderIntervals.map((r) => (
                  <div key={r.name} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                    <span className="min-w-0 truncate font-medium">{r.name}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {r.avgDays === null ? "—" : `${r.avgDays}d`} · {r.orders} ord
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
