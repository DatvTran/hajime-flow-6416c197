import type { PurchaseOrder } from "@/data/mockData";
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
  const handleStatus = async (value: string) => {
    if (!purchaseOrder) return;
    const status = value as PurchaseOrder["status"];
    await onPatch(purchaseOrder.id, { status });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg">
        {purchaseOrder ? (
          <>
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
                  <span className="font-medium tabular-nums">{purchaseOrder.quantity.toLocaleString()}</span>
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
                  <span className="text-muted-foreground">Market destination</span>
                  <span className="font-medium">{purchaseOrder.marketDestination}</span>
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
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
