/**
 * Sidebar chrome from Hajime Design System hq-operator-app.html
 */
import { memo, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Factory,
  FileText,
  FlaskConical,
  Globe,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Star,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData, usePurchaseOrders, useSalesOrders } from "@/contexts/AppDataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelect } from "@/components/LanguageSelect";
import { isSidebarNavItemActive, navPathEndFlag } from "@/lib/sidebar-nav-active";
import { filterWholesaleOrdersForHq } from "@/lib/hq-order-scope";
import { countActiveMarkets } from "@/lib/hajime-metrics";
import { cn } from "@/lib/utils";
import { HajimeLogo } from "@/components/HajimeLogo";

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
  badgeTone?: "red" | "amber" | "green" | "gold";
  search?: string;
};

const commandItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/purchase-orders", label: "Production requests", icon: Factory, badgeTone: "amber" },
  { to: "/orders", label: "Replenishment orders", icon: Package, badgeTone: "red", search: "?view=replenishment" },
  { to: "/orders", label: "Distributor orders", icon: FileText },
  { to: "/accounts", label: "Distributor sales", icon: TrendingUp, search: "?view=sales" },
  { to: "/markets", label: "Markets & allocation", icon: Globe },
];

const networkItems: NavItem[] = [
  { to: "/manufacturer/profiles", label: "Manufacturers", icon: Factory, badgeTone: "amber" },
  { to: "/accounts", label: "Distributors", icon: Truck },
];

