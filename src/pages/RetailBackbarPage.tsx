import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useAccounts, useAppData, useRetailerShelfStock } from "@/contexts/AppDataContext";
import { useRetailAccountTradingName } from "@/contexts/AuthContext";
import { RetailPageHeader } from "@/components/retail/RetailPageHeader";
import { RetailSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

function coverStatus(bottles: number, threshold: number): { label: string; color: string } {
  const days = Math.round(bottles / Math.max(threshold / 14, 0.5));
  if (bottles < threshold) return { label: "Critical", color: "text-[hsl(0_68%_44%)]" };
  if (bottles < threshold * 1.5) return { label: "Monitor", color: "text-[hsl(38_90%_40%)]" };
  return { label: "Healthy", color: "text-[hsl(158_56%_32%)]" };
}

export default function RetailBackbarPage() {
  const { data, loading } = useAppData();
  const { accounts } = useAccounts();
  const accountName = useRetailAccountTradingName();
  const { shelf, setShelfBottles } = useRetailerShelfStock();
  const [draft, setDraft] = useState<Record<string, number>>({});

  const acc = useMemo(() => accounts.find((a) => a.tradingName === accountName), [accounts, accountName]);
  const shelfTh = data?.operationalSettings?.retailerStockThresholdBottles ?? 48;
  const products = useMemo(() => (data?.products || []).filter((p) => p.status === "active"), [data?.products]);
  const accShelf = acc && shelf ? shelf[acc.id] ?? {} : {};

  const criticalSku = useMemo(() => {
    for (const p of products) {
      const b = draft[p.sku] ?? accShelf[p.sku] ?? 0;
      if (b < shelfTh) return p.name;
    }
    return null;
  }, [products, draft, accShelf, shelfTh]);

  const save = () => {
    if (!acc) return;
    for (const [sku, bottles] of Object.entries(draft)) {
      setShelfBottles(acc.id, sku, bottles);
    }
    setDraft({});
    toast.success("Counts saved");
  };

  if (loading) return <RetailSkeleton />;

  return (
    <div className="space-y-6 pb-8">
      <RetailPageHeader
        title="Backbar tracker"
        description="Update your weekly bottle counts to keep depletion tracking accurate."
        actions={
          <Button className="h-9 bg-accent text-accent-foreground hover:bg-[hsl(32_78%_48%)]" onClick={save} disabled={!acc || Object.keys(draft).length === 0}>
            Save counts
          </Button>
        }
      />

      {criticalSku ? (
        <div className="flex gap-3 rounded-xl border border-[hsl(38_90%_50%/0.22)] bg-[hsl(38_90%_50%/0.07)] px-4 py-3.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[hsl(30_80%_34%)]" strokeWidth={1.75} />
          <p className="text-[13px]">
            <strong className="text-[hsl(30_80%_28%)]">SKU below reorder threshold:</strong>{" "}
            <span className="text-[hsl(30_70%_35%)]">{criticalSku} — reorder recommended.</span>
          </p>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[14px] border border-border/70 bg-card shadow-[var(--shadow-soft)]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="bg-muted/50 text-[10px] font-semibold uppercase tracking-[0.1em]">SKU</TableHead>
              <TableHead className="bg-muted/50 text-[10px] font-semibold uppercase tracking-[0.1em]">Product</TableHead>
              <TableHead className="bg-muted/50 text-[10px] font-semibold uppercase tracking-[0.1em]">Last count</TableHead>
              <TableHead className="bg-muted/50 text-[10px] font-semibold uppercase tracking-[0.1em]">This week</TableHead>
              <TableHead className="bg-muted/50 text-[10px] font-semibold uppercase tracking-[0.1em]">Cover</TableHead>
              <TableHead className="bg-muted/50 text-[10px] font-semibold uppercase tracking-[0.1em]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => {
              const last = accShelf[p.sku] ?? 0;
              const current = draft[p.sku] ?? last;
              const st = coverStatus(current, shelfTh);
              const coverDays = Math.max(1, Math.round(current / Math.max(shelfTh / 14, 0.5)));
              return (
                <TableRow key={p.sku} className="border-border/40">
                  <TableCell className="font-mono text-[10px] uppercase text-muted-foreground">{p.sku}</TableCell>
                  <TableCell>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground">{p.style ?? p.category}</div>
                  </TableCell>
                  <TableCell className="font-mono text-[13px]">{last} btl</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      className="h-8 w-[72px] font-mono text-center text-[13px] tabular-nums"
                      value={current}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, [p.sku]: Math.max(0, parseInt(e.target.value, 10) || 0) }))
                      }
                    />
                  </TableCell>
                  <TableCell className={cn("font-mono text-[13px] font-semibold", st.color)}>{coverDays}d</TableCell>
                  <TableCell className={cn("text-[11px] font-semibold", st.color)}>{st.label}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button className="bg-accent text-accent-foreground hover:bg-[hsl(32_78%_48%)]" onClick={save} disabled={!acc || Object.keys(draft).length === 0}>
          Save counts
        </Button>
      </div>

      {criticalSku ? (
        <p className="text-center text-[13px] text-muted-foreground">
          <Link to="/retail/new-order" className="font-medium text-accent hover:underline">
            Start a reorder →
          </Link>
        </p>
      ) : null}
    </div>
  );
}
