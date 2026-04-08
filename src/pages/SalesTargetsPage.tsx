import { useMemo } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { resolveSalesRepLabelForSession } from "@/data/team-roster";
import type { SalesOrder } from "@/data/mockData";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, DollarSign, Package, TrendingUp, Target as TargetIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const MS_DAY = 86400000;

function currentQuarterWindow(now = new Date()): { start: number; end: number; label: string } {
  const y = now.getFullYear();
  const q = Math.floor(now.getMonth() / 3);
  const start = new Date(y, q * 3, 1).getTime();
  const end = new Date(y, q * 3 + 3, 0, 23, 59, 59, 999).getTime();
  return { start, end, label: `Q${q + 1} ${y}` };
}

/** Demo quota — stable per rep name so Marcus vs Sarah see different “goals”. */
function quarterlyTargetCadForRep(repLabel: string): number {
  let h = 0;
  for (let i = 0; i < repLabel.length; i++) h = (h + repLabel.charCodeAt(i) * (i + 1)) % 9973;
  const base = 380_000 + (h % 120) * 1000;
  return Math.round(base / 1000) * 1000;
}

function orderInWindow(o: SalesOrder, start: number, end: number): boolean {
  if (o.status === "cancelled" || o.status === "draft") return false;
  const t = Date.parse(o.orderDate);
  if (Number.isNaN(t)) return false;
  return t >= start && t <= end;
}

function revenueInWindow(orders: SalesOrder[], rep: string, start: number, end: number): number {
  let s = 0;
  for (const o of orders) {
    if (o.salesRep !== rep) continue;
    if (!orderInWindow(o, start, end)) continue;
    s += o.price;
  }
  return s;
}

function monthBucketsInQuarter(start: number, end: number): { key: string; start: number; end: number; label: string }[] {
  const out: { key: string; start: number; end: number; label: string }[] = [];
  const d = new Date(start);
  while (d.getTime() <= end) {
    const ms = d.getTime();
    const me = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    const label = d.toLocaleString("en-CA", { month: "short" });
    out.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      start: ms,
      end: Math.min(me, end),
      label,
    });
    d.setMonth(d.getMonth() + 1);
    if (out.length >= 4) break;
  }
  return out;
}

