import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useAppData, useSalesOrders } from "@/contexts/AppDataContext";
import { computeInventorySummary, deriveAlerts } from "@/lib/hajime-metrics";
import { Package, ShoppingCart, Truck, Users, AlertTriangle, Warehouse, Calendar } from "lucide-react";
import { useMemo } from "react";

export default function DistributorHomePage() {
  const { data } = useAppData();
  const { salesOrders } = useSalesOrders();
  const inv = useMemo(() => computeInventorySummary(data.inventory), [data.inventory]);
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Distributor operations"
        description="Execution-first: pick, pack, ship, and clear backorders — same inventory and orders as HQ."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <Warehouse className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="font-display text-sm font-medium">Warehouse inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold tabular-nums">{inv.available.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">available bottles</p>
            <Button variant="link" className="mt-2 h-auto px-0 text-xs" asChild>
              <Link to="/distributor/inventory">Stock positions</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="font-display text-sm font-medium">Awaiting fulfillment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold tabular-nums">{awaitingFulfillment.length}</p>
            <p className="text-xs text-muted-foreground">approved / ready to pick</p>
            <Button variant="link" className="mt-2 h-auto px-0 text-xs" asChild>
              <Link to="/distributor/orders?tab=approved">Open queue</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="font-display text-sm font-medium">In motion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold tabular-nums">{activeShipments.length}</p>
            <p className="text-xs text-muted-foreground">active shipments</p>
            <Button variant="link" className="mt-2 h-auto px-0 text-xs" asChild>
              <Link to="/distributor/orders?tab=distributor">Distributor processing</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="font-display text-sm font-medium">Retail accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold tabular-nums">{retailAccounts.length}</p>
            <p className="text-xs text-muted-foreground">active (non-distributor)</p>
            <Button variant="link" className="mt-2 h-auto px-0 text-xs" asChild>
              <Link to="/distributor/accounts">Directory</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              Orders awaiting fulfillment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {awaitingFulfillment.length === 0 ? (
              <p className="text-muted-foreground">No orders in pick/pack stage.</p>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Delivery schedule
            </CardTitle>
            <p className="text-sm text-muted-foreground">Outbound and inbound ETAs from shared shipment records.</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
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
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5" />
              Backorder & risk alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2 text-sm">
              {alerts.length === 0 ? (
                <p className="text-muted-foreground">No alerts.</p>
              ) : (
                alerts.map((a) => (
                  <div key={a.id} className="rounded-lg border px-3 py-2">
                    {a.message}
                  </div>
                ))
              )}
            </div>
            <Button variant="secondary" size="sm" className="shrink-0 touch-manipulation" asChild>
              <Link to="/distributor/backorders">Backorder desk</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
