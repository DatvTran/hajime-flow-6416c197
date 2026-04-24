import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useAppData, useSalesOrders, useDepletionReports } from "@/contexts/AppDataContext";
import { computeInventorySummary, deriveAlerts } from "@/lib/hajime-metrics";
import { Package, ShoppingCart, Truck, Users, AlertTriangle, Warehouse, Calendar, TrendingDown } from "lucide-react";
import { useMemo } from "react";

export default function DistributorHomePage() {
  const { data, loading } = useAppData();

  const { salesOrders } = useSalesOrders();
  const { depletionReports } = useDepletionReports();
  const inv = useMemo(() => computeInventorySummary(data.inventory, data.purchaseOrders), [data.inventory, data.purchaseOrders]);
  const alerts = useMemo(() => deriveAlerts(data).slice(0, 4), [data]);

  const awaitingFulfillment = useMemo(
    () => salesOrders.filter((o) => o.status === "confirmed" || o.status === "packed"),
    [salesOrders],
  );

  const activeShipments = useMemo(
    () => data.shipments.filter((s) => s.status !== "delivered"),
    [data.shipments],
  );

  const retailAccounts = useMemo(
    () => data.accounts.filter((a) => a.status === "active" && a.type !== "distributor"),
    [data.accounts],
  );

  const depletionFlags = useMemo(
    () => depletionReports.filter((r) => r.flaggedForReplenishment).length,
    [depletionReports],
  );

  const recentDepletions = useMemo(
    () => depletionReports.slice(0, 5),
    [depletionReports],
  );

  if (loading) {
    return <DistributorSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Distributor operations"
        description="Execution-first: pick, pack, ship, and clear backorders — same inventory and orders as HQ."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="card-interactive p-4">
          <div className="flex items-center gap-2">
            <Warehouse className="h-4 w-4 text-accent" strokeWidth={1.5} />
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Warehouse inventory</p>
          </div>
          <p className="mt-2 font-display text-2xl font-semibold tabular-nums">{inv.available.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">available bottles</p>
          <Button variant="link" className="mt-2 h-auto px-0 text-xs" asChild>
            <Link to="/distributor/inventory">Stock positions</Link>
          </Button>
        </div>
        <div className="card-interactive p-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-accent" strokeWidth={1.5} />
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Awaiting fulfillment</p>
          </div>
          <p className="mt-2 font-display text-2xl font-semibold tabular-nums">{awaitingFulfillment.length}</p>
          <p className="text-[10px] text-muted-foreground">approved / ready to pick</p>
          <Button variant="link" className="mt-2 h-auto px-0 text-xs" asChild>
            <Link to="/distributor/orders?tab=approved">Open queue</Link>
          </Button>
        </div>
        <div className="card-interactive p-4">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-accent" strokeWidth={1.5} />
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">In motion</p>
          </div>
          <p className="mt-2 font-display text-2xl font-semibold tabular-nums">{activeShipments.length}</p>
          <p className="text-[10px] text-muted-foreground">active shipments</p>
          <Button variant="link" className="mt-2 h-auto px-0 text-xs" asChild>
            <Link to="/distributor/orders?tab=distributor">Distributor processing</Link>
          </Button>
        </div>
        <div className="card-interactive p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" strokeWidth={1.5} />
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Retail accounts</p>
          </div>
          <p className="mt-2 font-display text-2xl font-semibold tabular-nums">{retailAccounts.length}</p>
          <p className="text-[10px] text-muted-foreground">active (non-distributor)</p>
          <Button variant="link" className="mt-2 h-auto px-0 text-xs" asChild>
            <Link to="/distributor/accounts">Directory</Link>
          </Button>
        </div>
        <div className="card-interactive p-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-accent" strokeWidth={1.5} />
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Depletion reports</p>
          </div>
          <p className="mt-2 font-display text-2xl font-semibold tabular-nums">{depletionFlags}</p>
          <p className="text-[10px] text-muted-foreground">flagged for replenishment</p>
          <Button variant="link" className="mt-2 h-auto px-0 text-xs" asChild>
            <Link to="/distributor/depletions">Report sell-through</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card-elevated">
          <div className="flex items-center gap-2 border-b border-border/50 p-5 pb-3">
            <Package className="h-5 w-5 text-accent" strokeWidth={1.5} />
            <h3 className="font-display text-lg font-semibold">Orders awaiting fulfillment</h3>
          </div>
          <div className="space-y-2 p-5 pt-3 text-sm">
            {awaitingFulfillment.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Package className="h-7 w-7 text-muted-foreground/20" strokeWidth={1} />
                <p className="text-sm text-muted-foreground">No orders in pick/pack stage</p>
              </div>
            ) : (
              awaitingFulfillment.map((o) => (
                <div
                  key={o.id}
                  className="flex flex-col gap-1 rounded-lg border border-border/50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span className="font-mono text-xs">{o.id}</span>
                    <p className="font-medium">{o.account}</p>
                    <p className="text-xs text-muted-foreground">{o.market}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card-elevated">
          <div className="flex items-center gap-2 border-b border-border/50 p-5 pb-3">
            <Calendar className="h-5 w-5 text-accent" strokeWidth={1.5} />
            <h3 className="font-display text-lg font-semibold">Delivery schedule</h3>
          </div>
          <div className="space-y-2 p-5 pt-3 text-sm">
            {activeShipments.slice(0, 6).map((s) => (
              <div key={s.id} className="rounded-lg border border-border/50 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs">{s.id}</span>
                  <span className="text-xs text-muted-foreground">ETA {s.eta}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {s.origin} → {s.destination}
                </p>
              </div>
            ))}
            <Button variant="link" className="h-auto px-0 text-xs" asChild>
              <Link to="/distributor/shipments">Full tracker</Link>
            </Button>
          </div>
        </div>

        <div className="card-elevated lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-border/50 p-5 pb-3">
            <AlertTriangle className="h-5 w-5 text-destructive" strokeWidth={1.5} />
            <h3 className="font-display text-lg font-semibold">Backorder & risk alerts</h3>
          </div>
          <div className="flex flex-col gap-3 p-5 pt-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2 text-sm">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <AlertTriangle className="h-7 w-7 text-muted-foreground/20" strokeWidth={1} />
                  <p className="text-sm text-muted-foreground">No alerts</p>
                </div>
              ) : (
                alerts.map((a) => (
                  <div key={a.id} className="rounded-lg border border-border/50 px-3 py-2">
                    {a.message}
                  </div>
                ))
              )}
            </div>
            <Button variant="secondary" size="sm" className="shrink-0 touch-manipulation" asChild>
              <Link to="/distributor/backorders">Backorder desk</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
