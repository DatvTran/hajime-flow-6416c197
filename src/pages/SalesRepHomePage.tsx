import { Link, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAppData, useInventory } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { SalesRepSkeleton } from "@/components/skeletons";
import type { VisitNoteEntry } from "@/types/app-data";
import type { SalesOrder, Account, InventoryItem } from "@/data/mockData";
import { effectiveRepApprovalStatus } from "@/lib/order-routing";
import { createVisitNote } from "@/lib/api-v1-mutations";
import {
  Users,
  Target,
  Calendar,
  StickyNote,
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  AlertCircle,
  Package,
  TrendingUp,
  ShoppingCart,
  Star,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { resolveSalesRepLabelForSession } from "@/data/team-roster";
import { filterAccountsForSalesRep } from "@/lib/sales-rep-scope";
import { computeSalesRepOpportunities } from "@/lib/sales-rep-opportunities";
import { cn } from "@/lib/utils";
import { scrollSalesRepMainToHashWhenReady } from "@/lib/scroll-sales-rep-main";
import { StatusBadge } from "@/components/StatusBadge";
import { IncentiveProgressDashboardCard } from "@/components/incentives/IncentiveProgressDashboardCard";
import { useLanguage } from "@/contexts/LanguageContext";

const VISIT_STORAGE = "hajime_rep_visit_notes";
const MS_DAY = 86400000;

function orderTotalMoney(o: SalesOrder): number {
  return (
    (o as { totalValue?: number }).totalValue ??
    o.price ??
    (o as { totalAmount?: number }).totalAmount ??
    0
  );
}

function orderLineSummary(o: SalesOrder): string {
  if (o.lines?.length) {
    return o.lines.map((l) => `${l.quantityBottles}b · ${l.sku}`).join("; ");
  }
  return `${o.sku} · ${o.quantity} bottles`;
}

// NEW: Inventory check helper for pending orders
function usePendingOrdersWithInventory(
  orders: SalesOrder[], 
  accounts: Account[], 
  inventoryItems: InventoryItem[],
  rep: string
) {
  return useMemo(() => {
    // Get draft orders assigned to this rep that need approval
    const pendingOrders = orders.filter(o => 
      o.status === "draft" && 
      o.salesRep.trim() === rep.trim() &&
      effectiveRepApprovalStatus(o, accounts) === "pending"
    );
    
    return pendingOrders.map(order => {
      const warehouse = "Toronto Main";
      const needed = order.lines 
        ? order.lines.reduce((sum, line) => sum + line.quantityBottles, 0)
        : order.quantity;
      
      // Calculate available inventory
      let available = 0;
      if (order.lines && order.lines.length > 0) {
        for (const line of order.lines) {
          available += inventoryItems
            .filter((i: InventoryItem) => 
              i.sku === line.sku && 
              i.warehouse === warehouse && 
              i.status === "available" && 
              i.locationType === "distributor_warehouse"
            )
            .reduce((sum, i) => sum + i.quantityBottles, 0);
        }
      } else {
        available = inventoryItems
          .filter((i: InventoryItem) => 
            i.sku === order.sku && 
            i.warehouse === warehouse && 
            i.status === "available" && 
            i.locationType === "distributor_warehouse"
          )
          .reduce((sum, i) => sum + i.quantityBottles, 0);
      }
      
      const shortfall = Math.max(0, needed - available);
      
      return {
        order,
        inventoryCheck: {
          available,
          needed,
          shortfall,
          warehouse,
        },
        hasShortfall: shortfall > 0,
      };
    });
  }, [orders, accounts, inventoryItems, rep]);
}

function loadLegacyVisits(): Omit<VisitNoteEntry, "authorRep">[] {
  try {
    const raw = localStorage.getItem(VISIT_STORAGE);
    if (!raw) return [];
    const p = JSON.parse(raw) as { id: string; at: string; account: string; body: string }[];
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

// Generate next 5 business days from a given date
function getNextBusinessDays(startDate: Date, count: number): Date[] {
  const days: Date[] = [];
  const current = new Date(startDate);
  
  while (days.length < count) {
    const dayOfWeek = current.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  
  return days;
}

// Format date as YYYY-MM-DD for comparison
function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Format date for display
function formatDateDisplay(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  }).format(date);
}

// Check if date is today
function isToday(date: Date): boolean {
  const today = new Date();
  return formatDateKey(date) === formatDateKey(today);
}

export default function SalesRepHomePage() {
  const { t } = useLanguage();
  const { data, updateData, loading } = useAppData();
  const location = useLocation();

  const { items: inventoryItems } = useInventory();
  const { user } = useAuth();
  const rep = useMemo(
    () => resolveSalesRepLabelForSession(user?.email, user?.displayName ?? ""),
    [user?.email, user?.displayName],
  );
  
  // NEW: Get pending orders with inventory checks
  const pendingOrdersWithInventory = usePendingOrdersWithInventory(
    data.salesOrders,
    data.accounts,
    inventoryItems,
    rep
  );

  // Week navigation state
  const [weekOffset, setWeekOffset] = useState(0);

  const teamMembers = data.teamMembers ?? [];
  const myAccounts = useMemo(() => {
    if (!user) return [];
    return filterAccountsForSalesRep(data.accounts, user, teamMembers);
  }, [data.accounts, teamMembers, user]);

  const myDrafts = useMemo(
    () => data.salesOrders.filter((o) => o.status === "draft" && o.salesRep === rep),
    [data.salesOrders, rep],
  );

  const needsReorder = useMemo(() => {
    const now = Date.now();
    return myAccounts.filter((a) => {
      if (a.status !== "active") return false;
      if (!["retail", "bar", "restaurant", "hotel"].includes(a.type)) return false;
      const t = a.lastOrderDate ? Date.parse(a.lastOrderDate) : NaN;
      if (Number.isNaN(t)) return true;
      return now - t > 40 * MS_DAY;
    });
  }, [myAccounts]);

  const [visitAccount, setVisitAccount] = useState("");
  const [visitBody, setVisitBody] = useState("");
  const legacyMigrated = useRef(false);

  const visits = useMemo(() => {
    const all = data.visitNotes ?? [];
    return all
      .filter((v) => v.authorRep.trim() === rep.trim())
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [data.visitNotes, rep]);

  useEffect(() => {
    if (legacyMigrated.current) return;
    if ((data.visitNotes?.length ?? 0) > 0) {
      legacyMigrated.current = true;
      return;
    }
    const legacy = loadLegacyVisits();
    if (legacy.length === 0) {
      legacyMigrated.current = true;
      return;
    }
    legacyMigrated.current = true;
    updateData((d) => ({
      ...d,
      visitNotes: legacy.map((v) => ({ ...v, authorRep: rep })),
    }));
    try {
      localStorage.removeItem(VISIT_STORAGE);
    } catch {
      /* ignore */
    }
  }, [data.visitNotes, rep, updateData]);

  const hashScrollInstant = useRef(true);
  useEffect(() => {
    if (loading) return;
    const behavior: ScrollBehavior = hashScrollInstant.current ? "instant" : "smooth";
    hashScrollInstant.current = false;
    return scrollSalesRepMainToHashWhenReady(location.hash, { behavior });
  }, [location.hash, loading]);

  // Generate dynamic schedule based on actual dates and account data
  const schedule = useMemo(() => {
    const now = new Date();
    // Start from current week + offset, but start on Monday
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1 + (weekOffset * 7)); // Monday of target week
    
    const businessDays = getNextBusinessDays(startOfWeek, 5);

    // Create a map of date -> accounts scheduled for that date
    const dateToAccounts = new Map<string, typeof myAccounts>();
    
    for (const account of myAccounts) {
      // Check if account has a scheduled next action date
      if (account.nextActionDate) {
        const actionDate = new Date(account.nextActionDate);
        const dateKey = formatDateKey(actionDate);
        
        // Only include if it's within our visible week
        if (businessDays.some(d => formatDateKey(d) === dateKey)) {
          if (!dateToAccounts.has(dateKey)) {
            dateToAccounts.set(dateKey, []);
          }
          dateToAccounts.get(dateKey)!.push(account);
        }
      }
    }
    
    // Priority queue for unscheduled accounts
    const unscheduledAccounts = myAccounts.filter(a => {
      if (!a.nextActionDate) return true;
      const actionDate = new Date(a.nextActionDate);
      return !businessDays.some(d => formatDateKey(d) === formatDateKey(actionDate));
    });
    
    // Sort unscheduled by priority (needs reorder first, then by last order date)
    const prioritizedUnscheduled = [...unscheduledAccounts].sort((a, b) => {
      const aLastOrder = a.lastOrderDate ? Date.parse(a.lastOrderDate) : 0;
      const bLastOrder = b.lastOrderDate ? Date.parse(b.lastOrderDate) : 0;
      const aNeedsReorder = aLastOrder ? (Date.now() - aLastOrder) > 40 * MS_DAY : true;
      const bNeedsReorder = bLastOrder ? (Date.now() - bLastOrder) > 40 * MS_DAY : true;
      
      if (aNeedsReorder && !bNeedsReorder) return -1;
      if (!aNeedsReorder && bNeedsReorder) return 1;
      
      if (aLastOrder && bLastOrder) return aLastOrder - bLastOrder;
      if (aLastOrder) return -1;
      if (bLastOrder) return -1;
      
      return 0;
    });
    
    // Build schedule for each business day
    let unscheduledIndex = 0;
    
    return businessDays.map((date) => {
      const dateKey = formatDateKey(date);
      const scheduledAccounts = dateToAccounts.get(dateKey) || [];
      
      // If no scheduled accounts, fill with high-priority unscheduled account
      let fillAccount: typeof myAccounts[0] | null = null;
      if (scheduledAccounts.length === 0 && unscheduledIndex < prioritizedUnscheduled.length) {
        fillAccount = prioritizedUnscheduled[unscheduledIndex++];
      }
      
      const accountsToShow = scheduledAccounts.length > 0 ? scheduledAccounts : fillAccount ? [fillAccount] : [];
      
      if (accountsToShow.length === 0) {
        return {
          date,
          dateKey,
          dateDisplay: formatDateDisplay(date),
          isToday: isToday(date),
          focus: "Open slot",
          accounts: "No account scheduled — use Opportunities to find prospects",
          accountList: [],
          hasOpenSlot: true,
        };
      }
      
      // Build focus string from accounts
      const cities = [...new Set(accountsToShow.map(a => a.city).filter(Boolean))];
      const types = [...new Set(accountsToShow.map(a => a.type).filter(Boolean))];
      
      const needsReorderCount = accountsToShow.filter(a => {
        const lastOrder = a.lastOrderDate ? Date.parse(a.lastOrderDate) : 0;
        return lastOrder ? (Date.now() - lastOrder) > 40 * MS_DAY : true;
      }).length;
      
      const focusParts: string[] = [];
      if (cities.length > 0) focusParts.push(cities.join(", "));
      if (types.length > 0) focusParts.push(types.join(", "));
      if (needsReorderCount > 0) focusParts.push(`⚠️ ${needsReorderCount} need reorder`);
      
      return {
        date,
        dateKey,
        dateDisplay: formatDateDisplay(date),
        isToday: isToday(date),
        focus: focusParts.join(" · ") || "Account visits",
        accounts: accountsToShow.length === 1 
          ? accountsToShow[0].tradingName 
          : `${accountsToShow.length} accounts scheduled`,
        accountList: accountsToShow,
        hasOpenSlot: false,
      };
    });
  }, [myAccounts, weekOffset]);

  // Stats for the schedule
  const scheduleStats = useMemo(() => {
    const totalAccounts = schedule.reduce((sum, s) => sum + s.accountList.length, 0);
    const openSlots = schedule.filter(s => s.hasOpenSlot).length;
    const needsReorderCount = schedule.reduce((sum, s) => {
      return sum + s.accountList.filter(a => {
        const lastOrder = a.lastOrderDate ? Date.parse(a.lastOrderDate) : 0;
        return lastOrder ? (Date.now() - lastOrder) > 40 * MS_DAY : true;
      }).length;
    }, 0);
    
    return { totalAccounts, openSlots, needsReorderCount };
  }, [schedule]);

  const opportunities = useMemo(
    () => computeSalesRepOpportunities(data.accounts, data.salesOrders, rep),
    [data.accounts, data.salesOrders, rep],
  );

  const pipelineValue = useMemo(() => opportunities.reduce((s, o) => s + o.value, 0), [opportunities]);

  const quarterSellIn = useMemo(() => {
    const q = Math.floor(new Date().getMonth() / 3) + 1;
    const y = new Date().getFullYear();
    const qs = new Date(y, (q - 1) * 3, 1);
    const qe = new Date(y, q * 3, 0, 23, 59, 59, 999);
    return data.salesOrders
      .filter((o) => o.salesRep === rep && !["cancelled", "draft"].includes(o.status))
      .filter((o) => {
        const d = new Date(o.orderDate);
        return d >= qs && d <= qe;
      })
      .reduce((s, o) => s + ((o as { totalValue?: number }).totalValue ?? o.price ?? 0), 0);
  }, [data.salesOrders, rep]);

  const recentSubmitted = useMemo(
    () =>
      [...data.salesOrders]
        .filter((o) => o.salesRep === rep && o.status !== "draft")
        .sort((a, b) => Date.parse(b.orderDate) - Date.parse(a.orderDate))
        .slice(0, 5),
    [data.salesOrders, rep],
  );

  const todayRouteRow = useMemo(() => schedule.find((s) => s.isToday), [schedule]);

  const slippingOnRoute = useMemo(() => {
    const row = schedule.find((s) => s.isToday);
    if (!row?.accountList.length) return 0;
    return row.accountList.filter((a) => {
      const t = a.lastOrderDate ? Date.parse(a.lastOrderDate) : NaN;
      return Number.isNaN(t) || Date.now() - t > 40 * MS_DAY;
    }).length;
  }, [schedule]);

  const firstName = user?.displayName?.trim().split(/\s+/)[0] ?? "there";

  const addVisit = async () => {
    const accountName = visitAccount.trim() || (myAccounts[0]?.tradingName ?? "");
    const body = visitBody.trim();
    if (!accountName || !body) {
      toast.error("Add account and note");
      return;
    }

    // Find account by trading name to get account_id for API
    const account = myAccounts.find(
      (a) => a.tradingName?.toLowerCase() === accountName.toLowerCase()
    );

    try {
      // Save to backend API
      await createVisitNote({
        account_id: account?.id || accountName,
        note: body,
        visit_date: new Date().toISOString(),
      });

      // Also update local state for immediate UI feedback
      const row: VisitNoteEntry = {
        id: `v-${Date.now()}`,
        at: new Date().toISOString().slice(0, 16).replace("T", " "),
        account: accountName,
        body,
        authorRep: rep,
      };
      updateData((d) => ({
        ...d,
        visitNotes: [row, ...(d.visitNotes ?? [])],
      }));

      setVisitBody("");
      toast.success("Visit logged", { description: "Saved to server — visible to all users." });
    } catch (err) {
      console.error("[SalesRepHome] Failed to save visit note:", err);
      toast.error("Failed to save visit", { description: "Will retry in background." });

      // Still save locally so data isn't lost
      const row: VisitNoteEntry = {
        id: `v-${Date.now()}`,
        at: new Date().toISOString().slice(0, 16).replace("T", " "),
        account: accountName,
        body,
        authorRep: rep,
      };
      updateData((d) => ({
        ...d,
        visitNotes: [row, ...(d.visitNotes ?? [])],
      }));
      setVisitBody("");
    }
  };

  if (loading) {
    return <SalesRepSkeleton />;
  }

  return (
    <div className="animate-enter space-y-7 md:space-y-8">
      {/* Hero — sales-rep-app.html */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-foreground sm:text-[30px]">
            Morning, {firstName}.
          </h1>
          <p className="mt-1 max-w-[52ch] text-[13px] text-muted-foreground leading-relaxed">
            {(todayRouteRow?.accountList.length ?? 0) > 0
              ? `${todayRouteRow!.accountList.length} stop${todayRouteRow!.accountList.length !== 1 ? "s" : ""} on today's route`
              : "No stops pinned for today — open your week schedule or Pipeline"}
            {slippingOnRoute > 0 ? ` · ${slippingOnRoute} account${slippingOnRoute !== 1 ? "s" : ""} past cadence` : ""}
            {quarterSellIn > 0
              ? ` · $${quarterSellIn.toLocaleString(undefined, { maximumFractionDigits: 0 })} sell-in this quarter`
              : ""}
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" size="sm" className="h-9 touch-manipulation" asChild>
            <Link to="/sales#route-planner">{t("Open route")}</Link>
          </Button>
          <Button size="sm" className="h-9 touch-manipulation bg-primary text-primary-foreground hover:bg-primary/90" asChild>
            <Link to="/sales/reports">{t("Analytics")}</Link>
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex flex-col gap-1 rounded-[14px] border border-border/70 bg-card p-[18px] shadow-[var(--shadow-soft)] transition-all hover:-translate-y-px hover:shadow-md">
          <div className="mb-2 flex size-[34px] items-center justify-center rounded-lg bg-[hsl(40_88%_42%/0.1)] text-[hsl(40_88%_36%)]">
            <Users className="size-[17px]" strokeWidth={1.75} />
          </div>
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{t("Accounts managed")}</p>
          <p className="font-display text-[26px] font-semibold tracking-[-0.02em] tabular-nums">{myAccounts.length}</p>
          <p className="text-xs text-muted-foreground">{t("Assigned to you in CRM")}</p>
        </div>
        <div className="flex flex-col gap-1 rounded-[14px] border border-border/70 bg-card p-[18px] shadow-[var(--shadow-soft)] transition-all hover:-translate-y-px hover:shadow-md">
          <div className="mb-2 flex size-[34px] items-center justify-center rounded-lg bg-[hsl(158_56%_36%/0.1)] text-[hsl(158_56%_30%)]">
            <ShoppingCart className="size-[17px]" strokeWidth={1.75} />
          </div>
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{t("Quarter sell-in")}</p>
          <p className="font-display text-[26px] font-semibold tracking-[-0.02em] tabular-nums">
            ${quarterSellIn.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-muted-foreground">{t("Submitted orders (excl. drafts)")}</p>
          {quarterSellIn > 0 ? (
            <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-[hsl(158_56%_32%)]">
              <TrendingUp className="size-3" aria-hidden />
              {t("On the board")}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-1 rounded-[14px] border border-border/70 bg-card p-[18px] shadow-[var(--shadow-soft)] transition-all hover:-translate-y-px hover:shadow-md">
          <div className="mb-2 flex size-[34px] items-center justify-center rounded-lg bg-[hsl(215_72%_50%/0.1)] text-[hsl(215_72%_42%)]">
            <Target className="size-[17px]" strokeWidth={1.75} />
          </div>
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{t("Pipeline signals")}</p>
          <p className="font-display text-[26px] font-semibold tracking-[-0.02em] tabular-nums">
            ${pipelineValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-muted-foreground">
            {opportunities.length} open opportunit{opportunities.length !== 1 ? "ies" : "y"}
          </p>
        </div>
        <div className="flex flex-col gap-1 rounded-[14px] border border-border/70 bg-card p-[18px] shadow-[var(--shadow-soft)] transition-all hover:-translate-y-px hover:shadow-md">
          <div className="mb-2 flex size-[34px] items-center justify-center rounded-lg bg-[hsl(24_10%_10%/0.07)] text-[hsl(24_10%_18%)]">
            <Star className="size-[17px]" strokeWidth={1.75} />
          </div>
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{t("Draft queue")}</p>
          <p className="font-display text-[26px] font-semibold tracking-[-0.02em] tabular-nums">{myDrafts.length}</p>
          <p className="text-xs text-muted-foreground">{t("Awaiting submit / approval")}</p>
        </div>
      </div>

      {/* Incentive program */}
      <div>
        <div className="mb-3.5 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-[19px] font-medium tracking-[-0.01em] text-foreground">{t("Incentive program")}</h2>
          <Link
            to="/sales#supply-chain-incentives"
            className="text-xs font-medium text-accent hover:underline"
          >
            {t("Full program →")}
          </Link>
        </div>
        <div id="supply-chain-incentives">
          <IncentiveProgressDashboardCard />
        </div>
      </div>

      {/* Today's route + Pipeline */}
      <div id="route-planner" className="grid scroll-mt-28 gap-[18px] lg:grid-cols-[1.3fr_1fr]">
        <div className="overflow-hidden rounded-[14px] border border-border/70 bg-card shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
            <div>
              <p className="text-sm font-semibold">{t("Today's route")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {todayRouteRow?.dateDisplay ?? formatDateDisplay(new Date())}
                {todayRouteRow?.accountList.length
                  ? ` · ${todayRouteRow.accountList.length} stop${todayRouteRow.accountList.length !== 1 ? "s" : ""}`
                  : ""}
              </p>
            </div>
            <Button variant="outline" size="sm" className="h-[30px] text-xs touch-manipulation" asChild>
              <Link to="/sales/accounts">{t("Directory")}</Link>
            </Button>
          </div>
          {!todayRouteRow?.accountList.length ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No accounts scheduled today — check the week view below or Pipeline for outreach targets.
            </div>
          ) : (
            todayRouteRow.accountList.map((account, i) => {
              const lastOrder = account.lastOrderDate ? Date.parse(account.lastOrderDate) : NaN;
              const slipping =
                Number.isNaN(lastOrder) || Date.now() - lastOrder > 40 * 86400000;
              const daysSince = lastOrder && !Number.isNaN(lastOrder)
                ? Math.floor((Date.now() - lastOrder) / 86400000)
                : null;
              return (
                <Link
                  key={account.id}
                  to="/sales/accounts"
                  className="flex items-center gap-3 border-b border-border/40 px-5 py-3 transition-colors last:border-b-0 hover:bg-muted/30"
                >
                  <div
                    className={cn(
                      "flex size-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white",
                      slipping ? "bg-foreground" : "bg-[hsl(158_56%_36%)]",
                    )}
                  >
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium">{account.tradingName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {account.type} · {account.city ?? "—"}
                      {daysSince != null ? ` · last order ${daysSince}d` : ""}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium sm:inline-flex",
                      slipping
                        ? "border-amber-500/25 bg-[hsl(38_90%_50%/0.08)] text-[hsl(30_80%_30%)]"
                        : "border-emerald-500/20 bg-[hsl(158_56%_36%/0.08)] text-[hsl(158_56%_26%)]",
                    )}
                  >
                    {slipping ? "Slipping" : "On cadence"}
                  </span>
                  <ChevronRight className="size-[14px] shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              );
            })
          )}
        </div>

        <div className="overflow-hidden rounded-[14px] border border-border/70 bg-card shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
            <div>
              <p className="text-sm font-semibold">Open pipeline</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                ${pipelineValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} · {opportunities.length} signals
              </p>
            </div>
            <Button variant="outline" size="sm" className="h-[30px] text-xs touch-manipulation" asChild>
              <Link to="/sales/opportunities">View pipeline</Link>
            </Button>
          </div>
          {!opportunities.length ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">No pipeline signals — territory looks quiet.</div>
          ) : (
            opportunities.slice(0, 6).map((opp) => (
              <Link
                key={opp.id}
                to="/sales/opportunities"
                className="flex gap-2.5 border-b border-border/40 px-5 py-3 transition-colors last:border-b-0 hover:bg-muted/30"
              >
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    opp.priority === "high"
                      ? "bg-[hsl(158_56%_36%)]"
                      : opp.type === "prospect"
                        ? "bg-[hsl(215_72%_50%)]"
                        : "bg-[hsl(38_90%_50%)]",
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium">{opp.account}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{opp.reason}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-xs font-medium">${opp.value.toLocaleString()}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{opp.suggestedAction}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Recent submitted orders */}
      <div>
        <div className="mb-3.5 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-[19px] font-medium tracking-[-0.01em] text-foreground">Recent submitted orders</h2>
          <Link to="/sales/orders" className="text-xs font-medium text-accent hover:underline">
            All orders →
          </Link>
        </div>
        <div className="overflow-hidden rounded-[14px] border border-border/70 bg-card shadow-[var(--shadow-soft)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-border/50 bg-muted/50">
                  {["Order", "Account", "Items", "Total", "Est. commission", "Status"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentSubmitted.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No submitted orders yet — create a draft from an account visit.
                    </td>
                  </tr>
                ) : (
                  recentSubmitted.map((o) => {
                    const total = orderTotalMoney(o);
                    const estComm = Math.round(total * 0.12);
                    return (
                      <tr key={o.id} className="cursor-pointer border-b border-border/40 transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <Link to="/sales/orders" className="font-mono text-xs font-medium text-accent hover:underline">
                            {o.orderNumber ?? o.id}
                          </Link>
                        </td>
                        <td className="px-4 py-3 font-medium">{o.account}</td>
                        <td className="max-w-[240px] px-4 py-3 text-xs text-muted-foreground">
                          <span className="line-clamp-2">{orderLineSummary(o)}</span>
                        </td>
                        <td className="px-4 py-3 font-mono font-medium tabular-nums">
                          ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-medium text-accent tabular-nums">
                          ~${estComm.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={o.status} size="xs" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pending approval + inventory */}
      {pendingOrdersWithInventory.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Package className="size-5 text-primary" aria-hidden />
            <h2 className="font-display text-[19px] font-medium tracking-[-0.01em]">Pending approval — inventory check</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {pendingOrdersWithInventory.map(({ order, inventoryCheck, hasShortfall }) => (
              <Card key={order.id} className={cn("border-border/70", hasShortfall && "border-amber-400/60")}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-display flex items-center gap-2 text-base">
                      <span className="font-mono text-xs">{order.id}</span>
                      {hasShortfall ? (
                        <Badge variant="outline" className="border-amber-600 text-xs text-amber-600">
                          Shortfall
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-emerald-600 text-xs text-emerald-600">
                          Ready
                        </Badge>
                      )}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account</span>
                    <span className="font-medium">{order.account}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Market</span>
                    <span>{order.market}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="font-mono">{inventoryCheck.needed.toLocaleString()} bottles</span>
                  </div>
                  <div
                    className={cn(
                      "rounded-md border px-3 py-2",
                      hasShortfall ? "border-amber-500/40 bg-amber-50/30" : "border-emerald-600/30 bg-emerald-50/30",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Warehouse inventory</span>
                      <span className={cn("font-medium tabular-nums", hasShortfall ? "text-amber-700" : "text-emerald-700")}>
                        {inventoryCheck.available.toLocaleString()} bottles
                      </span>
                    </div>
                    {hasShortfall ? (
                      <div className="mt-1 text-xs text-amber-700">
                        Short by {inventoryCheck.shortfall.toLocaleString()} bottles
                      </div>
                    ) : null}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="touch-manipulation flex-1" asChild>
                      <Link to={`/sales/orders?review=${order.id}`}>
                        {hasShortfall ? "Review & override" : "Review & confirm"}
                      </Link>
                    </Button>
                    {hasShortfall ? (
                      <Button size="sm" variant="outline" className="touch-manipulation shrink-0" asChild>
                        <Link to={`/purchase-orders?new=1&sku=${order.sku}&qty=${inventoryCheck.shortfall}`}>
                          Request PO
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {/* Week schedule + Visit log */}
      <div className="grid gap-[18px] lg:grid-cols-2">
        <Card className="border-border/70 shadow-[var(--shadow-soft)]">
          <CardHeader className="border-b border-border/50 p-5 pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="font-display flex items-center gap-2 text-base">
                <Calendar className="size-4" aria-hidden />
                Week schedule
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="size-7 touch-manipulation" onClick={() => setWeekOffset((p) => p - 1)}>
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="w-20 text-center text-xs text-muted-foreground">
                  {weekOffset === 0 ? "This week" : weekOffset === 1 ? "Next week" : `Week +${weekOffset}`}
                </span>
                <Button variant="ghost" size="icon" className="size-7 touch-manipulation" onClick={() => setWeekOffset((p) => p + 1)}>
                  <ChevronRight className="size-4" />
                </Button>
                {weekOffset !== 0 ? (
                  <Button variant="ghost" size="sm" className="h-7 text-xs touch-manipulation" onClick={() => setWeekOffset(0)}>
                    Today
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="size-3" />
                {scheduleStats.totalAccounts} accounts
              </span>
              {scheduleStats.needsReorderCount > 0 ? (
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertCircle className="size-3" />
                  {scheduleStats.needsReorderCount} need reorder
                </span>
              ) : null}
              {scheduleStats.openSlots > 0 ? (
                <span className="flex items-center gap-1 text-blue-600">
                  <Clock className="size-3" />
                  {scheduleStats.openSlots} open slots
                </span>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-3 text-sm">
            {schedule.map((s) => (
              <div
                key={s.dateKey}
                className={cn(
                  "flex gap-3 rounded-lg border px-3 py-2",
                  s.isToday ? "border-primary/50 bg-primary/5" : "border-border/40",
                )}
              >
                <div className="w-16 shrink-0">
                  <span className="font-display text-sm font-semibold">{s.dateDisplay}</span>
                  {s.isToday ? (
                    <Badge variant="outline" className="mt-0.5 h-4 px-1 py-0 text-[10px]">
                      Today
                    </Badge>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  {s.accountList.length > 0 ? (
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium">{s.focus}</p>
                      {s.accountList.map((account) => {
                        const lastOrder = account.lastOrderDate ? Date.parse(account.lastOrderDate) : 0;
                        const accountNeedsReorder = lastOrder ? Date.now() - lastOrder > 40 * 86400000 : true;
                        const daysSince = lastOrder ? Math.floor((Date.now() - lastOrder) / 86400000) : null;
                        return (
                          <div key={account.id} className="flex flex-wrap items-center gap-2">
                            <Link to="/sales/accounts" className="truncate text-xs text-primary hover:underline">
                              {account.tradingName}
                            </Link>
                            {account.city ? (
                              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                <MapPin className="size-2.5" />
                                {account.city}
                              </span>
                            ) : null}
                            {accountNeedsReorder && daysSince != null ? (
                              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-600">
                                {daysSince}d
                              </span>
                            ) : null}
                            {account.nextActionDate ? (
                              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600">scheduled</span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{s.focus}</p>
                      <p className="text-xs text-muted-foreground">{s.accounts}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card id="visit-log" className="scroll-mt-28 border-border/70 shadow-[var(--shadow-soft)]">
          <CardHeader className="border-b border-border/50 p-5 pb-3">
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <StickyNote className="size-4" aria-hidden />
              Visit log
            </CardTitle>
            <p className="text-xs text-muted-foreground">Saved to server — visible to HQ in near real time.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Account (trading name)"
              value={visitAccount}
              onChange={(e) => setVisitAccount(e.target.value)}
              className="text-sm"
            />
            <Textarea
              placeholder="Note from the floor…"
              value={visitBody}
              onChange={(e) => setVisitBody(e.target.value)}
              rows={3}
              className="text-sm"
            />
            <Button type="button" size="sm" className="touch-manipulation" onClick={addVisit}>
              <Plus className="mr-1 size-4" />
              Log visit
            </Button>
            <ul className="max-h-52 space-y-2 overflow-y-auto text-xs">
              {visits.map((v) => (
                <li key={v.id} className="rounded-md border border-border/50 p-2">
                  <span className="text-muted-foreground">{v.at}</span> · <span className="font-medium">{v.account}</span>
                  <p className="mt-1 text-muted-foreground">{v.body}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {needsReorder.length > 0 ? (
        <div className="rounded-[14px] border border-border/60 bg-muted/20 px-5 py-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{needsReorder.length} account{needsReorder.length !== 1 ? "s" : ""}</span> past the
          40‑day reorder signal —{" "}
          <Link to="/sales/opportunities" className="font-medium text-accent hover:underline">
            Review pipeline
          </Link>
        </div>
      ) : null}
    </div>
  );
}
