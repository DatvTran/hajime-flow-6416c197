import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useAppData } from "@/contexts/AppDataContext";
import { RetailSkeleton } from "@/components/skeletons";
import { useRetailAccountTradingName } from "@/contexts/AuthContext";
import { orderLineEntries, retailOrderDisplayId } from "@/lib/order-lines";
import { RetailPageHeader } from "@/components/retail/RetailPageHeader";
import { RetailStatusPill } from "@/components/retail/RetailStatusPill";
import { Button } from "@/components/ui/button";
import type { Product, SalesOrder } from "@/data/mockData";

function formatMoney(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function orderTemplates(orders: SalesOrder[], products: Product[]) {
  return orders.slice(0, 6).map((o) => {
    const items = orderLineEntries(o).map((line) => {
      const p = products.find((x) => x.sku === line.sku);
      const cs = p ? Math.round(line.quantityBottles / p.caseSize) : 0;
      return `${cs}× ${p?.name ?? line.sku}`;
    });
    return { order: o, items, total: formatMoney(o.price) };
  });
}

export default function RetailReorderPage() {
  const { data, loading } = useAppData();
  const accountName = useRetailAccountTradingName();
  const [searchParams] = useSearchParams();
  const fromOrderId = searchParams.get("from");

  const myOrders = useMemo(
    () => (data?.salesOrders || []).filter((o) => o.account === accountName && o.status !== "cancelled"),
    [data?.salesOrders, accountName],
  );

  const fromOrder = useMemo(() => {
    if (!fromOrderId) return null;
    return myOrders.find((o) => o.id === decodeURIComponent(fromOrderId)) ?? null;
  }, [fromOrderId, myOrders]);

  const templates = useMemo(() => orderTemplates(myOrders, data?.products || []), [myOrders, data?.products]);

  if (loading) return <RetailSkeleton />;

  return (
    <div className="space-y-6 pb-8">
      <RetailPageHeader
        title="Reorder"
        description="Repeat a previous order with one tap. Quantities and SKUs pre-filled — customize before submitting."
      />

      {fromOrder ? (
        <div className="rounded-[14px] border border-accent/30 bg-accent/5 p-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">From order</p>
          <p className="mt-1 font-mono text-sm font-medium">
            {retailOrderDisplayId(fromOrder.id)} · {fromOrder.orderDate}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {orderLineEntries(fromOrder).map((line) => {
              const p = (data?.products || []).find((x) => x.sku === line.sku);
              const cases = p ? Math.round(line.quantityBottles / p.caseSize) : 0;
              return (
                <Button key={line.sku} asChild variant="secondary" size="sm">
                  <Link to={`/retail/new-order?sku=${encodeURIComponent(line.sku)}&cases=${cases}`}>
                    Repeat {p?.name ?? line.sku} ({cases} cs)
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      ) : null}

      {templates.map(({ order, items, total }) => (
        <article
          key={order.id}
          className="rounded-[14px] border border-border/70 bg-card p-5 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-lifted)]"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="font-mono text-xs text-muted-foreground">
              {retailOrderDisplayId(order.id)} · {order.orderDate}
            </span>
            <RetailStatusPill status={order.status} />
          </div>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {items.map((tag) => (
              <span key={tag} className="rounded-full border border-border/60 bg-muted px-2.5 py-1 text-xs">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-border/50 pt-3.5">
            <span className="font-display text-xl font-semibold tracking-[-0.01em] tabular-nums">${total}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-[30px] text-xs" asChild>
                <Link to={`/retail/new-order`}>Customize</Link>
              </Button>
              <Button size="sm" className="h-[30px] bg-accent text-xs text-accent-foreground hover:bg-[hsl(32_78%_48%)]" asChild>
                <Link to={`/retail/reorder?from=${encodeURIComponent(order.id)}`}>Reorder this</Link>
              </Button>
            </div>
          </div>
        </article>
      ))}

      {templates.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">Place an order to see reorder templates here.</p>
      ) : null}

      <div className="rounded-[14px] border border-dashed border-border px-6 py-8 text-center">
        <ShoppingCart className="mx-auto mb-3 size-8 text-muted-foreground/50" strokeWidth={1.5} />
        <p className="mb-3 text-[13px] text-muted-foreground">Want something different?</p>
        <Button variant="outline" asChild>
          <Link to="/retail/new-order">Build a new order</Link>
        </Button>
      </div>
    </div>
  );
}
