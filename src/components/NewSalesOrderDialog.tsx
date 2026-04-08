import { useEffect, useMemo, useState } from "react";
import type { Account, OrderRoutingTarget, SalesOrder } from "@/data/mockData";
import { orderCreatedByFromRole } from "@/lib/order-routing";
import { useAccounts, useProducts } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { resolveSalesRepLabelForSession } from "@/data/team-roster";
import {
  accountsForSalesOrderVariant,
  getSalesOrderFormVariantConfig,
  type NewSalesOrderFormVariant,
} from "@/lib/sales-order-form-variants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { Link } from "react-router-dom";

const SALES_REPS = ["Marcus Chen", "Sarah Kim", "Luca Moretti", "Jordan Lee"] as const;

const ORDER_STATUSES: SalesOrder["status"][] = [
  "draft",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];

const PAYMENT_STATUSES: SalesOrder["paymentStatus"][] = ["pending", "paid", "overdue"];

function nextOrderId(existing: SalesOrder[]): string {
  let maxSeq = 0;
  const year = new Date().getFullYear();
  for (const o of existing) {
    const m = o.id.match(/^SO-(\d{4})-(\d+)$/);
    if (m) {
      const y = parseInt(m[1], 10);
      const seq = parseInt(m[2], 10);
      if (y === year) maxSeq = Math.max(maxSeq, seq);
    }
  }
  return `SO-${year}-${String(maxSeq + 1).padStart(3, "0")}`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function defaultMarketForAccount(tradingName: string, accountList: Account[]): string {
  const acc = accountList.find((a) => a.tradingName === tradingName);
  if (!acc) return "";
  if (acc.tradingName === "LCBO Ontario" || (acc.legalName?.toLowerCase() || "").includes("liquor control")) return "Ontario";
  return acc.city;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingOrders: SalesOrder[];
  onCreate: (order: SalesOrder) => void;
  variant: NewSalesOrderFormVariant;
};

export function NewSalesOrderDialog({ open, onOpenChange, existingOrders, onCreate, variant }: Props) {
  const { accounts: allAccounts } = useAccounts();
  const { products } = useProducts();
  const { user } = useAuth();
  const sessionRep = resolveSalesRepLabelForSession(user?.email, user?.displayName ?? "");

  const cfg = getSalesOrderFormVariantConfig(variant);
  const accounts = useMemo(() => accountsForSalesOrderVariant(allAccounts, variant), [allAccounts, variant]);

  const [account, setAccount] = useState("");
  const [market, setMarket] = useState("");
  const [orderDate, setOrderDate] = useState(todayISO());
  const [requestedDelivery, setRequestedDelivery] = useState(addDaysISO(14));
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState("12");
  const [price, setPrice] = useState("");
  const [salesRep, setSalesRep] = useState<string>(SALES_REPS[0]);
  const [status, setStatus] = useState<SalesOrder["status"]>("draft");
  const [paymentStatus, setPaymentStatus] = useState<SalesOrder["paymentStatus"]>("pending");
  const [error, setError] = useState<string | null>(null);
  /** Brand HQ: who this order is for. */
  const [brandPath, setBrandPath] = useState<OrderRoutingTarget>("wholesaler");
  /** Wholesaler: route via rep vs direct to retail. */
  const [wholesalerPath, setWholesalerPath] = useState<"rep" | "retail">("retail");
  const [wholesaleRep, setWholesaleRep] = useState<string>(SALES_REPS[0]);

  useEffect(() => {
    if (!open) return;
    setAccount("");
    setMarket("");
    setOrderDate(todayISO());
    setRequestedDelivery(addDaysISO(14));
    setSku("");
    setQuantity("12");
    setPrice("");
    setSalesRep(SALES_REPS[0]);
    setStatus(variant === "manufacturer" ? "draft" : "draft");
    setPaymentStatus("pending");
    setError(null);
    setBrandPath("wholesaler");
    setWholesalerPath("retail");
    setWholesaleRep(SALES_REPS[0]);
  }, [open, variant]);

  useEffect(() => {
    if (account) setMarket(defaultMarketForAccount(account, allAccounts));
  }, [account, allAccounts]);

  useEffect(() => {
    if (!open || variant !== "sales_rep") return;
    setSalesRep(sessionRep);
  }, [open, variant, sessionRep]);

  const effectiveSalesRep = variant === "sales_rep" ? sessionRep : salesRep;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!account.trim()) {
      setError("Select a customer account.");
      return;
    }
    if (!market.trim()) {
      setError("Market / region is required.");
      return;
    }
    if (!orderDate || !requestedDelivery) {
      setError("Order date and requested delivery date are required.");
      return;
    }
    if (requestedDelivery < orderDate) {
      setError("Requested delivery must be on or after the order date.");
      return;
    }
    if (!sku) {
      setError("Select a SKU.");
      return;
    }
    const qty = parseInt(quantity, 10);
    if (!Number.isFinite(qty) || qty < 1) {
      setError("Quantity must be a whole number of at least 1.");
      return;
    }
    if (!price.trim()) {
      setError("Enter the order value (CAD).");
      return;
    }
    const priceNum = parseFloat(price.replace(/,/g, ""));
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setError("Order value must be a number zero or greater.");
      return;
    }

    if (variant === "distributor" && wholesalerPath === "rep" && !wholesaleRep.trim()) {
      setError("Select the field rep this route is for.");
      return;
    }

    let repLine = effectiveSalesRep;
    let routingTarget: OrderRoutingTarget | undefined;
    let assignedSalesRep: string | undefined;

    if (variant === "brand") {
      routingTarget = brandPath;
    } else if (variant === "distributor") {
      routingTarget = wholesalerPath === "rep" ? "sales_rep" : "retail";
      if (wholesalerPath === "rep") {
        repLine = wholesaleRep;
        assignedSalesRep = wholesaleRep;
      } else {
        const acc = allAccounts.find((a) => a.tradingName === account);
        repLine = acc?.salesOwner ?? salesRep;
      }
    } else if (variant === "sales_rep") {
      routingTarget = "retail";
      repLine = sessionRep;
    } else if (variant === "manufacturer") {
      routingTarget = "manufacturer";
    }

    const order: SalesOrder = {
      id: nextOrderId(existingOrders),
      account,
      market: market.trim(),
      orderDate,
      requestedDelivery,
      sku,
      quantity: qty,
      price: Math.round(priceNum * 100) / 100,
      salesRep: repLine,
      status,
      paymentStatus,
      orderRoutingTarget: routingTarget,
      orderCreatedByRole: orderCreatedByFromRole(user.role),
      repApprovalStatus: "not_required",
      assignedSalesRep,
      placedOnBehalfByRep: variant === "sales_rep",
    };

    onCreate(order);
    toast.success(cfg.badge + " — order saved", { description: `${order.id} · ${order.account}` });
    onOpenChange(false);
  };

  const skuOptions = products.filter((p) => p.status === "active" || p.status === "development");

  const showLifecycleDetails = variant !== "manufacturer";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-h-[min(90vh,800px)] overflow-y-auto sm:max-w-2xl ${cfg.accent}`}>
        <DialogHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-normal">
              {cfg.badge}
            </Badge>
          </div>
          <DialogTitle className="font-display text-xl">{cfg.title}</DialogTitle>
          <DialogDescription className="text-pretty">{cfg.description}</DialogDescription>
          {cfg.contextNote ? <p className="text-xs text-muted-foreground">{cfg.contextNote}</p> : null}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {variant === "brand" ? (
            <div className="space-y-2 rounded-lg border border-border/80 bg-muted/20 p-4">
              <Label htmlFor="so-brand-path">Order pathway *</Label>
              <p className="text-xs text-muted-foreground">Choose who this sell-in is for — Brand HQ can route across the network.</p>
              <Select value={brandPath} onValueChange={(v) => setBrandPath(v as OrderRoutingTarget)}>
                <SelectTrigger id="so-brand-path" className="touch-manipulation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manufacturer">Manufacturer / production</SelectItem>
                  <SelectItem value="wholesaler">Wholesaler / distributor (DC)</SelectItem>
                  <SelectItem value="sales_rep">Field sales rep</SelectItem>
                  <SelectItem value="retail">Retail store</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {variant === "distributor" ? (
            <div className="space-y-3 rounded-lg border border-border/80 bg-muted/20 p-4">
              <Label htmlFor="so-wh-path">Place order for *</Label>
              <p className="text-xs text-muted-foreground">Wholesalers route to a rep’s book or direct to a retail account.</p>
              <Select value={wholesalerPath} onValueChange={(v) => setWholesalerPath(v as "rep" | "retail")}>
                <SelectTrigger id="so-wh-path" className="touch-manipulation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rep">Retail account (attributed to a field rep)</SelectItem>
                  <SelectItem value="retail">Retail store (direct)</SelectItem>
                </SelectContent>
              </Select>
              {wholesalerPath === "rep" ? (
                <div className="space-y-2">
                  <Label htmlFor="so-wh-rep">Field rep *</Label>
                  <Select value={wholesaleRep} onValueChange={setWholesaleRep}>
                    <SelectTrigger id="so-wh-rep" className="touch-manipulation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SALES_REPS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{cfg.customerSectionLabel}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="so-account">Account *</Label>
                <Select value={account || undefined} onValueChange={setAccount}>
                  <SelectTrigger id="so-account" className="touch-manipulation">
                    <SelectValue placeholder="Choose customer account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.tradingName}>
                        {a.tradingName}
                        {a.status === "prospect" ? " (prospect)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="so-market">Market / region *</Label>
                <Input
                  id="so-market"
                  value={market}
                  onChange={(e) => setMarket(e.target.value)}
                  placeholder="e.g. Ontario, Toronto, Milan"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Dates</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="so-order-date">Order date *</Label>
                <Input id="so-order-date" type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="so-delivery">Requested delivery *</Label>
                <Input
                  id="so-delivery"
                  type="date"
                  value={requestedDelivery}
                  onChange={(e) => setRequestedDelivery(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{cfg.lineItemSectionLabel}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="so-sku">SKU / product *</Label>
                {skuOptions.length === 0 ? (
                  <p className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    No products yet.{" "}
                    <Link to="/settings" className="font-medium text-primary underline-offset-2 hover:underline">
                      Add SKUs in Settings
                    </Link>
                    .
                  </p>
                ) : (
                  <Select value={sku || undefined} onValueChange={setSku}>
                    <SelectTrigger id="so-sku" className="touch-manipulation">
                      <SelectValue placeholder="Select product SKU" />
                    </SelectTrigger>
                    <SelectContent>
                      {skuOptions.map((p) => (
                        <SelectItem key={p.sku} value={p.sku}>
                          {p.sku} — {p.name} {p.size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="so-qty">Quantity (bottles) *</Label>
                <Input
                  id="so-qty"
                  type="number"
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="so-price">Order value (CAD) *</Label>
                <Input
                  id="so-price"
                  type="number"
                  min={0}
                  step={0.01}
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{cfg.assignmentSectionLabel}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {variant === "sales_rep" ? (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Sales rep (attributed)</Label>
                  <div className="rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm">
                    <span className="text-muted-foreground">You</span>
                    <p className="font-medium text-foreground">{sessionRep}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="so-rep">Sales rep *</Label>
                  <Select value={salesRep} onValueChange={setSalesRep}>
                    <SelectTrigger id="so-rep" className="touch-manipulation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SALES_REPS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {showLifecycleDetails ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="so-status">Order status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as SalesOrder["status"])}>
                      <SelectTrigger id="so-status" className="touch-manipulation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="so-pay">Payment status</Label>
                    <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as SalesOrder["paymentStatus"])}>
                      <SelectTrigger id="so-pay" className="touch-manipulation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  Order stays <strong>draft</strong> until confirmed in Orders; payment pending by default.
                </p>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="touch-manipulation">
              Cancel
            </Button>
            <Button type="submit" className="touch-manipulation">
              {cfg.submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
