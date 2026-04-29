import { Link, Outlet, useLocation } from "react-router-dom";
import { isSidebarNavItemActive, navPathEndFlag } from "@/lib/sidebar-nav-active";
import { useAuth, useRetailAccountTradingName } from "@/contexts/AuthContext";
import { useRetailCart } from "@/contexts/RetailCartContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { HajimeLogo } from "@/components/HajimeLogo";
import {
  AlertTriangle,
  CircleUser,
  HeadphonesIcon,
  Home,
  LogOut,
  Menu,
  Package,
  PlusCircle,
  RotateCcw,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { useState } from "react";

function userInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function retailCrumb(pathname: string): { section: string; page: string } {
  if (pathname === "/" || pathname === "/retail") return { section: "Store", page: "Home" };
  if (pathname.startsWith("/retail/new-order")) return { section: "Store", page: "New order" };
  if (pathname.startsWith("/retail/orders/")) return { section: "Store", page: "Order" };
  if (pathname.startsWith("/retail/orders")) return { section: "Store", page: "My orders" };
  if (pathname.startsWith("/retail/reorder")) return { section: "Store", page: "Reorder" };
  if (pathname.startsWith("/retail/account")) return { section: "You", page: "Account" };
  if (pathname.startsWith("/retail/support")) return { section: "You", page: "Support" };
  if (pathname.startsWith("/shipments")) return { section: "Tracking", page: "Deliveries" };
  if (pathname.startsWith("/alerts")) return { section: "Tracking", page: "Alerts" };
  return { section: "Store", page: "Home" };
}

const navBtn =
  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

const navActive =
  "bg-sidebar-accent font-medium text-sidebar-primary text-sidebar-accent-foreground";

type NavItem = { to: string; label: string; icon: typeof Home };

const storeItems: NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/retail/new-order", label: "New order", icon: PlusCircle },
  { to: "/retail/orders", label: "My orders", icon: ShoppingCart },
  { to: "/retail/reorder", label: "Reorder", icon: RotateCcw },
];

const trackingItems: NavItem[] = [
  { to: "/shipments", label: "Deliveries", icon: Truck },
  { to: "/alerts", label: "Alerts", icon: AlertTriangle },
];

const youItems: NavItem[] = [
  { to: "/retail/account", label: "Account", icon: CircleUser },
  { to: "/retail/support", label: "Support", icon: HeadphonesIcon },
];

const ALL_RETAIL_NAV_URLS = [...storeItems, ...trackingItems, ...youItems].map((i) => i.to);

function RetailSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const linkClass = (active: boolean) => cn(navBtn, "touch-manipulation", active && navActive);

  const renderLink = (item: NavItem) => {
    const end = navPathEndFlag(item.to, ALL_RETAIL_NAV_URLS);
    const active = isSidebarNavItemActive(item.to, location.pathname, location.search, end);
    return (
      <Link
        key={item.label + item.to}
        to={item.to}
        onClick={onNavigate}
        className={linkClass(active)}
      >
        <item.icon className="h-[15px] w-[15px] shrink-0 opacity-90" strokeWidth={1.75} />
        {item.label}
      </Link>
    );
  };

  return (
    <>
      <div className="space-y-0.5">
        <p className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-sidebar-foreground/40">Store</p>
        {storeItems.map((item) => renderLink(item))}
      </div>
      <div className="mt-5 space-y-0.5">
        <p className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-sidebar-foreground/40">Tracking</p>
        {trackingItems.map((item) => renderLink(item))}
      </div>
      <div className="mt-5 space-y-0.5">
        <p className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-sidebar-foreground/40">You</p>
        {youItems.map((item) => renderLink(item))}
      </div>
    </>
  );
}

export function RetailLayout() {
  const { signOut, user } = useAuth();
  const storeName = useRetailAccountTradingName();
  const { totalCases } = useRetailCart();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { section, page } = retailCrumb(location.pathname);
  const initials = user ? userInitials(user.displayName) : "?";

  const logoBlock = (
    <Link to="/" className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 no-underline" onClick={() => setMobileOpen(false)}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sidebar-accent/60">
        <HajimeLogo variant="dark" className="h-[26px] w-[26px] object-contain" alt="" />
      </div>
      <div className="min-w-0 text-left">
        <div className="font-display text-base font-semibold leading-tight text-[hsl(35_14%_90%)]">Hajime</div>
        <div className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.18em] text-[hsl(35_12%_55%)]">{storeName}</div>
      </div>
    </Link>
  );

  const userBlock = (
    <div className="mt-auto flex items-center gap-2.5 border-t border-sidebar-border pt-4">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-[11px] font-medium text-[hsl(35_14%_90%)]">
        {initials}
      </div>
      <div className="min-w-0 flex-1 text-left text-xs leading-snug text-[hsl(35_14%_90%)]">
        <div className="truncate">{user?.displayName ?? "Guest"}</div>
        <div className="truncate text-[10px] text-[hsl(35_12%_50%)]">Retail account</div>
      </div>
      <button
        type="button"
        className="shrink-0 rounded-md p-1.5 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        onClick={() => signOut()}
        aria-label="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="relative hidden w-[240px] shrink-0 flex-col gap-5 border-r border-sidebar-border bg-sidebar px-3.5 pb-5 pt-[calc(18px+env(safe-area-inset-top))] text-sidebar-foreground md:flex">
        {logoBlock}
        <nav className="flex flex-1 flex-col gap-5 text-sm" aria-label="Retail">
          <RetailSidebarNav />
        </nav>
        {userBlock}
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border/60 bg-[hsl(var(--glass-bg))] px-4 pt-[env(safe-area-inset-top)] backdrop-blur-md md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="shrink-0 touch-manipulation" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[260px] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
              <div className="flex h-full flex-col gap-5 px-4 pb-6 pt-[calc(1rem+env(safe-area-inset-top))]">
                {logoBlock}
                <nav className="flex flex-1 flex-col gap-5 overflow-y-auto text-sm" aria-label="Retail menu">
                  <RetailSidebarNav onNavigate={() => setMobileOpen(false)} />
                </nav>
                {userBlock}
              </div>
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1 truncate font-display text-sm font-medium text-foreground/80">Hajime</div>
        </header>

        {/* Top bar: crumbs only (ordering lives on Home catalog + sidebar New order) */}
        <header className="sticky top-0 z-30 hidden h-14 items-center border-b border-border/60 bg-[hsl(var(--glass-bg))] px-7 backdrop-blur-md md:flex md:pt-0">
          <div className="text-[13px] text-muted-foreground">
            {section} › <strong className="font-medium text-foreground">{page}</strong>
          </div>
        </header>

        {totalCases > 0 ? (
          <div className="border-b border-border/40 bg-muted/30 px-4 py-2 md:px-7">
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

        {/* Crumbs on mobile (under optional cart strip) */}
        <div className="border-b border-border/40 px-4 py-2.5 text-[13px] text-muted-foreground md:hidden">
          {section} › <strong className="font-medium text-foreground">{page}</strong>
        </div>

        <main className="mx-auto w-full max-w-[1160px] flex-1 px-4 py-7 pb-20 sm:px-6 sm:py-7 md:px-10 md:pb-20 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
