import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useShipments } from "@/contexts/AppDataContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, Package, Search, Truck } from "lucide-react";

export default function Shipments() {
  const { shipments } = useShipments();
  const [q, setQ] = useState("");

  const stats = useMemo(() => {
    const active = shipments.filter((s) => s.status !== "delivered");
    const delayed = shipments.filter((s) => s.status === "delayed");
    const inTransit = shipments.filter((s) => s.status === "in-transit");
    return { active: active.length, delayed: delayed.length, inTransit: inTransit.length, total: shipments.length };
  }, [shipments]);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return shipments;
    return shipments.filter(
      (s) =>
        s.id.toLowerCase().includes(n) ||
        s.origin.toLowerCase().includes(n) ||
        s.destination.toLowerCase().includes(n) ||
        s.carrier.toLowerCase().includes(n) ||
        s.linkedOrder.toLowerCase().includes(n),
    );
  }, [shipments, q]);

  const { activeShipments, completedShipments } = useMemo(() => {
    const active = filtered.filter((s) => s.status !== "delivered");
    const done = filtered.filter((s) => s.status === "delivered");
    return { activeShipments: active, completedShipments: done };
  }, [filtered]);

  return (
    <div>
      <PageHeader
        title="Shipments"
        description="Shipment tracking — inbound from manufacturer and outbound to accounts; ETA, carrier, and delivery status in one place."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <Truck className="h-5 w-5 text-muted-foreground" aria-hidden />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active shipments</p>
              <p className="font-display text-xl font-semibold tabular-nums">{stats.active}</p>
              <p className="text-[10px] text-muted-foreground">{stats.inTransit} in transit</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
              <Package className="h-5 w-5 text-destructive" aria-hidden />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Delayed / at risk</p>
              <p className="font-display text-xl font-semibold tabular-nums">{stats.delayed}</p>
              <p className="text-[10px] text-muted-foreground">needs follow-up</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <Package className="h-5 w-5 text-muted-foreground" aria-hidden />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total records</p>
              <p className="font-display text-xl font-semibold tabular-nums">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground">inbound + outbound</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search ID, route, carrier, linked order…"
          className="pl-9"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Filter shipments"
        />
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">In progress</h2>
          <div className="space-y-4">
            {activeShipments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active shipments match this filter.</p>
            ) : (
              activeShipments.map((s) => (
                <Card key={s.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-5">
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-medium">{s.id}</span>
                        <StatusBadge status={s.type} />
                        <StatusBadge status={s.status} />
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">Linked: {s.linkedOrder}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <span className="min-w-0 max-w-full font-medium break-words">{s.origin}</span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="min-w-0 max-w-full font-medium break-words">{s.destination}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                      <div>
                        <span className="text-muted-foreground">Carrier:</span> <span className="font-medium">{s.carrier}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ship date:</span> <span className="font-medium">{s.shipDate}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">ETA:</span> <span className="font-medium">{s.eta}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Delivered:</span> <span className="font-medium">{s.actualDelivery || "—"}</span>
                      </div>
                    </div>
                    {s.notes ? <p className="mt-2 text-xs text-muted-foreground">{s.notes}</p> : null}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Delivered</h2>
          <div className="space-y-4">
            {completedShipments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No completed shipments match this filter.</p>
            ) : (
              completedShipments.map((s) => (
                <Card key={s.id} className="border-muted/80 opacity-90">
                  <CardContent className="pt-5">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-medium">{s.id}</span>
                      <StatusBadge status={s.type} />
                      <StatusBadge status={s.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <span className="break-words">{s.origin}</span>
                      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="break-words">{s.destination}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Delivered {s.actualDelivery || s.eta} · {s.carrier}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
