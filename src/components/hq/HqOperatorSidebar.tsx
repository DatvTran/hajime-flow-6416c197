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
  Layers,
  LayoutDashboard,
  LogOut,
  Monitor,
  Package,
  QrCode,
  Settings,
  Star,
  Store,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData, useNewProductRequests, usePurchaseOrders, useSalesOrders } from "@/contexts/AppDataContext";
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
  { to: "/expo-leads", label: "Expo leads", icon: QrCode, badgeTone: "gold" },
  { to: "/export-orders", label: "Export orders", icon: FileText, badgeTone: "amber" },
  { to: "/product-development", label: "Product Development", icon: Layers, badgeTone: "amber" },
  { to: "/production-requests", label: "Production requests", icon: Factory, badgeTone: "red" },
  { to: "/orders", label: "Replenishment orders", icon: Package, badgeTone: "amber", search: "?view=replenishment" },
  { to: "/orders", label: "Distributor orders", icon: FileText },
  { to: "/accounts", label: "Distributor sales", icon: TrendingUp, search: "?view=sales" },
  { to: "/markets", label: "Markets & allocation", icon: Globe },
];

const networkItems: NavItem[] = [
  { to: "/manufacturer/profiles", label: "Distilleries", icon: FlaskConical },
  { to: "/accounts", label: "Distributors", icon: Truck },
  { to: "/accounts", label: "Retail accounts", icon: Store, search: "?view=retail" },
  { to: "/crm", label: "Sales reps", icon: Users, search: "?role=sales_rep" },
];

const brandItems: NavItem[] = [
  { to: "/incentives", label: "Incentive programs", icon: Star },
  { to: "/inventory", label: "Product catalog", icon: Monitor },
  { to: "/brand-kit", label: "Brand kit", icon: Layers },
  { to: "/reports", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

const ALL_HQ_NAV_URLS = [...commandItems, ...networkItems, ...brandItems].map((i) => i.to);

const badgeToneClass = {
  gold: "nb nb-gold",
  red: "nb nb-red",
  amber: "nb nb-amber",
  green: "nb nb-green",
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
  productDevCount,
  productionCount,
  replenCount,
  onNavigate,
}: {
  label: string;
  items: NavItem[];
  sectionClassName?: string;
  productDevCount: number;
  productionCount: number;
  replenCount: number;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const { t } = useLanguage();

  const badgeFor = (item: NavItem): number | undefined => {
    if (item.to === "/product-development" && productDevCount > 0) return productDevCount;
    if (item.to === "/production-requests" && productionCount > 0) return productionCount;
    if (item.search === "?view=replenishment" && replenCount > 0) return replenCount;
    return undefined;
  };

  const isActive = (item: NavItem): boolean => {
    const path = location.pathname;
    const view = new URLSearchParams(location.search).get("view");

    if (item.to === "/" && !item.search) {
      return path === "/" || path === "";
    }
    if (item.to === "/product-development") {
      return path.startsWith("/product-development");
    }
    if (item.to === "/production-requests") {
      return path.startsWith("/production-requests") || path.startsWith("/purchase-orders");
    }
    if (item.search === "?view=replenishment") {
      return path.startsWith("/orders") && view === "replenishment";
    }
    if (item.search === "?view=sales") {
      return path.startsWith("/accounts") && view === "sales";
    }
    if (item.search === "?view=retail") {
      return path.startsWith("/accounts") && view === "retail";
    }
    if (item.to === "/crm") {
      return path.startsWith("/crm");
    }
    if (item.to === "/accounts" && !item.search) {
      return (
        (path.startsWith("/accounts") && view !== "sales" && view !== "retail") ||
        path.startsWith("/partners/distributor")
      );
    }
    if (item.to === "/orders" && !item.search) {
      return path.startsWith("/orders") && view !== "replenishment" && view !== "sales";
    }
    if (item.to === "/manufacturer/profiles") {
      return path.startsWith("/manufacturer");
    }
    if (item.to === "/expo-leads") {
      return path.startsWith("/expo-leads");
    }
    const end = navPathEndFlag(item.to, ALL_HQ_NAV_URLS);
    return isSidebarNavItemActive(item.to, path, location.search, end);
  };

  return (
    <nav className={cn("nav-section", sectionClassName)} aria-label={t(label)}>
      <div className="nav-label">{t(label)}</div>
      {items.map((item) => {
        const active = isActive(item);
        const badge = badgeFor(item);
        const to = `${item.to}${item.search ?? ""}`;

        return (
          <Link
            key={item.label + to}
            to={to}
            onClick={onNavigate}
            className={cn("navitem touch-manipulation", active && "active")}
          >
            <item.icon strokeWidth={1.75} />
            <span className="flex-1">{t(item.label)}</span>
            {badge != null && badge > 0 && item.badgeTone ? (
              <span className={badgeToneClass[item.badgeTone]}>{badge > 99 ? "99+" : badge}</span>
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
  const { newProductRequests } = useNewProductRequests();
  const { purchaseOrders } = usePurchaseOrders();
  const { salesOrders } = useSalesOrders();

  const productDevCount = useMemo(
    () =>
      newProductRequests.filter(
        (n) => n.status === "draft" || n.status === "proposed" || n.status === "under_review",
      ).length,
    [newProductRequests],
  );

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
  const navCounts = { productDevCount, productionCount, replenCount };

  return (
    <aside className={cn("side hq-side flex w-[258px] shrink-0 flex-col overflow-y-auto bg-sidebar text-sidebar-foreground", className)}>
      <Link to="/" onClick={onNavigate} className="logo-row shrink-0 no-underline">
        <div className="logo-mark">
          <HajimeLogo variant="dark" className="h-[26px] w-[26px] object-contain" alt="" />
        </div>
        <div className="min-w-0">
          <div className="logo-name">Hajime</div>
          <div className="logo-sub">{t("HQ Command Center")}</div>
        </div>
      </Link>

      <HqStatusPill portalCount={portalCount} marketCount={marketCount} />

      <NavSection label="Command" items={commandItems} {...navCounts} onNavigate={onNavigate} />

      <div className="side-div" />

      <NavSection label="Network" items={networkItems} sectionClassName="!pt-1" {...navCounts} onNavigate={onNavigate} />

      <div className="side-div" />

      <NavSection label="Brand" items={brandItems} sectionClassName="!pt-1" {...navCounts} onNavigate={onNavigate} />

      <div className="side-footer">
        <div className="avatar">{initials}</div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-medium text-[hsl(35_14%_88%)]">{user?.displayName ?? "Guest"}</div>
          <div className="truncate text-[10px] text-[hsl(35_12%_44%)]">{t("Brand Operator · HQ")}</div>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-md p-1.5 text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={() => signOut()}
          aria-label={t("Sign out")}
        >
          <LogOut className="size-3.5" strokeWidth={1.75} />
        </button>
      </div>

      <div className="border-t border-sidebar-border px-2.5 py-2.5">
        <p className="mb-1 px-2 text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--sidebar-foreground)/0.32)]">
          {t("Language")}
        </p>
        <LanguageSelect />
      </div>
    </aside>
  );
});
