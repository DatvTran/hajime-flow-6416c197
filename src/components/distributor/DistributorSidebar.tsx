/**
 * Sidebar chrome from Hajime Design System distributor-app.html
 * (.side, .logo-row, .perf-pill, .nav-section, .side-footer)
 */
import { memo, useEffect, useId, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData, usePurchaseOrders, useSalesOrders } from "@/contexts/AppDataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelect } from "@/components/LanguageSelect";
import { filterAccountsForDistributor, filterTeamMembersForDistributor } from "@/lib/distributor-scope";
import { isSidebarNavItemActive, navPathEndFlag } from "@/lib/sidebar-nav-active";
import { getMySupplyChainIncentiveProgress } from "@/lib/api-v1-mutations";
import { cn } from "@/lib/utils";
import { HajimeLogo } from "@/components/HajimeLogo";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Calendar,
  FileText,
  HelpCircle,
  Home,
  LogOut,
  Package,
  Star,
  Truck,
  UserPlus,
  Users,
  Warehouse,
} from "lucide-react";

function userInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  badgeTone?: "red" | "amber" | "green";
  hash?: string;
};

const operationsItems: NavItem[] = [
  { to: "/distributor", label: "Dashboard", icon: Home },
  { to: "/distributor/purchase-orders", label: "Purchase orders", icon: FileText, badgeTone: "red" },
  { to: "/distributor/inventory", label: "Inventory", icon: Warehouse },
  { to: "/distributor/pick-pack", label: "Pick & pack", icon: Package, badgeTone: "amber" },
];

const logisticsItems: NavItem[] = [
  { to: "/distributor/shipments", label: "Active shipments", icon: Truck, badgeTone: "green" },
  { to: "/distributor", label: "Delivery schedule", icon: Calendar, hash: "#delivery-schedule" },
  { to: "/distributor/accounts", label: "Retail accounts", icon: Users, badgeTone: "red" },
  { to: "/distributor/crm", label: "Sales reps", icon: UserPlus },
];

const performanceItems: NavItem[] = [
  { to: "/distributor/partner-program", label: "Partner program", icon: Star },
  { to: "/distributor/reports", label: "Analytics & reports", icon: BarChart3 },
  { to: "/distributor/alerts", label: "Support", icon: HelpCircle },
];

const ALL_DIST_NAV_URLS = [...operationsItems, ...logisticsItems, ...performanceItems].map((i) => i.to);

const navItemBase =
  "navitem flex items-center gap-[9px] rounded-md px-2.5 py-2 text-[13px] text-[hsl(var(--sidebar-foreground)/0.68)] transition-[background,color] duration-[140ms] hover:bg-sidebar-accent hover:text-[hsl(35_14%_90%)]";
const navItemActive =
  "bg-sidebar-accent font-medium text-sidebar-primary text-[hsl(35_14%_90%)]";

const badgeStyles = {
  red: "nb nb-red bg-[hsl(0_68%_48%/0.14)] text-[hsl(0_68%_42%)]",
  amber: "nb nb-amber bg-[hsl(38_90%_50%/0.14)] text-[hsl(30_80%_34%)]",
  green: "nb nb-green bg-[hsl(158_56%_36%/0.15)] text-[hsl(158_56%_32%)]",
} as const;

