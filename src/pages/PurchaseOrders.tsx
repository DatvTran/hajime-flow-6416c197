import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { PurchaseOrderDetailDialog } from "@/components/PurchaseOrderDetailDialog";
import { NewPurchaseOrderDialog } from "@/components/NewPurchaseOrderDialog";
import type { PurchaseOrder } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { useInventory, usePurchaseOrders } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { simulateLedgerCommit } from "@/lib/ledger";

function shouldConsumeInventoryForTransition(p: PurchaseOrder, nextStatus: PurchaseOrder["status"]): boolean {
  if (p.inventoryConsumed) return false;
  if (nextStatus !== "shipped" && nextStatus !== "delivered") return false;
  if (p.status === "shipped" || p.status === "delivered") return false;
  return true;
}

export default function PurchaseOrders() {
  const { user } = useAuth();
  const canCreateProductionRequest = user.role === "brand_operator";
  /** Only HQ may change PO workflow status on this screen; manufacturer uses the Manufacturer portal for execution. */
  const canEditPoStatus = user.role === "brand_operator";
  const { consumeForPo } = useInventory();
  const { purchaseOrders, addPurchaseOrder, patchPurchaseOrder } = usePurchaseOrders();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
  const [newPoOpen, setNewPoOpen] = useState(false);
  const [newPoPrefill, setNewPoPrefill] = useState<{ sku?: string; quantity?: string } | null>(null);

  const detailPo = useMemo(
    () => (selectedPoId ? purchaseOrders.find((p) => p.id === selectedPoId) ?? null : null),
    [purchaseOrders, selectedPoId],
  );

  useEffect(() => {
    if (selectedPoId && !detailPo) setSelectedPoId(null);
  }, [selectedPoId, detailPo]);

  useEffect(() => {
    const po = searchParams.get("po");
    if (!po || purchaseOrders.length === 0) return;
    if (!purchaseOrders.some((p) => p.id === po)) return;
    setSelectedPoId(po);
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.delete("po");
        return n;
      },
      { replace: true },
    );
  }, [searchParams, purchaseOrders, setSearchParams]);

  useEffect(() => {
    const sku = searchParams.get("sku");
    if (!sku) return;
    if (!canCreateProductionRequest) {
      setSearchParams(
        (prev) => {
          const n = new URLSearchParams(prev);
          n.delete("sku");
          n.delete("qty");
          return n;
        },
        { replace: true },
      );
      return;
    }
    const qty = searchParams.get("qty");
    setNewPoPrefill({ sku, quantity: qty ?? undefined });
    setNewPoOpen(true);
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.delete("sku");
        n.delete("qty");
        return n;
      },
      { replace: true },
    );
  }, [searchParams, canCreateProductionRequest, setSearchParams]);

  const pageDescription = useMemo(() => {
    switch (user.role) {
      case "brand_operator":
        return "Create replenishment requests to the manufacturer — quantity, region, SKU, and target dates. Execution status and shipping handoff update here and tie to inventory when stock ships.";
      case "distributor":
        return "Read-only view of HQ production requests — use for inbound timing, receiving, and coordination with Shipments. You cannot create or edit requests.";
      case "manufacturer":
        return "Read-only view of requests from Hajime HQ. Record production stages and notes on the Manufacturer portal; PO status is updated here by Brand Operator only.";
      default:
        return "Production requests are created by Hajime HQ.";
    }
  }, [user.role]);

  const poReadOnlyHint =
    user.role === "manufacturer"
      ? "Read-only — log production stages on the Manufacturer overview. PO status changes are HQ-only on this screen."
      : user.role === "distributor"
        ? "Read-only — planning reference for inbound stock; receiving lives under Shipments and Inventory."
        : undefined;

  const patchPo = async (id: string, patch: Partial<Pick<PurchaseOrder, "status">>) => {
    if (!canEditPoStatus) return;
    const p = purchaseOrders.find((x) => x.id === id);
    if (!p) return;
    const merged = { ...p, ...patch };
    if (patch.status !== undefined && shouldConsumeInventoryForTransition(p, patch.status)) {
      const r = consumeForPo(merged);
      if (!r.ok) {
        toast.error("Insufficient inventory to fulfill", {
          description: `Short by ${r.shortfall.toLocaleString()} bottles for ${merged.sku}. Receive stock or lower the PO quantity.`,
        });
        return;
      }
      const { txHash } = await simulateLedgerCommit({
        type: "po_fulfill",
        poId: id,
        sku: merged.sku,
        quantity: merged.quantity,
        status: merged.status,
      });
      patchPurchaseOrder(id, { status: merged.status, inventoryConsumed: true });
      toast.success("PO status updated", {
        description: `${id} → ${merged.status} · Ledger ${txHash.slice(0, 10)}…`,
      });
      return;
    }
    patchPurchaseOrder(id, patch);
    toast.success("PO status updated", { description: `${id} → ${merged.status}` });
  };

  const handleCreate = (po: PurchaseOrder) => {
    if ((po.status === "shipped" || po.status === "delivered") && !po.inventoryConsumed) {
      const r = consumeForPo(po);
      if (!r.ok) {
        toast.error("Could not allocate inventory", {
          description: `Short by ${r.shortfall.toLocaleString()} bottles for ${po.sku}.`,
        });
        return;
      }
      addPurchaseOrder({ ...po, inventoryConsumed: true });
      return;
    }
    addPurchaseOrder(po);
  };

  const openDetail = (id: string) => {
    setSelectedPoId(id);
  };

  return (
    <div>
      <PageHeader
        title="Production requests"
        description={pageDescription}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button variant="outline" size="sm" className="w-full justify-center touch-manipulation sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            {canCreateProductionRequest ? (
              <Button type="button" size="sm" className="w-full justify-center touch-manipulation sm:w-auto" onClick={() => setNewPoOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New production request
              </Button>
            ) : null}
          </div>
        }
      />

      {canCreateProductionRequest ? (
        <NewPurchaseOrderDialog
          open={newPoOpen}
          onOpenChange={(o) => {
            setNewPoOpen(o);
            if (!o) setNewPoPrefill(null);
          }}
          existing={purchaseOrders}
          onCreate={handleCreate}
          prefill={newPoPrefill}
        />
      ) : null}

      <PurchaseOrderDetailDialog
        purchaseOrder={detailPo}
        open={detailPo !== null}
        onOpenChange={(o) => {
          if (!o) setSelectedPoId(null);
        }}
        onPatch={patchPo}
        readOnly={!canEditPoStatus}
        readOnlyHint={poReadOnlyHint}
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
                    onClick={() => openDetail(po.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openDetail(po.id);
                      }
                    }}
                    className="border-b last:border-0 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring cursor-pointer"
                  >
                    <td className="py-3">
                      <button
                        type="button"
                        className="font-mono text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm touch-manipulation text-left"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetail(po.id);
                        }}
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
    </div>
  );
}
