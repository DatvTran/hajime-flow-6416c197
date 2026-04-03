import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { NewSalesOrderDialog } from "@/components/NewSalesOrderDialog";
import { SalesOrderDetailDialog } from "@/components/SalesOrderDetailDialog";
import type { SalesOrder } from "@/data/mockData";
import { useAccounts, useSalesOrders } from "@/contexts/AppDataContext";
import { computeOrderTabCounts, isOrderTabId, matchesOrderTab, ORDER_TABS, type OrderTabId } from "@/lib/order-lifecycle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { apiListCardLast4s, apiVerifyCheckoutSession } from "@/lib/stripe-api";
import { setStoredCardLast4, setStoredCustomerId } from "@/lib/stripe-local";

export default function Orders() {
  const { salesOrders: orders, addSalesOrder, patchSalesOrder } = useSalesOrders();
  const { accounts } = useAccounts();
  const [searchParams, setSearchParams] = useSearchParams();
  const accountFromUrl = searchParams.get("account");

  const orderTab: OrderTabId = isOrderTabId(searchParams.get("tab"))
    ? searchParams.get("tab")!
    : "pending-review";

  /** Legacy ?filter= → tabs */
  useEffect(() => {
    const f = searchParams.get("filter");
    if (!f) return;
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.delete("filter");
        if (f === "pending-approval" || f === "draft") n.set("tab", "pending-review");
        else if (f === "open") n.set("tab", "approved");
        else n.set("tab", "pending-review");
        return n;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams]);
  const [search, setSearch] = useState("");
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [billingUiTick, setBillingUiTick] = useState(0);

  const detailOrder = useMemo(
    () => (selectedOrderId ? orders.find((o) => o.id === selectedOrderId) ?? null : null),
    [orders, selectedOrderId],
  );

  useEffect(() => {
    if (selectedOrderId && !detailOrder) setSelectedOrderId(null);
  }, [selectedOrderId, detailOrder]);

  /** Deep link from Accounts page — pre-fill order search by trading name. */
  useEffect(() => {
    if (accountFromUrl) setSearch(accountFromUrl);
  }, [accountFromUrl]);

  /** Retail / sales rep: open new order dialog from sidebar. */
  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    setNewOrderOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete("new");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  /** After customer completes Stripe Checkout (setup), sync card on file and clean URL. */
  useEffect(() => {
    const setup = searchParams.get("stripe_setup");
    const sessionId = searchParams.get("session_id");
    const clearStripeParams = () => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("stripe_setup");
          next.delete("session_id");
          return next;
        },
        { replace: true },
      );
    };

    if (!setup) return;

    if (setup === "cancel") {
      toast.info("Card setup cancelled", { description: "You can send a new link when ready." });
      clearStripeParams();
      return;
    }

    if (setup !== "success" || !sessionId) {
      clearStripeParams();
      return;
    }

    const lockKey = `hajime_stripe_setup_${sessionId}`;
    if (sessionStorage.getItem(lockKey)) {
      clearStripeParams();
      return;
    }
    sessionStorage.setItem(lockKey, "pending");

    let cancelled = false;
    (async () => {
      try {
        const v = await apiVerifyCheckoutSession(sessionId);
        if (cancelled) return;
        if (!v.ok || !v.customerId || !v.accountKey) {
          sessionStorage.removeItem(lockKey);
          toast.error("Could not confirm card setup", {
            description: v.setupStatus ? `Setup status: ${v.setupStatus}` : "Ask the customer to try the link again or use Save card on account.",
          });
        } else {
          setStoredCustomerId(v.accountKey, v.customerId);
          try {
            const lasts = await apiListCardLast4s(v.customerId);
            if (lasts[0]) setStoredCardLast4(v.accountKey, lasts[0]);
          } catch {
            /* ignore */
          }
          setBillingUiTick((n) => n + 1);
          toast.success("Card saved", {
            description: `${v.accountKey} — payment method is on file in Stripe.`,
          });
          sessionStorage.setItem(lockKey, "done");
        }
      } catch (e) {
        if (!cancelled) {
          sessionStorage.removeItem(lockKey);
          toast.error("Could not verify card setup", { description: String(e) });
        }
      } finally {
        if (!cancelled) clearStripeParams();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, setSearchParams]);

  const pendingDraftOrders = useMemo(() => orders.filter((o) => o.status === "draft"), [orders]);

  const tabCounts = useMemo(() => computeOrderTabCounts(orders), [orders]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter((o) => {
      if (!matchesOrderTab(o, orderTab)) return false;
      return o.account.toLowerCase().includes(q) || o.id.toLowerCase().includes(q);
    });
  }, [search, orderTab, orders]);

  const setOrderTab = (tab: OrderTabId) => {
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.set("tab", tab);
        return n;
      },
      { replace: true },
    );
  };

  const handleCreateOrder = (order: SalesOrder) => {
    addSalesOrder(order);
  };

  const patchOrder = (id: string, patch: Partial<Pick<SalesOrder, "status" | "paymentStatus">>) => {
    patchSalesOrder(id, patch);
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Lifecycle tabs from pending review through distributor processing — same records as retail, field teams, and the Command center (HQ)."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button variant="outline" size="sm" className="w-full justify-center touch-manipulation sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              type="button"
              size="sm"
              className="w-full justify-center touch-manipulation sm:w-auto"
              onClick={() => setNewOrderOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </div>
        }
      />

      <NewSalesOrderDialog
        open={newOrderOpen}
        onOpenChange={setNewOrderOpen}
        existingOrders={orders}
        onCreate={handleCreateOrder}
      />

      <SalesOrderDetailDialog
        order={detailOrder}
        open={detailOrder !== null}
        onOpenChange={(o) => {
          if (!o) setSelectedOrderId(null);
        }}
        onPatch={patchOrder}
        accounts={accounts}
        billingRefresh={billingUiTick}
        onStripeBillingUpdated={() => setBillingUiTick((n) => n + 1)}
      />

      <Card>
        <CardContent className="pt-6">
          {pendingDraftOrders.length > 0 && (
            <div className="mb-4 rounded-lg border border-accent/25 bg-accent/5 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium text-foreground">Order approval queue</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {pendingDraftOrders.length} draft order{pendingDraftOrders.length !== 1 ? "s" : ""} awaiting HQ allocation — same list as Command center.
                  </p>
                </div>
                {orderTab !== "pending-review" ? (
                  <Button type="button" variant="secondary" size="sm" className="shrink-0 touch-manipulation" onClick={() => setOrderTab("pending-review")}>
                    View queue
                  </Button>
                ) : null}
              </div>
              <ul className="mt-3 space-y-2 border-t border-border/60 pt-3">
                {pendingDraftOrders.map((o) => (
                  <li
                    key={o.id}
                    className="flex flex-col gap-2 rounded-md border bg-card px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 text-sm">
                      <button
                        type="button"
                        className="font-mono text-xs font-medium text-primary underline-offset-2 hover:underline"
                        onClick={() => setSelectedOrderId(o.id)}
                      >
                        {o.id}
                      </button>
                      <span className="text-muted-foreground"> · </span>
                      <span className="font-medium">{o.account}</span>
                      <span className="text-muted-foreground"> · {o.market}</span>
                      <span className="block text-xs text-muted-foreground">${o.price.toLocaleString()} · {o.quantity} bottles</span>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="touch-manipulation"
                        onClick={() => {
                          patchOrder(o.id, { status: "confirmed" });
                          toast.success("Approved", { description: `${o.id} → confirmed` });
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="touch-manipulation"
                        onClick={() => {
                          patchOrder(o.id, { status: "cancelled" });
                          toast.info("Rejected", { description: `${o.id} → cancelled` });
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Tabs value={orderTab} onValueChange={(v) => setOrderTab(v as OrderTabId)} className="mb-4 w-full">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/40 p-1">
              {ORDER_TABS.map((t) => (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="touch-manipulation px-3 py-2 text-xs data-[state=active]:bg-background"
                >
                  {t.label}
                  <span className="ml-1.5 tabular-nums text-muted-foreground">({tabCounts[t.id]})</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search order or account..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="-mx-4 overflow-x-auto touch-pan-x px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Order ID</th>
                  <th className="pb-3 font-medium text-muted-foreground">Account</th>
                  <th className="pb-3 font-medium text-muted-foreground">Market</th>
                  <th className="pb-3 font-medium text-muted-foreground">SKU</th>
                  <th className="pb-3 font-medium text-muted-foreground">Qty</th>
                  <th className="pb-3 font-medium text-muted-foreground">Value</th>
                  <th className="pb-3 font-medium text-muted-foreground">Sales Rep</th>
                  <th className="pb-3 font-medium text-muted-foreground">Approval</th>
                  <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 font-medium text-muted-foreground">Payment</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-sm text-muted-foreground">
                      No orders in this stage. Try another tab or clear search.
                    </td>
                  </tr>
                ) : null}
                {filtered.map((order) => (
                  <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3">
                      <button
                        type="button"
                        className="font-mono text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm touch-manipulation text-left"
                        onClick={() => setSelectedOrderId(order.id)}
                      >
                        {order.id}
                      </button>
                    </td>
                    <td className="py-3 font-medium">{order.account}</td>
                    <td className="py-3">{order.market}</td>
                    <td className="py-3 font-mono text-xs">{order.sku}</td>
                    <td className="py-3">{order.quantity}</td>
                    <td className="py-3">${order.price.toLocaleString()}</td>
                    <td className="py-3">{order.salesRep}</td>
                    <td className="py-3">
                      {order.status === "draft" ? (
                        <span className="inline-flex rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                          Pending
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3"><StatusBadge status={order.status} /></td>
                    <td className="py-3"><StatusBadge status={order.paymentStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