function DistributorPerfPill() {
  const gradId = useId().replace(/:/g, "");
  const [pct, setPct] = useState(90);
  const [title, setTitle] = useState("Gold Partner · Q2");
  const [subtitle, setSubtitle] = useState("Loading tier progress…");

  useEffect(() => {
    let cancelled = false;
    void getMySupplyChainIncentiveProgress()
      .then((res) => {
        if (cancelled || res.data?.scope !== "distributor") return;
        const p = res.data.partner;
        const tier = p?.quarterlyPerformanceTier ?? p?.tier ?? "Gold";
        const quarter = Math.floor(new Date().getMonth() / 3) + 1;
        setTitle(`${tier} Partner · Q${quarter}`);
        const cases = p?.quarterlyCasesSold ?? 0;
        const goal = Math.max(cases + 153, 400);
        const progress = Math.min(100, Math.round((cases / goal) * 100));
        setPct(progress);
        setSubtitle(`${100 - progress}% to next tier milestone`);
      })
      .catch(() => {
        if (!cancelled) {
          setTitle("Gold Partner · Q2");
          setSubtitle("90% to Platinum tier");
          setPct(90);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const r = 18;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div className="px-2.5 pt-3.5">
      <Link
        to="/distributor/partner-program"
        className="perf-pill mx-2.5 mt-0 flex items-center gap-3 rounded-xl border border-[hsl(40_88%_42%/0.22)] bg-gradient-to-br from-[hsl(40_88%_42%/0.1)] to-[hsl(40_60%_50%/0.06)] px-3.5 py-3 no-underline"
      >
        <div className="p-ring relative size-11 shrink-0">
          <svg viewBox="0 0 44 44" className="size-11 -rotate-90" aria-hidden>
            <circle cx="22" cy="22" r={r} stroke="hsl(35 12% 20%)" strokeWidth="4" fill="none" />
            <circle
              cx="22"
              cy="22"
              r={r}
              stroke={`url(#distPerfGrad-${gradId})`}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${c}`}
            />
            <defs>
              <linearGradient id={`distPerfGrad-${gradId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(40,88%,42%)" />
                <stop offset="100%" stopColor="hsl(32,78%,58%)" />
              </linearGradient>
            </defs>
          </svg>
          <span className="p-ring-lbl absolute inset-0 flex items-center justify-center font-mono text-[10px] font-semibold text-[hsl(40_80%_62%)]">
            {pct}%
          </span>
        </div>
        <div className="p-info min-w-0">
          <div className="pt text-[12px] font-semibold text-[hsl(40_80%_60%)]">{title}</div>
          <div className="ps mt-px text-[11px] text-[hsl(35_12%_42%)]">{subtitle}</div>
        </div>
      </Link>
    </div>
  );
}

type NavSectionProps = {
  label: string;
  items: NavItem[];
  sectionClassName?: string;
  openPoCount: number;
  pickCount: number;
  shipmentCount: number;
  pendingAccountCount: number;
  onNavigate?: () => void;
};

function NavSection({
  label,
  items,
  sectionClassName,
  openPoCount,
  pickCount,
  shipmentCount,
  pendingAccountCount,
  onNavigate,
}: NavSectionProps) {
  const location = useLocation();
  const { t } = useLanguage();

  const badgeFor = (item: NavItem): number | undefined => {
    if (item.to === "/distributor/purchase-orders" && openPoCount > 0) return openPoCount;
    if (item.to === "/distributor/pick-pack" && pickCount > 0) return pickCount;
    if (item.to === "/distributor/shipments" && shipmentCount > 0) return shipmentCount;
    if (item.to === "/distributor/accounts" && pendingAccountCount > 0) return pendingAccountCount;
    return undefined;
  };

  return (
    <nav className={cn("nav-section flex flex-col gap-0.5 px-2.5 pb-1.5", sectionClassName)} aria-label={t(label)}>
      <div className="nav-label px-2 pb-1.5 pt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[hsl(var(--sidebar-foreground)/0.32)]">
        {t(label)}
      </div>
      {items.map((item) => {
        const end = navPathEndFlag(item.to, ALL_DIST_NAV_URLS);
        let active = isSidebarNavItemActive(item.to, location.pathname, location.search, end);

        if (item.hash === "#delivery-schedule") {
          active = location.pathname === "/distributor" && location.hash === "#delivery-schedule";
        } else if (item.to === "/distributor/partner-program") {
          active = location.pathname.startsWith("/distributor/partner-program");
        } else if (item.to === "/distributor" && !item.hash) {
          active = location.pathname === "/distributor" && !location.hash;
        } else if (item.to === "/distributor/pick-pack") {
          active = location.pathname.startsWith("/distributor/pick-pack");
        }

        const badge = badgeFor(item);
        const to = item.hash ? `${item.to}${item.hash}` : item.to;

        return (
          <Link
            key={item.label + to}
            to={to}
            onClick={onNavigate}
            className={cn(navItemBase, "touch-manipulation", active && navItemActive)}
          >
            <item.icon className="size-[15px] shrink-0" strokeWidth={1.75} />
            <span className="flex-1">{t(item.label)}</span>
            {badge != null && badge > 0 && item.badgeTone ? (
              <span
                className={cn(
                  "ml-auto rounded-full px-1.5 py-px font-mono text-[10px] font-semibold",
                  badgeStyles[item.badgeTone],
                )}
              >
                {badge > 99 ? "99+" : badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export type DistributorSidebarProps = {
  onNavigate?: () => void;
  className?: string;
};

export const DistributorSidebar = memo(function DistributorSidebar({
  onNavigate,
  className,
}: DistributorSidebarProps) {
  const { signOut, user } = useAuth();
  const { t } = useLanguage();
  const { data } = useAppData();
  const { purchaseOrders } = usePurchaseOrders();
  const { salesOrders } = useSalesOrders();

  const orgLabel = useMemo(() => {
    if (!user) return "Distributor";
    const distAccount = data.accounts.find(
      (a) => a.type === "distributor" && String(a.managedByDistributorUserId ?? "") === String(user.id),
    );
    if (distAccount?.tradingName) return distAccount.tradingName;
    return "Empire Wines";
  }, [data.accounts, user]);

  const pendingAccountCount = useMemo(
    () =>
      filterTeamMembersForDistributor(data.teamMembers ?? [], user?.id ?? "").filter(
        (m) => m.role === "retail" && m.pendingDistributorApproval,
      ).length,
    [data.teamMembers, user?.id],
  );

  const openPoCount = useMemo(
    () => purchaseOrders.filter((p) => p.status !== "delivered" && p.status !== "cancelled").length,
    [purchaseOrders],
  );

  const pickCount = useMemo(
    () => salesOrders.filter((o) => o.status === "confirmed" || o.status === "packed").length,
    [salesOrders],
  );

  const shipmentCount = useMemo(
    () => data.shipments.filter((s) => s.status !== "delivered").length,
    [data.shipments],
  );

  const initials = user ? userInitials(user.displayName) : "?";
  const navCounts = { openPoCount, pickCount, shipmentCount, pendingAccountCount };

  return (
    <aside
      className={cn(
        "side flex w-[256px] shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      <Link
        to="/distributor"
        onClick={onNavigate}
        className="logo-row flex shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4 pb-4 pt-5 no-underline"
      >
        <div className="logo-mark flex size-[34px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sidebar-accent">
          <HajimeLogo variant="dark" className="h-[26px] w-[26px] object-contain" alt="" />
        </div>
        <div className="min-w-0">
          <div className="logo-name font-display text-base font-semibold leading-tight text-[hsl(35_14%_90%)]">
            Hajime
          </div>
          <div className="logo-sub mt-px truncate text-[10px] tracking-[0.08em] text-[hsl(35_12%_42%)]">
            {orgLabel} · {t("Distributor")}
          </div>
        </div>
      </Link>

      <DistributorPerfPill />

      <NavSection label="Operations" items={operationsItems} sectionClassName="pt-3.5" {...navCounts} onNavigate={onNavigate} />

      <div className="side-div mx-2.5 my-2.5 h-px bg-sidebar-border" />

      <NavSection label="Logistics" items={logisticsItems} sectionClassName="pt-1" {...navCounts} onNavigate={onNavigate} />

      <div className="side-div mx-2.5 my-2.5 h-px bg-sidebar-border" />

      <NavSection label="Performance" items={performanceItems} sectionClassName="pt-1" {...navCounts} onNavigate={onNavigate} />

      <div className="side-footer mt-auto shrink-0 border-t border-sidebar-border px-2.5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="avatar flex size-[30px] shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-[11px] font-semibold text-[hsl(35_14%_82%)]">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-[hsl(35_14%_88%)]">{user?.displayName ?? "Guest"}</div>
            <div className="truncate text-[10px] text-[hsl(35_12%_44%)]">Operations Lead · {orgLabel}</div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[10px] uppercase tracking-widest text-[hsl(var(--sidebar-foreground)/0.32)]">
              {t("Language")}
            </p>
            <LanguageSelect />
          </div>
          <button
            type="button"
            className="shrink-0 rounded-md p-2 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={() => signOut()}
            aria-label={t("Sign out")}
          >
            <LogOut className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  );
});