const brandItems: NavItem[] = [
  { to: "/incentives", label: "Incentive programs", icon: Star },
  { to: "/product-development", label: "Product development", icon: FlaskConical },
  { to: "/inventory", label: "Product catalog", icon: Package },
  { to: "/reports", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

const ALL_HQ_NAV_URLS = [...commandItems, ...networkItems, ...brandItems].map((i) => i.to);

const navItemBase =
  "navitem flex items-center gap-[9px] rounded-md px-2.5 py-2 text-[13px] text-[hsl(var(--sidebar-foreground)/0.68)] transition-[background,color] duration-[140ms] hover:bg-sidebar-accent hover:text-[hsl(35_14%_90%)]";
const navItemActive = "bg-sidebar-accent font-medium text-sidebar-primary";

const badgeStyles = {
  gold: "nb nb-gold bg-[hsl(40_88%_42%/0.18)] text-[hsl(40_88%_42%)]",
  red: "nb nb-red bg-[hsl(0_68%_48%/0.14)] text-[hsl(0_68%_42%)]",
  amber: "nb nb-amber bg-[hsl(38_90%_50%/0.14)] text-[hsl(30_80%_34%)]",
  green: "nb nb-green bg-[hsl(158_56%_36%/0.15)] text-[hsl(158_56%_32%)]",
} as const;

function HqStatusPill({ portalCount, marketCount }: { portalCount: number; marketCount: number }) {
  const { t } = useLanguage();
  return (
    <div className="hq-sidebar-status">
      <div className="hq-sidebar-status-top">
        <div className="hq-sidebar-status-dot" aria-hidden />
        <div className="hq-sidebar-status-title">{t("All systems live")}</div>
      </div>
      <div className="hq-sidebar-status-grid">
        <div className="hq-sidebar-stat">
          <div className="hq-sidebar-stat-v">{portalCount}</div>
          <div className="hq-sidebar-stat-l">{t("portals")}</div>
        </div>
        <div className="hq-sidebar-stat">
          <div className="hq-sidebar-stat-v">{marketCount}</div>
          <div className="hq-sidebar-stat-l">{t("markets")}</div>
        </div>
      </div>
    </div>
  );
}

function NavSection({
  label,
  items,
  sectionClassName,
  productionCount,
  replenCount,
  manufacturerCount,
  onNavigate,
}: {
  label: string;
  items: NavItem[];
  sectionClassName?: string;
  productionCount: number;
  replenCount: number;
  manufacturerCount: number;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const { t } = useLanguage();

  const badgeFor = (item: NavItem): number | undefined => {
    if (item.to === "/purchase-orders" && productionCount > 0) return productionCount;
    if (item.search === "?view=replenishment" && replenCount > 0) return replenCount;
    if (item.to === "/manufacturer/profiles" && manufacturerCount > 0) return manufacturerCount;
    return undefined;
  };

  const isActive = (item: NavItem): boolean => {
    const path = location.pathname;
    const view = new URLSearchParams(location.search).get("view");

    if (item.to === "/" && !item.search) {
      return path === "/" || path === "";
    }
    if (item.search === "?view=replenishment") {
      return path.startsWith("/orders") && view === "replenishment";
    }
    if (item.search === "?view=sales") {
      return path.startsWith("/accounts") && view === "sales";
    }
    if (item.to === "/accounts" && !item.search) {
      return (path.startsWith("/accounts") && view !== "sales") || path.startsWith("/partners/distributor");
    }
    if (item.to === "/orders" && !item.search) {
      return path.startsWith("/orders") && view !== "replenishment" && view !== "sales";
    }
    if (item.to === "/manufacturer/profiles") {
      return path.startsWith("/manufacturer");
    }
    const end = navPathEndFlag(item.to, ALL_HQ_NAV_URLS);
    return isSidebarNavItemActive(item.to, path, location.search, end);
  };

  return (
    <nav className={cn("nav-section flex flex-col gap-0.5 px-2.5 pb-1.5", sectionClassName)} aria-label={t(label)}>
      <div className="nav-label px-2 pb-1.5 pt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[hsl(var(--sidebar-foreground)/0.32)]">
        {t(label)}
      </div>
      {items.map((item) => {
        const active = isActive(item);
        const badge = badgeFor(item);
        const to = `${item.to}${item.search ?? ""}`;

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

export type HqOperatorSidebarProps = {
  onNavigate?: () => void;
  className?: string;
};

export const HqOperatorSidebar = memo(function HqOperatorSidebar({
  onNavigate,
  className,
}: HqOperatorSidebarProps) {
  const { signOut, user } = useAuth();
  const { t } = useLanguage();
  const { data } = useAppData();
  const { purchaseOrders } = usePurchaseOrders();
  const { salesOrders } = useSalesOrders();

  const productionCount = useMemo(
    () =>
      purchaseOrders.filter(
        (p) =>
          p.poType !== "sales" &&
          p.status !== "delivered" &&
          p.status !== "completed" &&
          p.status !== "shipped",
      ).length,
    [purchaseOrders],
  );

  const replenCount = useMemo(() => {
    const wholesale = filterWholesaleOrdersForHq(salesOrders, data.accounts);
    return wholesale.filter((o) => o.status === "draft").length;
  }, [salesOrders, data.accounts]);

  const manufacturerCount = useMemo(
    () => data.accounts.filter((a) => a.type === "manufacturer" && a.status === "active").length,
    [data.accounts],
  );

  const portalCount = useMemo(() => {
    const roles = new Set<string>();
    if (data.accounts.some((a) => a.type === "manufacturer")) roles.add("manufacturer");
    if (data.accounts.some((a) => a.type === "distributor")) roles.add("distributor");
    if ((data.teamMembers ?? []).some((m) => m.role === "sales_rep")) roles.add("sales_rep");
    if (data.accounts.some((a) => a.type === "retail")) roles.add("retail");
    roles.add("hq");
    return roles.size;
  }, [data.accounts, data.teamMembers]);

  const marketCount = useMemo(
    () => countActiveMarkets(data.salesOrders, 90),
    [data.salesOrders],
  );

  const initials = user ? userInitials(user.displayName) : "?";
  const navCounts = { productionCount, replenCount, manufacturerCount };

  return (
    <aside
      className={cn(
        "side flex w-[258px] shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      <Link
        to="/"
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
          <div className="logo-sub mt-px text-[10px] tracking-[0.08em] text-[hsl(35_12%_42%)]">
            {t("HQ Command Center")}
          </div>
        </div>
      </Link>

      <HqStatusPill portalCount={portalCount} marketCount={marketCount} />

      <NavSection label="Command" items={commandItems} sectionClassName="pt-3" {...navCounts} onNavigate={onNavigate} />

      <div className="side-div mx-2.5 my-2.5 h-px bg-sidebar-border" />

      <NavSection label="Network" items={networkItems} sectionClassName="pt-1" {...navCounts} onNavigate={onNavigate} />

      <div className="side-div mx-2.5 my-2.5 h-px bg-sidebar-border" />

      <NavSection label="Brand" items={brandItems} sectionClassName="pt-1" {...navCounts} onNavigate={onNavigate} />

      <div className="side-footer mt-auto shrink-0 border-t border-sidebar-border px-2.5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="avatar flex size-[30px] shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-[11px] font-semibold text-[hsl(35_14%_82%)]">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-[hsl(35_14%_88%)]">{user?.displayName ?? "Guest"}</div>
            <div className="truncate text-[10px] text-[hsl(35_12%_44%)]">{t("Brand Operator · HQ")}</div>
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
