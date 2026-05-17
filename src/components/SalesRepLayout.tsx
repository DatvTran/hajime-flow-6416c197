import { Suspense, memo, useEffect, useMemo, useState, useId } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAccounts, useAppData, useSalesOrders } from "@/contexts/AppDataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { resolveSalesRepLabelForSession } from "@/data/team-roster";
import { filterAccountsForSalesRep } from "@/lib/sales-rep-scope";
import { computeSalesRepOpportunities } from "@/lib/sales-rep-opportunities";
import { salesRepRouteChrome } from "@/lib/sales-rep-chrome";
import { isSidebarNavItemActive, navPathEndFlag } from "@/lib/sidebar-nav-active";
import { getSalesTargets } from "@/lib/api-v1-mutations";
import { cn } from "@/lib/utils";
import { HajimeLogo } from "@/components/HajimeLogo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OperatorOutletFallback } from "@/components/OperatorOutletFallback";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  ClipboardList,
  FileText,
  Home,
  ListOrdered,
  LogOut,
  MapPin,
  Menu,
  Monitor,
  Package,
  Plus,
  Star,
  Target,
  Users,
} from "lucide-react";

function userInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const navBtn =
  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-[hsl(35_14%_90%)]";
const navActive = "bg-sidebar-accent font-medium text-sidebar-primary text-[hsl(35_14%_90%)]";

type NavItem = { to: string; label: string; icon: LucideIcon; badge?: number; hash?: string };

const territoryItems: NavItem[] = [
  { to: "/sales", label: "Overview", icon: Home },
  { to: "/sales/accounts", label: "Accounts", icon: Users },
  { to: "/sales/opportunities", label: "Pipeline", icon: Target },
  { to: "/sales", label: "Route planner", icon: MapPin, hash: "#route-planner" },
];

const ordersItems: NavItem[] = [
  { to: "/sales/orders?tab=pending-review", label: "Draft orders", icon: FileText },
  { to: "/sales/orders", label: "Submitted orders", icon: ListOrdered },
  { to: "/inventory", label: "Product catalog", icon: Monitor },
  { to: "/inventory", label: "Distributor stock", icon: Package },
];

const performanceItems: NavItem[] = [
  { to: "/sales", label: "Incentive snapshot", icon: Star, hash: "#supply-chain-incentives" },
  { to: "/sales/reports", label: "Territory analytics", icon: BarChart3 },
  { to: "/sales/visits", label: "Visit log", icon: ClipboardList },
];

const ALL_SALES_NAV_URLS = [...territoryItems, ...ordersItems, ...performanceItems].map((i) => i.to);

