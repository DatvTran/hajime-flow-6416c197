import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAppData } from "@/contexts/AppDataContext";
import { useRetailAccountTradingName } from "@/contexts/AuthContext";
import { retailOrderDisplayId, orderLineEntries } from "@/lib/order-lines";
import { RetailStatusChip, retailBucketFromStatus, type RetailOrderFilter } from "@/components/retail/RetailStatusChip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Product, SalesOrder } from "@/data/mockData";

function filterKey(raw: string | null): RetailOrderFilter {
  if (raw === "pending" || raw === "in_transit" || raw === "delivered") return raw;
  return "all";
}

function casesSummary(o: SalesOrder, products: Product[]): string {
  const parts: string[] = [];
  for (const line of orderLineEntries(o)) {
    const p = products.find((x) => x.sku === line.sku);
    const cs = p ? Math.round(line.quantityBottles / p.caseSize) : 0;
    parts.push(`${cs} cs ${p?.name ?? line.sku}`);
  }
  return parts.join(" · ") || `${o.quantity} bottles`;
}

function etaForOrder(o: SalesOrder, shipments: { linkedOrder: string; eta: string; status: string }[]): string {
  const sh = shipments.find((s) => s.linkedOrder === o.id);
  if (o.status === "delivered") return o.actualDeliveryDate ?? "Delivered";
  if (sh && sh.status !== "delivered") return sh.eta;
  return o.requestedDelivery;
}

export default function RetailMyOrdersPage() {
  const { data } = useAppData();
  const accountName = useRetailAccountTradingName();
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = filterKey(searchParams.get("filter"));

  const myOrders = useMemo(
    () => data.salesOrders.filter((o) => o.account === accountName).sort((a, b) => Date.parse(b.orderDate) - Date.parse(a.orderDate)),
    [data.salesOrders, accountName],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return myOrders.filter((o) => o.status !== "cancelled");
    return myOrders.filter((o) => retailBucketFromStatus(o.status) === filter);
  }, [myOrders, filter]);

  const setFilter = (f: RetailOrderFilter) => {
    const next = new URLSearchParams(searchParams);
    if (f === "all") next.delete("filter");
    else next.set("filter", f);
    setSearchParams(next, { replace: true });
  };

  const chips: { id: RetailOrderFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "in_transit", label: "In transit" },
    { id: "delivered", label: "Delivered" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">My orders</h1>
      <p className="mt-1 text-sm text-muted-foreground">History and status for {accountName}.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.id)}
            className={cn(
              "min-h-11 rounded-full border px-4 py-2 text-sm font-medium touch-manipulation transition-colors",
              filter === c.id ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <ul className="mt-6 space-y-3">
        {filtered.length === 0 ? (
          <li className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No orders in this view.</li>
        ) : (
          filtered.map((o) => (
            <li key={o.id} className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{retailOrderDisplayId(o.id)}</span>
                    <RetailStatusChip status={o.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {o.orderDate} · {casesSummary(o, data.products)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">ETA {etaForOrder(o, data.shipments)}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button variant="secondary" size="sm" className="touch-manipulation" asChild>
                    <Link to={`/retail/orders/${encodeURIComponent(o.id)}`}>View</Link>
                  </Button>
                  <Button variant="outline" size="sm" className="touch-manipulation" asChild>
                    <Link to={`/retail/reorder?from=${encodeURIComponent(o.id)}`}>Reorder</Link>
                  </Button>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
