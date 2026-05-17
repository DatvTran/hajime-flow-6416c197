import { Link, Outlet, useLocation } from "react-router-dom";
import { Suspense, memo, useMemo, useState } from "react";
import { isSidebarNavItemActive, navPathEndFlag } from "@/lib/sidebar-nav-active";
import { useAppData, useShipments } from "@/contexts/AppDataContext";
import { useAuth, useRetailAccountTradingName } from "@/contexts/AuthContext";
import { useRetailCart } from "@/contexts/RetailCartContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { HajimeLogo } from "@/components/HajimeLogo";
import {
  BarChart3,
  CircleUser,
  ClipboardList,
  HeadphonesIcon,
  Home,
  LayoutGrid,
  LineChart,
  LogOut,
  Menu,
  Package,
  Plus,
  PlusCircle,
  RotateCcw,
  Star,
  Truck,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RetailOutletFallback } from "@/components/retail/RetailOutletFallback";

function userInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function retailCrumb(pathname: string): { section: string; page: string } {
  if (pathname === "/" || pathname === "/retail") return { section: "Store", page: "Home" };
  if (pathname.startsWith("/retail/catalog")) return { section: "Store", page: "Catalog" };
  if (pathname.startsWith("/retail/new-order")) return { section: "Store", page: "New order" };
  if (pathname.startsWith("/retail/reorder")) return { section: "Store", page: "Reorder" };
  if (pathname.startsWith("/retail/orders/")) return { section: "Tracking", page: "Order" };
  if (pathname.startsWith("/retail/orders")) return { section: "Tracking", page: "My orders" };
  if (pathname.startsWith("/retail/backbar")) return { section: "Tracking", page: "Backbar tracker" };
  if (pathname.startsWith("/shipments")) return { section: "Tracking", page: "Deliveries" };
  if (pathname.startsWith("/incentives")) return { section: "Rewards", page: "Partner program" };
  if (pathname.startsWith("/reports")) return { section: "Rewards", page: "Sell-through reports" };
  if (pathname.startsWith("/retail/account")) return { section: "Account", page: "My account" };
  if (pathname.startsWith("/retail/support")) return { section: "Account", page: "Support" };
  if (pathname.startsWith("/alerts")) return { section: "Tracking", page: "Alerts" };
  return { section: "Store", page: "Home" };
}

const navBtn =
  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-[hsl(35_14%_90%)]";

const navActive = "bg-sidebar-accent font-medium text-sidebar-primary text-[hsl(35_14%_90%)]";

type NavItem = { to: string; label: string; icon: typeof Home; badge?: number };

const storeItems: NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/retail/catalog", label: "Catalog", icon: LayoutGrid },
  { to: "/retail/new-order", label: "New order", icon: PlusCircle },
  { to: "/retail/reorder", label: "Reorder", icon: RotateCcw },
];

const trackingItems: NavItem[] = [
  { to: "/shipments", label: "Deliveries", icon: Truck },
  { to: "/retail/orders", label: "My orders", icon: ClipboardList },
  { to: "/retail/backbar", label: "Backbar tracker", icon: BarChart3 },
];

const rewardsItems: NavItem[] = [
  { to: "/incentives", label: "Partner program", icon: Star },
  { to: "/reports", label: "Sell-through reports", icon: LineChart },
];

const accountItems: NavItem[] = [
  { to: "/retail/support", label: "Support", icon: HeadphonesIcon },
  { to: "/retail/account", label: "My account", icon: CircleUser },
];

const ALL_RETAIL_NAV_URLS = [...storeItems, ...trackingItems, ...rewardsItems, ...accountItems].map((i) => i.to);

