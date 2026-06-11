import { useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import { useAppData, useAccounts } from "@/contexts/AppDataContext";
import { useRetailAccountTradingName } from "@/contexts/AuthContext";
import { RetailPageHeader } from "@/components/retail/RetailPageHeader";
import { RetailFilterPills } from "@/components/retail/RetailFilterPills";
import { RetailSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { orderLineEntries } from "@/lib/order-lines";
import { computeSalesByMonth } from "@/lib/hajime-metrics";
import { cn } from "@/lib/utils";

type Window = "30" | "60" | "90";

function formatMoney(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function RetailSellThroughPage() {
  const { data, loading } = useAppData();
  const { accounts } = useAccounts();
  const accountName = useRetailAccountTradingName();
  const [window, setWindow] = useState<Window>("30");

  const windowDays = parseInt(window, 10);
  const accountRecord = useMemo(() => accounts.find((a) => a.tradingName === accountName), [accounts, accountName]);
  const shelfForAccount = accountRecord ? data.retailerShelfStock?.[accountRecord.id] : undefined;
  const shelfTh = data.operationalSettings?.retailerStockThresholdBottles ?? 48;

  const myOrders = useMemo(
    () => data.salesOrders.filter((o) => o.account === accountName && o.status !== "cancelled"),
    [data.salesOrders, accountName],
  );

  const { spend, bottles, skuSet, priorSpend } = useMemo(() => {
    const cutoff = Date.now() - windowDays * 86400000;
    const priorStart = cutoff - windowDays * 86400000;
    let spend = 0;
    let priorSpend = 0;
    let bottles = 0;
    const skuSet = new Set<string>();
    for (const o of myOrders) {
      const t = Date.parse(o.orderDate);
      if (t >= cutoff) {
        spend += o.price;
        for (const line of orderLineEntries(o)) {
          bottles += line.quantityBottles;
          skuSet.add(line.sku);
        }
      } else if (t >= priorStart && t < cutoff) {
        priorSpend += o.price;
      }
    }
    return { spend, bottles, skuSet, priorSpend };
  }, [myOrders, windowDays]);

  const deltaPct = priorSpend > 0 ? Math.round(((spend - priorSpend) / priorSpend) * 100) : null;
  const casesSold = Math.round((bottles / 12) * 10) / 10;
  const avgDaily = windowDays > 0 ? Math.round((bottles / windowDays) * 10) / 10 : 0;

  const skuRows = useMemo(() => {
    return data.products
      .filter((p) => p.status === "active")
      .map((p) => {
        const shelf = shelfForAccount?.[p.sku] ?? 0;
        const rate = Math.max(0.3, shelf / Math.max(windowDays, 1));
        const cover = Math.max(1, Math.round(shelf / Math.max(rate, 0.5)));
        const cases30 = Math.round(((rate * windowDays) / 12) * 10) / 10;
        const rev = Math.round(cases30 * (p.wholesaleCasePrice ?? 0));
        const color =
          shelf < shelfTh ? "text-[hsl(0_68%_44%)]" : shelf < shelfTh * 1.5 ? "text-[hsl(38_90%_40%)]" : "text-[hsl(158_56%_32%)]";
        return { product: p, rate, cases30, rev, cover, color };
      })
      .sort((a, b) => a.cover - b.cover);
  }, [data.products, shelfForAccount, windowDays, shelfTh]);

  const monthly = useMemo(() => computeSalesByMonth(myOrders, 6), [myOrders]);
  const maxBar = Math.max(...monthly.map((m) => m.revenue), 1);

  if (loading) return <RetailSkeleton />;

  return (
    <div className="space-y-6 pb-8">
      <RetailPageHeader
        title="Sell-through reports"
        description="Backbar depletion data by SKU — helps forecast reorder timing."
        actions={
          <>
            <RetailFilterPills
              className="mb-0"
              options={[
                { id: "30", label: "30 days" },
                { id: "60", label: "60 days" },
                { id: "90", label: "90 days" },
              ]}
              value={window}
              onChange={setWindow}
            />
            <Button variant="outline" size="sm" className="h-[30px] text-xs">
              Export
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <ReportKpi label="Total cases sold" value={String(casesSold)} sub={`${bottles} bottles across ${skuSet.size} SKUs`} delta={deltaPct} />
        <ReportKpi label="Avg daily depletion" value={String(avgDaily)} sub="bottles per day" />
        <ReportKpi label={`${window}-day spend`} value={`$${formatMoney(spend)}`} sub="All SKUs combined" delta={deltaPct} />
      </section>

      <div className="overflow-hidden rounded-[14px] border border-border/70 bg-card shadow-[var(--shadow-soft)]">
        <div className="border-b border-border/50 px-5 py-4">
          <div className="text-sm font-semibold">SKU sell-through</div>
          <p className="mt-0.5 text-xs text-muted-foreground">Last {window} days · backbar depletion</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {["SKU", "Product", "Bottles / day", `Cases / ${window}d`, `Revenue / ${window}d`, "Reorder in"].map((h) => (
                <TableHead key={h} className="bg-muted/50 text-[10px] font-semibold uppercase tracking-[0.1em]">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {skuRows.map((r) => (
              <TableRow key={r.product.sku} className="border-border/40">
                <TableCell className="font-mono text-[11px]">{r.product.sku}</TableCell>
                <TableCell className="font-medium">{r.product.name}</TableCell>
                <TableCell className="font-mono text-[13px]">{r.rate.toFixed(1)}</TableCell>
                <TableCell className="font-mono text-[13px]">{r.cases30}</TableCell>
                <TableCell className="font-mono text-[13px]">${formatMoney(r.rev)}</TableCell>
                <TableCell className={cn("font-mono text-[13px] font-semibold", r.color)}>{r.cover}d</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-[14px] border border-border/70 bg-card p-5 shadow-[var(--shadow-soft)]">
        <div className="text-sm font-semibold">Monthly cases ordered</div>
        <p className="mt-0.5 text-xs text-muted-foreground">Last 6 months</p>
        <div className="mt-5 flex h-[120px] items-end gap-2.5">
          {monthly.map((m) => {
            const cases = Math.round(m.revenue / 400) || 1;
            const h = Math.max(12, (m.revenue / maxBar) * 90);
            return (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="font-mono text-[10px] text-foreground">{cases}</span>
                <div
                  className="w-full rounded-t bg-gradient-to-t from-[hsl(40_88%_42%)] to-[hsl(40_88%_52%)]"
                  style={{ height: h }}
                />
                <span className="font-mono text-[10px] text-muted-foreground">{m.month}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ReportKpi({
  label,
  value,
  sub,
  delta,
}: {
  label: string;
  value: string;
  sub: string;
  delta?: number | null;
}) {
  return (
    <div className="rounded-[14px] border border-border/70 bg-card p-[18px] shadow-[var(--shadow-soft)]">
      <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-[30px] font-semibold tracking-[-0.02em] tabular-nums">{value}</div>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      {delta != null ? (
        <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[hsl(158_56%_32%)]">
          <TrendingUp className="size-3" />
          {delta >= 0 ? "+" : ""}
          {delta}% vs prior period
        </p>
      ) : null}
    </div>
  );
}
