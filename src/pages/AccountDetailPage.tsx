import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAccounts, useSalesOrders } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  ReceiptText,
  TrendingUp,
  Package,
  ShoppingCart,
  FileText,
  MessageSquare,
  ExternalLink,
} from "lucide-react";

export default function AccountDetailPage() {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const { accounts } = useAccounts();
  const { salesOrders } = useSalesOrders();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);

  const account = accounts.find((a) => a.id === accountId);
  // Orders matched by tradingName (orders use account name string, not id)
  const accountOrders = salesOrders.filter(
    (o) => o.account === account?.tradingName || o.accountId === accountId,
  );
  const totalRevenue = accountOrders
    .filter((o) => !["cancelled", "draft"].includes(o.status))
    .reduce((sum, o) => sum + o.price, 0);

  // Use internal notes if available
  useState(() => {
    if (account?.internalNotes) setNotes(account.internalNotes);
  });

  if (!account) {
    return (
      <div className="p-8 text-muted-foreground">Account not found.</div>
    );
  }

  const tierLabel = account.pricingTier
    ? account.pricingTier.charAt(0).toUpperCase() + account.pricingTier.slice(1)
    : null;

  const handleSaveNotes = () => {
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  // Simple sparkline data from orders (last 5 order prices)
  const sparkData = accountOrders
    .filter((o) => !["cancelled", "draft"].includes(o.status))
    .sort((a, b) => a.orderDate.localeCompare(b.orderDate))
    .slice(-6)
    .map((o) => o.price);

  const maxSpark = Math.max(...sparkData, 1);

  return (
    <div>
      {/* Back navigation + hero header */}
      <div className="mb-6 animate-enter">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground touch-manipulation"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Accounts
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Avatar + name block */}
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted">
              <span className="font-display text-3xl font-semibold text-muted-foreground">
                {account.tradingName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
                {account.tradingName}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <StatusBadge status={account.status} />
                {tierLabel && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {tierLabel} tier
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {account.type.charAt(0).toUpperCase() + account.type.slice(1)} ·{" "}
                {account.city}, {account.country}
                {account.salesOwner ? ` · Rep: ${account.salesOwner}` : ""}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" className="touch-manipulation">
              <FileText className="mr-1.5 h-4 w-4" />
              Log visit
            </Button>
            <Button
              size="sm"
              className="touch-manipulation bg-[hsl(40_88%_42%)] text-white hover:bg-[hsl(40_88%_38%)]"
              onClick={() => navigate("/orders")}
            >
              <ShoppingCart className="mr-1.5 h-4 w-4" />
              New order
            </Button>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardContent className="p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Total revenue
            </p>
            <p className="mt-2 font-display text-2xl font-semibold tracking-tight">
              ${totalRevenue.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">all time</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardContent className="p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              30d revenue
            </p>
            <p className="mt-2 font-display text-2xl font-semibold tracking-tight">
              ${(account.avgOrderSize ?? 0).toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">avg order size</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardContent className="p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Tags
            </p>
            <p className="mt-2 font-display text-2xl font-semibold tracking-tight">
              {(account.tags ?? []).length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">listings / labels</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardContent className="p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Orders placed
            </p>
            <p className="mt-2 font-display text-2xl font-semibold tracking-tight">
              {accountOrders.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">total orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Left: account details */}
            <Card className="rounded-2xl border-border/60 shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Account details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[
                  { label: "Legal name", value: account.legalName },
                  { label: "Trading name", value: account.tradingName },
                  { label: "Type", value: account.type },
                  { label: "Country", value: account.country },
                  { label: "City", value: account.city },
                  { label: "Email", value: account.email },
                  { label: "Phone", value: account.phone },
                  { label: "Contact", value: account.contactName },
                  { label: "Contact role", value: account.contactRole },
                  { label: "Payment terms", value: account.paymentTerms },
                  { label: "Sales owner", value: account.salesOwner },
                  { label: "First order", value: account.firstOrderDate },
                  { label: "Last order", value: account.lastOrderDate },
                ].map(({ label, value }) =>
                  value ? (
                    <div key={label} className="flex justify-between gap-4 border-b border-border/40 pb-2 last:border-0">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="text-right font-medium text-foreground">{value}</span>
                    </div>
                  ) : null,
                )}
                {(account.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {account.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right: revenue sparkline + recent orders */}
            <div className="space-y-4">
              {sparkData.length > 0 && (
                <Card className="rounded-2xl border-border/60 shadow-soft">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      Revenue trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex h-16 items-end gap-1.5">
                      {sparkData.map((val, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-sm bg-[hsl(40_88%_42%/0.6)] transition-all hover:bg-[hsl(40_88%_42%)]"
                          style={{ height: `${Math.round((val / maxSpark) * 100)}%` }}
                          title={`$${val.toLocaleString()}`}
                        />
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Last {sparkData.length} orders
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card className="rounded-2xl border-border/60 shadow-soft">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <ReceiptText className="h-4 w-4 text-muted-foreground" />
                    Recent orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {accountOrders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No orders yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {accountOrders.slice(0, 4).map((o) => (
                        <div key={o.id} className="flex items-center justify-between text-sm">
                          <div>
                            <span className="font-mono text-xs text-muted-foreground">{o.id}</span>
                            <p className="text-xs text-muted-foreground">{o.orderDate}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">${o.price.toLocaleString()}</span>
                            <StatusBadge status={o.status} size="xs" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Orders tab */}
        <TabsContent value="orders">
          <Card className="rounded-2xl border-border/60 shadow-soft overflow-hidden">
            <CardContent className="p-0">
              {accountOrders.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <ShoppingCart className="h-10 w-10 text-muted-foreground/20" strokeWidth={1} />
                  <p className="text-sm text-muted-foreground">No orders for this account.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="px-4 pb-3 pt-4 font-medium text-muted-foreground">Order</th>
                        <th className="px-4 pb-3 pt-4 font-medium text-muted-foreground">Date</th>
                        <th className="px-4 pb-3 pt-4 font-medium text-muted-foreground">SKU</th>
                        <th className="px-4 pb-3 pt-4 font-medium text-muted-foreground">Total</th>
                        <th className="px-4 pb-3 pt-4 font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accountOrders.map((o) => (
                        <tr
                          key={o.id}
                          className="border-b last:border-0 transition-colors hover:bg-muted/30"
                        >
                          <td className="px-4 py-3 font-mono text-xs">{o.id}</td>
                          <td className="px-4 py-3 text-muted-foreground">{o.orderDate}</td>
                          <td className="px-4 py-3 font-mono text-xs">{o.sku}</td>
                          <td className="px-4 py-3 font-medium tabular-nums">
                            ${o.price.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={o.status} size="xs" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes tab */}
        <TabsContent value="notes">
          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                Internal notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add internal notes about this account…"
                rows={8}
                className="resize-none"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Notes are visible to your team only.
                </p>
                <Button size="sm" onClick={handleSaveNotes} className="touch-manipulation">
                  {notesSaved ? "Saved ✓" : "Save notes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
