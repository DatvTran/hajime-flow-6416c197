import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useAppData } from "@/contexts/AppDataContext";
import { useRetailAccountTradingName } from "@/contexts/AuthContext";
import { retailOrderDisplayId, orderLineEntries } from "@/lib/order-lines";
import { RetailStatusChip, retailStatusLabel } from "@/components/retail/RetailStatusChip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SalesOrder } from "@/data/mockData";
import { ChevronLeft } from "lucide-react";

const STEPS = ["draft", "confirmed", "packed", "shipped", "delivered"] as const;

function stepIndex(status: SalesOrder["status"]): number {
  if (status === "cancelled") return -1;
  const i = STEPS.indexOf(status as (typeof STEPS)[number]);
  return i >= 0 ? i : 0;
}

export default function RetailOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data } = useAppData();
  const accountName = useRetailAccountTradingName();

  const order = useMemo(() => {
    if (!orderId) return null;
    const decoded = decodeURIComponent(orderId);
    return data.salesOrders.find((o) => o.id === decoded) ?? null;
  }, [data.salesOrders, orderId]);

  const shipment = useMemo(
    () => (order ? data.shipments.find((s) => s.linkedOrder === order.id) : null),
    [data.shipments, order],
  );

  if (!order || order.account !== accountName) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Order not found.</p>
        <Button asChild className="mt-4" variant="secondary">
          <Link to="/retail/orders">Back to orders</Link>
        </Button>
      </div>
    );
  }

  const idx = stepIndex(order.status);
  const lines = orderLineEntries(order);

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4 -ml-2 touch-manipulation" asChild>
        <Link to="/retail/orders" className="gap-1">
          <ChevronLeft className="h-4 w-4" />
          Orders
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">{retailOrderDisplayId(order.id)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Placed {order.orderDate}</p>
        </div>
        <RetailStatusChip status={order.status} />
      </div>

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timeline</h2>
        <ol className="mt-4 space-y-3">
          {STEPS.map((st, i) => {
            const done = order.status !== "cancelled" && i <= idx;
            const current = order.status === st;
            return (
              <li key={st} className="flex gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                    done ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
                    current && "ring-2 ring-offset-2 ring-offset-background",
                  )}
                >
                  {i + 1}
                </span>
                <div>
                  <p className={cn("text-sm font-medium", done ? "text-foreground" : "text-muted-foreground")}>{retailStatusLabel(st)}</p>
                  {current ? <p className="text-xs text-muted-foreground">Current step</p> : null}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mt-8 rounded-xl border bg-card p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {lines.map((l) => (
            <li key={l.sku} className="flex justify-between gap-2 border-b border-border/50 py-2 last:border-0">
              <span className="font-medium">{l.sku}</span>
              <span className="text-muted-foreground">{l.quantityBottles} bottles · ${l.lineTotal.toLocaleString()}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-right text-sm font-semibold">Total ${order.price.toLocaleString()} CAD</p>
      </section>

      <section className="mt-6 rounded-xl border bg-card p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shipping</h2>
        <p className="mt-2 text-sm">{order.deliveryAddress ?? "Standard delivery to your venue — details confirmed on approval."}</p>
        {shipment ? (
          <dl className="mt-3 space-y-1 text-sm text-muted-foreground">
            <div>Carrier: {shipment.carrier}</div>
            <div>ETA: {shipment.eta}</div>
            <div>Status: {shipment.status}</div>
          </dl>
        ) : null}
      </section>

      {order.orderNotes ? (
        <section className="mt-6 rounded-xl border bg-card p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</h2>
          <p className="mt-2 text-sm">{order.orderNotes}</p>
        </section>
      ) : null}

      {order.customerPoReference ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Your PO: <span className="font-medium text-foreground">{order.customerPoReference}</span>
        </p>
      ) : null}

      <section className="mt-6 rounded-xl border bg-muted/40 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice</h2>
        <p className="mt-2 text-sm capitalize">{order.invoiceStatus?.replace(/_/g, " ") ?? "Not invoiced"}</p>
        <p className="mt-1 text-xs text-muted-foreground">Payment terms per your account agreement.</p>
      </section>

      <Button className="mt-8 touch-manipulation" asChild>
        <Link to={`/retail/reorder?from=${encodeURIComponent(order.id)}`}>Reorder this order</Link>
      </Button>
    </div>
  );
}
