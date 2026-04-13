import type { TransferOrder } from "@/data/mockData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Separator } from "@/components/ui/separator";

const NEXT_STATUS: Record<TransferOrder["status"], TransferOrder["status"] | null> = {
  draft: "picked",
  picked: "packed",
  packed: "shipped",
  shipped: "delivered",
  delivered: null,
  cancelled: null,
};

type Props = {
  transferOrder: TransferOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPatch: (id: string, patch: Partial<Pick<TransferOrder, "status">>) => void;
  readOnly?: boolean;
};

export function TransferOrderDetailDialog({ transferOrder, open, onOpenChange, onPatch, readOnly }: Props) {
  if (!transferOrder) return null;

  const next = NEXT_STATUS[transferOrder.status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{transferOrder.id}</DialogTitle>
          <DialogDescription>
            Transfer from {transferOrder.fromLocation} to {transferOrder.toLocation}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <StatusBadge status={transferOrder.status} />
          </div>

          <Separator />

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">SKU</span>
              <p className="font-mono text-xs">{transferOrder.sku}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Quantity</span>
              <p className="font-medium">{transferOrder.quantity.toLocaleString()} bottles</p>
            </div>
            <div>
              <span className="text-muted-foreground">Ship Date</span>
              <p className="font-medium">{transferOrder.shipDate}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Delivery Date</span>
              <p className="font-medium">{transferOrder.deliveryDate}</p>
            </div>
            {transferOrder.trackingNumber ? (
              <div className="sm:col-span-2">
                <span className="text-muted-foreground">Tracking / BOL</span>
                <p className="font-medium">{transferOrder.trackingNumber}</p>
              </div>
            ) : null}
            {transferOrder.linkedSalesOrderId ? (
              <div className="sm:col-span-2">
                <span className="text-muted-foreground">Linked Sales Order</span>
                <p className="font-medium">{transferOrder.linkedSalesOrderId}</p>
              </div>
            ) : null}
            {transferOrder.notes ? (
              <div className="sm:col-span-2">
                <span className="text-muted-foreground">Notes</span>
                <p className="font-medium">{transferOrder.notes}</p>
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 pt-4 sm:flex-row sm:justify-end">
          {!readOnly && next ? (
            <>
              <Button
                variant="outline"
                className="touch-manipulation"
                onClick={() => onPatch(transferOrder.id, { status: "cancelled" })}
              >
                Cancel
              </Button>
              <Button
                className="touch-manipulation"
                onClick={() => onPatch(transferOrder.id, { status: next })}
              >
                Mark as {next}
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" className="touch-manipulation" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
