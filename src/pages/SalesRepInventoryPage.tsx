import { useInventory } from "@/contexts/AppDataContext";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Package, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/** Cases below this threshold trigger a "Running low" warning */
const LOW_STOCK_THRESHOLD_CASES = 20;

export default function SalesRepInventoryPage() {
  const { items } = useInventory();

  // Filter to distributor warehouse stock only (available)
  const distributorStock = items.filter(
    (i) =>
      i.locationType === "distributor_warehouse" && i.status === "available",
  );

  // Group by SKU to aggregate across batches
  const bySkuMap = new Map<
    string,
    {
      sku: string;
      productName: string;
      warehouse: string;
      totalBottles: number;
      totalCases: number;
      batches: number;
    }
  >();

  for (const item of distributorStock) {
    const existing = bySkuMap.get(item.sku);
    if (existing) {
      existing.totalBottles += item.quantityBottles;
      existing.totalCases += item.quantityCases;
      existing.batches += 1;
    } else {
      bySkuMap.set(item.sku, {
        sku: item.sku,
        productName: item.productName,
        warehouse: item.warehouse,
        totalBottles: item.quantityBottles,
        totalCases: item.quantityCases,
        batches: 1,
      });
    }
  }

  const skuGroups = Array.from(bySkuMap.values()).sort((a, b) =>
    a.productName.localeCompare(b.productName),
  );

  const totalCases = skuGroups.reduce((s, g) => s + g.totalCases, 0);
  const lowStockCount = skuGroups.filter(
    (g) => g.totalCases < LOW_STOCK_THRESHOLD_CASES,
  ).length;

  return (
    <div>
      <PageHeader
        title="Stock check"
        description="Distributor on-hand inventory — check availability before committing at an account visit."
      />

      {/* Info callout */}
      <div className="mb-6 rounded-xl border border-[hsl(40_88%_42%/0.2)] bg-[hsl(40_88%_42%/0.06)] p-4">
        <div className="flex items-start gap-3">
          <Package className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(40_88%_42%)]" />
          <p className="text-sm text-foreground">
            Check what's available at your distributor before committing at an account visit.
            Stock is updated with every fulfillment confirmation.
          </p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardContent className="p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              SKUs in stock
            </p>
            <p className="mt-2 font-display text-2xl font-semibold tracking-tight">
              {skuGroups.length}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardContent className="p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Total cases
            </p>
            <p className="mt-2 font-display text-2xl font-semibold tracking-tight">
              {totalCases}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardContent className="p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Low stock SKUs
            </p>
            <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-amber-600 dark:text-amber-400">
              {lowStockCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Product grid */}
      {skuGroups.length === 0 ? (
        <div className="card-elevated flex flex-col items-center gap-3 py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground/20" strokeWidth={1} />
          <p className="text-muted-foreground">No distributor inventory available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {skuGroups.map((group) => {
            const isLow = group.totalCases < LOW_STOCK_THRESHOLD_CASES;
            return (
              <div
                key={group.sku}
                className={[
                  "rounded-2xl border border-border/60 bg-card shadow-soft overflow-hidden",
                  "flex",
                ].join(" ")}
              >
                {/* Left color bar */}
                <div
                  className={[
                    "w-1 shrink-0",
                    isLow
                      ? "bg-amber-500"
                      : "bg-emerald-500",
                  ].join(" ")}
                />

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-base font-semibold leading-tight">
                        {group.productName}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {group.sku}
                      </p>
                    </div>
                    {isLow && (
                      <Badge
                        variant="outline"
                        className="shrink-0 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                      >
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Running low
                      </Badge>
                    )}
                  </div>

                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="font-display text-4xl font-semibold tracking-tight leading-none">
                        {group.totalCases}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        cases · {group.totalBottles.toLocaleString()} bottles
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{group.warehouse}</p>
                      {group.batches > 1 && (
                        <p className="text-xs text-muted-foreground">
                          {group.batches} batch lots
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <StatusBadge
                      status={isLow ? "reserved" : "available"}
                      size="xs"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Why this matters */}
      <Card className="mt-8 rounded-2xl border-border/60 shadow-soft">
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-foreground">Why check stock before a visit?</p>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Committing a placement when inventory is unavailable creates a bad experience for the
            account — and a problem for the fulfillment team. Checking distributor stock before your
            visit means any order you submit can be fulfilled promptly.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Green bar = healthy stock, safe to commit
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Amber bar = low stock, discuss delivery timing with account
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
