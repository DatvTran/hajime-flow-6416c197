import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { AccountDetailDialog } from "@/components/AccountDetailDialog";
import { NewAccountDialog } from "@/components/NewAccountDialog";
import { useAccounts, useSalesOrders, useAppData } from "@/contexts/AppDataContext";
import { AccountsSkeleton } from "@/components/skeletons";
import { useAuth } from "@/contexts/AuthContext";
import { RetailerApplicationDialog } from "@/components/RetailerApplicationDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Account } from "@/data/mockData";
import { Plus, Search, MapPin, Mail, Phone, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CSVImportButton } from "@/components/CSVImportButton";
import { toast } from "@/components/ui/sonner";
import { resolveSalesRepLabelForSession } from "@/data/team-roster";

function channelLabel(type: Account["type"]): string {
  if (type === "distributor") return "Distributor";
  return "Retailer";
}

function marketAssignment(account: Account): string {
  const t = account.tags?.find((x) => ["toronto", "milan", "paris", "ontario", "export"].includes(x));
  if (t) return `${account.city || "—"} · ${t}`;
  return `${account.city || "—"}, ${account.country || "—"}`;
}

export default function Accounts() {
  const { user } = useAuth();
  const { accounts, updateAccount, addAccount } = useAccounts();
  const { salesOrders } = useSalesOrders();
  const { loading } = useAppData();

  if (loading) {
    return <AccountsSkeleton />;
  }

  const [searchParams, setSearchParams] = useSearchParams();
  const activeOnly = searchParams.get("status") === "active";
  const pipelineOnboarding = searchParams.get("pipeline") === "onboarding";
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"table" | "cards">("cards");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [newAccountOpen, setNewAccountOpen] = useState(false);
  const [applicationOpen, setApplicationOpen] = useState(false);

  const detailAccount = useMemo(
    () => (selectedAccountId ? accounts.find((a) => a.id === selectedAccountId) ?? null : null),
    [accounts, selectedAccountId],
  );

  const salesByAccount = useMemo(() => {
    const m: Record<string, { orders: number; revenue: number }> = {};
    for (const o of salesOrders) {
      if (o.status === "cancelled" || o.status === "draft") continue;
      if (!m[o.account]) m[o.account] = { orders: 0, revenue: 0 };
      m[o.account].orders += 1;
      m[o.account].revenue += o.price;
    }
    return m;
  }, [salesOrders]);

  const filtered = useMemo(() => {
    // Role-based scoping — tightened permissions
    let scopedAccounts = accounts;
    
    if (user.role === "sales_rep") {
      // Sales reps: assigned accounts only
      const rep = resolveSalesRepLabelForSession(user.email, user.displayName ?? "");
      scopedAccounts = accounts.filter((a) => a.salesOwner === rep);
    } else if (user.role === "distributor") {
      // Distributors: on-premise accounts they fulfill (retail, bar, restaurant, hotel)
      scopedAccounts = accounts.filter((a) => 
        ["retail", "bar", "restaurant", "hotel"].includes(a.type)
      );
    } else if (user.role === "manufacturer") {
      // Manufacturers: distributor accounts + direct retail chains (sell-in planning)
      scopedAccounts = accounts.filter((a) => 
        a.type === "distributor" || a.type === "retail" || a.tags?.includes("direct")
      );
    } else if (user.role === "retail") {
      // Retail: own account only (can't browse other retailers)
      scopedAccounts = accounts.filter((a) => {
        const emailMatch = user.email && a.email?.toLowerCase() === user.email.toLowerCase();
        const nameMatch = user.displayName && (
          a.tradingName?.toLowerCase().includes(user.displayName.toLowerCase()) ||
          a.name?.toLowerCase().includes(user.displayName.toLowerCase())
        );
        return emailMatch || nameMatch;
      });
    }
    // brand_operator, founder_admin, operations, finance: full access (no filter)
    
    const q = search.toLowerCase();
    return scopedAccounts.filter((a) => {
      if (activeOnly && a.status !== "active") return false;
      if (pipelineOnboarding) {
        const p = a.onboardingPipeline ?? "none";
        if (p !== "sales_intake" && p !== "brand_review") return false;
      }
      return (a.tradingName?.toLowerCase() || "").includes(q) || (a.city?.toLowerCase() || "").includes(q);
    });
  }, [search, activeOnly, accounts, pipelineOnboarding, user.role, user.email, user.displayName]);

  const clearStatusFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("status");
    setSearchParams(next, { replace: true });
  };

  const toggleOnboardingFilter = () => {
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        if (n.get("pipeline") === "onboarding") n.delete("pipeline");
        else n.set("pipeline", "onboarding");
        return n;
      },
      { replace: true },
    );
  };

  return (
    <div>
      <PageHeader
        title="Accounts"
        description={
          user.role === "sales_rep"
            ? "Your assigned accounts — submit new retailer applications, track onboarding pipeline, and manage relationships."
            : user.role === "distributor"
              ? "On-premise accounts you fulfill — retail, bars, restaurants, and hotels in your territory."
              : user.role === "manufacturer"
                ? "Distributors and retail chains for sell-in planning and production forecasting."
                : user.role === "retail"
                  ? "Your account profile and order history."
                  : "Retailers and distributors — market assignment, sell-in history, onboarding pipeline, and account managers."
        }
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <CSVImportButton
              defaultType="accounts"
              variant="outline"
              size="sm"
              onSuccess={() => toast.success("Accounts imported", { description: "Refresh to see changes" })}
            />
            {user.role === "sales_rep" ? (
              <Button type="button" size="sm" variant="secondary" className="w-full justify-center touch-manipulation sm:w-auto" onClick={() => setApplicationOpen(true)}>
                Submit retailer application
              </Button>
            ) : null}
            <Button type="button" size="sm" className="w-full justify-center touch-manipulation sm:w-auto" onClick={() => setNewAccountOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Account
            </Button>
          </div>
        }
      />

      <RetailerApplicationDialog
        open={applicationOpen}
        onOpenChange={setApplicationOpen}
        accounts={accounts}
        onCreate={addAccount}
      />

      <NewAccountDialog
        open={newAccountOpen}
        onOpenChange={setNewAccountOpen}
        accounts={accounts}
        onCreate={addAccount}
      />

      <AccountDetailDialog
        account={detailAccount}
        open={detailAccount !== null}
        onOpenChange={(o) => {
          if (!o) setSelectedAccountId(null);
        }}
        onSave={updateAccount}
      />

      {activeOnly && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
          <span>
            Showing <strong className="text-foreground">active</strong> accounts only
          </span>
          <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0 touch-manipulation" onClick={clearStatusFilter}>
            Show all accounts
          </Button>
        </div>
      )}

      {(user.role === "brand_operator" || user.role === "distributor" || user.role === "sales_rep") && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={pipelineOnboarding ? "default" : "outline"}
            className="touch-manipulation"
            onClick={toggleOnboardingFilter}
          >
            Onboarding queue
          </Button>
          {pipelineOnboarding ? (
            <span className="text-xs text-muted-foreground">Sales intake + brand review only — open a row to advance the pipeline.</span>
          ) : null}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search accounts..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex w-full shrink-0 rounded-lg border sm:w-auto">
          <button type="button" onClick={() => setView("cards")} className={`min-h-10 flex-1 px-3 py-2 text-xs font-medium touch-manipulation sm:min-h-0 sm:flex-none sm:py-1.5 ${view === "cards" ? "bg-primary text-primary-foreground" : "text-muted-foreground"} rounded-l-lg transition-colors`}>Cards</button>
          <button type="button" onClick={() => setView("table")} className={`min-h-10 flex-1 px-3 py-2 text-xs font-medium touch-manipulation sm:min-h-0 sm:flex-none sm:py-1.5 ${view === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground"} rounded-r-lg transition-colors`}>Table</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card-elevated flex flex-col items-center gap-3 py-16 text-center">
          <Users className="h-10 w-10 text-muted-foreground/20" strokeWidth={1} />
          <p className="text-muted-foreground">
            {user.role === "sales_rep"
              ? "No accounts assigned to you yet. Contact your manager to get accounts assigned."
              : user.role === "distributor"
                ? "No on-premise accounts in your territory yet."
                : user.role === "manufacturer"
                  ? "No distributor or retail accounts found."
                  : user.role === "retail"
                    ? "Your account profile will appear here once set up."
                    : "No accounts match your filters."}
          </p>
          {user.role === "sales_rep" ? (
            <Button variant="outline" size="sm" onClick={() => setApplicationOpen(true)}>
              Submit retailer application
            </Button>
          ) : null}
        </div>
      ) : view === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((account) => (
            <div
              key={account.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedAccountId(account.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedAccountId(account.id);
                }
              }}
              className="card-interactive cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display font-semibold underline-offset-2 group-hover:underline">{account.tradingName}</h3>
                    <p className="text-xs text-muted-foreground">{account.legalName}</p>
                    {account.onboardingPipeline === "sales_intake" || account.onboardingPipeline === "brand_review" ? (
                      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                        Onboarding: {account.onboardingPipeline === "sales_intake" ? "Wholesaler review" : "Brand approval"}
                      </p>
                    ) : null}
                  </div>
                  <StatusBadge status={account.status} />
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{account.city || "—"}, {account.country || "—"}</div>
                  <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{account.email || "—"}</div>
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{account.phone || "—"}</div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  <span className="text-muted-foreground">Market:</span>{" "}
                  <span className="font-medium text-foreground">{marketAssignment(account)}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  <span className="text-muted-foreground">Sell-in history:</span>{" "}
                  <span className="font-medium text-foreground">
                    {salesByAccount[account.tradingName]?.orders ?? 0} orders · $
                    {(salesByAccount[account.tradingName]?.revenue ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <div className="text-xs"><span className="text-muted-foreground">Avg order:</span> <span className="font-medium">${(account.avgOrderSize || 0).toLocaleString()}</span></div>
                  <div className="text-xs"><span className="text-muted-foreground">Manager:</span> <span className="font-medium">{account.salesOwner || "—"}</span></div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(account.tags || []).map((tag) => (
                    <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-elevated overflow-hidden">
          <div className="p-6">
            <div className="-mx-4 overflow-x-auto touch-pan-x px-4 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[960px] text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Account</th>
                    <th className="pb-3 font-medium text-muted-foreground">Channel</th>
                    <th className="pb-3 font-medium text-muted-foreground">Market</th>
                    <th className="pb-3 font-medium text-muted-foreground">City</th>
                    <th className="pb-3 font-medium text-muted-foreground">Sell-in history</th>
                    <th className="pb-3 font-medium text-muted-foreground">Manager</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((acc) => (
                    <tr
                      key={acc.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedAccountId(acc.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedAccountId(acc.id);
                        }
                      }}
                      className="border-b last:border-0 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring cursor-pointer"
                    >
                      <td className="py-3 font-medium">
                        <span className="text-primary underline-offset-2 hover:underline">{acc.tradingName}</span>
                        <p className="text-[11px] font-normal capitalize text-muted-foreground">{acc.type}</p>
                      </td>
                      <td className="py-3">{channelLabel(acc.type)}</td>
                      <td className="py-3 text-xs text-muted-foreground">{marketAssignment(acc)}</td>
                      <td className="py-3">{acc.city}</td>
                      <td className="py-3 text-xs tabular-nums">
                        {salesByAccount[acc.tradingName]?.orders ?? 0} ord · $
                        {(salesByAccount[acc.tradingName]?.revenue ?? 0).toLocaleString()}
                      </td>
                      <td className="py-3">{acc.salesOwner}</td>
                      <td className="py-3"><StatusBadge status={acc.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