function formatMoneyCompact(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

type SidebarNavProps = {
  onNavigate?: () => void;
  cartCases: number;
  badgeDeliveries: number;
};

const RetailSidebarNav = memo(function RetailSidebarNav({ onNavigate, cartCases, badgeDeliveries }: SidebarNavProps) {
  const location = useLocation();

  const mergeBadge = (to: string): number | undefined => {
    if (to === "/retail/new-order" && cartCases > 0) return cartCases;
    if (to === "/shipments" && badgeDeliveries > 0) return badgeDeliveries;
    return undefined;
  };

  const linkClass = (active: boolean) => cn(navBtn, "touch-manipulation", active && navActive);

  const renderLink = (item: NavItem) => {
    const end = navPathEndFlag(item.to, ALL_RETAIL_NAV_URLS);
    let active = isSidebarNavItemActive(item.to, location.pathname, location.search, end);
    if (item.to === "/") {
      active = location.pathname === "/" || location.pathname === "/retail";
    }
    const badge = mergeBadge(item.to) ?? item.badge;
    return (
      <Link
        key={item.label + item.to}
        to={item.to}
        onClick={onNavigate}
        className={linkClass(active)}
      >
        <item.icon className="h-[15px] w-[15px] shrink-0 opacity-90" strokeWidth={1.75} />
        <span className="flex-1">{item.label}</span>
        {badge != null && badge > 0 ? (
          <span className="rounded-full bg-[hsl(40_88%_42%/0.18)] px-1.5 py-px font-mono text-[10px] font-semibold text-sidebar-primary">
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </Link>
    );
  };

  return (
    <>
      <div className="space-y-0.5 px-2.5 pt-3.5">
        <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[hsl(var(--sidebar-foreground)/0.32)]">Store</p>
        {storeItems.map((item) => renderLink(item))}
      </div>
      <div className="mx-2.5 my-2.5 h-px bg-sidebar-border" />
      <div className="space-y-0.5 px-2.5 pt-1">
        <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[hsl(var(--sidebar-foreground)/0.32)]">Tracking</p>
        {trackingItems.map((item) => renderLink(item))}
      </div>
      <div className="mx-2.5 my-2.5 h-px bg-sidebar-border" />
      <div className="space-y-0.5 px-2.5 pt-1">
        <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[hsl(var(--sidebar-foreground)/0.32)]">Rewards</p>
        {rewardsItems.map((item) => renderLink(item))}
      </div>
      <div className="mx-2.5 my-2.5 h-px bg-sidebar-border" />
      <div className="space-y-0.5 px-2.5 pt-1">
        <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[hsl(var(--sidebar-foreground)/0.32)]">Account</p>
        {accountItems.map((item) => renderLink(item))}
      </div>
    </>
  );
});

export function RetailLayout() {
  const { signOut, user } = useAuth();
  const { language, setLanguage, options, t } = useLanguage();
  const storeName = useRetailAccountTradingName();
  const { totalCases } = useRetailCart();
  const { data } = useAppData();
  const { shipments } = useShipments();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const myOrders = useMemo(() => {
    if (!storeName) return [];
    return [...data.salesOrders]
      .filter((o) => o.account === storeName)
      .sort((a, b) => Date.parse(b.orderDate) - Date.parse(a.orderDate));
  }, [data.salesOrders, storeName]);

  const pipelineCount = useMemo(
    () => myOrders.filter((o) => ["draft", "confirmed", "packed", "shipped"].includes(o.status)).length,
    [myOrders],
  );

  const activeDeliveriesBadge = useMemo(() => {
    if (!storeName) return 0;
    return shipments.filter((s) => s.destination === storeName && s.status !== "delivered").length;
  }, [shipments, storeName]);

  const spend30d = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000;
    return myOrders.filter((o) => Date.parse(o.orderDate) >= cutoff).reduce((s, o) => s + o.price, 0);
  }, [myOrders]);

  const { section, page } = retailCrumb(location.pathname);
  const initials = user ? userInitials(user.displayName) : "?";

  const logoBlock = (
    <Link to="/" className="flex items-center gap-2.5 px-4 py-5 no-underline" onClick={() => setMobileOpen(false)}>
      <div className="flex size-[34px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sidebar-accent">
        <HajimeLogo variant="dark" className="h-[26px] w-[26px] object-contain" alt="" />
      </div>
      <div className="min-w-0 text-left">
        <div className="font-display text-base font-semibold leading-tight text-[hsl(35_14%_90%)]">Hajime</div>
        <div className="mt-px text-[10px] text-[hsl(35_12%_42%)]">{storeName ?? "Retail store"}</div>
      </div>
    </Link>
  );

  const tierPill = (
    <Link
      to="/incentives"
      className="mx-2.5 mb-1 mt-0 flex items-center gap-2.5 rounded-xl border border-[hsl(40_88%_42%/0.22)] bg-gradient-to-br from-[hsl(40_88%_42%/0.1)] to-[hsl(40_60%_50%/0.06)] px-3.5 py-3 no-underline transition-opacity hover:opacity-95"
      onClick={() => setMobileOpen(false)}
    >
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(40_88%_42%)] to-[hsl(32_78%_48%)] text-white shadow-sm">
        <Star className="size-3.5 fill-white/20" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold text-[hsl(40_80%_60%)]">Partner perks</div>
        <div className="truncate text-[10px] text-[hsl(35_12%_42%)]">
          {pipelineCount} open · ${formatMoneyCompact(spend30d)} last 30 days
        </div>
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
          <div className="truncate text-[10px] text-[hsl(35_12%_44%)]">Retail account</div>
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
      {/* Desktop sidebar — retail-store-app shell */}
      <aside className="relative hidden w-[252px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:h-svh lg:overflow-hidden">
        <div className="shrink-0 border-b border-sidebar-border">{logoBlock}</div>
        {tierPill}
        <nav className="flex flex-1 flex-col overflow-y-auto pb-3 text-sm" aria-label="Retail">
          <RetailSidebarNav cartCases={totalCases} badgeDeliveries={activeDeliveriesBadge} />
        </nav>
        {userBlock}
      </aside>

      {/* Main column */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:h-svh lg:overflow-hidden">
        {/* Mobile header */}
        <header className="glass-header sticky top-0 z-40 flex h-14 items-center gap-3 px-4 pt-[env(safe-area-inset-top)] lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="shrink-0 touch-manipulation" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
              <div className="flex h-full flex-col overflow-hidden">
                <div className="shrink-0 border-b border-sidebar-border">{logoBlock}</div>
                {tierPill}
                <nav className="flex flex-1 flex-col overflow-y-auto pb-4 text-sm" aria-label="Retail menu">
                  <RetailSidebarNav
                    cartCases={totalCases}
                    badgeDeliveries={activeDeliveriesBadge}
                    onNavigate={() => setMobileOpen(false)}
                  />
                </nav>
                {userBlock}
              </div>
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1 truncate font-display text-sm font-medium text-foreground/80">Hajime</div>
          <Button size="sm" className="h-8 shrink-0 bg-accent px-3 text-accent-foreground hover:bg-[hsl(32_78%_48%)]" asChild>
            <Link to="/retail/new-order">
              <Plus className="mr-1 size-4" />
              Order
            </Link>
          </Button>
        </header>

        {/* Top bar — crumbs + actions (matches retail-store-app.html) */}
        <header className="glass-header sticky top-0 z-30 hidden h-[54px] shrink-0 items-center justify-between gap-4 px-8 lg:flex">
          <div className="text-[13px] text-muted-foreground">
            {section} › <strong className="font-medium text-foreground">{page}</strong>
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="sm" className="h-[30px] text-xs" asChild>
              <Link to="/reports">View reports</Link>
            </Button>
            <Button size="sm" className="h-9 gap-1 bg-accent px-4 text-accent-foreground hover:bg-[hsl(32_78%_48%)]" asChild>
              <Link to="/retail/new-order">
                <Plus className="size-4" strokeWidth={2} />
                New order
              </Link>
            </Button>
          </div>
        </header>

        {totalCases > 0 ? (
          <div className="shrink-0 border-b border-border/40 bg-muted/30 px-4 py-2 lg:px-8">
            <Link
              to="/retail/new-order#retail-cart"
              className="flex items-center justify-center gap-2 text-xs text-muted-foreground no-underline transition-colors hover:text-foreground"
            >
              <Package className="h-3.5 w-3.5 text-accent" />
              <span>
                {totalCases} case{totalCases !== 1 ? "s" : ""} in cart
              </span>
              <span className="font-medium text-foreground">Review →</span>
            </Link>
          </div>
        ) : null}

        <div className="shrink-0 border-b border-border/40 px-4 py-2.5 text-[13px] text-muted-foreground lg:hidden">
          {section} › <strong className="font-medium text-foreground">{page}</strong>
        </div>

        <main className="scrollbar-thin mx-auto w-full max-w-[1200px] flex-1 overflow-y-auto px-[30px] pb-20 pt-[30px] lg:pb-[80px]">
          <Suspense fallback={<RetailOutletFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
