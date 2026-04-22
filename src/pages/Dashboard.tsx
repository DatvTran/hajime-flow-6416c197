import { useMemo, useState, useCallback } from "react";
import {
  Bell,
  Package,
  ShoppingCart,
  Globe,
  Truck,
  Users,
  Wine,
  Search,
  Factory,
  ArrowRight,
  ClipboardList,
  ExternalLink,
  Gift,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Warehouse,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { useAppData, useSalesOrders } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  cityKeyFromMarket,
  computeInventorySummary,
  countActiveMarkets,
  deriveAlerts,
  computeManufacturerDashboardStatus,
  isRetailChannelOrder,
  revenueInWindow,
} from "@/lib/hajime-metrics";
import { effectiveRepApprovalStatus } from "@/lib/order-routing";
import { computeOrderTabCounts, ORDER_TABS } from "@/lib/order-lifecycle";
import {
  buildPendingApprovalItems,
  computeMarketPanelRows,
  computeWeeklyVelocitySeries,
  computeWeeklyOrderCounts,
  computeVelocityByMarketLastWindow,
  computeVelocityByAccountLastWindow,
  computeVelocityByProduct,
  countShipmentEtaAlerts,
  computeDepletionSellThrough,
  countLowStockMarkets,
  mapDerivedAlertsToDecisionAlerts,
  computeHQReplenishmentSuggestions,
  computeBrandOperatorTopAccounts,
  mapShipmentStatusLabel,
  type MarketPanelRow,
} from "@/lib/brand-operator-metrics";
import { resolveAlertHref } from "@/lib/alert-links";

const MARKET_FILTERS = [
  { id: "all", label: "All markets" },
  { id: "toronto", label: "Toronto" },
  { id: "milan", label: "Milan" },
  { id: "paris", label: "Paris" },
  { id: "ontario", label: "Ontario LCBO" },
] as const;

const REGION_TABS = [
  { id: "all", label: "All" },
  { id: "apac", label: "APAC" },
  { id: "americas", label: "Americas" },
  { id: "emea", label: "EMEA" },
] as const;

function orderInMarketFilter(orderMarket: string, filter: (typeof MARKET_FILTERS)[number]["id"]): boolean {
  if (filter === "all") return true;
  if (!orderMarket) return false;
  const m = orderMarket?.toLowerCase() || "";
  if (filter === "toronto") return cityKeyFromMarket(orderMarket) === "Toronto";
  if (filter === "milan") return cityKeyFromMarket(orderMarket) === "Milan";
  if (filter === "paris") return cityKeyFromMarket(orderMarket) === "Paris";
  if (filter === "ontario") return m.includes("ontario");
  return true;
}

function healthStyles(h: MarketPanelRow["health"]) {
  if (h === "healthy") return "text-emerald-700 dark:text-emerald-400";
  if (h === "watch") return "text-amber-700 dark:text-amber-400";
  return "text-destructive";
}

function healthLabel(h: MarketPanelRow["health"]) {
  if (h === "healthy") return "Healthy";
  if (h === "watch") return "Watch";
  return "Low";
}

function severityDot(sev: string) {
  if (sev === "critical") return "bg-destructive";
  if (sev === "high") return "bg-orange-500";
  if (sev === "medium") return "bg-amber-500";
  return "bg-muted-foreground";
}

/** Simple KPI card for the Global Markets section. */
function KpiCard({
  label,
  val,
  sub,
  trend,
  tone,
  icon: Icon,
  accent,
  warn,
}: {
  label: string;
  val: string;
  sub: string;
  trend: string;
  tone: "up" | "down" | "flat";
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
  warn?: boolean;
}) {
  const toneColor =
    tone === "up"
      ? "text-emerald-600"
      : tone === "down"
        ? "text-destructive"
        : "text-amber-600";
  const TrendIcon = tone === "up" ? TrendingUp : tone === "down" ? TrendingDown : AlertTriangle;
  return (
    <div className="rounded-xl border border-border/60 bg-card/30 p-3 transition-colors hover:border-border hover:bg-card/60">
      <div className="flex items-start justify-between gap-2">
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 opacity-70",
            accent && "text-accent",
            warn && "text-amber-500",
          )}
        />
        <div className="flex items-center gap-1 text-[11px] font-medium">
          <TrendIcon className={cn("h-3 w-3", toneColor)} />
          <span className={toneColor}>{trend}</span>
        </div>
      </div>
      <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-display text-xl font-semibold tabular-nums text-foreground">{val}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

