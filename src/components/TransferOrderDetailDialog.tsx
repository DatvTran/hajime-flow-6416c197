import type { TransferOrder, InventoryItem } from "@/data/mockData";
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
import { useInventory } from "@/contexts/AppDataContext";
import { Package, Truck, Store, Factory, AlertCircle } from "lucide-react";

const NEXT_STATUS: Record<TransferOrder["status"], TransferOrder["status"] | null> = {
  draft: "picked",
  picked: "packed",
  packed: "shipped",
  shipped: "delivered",
  delivered: null,
  cancelled: null,
};

const STATUS_ACTION: Record<TransferOrder["status"], string> = {
  draft: "Reserve for picking",
  picked: "Confirm packed",
  packed: "Ship (moves to in-transit)",
  shipped: "Mark delivered (receives at destination)",
  delivered: "—",
  cancelled: "—",
};

type Props = {
  transferOrder: TransferOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPatch: (id: string, patch: Partial<Pick<TransferOrder, "status">>) => void;
  readOnly?: boolean;
};

function LocationBadge({ type }: { type: InventoryItem["locationType"] }) {
  const config = {
    manufacturer: { icon: Factory, label: "Manufacturer", className: "bg-amber-100 text-amber-800" },
    distributor_warehouse: { icon: Package, label: "Warehouse", className: "bg-blue-100 text-blue-800" },
    in_transit: { icon: Truck, label: "In Transit", className: "bg-purple-100 text-purple-800" },
    retail_shelf: { icon: Store, label: "Retail Shelf", className: "bg-green-100 text-green-800" },
  };
  const { icon: Icon, label, className } = config[type];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

export function TransferOrderDetailDialog({ transferOrder, open, onOpenChange, onPatch, readOnly }: Props) {
  const { availableBottlesAtWarehouse, getInventoryBreakdownForSku, checkCanShipTransfer } = useInventory();
  
  if (!transferOrder) return null;

  const next = NEXT_STATUS[transferOrder.status];
  const action = STATUS_ACTION[transferOrder.status];
  
  // Get inventory data for this SKU
  const breakdown = getInventoryBreakdownForSku(transferOrder.sku);
  const availableAtSource = availableBottlesAtWarehouse(transferOrder.sku, transferOrder.fromLocation);
  const canShip = checkCanShipTransfer(transferOrder.sku, transferOrder.quantity, transferOrder.fromLocation);
  
  // Calculate destination location type
  const destType: InventoryItem["locationType"] = transferOrder.toAccountId ? "retail_shelf" : "distributor_warehouse";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,800px)] overflow-y-auto sm:max-w-lg">
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

          <Separator />

          {/* Inventory Movement Visual */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Inventory Movement</p>
            
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">From</p>
                <p className="font-medium">{transferOrder.fromLocation}</p>
                <LocationBadge type="distributor_warehouse" />
                <p className="mt-1 text-xs text-muted-foreground">
                  Available: {availableAtSource.toLocaleString()} bottles
                </p>
              </div>
              
              <div className="flex flex-col items-center">
                <Truck className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{transferOrder.quantity}</span>
              </div>
              
              <div className="flex-1 rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">To</p>
                <p className="font-medium">{transferOrder.toLocation}</p>
                <LocationBadge type={destType} />
                <p className="mt-1 text-xs text-muted-foreground">
                  {transferOrder.status === "delivered" ? "Received" : "Awaiting delivery"}
                </p>
              </div>
            </div>
          </div>

          {/* Warning for insufficient stock */}
          {transferOrder.status === "packed" && !canShip.canShip && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Insufficient Inventory</p>
                <p className="text-xs">
                  Need {transferOrder.quantity} bottles at {transferOrder.fromLocation}, 
                  have {canShip.available}. Cannot ship until stock is available.
                </p>
              </div>
            </div>
          )}

          {/* Inventory Breakdown */}
          <div className="space-y-2">
            <p className="text-sm font-medium">{transferOrder.sku} Inventory by Location</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border p-2">
                <p className="text-xs text-muted-foreground">Manufacturer</p>
                <p className="text-lg font-semibold">{breakdown.manufacturer.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-2">
                <p className="text-xs text-muted-foreground">Warehouse</p>
                <p className="text-lg font-semibold">{breakdown.distributor_warehouse.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-2">
                <p className="text-xs text-muted-foreground">In Transit</p>
                <p className="text-lg font-semibold">{breakdown.in_transit.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-2">
                <p className="text-xs text-muted-foreground">Retail Shelf</p>
                <p className="text-lg font-semibold">{breakdown.retail_shelf.toLocaleString()}</p>
              </div>
            </div>
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
                disabled={next === "shipped" && !canShip.canShip}
              >
                {action}
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
