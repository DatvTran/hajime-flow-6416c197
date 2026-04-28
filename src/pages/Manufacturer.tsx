import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useProductionStatuses, usePurchaseOrders } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Factory, CheckCircle, Clock, AlertTriangle, Truck, Globe } from "lucide-react";
import { MANUFACTURER_STAGE_PIPELINE, manufacturerStageIndex } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { computeInventorySummary, computeReorderRecommendations, deriveAlerts } from "@/lib/hajime-metrics";
import { useAppData } from "@/contexts/AppDataContext";

export default function Manufacturer() {
  const { purchaseOrders } = usePurchaseOrders();
  const { productionStatuses, addProductionStatus } = useProductionStatuses();
  const { data, loading } = useAppData();

  const { user } = useAuth();
  const logAudit = useAuditLog();

  const invSummary = useMemo(() => computeInventorySummary(data.inventory, data.purchaseOrders), [data.inventory, data.purchaseOrders]);

  const activePOs = useMemo(() => purchaseOrders.filter((po) => po.status !== "draft"), [purchaseOrders]);

  const inboundQueue = useMemo(
    () => data.shipments.filter((s) => s.type === "inbound" && s.status !== "delivered"),
    [data.shipments],
  );

  const requestedByMarket = useMemo(() => {
    const m: Record<string, number> = {};
    for (const po of purchaseOrders) {
      const k = po.marketDestination || "—";
      m[k] = (m[k] ?? 0) + po.quantity;
    }
    return Object.entries(m)
      .map(([market, bottles]) => ({ market, bottles }))
      .sort((a, b) => b.bottles - a.bottles);
  }, [purchaseOrders]);

  const mfgAlerts = useMemo(() => deriveAlerts(data).slice(0, 5), [data]);

  const replenishmentSuggestions = useMemo(
    () => computeReorderRecommendations(data).filter((r) => r.suggestedBottles > 0).slice(0, 6),
    [data],
  );

  const leadDays = data.operationalSettings?.manufacturerLeadTimeDays ?? 45;

  const kpi = useMemo(() => {
    const delayed = activePOs.filter((p) => p.status === "delayed").length;
    const pendingApproval = purchaseOrders.filter((p) => p.status === "draft").length;
    const onTrack = activePOs.filter((p) => p.status !== "delayed").length;
    return { delayed, pendingApproval, onTrack };
  }, [activePOs, purchaseOrders]);

  const [selectedPoId, setSelectedPoId] = useState<string>(() => activePOs[0]?.id ?? "");
  const [stage, setStage] = useState<string>(MANUFACTURER_STAGE_PIPELINE[0]);
  const [notes, setNotes] = useState("");

  const selectedPo = activePOs.find((p) => p.id === selectedPoId) ?? activePOs[0];

  const submitUpdate = () => {
    if (!selectedPo) {
      toast.error("No purchase order selected");
      return;
    }
    const row = {
      poId: selectedPo.id,
      stage,
      updatedAt: new Date().toISOString().slice(0, 10),
      notes: notes.trim() || "Status update",
    };
    addProductionStatus(row);
    logAudit("production_status_update", `${stage}: ${row.notes}`, { type: "purchase_order", id: selectedPo.id });
    setNotes("");
    toast.success("Production status recorded");
  };

  if (loading) {
    return <ManufacturerSkeleton />;
  }

  return (
    <div>
      <PageHeader
        title="Manufacturer"
        description="Fulfillment view for open production requests raised by Hajime HQ — batch schedule, inbound shipment queue, demand by market, and alerts. Logistics can record carrier and ETA on Shipments."
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-5">
        {/* Active POs — featured, spans 2 */}
        <div className="card-elevated lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-border/50 p-4 pb-2">
            <Factory className="h-4 w-4 text-accent" strokeWidth={1.5} />
            <h3 className="font-display text-sm font-semibold">Active production requests</h3>
          </div>
          <div className="space-y-2 p-4 pt-2 text-xs">
            {activePOs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CheckCircle className="h-7 w-7 text-muted-foreground/20" strokeWidth={1} />
                <p className="text-sm text-muted-foreground">No active POs</p>
              </div>
            ) : (
              activePOs.slice(0, 5).map((po) => (
                <div key={po.id} className="flex justify-between gap-2 border-b border-border/40 py-1.5 last:border-0">
                  <span className="font-mono">{po.id}</span>
                  <span className="text-muted-foreground">
                    {po.sku} · {po.quantity.toLocaleString()} bt
                  </span>
                </div>
              ))
            )}
            <Button variant="link" className="h-auto px-0 text-xs" asChild>
              <Link to="/manufacturer/purchase-orders">All requests</Link>
            </Button>
          </div>
        </div>

        {/* Scheduled batches */}
        <div className="card-elevated lg:col-span-1">
          <div className="flex items-center gap-2 border-b border-border/50 p-4 pb-2">
            <Clock className="h-4 w-4 text-accent" strokeWidth={1.5} />
            <h3 className="font-display text-sm font-semibold">Scheduled batches</h3>
          </div>
          <div className="space-y-2 p-4 pt-2 text-xs">
            {activePOs.slice(0, 6).map((po) => (
              <div key={po.id} className="flex justify-between gap-2 border-b border-border/40 py-1.5 last:border-0">
                <span className="min-w-0 truncate font-mono">{po.id}</span>
                <span className="shrink-0 text-muted-foreground">Req {po.requiredDate}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Shipment queue — spans 2 */}
        <div className="card-elevated lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-border/50 p-4 pb-2">
            <Truck className="h-4 w-4 text-accent" strokeWidth={1.5} />
            <h3 className="font-display text-sm font-semibold">Shipment queue (inbound)</h3>
          </div>
          <div className="space-y-2 p-4 pt-2 text-xs">
            {inboundQueue.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Truck className="h-7 w-7 text-muted-foreground/20" strokeWidth={1} />
                <p className="text-sm text-muted-foreground">No open inbound shipments</p>
              </div>
            ) : (
              inboundQueue.map((s) => (
                <div key={s.id} className="border-b border-border/40 py-1.5 last:border-0">
                  <p className="font-mono">{s.id}</p>
                  <p className="text-muted-foreground">
                    {s.origin} → {s.destination} · ETA {s.eta}
                  </p>
                </div>
              ))
            )}
            <Button variant="link" className="h-auto px-0 text-xs" asChild>
              <Link to="/manufacturer/shipments">Shipments</Link>
            </Button>
          </div>
        </div>

        {/* Requested by market */}
        <div className="card-elevated lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-border/50 p-4 pb-2">
            <Globe className="h-4 w-4 text-accent" strokeWidth={1.5} />
            <h3 className="font-display text-sm font-semibold">Requested by market</h3>
          </div>
          <div className="space-y-2 p-4 pt-2 text-xs">
            {requestedByMarket.map((r) => (
              <div key={r.market} className="flex justify-between gap-2 border-b border-border/40 py-1.5 last:border-0">
                <span>{r.market}</span>
                <span className="tabular-nums text-muted-foreground">{r.bottles.toLocaleString()} btl</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lead times */}
        <div className="card-elevated lg:col-span-1">
          <div className="flex items-center gap-2 border-b border-border/50 p-4 pb-2">
            <Clock className="h-4 w-4 text-accent" strokeWidth={1.5} />
            <h3 className="font-display text-sm font-semibold">Lead times</h3>
          </div>
          <div className="p-4 pt-2 text-sm text-muted-foreground">
            <p>
              Planning lead time: <span className="font-semibold text-foreground">{leadDays} days</span> (HQ settings).
            </p>
            <p className="mt-2 text-xs">Use with open PO required dates to prioritize batches and materials.</p>
          </div>
        </div>

        {/* Alerts */}
        <div className="card-elevated lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-border/50 p-4 pb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" strokeWidth={1.5} />
            <h3 className="font-display text-sm font-semibold">Alerts</h3>
          </div>
          <div className="space-y-2 p-4 pt-2 text-xs">
            {mfgAlerts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CheckCircle className="h-7 w-7 text-muted-foreground/20" strokeWidth={1} />
                <p className="text-sm text-muted-foreground">No operational alerts</p>
              </div>
            ) : (
              mfgAlerts.map((a) => (
                <div key={a.id} className="rounded-md border border-border/50 px-2 py-1.5">
                  {a.message}
                </div>
              ))
            )}
            <Button variant="link" className="h-auto px-0 text-xs" asChild>
              <Link to="/manufacturer/alerts">Alerts hub</Link>
            </Button>
          </div>
        </div>
      </div>

      {replenishmentSuggestions.length > 0 ? (
        <Card className="card-elevated mb-6">
          <CardHeader className="border-b border-border/50 p-5 pb-3">
            <CardTitle className="font-display text-sm font-medium">When wholesaler / DC stock is low</CardTitle>
            <p className="text-xs text-muted-foreground">
              HQ opens a production request — links pre-fill SKU and suggested bottle quantity from the same reorder model as the command center.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {replenishmentSuggestions.map((r) => (
              <div key={r.sku} className="flex flex-col gap-2 rounded-md border border-border/60 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-foreground">{r.summary}</p>
                <Button size="sm" variant="outline" className="shrink-0 touch-manipulation" asChild>
                  <Link to={`/manufacturer/purchase-orders?sku=${encodeURIComponent(r.sku)}&qty=${encodeURIComponent(String(r.suggestedBottles))}`}>
                    Draft production request
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
            <Factory className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total available (Hajime)</p>
            <p className="text-xl font-display font-semibold">{invSummary.available.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">bottles — context only</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
            <CheckCircle className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active POs on track</p>
            <p className="text-xl font-display font-semibold">{kpi.onTrack}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <Clock className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pending approval (draft)</p>
            <p className="text-xl font-display font-semibold">{kpi.pendingApproval}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Delayed POs</p>
            <p className="text-xl font-display font-semibold">{kpi.delayed}</p>
          </div>
        </Card>
      </div>

      {user.role === "manufacturer" || user.role === "brand_operator" ? (
        <Card className="card-elevated mb-6">
          <CardHeader className="border-b border-border/50 p-5 pb-3">
            <CardTitle className="font-display text-base">Post production update</CardTitle>
            <p className="text-sm text-muted-foreground">Log stage changes for audit trail (brief §6, §8).</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-[200px] flex-1 space-y-2">
              <Label>Purchase order</Label>
              <Select value={selectedPo?.id ?? ""} onValueChange={setSelectedPoId}>
                <SelectTrigger className="touch-manipulation">
                  <SelectValue placeholder="Select PO" />
                </SelectTrigger>
                <SelectContent>
                  {activePOs.map((po) => (
                    <SelectItem key={po.id} value={po.id}>
                      {po.id} — {po.sku}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[200px] flex-1 space-y-2">
              <Label>Stage</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger className="touch-manipulation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MANUFACTURER_STAGE_PIPELINE.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[220px] flex-[2] space-y-2">
              <Label htmlFor="mfg-notes">Notes</Label>
              <Textarea id="mfg-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Materials, packaging, ETA…" />
            </div>
            <Button type="button" className="touch-manipulation" onClick={submitUpdate}>
              Save update
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {activePOs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No approved or in-flight purchase orders yet.</p>
      ) : null}

      <div className="space-y-4">
        {activePOs.map((po) => {
          const updates = productionStatuses
            .filter((s) => s.poId === po.id)
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
          const latestStage = updates[0]?.stage ?? "PO Received";
          const currentIdx = manufacturerStageIndex(latestStage);
          const isDelayedFlag = (latestStage?.toLowerCase() || "").includes("delay") || po.status === "delayed";

          return (
            <Card key={po.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="font-display text-base">{po.id}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {po.sku} — {po.quantity.toLocaleString()} bottles · {po.marketDestination} · Label {po.labelVersion}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{po.packagingInstructions}</p>
                  </div>
                  <StatusBadge status={po.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-wrap items-center gap-y-2 overflow-x-auto pb-2">
                  {MANUFACTURER_STAGE_PIPELINE.filter((s) => s !== "Delayed / Issue").map((st, idx, arr) => {
                    const pipeIdx = idx;
                    const done = !isDelayedFlag && currentIdx >= pipeIdx;
                    const current = currentIdx === pipeIdx;
                    return (
                      <div key={st} className="flex items-center">
                        <div
                          className={`flex h-6 items-center rounded-full px-2.5 text-[10px] font-medium whitespace-nowrap ${
                            done ? "bg-success/10 text-success" : current ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {st}
                        </div>
                        {idx < arr.length - 1 && (
                          <div className={`mx-1 h-px w-3 shrink-0 ${pipeIdx < currentIdx && !isDelayedFlag ? "bg-success" : "bg-border"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
                {isDelayedFlag && (
                  <p className="mb-3 text-sm font-medium text-destructive">Delayed / issue flagged — see notes below.</p>
                )}

                {updates.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Recent updates</p>
                    <div className="space-y-2">
                      {updates.map((u, i) => (
                        <div key={`${u.updatedAt}-${i}`} className="flex flex-col gap-0.5 text-sm sm:flex-row sm:items-start sm:gap-3">
                          <span className="shrink-0 text-xs text-muted-foreground">{u.updatedAt}</span>
                          <span className="font-medium">{u.stage}</span>
                          <span className="text-muted-foreground">— {u.notes}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
