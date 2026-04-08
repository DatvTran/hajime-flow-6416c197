import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/AppDataContext";
import { orderLineEntries } from "@/lib/order-lines";
import { useMemo } from "react";

/** Lines that look constrained: open order + SKU with low available inventory (heuristic). */
export default function BackordersPage() {
  const { data } = useAppData();

  const hints = useMemo(() => {
    const availBySku: Record<string, number> = {};
    for (const row of data.inventory) {
      if (row.status !== "available") continue;
      availBySku[row.sku] = (availBySku[row.sku] ?? 0) + row.quantityBottles;
    }
    const safety = data.operationalSettings?.safetyStockBySku ?? {};
    const defaultS = 120;
    return data.salesOrders
      .filter((o) => ["confirmed", "packed"].includes(o.status))
      .map((o) => {
        const avail = availBySku[o.sku] ?? 0;
        const th = safety[o.sku] ?? defaultS;
        const atRisk = avail < o.quantity || avail < th;
        return { o, avail, atRisk };
      })
      .filter((x) => x.atRisk);
  }, [data]);

  return (
    <div>
      <PageHeader
        title="Backorders & constraints"
        description="Open fulfillment lines where available stock may not cover committed quantity — distributor execution view (spec §2.C)."
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">At-risk open lines</CardTitle>
          <p className="text-sm text-muted-foreground">Heuristic from shared inventory + open orders (not a full ATP engine).</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {hints.length === 0 ? (
            <p className="text-sm text-muted-foreground">No obvious shortfalls vs available stock for confirmed/packed orders.</p>
          ) : (
            hints.map(({ o, line, avail }) => (
              <div key={`${o.id}-${line.sku}`} className="rounded-lg border p-3 text-sm">
                <p className="font-mono text-xs font-medium">{o.id}</p>
                <p className="text-muted-foreground">
                  {o.account} · {line.sku} — need {line.quantityBottles} bottles, ~{avail.toLocaleString()} available
                </p>
                <Button className="mt-2" size="sm" variant="outline" asChild>
                  <Link to="/distributor/orders">Open orders</Link>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
