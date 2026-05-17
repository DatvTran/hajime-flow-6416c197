import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppData, useAccounts } from "@/contexts/AppDataContext";
import { useRetailAccountTradingName } from "@/contexts/AuthContext";
import { useRetailCart } from "@/contexts/RetailCartContext";
import { RetailProductCard } from "@/components/retail/RetailProductCard";
import { RetailPageHeader } from "@/components/retail/RetailPageHeader";
import { RetailSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { Search } from "lucide-react";

const CATEGORY_FILTERS = ["All SKUs", "Junmai Daiginjo", "Junmai", "Genshu", "Limited"] as const;

function matchesCategory(name: string, filter: string): boolean {
  if (filter === "All SKUs") return true;
  const n = name.toLowerCase();
  if (filter === "Junmai Daiginjo") return n.includes("daiginjo");
  if (filter === "Junmai") return n.includes("junmai") && !n.includes("daiginjo");
  if (filter === "Genshu") return n.includes("genshu");
  if (filter === "Limited") return n.includes("limited") || n.includes("reserve");
  return true;
}

export default function RetailCatalogPage() {
  const { data, loading } = useAppData();
  const { accounts } = useAccounts();
  const cart = useRetailCart();
  const accountName = useRetailAccountTradingName();
  const [category, setCategory] = useState<(typeof CATEGORY_FILTERS)[number]>("All SKUs");
  const [q, setQ] = useState("");

  const accountRecord = useMemo(() => accounts.find((a) => a.tradingName === accountName), [accounts, accountName]);
  const shelfForAccount = accountRecord ? data.retailerShelfStock?.[accountRecord.id] : undefined;
  const shelfThreshold = data.operationalSettings?.retailerStockThresholdBottles ?? 48;

  const catalog = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return [...data.products]
      .filter((p) => p.status === "active")
      .filter((p) => matchesCategory(p.name + " " + (p.style ?? ""), category))
      .filter((p) => !needle || p.name.toLowerCase().includes(needle) || p.sku.toLowerCase().includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.products, category, q]);

  if (loading) return <RetailSkeleton />;

  return (
    <div className="space-y-6 pb-8">
      <RetailPageHeader
        title="Catalog"
        description="All available Hajime SKUs — prices reflect your partner rate."
        actions={
          <Button className="h-9 bg-accent text-accent-foreground hover:bg-[hsl(32_78%_48%)]" asChild>
            <Link to="/retail/new-order">+ New order</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-1.5">
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setCategory(f)}
            className={
              category === f
                ? "rounded-full border border-primary bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground"
                : "rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            }
          >
            {f}
          </button>
        ))}
        <div className="relative ml-auto w-full max-w-xs sm:w-auto">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-[15px] -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search SKUs…"
            className="h-9 pl-9 text-[13px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {catalog.map((p) => (
          <RetailProductCard
            key={p.sku}
            presentation="catalog"
            product={p}
            inventory={data.inventory}
            inCartCases={cart.casesBySku[p.sku] ?? 0}
            shelfBottles={shelfForAccount?.[p.sku]}
            shelfThresholdBottles={shelfThreshold}
            onAddToCart={(cases) => {
              const min = p.minOrderCases ?? 1;
              cart.setCasesForSku(p.sku, cases, min);
              toast.success("Added to cart", { description: `${p.name} · ${cases} case${cases !== 1 ? "s" : ""}` });
            }}
          />
        ))}
      </div>
      {catalog.length === 0 ? <p className="text-[13px] text-muted-foreground">No SKUs match your filters.</p> : null}
    </div>
  );
}
