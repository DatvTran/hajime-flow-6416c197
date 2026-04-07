import { useMemo, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Download } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { ANALYTICS_DEMO_REP_BOOK, resolveSalesRepLabelForSession } from "@/data/team-roster";
import {
  analyticsAsOfDateFromOrders,
  computeInventorySummary,
  computeTopAccounts,
  computeSalesByMonth,
  computeLocalAccountPerformanceByCity,
  countActiveMarkets,
  inventoryByStatusForChart,
  revenueInWindow,
} from "@/lib/hajime-metrics";
import {
  accountRevenueTrendRows,
  monthlySellInBottlesSeries,
  reorderIntervalDaysByAccount,
  topRegionsByRevenue,
} from "@/lib/analytics-display";

const ANALYTICS_TAGLINE = "Market and account trends, reorder cadence, regional performance, and sell-in volume over time";

const ANALYTICS_DEMO_HELP =
  "KPIs and charts use seed orders, inventory, and CRM. Brand Operator sees the full network; Sales Rep sees attributed sell-in. If your display name doesn’t match any order rep, we show a sample rep book so this page stays populated.";

function quarterSellInCad(orders: Parameters<typeof computeSalesByMonth>[0], now = new Date()) {
  const y = now.getFullYear();
  const q = Math.floor(now.getMonth() / 3);
  const start = new Date(y, q * 3, 1).getTime();
  const end = new Date(y, q * 3 + 3, 0, 23, 59, 59, 999).getTime();
  let s = 0;
  for (const o of orders) {
    if (o.status === "cancelled" || o.status === "draft") continue;
    const t = Date.parse(o.orderDate);
    if (Number.isNaN(t) || t < start || t > end) continue;
    s += o.price;
  }
  return s;
}

