import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getExportOrder, getExportOrders, patchExportOrder, type ExportOrderDto } from "@/lib/api-v1";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";

export default function ManufacturerExportAuthPage() {
  const { user } = useAuth();
  const { orderId } = useParams();
  if (!user || user.role !== "manufacturer") return <Navigate to="/" replace />;
  if (orderId) return <MfrDetail orderId={orderId} />;
  return <MfrList />;
}

function MfrList() {
  const [rows, setRows] = useState<ExportOrderDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getExportOrders()
      .then((r) => setRows(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4 p-4">
      <h1 className="font-display text-2xl">Production authorizations</h1>
      <p className="text-sm text-muted-foreground">
        Instructions from Hajime Ltd. after deposit clearance. Confirm slot, batch, and ready-to-ship. You are not the
        buyer’s contracting party.
      </p>
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No authorized runs yet.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {rows.map((r) => (
            <li key={r.id} className="px-4 py-3">
              <Link className="font-medium text-accent" to={`/manufacturer/export-authorizations/${r.displayId}`}>
                {r.displayId}
              </Link>
              <p className="text-sm text-muted-foreground">
                {String(r.buyerCompany)} · {String(r.territory)} · {r.stage}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MfrDetail({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<ExportOrderDto | null>(null);

  const load = useCallback(async () => {
    const res = await getExportOrder(orderId);
    setOrder(res.data);
  }, [orderId]);

  useEffect(() => {
    void load().catch(() => setOrder(null));
  }, [load]);

  const save = async (patch: Record<string, unknown>) => {
    if (!order) return;
    try {
      const res = await patchExportOrder(String(order.displayId), patch);
      setOrder(res.data);
      toast.success("Confirmation saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    }
  };

  if (!order) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading
      </div>
    );
  }

  const lines = Array.isArray(order.lines) ? order.lines : [];

  return (
    <div className="space-y-4 p-4">
      <Link to="/manufacturer/export-authorizations" className="text-sm text-accent">
        All authorizations
      </Link>
      <h1 className="font-display text-2xl">{String(order.paNo || order.displayId)}</h1>
      <p className="text-sm text-muted-foreground">
        {String(order.buyerCompany)} · {String(order.territory)} · PI {String(order.piNo)}
      </p>
      <ul className="text-sm">
        {lines.map((l: { sku: string; cases: number; size?: string; product?: string }) => (
          <li key={l.sku}>
            {l.product || l.sku} — {l.cases} cs
          </li>
        ))}
      </ul>
      <div className="grid max-w-lg gap-3">
        <div>
          <Label>Production slot</Label>
          <Input
            defaultValue={String(order.productionSlot ?? "")}
            onBlur={(e) => void save({ productionSlot: e.target.value })}
          />
        </div>
        <div>
          <Label>Expected completion</Label>
          <Input
            type="date"
            defaultValue={String(order.expectedCompletion ?? "").slice(0, 10)}
            onBlur={(e) => void save({ expectedCompletion: e.target.value })}
          />
        </div>
        <div>
          <Label>Batch / lot plan</Label>
          <Input defaultValue={String(order.batchPlan ?? "")} onBlur={(e) => void save({ batchPlan: e.target.value })} />
        </div>
        <div>
          <Label>Ready-to-ship date</Label>
          <Input
            type="date"
            defaultValue={String(order.readyToShipOn ?? "").slice(0, 10)}
            onBlur={(e) => void save({ readyToShipOn: e.target.value })}
          />
        </div>
        <Button type="button" onClick={() => toast.message("Saved on blur — confirm fields above")}>
          Confirm
        </Button>
      </div>
    </div>
  );
}
