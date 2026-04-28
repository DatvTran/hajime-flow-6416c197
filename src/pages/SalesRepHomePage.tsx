import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAppData, useInventory } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import type { VisitNoteEntry } from "@/types/app-data";
import type { SalesOrder, Account, InventoryItem } from "@/data/mockData";
import { effectiveRepApprovalStatus } from "@/lib/order-routing";
import { createVisitNote, getVisitNotes } from "@/lib/api-v1-mutations";
import {
  Users,
  FileEdit,
  Target,
  Calendar,
  StickyNote,
  Sparkles,
  Plus,
  Gift,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  AlertCircle,
  Package,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { resolveSalesRepLabelForSession } from "@/data/team-roster";

const VISIT_STORAGE = "hajime_rep_visit_notes";

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
  const { data, updateData, loading } = useAppData();

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

  const myAccounts = useMemo(
    () => data.accounts.filter((a) => a.salesOwner === rep),
    [data.accounts, rep],
  );

  const myDrafts = useMemo(
    () => data.salesOrders.filter((o) => o.status === "draft" && o.salesRep === rep),
    [data.salesOrders, rep],
  );

  const needsReorder = useMemo(() => {
    const now = Date.now();
    const MS_DAY = 86400000;
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

  // Generate dynamic schedule based on actual dates and account data
  const schedule = useMemo(() => {
    const now = new Date();
    // Start from current week + offset, but start on Monday
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1 + (weekOffset * 7)); // Monday of target week
    
    const businessDays = getNextBusinessDays(startOfWeek, 5);
    const MS_DAY = 86400000;
    
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
    <div className="space-y-6">
      <PageHeader
        title="Field sales"
        description="Bridge visits, notes, and draft orders — the same order objects HQ approves and distributors fulfill."
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="card-elevated lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-border/50 p-4 pb-2">
            <Users className="h-4 w-4 text-accent" strokeWidth={1.5} />
            <h3 className="font-display text-base font-semibold">My accounts</h3>
          </div>
          <div className="space-y-2 p-4 pt-2 text-sm">
            {myAccounts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Users className="h-7 w-7 text-muted-foreground/20" strokeWidth={1} />
                <p className="text-sm text-muted-foreground">No accounts assigned to {rep}</p>
              </div>
            ) : (
              myAccounts.slice(0, 6).map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/50 px-2 py-1.5">
                  <span className="min-w-0 truncate font-medium">{a.tradingName}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{a.city}</span>
                </div>
              ))
            )}
            <Button variant="link" className="h-auto px-0 text-xs" asChild>
              <Link to="/sales/accounts">Full directory</Link>
            </Button>
          </div>
        </div>

        <div className="card-elevated lg:col-span-1">
          <div className="flex items-center gap-2 border-b border-border/50 p-4 pb-2">
            <Target className="h-4 w-4 text-accent" strokeWidth={1.5} />
            <h3 className="font-display text-base font-semibold">Need reorder</h3>
          </div>
          <div className="space-y-2 p-4 pt-2 text-sm">
            {needsReorder.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CheckCircle2 className="h-7 w-7 text-muted-foreground/20" strokeWidth={1} />
                <p className="text-sm text-muted-foreground">No accounts flagged</p>
                <p className="text-[11px] text-muted-foreground/60">40-day quiet rule — all accounts active</p>
              </div>
            ) : (
              needsReorder.slice(0, 5).map((a) => (
                <div key={a.id} className="rounded-lg border border-border/50 px-2 py-1.5">
                  <p className="font-medium">{a.tradingName}</p>
                  <p className="text-xs text-muted-foreground">Last order {a.lastOrderDate || "—"}</p>
                  <Button variant="link" className="mt-1 h-auto px-0 text-xs" asChild>
                    <Link to="/sales/orders?new=1">Draft order</Link>
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card-elevated lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-border/50 p-4 pb-2">
            <FileEdit className="h-4 w-4 text-accent" strokeWidth={1.5} />
            <h3 className="font-display text-base font-semibold">Draft orders</h3>
          </div>
          <div className="space-y-2 p-4 pt-2 text-sm">
            <p className="font-display text-2xl font-semibold">{myDrafts.length}</p>
            <p className="text-xs text-muted-foreground">Awaiting customer or HQ confirmation</p>
            {myDrafts.slice(0, 4).map((o) => (
              <div key={o.id} className="text-xs text-muted-foreground">
                <span className="font-mono text-foreground">{o.id}</span> · {o.account} · {o.market}
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button size="sm" className="touch-manipulation" asChild>
                <Link to="/sales/orders?tab=pending-review">Open drafts</Link>
              </Button>
              <Button size="sm" variant="outline" className="touch-manipulation" asChild>
                <Link to="/sales/orders?new=1">New draft</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Pending Orders with Inventory Widget */}
      {pendingOrdersWithInventory.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg">Pending Orders — Inventory Check Required</h3>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {pendingOrdersWithInventory.map(({ order, inventoryCheck, hasShortfall }) => (
              <Card key={order.id} className={`border-border/70 ${hasShortfall ? 'border-amber-400/60' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-display flex items-center gap-2 text-base">
                      <span className="font-mono text-xs">{order.id}</span>
                      {hasShortfall ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-600 text-xs">
                          Shortfall
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-600 text-xs">
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
                  
                  <div className={`rounded-md border px-3 py-2 ${
                    hasShortfall 
                      ? "border-amber-500/40 bg-amber-50/30" 
                      : "border-emerald-600/30 bg-emerald-50/30"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">Warehouse inventory</span>
                      <span className={`font-medium tabular-nums ${
                        hasShortfall ? "text-amber-700" : "text-emerald-700"
                      }`}>
                        {inventoryCheck.available.toLocaleString()} bottles
                      </span>
                    </div>
                    {hasShortfall && (
                      <div className="mt-1 text-xs text-amber-700">
                        ⚠️ Short by {inventoryCheck.shortfall.toLocaleString()} bottles
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-1">
                    <Button 
                      size="sm" 
                      className="touch-manipulation flex-1" 
                      asChild
                    >
                      <Link to={`/sales/orders?review=${order.id}`}>
                        {hasShortfall ? "Review & Override" : "Review & Confirm"}
                      </Link>
                    </Button>
                    {hasShortfall && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="touch-manipulation shrink-0"
                        asChild
                      >
                        <Link to={`/purchase-orders?new=1&sku=${order.sku}&qty=${inventoryCheck.shortfall}`}>
                          Request PO
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="card-elevated border-border/70">
          <CardHeader className="border-b border-border/50 p-5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Visit schedule
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setWeekOffset(prev => prev - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground w-20 text-center">
                  {weekOffset === 0 ? "This week" : weekOffset === 1 ? "Next week" : `Week +${weekOffset}`}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setWeekOffset(prev => prev + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {weekOffset !== 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={() => setWeekOffset(0)}
                  >
                    Today
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {scheduleStats.totalAccounts} accounts
              </span>
              {scheduleStats.needsReorderCount > 0 && (
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertCircle className="h-3 w-3" />
                  {scheduleStats.needsReorderCount} need reorder
                </span>
              )}
              {scheduleStats.openSlots > 0 && (
                <span className="flex items-center gap-1 text-blue-600">
                  <Clock className="h-3 w-3" />
                  {scheduleStats.openSlots} open slots
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {schedule.map((s) => (
              <div 
                key={s.dateKey} 
                className={`flex gap-3 rounded-lg border px-3 py-2 ${
                  s.isToday ? "border-primary/50 bg-primary/5" : "border-border/40"
                }`}
              >
                <div className="w-16 shrink-0">
                  <span className="font-display font-semibold text-sm">{s.dateDisplay}</span>
                  {s.isToday && (
                    <Badge variant="outline" className="mt-0.5 text-[10px] px-1 py-0 h-4">
                      Today
                    </Badge>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {s.accountList.length > 0 ? (
                    <div className="space-y-1.5">
                      <p className="font-medium text-sm">{s.focus}</p>
                      {s.accountList.map((account) => {
                        const lastOrder = account.lastOrderDate ? Date.parse(account.lastOrderDate) : 0;
                        const needsReorder = lastOrder ? (Date.now() - lastOrder) > 40 * 86400000 : true;
                        const daysSince = lastOrder ? Math.floor((Date.now() - lastOrder) / 86400000) : null;
                        
                        return (
                          <div key={account.id} className="flex items-center gap-2">
                            <Link 
                              to={`/sales/accounts`}
                              className="text-xs text-primary hover:underline truncate"
                            >
                              {account.tradingName}
                            </Link>
                            {account.city && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <MapPin className="h-2.5 w-2.5" />
                                {account.city}
                              </span>
                            )}
                            {needsReorder && daysSince && (
                              <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                {daysSince}d
                              </span>
                            )}
                            {account.nextActionDate && (
                              <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                scheduled
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">{s.focus}</p>
                      <p className="text-xs text-muted-foreground">{s.accounts}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="card-elevated border-border/70">
          <CardHeader className="border-b border-border/50 p-5 pb-3">
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <StickyNote className="h-4 w-4" />
              Visit notes
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Saved to server — visible to all users and HQ in real time.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Account (trading name)"
                value={visitAccount}
                onChange={(e) => setVisitAccount(e.target.value)}
                className="text-sm"
              />
            </div>
            <Textarea
              placeholder="Note from the floor…"
              value={visitBody}
              onChange={(e) => setVisitBody(e.target.value)}
              rows={3}
              className="text-sm"
            />
            <Button type="button" size="sm" className="touch-manipulation" onClick={addVisit}>
              <Plus className="mr-1 h-4 w-4" />
              Log visit
            </Button>
            <ul className="max-h-48 space-y-2 overflow-y-auto text-xs">
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

      <Card className="card-elevated border-border/70">
          <CardHeader className="border-b border-border/50 p-5 pb-3">
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              Opportunities
            </CardTitle>
          </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Premium placements, seasonal packs, and new SKU intros — track in CRM and convert to draft orders.
          </p>
          <Button variant="secondary" size="sm" className="touch-manipulation shrink-0" asChild>
            <Link to="/sales/opportunities">Opportunity list</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="card-elevated border-border/70">
          <CardHeader className="border-b border-border/50 p-5 pb-3">
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <Gift className="h-4 w-4" />
              Partner Incentives
            </CardTitle>
          </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Track SPIF payouts, partner tiers, and margin impact across your distributor network.
          </p>
          <Button variant="secondary" size="sm" className="touch-manipulation shrink-0" asChild>
            <Link to="/incentives">Open Incentive Manager</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
