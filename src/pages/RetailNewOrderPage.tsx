import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAppData, useAccounts, useSalesOrders } from "@/contexts/AppDataContext";
import { useRetailAccountTradingName } from "@/contexts/AuthContext";
import { useRetailCart } from "@/contexts/RetailCartContext";
import { RetailProductCard } from "@/components/retail/RetailProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildRetailCheckoutOrder, addDaysISO, todayISO, marketForRetailAccount } from "@/lib/sales-order-utils";
import { retailOrderDisplayId } from "@/lib/order-lines";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronRight, Store, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";

export default function RetailNewOrderPage() {
  const { data } = useAppData();
  const { accounts } = useAccounts();
  const { salesOrders, addSalesOrder } = useSalesOrders();
  const accountName = useRetailAccountTradingName();
  const cart = useRetailCart();
  const [searchParams, setSearchParams] = useSearchParams();

  const [deliveryDate, setDeliveryDate] = useState(() => addDaysISO(10));
  const [poRef, setPoRef] = useState("");
  const [notes, setNotes] = useState("");
  const [successId, setSuccessId] = useState<string | null>(null);

  const accountRecord = useMemo(() => accounts.find((a) => a.tradingName === accountName), [accounts, accountName]);

  const shelfForAccount = accountRecord ? data.retailerShelfStock?.[accountRecord.id] : undefined;
  const shelfThreshold = data.operationalSettings?.retailerStockThresholdBottles ?? 48;

  useEffect(() => {
    const sku = searchParams.get("sku");
    const casesRaw = searchParams.get("cases");
    if (!sku || !casesRaw) return;
    const cases = parseInt(casesRaw, 10);
    const p = data.products.find((x) => x.sku === sku);
    if (p && !Number.isNaN(cases) && cases > 0) {
      const min = p.minOrderCases ?? 1;
      cart.setCasesForSku(sku, Math.max(min, cases), min);
    }
    const next = new URLSearchParams(searchParams);
    next.delete("sku");
    next.delete("cases");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, data.products, cart]);

  const catalog = useMemo(
    () => [...data.products].sort((a, b) => (a.status === "active" ? 0 : 1) - (b.status === "active" ? 0 : 1)),
    [data.products],
  );

  // Destructured so useCallback dep array is precise (avoids whole-data-object dep)
  const { products } = data;

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
  }, [
    cart,
    products,
    salesOrders,
    accountName,
    accounts,
    accountRecord,
    deliveryDate,
    poRef,
    notes,
    addSalesOrder,
  ]);

  if (successId) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" aria-hidden />
        <h1 className="mt-6 font-display text-2xl font-semibold">Request received</h1>
        <p className="mt-2 text-muted-foreground">
          Order {retailOrderDisplayId(successId)} is <strong>pending your field rep&apos;s approval</strong>. After they approve and your card is charged, your wholesaler will arrange delivery and shipping.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          You&apos;ll see status updates under <strong>My orders</strong> as the request moves through rep approval → payment → fulfillment.
        </p>
        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild variant="secondary">
            <Link to="/retail/orders">View my orders</Link>
          </Button>
          <Button asChild>
            <Link to="/retail/new-order">Place another order</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">New order</span>
      </nav>

      <div className="rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-500/5 to-transparent p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1 font-normal">
            <Store className="h-3 w-3" aria-hidden />
            Retail store
          </Badge>
        </div>
        <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">Place order</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Submit a request from the catalog (retail stores don&apos;t pick manufacturer vs wholesaler). Your assigned sales rep approves the
          order, then payment is collected; after that, the wholesaler handles delivery and shipping. Brand operators can monitor the full
          pipeline in Orders.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <section>
          <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Catalog & cases</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {catalog.map((p) => (
              <RetailProductCard
                key={p.sku}
                product={p}
                inventory={data.inventory}
                inCartCases={cart.casesBySku[p.sku] ?? 0}
                disabled={p.status !== "active"}
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
        </section>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div id="retail-cart" className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Cart summary</h2>
            {cartDetail.rows.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Your cart is empty.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {cartDetail.rows.map((r) => (
                  <li key={r.sku} className="flex gap-3 border-b border-border/50 pb-3 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.cases} case{r.cases !== 1 ? "s" : ""} · est. ${r.line.toLocaleString()}
                      </p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="shrink-0 touch-manipulation" onClick={() => cart.removeSku(r.sku)} aria-label="Remove">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {cartDetail.rows.length > 0 ? (
              <>
                <div className="mt-4 flex justify-between border-t border-border pt-3 text-sm">
                  <span className="text-muted-foreground">Estimated subtotal</span>
                  <span className="font-semibold tabular-nums">${cartDetail.subtotal.toLocaleString()} CAD</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Shipping route and final invoice from your distributor — subject to approval.</p>
              </>
            ) : null}

            <div className="mt-6 space-y-4 border-t border-border pt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Delivery details</h3>
              <div className="space-y-2">
                <Label htmlFor="req-del">Preferred delivery date</Label>
                <Input
                  id="req-del"
                  type="date"
                  className="touch-manipulation"
                  min={todayISO()}
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="po-ref">PO / reference (optional)</Label>
                <Input id="po-ref" value={poRef} onChange={(e) => setPoRef(e.target.value)} placeholder="Your internal PO" className="touch-manipulation" />
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Label htmlFor="ord-notes">Order notes</Label>
              <Textarea
                id="ord-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special instructions, receiving hours…"
                className="touch-manipulation resize-none"
              />
            </div>

            <Button
              type="button"
              size="lg"
              className="mt-6 h-14 w-full touch-manipulation text-base font-semibold"
              disabled={cart.lines.length === 0}
              onClick={submit}
            >
              Submit order request
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Rep approval → card charge → wholesaler ships. Not final until your rep approves and payment succeeds.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile sticky cart */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden",
          cart.lines.length === 0 && "hidden",
        )}
      >
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Cart</p>
            <p className="font-display font-semibold tabular-nums">${cartDetail.subtotal.toLocaleString()}</p>
          </div>
          <Button type="button" className="h-12 min-w-[160px] touch-manipulation" onClick={() => document.getElementById("retail-cart")?.scrollIntoView({ behavior: "smooth" })}>
            Review &amp; send
          </Button>
        </div>
      </div>
    </div>
  );
}
