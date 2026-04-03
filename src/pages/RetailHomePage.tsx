import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useAppData } from "@/contexts/AppDataContext";
import { useRetailAccountTradingName } from "@/contexts/AuthContext";
import { orderLineEntries, retailOrderDisplayId } from "@/lib/order-lines";
import { RetailStatusChip, retailBucketFromStatus } from "@/components/retail/RetailStatusChip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Headphones, Package, Sparkles } from "lucide-react";
import type { Product, SalesOrder } from "@/data/mockData";

const FEATURED_SKU = "HJM-FP-750";

function casesFromOrder(o: SalesOrder, sku: string, caseSize: number): number {
  for (const line of orderLineEntries(o)) {
    if (line.sku === sku) return Math.round(line.quantityBottles / caseSize);
  }
  return Math.round(o.quantity / caseSize);
}

export default function RetailHomePage() {
  const { data } = useAppData();
  const accountName = useRetailAccountTradingName();

  const myOrders = useMemo(
    () => data.salesOrders.filter((o) => o.account === accountName).sort((a, b) => Date.parse(b.orderDate) - Date.parse(a.orderDate)),
    [data.salesOrders, accountName],
  );

  const pendingPipeline = useMemo(() => myOrders.filter((o) => ["draft", "confirmed", "packed", "shipped"].includes(o.status)).length, [myOrders]);

  const lastDeliveryDate = useMemo(() => {
    const done = myOrders.filter((o) => o.status === "delivered");
    if (done.length === 0) return "—";
    const sorted = [...done].sort(
      (a, b) => Date.parse(b.actualDeliveryDate ?? b.orderDate) - Date.parse(a.actualDeliveryDate ?? a.orderDate),
    );
    return sorted[0].actualDeliveryDate ?? sorted[0].requestedDelivery;
  }, [myOrders]);

  const featured: Product | undefined = useMemo(
    () => data.products.find((p) => p.sku === FEATURED_SKU) ?? data.products.find((p) => p.status === "active"),
    [data.products],
  );

  const quickReorder = useMemo(() => {
    const fp = data.products.find((p) => p.sku === FEATURED_SKU);
    if (!fp) return null;
    const candidates = myOrders.filter((o) => orderLineEntries(o).some((l) => l.sku === FEATURED_SKU) && o.status !== "cancelled");
    if (candidates.length === 0) return null;
    const latest = candidates[0];
    const cases = casesFromOrder(latest, FEATURED_SKU, fp.caseSize);
    const days = Math.round((Date.now() - Date.parse(latest.orderDate)) / 86400000);
    return { cases, days, name: fp.name };
  }, [data.products, myOrders]);

  const recent = myOrders.slice(0, 4);
  const activeSkuCount = data.products.filter((p) => p.status === "active").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{accountName}</h1>
        </div>
        <Button asChild size="lg" className="h-12 touch-manipulation sm:min-w-[200px]">
          <Link to="/retail/new-order">Quick order</Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Available to order" value={`${activeSkuCount}`} hint="Active SKUs" to="/retail/new-order" />
        <MetricCard title="Pending orders" value={String(pendingPipeline)} hint="Awaiting delivery" to="/retail/orders?filter=pending" />
        <MetricCard title="Last delivery" value={lastDeliveryDate} hint="Most recent drop" to="/retail/orders?filter=delivered" />
        <MetricCard title="Recommended reorder" value="1-tap" hint="Repeat last buys" to="/retail/reorder" />
      </div>

      {quickReorder ? (
        <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick reorder</p>
              <p className="mt-1 font-display text-xl font-semibold">{quickReorder.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Last ordered: {quickReorder.cases} case{quickReorder.cases !== 1 ? "s" : ""} · {quickReorder.days} days ago
              </p>
            </div>
            <Button asChild size="lg" variant="secondary" className="h-12 shrink-0 touch-manipulation">
              <Link to={`/retail/reorder`}>
                Reorder {quickReorder.cases} case{quickReorder.cases !== 1 ? "s" : ""}
              </Link>
            </Button>
          </div>
        </section>
      ) : null}

      {featured ? (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Featured</h2>
          </div>
          <Link
            to="/retail/new-order"
            className="group flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-shadow hover:shadow-md sm:flex-row"
          >
            {featured.imageUrl ? (
              <div className="aspect-[4/3] w-full shrink-0 sm:w-56">
                <img src={featured.imageUrl} alt="" className="h-full w-full object-cover" />
              </div>
            ) : null}
            <div className="flex flex-1 flex-col justify-center p-5">
              <p className="font-display text-xl font-semibold">{featured.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{featured.shortDescription}</p>
              <p className="mt-3 text-sm font-medium text-foreground">
                {featured.size} · Case of {featured.caseSize}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Add to next order
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent orders</h2>
          <Button variant="link" className="h-auto p-0 text-sm" asChild>
            <Link to="/retail/orders">View all</Link>
          </Button>
        </div>
        <div className="space-y-2">
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet — start with a quick order.</p>
          ) : (
            recent.map((o) => (
              <Link
                key={o.id}
                to={`/retail/orders/${encodeURIComponent(o.id)}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-card px-4 py-3 text-sm no-underline transition-colors hover:bg-muted/40"
              >
                <span className="font-mono font-medium">{retailOrderDisplayId(o.id)}</span>
                <RetailStatusChip status={o.status} />
                <span className="text-muted-foreground">{o.orderDate}</span>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-border bg-muted/30 p-5">
        <div className="flex items-start gap-3">
          <Headphones className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-medium">Support</p>
            <p className="mt-1 text-sm text-muted-foreground">Questions on delivery or invoicing? Your Hajime rep will confirm every request.</p>
            <Button variant="outline" size="sm" className="mt-3 touch-manipulation" asChild>
              <Link to="/retail/support">Contact</Link>
            </Button>
          </div>
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        {pendingPipeline > 0
          ? `${pendingPipeline} open order${pendingPipeline !== 1 ? "s" : ""} in progress.`
          : "You’re all caught up on shipments."}
      </p>
    </div>
  );
}

function MetricCard({ title, value, hint, to }: { title: string; value?: string; hint: string; to: string }) {
  return (
    <Link to={to} className="group no-underline">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="flex h-full flex-col justify-between p-4">
          <div className="flex items-start justify-between gap-2">
            <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{value ?? "Shop"}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