export default function Reports() {
  const { data } = useAppData();
  const { user } = useAuth();
  const rep = useMemo(
    () => resolveSalesRepLabelForSession(user?.email, user?.displayName ?? ""),
    [user?.email, user?.displayName],
  );
  const isSalesRep = user.role === "sales_rep";

  /** HQ: network orders. Rep: orders where `salesRep` matches session; if none match, use demo book so Analytics isn’t blank. */
  const { analyticsOrders, analyticsUsesDemoRepBook } = useMemo(() => {
    if (!isSalesRep) {
      return { analyticsOrders: data.salesOrders, analyticsUsesDemoRepBook: false };
    }
    const mine = data.salesOrders.filter((o) => o.salesRep === rep);
    if (mine.length > 0) {
      return { analyticsOrders: mine, analyticsUsesDemoRepBook: false };
    }
    const demoBook = data.salesOrders.filter((o) => o.salesRep === ANALYTICS_DEMO_REP_BOOK);
    if (demoBook.length > 0) {
      return { analyticsOrders: demoBook, analyticsUsesDemoRepBook: true };
    }
    return { analyticsOrders: data.salesOrders, analyticsUsesDemoRepBook: false };
  }, [data.salesOrders, isSalesRep, rep]);

  /** Account list for trend rows — rep’s assigned accounts plus any account name on their orders (sell-in path). */
  const analyticsAccounts = useMemo(() => {
    if (!isSalesRep) return data.accounts;
    const owned = new Set(data.accounts.filter((a) => a.salesOwner === rep).map((a) => a.tradingName));
    for (const o of analyticsOrders) owned.add(o.account);
    return data.accounts.filter((a) => owned.has(a.tradingName));
  }, [data.accounts, isSalesRep, rep, analyticsOrders]);

  const analyticsAsOf = useMemo(() => analyticsAsOfDateFromOrders(analyticsOrders), [analyticsOrders]);

  const [searchParams] = useSearchParams();
  const focus = searchParams.get("focus");
  const revenueMonthRef = useRef<HTMLDivElement>(null);
  const quarterRef = useRef<HTMLDivElement>(null);

  const salesByMonth = useMemo(
    () => computeSalesByMonth(analyticsOrders, 6, analyticsAsOf),
    [analyticsOrders, analyticsAsOf],
  );
  const inventoryByStatus = useMemo(
    () => (isSalesRep ? [] : inventoryByStatusForChart(computeInventorySummary(data.inventory))),
    [data.inventory, isSalesRep],
  );
  const topAccounts = useMemo(() => computeTopAccounts(analyticsOrders), [analyticsOrders]);
  const topRev = topAccounts[0]?.revenue ?? 1;

  useEffect(() => {
    const target = focus === "month" ? revenueMonthRef.current : focus === "quarter" ? quarterRef.current : null;
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [focus]);

  const ordersByStatus = useMemo(
    () =>
      analyticsOrders.reduce<Record<string, number>>((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      }, {}),
    [analyticsOrders],
  );

  const orderStatusData = Object.entries(ordersByStatus).map(([status, count]) => ({ status, count }));

  const localAccountsByCity = useMemo(
    () => computeLocalAccountPerformanceByCity(analyticsOrders, 30, analyticsAsOf),
    [analyticsOrders, analyticsAsOf],
  );

  const anchorMarketsWithData = useMemo(() => {
    return (["Toronto", "Milan"] as const).filter((c) => localAccountsByCity[c].length > 0);
  }, [localAccountsByCity]);

  const [localMarket, setLocalMarket] = useState<"Toronto" | "Milan">("Toronto");

  useEffect(() => {
    if (anchorMarketsWithData.length === 0) return;
    if (anchorMarketsWithData.length === 1) {
      setLocalMarket(anchorMarketsWithData[0]);
      return;
    }
    if (localAccountsByCity[localMarket].length === 0) {
      const tRev = localAccountsByCity.Toronto.reduce((s, r) => s + r.revenue, 0);
      const mRev = localAccountsByCity.Milan.reduce((s, r) => s + r.revenue, 0);
      setLocalMarket(tRev >= mRev ? "Toronto" : "Milan");
    }
  }, [anchorMarketsWithData, localAccountsByCity, localMarket]);

  const localMarketRows = localAccountsByCity[localMarket];

  const titleCity = useMemo(() => {
    if (anchorMarketsWithData.length === 0) return null;
    if (anchorMarketsWithData.length === 1) return anchorMarketsWithData[0];
    return localMarket;
  }, [anchorMarketsWithData, localMarket]);

  const topRegions = useMemo(
    () => topRegionsByRevenue(analyticsOrders, 90, analyticsAsOf),
    [analyticsOrders, analyticsAsOf],
  );
  const accountTrends = useMemo(
    () => accountRevenueTrendRows(analyticsOrders, analyticsAccounts, 30, analyticsAsOf),
    [analyticsOrders, analyticsAccounts, analyticsAsOf],
  );
  const reorderIntervals = useMemo(
    () => reorderIntervalDaysByAccount(analyticsOrders, 180, analyticsAsOf),
    [analyticsOrders, analyticsAsOf],
  );
  const bottleTrend = useMemo(
    () => monthlySellInBottlesSeries(analyticsOrders, 6, analyticsAsOf),
    [analyticsOrders, analyticsAsOf],
  );

  const headerKpis = useMemo(() => {
    if (isSalesRep) {
      return [
        { label: "QTD sell-in", value: `$${quarterSellInCad(analyticsOrders, analyticsAsOf).toLocaleString()}`, sub: "CAD · this quarter" },
        { label: "Accounts on book", value: String(analyticsAccounts.length), sub: "assigned + active orders" },
        { label: "Draft orders", value: String(analyticsOrders.filter((o) => o.status === "draft").length), sub: "pending review" },
        { label: "Markets (90d)", value: String(countActiveMarkets(analyticsOrders, 90, analyticsAsOf)), sub: "distinct regions" },
      ];
    }
    const inv = computeInventorySummary(data.inventory);
    return [
      { label: "Inventory on hand", value: inv.totalOnHand.toLocaleString(), sub: "bottles · all hubs" },
      { label: "Sell-in (90d)", value: `$${revenueInWindow(data.salesOrders, 90, analyticsAsOf).toLocaleString()}`, sub: "CAD · network" },
      { label: "Open pipeline", value: String(data.salesOrders.filter((o) => !["delivered", "cancelled"].includes(o.status)).length), sub: "orders in flight" },
      { label: "Active accounts", value: String(data.accounts.filter((a) => a.status === "active").length), sub: "CRM" },
    ];
  }, [isSalesRep, analyticsOrders, analyticsAccounts, analyticsAsOf, data.salesOrders, data.accounts, data.inventory]);

  const pageDescription = useMemo(() => {
    if (focus === "month") return "Monthly sell-in revenue from recorded orders.";
    if (focus === "quarter") return "Quarter context — top accounts by sell-in.";
    return ANALYTICS_TAGLINE;
  }, [focus]);

  return (
    <div>
      <Alert className="mb-4 border-dashed border-border bg-muted/25 py-3 sm:mb-6">
        <BarChart3 className="h-4 w-4 text-accent" aria-hidden />
        <AlertTitle className="text-sm font-semibold">Analytics demo workspace</AlertTitle>
        <AlertDescription className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {ANALYTICS_DEMO_HELP}
          {analyticsUsesDemoRepBook ? (
            <span className="mt-2 block font-medium text-foreground">
              Showing sample book ({ANALYTICS_DEMO_REP_BOOK}) — no orders matched &quot;{rep}&quot; on file.
            </span>
          ) : null}
        </AlertDescription>
      </Alert>

      <PageHeader
        title="Analytics"
        description={pageDescription}
        titleAddon={
          <Badge variant="secondary" className="font-normal">
            Demo
          </Badge>
        }
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-center touch-manipulation sm:w-auto"
            onClick={() =>
              toast.info("Export preview", {
                description: "CSV / PDF export is not wired in this demo build.",
              })
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 rounded-xl border border-border/60 bg-muted/15 p-3 sm:grid-cols-4 sm:p-4">
        {headerKpis.map((c) => (
          <div key={c.label} className="min-w-0 rounded-lg border border-border/50 bg-card/50 px-3 py-3 sm:px-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{c.label}</p>
            <p className="mt-1 font-display text-lg font-semibold tabular-nums leading-tight text-foreground sm:text-xl">
              {c.value}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader className="space-y-3 sm:flex sm:flex-row sm:items-end sm:justify-between sm:space-y-0">
            <div className="space-y-1">
              <CardTitle className="font-display text-lg">
                {titleCity ? `Account performance — ${titleCity}` : "Account performance"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {titleCity
                  ? (
                      <>
                        Trailing 30 days sell-in in {titleCity} only (excludes draft and cancelled).{" "}
                        {isSalesRep ? "Attributed to you. " : ""}
                        Bars rank your accounts in this market{titleCity === "Toronto" ? " (Ontario rolls up here)" : ""}.
                      </>
                    )
                  : "Trailing 30 days sell-in (excludes draft and cancelled)."}
              </p>
            </div>
            {anchorMarketsWithData.length > 1 ? (
              <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:min-w-[200px]">
                <Label htmlFor="local-market" className="text-xs text-muted-foreground">
                  Local market
                </Label>
                <Select value={localMarket} onValueChange={(v) => setLocalMarket(v as "Toronto" | "Milan")}>
                  <SelectTrigger id="local-market" className="touch-manipulation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {anchorMarketsWithData.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            {anchorMarketsWithData.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No sell-in in Toronto or Milan markets in the last 30 days.
              </p>
            ) : (
              <div className="rounded-xl border p-4">
                {localMarketRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No accounts with sell-in in this market in the last 30 days.</p>
                ) : (
                  <ul className="space-y-4">
                    {localMarketRows.map((row) => (
                      <li key={row.account}>
                        <p className="font-medium leading-snug text-foreground">{row.account}</p>
                        <p className="mt-0.5 font-display text-lg font-semibold tabular-nums text-foreground">
                          ${row.revenue.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {row.orderCount} order{row.orderCount !== 1 ? "s" : ""} · {row.bottles.toLocaleString()} bottles
                        </p>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-accent transition-all"
                            style={{ width: `${row.barPct}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div ref={revenueMonthRef} id="reports-revenue-month" className="scroll-mt-24 lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Sell-in revenue trend</CardTitle>
            <p className="text-sm text-muted-foreground">Last six months · monthly revenue</p>
          </CardHeader>
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

        {isSalesRep ? (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Orders by status</CardTitle>
              <p className="text-sm text-muted-foreground">Attributed sell-in pipeline</p>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full sm:h-[240px]">
                {orderStatusData.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No orders in pipeline.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={orderStatusData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="status" type="category" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" width={80} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 13 }} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Inventory by status</CardTitle>
              <p className="text-sm text-muted-foreground">Network warehouse buckets</p>
            </CardHeader>
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
        )}

        {!isSalesRep ? (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Orders by status</CardTitle>
              <p className="text-sm text-muted-foreground">All orders · network</p>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full sm:h-[240px]">
                {orderStatusData.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No orders in pipeline.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={orderStatusData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="status" type="category" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" width={80} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 13 }} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div ref={quarterRef} id="reports-quarter-focus" className="scroll-mt-24">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Top accounts by revenue</CardTitle>
            <p className="text-sm text-muted-foreground">Lifetime sell-in on record</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topAccounts.length === 0 && isSalesRep ? (
                <p className="text-sm text-muted-foreground">No closed sell-in yet — create drafts from My accounts.</p>
              ) : null}
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
            <p className="text-sm text-muted-foreground">Monthly bottles · confirmed sell-in</p>
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
            <CardTitle className="font-display text-lg">Regional performance (90d)</CardTitle>
            <p className="text-sm text-muted-foreground">By market / anchor city</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {topRegions.length === 0 ? (
              <p className="text-muted-foreground">No regional sell-in in the last 90 days.</p>
            ) : (
              topRegions.map((r) => (
                <div key={r.region} className="flex justify-between gap-2 border-b border-border/40 py-2 last:border-0">
                  <span className="font-medium">{r.region}</span>
                  <span className="tabular-nums text-muted-foreground">
                    ${r.revenue.toLocaleString()} · {r.orders} ord
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Account trends (30d)</CardTitle>
            <p className="text-sm text-muted-foreground">Recent vs prior 30 days sell-in</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {accountTrends.length === 0 ? (
              <p className="text-muted-foreground">Not enough history to compare 30-day windows.</p>
            ) : (
              accountTrends.slice(0, 8).map((a) => (
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
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">Reorder cadence</CardTitle>
            <p className="text-sm text-muted-foreground">Avg. days between orders per account · last 180d · 2+ orders</p>
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
