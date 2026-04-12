import { type Account, type SalesOrder } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { resolveSalesRepLabelForSession } from "@/data/team-roster";
import {
  canCollectPaymentForOrder,
  canSalesRepApproveOrder,
  createdByLabel,
  effectiveRepApprovalStatus,
  routingTargetLabel,
} from "@/lib/order-routing";
import { orderLineEntries } from "@/lib/order-lines";
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
import { toast } from "@/components/ui/sonner";
import { OrderPaymentActions } from "@/components/OrderPaymentActions";
import { Button } from "@/components/ui/button";

const ORDER_STATUSES: SalesOrder["status"][] = [
  "draft",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];

const PAYMENT_STATUSES: SalesOrder["paymentStatus"][] = ["pending", "paid", "overdue"];

/** Fulfillment steps that require payment first (policy: pay before ship). */
const STATUSES_NEEDING_PAYMENT: SalesOrder["status"][] = ["packed", "shipped", "delivered"];

type Props = {
  order: SalesOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPatch: (id: string, patch: Partial<SalesOrder>) => void;
  /** Used to detect retail-channel drafts for approval actions. */
  accounts?: Account[];
  onStripeBillingUpdated?: () => void;
  /** Bumps to refresh billing UI after Stripe actions (card saved / charged). */
  billingRefresh?: number;
};

