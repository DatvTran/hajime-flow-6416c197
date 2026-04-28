import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useAppData, useAccounts } from "@/contexts/AppDataContext";
import { useAuth, useRetailAccountTradingName } from "@/contexts/AuthContext";
import { useRetailCart } from "@/contexts/RetailCartContext";
import { orderLineEntries, retailOrderDisplayId } from "@/lib/order-lines";
import { retailBucketFromStatus, retailStatusLabel } from "@/components/retail/RetailStatusChip";
import { RetailProductCard } from "@/components/retail/RetailProductCard";
import { toast } from "@/components/ui/sonner";
import type { SalesOrder } from "@/data/mockData";
import { cn } from "@/lib/utils";

const STEP_LABELS = ["Placed", "Approved", "Packed", "Shipped", "Delivered"] as const;

function fulfillmentStepIndex(status: string): number {
  switch (status) {
    case "draft":
      return 0;
    case "confirmed":
      return 1;
    case "packed":
      return 2;
    case "shipped":
      return 3;
    case "delivered":
      return 4;
    default:
      return 0;
  }
}

function stepRowState(status: string, stepIndex: number): "done" | "current" | "upcoming" {
  if (status === "cancelled") return stepIndex === 0 ? "current" : "upcoming";
  if (status === "delivered") return "done";
  const cur = fulfillmentStepIndex(status);
  if (stepIndex < cur) return "done";
  if (stepIndex === cur) return "current";
  return "upcoming";
}

