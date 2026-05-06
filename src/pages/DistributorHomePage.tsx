import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData, useSalesOrders, useDepletionReports } from "@/contexts/AppDataContext";
import { useShipmentsAutoRefresh } from "@/hooks/useShipmentsAutoRefresh";
import { useAuth } from "@/contexts/AuthContext";
import { computeInventorySummary, deriveAlerts } from "@/lib/hajime-metrics";
import { shipmentLineContentsLabel } from "@/lib/order-lines";
import { getMyWarehouseOptions, updateMyPrimaryWarehouse } from "@/lib/api-v1-mutations";
import type { Warehouse } from "@/types/app-data";
import { toast } from "@/components/ui/sonner";
import { DistributorSkeleton } from "@/components/skeletons";
import { Package, ShoppingCart, Truck, Users, AlertTriangle, Warehouse, Calendar, TrendingDown } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

function warehousesFromApiRows(rows: Record<string, unknown>[]): Warehouse[] {
  return rows.map((row) => {
    const lt = row.linked_team_member_id;
    const la = row.linked_account_id;
    return {
      id: String(row.id ?? ""),
      name: String(row.name ?? "").trim(),
      isActive: row.is_active !== false,
      sortOrder: Number(row.sort_order ?? 0),
      ...(lt ? { linkedTeamMemberId: String(lt) } : {}),
      ...(la ? { linkedAccountId: String(la) } : {}),
    };
  });
}

export default function DistributorHomePage() {
  const { user } = useAuth();
  const { data, loading, updateData, refreshTeamMembers, refreshShipments } = useAppData();
  const [warehouseOptions, setWarehouseOptions] = useState<{ id: string; name: string }[]>([]);
  const [primarySaving, setPrimarySaving] = useState(false);

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

  const myCrmRow = useMemo(() => {
    const em = user?.email?.trim().toLowerCase();
    if (!em) return undefined;
    return (data.teamMembers ?? []).find((m) => m.email?.toLowerCase() === em);
  }, [data.teamMembers, user?.email]);

  const selectedPrimaryWarehouseId = myCrmRow?.primaryWarehouseId ?? "";

  const stableRefreshShipments = useCallback(() => refreshShipments(), [refreshShipments]);
  useShipmentsAutoRefresh(stableRefreshShipments, !loading);

  useEffect(() => {
    if (user?.role !== "distributor") return;
    let cancelled = false;
    (async () => {
      try {
        const res = (await getMyWarehouseOptions()) as { data?: { id: string; name: string }[] };
        const rows = Array.isArray(res.data) ? res.data : [];
        if (!cancelled) setWarehouseOptions(rows);
      } catch {
        if (!cancelled) setWarehouseOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  const onPrimaryWarehouseChange = async (warehouseId: string) => {
    if (user?.role !== "distributor") return;
    const next = warehouseId === "__none__" ? null : warehouseId;
    setPrimarySaving(true);
    try {
      const res = (await updateMyPrimaryWarehouse(next)) as {
        data?: { team_member?: Record<string, unknown>; warehouses?: Record<string, unknown>[] };
      };
      const payload = res.data;
      if (payload?.warehouses?.length) {
        updateData((d) => ({
          ...d,
          warehouses: warehousesFromApiRows(payload.warehouses ?? []),
        }));
      }
      await refreshTeamMembers();
      await refreshShipments();
      toast.success(next ? "Receiving warehouse updated" : "Receiving warehouse cleared", {
        description: next
          ? "Your depot selection is saved and visible to Hajime HQ."
          : "You can pick a depot again anytime.",
      });
    } catch (e) {
      toast.error("Could not save warehouse", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setPrimarySaving(false);
    }
  };

  if (loading) {
    return <DistributorSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Distributor · floor & depletion"
        description="Floor-first view: what needs picking today, what’s in motion, and where retail depletion flags replenishment — every side-effect is inventory truth, not a separate spreadsheet."
      />

      {user?.role === "distributor" ? (
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <Warehouse className="h-5 w-5" />
              Your receiving warehouse
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Choose which Hajime depot you operate from — same locations Brand Operator configured under Settings →
              Warehouses. This updates your CRM profile and lets HQ route stock and shipments to the right DC.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 max-w-md">
              <Label htmlFor="dist-primary-wh">Primary depot</Label>
              <Select
                value={selectedPrimaryWarehouseId || "__none__"}
                onValueChange={(v) => void onPrimaryWarehouseChange(v)}
                disabled={primarySaving || warehouseOptions.length === 0}
              >
                <SelectTrigger id="dist-primary-wh" className="touch-manipulation">
                  <SelectValue placeholder={warehouseOptions.length === 0 ? "Loading depots…" : "Select depot"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None selected</SelectItem>
                  {warehouseOptions.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {warehouseOptions.length === 0 ? (
                <p className="text-xs text-amber-700 dark:text-amber-500">
                  No active warehouses returned — confirm Brand Operator added depots and your CRM email matches your login.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Signed in as <span className="font-medium text-foreground">{user.email}</span>. Must match your CRM
                  distributor contact email.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

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
            <Link to="/distributor/shipments">Shipment tracker</Link>
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
                {shipmentLineContentsLabel(s) ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Receiving:</span> {shipmentLineContentsLabel(s)}
                  </p>
                ) : null}
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
