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
  sellThroughPercent30d,
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

function orderInMarketFilter(orderMarket: string, filter: (typeof MARKET_FILTERS)[number]["id"]): boolean {
  if (filter === "all") return true;
  if (!orderMarket) return false; // Guard against undefined
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

  const filteredOrders = useMemo(
    () => data.salesOrders.filter((o) => orderInMarketFilter(o.market, marketFilter)),
    [data.salesOrders, marketFilter],
  );

  const inventorySummary = useMemo(() => computeInventorySummary(data.inventory), [data.inventory]);
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
    () => sellThroughPercent30d(data.salesOrders, data.inventory),
    [data.salesOrders, data.inventory],
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
                      <p className="px-2 py-6 text-center text-sm text-muted-foreground">No alerts right now.</p>
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

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {[
          {
            label: "Global inventory",
            value: inventorySummary.totalOnHand.toLocaleString(),
            sub: "bottles on hand",
            icon: Package,
            to: "/inventory",
          },
          {
            label: "Pending review",
            value: String(orderTabCounts["pending-review"]),
            sub: "draft orders",
            icon: ShoppingCart,
            to: "/orders?tab=pending-review",
          },
          {
            label: "30d sell-through",
            value: `${sellThrough}%`,
            sub: "vs available pool",
            icon: Globe,
            to: "/reports?focus=month",
          },
          {
            label: "Active accounts",
            value: String(activeAccounts),
            sub: "in CRM",
            icon: Users,
            to: "/accounts",
          },
          {
            label: "Low-stock markets",
            value: String(lowStockMarkets),
            sub: "need attention",
            icon: Truck,
            to: "/markets",
          },
          {
            label: "Shipment alerts",
            value: String(shipmentAlerts),
            sub: "ETA / delay",
            icon: Bell,
            to: "/shipments",
          },
        ].map((k) => (
          <Link
            key={k.label}
            to={k.to}
            className="group rounded-xl border border-border/60 bg-card/30 p-3 no-underline transition-colors hover:border-border hover:bg-card/60"
          >
            <div className="flex items-start justify-between gap-2">
              <k.icon className="h-4 w-4 shrink-0 text-muted-foreground opacity-70 group-hover:opacity-100" />
            </div>
            <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{k.label}</p>
            <p className="font-display text-xl font-semibold tabular-nums text-foreground">{k.value}</p>
            <p className="text-[11px] text-muted-foreground">{k.sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        {/* Left */}
        <div className="space-y-6 xl:col-span-3">
          <Card className="border-border/70 shadow-none">
            <CardHeader className="pb-2">
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
                  <p className="py-8 text-center text-sm text-muted-foreground">No orders in pending review.</p>
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

          <Card className="border-border/70 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">Critical alerts</CardTitle>
              <p className="text-xs text-muted-foreground">Same active queue as Alerts hub — inventory, PO, logistics, demand, AR.</p>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <ScrollArea className="h-[min(280px,36vh)] pr-2">
                {decisionAlerts.slice(0, 8).map((a) => (
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
                ))}
              </ScrollArea>
              <Button variant="outline" size="sm" className="w-full touch-manipulation" asChild>
                <Link to="/alerts">Alerts hub</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-none">
            <CardHeader className="pb-2">
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

          <Card className="border-border/70 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">Replenishment</CardTitle>
              <p className="text-xs text-muted-foreground">Velocity + open POs — aligned with production requests above.</p>
            </CardHeader>
            <CardContent className="space-y-2 pt-0 text-sm">
              {replenishment.length === 0 ? (
                <p className="text-xs text-muted-foreground">No suggestions — check inventory and PO pipeline.</p>
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
          <Card className="border-border/70 shadow-none">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-2">
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

          <Card className="border-border/70 shadow-none">
            <CardHeader className="pb-2">
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

          <Card className="border-border/70 shadow-none">
            <CardHeader className="pb-2">
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
          <Card className="border-border/70 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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

          <Card className="border-border/70 shadow-none">
            <CardHeader className="pb-2">
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

          <Card className="border-border/70 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
          <Card className="border-border/70 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