export default function Dashboard() {
  const { data } = useAppData();
  const { patchSalesOrder } = useSalesOrders();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const canApproveDraftQueue = user?.role === "brand_operator";

  const [marketFilter, setMarketFilter] = useState<(typeof MARKET_FILTERS)[number]["id"]>("all");
  const [rangeDays, setRangeDays] = useState<7 | 30 | 90>(30);
  const [velocityMode, setVelocityMode] = useState<"trend" | "market" | "account" | "product">("trend");
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState<(typeof REGION_TABS)[number]["id"]>("all");

  const filteredOrders = useMemo(
    () => data.salesOrders.filter((o) => orderInMarketFilter(o.market, marketFilter)),
    [data.salesOrders, marketFilter],
  );

  const inventorySummary = useMemo(() => computeInventorySummary(data.inventory, data.purchaseOrders), [data.inventory, data.purchaseOrders]);
  const marketRows = useMemo(
    () => computeMarketPanelRows(data, rangeDays),
    [data, rangeDays],
  );
  const pendingItems = useMemo(() => buildPendingApprovalItems(data), [data]);
  const pendingFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pendingItems;
    return pendingItems.filter(
      (p) =>
        (p.order?.account?.toLowerCase() || "").includes(q) ||
        (p.order?.id?.toLowerCase() || "").includes(q) ||
        (p.city?.toLowerCase() || "").includes(q),
    );
  }, [pendingItems, search]);

  const orderTabCounts = useMemo(() => computeOrderTabCounts(data.salesOrders), [data.salesOrders]);

  const sellThrough = useMemo(
    () => computeDepletionSellThrough(data.depletionReports ?? [], 30),
    [data.depletionReports],
  );
  const activeAccounts = useMemo(
    () => data.accounts.filter((a) => a.status === "active").length,
    [data.accounts],
  );
  const lowStockMarkets = useMemo(() => countLowStockMarkets(marketRows), [marketRows]);
  const shipmentAlerts = useMemo(() => countShipmentEtaAlerts(data.shipments), [data.shipments]);
  const hubAlerts = useMemo(() => deriveAlerts(data), [data]);
  /** Same derivation rules as Alerts hub (`deriveAlerts` → unified queue). */
  const decisionAlerts = useMemo(
    () => mapDerivedAlertsToDecisionAlerts(deriveAlerts(data)),
    [data],
  );
  const replenishment = useMemo(() => computeHQReplenishmentSuggestions(data), [data]);
  const topAccounts = useMemo(
    () => computeBrandOperatorTopAccounts(data.salesOrders, data.accounts),
    [data.salesOrders, data.accounts],
  );
  const mfgStatus = useMemo(() => computeManufacturerDashboardStatus(data), [data]);

  const weeklySeries = useMemo(
    () => computeWeeklyVelocitySeries(filteredOrders, 10),
    [filteredOrders],
  );
  const weeklyOrderCounts = useMemo(
    () => computeWeeklyOrderCounts(filteredOrders, 10),
    [filteredOrders],
  );

  const velocityMarkets = useMemo(
    () => computeVelocityByMarketLastWindow(filteredOrders, rangeDays),
    [filteredOrders, rangeDays],
  );
  const velocityAccounts = useMemo(
    () => computeVelocityByAccountLastWindow(filteredOrders, rangeDays),
    [filteredOrders, rangeDays],
  );
  const velocityProducts = useMemo(
    () => computeVelocityByProduct(filteredOrders, rangeDays),
    [filteredOrders, rangeDays],
  );

  /* ── Global Markets widget data ── */
  const revMTD = useMemo(() => revenueInWindow(data.salesOrders, 30), [data.salesOrders]);
  const revPrior30 = useMemo(() => {
    const now = new Date();
    const mid = new Date(now.getTime() - 30 * 86400000);
    const start = new Date(mid.getTime() - 30 * 86400000);
    return data.salesOrders
      .filter((o) => {
        const t = Date.parse(o.orderDate);
        return !Number.isNaN(t) && t >= start.getTime() && t < mid.getTime() && o.status !== "cancelled" && o.status !== "draft";
      })
      .reduce((sum, o) => sum + o.price, 0);
  }, [data.salesOrders]);
  const revTrend = revPrior30 > 0 ? ((revMTD - revPrior30) / revPrior30) * 100 : 0;

  const avgSellThrough = sellThrough;
  const sellThroughTrend = 2.1; // placeholder — compute from historical if needed

  const globalStockCases = Math.round(inventorySummary.totalOnHand / 12);
  const stockTrend = -4.2; // placeholder

  const flaggedMarkets = marketRows.filter((r) => r.health !== "healthy").length;

  const regionChartData = useMemo(() => {
    const byMarket: Record<string, number> = {};
    for (const o of data.salesOrders) {
      if (o.status === "cancelled" || o.status === "draft") continue;
      const t = Date.parse(o.orderDate);
      const cutoff = Date.now() - 365 * 86400000;
      if (Number.isNaN(t) || t < cutoff) continue;
      const city = cityKeyFromMarket(o.market) || o.market;
      byMarket[city] = (byMarket[city] ?? 0) + o.price;
    }
    return Object.entries(byMarket)
      .map(([market, revenue]) => ({ market, revenue: Math.round(revenue / 1000) }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [data.salesOrders]);

  const regionMixData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of data.salesOrders) {
      if (o.status === "cancelled" || o.status === "draft") continue;
      const t = Date.parse(o.orderDate);
      const cutoff = Date.now() - 30 * 86400000;
      if (Number.isNaN(t) || t < cutoff) continue;
      const city = cityKeyFromMarket(o.market) || o.market;
      map[city] = (map[city] ?? 0) + o.price;
    }
    const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
    const COLORS = ["hsl(var(--accent))", "hsl(220 45% 45%)", "hsl(var(--foreground) / 0.35)", "hsl(150 45% 45%)", "hsl(30 80% 55%)"];
    return Object.entries(map)
      .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [data.salesOrders]);

  const top5Markets = useMemo(() => {
    const map: Record<string, { name: string; region: string; revMTD: number; revTrend: number; sellThrough: number; coverDays: number | null; status: string }> = {};
    for (const o of data.salesOrders) {
      if (o.status === "cancelled" || o.status === "draft") continue;
      const t = Date.parse(o.orderDate);
      const cutoff = Date.now() - 30 * 86400000;
      if (Number.isNaN(t) || t < cutoff) continue;
      const city = cityKeyFromMarket(o.market) || o.market;
      if (!map[city]) {
        const region =
          city === "Toronto" || city === "Ontario"
            ? "Americas"
            : city === "Milan" || city === "Paris" || city === "Spain"
              ? "EMEA"
              : "APAC";
        map[city] = { name: city, region, revMTD: 0, revTrend: 0, sellThrough: 0, coverDays: null, status: "healthy" };
      }
      map[city].revMTD += o.price;
    }
    // Merge with panel rows for cover days / health
    for (const row of marketRows) {
      const key = row.label;
      if (map[key]) {
        map[key].coverDays = row.daysCover;
        map[key].status = row.health === "low" ? "low-cover" : row.health === "watch" ? "low-cover" : "healthy";
      }
    }
    return Object.values(map)
      .filter((m) => (regionFilter === "all" ? true : m.region.toLowerCase() === regionFilter))
      .sort((a, b) => b.revMTD - a.revMTD)
      .slice(0, 5);
  }, [data.salesOrders, marketRows, regionFilter]);

  const onApprove = useCallback(
    (orderId: string) => {
      const o = data.salesOrders.find((x) => x.id === orderId);
      if (
        o &&
        isRetailChannelOrder(o, data.accounts) &&
        o.lines &&
        o.lines.length > 0 &&
        effectiveRepApprovalStatus(o, data.accounts) === "pending"
      ) {
        patchSalesOrder(orderId, { repApprovalStatus: "approved" });
        toast.success("Rep approval recorded", { description: `${orderId} — capture payment in Orders, then wholesaler ships.` });
        return;
      }
      patchSalesOrder(orderId, { status: "confirmed" });
      toast.success("Order approved", { description: `${orderId} is confirmed for fulfillment.` });
    },
    [patchSalesOrder, data.salesOrders, data.accounts],
  );

  const onReject = useCallback(
    (orderId: string) => {
      patchSalesOrder(orderId, { status: "cancelled" });
      toast.info("Order rejected", { description: `${orderId} marked cancelled.` });
    },
    [patchSalesOrder],
  );

  const alertBadgeCount = useMemo(
    () => Math.min(99, hubAlerts.filter((a) => a.severity === "high").length + shipmentAlerts),
    [hubAlerts, shipmentAlerts],
  );

  return (
    <div className="min-w-0 space-y-6">
      {/* Command bar */}
      <div className="rounded-xl border border-border/80 bg-card/40 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground/5">
                <Wine className="h-5 w-5 text-foreground/80" aria-hidden />
              </div>
              <div>
                <p className="font-display text-sm font-semibold tracking-tight">Hajime HQ</p>
                <p className="text-[11px] text-muted-foreground">Brand operator</p>
              </div>
            </div>
            <Select value={marketFilter} onValueChange={(v) => setMarketFilter(v as typeof marketFilter)}>
              <SelectTrigger className="h-9 w-[160px] touch-manipulation border-border/60 bg-background/80">
                <Globe className="mr-2 h-3.5 w-3.5 opacity-60" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MARKET_FILTERS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(rangeDays)} onValueChange={(v) => setRangeDays(Number(v) as 7 | 30 | 90)}>
              <SelectTrigger className="h-9 w-[130px] touch-manipulation border-border/60 bg-background/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-1 flex-wrap items-center gap-2 lg:max-w-xl lg:justify-end">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search approvals…"
                className="h-9 border-border/60 bg-background/80 pl-8"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="relative h-9 w-9 shrink-0 touch-manipulation"
                  aria-label="Open alerts"
                >
                  <Bell className="h-4 w-4" />
                  {alertBadgeCount > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                      {alertBadgeCount}
                    </span>
                  ) : null}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[min(100vw-2rem,380px)] p-0" align="end">
                <div className="border-b px-4 py-3">
                  <p className="font-display text-sm font-semibold tracking-tight">Notifications</p>
                  <Link
                    to="/alerts#active-queue"
                    className="mt-1 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    Active queue
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">Same list as Alerts hub — inventory, PO, logistics, demand, AR.</p>
                </div>
                <ScrollArea className="max-h-[min(50vh,280px)]">
                  <div className="space-y-0 p-2">
                    {hubAlerts.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 px-2 py-8 text-center">
                        <Bell className="h-7 w-7 text-muted-foreground/20" strokeWidth={1} />
                        <p className="text-sm text-muted-foreground">No alerts right now</p>
                      </div>
                    ) : (
                      hubAlerts.slice(0, 8).map((a) => (
                        <Link
                          key={a.id}
                          to={resolveAlertHref(a, "brand_operator")}
                          className="block rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-xs no-underline transition-colors last:mb-0 hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <div className="flex items-center gap-2">
                            <span className={cn("h-2 w-2 shrink-0 rounded-full", severityDot(a.severity))} />
                            <span className="font-medium capitalize text-foreground">{a.severity}</span>
                            <span className="text-muted-foreground">· {a.type.replace(/-/g, " ")}</span>
                          </div>
                          <p className="mt-1 leading-snug text-foreground">{a.message}</p>
                        </Link>
                      ))
                    )}
                  </div>
                </ScrollArea>
                <div className="border-t p-2">
                  <Button variant="secondary" size="sm" className="w-full touch-manipulation" asChild>
                    <Link to="/alerts#active-queue">Open Alerts hub</Link>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 touch-manipulation text-muted-foreground"
              onClick={() => navigate("/settings")}
            >
              {user?.displayName ?? "Profile"}
            </Button>
            <Button variant="outline" size="sm" className="h-9 touch-manipulation" onClick={() => signOut()}>
              Log out
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Command center
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          One calm view of sell-through, stock health, approvals, and shipments — filtered to{" "}
          <span className="text-foreground/90">{MARKET_FILTERS.find((m) => m.id === marketFilter)?.label}</span>
          , last {rangeDays} days.
        </p>
      </div>

      {/* KPI strip — asymmetric layout: 2 featured + 4 compact */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {/* Featured card — Inventory (spans 2 on lg) */}
        <Link
          to="/inventory"
          className="card-interactive group col-span-2 no-underline"
        >
          <div className="flex h-full flex-col justify-between p-4">
            <div className="flex items-start justify-between">
              <Package className="h-5 w-5 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-accent" strokeWidth={1.5} />
              <Badge variant="outline" className="text-[10px]">
                {inventorySummary.totalOnHand > 0 ? "In stock" : "Empty"}
              </Badge>
            </div>
            <div>
              <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Global inventory</p>
              <p className="font-display text-2xl font-semibold tabular-nums text-foreground">{inventorySummary.totalOnHand.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">bottles on hand</p>
            </div>
          </div>
        </Link>
        {/* Compact cards */}
        <Link to="/orders?tab=pending-review" className="card-interactive group no-underline">
          <div className="flex h-full flex-col justify-between p-3">
            <ShoppingCart className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-accent" strokeWidth={1.5} />
            <div>
              <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Pending review</p>
              <p className="font-display text-xl font-semibold tabular-nums text-foreground">{orderTabCounts["pending-review"]}</p>
              <p className="text-[10px] text-muted-foreground">draft orders</p>
            </div>
          </div>
        </Link>
        <Link to="/reports?focus=month" className="card-interactive group no-underline">
          <div className="flex h-full flex-col justify-between p-3">
            <Globe className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-accent" strokeWidth={1.5} />
            <div>
              <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">30d sell-through</p>
              <p className="font-display text-xl font-semibold tabular-nums text-foreground">{sellThrough}%</p>
              <p className="text-[10px] text-muted-foreground">vs available pool</p>
            </div>
          </div>
        </Link>
        <Link to="/accounts" className="card-interactive group no-underline">
          <div className="flex h-full flex-col justify-between p-3">
            <Users className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-accent" strokeWidth={1.5} />
            <div>
              <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Active accounts</p>
              <p className="font-display text-xl font-semibold tabular-nums text-foreground">{activeAccounts}</p>
              <p className="text-[10px] text-muted-foreground">in CRM</p>
            </div>
          </div>
        </Link>
        <Link to="/markets" className="card-interactive group no-underline">
          <div className="flex h-full flex-col justify-between p-3">
            <Truck className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-accent" strokeWidth={1.5} />
            <div>
              <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Low-stock markets</p>
              <p className="font-display text-xl font-semibold tabular-nums text-foreground">{lowStockMarkets}</p>
              <p className="text-[10px] text-muted-foreground">need attention</p>
            </div>
          </div>
        </Link>
        <Link to="/shipments" className="card-interactive group no-underline">
          <div className="flex h-full flex-col justify-between p-3">
            <Bell className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-accent" strokeWidth={1.5} />
            <div>
              <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Shipment alerts</p>
              <p className="font-display text-xl font-semibold tabular-nums text-foreground">{shipmentAlerts}</p>
              <p className="text-[10px] text-muted-foreground">ETA / delay</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        {/* Left */}
        <div className="space-y-6 xl:col-span-3">
          <div className="card-elevated border-border/70 shadow-none">
          <div className="border-b border-border/50 p-5 pb-3">
            <h3 className="pb-2">
              <CardTitle className="font-display text-base">Order approval queue</CardTitle>
              <p className="text-xs text-muted-foreground">
                Same lifecycle as Orders — pending review through distributor processing. Drafts awaiting HQ allocation.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="mb-3 flex flex-wrap gap-1.5">
                {ORDER_TABS.map((t) => (
                  <Link
                    key={t.id}
                    to={`/orders?tab=${t.id}`}
                    className="inline-flex items-center rounded-md border border-border/60 bg-muted/30 px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                  >
                    {t.label}{" "}
                    <span className="ml-1 tabular-nums text-foreground">({orderTabCounts[t.id]})</span>
                  </Link>
                ))}
              </div>
              <ScrollArea className="h-[min(420px,50vh)] pr-3">
                {pendingFiltered.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground/20" strokeWidth={1} />
                    <p className="text-sm text-muted-foreground">No orders pending review</p>
                    <Button variant="outline" size="sm" className="h-8 text-xs touch-manipulation" asChild>
                      <Link to="/orders?tab=new">Create order</Link>
                    </Button>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {pendingFiltered.map((item) => {
                      const partial = Math.min(
                        Math.floor(item.availableCasesInMarket),
                        Math.ceil(item.requestedCases),
                      );
                      return (
                        <li
                          key={item.order.id}
                          className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium leading-tight">{item.order.account}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.city} · {item.order.market}
                              </p>
                            </div>
                            <Badge variant="outline" className="shrink-0 text-[10px]">
                              {item.accountLabel}
                            </Badge>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Requested:{" "}
                            <span className="font-medium text-foreground">{item.requestedCases} cases</span> · SKU{" "}
                            <span className="font-mono">{item.primarySku}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Available (regional pool):{" "}
                            <span className="font-medium text-foreground">{item.availableCasesInMarket} cases</span>
                          </p>
                          <p className="text-xs text-muted-foreground">Submitted: {item.orderDateLabel}</p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {canApproveDraftQueue ? (
                              <>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="h-8 touch-manipulation text-xs"
                                  onClick={() => onApprove(item.order.id)}
                                >
                                  Approve
                                </Button>
                                {partial >= 1 && partial < item.requestedCases ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    className="h-8 touch-manipulation text-xs"
                                    onClick={() => {
                                      onApprove(item.order.id);
                                      toast.message("Partial allocation", {
                                        description: `Recorded up to ${partial} cases from regional pool — adjust lines in Orders if needed.`,
                                      });
                                    }}
                                  >
                                    Approve {partial}
                                  </Button>
                                ) : null}
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 touch-manipulation text-xs text-destructive hover:text-destructive"
                                  onClick={() => onReject(item.order.id)}
                                >
                                  Reject
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-8 touch-manipulation text-xs"
                                  onClick={() =>
                                    toast.message("On hold", {
                                      description: `${item.order.id} kept as draft — follow up with the account.`,
                                    })
                                  }
                                >
                                  Hold
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-8 touch-manipulation text-xs"
                                  asChild
                                >
                                  <Link to="/markets">Reallocate</Link>
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 touch-manipulation text-xs"
                                  onClick={() =>
                                    toast.message("Distributor path", {
                                      description: "Route this request through your wholesale partner workflow (V1: manual).",
                                    })
                                  }
                                >
                                  To distributor
                                </Button>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Awaiting HQ review
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </ScrollArea>
              <Button variant="link" className="mt-2 h-auto px-0 text-xs" asChild>
                <Link to="/orders?tab=pending-review" className="inline-flex items-center gap-1">
                  Open orders <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <div className="card-elevated border-border/70 shadow-none">
          <div className="border-b border-border/50 p-5 pb-3">
            <h3 className="pb-2">
              <CardTitle className="font-display text-base">Critical alerts</CardTitle>
              <p className="text-xs text-muted-foreground">Same active queue as Alerts hub — inventory, PO, logistics, demand, AR.</p>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <ScrollArea className="h-[min(280px,36vh)] pr-2">
                {decisionAlerts.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <Bell className="h-7 w-7 text-muted-foreground/20" strokeWidth={1} />
                    <p className="text-sm text-muted-foreground">No critical alerts</p>
                    <p className="text-[11px] text-muted-foreground/60">Everything looks healthy right now.</p>
                  </div>
                ) : (
                  decisionAlerts.slice(0, 8).map((a) => (
                    <div
                      key={a.id}
                      className="mb-2 rounded-lg border border-border/50 bg-muted/10 p-2.5 text-xs last:mb-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 shrink-0 rounded-full", severityDot(a.severity))} />
                        <span className="font-medium capitalize text-foreground">{a.severity}</span>
                        <span className="text-muted-foreground">· {a.source}</span>
                      </div>
                      <p className="mt-1 font-medium leading-snug text-foreground">{a.title}</p>
                      <p className="mt-0.5 text-muted-foreground">{a.body}</p>
                      <p className="mt-1 border-l-2 border-accent/40 pl-2 text-[11px] text-foreground/90">{a.action}</p>
                    </div>
                  ))
                )}
              </ScrollArea>
              <Button variant="outline" size="sm" className="w-full touch-manipulation" asChild>
                <Link to="/alerts">Alerts hub</Link>
              </Button>
            </CardContent>
          </Card>

          <div className="card-elevated border-border/70 shadow-none">
          <div className="border-b border-border/50 p-5 pb-3">
            <h3 className="pb-2">
              <CardTitle className="font-display text-base">Production requests</CardTitle>
              <p className="text-xs text-muted-foreground">
                Same rows as Purchase orders — request qty, region, SKU, status, ship dates.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[min(200px,32vh)] pr-2">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-1.5 font-medium">Request</th>
                      <th className="pb-1.5 font-medium">Qty</th>
                      <th className="pb-1.5 font-medium">Region</th>
                      <th className="pb-1.5 font-medium">SKU</th>
                      <th className="pb-1.5 font-medium">Status</th>
                      <th className="pb-1.5 font-medium">Ship</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.purchaseOrders.map((po) => (
                      <tr key={po.id} className="border-b border-border/40 last:border-0">
                        <td className="py-1.5 font-mono text-[10px] font-medium text-primary">
                          <Link to="/purchase-orders" className="hover:underline">
                            {po.id}
                          </Link>
                        </td>
                        <td className="py-1.5 tabular-nums">{po.quantity.toLocaleString()}</td>
                        <td className="py-1.5">{po.marketDestination}</td>
                        <td className="py-1.5 font-mono text-[10px]">{po.sku}</td>
                        <td className="py-1.5">
                          <StatusBadge status={po.status} />
                        </td>
                        <td className="py-1.5 tabular-nums text-muted-foreground">{po.requestedShipDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
              <Button variant="link" className="mt-1 h-auto px-0 text-xs" asChild>
                <Link to="/purchase-orders" className="inline-flex items-center gap-1">
                  Open production requests <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <div className="card-elevated border-border/70 shadow-none">
          <div className="border-b border-border/50 p-5 pb-3">
            <h3 className="pb-2">
              <CardTitle className="font-display text-base">Replenishment</CardTitle>
              <p className="text-xs text-muted-foreground">Velocity + open POs — aligned with production requests above.</p>
            </CardHeader>
            <CardContent className="space-y-2 pt-0 text-sm">
              {replenishment.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <ClipboardList className="h-7 w-7 text-muted-foreground/20" strokeWidth={1} />
                  <p className="text-sm text-muted-foreground">No replenishment suggestions</p>
                  <p className="text-[11px] text-muted-foreground/60">Check inventory levels and open POs to generate recommendations.</p>
                </div>
              ) : (
                replenishment.map((r) => (
                  <div key={r.id} className="rounded-lg border border-border/50 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{r.market}</span>
                      <Badge variant={r.urgency === "high" ? "destructive" : "secondary"} className="text-[10px]">
                        {r.urgency}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{r.reason}</p>
                    <p className="mt-1 text-xs">
                      Suggested: <span className="font-semibold">{r.recommendedCases} cases</span>
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Center */}
        <div className="space-y-6 xl:col-span-6">
          {/* ── Global markets section (widget embed) ── */}
          <section className="space-y-4">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight">Global markets</h2>
                <p className="text-xs text-muted-foreground">
                  Sell-through, stock cover &amp; in-flight logistics · {countActiveMarkets(data.salesOrders, 90)} active markets
                </p>
              </div>
              <Link
                to="/markets"
                className="text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                View all →
              </Link>
            </div>

            {/* 4 KPI cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard
                label="REVENUE · MTD"
                val={`$${(revMTD / 1000000).toFixed(2)}M`}
                sub={`vs $${(revPrior30 / 1000000).toFixed(2)}M LY`}
                trend={`${revTrend >= 0 ? "+" : ""}${revTrend.toFixed(1)}%`}
                tone={revTrend >= 0 ? "up" : "down"}
                icon={BarChart3}
              />
              <KpiCard
                label="AVG SELL-THROUGH"
                val={`${avgSellThrough}%`}
                sub="30-day rolling · 12 markets"
                trend={`+${sellThroughTrend}pts`}
                tone="up"
                icon={ShoppingCart}
                accent
              />
              <KpiCard
                label="GLOBAL STOCK"
                val={globalStockCases.toLocaleString()}
                sub="cases · 46d avg cover"
                trend={`${stockTrend}%`}
                tone="down"
                icon={Warehouse}
              />
              <KpiCard
                label="MARKETS FLAGGED"
                val={String(flaggedMarkets)}
                sub="3 low cover · 2 overstock"
                trend="hold"
                tone="flat"
                icon={AlertTriangle}
                warn
              />
            </div>

            {/* Charts row */}
            <div className="grid gap-4 sm:grid-cols-5">
              <div className="card-elevated border-border/70 shadow-none sm:col-span-3">
          <div className="border-b border-border/50 p-5 pb-3">
            <h3 className="pb-2">
                  <CardTitle className="font-display text-sm">Revenue by region</CardTitle>
                  <p className="text-xs text-muted-foreground">Last 12 months, $K</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={regionChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="market" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 8,
                            border: "1px solid hsl(var(--border))",
                            fontSize: 12,
                          }}
                          formatter={(v: number) => [`$${v}K`, "Revenue"]}
                        />
                        <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <div className="card-elevated border-border/70 shadow-none sm:col-span-2">
          <div className="border-b border-border/50 p-5 pb-3">
            <h3 className="pb-2">
                  <CardTitle className="font-display text-sm">Region mix</CardTitle>
                  <p className="text-xs text-muted-foreground">Share of MTD revenue</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={regionMixData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                          nameKey="name"
                        >
                          {regionMixData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: number, n: string) => {
                            const total = regionMixData.reduce((a, b) => a + b.value, 0) || 1;
                            const pct = ((v / total) * 100).toFixed(1);
                            return [`${pct}%`, n];
                          }}
                          contentStyle={{
                            borderRadius: 8,
                            border: "1px solid hsl(var(--border))",
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {regionMixData.map((entry) => {
                      const total = regionMixData.reduce((a, b) => a + b.value, 0) || 1;
                      const pct = ((entry.value / total) * 100).toFixed(1);
                      return (
                        <div key={entry.name} className="flex items-center gap-1 text-[11px]">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-muted-foreground">{entry.name}</span>
                          <span className="font-medium">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Truncated markets table */}
            <div className="card-elevated border-border/70 shadow-none">
          <div className="border-b border-border/50 p-5 pb-3">
            <h3 className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-2">
                <div>
                  <CardTitle className="font-display text-sm">Market detail</CardTitle>
                  <p className="text-xs text-muted-foreground">Top 5 markets by MTD revenue</p>
                </div>
                <div className="flex gap-1">
                  {REGION_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setRegionFilter(tab.id)}
                      className={cn(
                        "rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                        regionFilter === tab.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/30 text-muted-foreground hover:bg-muted/60",
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto pt-0">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-2 font-medium">Market</th>
                      <th className="pb-2 font-medium">Region</th>
                      <th className="pb-2 font-medium text-right">Rev MTD</th>
                      <th className="pb-2 font-medium text-right">Sell-through</th>
                      <th className="pb-2 font-medium text-right">Cover</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top5Markets.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Globe className="h-7 w-7 text-muted-foreground/20" strokeWidth={1} />
                            <p className="text-sm text-muted-foreground">No markets match the selected filter</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      top5Markets.map((row) => (
                        <tr key={row.name} className="border-b border-border/40 last:border-0">
                          <td className="py-2.5 font-medium">{row.name}</td>
                          <td className="py-2.5 text-xs text-muted-foreground">{row.region}</td>
                          <td className="py-2.5 text-right tabular-nums">${row.revMTD.toLocaleString()}</td>
                          <td className="py-2.5 text-right tabular-nums">{row.sellThrough}%</td>
                          <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                            {row.coverDays === null ? "—" : `${row.coverDays}d`}
                          </td>
                          <td className="py-2.5">
                            <StatusBadge status={row.status === "healthy" ? "healthy" : "low-cover"} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </section>

          <div className="card-elevated border-border/70 shadow-none">
          <div className="border-b border-border/50 p-5 pb-3">
            <h3 className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-2">
              <div>
                <CardTitle className="font-display text-base">Sales velocity</CardTitle>
                <p className="text-xs text-muted-foreground">Speed of sell-in — bottles or revenue by week.</p>
              </div>
              <Select value={velocityMode} onValueChange={(v) => setVelocityMode(v as typeof velocityMode)}>
                <SelectTrigger className="h-8 w-[180px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trend">Weekly trend</SelectItem>
                  <SelectItem value="market">By market ({rangeDays}d)</SelectItem>
                  <SelectItem value="account">By account ({rangeDays}d)</SelectItem>
                  <SelectItem value="product">By SKU ({rangeDays}d)</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[240px] w-full">
                {velocityMode === "trend" ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklySeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid hsl(var(--border))",
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="bottles"
                        name="Bottles"
                        stroke="hsl(var(--accent))"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : velocityMode === "market" ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={velocityMarkets} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip />
                      <Bar dataKey="bottles" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} name="Bottles" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : velocityMode === "account" ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={velocityAccounts} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip />
                      <Bar dataKey="bottles" fill="hsl(220 45% 45%)" radius={[0, 4, 4, 0]} name="Bottles" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={velocityProducts} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis type="category" dataKey="sku" width={88} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip />
                      <Bar dataKey="bottles" fill="hsl(var(--foreground) / 0.35)" radius={[0, 4, 4, 0]} name="Bottles" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="card-elevated border-border/70 shadow-none">
          <div className="border-b border-border/50 p-5 pb-3">
            <h3 className="pb-2">
              <CardTitle className="font-display text-base">Inventory by market</CardTitle>
              <p className="text-xs text-muted-foreground">Hub stock, {rangeDays}-day movement, cover days.</p>
            </CardHeader>
            <CardContent className="overflow-x-auto pt-0">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Market</th>
                    <th className="pb-2 font-medium">Stock (cases)</th>
                    <th className="pb-2 font-medium">Sold / window</th>
                    <th className="pb-2 font-medium">Days left</th>
                    <th className="pb-2 font-medium">Health</th>
                  </tr>
                </thead>
                <tbody>
                  {marketRows.map((row) => (
                    <tr key={row.id} className="border-b border-border/40 last:border-0">
                      <td className="py-2.5">
                        <span className="font-medium">{row.label}</span>
                        {row.note ? (
                          <p className="text-[11px] text-muted-foreground">{row.note}</p>
                        ) : null}
                      </td>
                      <td className="tabular-nums">{row.stockCases.toFixed(1)}</td>
                      <td className="tabular-nums">{row.sold30dCases.toFixed(1)}</td>
                      <td className="tabular-nums text-muted-foreground">
                        {row.daysCover === null ? "—" : row.daysCover}
                      </td>
                      <td className={cn("text-xs font-medium", healthStyles(row.health))}>{healthLabel(row.health)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="card-elevated border-border/70 shadow-none">
          <div className="border-b border-border/50 p-5 pb-3">
            <h3 className="pb-2">
              <CardTitle className="font-display text-base">Order trend</CardTitle>
              <p className="text-xs text-muted-foreground">Weekly order intensity (proxy from throughput).</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyOrderCounts} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      name="Orders"
                      stroke="hsl(var(--foreground) / 0.45)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right */}
        <div className="space-y-6 xl:col-span-3">
          <div className="card-elevated border-border/70 shadow-none">
          <div className="border-b border-border/50 p-5 pb-3">
            <h3 className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-display text-base">Shipment tracker</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                <Link to="/shipments">All</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 pt-0 text-xs">
              <ScrollArea className="h-[min(320px,40vh)] pr-2">
                {data.shipments.slice(0, 6).map((s) => (
                  <div
                    key={s.id}
                    className="mb-2 rounded-lg border border-border/50 p-2.5 last:mb-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-medium">{s.id}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {mapShipmentStatusLabel(s)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {s.origin} → {s.destination}
                    </p>
                    <p className="text-muted-foreground">ETA {s.eta}</p>
                    <p className="truncate text-[11px] text-muted-foreground">Linked {s.linkedOrder}</p>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="card-elevated border-border/70 shadow-none">
          <div className="border-b border-border/50 p-5 pb-3">
            <h3 className="pb-2">
              <CardTitle className="font-display text-base">Top accounts</CardTitle>
              <p className="text-xs text-muted-foreground">Strategic value, 30d revenue, reorder signal.</p>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {topAccounts.slice(0, 6).map((a) => (
                <div
                  key={a.name}
                  className="flex flex-col gap-0.5 rounded-lg border border-border/40 px-2.5 py-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium leading-tight">{a.name}</span>
                    {a.strategic ? (
                      <Badge variant="secondary" className="text-[10px]">
                        Key
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground">
                    {a.city}, {a.country} · Last {a.lastOrderDate}
                  </p>
                  <p className="tabular-nums text-muted-foreground">
                    30d ${a.monthlyValue.toLocaleString()}{" "}
                    <span className={a.trendPct >= 0 ? "text-emerald-600" : "text-destructive"}>
                      ({a.trendPct >= 0 ? "+" : ""}
                      {a.trendPct}%)
                    </span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Reorder likelihood: <span className="capitalize text-foreground">{a.reorderLikelihood}</span>
                  </p>
                </div>
              ))}
              <Button variant="link" className="h-auto px-0 text-xs" asChild>
                <Link to="/accounts">Directory</Link>
              </Button>
            </CardContent>
          </Card>

          <div className="card-elevated border-border/70 shadow-none">
          <div className="border-b border-border/50 p-5 pb-3">
            <h3 className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-display text-base">Manufacturer</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                <Link to="/manufacturer" className="gap-1">
                  Portal <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3 pt-0 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-lg border border-border/50 p-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ClipboardList className="h-4 w-4" />
                  <span className="text-[11px] font-medium uppercase tracking-wide">In production</span>
                </div>
                <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{mfgStatus.inProductionCount}</p>
                <p className="text-[11px] text-muted-foreground">
                  {mfgStatus.inProductionSkus.length ? mfgStatus.inProductionSkus.join(", ") : "—"}
                </p>
              </div>
              <div className="rounded-lg border border-border/50 p-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Factory className="h-4 w-4" />
                  <span className="text-[11px] font-medium uppercase tracking-wide">Next inbound</span>
                </div>
                <p className="mt-1 font-display text-lg font-semibold tabular-nums">{mfgStatus.nextInboundEta ?? "—"}</p>
                <p className="text-[11px] leading-snug text-muted-foreground">{mfgStatus.nextInboundLabel ?? "—"}</p>
              </div>
            </CardContent>
          </Card>
          <div className="card-elevated border-border/70 shadow-none">
          <div className="border-b border-border/50 p-5 pb-3">
            <h3 className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Partner Incentives
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                <Link to="/incentives">Manage</Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3 pt-0 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-lg border border-border/50 p-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-[11px] font-medium uppercase tracking-wide">Gross Margin</span>
                </div>
                <p className="mt-1 font-display text-2xl font-semibold tabular-nums">$216</p>
                <p className="text-[11px] text-muted-foreground">per case ($48 wholesale − $30 landed)</p>
              </div>
              <div className="rounded-lg border border-border/50 p-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-[11px] font-medium uppercase tracking-wide">SPIF Rates</span>
                </div>
                <p className="mt-1 text-sm">On-premise: $150 · Off-premise: $100</p>
                <p className="text-[11px] text-muted-foreground">Reorder: $5 · Tasting: $25</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        Active markets (90d): {countActiveMarkets(data.salesOrders, 90)} · Data matches inventory, orders, and shipments
        across roles.
      </p>
    </div>
  );
}