export function SalesOrderDetailDialog({
  order,
  open,
  onOpenChange,
  onPatch,
  accounts = [],
  onStripeBillingUpdated,
  billingRefresh = 0,
}: Props) {
  const { user } = useAuth();
  const sessionRep = resolveSalesRepLabelForSession(user?.email, user?.displayName ?? "");

  const handleStatus = (value: string) => {
    if (!order) return;
    const status = value as SalesOrder["status"];
    if (status !== "cancelled" && STATUSES_NEEDING_PAYMENT.includes(status) && order.paymentStatus !== "paid") {
      toast.error("Payment required before fulfillment", {
        description: "Collect payment (charge card on file or Pay with card) before packing, shipping, or delivered.",
      });
      return;
    }
    onPatch(order.id, { status });
    toast.success("Order status updated", { description: `${order.id} → ${status}` });
  };

  const handlePayment = (value: string) => {
    if (!order) return;
    const paymentStatus = value as SalesOrder["paymentStatus"];
    onPatch(order.id, { paymentStatus });
    toast.success("Payment status updated", { description: `${order.id} → ${paymentStatus}` });
  };

  const showRepApprovalPanel = Boolean(
    order && user.role === "sales_rep" && canSalesRepApproveOrder(order, accounts, sessionRep),
  );

  const paymentAllowed = order ? canCollectPaymentForOrder(order, accounts) : false;

  const approveRetailOrder = () => {
    if (!order) return;
    onPatch(order.id, { repApprovalStatus: "approved" });
    toast.success("Order approved", { description: `${order.id} — capture payment next, then wholesaler fulfillment.` });
  };

  const rejectRetailOrder = () => {
    if (!order) return;
    onPatch(order.id, { status: "cancelled", repApprovalStatus: "not_required" });
    toast.info("Order rejected", { description: `${order.id} marked cancelled.` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg">
        {order ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display font-mono text-lg">{order.id}</DialogTitle>
              <DialogDescription className="text-base text-foreground">{order.account}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Current</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge status={order.status} />
                  <StatusBadge status={order.paymentStatus} />
                </div>
              </div>

              <Separator />

              <div className="grid gap-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Market</span>
                  <span className="font-medium">{order.market}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Order date</span>
                  <span className="font-medium">{order.orderDate}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Requested delivery</span>
                  <span className="font-medium">{order.requestedDelivery}</span>
                </div>
                {order.lines && order.lines.length > 0 ? (
                  <div className="col-span-full space-y-2">
                    <span className="text-muted-foreground">Line items</span>
                    <ul className="rounded-md border p-2 text-xs">
                      {orderLineEntries(order).map((l) => (
                        <li key={l.sku} className="flex justify-between gap-2 py-1">
                          <span className="font-mono">{l.sku}</span>
                          <span>
                            {l.quantityBottles} bt · ${l.lineTotal.toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">SKU</span>
                      <span className="font-mono text-xs font-medium">{order.sku}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Quantity</span>
                      <span className="font-medium">{order.quantity.toLocaleString()} bottles</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Value</span>
                  <span className="font-medium">${order.price.toLocaleString()}</span>
                </div>
                {order.customerPoReference ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Customer PO</span>
                    <span className="font-medium">{order.customerPoReference}</span>
                  </div>
                ) : null}
                {order.orderNotes ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Notes</span>
                    <span className="font-medium">{order.orderNotes}</span>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Sales rep</span>
                  <span className="font-medium">{order.salesRep}</span>
                </div>
                {order.orderRoutingTarget ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Pathway</span>
                    <span className="text-right font-medium">{routingTargetLabel(order.orderRoutingTarget)}</span>
                  </div>
                ) : null}
                {order.orderCreatedByRole ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Created as</span>
                    <span className="font-medium">{createdByLabel(order.orderCreatedByRole)}</span>
                  </div>
                ) : null}
                {order.placedOnBehalfByRep ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Placement</span>
                    <span className="text-right font-medium">Sales rep submitted on behalf of retailer</span>
                  </div>
                ) : null}
                {order.wholesalerFulfillmentStatus ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">DC fulfillment</span>
                    <span className="font-medium capitalize">{order.wholesalerFulfillmentStatus.replace(/_/g, " ")}</span>
                  </div>
                ) : null}
                {order.assignedSalesRep ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Routed rep</span>
                    <span className="font-medium">{order.assignedSalesRep}</span>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Rep approval</span>
                  <span className="font-medium capitalize">{effectiveRepApprovalStatus(order, accounts)}</span>
                </div>
              </div>

              <Separator />

              {user.role === "distributor" &&
              order.wholesalerFulfillmentStatus === "pending_ack" &&
              order.paymentStatus === "paid" &&
              order.status === "confirmed" ? (
                <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
                  <p className="text-sm font-medium text-foreground">Wholesaler — confirm availability</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Acknowledge this paid order before packing. Manufacturer replenishment runs from Production requests when DC stock is low.
                  </p>
                  <div className="mt-3">
                    <Button
                      type="button"
                      size="sm"
                      className="touch-manipulation"
                      onClick={() => {
                        onPatch(order.id, { wholesalerFulfillmentStatus: "acknowledged" });
                        toast.success("Acknowledged", { description: `${order.id} — proceed to pack & ship.` });
                      }}
                    >
                      Confirm availability & acknowledge
                    </Button>
                  </div>
                </div>
              ) : null}

              {showRepApprovalPanel ? (
                <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
                  <p className="text-sm font-medium text-foreground">Retail order — your approval</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Approve to allow payment. After the card is charged, this order goes to the wholesaler for delivery and shipping.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" size="sm" className="touch-manipulation" onClick={approveRetailOrder}>
                      Approve for payment
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="touch-manipulation" onClick={rejectRetailOrder}>
                      Reject
                    </Button>
                  </div>
                </div>
              ) : null}

              {/* Role-guarded status controls — only manufacturer/distributor can change fulfillment/payment status */}
              {user.role === "manufacturer" || user.role === "distributor" ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="detail-order-status">Fulfillment status</Label>
                    <Select value={order.status} onValueChange={handleStatus}>
                      <SelectTrigger id="detail-order-status" className="touch-manipulation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="detail-payment-status">Payment status</Label>
                    <Select value={order.paymentStatus} onValueChange={handlePayment}>
                      <SelectTrigger id="detail-payment-status" className="touch-manipulation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 rounded-md border border-muted bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Fulfillment status</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Payment status</span>
                    <StatusBadge status={order.paymentStatus} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Only manufacturer and distributor roles can modify order statuses.
                  </p>
                </div>
              )}

              <Separator />

              <OrderPaymentActions
                key={`${order.id}-${billingRefresh}`}
                order={order}
                onPatch={onPatch}
                onStripeBillingUpdated={onStripeBillingUpdated}
                paymentAllowed={paymentAllowed}
              />
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
