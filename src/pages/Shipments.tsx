import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useShipments, useAppData } from "@/contexts/AppDataContext";
import { useShipmentsAutoRefresh } from "@/hooks/useShipmentsAutoRefresh";
import { useAuth } from "@/contexts/AuthContext";
import { ShipmentsSkeleton } from "@/components/skeletons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RecordInboundShipmentDialog } from "@/components/RecordInboundShipmentDialog";
import { RecordDistributorOutboundShipmentDialog } from "@/components/RecordDistributorOutboundShipmentDialog";
import { Truck, Package, Search, ArrowRight, Clock, CheckCircle2, AlertTriangle, Navigation } from "lucide-react";
import type { Shipment } from "@/data/mockData";
import { shipmentLineContentsLabel } from "@/lib/order-lines";

function formatDepartureTimestamp(s: Shipment): string {
  if (s.shippedAt) {
    try {
      return new Date(s.shippedAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return s.shippedAt;
    }
  }
  return s.shipDate ? s.shipDate : "—";
}

export default function Shipments() {
  const { user } = useAuth();
  const { shipments } = useShipments();
  const { loading, refreshShipments } = useAppData();
  const [inboundOpen, setInboundOpen] = useState(false);
  const [outboundDistOpen, setOutboundDistOpen] = useState(false);

  const stableRefreshShipments = useCallback(() => refreshShipments(), [refreshShipments]);
  useShipmentsAutoRefresh(stableRefreshShipments, !loading);

  const canRecordInbound =
    user?.role === "brand_operator" ||
    user?.role === "manufacturer" ||
    user?.role === "founder_admin";

  const canRecordOutboundToDistributor = user?.role === "brand_operator" || user?.role === "founder_admin";

  const [searchParams] = useSearchParams();
  const [q, setQ] = useState(() => searchParams.get("q") ?? "");
  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);

  const stats = useMemo(() => {
    const active = shipments.filter((s) => s.status !== "delivered");
    const delayed = shipments.filter((s) => s.status === "delayed");
    const inTransit = shipments.filter((s) => s.status === "in-transit");
    return { active: active.length, delayed: delayed.length, inTransit: inTransit.length, total: shipments.length };
  }, [shipments]);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return shipments;
    return shipments.filter((s) => {
      const lineHay = shipmentLineContentsLabel(s).toLowerCase();
      return (
        (s.id?.toLowerCase() || "").includes(n) ||
        (s.origin?.toLowerCase() || "").includes(n) ||
        (s.destination?.toLowerCase() || "").includes(n) ||
        (s.carrier?.toLowerCase() || "").includes(n) ||
        (s.linkedOrder?.toLowerCase() || "").includes(n) ||
        (s.waybillNumber?.toLowerCase() || "").includes(n) ||
        (s.originPort?.toLowerCase() || "").includes(n) ||
        lineHay.includes(n)
      );
    });
  }, [shipments, q]);

  const { activeShipments, completedShipments } = useMemo(() => {
    const active = filtered.filter((s) => s.status !== "delivered");
    const done = filtered.filter((s) => s.status === "delivered");
    return { activeShipments: active, completedShipments: done };
  }, [filtered]);

  if (loading) {
    return <ShipmentsSkeleton />;
  }

  const shipmentKindLabel = (s: Shipment) => {
    if (s.type === "inbound") return "Inbound (production / PO)";
    if (s.orderType === "sales_order") return "Outbound (to distributor)";
    return "Outbound (sales / transfers)";
  };

  return (
    <div>
      <PageHeader
        title="Shipments"
        description="Inbound production freight and outbound deliveries in one view. HQ can ship from a Hajime depot to a distributor DC (sales-order linked); inbound PO legs can be filed by HQ or manufacturers. Lists refresh periodically while this page is visible."
        actions={
          canRecordInbound || canRecordOutboundToDistributor ? (
            <div className="flex flex-wrap gap-2">
              {canRecordInbound ? (
                <Button type="button" className="touch-manipulation" onClick={() => setInboundOpen(true)}>
                  Record inbound (PO → warehouse)
                </Button>
              ) : null}
              {canRecordOutboundToDistributor ? (
                <Button type="button" variant="secondary" className="touch-manipulation" onClick={() => setOutboundDistOpen(true)}>
                  Ship to distributor (warehouse → DC)
                </Button>
              ) : null}
            </div>
          ) : undefined
        }
      />

      <RecordInboundShipmentDialog open={inboundOpen} onOpenChange={setInboundOpen} />
      <RecordDistributorOutboundShipmentDialog open={outboundDistOpen} onOpenChange={setOutboundDistOpen} />

      {/* Asymmetric KPI strip */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {/* Active — featured */}
        <div className="card-interactive flex items-center gap-4 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Truck className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Active shipments</p>
            <p className="font-display text-2xl font-semibold tabular-nums text-foreground">{stats.active}</p>
            <p className="text-[11px] text-muted-foreground">{stats.inTransit} in transit</p>
          </div>
        </div>
        {/* Delayed */}
        <div className="card-interactive flex items-center gap-4 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Delayed / at risk</p>
            <p className="font-display text-2xl font-semibold tabular-nums text-foreground">{stats.delayed}</p>
            <p className="text-[11px] text-muted-foreground">needs follow-up</p>
          </div>
        </div>
        {/* Completed */}
        <div className="card-interactive flex items-center gap-4 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
            <CheckCircle2 className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Completed</p>
            <p className="font-display text-2xl font-semibold tabular-nums text-foreground">{completedShipments.length}</p>
            <p className="text-[11px] text-muted-foreground">total {stats.total} shipments</p>
          </div>
        </div>
      </div>

      <div className="relative mb-4 w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
        <Input
          placeholder="Filter shipments by ID, origin, destination, carrier…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Active shipments */}
      <div className="mb-8">
        <h2 className="mb-3 font-display text-lg font-semibold tracking-tight">In transit &amp; pending</h2>
        {activeShipments.length === 0 ? (
          <div className="card-elevated flex flex-col items-center gap-2 py-12 text-center">
            <Navigation className="h-8 w-8 text-muted-foreground/20" strokeWidth={1} />
            <p className="text-sm text-muted-foreground">No active shipments</p>
            <p className="text-[11px] text-muted-foreground/60">All deliveries completed or nothing assigned yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeShipments.map((s) => (
              <div key={s.id} className="card-interactive flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Package className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-medium">{s.id}</span>
                      <StatusBadge status={s.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {s.origin} <ArrowRight className="mx-1 inline h-3 w-3" strokeWidth={1.5} /> {s.destination}
                    </p>
                    {(s.destinationWarehouseId || s.destinationWarehouseName) && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Receiving warehouse{" "}
                        <span className="font-medium text-foreground">
                          {s.destinationWarehouseName ?? s.destinationWarehouseId}
                        </span>
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Carrier: <span className="font-medium text-foreground">{s.carrier}</span> · Type:{" "}
                      <span className="font-medium text-foreground">{shipmentKindLabel(s)}</span>
                    </p>
                    {shipmentLineContentsLabel(s) ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Contents:{" "}
                        <span className="font-medium text-foreground">{shipmentLineContentsLabel(s)}</span>
                      </p>
                    ) : null}
                    {s.type === "inbound" && (s.shippedAt || s.shipDate || s.originPort || s.waybillNumber) ? (
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Departed{" "}
                        <span className="font-medium text-foreground">{formatDepartureTimestamp(s)}</span>
                        {s.originPort ? (
                          <>
                            {" "}
                            · Port{" "}
                            <span className="font-medium text-foreground">{s.originPort}</span>
                          </>
                        ) : null}
                        {s.waybillNumber ? (
                          <>
                            {" "}
                            · Waybill{" "}
                            <span className="font-mono font-medium text-foreground">{s.waybillNumber}</span>
                          </>
                        ) : null}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                    <span className="font-medium">ETA {s.eta}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Order {s.linkedOrder}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed */}
      {completedShipments.length > 0 && (
        <div>
          <h2 className="mb-3 font-display text-lg font-semibold tracking-tight">Delivered</h2>
          <div className="space-y-3">
            {completedShipments.map((s) => (
              <div key={s.id} className="card-interactive flex flex-col gap-3 p-4 opacity-70 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-medium">{s.id}</span>
                      <StatusBadge status={s.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {s.origin} <ArrowRight className="mx-1 inline h-3 w-3" strokeWidth={1.5} /> {s.destination}
                    </p>
                    {(s.destinationWarehouseId || s.destinationWarehouseName) && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Receiving warehouse{" "}
                        <span className="font-medium text-foreground">
                          {s.destinationWarehouseName ?? s.destinationWarehouseId}
                        </span>
                      </p>
                    )}
                    {s.type === "inbound" && (s.shippedAt || s.shipDate || s.originPort || s.waybillNumber) ? (
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Departed{" "}
                        <span className="font-medium text-foreground">{formatDepartureTimestamp(s)}</span>
                        {s.originPort ? (
                          <>
                            {" "}
                            · Port <span className="font-medium text-foreground">{s.originPort}</span>
                          </>
                        ) : null}
                        {s.waybillNumber ? (
                          <>
                            {" "}
                            · Waybill{" "}
                            <span className="font-mono font-medium text-foreground">{s.waybillNumber}</span>
                          </>
                        ) : null}
                      </p>
                    ) : null}
                    {shipmentLineContentsLabel(s) ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Contents:{" "}
                        <span className="font-medium text-foreground">{shipmentLineContentsLabel(s)}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
                  <div className="flex items-center gap-1.5 text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                    <span className="font-medium">Delivered</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Order {s.linkedOrder}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
