import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { useAppData, useAccounts, useSalesOrders } from "@/contexts/AppDataContext";
import { RetailSkeleton } from "@/components/skeletons";
import { useRetailAccountTradingName } from "@/contexts/AuthContext";
import { useRetailCart } from "@/contexts/RetailCartContext";
import { RetailPageHeader } from "@/components/retail/RetailPageHeader";
import { RetailProductCard } from "@/components/retail/RetailProductCard";
import { RetailOrderCartPanel } from "@/components/retail/RetailOrderCartPanel";
import { RetailBottleThumb } from "@/components/retail/RetailBottleThumb";
import { retailOrderDisplayId } from "@/lib/order-lines";
import { buildRetailCheckoutOrder, addDaysISO, marketForRetailAccount } from "@/lib/sales-order-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

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

type ViewMode = "cards" | "list";

export default function RetailNewOrderPage() {
  const { data, loading } = useAppData();
  const { accounts } = useAccounts();
  const { salesOrders, addSalesOrder } = useSalesOrders();
  const accountName = useRetailAccountTradingName();
  const cart = useRetailCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deliveryDate, setDeliveryDate] = useState(() => addDaysISO(10));
  const [poRef, setPoRef] = useState("");
  const [notes, setNotes] = useState("");
  const [successId, setSuccessId] = useState<string | null>(null);
  const [category, setCategory] = useState<(typeof CATEGORY_FILTERS)[number]>("All SKUs");
  const [q, setQ] = useState("");
  const [view, setView] = useState<ViewMode>("cards");

  const accountRecord = useMemo(() => accounts.find((a) => a.tradingName === accountName), [accounts, accountName]);
  const shelfForAccount = accountRecord ? data.retailerShelfStock?.[accountRecord.id] : undefined;
  const shelfThreshold = data.operationalSettings?.retailerStockThresholdBottles ?? 48;
  const { products } = data;

  useEffect(() => {
    const sku = searchParams.get("sku");
    const casesRaw = searchParams.get("cases");
    if (!sku || !casesRaw) return;
    const cases = parseInt(casesRaw, 10);
    const p = products.find((x) => x.sku === sku);
    if (p && !Number.isNaN(cases) && cases > 0) {
      const min = p.minOrderCases ?? 1;
      cart.setCasesForSku(sku, Math.max(min, cases), min);
      toast.success("Added to cart", { description: `${p.name} · ${cases} case${cases !== 1 ? "s" : ""}` });
    }
    const next = new URLSearchParams(searchParams);
    next.delete("sku");
    next.delete("cases");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, products, cart]);

  const catalog = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return [...products]
      .filter((p) => p.status === "active")
      .filter((p) => matchesCategory(`${p.name} ${p.style ?? ""}`, category))
      .filter((p) => !needle || p.name.toLowerCase().includes(needle) || p.sku.toLowerCase().includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, category, q]);

  const cartDetail = useMemo(() => {
    let subtotal = 0;
    const rows: { sku: string; name: string; cases: number; line: number }[] = [];
    for (const { sku, cases } of cart.lines) {
      const p = products.find((x) => x.sku === sku);
      if (!p) continue;
      const casePrice = p.wholesaleCasePrice ?? 0;
      const line = Math.round(cases * casePrice);
      subtotal += line;
      rows.push({ sku, name: p.name, cases, line });
    }
    return { rows, subtotal };
  }, [cart.lines, products]);

  const submit = useCallback(() => {
    if (cart.lines.length === 0) {
      toast.error("Add at least one product");
      return;
    }
    try {
      const lines = cart.lines
        .map((l) => {
          const product = products.find((p) => p.sku === l.sku);
          return product ? { sku: l.sku, cases: l.cases, product } : null;
        })
        .filter(Boolean) as { sku: string; cases: number; product: (typeof products)[0] }[];

      const order = buildRetailCheckoutOrder({
        existingOrders: salesOrders,
        accountTradingName: accountName,
        market: marketForRetailAccount(accountName, accounts),
        salesRep: accountRecord?.salesOwner ?? "Marcus Chen",
        lines,
        requestedDelivery: deliveryDate,
        customerPoReference: poRef,
        orderNotes: notes,
        deliveryAddress: accountRecord ? `${accountRecord.tradingName} — ${accountRecord.city}` : undefined,
      });
      addSalesOrder(order);
      cart.clear();
      setSuccessId(order.id);
      toast.success("Request sent");
    } catch (e) {
      toast.error(String(e));
    }
  }, [cart, products, salesOrders, accountName, accounts, accountRecord, deliveryDate, poRef, notes, addSalesOrder]);

  if (successId) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <CheckCircle2 className="mx-auto size-14 text-[hsl(158_56%_36%)]" aria-hidden />
        <h1 className="mt-6 font-display text-[26px] font-semibold tracking-[-0.02em]">Request received</h1>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Order <span className="font-mono font-medium">{retailOrderDisplayId(successId)}</span> is pending your field
          rep&apos;s approval.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Button variant="outline" className="h-9" asChild>
            <Link to="/retail/orders">View my orders</Link>
          </Button>
          <Button className="h-9 bg-accent text-accent-foreground hover:bg-[hsl(32_78%_48%)]" asChild>
            <Link to="/retail/new-order">Place another order</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) return <RetailSkeleton />;

  return (
    <div className="space-y-6 pb-28 lg:pb-10">
      <RetailPageHeader
        title="New order"
        description="Select quantities — your rep will confirm allocation before HQ approves."
      />

      {/* Filters — same kit as Catalog */}
      <div className="flex flex-wrap items-center gap-1.5">
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setCategory(f)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors touch-manipulation",
              category === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
        <div className="ml-auto flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-[15px] -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search SKUs…"
              className="h-9 pl-9 text-[13px]"
            />
          </div>
          <div className="flex rounded-lg border border-border p-0.5">
            <button
              type="button"
              onClick={() => setView("cards")}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium",
                view === "cards" ? "bg-muted text-foreground" : "text-muted-foreground",
              )}
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium",
                view === "list" ? "bg-muted text-foreground" : "text-muted-foreground",
              )}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* order-split — retail-store-app */}
      <div className="grid gap-5 lg:grid-cols-[1fr_300px] lg:items-start">
        <div className="min-w-0">
          {view === "cards" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          ) : (
            <div className="overflow-hidden rounded-[14px] border border-border/70 bg-card shadow-[var(--shadow-soft)]">
              <div className="border-b border-border/50 px-5 py-4">
                <div className="text-sm font-semibold">Choose products</div>
                <p className="mt-0.5 text-xs text-muted-foreground">Case sizes and partner pricing</p>
              </div>
              <div className="px-5">
                {catalog.map((p) => {
                  const min = p.minOrderCases ?? 1;
                  const cases = cart.casesBySku[p.sku] ?? 0;
                  const casePrice = p.wholesaleCasePrice ?? 0;
                  const perBottle = p.caseSize > 0 ? casePrice / p.caseSize : 0;
                  return (
                    <div
                      key={p.sku}
                      className="sku-row flex items-center gap-3.5 border-b border-border/50 py-3.5 last:border-0"
                    >
                      <RetailBottleThumb sku={p.sku} size="row" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium">{p.name}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {p.sku} · ${perBottle.toFixed(2)}/bottle
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="qty-btn flex size-7 items-center justify-center rounded-md border border-border bg-background text-sm hover:bg-muted"
                          onClick={() => cart.bumpCases(p.sku, -1, min)}
                          aria-label="Decrease"
                        >
                          −
                        </button>
                        <span className="qty-val min-w-[26px] text-center font-mono text-[13px] font-medium tabular-nums">
                          {cases}
                        </span>
                        <button
                          type="button"
                          className="qty-btn flex size-7 items-center justify-center rounded-md border border-border bg-background text-sm hover:bg-muted"
                          onClick={() => cart.bumpCases(p.sku, 1, min)}
                          aria-label="Increase"
                        >
                          +
                        </button>
                      </div>
                      <div className="w-[60px] text-right font-mono text-xs text-muted-foreground">
                        {cases > 0 ? `$${(cases * casePrice).toLocaleString()}` : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {catalog.length === 0 ? (
            <p className="mt-4 text-[13px] text-muted-foreground">No SKUs match your filters.</p>
          ) : null}
        </div>

        <RetailOrderCartPanel
          lines={cartDetail.rows}
          subtotal={cartDetail.subtotal}
          notes={notes}
          onNotesChange={setNotes}
          deliveryDate={deliveryDate}
          onDeliveryDateChange={setDeliveryDate}
          poRef={poRef}
          onPoRefChange={setPoRef}
          onRemoveSku={cart.removeSku}
          onSubmit={submit}
        />
      </div>

      {/* Mobile cart bar */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-card/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden",
          cart.lines.length === 0 && "hidden",
        )}
      >
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">
              {cart.totalCases} case{cart.totalCases !== 1 ? "s" : ""} in cart
            </p>
            <p className="font-display text-lg font-semibold tabular-nums">${cartDetail.subtotal.toLocaleString()}</p>
          </div>
          <Button
            type="button"
            className="h-11 bg-accent px-5 text-accent-foreground hover:bg-[hsl(32_78%_48%)]"
            onClick={() => document.getElementById("retail-cart")?.scrollIntoView({ behavior: "smooth" })}
          >
            Review order
          </Button>
        </div>
      </div>
    </div>
  );
}
