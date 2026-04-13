import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { PurchaseOrderDetailDialog } from "@/components/PurchaseOrderDetailDialog";
import { NewPurchaseOrderDialog } from "@/components/NewPurchaseOrderDialog";
import { TransferOrderDetailDialog } from "@/components/TransferOrderDetailDialog";
import { NewTransferOrderDialog } from "@/components/NewTransferOrderDialog";
import type { PurchaseOrder, TransferOrder } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download, Factory, Truck } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useInventory, usePurchaseOrders, useTransferOrders } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";

function shouldAddInventoryForTransition(p: PurchaseOrder, nextStatus: PurchaseOrder["status"]): boolean {
  // Production POs ADD inventory when delivered (manufacturer shipment arrives)
  if (nextStatus !== "delivered") return false;
  if (p.status === "delivered") return false; // Already counted
  return true;
}

export default function PurchaseOrders() {
  const { user } = useAuth();
  const canCreateProductionRequest = user.role === "brand_operator" || user.role === "operations" || user.role === "founder_admin";
  const canCreateTransfer = user.role === "brand_operator" || user.role === "operations" || user.role === "distributor" || user.role === "founder_admin";
  const canEditPoStatus = user.role === "brand_operator" || user.role === "founder_admin";
  const canEditTransfer = user.role === "brand_operator" || user.role === "operations" || user.role === "distributor" || user.role === "founder_admin";

  const { consumeForPo, addForPo } = useInventory();
  const { purchaseOrders, addPurchaseOrder, patchPurchaseOrder } = usePurchaseOrders();
  const { transferOrders, addTransferOrder, patchTransferOrder } = useTransferOrders();

  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<"production" | "transfer">("production");

  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
  const [newPoOpen, setNewPoOpen] = useState(false);
  const [newPoPrefill, setNewPoPrefill] = useState<{ sku?: string; quantity?: string } | null>(null);

  const [selectedToId, setSelectedToId] = useState<string | null>(null);
  const [newToOpen, setNewToOpen] = useState(false);

  const detailPo = useMemo(
    () => (selectedPoId ? purchaseOrders.find((p) => p.id === selectedPoId) ?? null : null),
    [purchaseOrders, selectedPoId]
  );

  const detailTo = useMemo(
    () => (selectedToId ? transferOrders.find((t) => t.id === selectedToId) ?? null : null),
    [transferOrders, selectedToId]
  );

  useEffect(() => {
    if (selectedPoId && !detailPo) setSelectedPoId(null);
  }, [selectedPoId, detailPo]);

  useEffect(() => {
    if (selectedToId && !detailTo) setSelectedToId(null);
  }, [selectedToId, detailTo]);

  useEffect(() => {
    const po = searchParams.get("po");
    if (po && purchaseOrders.some((p) => p.id === po)) {
      setSelectedPoId(po);
      setTab("production");
      setSearchParams((prev) => { const n = new URLSearchParams(prev); n.delete("po"); return n; }, { replace: true });
      return;
    }
    const to = searchParams.get("to");
    if (to && transferOrders.some((t) => t.id === to)) {
      setSelectedToId(to);
      setTab("transfer");
      setSearchParams((prev) => { const n = new URLSearchParams(prev); n.delete("to"); return n; }, { replace: true });
      return;
    }
    const sku = searchParams.get("sku");
    if (sku && canCreateProductionRequest) {
      const qty = searchParams.get("qty");
      setNewPoPrefill({ sku, quantity: qty ?? undefined });
      setNewPoOpen(true);
      setTab("production");
      setSearchParams((prev) => { const n = new URLSearchParams(prev); n.delete("sku"); n.delete("qty"); return n; }, { replace: true });
    }
  }, [searchParams, purchaseOrders, transferOrders, canCreateProductionRequest, setSearchParams]);

  const patchPo = async (id: string, patch: Partial<Pick<PurchaseOrder, "status">>) => {
    if (!canEditPoStatus) return;
    const p = purchaseOrders.find((x) => x.id === id);
    if (!p) return;
    const merged = { ...p, ...patch };
    
    // Production POs ADD inventory when delivered (manufacturer shipment arrives)
    if (patch.status !== undefined && shouldAddInventoryForTransition(p, patch.status)) {
      const r = await addForPo(merged);
      if (!r.ok) {
        toast.error("Failed to receive inventory", {
          description: r.error || `Could not add inventory for ${merged.sku}.`,
        });
        return;
      }
      patchPurchaseOrder(id, { status: merged.status, inventoryConsumed: true });
      toast.success("PO status updated", {
        description: `${id} → ${merged.status} · Inventory received`,
      });
      return;
    }
    
    patchPurchaseOrder(id, patch);
    toast.success("PO status updated", { description: `${id} → ${merged.status}` });
  };

  const patchTo = (id: string, patch: Partial<Pick<TransferOrder, "status">>) => {
    if (!canEditTransfer) return;
    patchTransferOrder(id, patch);
    toast.success("Transfer updated", { description: `${id} → ${patch.status}` });
  };

  const handleCreatePo = (po: PurchaseOrder) => {
    // Production POs create inventory (when manufacturer delivers), they don't consume it.
    // Inventory is added via receive stock or when PO status transitions to delivered.
    addPurchaseOrder(po);
  };

  const handleCreateTo = (to: Omit<TransferOrder, "id">) => {
    addTransferOrder(to);
    toast.success("Transfer order created");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supply orders"
        description="Manage production requests to the manufacturer and transfer orders that move existing stock to distributors or retail accounts."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button variant="outline" size="sm" className="w-full justify-center touch-manipulation sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            {tab === "production" && canCreateProductionRequest ? (
              <Button type="button" size="sm" className="w-full justify-center touch-manipulation sm:w-auto" onClick={() => setNewPoOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New production request
              </Button>
            ) : null}
            {tab === "transfer" && canCreateTransfer ? (
              <Button type="button" size="sm" className="w-full justify-center touch-manipulation sm:w-auto" onClick={() => setNewToOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New transfer order
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab("production")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
            tab === "production"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Factory className="h-4 w-4" />
          Production Orders ({purchaseOrders.length})
        </button>
        <button
          onClick={() => setTab("transfer")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
            tab === "transfer"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Truck className="h-4 w-4" />
          Transfer Orders ({transferOrders.length})
        </button>
      </div>

      {tab === "production" ? (
        <>
          {canCreateProductionRequest ? (
            <NewPurchaseOrderDialog
              open={newPoOpen}
              onOpenChange={(o) => {
                setNewPoOpen(o);
                if (!o) setNewPoPrefill(null);
              }}
              existing={purchaseOrders}
              onCreate={handleCreatePo}
              prefill={newPoPrefill}
              variant="production"
            />
          ) : null}
          <PurchaseOrderDetailDialog
            purchaseOrder={detailPo}
            open={detailPo !== null}
            onOpenChange={(o) => { if (!o) setSelectedPoId(null); }}
            onPatch={patchPo}
            readOnly={!canEditPoStatus}
            readOnlyHint={
              user.role === "manufacturer"
                ? "Read-only — log production stages on the Manufacturer overview. PO status changes are HQ-only on this screen."
                : user.role === "distributor"
                ? "Read-only — planning reference for inbound stock; receiving lives under Shipments and Inventory."
                : undefined
            }
          />

          <Card>
            <CardContent className="pt-6">
              <div className="-mx-4 overflow-x-auto touch-pan-x px-4 sm:mx-0 sm:px-0">
                <table className="w-full min-w-[880px] text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium text-muted-foreground">Request</th>
                      <th className="pb-3 font-medium text-muted-foreground">Qty (btl)</th>
                      <th className="pb-3 font-medium text-muted-foreground">Target region</th>
                      <th className="pb-3 font-medium text-muted-foreground">Manufacturer</th>
                      <th className="pb-3 font-medium text-muted-foreground">SKU</th>
                      <th className="pb-3 font-medium text-muted-foreground">Status</th>
                      <th className="pb-3 font-medium text-muted-foreground">Expected ship</th>
                      <th className="pb-3 font-medium text-muted-foreground">Required</th>
                      <th className="pb-3 font-medium text-muted-foreground">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrders.map((po) => (
                      <tr
                        key={po.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedPoId(po.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedPoId(po.id);
                          }
                        }}
                        className="border-b last:border-0 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring cursor-pointer"
                      >
                        <td className="py-3">
                          <button
                            type="button"
                            className="font-mono text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm touch-manipulation text-left"
                            onClick={(e) => { e.stopPropagation(); setSelectedPoId(po.id); }}
                          >
                            {po.id}
                          </button>
                        </td>
                        <td className="py-3 tabular-nums">{po.quantity.toLocaleString()}</td>
                        <td className="py-3">{po.marketDestination}</td>
                        <td className="py-3">{po.manufacturer}</td>
                        <td className="py-3 font-mono text-xs">{po.sku}</td>
                        <td className="py-3">
                          <StatusBadge status={po.status} />
                        </td>
                        <td className="py-3 tabular-nums text-muted-foreground">{po.requestedShipDate}</td>
                        <td className="py-3 text-muted-foreground">{po.requiredDate}</td>
                        <td className="py-3 max-w-[180px] truncate text-muted-foreground">{po.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {canCreateTransfer ? (
            <NewTransferOrderDialog
              open={newToOpen}
              onOpenChange={setNewToOpen}
              existing={transferOrders}
              onCreate={handleCreateTo}
            />
          ) : null}
          <TransferOrderDetailDialog
            transferOrder={detailTo}
            open={detailTo !== null}
            onOpenChange={(o) => { if (!o) setSelectedToId(null); }}
            onPatch={patchTo}
            readOnly={!canEditTransfer}
          />

          <Card>
            <CardContent className="pt-6">
              <div className="-mx-4 overflow-x-auto touch-pan-x px-4 sm:mx-0 sm:px-0">
                <table className="w-full min-w-[880px] text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium text-muted-foreground">Transfer</th>
                      <th className="pb-3 font-medium text-muted-foreground">Qty (btl)</th>
                      <th className="pb-3 font-medium text-muted-foreground">From</th>
                      <th className="pb-3 font-medium text-muted-foreground">To</th>
                      <th className="pb-3 font-medium text-muted-foreground">SKU</th>
                      <th className="pb-3 font-medium text-muted-foreground">Status</th>
                      <th className="pb-3 font-medium text-muted-foreground">Ship</th>
                      <th className="pb-3 font-medium text-muted-foreground">Delivery</th>
                      <th className="pb-3 font-medium text-muted-foreground">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transferOrders.map((to) => (
                      <tr
                        key={to.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedToId(to.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedToId(to.id);
                          }
                        }}
                        className="border-b last:border-0 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring cursor-pointer"
                      >
                        <td className="py-3">
                          <button
                            type="button"
                            className="font-mono text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm touch-manipulation text-left"
                            onClick={(e) => { e.stopPropagation(); setSelectedToId(to.id); }}
                          >
                            {to.id}
                          </button>
                        </td>
                        <td className="py-3 tabular-nums">{to.quantity.toLocaleString()}</td>
                        <td className="py-3">{to.fromLocation}</td>
                        <td className="py-3">{to.toLocation}</td>
                        <td className="py-3 font-mono text-xs">{to.sku}</td>
                        <td className="py-3">
                          <StatusBadge status={to.status} />
                        </td>
                        <td className="py-3 tabular-nums text-muted-foreground">{to.shipDate}</td>
                        <td className="py-3 text-muted-foreground">{to.deliveryDate}</td>
                        <td className="py-3 max-w-[180px] truncate text-muted-foreground">{to.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
