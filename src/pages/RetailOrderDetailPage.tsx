import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useAppData } from "@/contexts/AppDataContext";
import { RetailSkeleton } from "@/components/skeletons";
import { useRetailAccountTradingName } from "@/contexts/AuthContext";
import { retailOrderDisplayId, orderLineEntries } from "@/lib/order-lines";
import { RetailStatusPill } from "@/components/retail/RetailStatusPill";
import { RetailShipmentTracker } from "@/components/retail/RetailShipmentTracker";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SalesOrder } from "@/data/mockData";

const STEPS = ["draft", "confirmed", "packed", "shipped", "delivered"] as const;

function stepIndex(status: SalesOrder["status"]): number {
  if (status === "cancelled") return -1;
  const i = STEPS.indexOf(status as (typeof STEPS)[number]);
  return i >= 0 ? i : 0;
}

function formatMoney(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function RetailOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data, loading } = useAppData();
  const accountName = useRetailAccountTradingName();

  const order = useMemo(() => {
    if (!orderId) return null;
    return data.salesOrders.find((o) => o.id === decodeURIComponent(orderId)) ?? null;
  }, [data.salesOrders, orderId]);

  const shipment = useMemo(
    () => (order ? data.shipments.find((s) => s.linkedOrder === order.id) : null),
    [data.shipments, order],
  );

  if (loading) return <RetailSkeleton />;

  if (!order || order.account !== accountName) {
    return (
      <div className="py-12 text-center">
        <p className="text-[13px] text-muted-foreground">Order not found.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/retail/orders">Back to orders</Link>
        </Button>
      </div>
    );
  }

  const lines = orderLineEntries(order);

  return (
    <div className="space-y-6 pb-8">
      <Button variant="ghost" size="sm" className="-ml-2 h-8 gap-1 text-[13px] text-muted-foreground" asChild>
        <Link to="/retail/orders">
          <ChevronLeft className="size-4" />
          My orders
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.02em]">{retailOrderDisplayId(order.id)}</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Placed {order.orderDate}</p>
        </div>
        <RetailStatusPill status={order.status} />
      </div>

      <section className="overflow-hidden rounded-[14px] border border-border/70 bg-card p-5 shadow-[var(--shadow-soft)]">
        <h2 className="mb-4 font-display text-[19px] font-medium tracking-[-0.01em]">Fulfillment</h2>
        <RetailShipmentTracker
          status={order.status}
          dates={[order.orderDate, order.orderDate, undefined, shipment?.shipDate, order.actualDeliveryDate ?? order.requestedDelivery]}
        />
        <div className="mt-4 flex flex-wrap gap-5 border-t border-border/50 pt-3.5 text-[13px]">
          <div>
            Total <strong className="font-mono font-medium">${formatMoney(order.price)}</strong>
          </div>
          {shipment?.waybillNumber ? (
            <div>
              Tracking <strong className="font-mono">{shipment.waybillNumber}</strong>
            </div>
          ) : null}
          {shipment ? (
            <div className="ml-auto">
              <Button variant="outline" size="sm" className="h-[30px] text-xs" asChild>
                <Link to="/shipments">Track delivery</Link>
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-[14px] border border-border/70 bg-card shadow-[var(--shadow-soft)]">
        <div className="border-b border-border/50 px-5 py-4">
          <h2 className="text-sm font-semibold">Line items</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="bg-muted/50 text-[10px] font-semibold uppercase tracking-[0.1em]">SKU</TableHead>
              <TableHead className="bg-muted/50 text-[10px] font-semibold uppercase tracking-[0.1em]">Qty</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((l) => (
              <TableRow key={l.sku}>
                <TableCell className="font-mono text-xs">{l.sku}</TableCell>
                <TableCell>{l.quantityBottles} bottles</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button className="bg-accent text-accent-foreground hover:bg-[hsl(32_78%_48%)]" asChild>
          <Link to={`/retail/reorder?from=${encodeURIComponent(order.id)}`}>Reorder this order</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/retail/support">Contact support</Link>
        </Button>
      </div>
    </div>
  );
}