function formatMoney(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function greetingName(displayName: string): string {
  const first = displayName.trim().split(/\s+/)[0];
  return first || "there";
}

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function primaryLineSummary(o: SalesOrder): string {
  const lines = orderLineEntries(o);
  return lines.map((l) => `${l.quantityBottles}× ${l.sku}`).join(", ");
}

export default function RetailHomePage() {
  const { data } = useAppData();

  const { accounts } = useAccounts();
  const cart = useRetailCart();
  const { user } = useAuth();
  const accountName = useRetailAccountTradingName();

  const accountRecord = useMemo(() => accounts.find((a) => a.tradingName === accountName), [accounts, accountName]);
  const shelfForAccount = accountRecord ? data.retailerShelfStock?.[accountRecord.id] : undefined;
  const shelfThreshold = data.operationalSettings?.retailerStockThresholdBottles ?? 48;

  const catalog = useMemo(
    () =>
      [...data.products]
        .filter((p) => p.status === "active")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [data.products],
  );

  const myOrders = useMemo(
    () =>
      data.salesOrders
        .filter((o) => o.account === accountName)
        .sort((a, b) => Date.parse(b.orderDate) - Date.parse(a.orderDate)),
    [data.salesOrders, accountName],
  );

  const pendingPipeline = useMemo(
    () => myOrders.filter((o) => ["draft", "confirmed", "packed", "shipped"].includes(o.status)).length,
    [myOrders],
  );

  const lastDeliveryDate = useMemo(() => {
    const done = myOrders.filter((o) => o.status === "delivered");
    if (done.length === 0) return null;
    const sorted = [...done].sort(
      (a, b) => Date.parse(b.actualDeliveryDate ?? b.orderDate) - Date.parse(a.actualDeliveryDate ?? a.orderDate),
    );
    return sorted[0].actualDeliveryDate ?? sorted[0].requestedDelivery;
  }, [myOrders]);

  const spend30d = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000;
    let sum = 0;
    let casesApprox = 0;
    const skus = new Set<string>();
    for (const o of myOrders) {
      if (Date.parse(o.orderDate) < cutoff) continue;
      sum += o.price;
      for (const line of orderLineEntries(o)) {
        casesApprox += line.quantityBottles / 12;
        skus.add(line.sku);
      }
    }
    return { sum, casesApprox: Math.round(casesApprox), skuCount: skus.size };
  }, [myOrders]);

  const activeSkuCount = data.products.filter((p) => p.status === "active").length;

  const trackerOrder = useMemo(() => {
    const pipe = myOrders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
    return pipe[0] ?? null;
  }, [myOrders]);

  const trackerProgressPct = useMemo(() => {
    if (!trackerOrder) return 0;
    if (trackerOrder.status === "delivered") return 100;
    const cur = fulfillmentStepIndex(trackerOrder.status);
    return Math.min(100, Math.round(((cur + 0.5) / STEP_LABELS.length) * 100));
  }, [trackerOrder]);

  const recent = myOrders.slice(0, 4);

  const desc = useMemo(() => {
    const parts: string[] = [];
    if (lastDeliveryDate) parts.push(`Your last delivery recorded on ${lastDeliveryDate}.`);
    else parts.push("Welcome — place your first order when you’re ready.");
    if (activeSkuCount > 0) parts.push(`${activeSkuCount} SKUs available to order.`);
    return parts.join(" ");
  }, [lastDeliveryDate, activeSkuCount]);

  return (
    <div className="space-y-7 md:space-y-8">
      <div>
        <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.02em]">
          {timeGreeting()}, {greetingName(user?.displayName ?? "there")}.
        </h1>
        <p className="mt-1.5 max-w-[56ch] text-sm leading-relaxed text-muted-foreground">{desc}</p>
        <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">One surface · three beats</span> — track when an order is moving,
          reorder from your last basket, browse curated SKUs when you&apos;re expanding the backbar.
        </p>
        {myOrders.length > 0 ? (
          <div className="mt-3">
            <Link
              to="/retail/reorder"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground no-underline transition-colors hover:bg-muted/60"
            >
              Reorder last basket
            </Link>
          </div>
        ) : null}
      </div>

      {/* Live order tracker — journey: “in motion” before browse */}
      {trackerOrder ? (
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[0_1px_2px_hsl(24_10%_10%/0.04),0_4px_12px_hsl(24_10%_10%/0.03)] sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="font-mono text-xs text-muted-foreground">
                {retailOrderDisplayId(trackerOrder.id)} · Placed {trackerOrder.orderDate}
              </div>
              <h3 className="mt-0.5 font-display text-xl font-medium tracking-[-0.01em] text-foreground">
                {primaryLineSummary(trackerOrder)}
              </h3>
              <div className="mt-1 text-[13px] text-muted-foreground">
                Requested delivery{" "}
                <strong className="font-medium text-foreground">{trackerOrder.requestedDelivery}</strong>
              </div>
            </div>
            <TrackerPill status={trackerOrder.status} />
          </div>

          <div className="relative mt-5">
            <div className="pointer-events-none absolute left-0 right-0 top-[13px] z-0 h-0.5 bg-border" />
            <div
              className="pointer-events-none absolute left-0 top-[13px] z-0 h-0.5 bg-emerald-600 transition-[width] duration-300"
              style={{ width: `${trackerProgressPct}%` }}
            />
            <div className="relative z-[1] flex items-start gap-0">
              {STEP_LABELS.map((label, i) => {
                const row = stepRowState(trackerOrder.status, i);
                return (
                  <div key={label} className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
                    <div
                      className={cn(
                        "flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-card text-[11px] font-medium",
                        row === "done" && "bg-emerald-600 text-white",
                        row === "current" && "bg-accent text-accent-foreground shadow-[0_0_0_4px_hsl(var(--accent)/0.18)]",
                        row === "upcoming" && "bg-muted text-muted-foreground",
                      )}
                    >
                      {row === "done" ? "✓" : row === "current" ? "●" : "○"}
                    </div>
                    <span
                      className={cn(
                        "text-[11px] font-medium",
                        row === "upcoming" ? "text-muted-foreground" : "text-foreground",
                      )}
                    >
                      {label}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">{row === "upcoming" ? "—" : i === 0 ? trackerOrder.orderDate : "—"}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-4 border-t border-border/60 pt-5 text-[13px] sm:gap-6">
            <div>
              <span className="text-muted-foreground">Total </span>
              <strong className="ml-1 font-mono font-medium tabular-nums text-foreground">${formatMoney(trackerOrder.price)}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Status </span>
              <strong className="ml-1 font-medium text-foreground">{retailStatusLabel(trackerOrder.status)}</strong>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-5 py-8 text-center text-sm text-muted-foreground">
          No orders in transit —{" "}
          <a href="#retail-catalog" className="font-medium text-accent underline-offset-4 hover:underline">
            browse the catalog
          </a>{" "}
          below.
        </div>
      )}

      {/* KPI snapshot — kit: rkpis */}
      <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5 rounded-[14px] border border-border/60 bg-card p-[18px] shadow-[0_1px_2px_hsl(24_10%_10%/0.04)]">
          <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Open orders</span>
          <span className="font-display text-2xl font-semibold tabular-nums tracking-[-0.02em] text-foreground">{pendingPipeline}</span>
          <span className="text-xs text-muted-foreground">
            {trackerOrder?.requestedDelivery ? `Next ETA ${trackerOrder.requestedDelivery}` : "No open pipeline"}
          </span>
        </div>
        <div className="flex flex-col gap-1.5 rounded-[14px] border border-border/60 bg-card p-[18px] shadow-[0_1px_2px_hsl(24_10%_10%/0.04)]">
          <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Last 30 days</span>
          <span className="font-display text-2xl font-semibold tabular-nums tracking-[-0.02em] text-foreground">
            ${formatMoney(spend30d.sum)}
          </span>
          <span className="text-xs text-muted-foreground">
            {spend30d.casesApprox > 0 ? `${spend30d.casesApprox} cases · ` : ""}
            {spend30d.skuCount} SKUs
          </span>
        </div>
        <div className="flex flex-col gap-1.5 rounded-[14px] border border-border/60 bg-card p-[18px] shadow-[0_1px_2px_hsl(24_10%_10%/0.04)]">
          <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">On backbar</span>
          <span className="font-display text-2xl font-semibold tabular-nums tracking-[-0.02em] text-foreground">{activeSkuCount} SKUs</span>
          <span className="text-xs text-muted-foreground">Depletion tracking on</span>
        </div>
      </section>

      {/* Catalog: order from product images (same cards as New order) — primary dashboard action */}
      <section
        id="retail-catalog"
        className="rounded-2xl border border-border/60 bg-gradient-to-b from-muted/30 to-transparent p-4 sm:p-6"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-[-0.01em] text-foreground">Order from catalog</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Add cases below — your cart syncs everywhere. When ready, use <strong>Review →</strong> in the header bar or{" "}
              <Link to="/retail/new-order#retail-cart" className="font-medium text-accent underline-offset-4 hover:underline">
                New order
              </Link>{" "}
              for delivery details and submit.
            </p>
          </div>
          {cart.totalCases > 0 ? (
            <Link
              to="/retail/new-order#retail-cart"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground no-underline transition-colors hover:bg-[hsl(32_78%_48%)]"
            >
              Review cart ({cart.totalCases} case{cart.totalCases !== 1 ? "s" : ""})
            </Link>
          ) : null}
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {catalog.map((p) => (
            <RetailProductCard
              key={p.sku}
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
        {catalog.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No active SKUs available — contact your rep.</p>
        ) : null}
      </section>

      {/* Recent orders */}
      <section>
        <h2 className="font-display text-lg font-medium tracking-[-0.01em] text-foreground">Your recent orders</h2>
        <p className="mt-1 text-xs text-muted-foreground">Tap any order to open its detail</p>
        <div className="mt-4 overflow-hidden rounded-[14px] border border-border/60 bg-card">
          {recent.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            recent.map((o) => (
              <Link
                key={o.id}
                to={`/retail/orders/${encodeURIComponent(o.id)}`}
                className="grid grid-cols-1 gap-2 border-b border-border/50 px-4 py-3.5 text-sm no-underline transition-colors last:border-b-0 hover:bg-muted/40 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-center sm:gap-4"
              >
                <div className="min-w-0">
                  <div className="font-mono text-xs font-medium text-foreground">{retailOrderDisplayId(o.id)}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">Placed {o.orderDate}</div>
                </div>
                <div className="text-[13px] text-foreground sm:truncate">{primaryLineSummary(o)}</div>
                <div className="font-mono text-sm font-medium tabular-nums text-foreground">${formatMoney(o.price)}</div>
                <OrderRowPill status={o.status} />
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function TrackerPill({ status }: { status: string }) {
  const bucket = retailBucketFromStatus(status);
  const cls =
    bucket === "delivered"
      ? "border-emerald-600/20 bg-emerald-600/10 text-emerald-800 dark:text-emerald-100"
      : bucket === "in_transit"
        ? "border-sky-500/20 bg-sky-500/10 text-sky-800 dark:text-sky-100"
        : "border-amber-500/30 bg-amber-500/12 text-amber-900 dark:text-amber-100";
  const dot =
    bucket === "delivered"
      ? "bg-emerald-600"
      : bucket === "in_transit"
        ? "bg-sky-500"
        : "bg-amber-500";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize",
        cls,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {retailStatusLabel(status)}
    </span>
  );
}

function OrderRowPill({ status }: { status: string }) {
  const bucket = retailBucketFromStatus(status);
  const cls =
    bucket === "delivered"
      ? "border-emerald-600/20 bg-emerald-600/8 text-emerald-800 dark:text-emerald-100"
      : bucket === "in_transit"
        ? "border-sky-500/20 bg-sky-500/8 text-sky-800 dark:text-sky-100"
        : "border-amber-500/30 bg-amber-500/12 text-amber-900 dark:text-amber-100";
  const dot =
    bucket === "delivered"
      ? "bg-emerald-600"
      : bucket === "in_transit"
        ? "bg-sky-500"
        : "bg-amber-500";

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize",
        cls,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {retailStatusLabel(status)}
    </span>
  );
}
