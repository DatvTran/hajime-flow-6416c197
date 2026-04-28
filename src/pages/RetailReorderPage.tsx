import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAppData } from "@/contexts/AppDataContext";
import { RetailSkeleton } from "@/components/skeletons";
import { useRetailAccountTradingName } from "@/contexts/AuthContext";
import { orderLineEntries, retailOrderDisplayId } from "@/lib/order-lines";
import { Button } from "@/components/ui/button";
import type { Product, SalesOrder } from "@/data/mockData";

type Agg = { sku: string; lastOrder: SalesOrder; lastCases: number; daysAgo: number; product: Product };

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

  const aggregates = useMemo(() => {
    const map = new Map<string, Agg>();
    const sorted = [...myOrders].sort((a, b) => Date.parse(b.orderDate) - Date.parse(a.orderDate));
    for (const o of sorted) {
      for (const line of orderLineEntries(o)) {
        if (map.has(line.sku)) continue;
        const product = (data?.products || []).find((p) => p.sku === line.sku);
        if (!product || product.status !== "active") continue;
        const cases = Math.round(line.quantityBottles / product.caseSize);
        const daysAgo = Math.max(0, Math.round((Date.now() - Date.parse(o.orderDate)) / 86400000));
        map.set(line.sku, { sku: line.sku, lastOrder: o, lastCases: cases, daysAgo, product });
      }
    }
    return [...map.values()].sort((a, b) => a.daysAgo - b.daysAgo);
  }, [myOrders, data?.products]);

  if (loading) {
    return <RetailSkeleton />;
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Reorder</h1>
      <p className="mt-1 text-sm text-muted-foreground">One-tap repeat buys — same approval flow as new orders.</p>

      {fromOrder ? (
        <section className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">From order</p>
          <p className="mt-1 font-medium">{retailOrderDisplayId(fromOrder.id)} · {fromOrder.orderDate}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {orderLineEntries(fromOrder).map((line) => {
              const p = (data?.products || []).find((x) => x.sku === line.sku);
              const cases = p ? Math.round(line.quantityBottles / p.caseSize) : 0;
              return (
                <Button key={line.sku} asChild variant="secondary" className="touch-manipulation">
                  <Link to={`/retail/new-order?sku=${encodeURIComponent(line.sku)}&cases=${cases}`}>
                    Repeat {p?.name ?? line.sku} ({cases} cs)
                  </Link>
                </Button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Frequently ordered</h2>
        <ul className="mt-4 space-y-4">
          {aggregates.length === 0 ? (
            <li className="text-sm text-muted-foreground">Place an order to see reorder shortcuts here.</li>
          ) : (
            aggregates.map((a) => (
              <li key={a.sku} className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    {a.product.imageUrl ? (
                      <img src={a.product.imageUrl} alt="" className="mb-3 h-16 w-16 rounded-lg object-cover" />
                    ) : null}
                    <p className="font-display text-lg font-semibold">{a.product.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Last ordered {a.daysAgo === 0 ? "today" : `${a.daysAgo} days ago`} · Last quantity: {a.lastCases} case
                      {a.lastCases !== 1 ? "s" : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Suggested: restock before depletion — your rep can confirm cadence.
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    <Button asChild className="touch-manipulation">
                      <Link to={`/retail/new-order?sku=${encodeURIComponent(a.sku)}&cases=${a.lastCases}`}>Reorder same quantity</Link>
                    </Button>
                    <Button asChild variant="outline" className="touch-manipulation">
                      <Link to="/retail/new-order">Edit quantity</Link>
                    </Button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
