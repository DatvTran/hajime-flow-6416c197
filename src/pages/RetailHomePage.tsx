import { Link, useLocation, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useAppData, useAccounts } from "@/contexts/AppDataContext";
import { useAuth, useRetailAccountTradingName } from "@/contexts/AuthContext";
import { useRetailCart } from "@/contexts/RetailCartContext";
import { orderLineEntries, retailOrderDisplayId } from "@/lib/order-lines";
import { retailBucketFromStatus, retailStatusLabel } from "@/components/retail/RetailStatusChip";
import { RetailProductCard } from "@/components/retail/RetailProductCard";
import { RetailPartnerHero } from "@/components/retail/RetailPartnerHero";
import { toast } from "@/components/ui/sonner";
import type { SalesOrder } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { RetailSkeleton } from "@/components/skeletons";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Home,
  ShoppingCart,
  Star,
  TrendingUp,
  Truck,
} from "lucide-react";

const STEP_LABELS = ["Placed", "Approved", "Packed", "In transit", "Delivered"] as const;

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
  const navigate = useNavigate();
  const location = useLocation();
  const { data, loading } = useAppData();
  const { accounts } = useAccounts();
  const cart = useRetailCart();
  const { user } = useAuth();
  const accountName = useRetailAccountTradingName();
  const [alertDismissed, setAlertDismissed] = useState(false);

  const accountRecord = useMemo(() => accounts.find((a) => a.tradingName === accountName), [accounts, accountName]);
  const shelfForAccount = accountRecord ? data.retailerShelfStock?.[accountRecord.id] : undefined;
  const shelfThreshold = data.operationalSettings?.retailerStockThresholdBottles ?? 48;

  const catalog = useMemo(
    () => [...data.products].filter((p) => p.status === "active").sort((a, b) => a.name.localeCompare(b.name)),
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

  const spendPrior30 = useMemo(() => {
    const windowMs = 30 * 86400000;
    const windowEnd = Date.now() - windowMs;
    const windowStart = windowEnd - windowMs;
    return myOrders
      .filter((o) => {
        const t = Date.parse(o.orderDate);
        return t >= windowStart && t < windowEnd;
      })
      .reduce((s, o) => s + o.price, 0);
  }, [myOrders]);

  const deltaPct = spendPrior30 > 0 ? Math.round(((spend30d.sum - spendPrior30) / spendPrior30) * 100) : null;

  const ytdSpend = useMemo(() => {
    const y = new Date().getFullYear();
    return myOrders.filter((o) => new Date(o.orderDate).getFullYear() === y).reduce((s, o) => s + o.price, 0);
  }, [myOrders]);

  const activeSkuCount = data.products.filter((p) => p.status === "active").length;

  const shelfTracked = useMemo(() => {
    if (!shelfForAccount) return 0;
    return Object.values(shelfForAccount).filter((n) => n > 0).length;
  }, [shelfForAccount]);

  const trackerOrder = useMemo(() => {
    const pipe = myOrders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
    return pipe[0] ?? null;
  }, [myOrders]);

  const recent = myOrders.slice(0, 4);

  const desc = useMemo(() => {
    const parts: string[] = [];
    if (lastDeliveryDate) parts.push(`Your last delivery recorded on ${lastDeliveryDate}.`);
    else parts.push("Welcome — place your first order when you're ready.");
    if (activeSkuCount > 0) parts.push(`${activeSkuCount} SKUs available to order.`);
    return parts.join(" ");
  }, [lastDeliveryDate, activeSkuCount]);

  const lowStockSku = useMemo(() => {
    if (!shelfForAccount) return null;
    for (const p of catalog) {
      const b = shelfForAccount[p.sku];
      if (b !== undefined && b < shelfThreshold) return { product: p, bottles: b };
    }
    return null;
  }, [catalog, shelfForAccount, shelfThreshold]);

  useEffect(() => {
    if (location.hash === "#retail-catalog") {
      requestAnimationFrame(() => {
        document.getElementById("retail-catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [location.hash]);

  if (loading) {
    return <RetailSkeleton />;
  }

  return (
    <div className="space-y-7 pb-8 md:space-y-8">
      {/* Page hero — retail-store-app `.ph-row` */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.02em] text-foreground">
            {timeGreeting()}, {greetingName(user?.displayName ?? "there")}.
          </h1>
          <p className="mt-1 max-w-[52ch] text-[13px] leading-relaxed text-muted-foreground">{desc}</p>
        </div>
        <Button variant="outline" className="h-9 shrink-0 self-start" asChild>
          <Link to="/reports">View reports</Link>
        </Button>
      </div>

      {/* Alert bar */}
      {!alertDismissed && lowStockSku ? (
        <div className="flex flex-col gap-3 rounded-xl border border-[hsl(38_90%_50%/0.22)] bg-[hsl(38_90%_50%/0.07)] px-4 py-3.5 sm:flex-row sm:items-start">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[hsl(30_80%_34%)]" strokeWidth={1.75} />
          <div className="min-w-0 flex-1 text-[13px] leading-snug">
            <strong className="text-[hsl(30_80%_28%)]">Low stock — {lowStockSku.product.name}:</strong>{" "}
            <span className="text-[hsl(30_70%_35%)]">
              {lowStockSku.bottles} bottles remaining on shelf · reorder before you run dry.
            </span>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" size="sm" className="h-[30px] text-xs" onClick={() => setAlertDismissed(true)}>
              Dismiss
            </Button>
            <Button size="sm" className="h-[30px] bg-accent text-xs text-accent-foreground hover:bg-[hsl(32_78%_48%)]" asChild>
              <Link to="/retail/new-order">Reorder now</Link>
            </Button>
          </div>
        </div>
      ) : null}

      {/* KPI row — 4 tiles */}
      <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          icon={<ShoppingCart className="size-[17px]" strokeWidth={1.75} />}
          iconClass="bg-[hsl(40_88%_42%/0.1)] text-[hsl(40_88%_36%)]"
          label="Open orders"
          value={String(pendingPipeline)}
          sub={trackerOrder?.requestedDelivery ? `Next ETA ${trackerOrder.requestedDelivery}` : "No open pipeline"}
        />
        <KpiTile
          icon={<Truck className="size-[17px]" strokeWidth={1.75} />}
          iconClass="bg-[hsl(215_72%_50%/0.1)] text-[hsl(215_72%_42%)]"
          label="Last 30 days"
          value={`$${formatMoney(spend30d.sum)}`}
          sub={`${spend30d.casesApprox > 0 ? `${spend30d.casesApprox} cases · ` : ""}${spend30d.skuCount} SKUs`}
          delta={
            deltaPct != null ? (
              <span className="inline-flex items-center gap-1 font-medium text-[hsl(158_56%_32%)]">
                <TrendingUp className="size-3" strokeWidth={2} />
                {deltaPct >= 0 ? "+" : ""}
                {deltaPct}% vs prior period
              </span>
            ) : null
          }
        />
        <KpiTile
          icon={<Home className="size-[17px]" strokeWidth={1.75} />}
          iconClass="bg-[hsl(158_56%_36%/0.1)] text-[hsl(158_56%_30%)]"
          label="On backbar"
          value={`${activeSkuCount} SKUs`}
          sub={`${shelfTracked} tracking depletion`}
        />
        <KpiTile
          icon={<Star className="size-[17px]" strokeWidth={1.75} />}
          iconClass="bg-[hsl(24_10%_10%/0.07)] text-[hsl(24_10%_18%)]"
          label="YTD spend"
          value={`$${formatMoney(ytdSpend)}`}
          sub="Partner tier progress"
        />
      </section>

      {accountName ? (
        <RetailPartnerHero retailTradingName={accountName} spendApproxUsd={ytdSpend > 0 ? ytdSpend : spend30d.sum} />
      ) : null}

      {/* Active shipment */}
      <section>
        <div className="mb-3.5 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-[19px] font-medium tracking-[-0.01em]">Active shipment</h2>
          <Link to="/shipments" className="text-xs font-medium text-accent hover:underline">
            All deliveries →
          </Link>
        </div>

        {trackerOrder ? (
          <Collapsible defaultOpen className="overflow-hidden rounded-[14px] border border-border/70 bg-card shadow-[var(--shadow-soft)]">
            <CollapsibleTrigger className="group flex w-full cursor-pointer items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/30">
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[11px] text-muted-foreground">
                  {retailOrderDisplayId(trackerOrder.id)} · Placed {trackerOrder.orderDate}
                </div>
                <div className="mt-0.5 font-display text-lg font-medium tracking-[-0.01em]">{primaryLineSummary(trackerOrder)}</div>
                <div className="mt-1 text-[13px] text-muted-foreground">
                  Requested delivery{" "}
                  <strong className="font-medium text-foreground">{trackerOrder.requestedDelivery}</strong>
                </div>
              </div>
              <TrackerPill status={trackerOrder.status} />
              <ChevronDown className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border-t border-border/50 px-5 pb-5 pt-4">
                <div className="relative mb-4">
                  <div
                    className="pointer-events-none absolute left-[5%] right-[5%] top-4 z-0 h-0.5 bg-border"
                    aria-hidden
                  />
                  <div className="relative z-[1] flex items-start">
                    {STEP_LABELS.map((label, i) => {
                      const row = stepRowState(trackerOrder.status, i);
                      return (
                        <div key={label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
                          <div
                            className={cn(
                              "flex size-8 items-center justify-center rounded-full border-2 border-card text-xs font-medium",
                              row === "done" && "bg-[hsl(158_56%_36%)] text-white",
                              row === "current" &&
                                "bg-accent text-accent-foreground shadow-[0_0_0_5px_hsl(40_88%_42%/0.16)]",
                              row === "upcoming" && "bg-muted text-muted-foreground",
                            )}
                          >
                            {row === "done" ? <Check className="size-3.5" strokeWidth={2} /> : row === "current" ? "●" : "○"}
                          </div>
                          <span
                            className={cn(
                              "text-[11px] font-medium",
                              row === "upcoming" ? "text-muted-foreground" : "text-foreground",
                            )}
                          >
                            {label}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {row === "upcoming" ? "—" : i === 0 ? trackerOrder.orderDate : "—"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap gap-5 border-t border-border/50 pt-3.5 text-[13px]">
                  <div>
                    Total{" "}
                    <strong className="font-mono font-medium tabular-nums">${formatMoney(trackerOrder.price)}</strong>
                  </div>
                  <div>
                    Status <strong className="font-medium">{retailStatusLabel(trackerOrder.status)}</strong>
                  </div>
                  <div className="ml-auto">
                    <Button variant="outline" size="sm" className="h-[30px] text-xs" asChild>
                      <Link to={`/retail/orders/${encodeURIComponent(trackerOrder.id)}`}>Order detail</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <div className="rounded-[14px] border border-dashed border-border/80 bg-muted/20 px-5 py-8 text-center text-[13px] text-muted-foreground">
            No orders in transit —{" "}
            <a href="#retail-catalog" className="font-medium text-accent underline-offset-4 hover:underline">
              browse reorder picks
            </a>{" "}
            below.
          </div>
        )}
      </section>

      {/* Catalog */}
      <section id="retail-catalog" className="scroll-mt-28">
        <div className="mb-3.5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-[19px] font-medium tracking-[-0.01em]">Reorder picks</h2>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
              Based on curated SKUs and shelf signals — add cases here; your cart stays in sync with{" "}
              <Link to="/retail/new-order" className="font-medium text-accent underline-offset-4 hover:underline">
                New order
              </Link>
              .
            </p>
          </div>
          <Link to="/retail/catalog" className="text-xs font-medium text-accent hover:underline">
            Full catalog →
          </Link>
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
        {catalog.length === 0 ? (
          <p className="mt-4 text-[13px] text-muted-foreground">No active SKUs available — contact your rep.</p>
        ) : null}
      </section>

      {/* Recent orders — data table */}
      <section>
        <div className="mb-3.5 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-[19px] font-medium tracking-[-0.01em]">Recent orders</h2>
          <Link to="/retail/orders" className="text-xs font-medium text-accent hover:underline">
            All orders →
          </Link>
        </div>

        <div className="overflow-hidden rounded-[14px] border border-border/70 bg-card shadow-[var(--shadow-soft)]">
          {recent.length === 0 ? (
            <p className="px-4 py-10 text-center text-[13px] text-muted-foreground">No orders yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="bg-muted/50 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    Order
                  </TableHead>
                  <TableHead className="bg-muted/50 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    Items
                  </TableHead>
                  <TableHead className="bg-muted/50 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    Total
                  </TableHead>
                  <TableHead className="bg-muted/50 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((o) => (
                  <TableRow
                    key={o.id}
                    className="cursor-pointer border-border/40"
                    onClick={() => navigate(`/retail/orders/${encodeURIComponent(o.id)}`)}
                  >
                    <TableCell className="align-middle">
                      <div className="font-mono text-xs font-medium">{retailOrderDisplayId(o.id)}</div>
                      <div className="text-[11px] text-muted-foreground">Placed {o.orderDate}</div>
                    </TableCell>
                    <TableCell className="max-w-[280px] align-middle text-[13px] text-muted-foreground">
                      {primaryLineSummary(o)}
                    </TableCell>
                    <TableCell className="align-middle font-mono text-[13px] font-medium tabular-nums">
                      ${formatMoney(o.price)}
                    </TableCell>
                    <TableCell className="align-middle">
                      <OrderRowPill status={o.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>
    </div>
  );
}

function KpiTile({
  icon,
  iconClass,
  label,
  value,
  sub,
  delta,
}: {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  value: string;
  sub: string;
  delta?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-[14px] border border-border/70 bg-card p-[18px] shadow-[var(--shadow-soft)] transition-[box-shadow,transform] duration-200 hover:-translate-y-px hover:shadow-[var(--shadow-lifted)]">
      <div className={cn("mb-2 flex size-[34px] items-center justify-center rounded-lg", iconClass)}>{icon}</div>
      <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
      <span className="font-display text-[26px] font-semibold tabular-nums tracking-[-0.02em] leading-tight">{value}</span>
      <span className="text-xs text-muted-foreground">{sub}</span>
      {delta ? <div className="mt-0.5 text-[11px]">{delta}</div> : null}
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
      <span className={cn("size-1.5 rounded-full", dot)} />
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
      <span className={cn("size-1.5 rounded-full", dot)} />
      {retailStatusLabel(status)}
    </span>
  );
}