export default function SalesTargetsPage() {
  const { data } = useAppData();
  const { user } = useAuth();
  const rep = useMemo(
    () => resolveSalesRepLabelForSession(user?.email, user?.displayName ?? ""),
    [user?.email, user?.displayName],
  );

  const { start, end, label: quarterLabel } = useMemo(() => currentQuarterWindow(), []);
  const targetCad = useMemo(() => quarterlyTargetCadForRep(rep), [rep]);

  const qtdRevenue = useMemo(
    () => revenueInWindow(data.salesOrders, rep, start, end),
    [data.salesOrders, rep, start, end],
  );

  const pctToGoal = targetCad > 0 ? Math.min(100, Math.round((qtdRevenue / targetCad) * 100)) : 0;
  const gap = Math.max(0, targetCad - qtdRevenue);

  const monthlySeries = useMemo(() => {
    const buckets = monthBucketsInQuarter(start, end);
    const pacePerMonthCad = targetCad / Math.max(1, buckets.length);
    return buckets.map((b) => {
      const actualCad = revenueInWindow(data.salesOrders, rep, b.start, b.end);
      return {
        month: b.label,
        actualK: Math.round((actualCad / 1000) * 10) / 10,
        paceK: Math.round((pacePerMonthCad / 1000) * 10) / 10,
      };
    });
  }, [data.salesOrders, rep, start, end, targetCad]);

  const byMarket = useMemo(() => {
    const m: Record<string, number> = {};
    for (const o of data.salesOrders) {
      if (o.salesRep !== rep) continue;
      if (!orderInWindow(o, start, end)) continue;
      const k = o.market.trim() || "Other";
      m[k] = (m[k] ?? 0) + o.price;
    }
    return Object.entries(m)
      .map(([market, revenue]) => ({ market, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [data.salesOrders, rep, start, end]);

  const pipelineDrafts = useMemo(
    () =>
      data.salesOrders.filter((o) => o.salesRep === rep && o.status === "draft").reduce((a, o) => a + o.price, 0),
    [data.salesOrders, rep],
  );

  const daysLeft = useMemo(() => {
    const left = Math.ceil((end - Date.now()) / MS_DAY);
    return Math.max(0, left);
  }, [end]);

  const isSalesRep = user.role === "sales_rep";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Targets & quota"
        description={`Quarterly sell-in vs goal for ${rep} — demo numbers tie to your orders in AppData (${quarterLabel}).`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="touch-manipulation" asChild>
              <Link to="/sales/orders?tab=pending-review">
                Draft orders <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button variant="secondary" size="sm" className="touch-manipulation" asChild>
              <Link to="/sales/reports">Open analytics</Link>
            </Button>
          </div>
        }
      />

      {!isSalesRep ? (
        <Card className="border-dashed border-amber-500/40 bg-amber-500/5">
          <CardContent className="py-4 text-sm text-muted-foreground">
            This screen is tailored for <strong className="text-foreground">Sales rep</strong> sign-in. Use{" "}
            <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Login → Demo persona
            </Link>{" "}
            (e.g. Marcus Chen) to see attributed sell-in. Data below uses your current display name for attribution.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              QTD sell-in
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold tabular-nums text-foreground">
              ${qtdRevenue.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">CAD · excludes drafts and cancelled</p>
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TargetIcon className="h-4 w-4" />
              Quarterly goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold tabular-nums text-foreground">
              ${targetCad.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Demo quota derived from your rep profile</p>
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              To goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold tabular-nums text-foreground">{pctToGoal}%</p>
            <div className="mt-2">
              <Progress value={pctToGoal} className="h-2" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {gap > 0 ? `${daysLeft} days left · $${gap.toLocaleString()} to go` : "At or above goal (demo)"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Package className="h-4 w-4" />
              Draft pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold tabular-nums text-foreground">
              ${pipelineDrafts.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Unapproved draft orders (not in QTD)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-border/80">
          <CardHeader>
            <CardTitle className="font-display text-base">Monthly pace ({quarterLabel})</CardTitle>
            <p className="text-sm text-muted-foreground">
              Actual sell-in (bars) vs even monthly pace to hit quota (outline).
            </p>
          </CardHeader>
          <CardContent className="h-[280px] pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}k`} width={44} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `$${(value * 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                    name === "actualK" ? "Actual" : "Even pace",
                  ]}
                  labelFormatter={(l) => String(l)}
                />
                <Bar dataKey="paceK" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} name="paceK" maxBarSize={48} />
                <Bar dataKey="actualK" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="actualK" maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-border/80">
          <CardHeader>
            <CardTitle className="font-display text-base">By market</CardTitle>
            <p className="text-sm text-muted-foreground">Share of your QTD sell-in</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {byMarket.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders in-window for this rep label.</p>
            ) : (
              byMarket.map((row) => {
                const share = qtdRevenue > 0 ? Math.round((row.revenue / qtdRevenue) * 100) : 0;
                return (
                  <div key={row.market} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium text-foreground">{row.market}</span>
                      <Badge variant="secondary" className="shrink-0 tabular-nums">
                        ${row.revenue.toLocaleString()}
                      </Badge>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full bg-primary/80 transition-all")}
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-base">How this demo works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Quota</strong> is a deterministic demo target from your rep name so the
            progress bar moves when you use Login → Sales rep personas (Sarah Kim, Marcus Chen, Luca Moretti).
          </p>
          <p>
            <strong className="text-foreground">QTD revenue</strong> sums <code className="rounded bg-muted px-1 text-xs">price</code> on
            sales orders where <code className="rounded bg-muted px-1 text-xs">salesRep</code> matches and{" "}
            <code className="rounded bg-muted px-1 text-xs">orderDate</code> falls in the current calendar quarter (excludes draft and cancelled).
          </p>
          <p>
            Production V2 can swap the mock quota for CRM quotas, manager overrides, and team roll-ups — same orders feed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