function SalesRepQuotaPill({ repName }: { repName: string }) {
  const { salesOrders } = useSalesOrders();
  const gradId = useId().replace(/:/g, "");
  const quarter = Math.floor(new Date().getMonth() / 3) + 1;
  const year = new Date().getFullYear();
  const [targetAmount, setTargetAmount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void getSalesTargets({ sales_rep: repName, quarter, year })
      .then((res) => {
        if (cancelled) return;
        const row = res.data?.find((t) => t.sales_rep === repName && t.quarter === quarter && t.year === year);
        setTargetAmount(row?.target_amount ?? 0);
      })
      .catch(() => {
        if (!cancelled) setTargetAmount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [repName, quarter, year]);

  const achieved = useMemo(() => {
    const qs = new Date(year, (quarter - 1) * 3, 1);
    const qe = new Date(year, quarter * 3, 0, 23, 59, 59, 999);
    return salesOrders
      .filter((o) => o.salesRep === repName && o.status !== "cancelled" && o.status !== "draft")
      .filter((o) => {
        const d = new Date(o.orderDate);
        return d >= qs && d <= qe;
      })
      .reduce((s, o) => s + (o.totalValue ?? o.price ?? (o as { totalAmount?: number }).totalAmount ?? 0), 0);
  }, [salesOrders, repName, quarter, year]);

  const pct =
    targetAmount > 0 ? Math.min(100, Math.round((achieved / targetAmount) * 100)) : achieved > 0 ? 100 : 0;
  const r = 18;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <Link
      to="/sales/targets"
      className="mx-2.5 mb-1 mt-0 flex items-center gap-3 rounded-xl border border-[hsl(40_88%_42%/0.22)] bg-gradient-to-br from-[hsl(40_88%_42%/0.1)] to-[hsl(40_60%_50%/0.06)] px-3.5 py-3 no-underline transition-opacity hover:opacity-95"
    >
      <div className="relative size-11 shrink-0">
        <svg viewBox="0 0 44 44" className="size-11 -rotate-90" aria-hidden>
          <circle cx="22" cy="22" r={r} stroke="hsl(35 12% 20%)" strokeWidth="4" fill="none" />
          <circle
            cx="22"
            cy="22"
            r={r}
            stroke={`url(#salesRepQuotaGrad-${gradId})`}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
          />
          <defs>
            <linearGradient id={`salesRepQuotaGrad-${gradId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(40 88% 42%)" />
              <stop offset="100%" stopColor="hsl(32 78% 58%)" />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-semibold text-[hsl(40_80%_62%)]">
          {targetAmount > 0 || achieved > 0 ? `${pct}%` : "—"}
        </span>
      </div>
      <div className="min-w-0">
        <div className="text-[12px] font-semibold text-[hsl(40_80%_60%)]">Q{quarter} attainment</div>
        <div className="truncate text-[11px] text-[hsl(35_12%_42%)]">
          {targetAmount > 0
            ? `$${achieved.toLocaleString(undefined, { maximumFractionDigits: 0 })} of $${targetAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
            : achieved > 0
              ? `$${achieved.toLocaleString(undefined, { maximumFractionDigits: 0 })} sell-in (no HQ target yet)`
              : "Connect targets in Targets"}
        </div>
      </div>
    </Link>
  );
}

type SidebarNavProps = {
  onNavigate?: () => void;
  accountCount: number;
  pipelineCount: number;
  draftCount: number;
};

const SalesRepSidebarNav = memo(function SalesRepSidebarNav({
  onNavigate,
  accountCount,
  pipelineCount,
  draftCount,
}: SidebarNavProps) {
  const location = useLocation();

  const mergeBadge = (item: NavItem): number | undefined => {
    if (item.to === "/sales/accounts" && item.label === "Accounts") return accountCount > 0 ? accountCount : undefined;
    if (item.to === "/sales/opportunities") return pipelineCount > 0 ? pipelineCount : undefined;
    if (item.to.startsWith("/sales/orders") && item.label === "Draft orders") return draftCount > 0 ? draftCount : undefined;
    return undefined;
  };

  const linkClass = (active: boolean) => cn(navBtn, "touch-manipulation", active && navActive);

  const renderLink = (item: NavItem) => {
    const end = navPathEndFlag(item.to, ALL_SALES_NAV_URLS);
    let active = isSidebarNavItemActive(item.to, location.pathname, location.search, end);

    if (item.hash === "#route-planner") {
      active = location.pathname === "/sales" && location.hash === "#route-planner";
    } else if (item.hash === "#supply-chain-incentives") {
      active = location.pathname === "/sales" && location.hash === "#supply-chain-incentives";
    } else if (item.to === "/sales/visits") {
      active = location.pathname.startsWith("/sales/visits");
    } else if (item.to === "/sales" && !item.hash) {
      active =
        location.pathname === "/sales" &&
        location.hash !== "#route-planner" &&
        location.hash !== "#supply-chain-incentives" &&
        location.hash !== "#visit-log";
    }

    const badge = mergeBadge(item) ?? item.badge;
    const to = item.hash ? `${item.to}${item.hash}` : item.to;

    return (
      <Link key={item.label + to} to={to} onClick={onNavigate} className={linkClass(active)}>
        <item.icon className="h-[15px] w-[15px] shrink-0 opacity-90" strokeWidth={1.75} />
        <span className="flex-1">{item.label}</span>
        {badge != null && badge > 0 ? (
          <span
            className={cn(
              "rounded-full px-1.5 py-px font-mono text-[10px] font-semibold",
              item.label === "Pipeline"
                ? "bg-[hsl(158_56%_36%/0.15)] text-[hsl(158_56%_32%)]"
                : "bg-[hsl(40_88%_42%/0.18)] text-sidebar-primary",
            )}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </Link>
    );
  };

  return (
    <>
      <div className="space-y-0.5 px-2.5 pt-3.5">
        <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[hsl(var(--sidebar-foreground)/0.32)]">
          Territory
        </p>
        {territoryItems.map((item) => renderLink(item))}
      </div>
      <div className="mx-2.5 my-2.5 h-px bg-sidebar-border" />
      <div className="space-y-0.5 px-2.5 pt-1">
        <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[hsl(var(--sidebar-foreground)/0.32)]">
          Orders
        </p>
        {ordersItems.map((item) => renderLink(item))}
      </div>
      <div className="mx-2.5 my-2.5 h-px bg-sidebar-border" />
      <div className="space-y-0.5 px-2.5 pt-1 pb-2">
        <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[hsl(var(--sidebar-foreground)/0.32)]">
          Performance
        </p>
        {performanceItems.map((item) => renderLink(item))}
      </div>
    </>
  );
});

export function SalesRepLayout() {
  const { signOut, user } = useAuth();
  const { language, setLanguage, options, t } = useLanguage();
  const { pathname, search } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { salesOrders } = useSalesOrders();
  const { accounts } = useAccounts();
  const { data } = useAppData();
  const teamMembers = data.teamMembers ?? [];

  const rep = useMemo(
    () => resolveSalesRepLabelForSession(user?.email, user?.displayName ?? ""),
    [user?.email, user?.displayName],
  );

  const myAccounts = useMemo(() => {
    if (!user) return [];
    return filterAccountsForSalesRep(accounts, user, teamMembers);
  }, [accounts, teamMembers, user]);

  const pipelineCount = useMemo(
    () => computeSalesRepOpportunities(accounts, salesOrders, rep).length,
    [accounts, salesOrders, rep],
  );

  const draftCount = useMemo(
    () => salesOrders.filter((o) => o.status === "draft" && o.salesRep === rep).length,
    [salesOrders, rep],
  );

  const { section, page } = salesRepRouteChrome(pathname, search);
  const initials = user ? userInitials(user.displayName) : "?";

  const logoBlock = (
    <Link to="/sales" className="flex items-center gap-2.5 px-4 py-5 no-underline" onClick={() => setMobileOpen(false)}>
      <div className="flex size-[34px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sidebar-accent">
        <HajimeLogo variant="dark" className="h-[26px] w-[26px] object-contain" alt="" />
      </div>
      <div className="min-w-0 text-left">
        <div className="font-display text-base font-semibold leading-tight text-[hsl(35_14%_90%)]">Hajime</div>
        <div className="mt-px text-[10px] text-[hsl(35_12%_42%)]">Sales rep · Field territory</div>
      </div>
    </Link>
  );

  const userBlock = (
    <div className="mt-auto border-t border-sidebar-border px-2.5 pb-3 pt-3">
      <div className="flex items-center gap-2.5">
        <div className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-[11px] font-semibold text-[hsl(35_14%_82%)]">
          {initials}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="truncate text-xs font-medium text-[hsl(35_14%_88%)]">{user?.displayName ?? "Guest"}</div>
          <div className="truncate text-[10px] text-[hsl(35_12%_44%)]">{rep}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Select value={language} onValueChange={(v) => setLanguage(v as typeof language)}>
            <SelectTrigger className="h-8 border-sidebar-border bg-sidebar text-xs">
              <SelectValue placeholder={t("Choose language")} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-md p-2 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={() => signOut()}
          aria-label={t("Sign out")}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <aside className="relative hidden w-[256px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:h-svh lg:overflow-hidden">
        <div className="shrink-0 border-b border-sidebar-border">{logoBlock}</div>
        <div className="px-2.5 pt-3.5">
          <SalesRepQuotaPill repName={rep} />
        </div>
        <nav className="flex flex-1 flex-col overflow-y-auto pb-3 text-sm" aria-label="Sales rep">
          <SalesRepSidebarNav accountCount={myAccounts.length} pipelineCount={pipelineCount} draftCount={draftCount} />
        </nav>
        {userBlock}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:h-svh lg:overflow-hidden">
        <header className="glass-header sticky top-0 z-40 flex h-14 items-center gap-3 px-4 pt-[env(safe-area-inset-top)] lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="shrink-0 touch-manipulation" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[288px] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
              <div className="flex h-full flex-col overflow-hidden">
                <div className="shrink-0 border-b border-sidebar-border">{logoBlock}</div>
                <div className="px-2.5 pt-3.5">
                  <SalesRepQuotaPill repName={rep} />
                </div>
                <nav className="flex flex-1 flex-col overflow-y-auto pb-4 text-sm" aria-label="Sales menu">
                  <SalesRepSidebarNav
                    accountCount={myAccounts.length}
                    pipelineCount={pipelineCount}
                    draftCount={draftCount}
                    onNavigate={() => setMobileOpen(false)}
                  />
                </nav>
                {userBlock}
              </div>
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1 truncate font-display text-sm font-medium text-foreground/80">Hajime</div>
          <Button size="sm" className="h-8 shrink-0 bg-accent px-3 text-accent-foreground hover:bg-[hsl(32_78%_48%)]" asChild>
            <Link to="/sales/orders?new=1">
              <Plus className="mr-1 size-4" />
              Draft
            </Link>
          </Button>
        </header>

        <header className="glass-header sticky top-0 z-30 hidden h-[54px] shrink-0 items-center justify-between gap-4 px-8 lg:flex">
          <div className="text-[13px] text-muted-foreground">
            {section} › <strong className="font-medium text-foreground">{page}</strong>
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="sm" className="h-[30px] text-xs" asChild>
              <Link to="/sales#visit-log">Log visit</Link>
            </Button>
            <Button size="sm" className="h-9 gap-1 bg-accent px-4 text-accent-foreground hover:bg-[hsl(32_78%_48%)]" asChild>
              <Link to="/sales/orders?new=1">
                <Plus className="size-4" strokeWidth={2} />
                New draft order
              </Link>
            </Button>
          </div>
        </header>

        <div className="shrink-0 border-b border-border/40 px-4 py-2.5 text-[13px] text-muted-foreground lg:hidden">
          {section} › <strong className="font-medium text-foreground">{page}</strong>
        </div>

        <main className="scrollbar-thin mx-auto w-full max-w-[1260px] flex-1 overflow-y-auto px-[30px] pb-20 pt-[30px] lg:px-10 lg:pb-[80px]">
          <Suspense fallback={<OperatorOutletFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
