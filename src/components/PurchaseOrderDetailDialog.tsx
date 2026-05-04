import type { PurchaseOrder } from "@/data/mockData";
import { useAppData } from "@/contexts/AppDataContext";
import { resolveReceivingLocationForPo } from "@/lib/po-destination-warehouse";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { Package, Factory, ArrowRight, CheckCircle } from "lucide-react";

const PO_STATUSES: PurchaseOrder["status"][] = [
  "draft",
  "approved",
  "in-production",
  "completed",
  "shipped",
  "delivered",
  "delayed",
];

type Props = {
  purchaseOrder: PurchaseOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPatch: (id: string, patch: Partial<Pick<PurchaseOrder, "status">>) => void | Promise<void>;
  /** When true, line details are view-only (manufacturer / distributor). Status changes are Brand Operator only. */
  readOnly?: boolean;
  readOnlyHint?: string;
};

export function PurchaseOrderDetailDialog({
  purchaseOrder,
  open,
  onOpenChange,
  onPatch,
  readOnly = false,
  readOnlyHint,
}: Props) {
  const { data } = useAppData();

  const handleStatus = async (value: string) => {
    if (!purchaseOrder) return;
    const status = value as PurchaseOrder["status"];
    await onPatch(purchaseOrder.id, { status });
  };

  if (!purchaseOrder) return null;

  const destinationWarehouse = resolveReceivingLocationForPo(purchaseOrder.marketDestination, data.warehouses);
  const willReceiveInventory = purchaseOrder.status !== "delivered";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,800px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display font-mono text-lg">{purchaseOrder.id}</DialogTitle>
          <DialogDescription className="text-base text-foreground">{purchaseOrder.manufacturer}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</p>
            <div className="mt-2">
              <StatusBadge status={purchaseOrder.status} />
            </div>
          </div>

          <Separator />

          <div className="grid gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">SKU</span>
              <span className="font-mono text-xs font-medium">{purchaseOrder.sku}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Quantity</span>
              <span className="font-medium tabular-nums">{purchaseOrder.quantity.toLocaleString()} bottles</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Issue date</span>
              <span className="font-medium">{purchaseOrder.issueDate}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Required date</span>
              <span className="font-medium">{purchaseOrder.requiredDate}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Requested ship</span>
              <span className="font-medium">{purchaseOrder.requestedShipDate}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Destination warehouse</span>
              <span className="font-medium text-right">{purchaseOrder.marketDestination}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Packaging</span>
              <span className="max-w-[55%] text-right text-xs font-medium">{purchaseOrder.packagingInstructions}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Label version</span>
              <span className="font-mono text-xs font-medium">{purchaseOrder.labelVersion}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">Notes</span>
              <p className="rounded-md border bg-muted/30 p-2 text-sm text-foreground">{purchaseOrder.notes || "—"}</p>
            </div>
          </div>

          <Separator />

          {/* Inventory Receipt Visual */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Inventory Receipt</p>
            
            {willReceiveInventory ? (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Factory className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Manufacturer</p>
                  </div>
                  <p className="font-medium">{purchaseOrder.manufacturer}</p>
                </div>
                
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <p className="text-sm text-muted-foreground">Warehouse</p>
                  </div>
                  <p className="font-medium">{destinationWarehouse}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border bg-green-50 p-3 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Inventory Received</p>
                  <p className="text-sm">{purchaseOrder.quantity} bottles delivered to {destinationWarehouse}</p>
                </div>
              </div>
            )}
            
            {willReceiveInventory && (
              <p className="text-xs text-muted-foreground">
                When marked as <strong>delivered</strong>, {purchaseOrder.quantity} bottles will be 
                added to {destinationWarehouse} inventory.
              </p>
            )}
          </div>

          <Separator />

          {readOnly ? (
            <p className="text-xs text-muted-foreground">
              {readOnlyHint ??
                "View only. PO status is updated by Hajime HQ; production execution belongs on the Manufacturer portal."}
            </p>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="po-detail-status">Update status</Label>
              <Select value={purchaseOrder.status} onValueChange={handleStatus}>
                <SelectTrigger id="po-detail-status" className="touch-manipulation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PO_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s.replace("-", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
