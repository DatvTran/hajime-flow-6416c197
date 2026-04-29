import type { LucideIcon } from "lucide-react";
// v2.1 - Added Inventory section to Retail sidebar with depletion reporting
// Build: 2026-04-15-001
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Factory,
  Truck,
  BarChart3,
  Settings,
  LogOut,
  AlertTriangle,
  Globe,
  Map as MapIcon,
  Warehouse,
  Home,
  PlusCircle,
  Wine,
  RotateCcw,
  User,
  HelpCircle,
  Target,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  LineChart,
  Receipt,
  Gift,
  Scale,
  Store,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HajimeLogo } from "@/components/HajimeLogo";
import { useAuth, type HajimeRole } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate, useLocation } from "react-router-dom";

export type NavItem = { title: string; url: string; icon: LucideIcon };

export type NavGroupDef = { label: string; items: NavItem[] };

const ROLE_BADGE: Record<HajimeRole, string> = {
  founder_admin: "Founder Admin",
  brand_operator: "Brand Operator (HQ)",
  manufacturer: "Manufacturer",
  distributor: "Distributor / Wholesaler",
  retail: "Retail Store / Account",
  sales_rep: "Sales Rep",
  sales: "Sales",
  operations: "Operations",
  finance: "Finance",
};

/** Spec §4 — focused sidebar per role; URLs map to shared AppData routes. */
function navGroupsForRole(role: HajimeRole): NavGroupDef[] {
  switch (role) {
    case "founder_admin":
    case "brand_operator":
      return [
        {
          label: "Operations",
          items: [
            { title: "Today · command center", url: "/", icon: LayoutDashboard },
            { title: "Inventory", url: "/inventory", icon: Package },
            { title: "Orders", url: "/orders", icon: ShoppingCart },
            { title: "Markets", url: "/markets", icon: Globe },
            { title: "Global markets", url: "/global-markets", icon: MapIcon },
            { title: "Accounts", url: "/accounts", icon: Users },
            { title: "Shipments", url: "/shipments", icon: Truck },
          ],
        },
        {
          label: "Supply chain",
          items: [
            { title: "Production requests", url: "/purchase-orders", icon: FileText },
            { title: "Product development", url: "/product-development", icon: Factory },
            { title: "Manufacturer portal", url: "/manufacturer", icon: Factory },
          ],
        },
        {
          label: "Insights",
          items: [
            { title: "Analytics", url: "/reports", icon: BarChart3 },
            { title: "Alerts hub", url: "/alerts", icon: AlertTriangle },
            { title: "Payments & AR/AP", url: "/finance", icon: Receipt },
            { title: "Incentive Manager", url: "/incentives", icon: Gift },
          ],
        },
        {
          label: "HQ",
          items: [{ title: "CRM / settings", url: "/settings", icon: Settings }],
        },
      ];
    case "manufacturer":
      return [
        {
          label: "Manufacturer",
          items: [
            { title: "Overview", url: "/manufacturer", icon: LayoutDashboard },
            { title: "New product requests", url: "/manufacturer/product-requests", icon: Factory },
            { title: "Production orders", url: "/manufacturer/purchase-orders", icon: FileText },
            { title: "Shipments", url: "/manufacturer/shipments", icon: Truck },
            { title: "Batch history", url: "/manufacturer/inventory", icon: Package },
            { title: "Market demand", url: "/manufacturer/market-demand", icon: Globe },
            { title: "Alerts", url: "/manufacturer/alerts", icon: AlertTriangle },
            { title: "Payments & receipts", url: "/manufacturer/finance", icon: Receipt },
          ],
        },
        {
          label: "Account",
          items: [{ title: "Profile", url: "/manufacturer/profile", icon: User }],
        },
      ];
    case "distributor":
      return [
        {
          label: "Operations",
          items: [
            { title: "Floor · today", url: "/distributor", icon: LayoutDashboard },
            { title: "Warehouse inventory", url: "/distributor/inventory", icon: Warehouse },
            { title: "Orders to fulfill", url: "/distributor/orders?tab=approved", icon: ShoppingCart },
            { title: "Report depletions", url: "/distributor/depletions", icon: TrendingDown },
            { title: "Sell-through velocity", url: "/distributor/sellthrough", icon: TrendingUp },
            { title: "Inventory adjustments", url: "/distributor/adjustments", icon: Scale },
            { title: "Production requests", url: "/distributor/purchase-orders", icon: FileText },
            { title: "Deliveries", url: "/distributor/shipments", icon: Truck },
            { title: "Retail accounts", url: "/distributor/accounts", icon: Users },
            { title: "Backorders", url: "/distributor/backorders", icon: ClipboardList },
            { title: "Payments & remits", url: "/distributor/finance", icon: Receipt },
          ],
        },
        {
          label: "Service",
          items: [
            { title: "Alerts hub", url: "/distributor/alerts", icon: AlertTriangle },
            { title: "Analytics", url: "/distributor/reports", icon: LineChart },
          ],
        },
      ];
    case "retail":
      return [
        {
          label: "Store",
          items: [
            { title: "Home", url: "/", icon: Home },
            { title: "New order", url: "/retail/new-order", icon: PlusCircle },
            { title: "My orders", url: "/retail/orders", icon: ShoppingCart },
            { title: "Reorder", url: "/retail/reorder", icon: RotateCcw },
            { title: "Catalog", url: "/retail/new-order", icon: Wine },
          ],
        },
        {
          label: "You",
          items: [
            { title: "Account", url: "/retail/account", icon: User },
            { title: "Support", url: "/retail/support", icon: HelpCircle },
          ],
        },
        {
          label: "Tracking",
          items: [
            { title: "Deliveries", url: "/shipments", icon: Truck },
            { title: "Alerts", url: "/alerts", icon: AlertTriangle },
          ],
        },
      ];
    case "sales_rep":
      return [
        {
          label: "Field",
          items: [
            { title: "Field · today", url: "/sales", icon: LayoutDashboard },
            { title: "My accounts", url: "/sales/accounts", icon: Users },
            { title: "Opportunities", url: "/sales/opportunities", icon: TrendingUp },
            { title: "Visit notes", url: "/sales/visits", icon: ClipboardList },
            { title: "Draft orders", url: "/sales/orders?tab=pending-review", icon: FileText },
            { title: "Inventory", url: "/inventory", icon: Package },
          ],
        },
        {
          label: "Performance",
          items: [
            { title: "Targets", url: "/sales/targets", icon: Target },
            { title: "Analytics", url: "/sales/reports", icon: BarChart3 },
            { title: "Alerts", url: "/sales/alerts", icon: AlertTriangle },
          ],
        },
      ];
    case "sales":
      return [
        {
          label: "Sales",
          items: [
            { title: "Field · today", url: "/sales", icon: LayoutDashboard },
            { title: "Accounts", url: "/sales/accounts", icon: Users },
            { title: "Orders", url: "/sales/orders", icon: ShoppingCart },
            { title: "Targets", url: "/sales/targets", icon: Target },
          ],
        },
        {
          label: "Performance",
          items: [
            { title: "Analytics", url: "/sales/reports", icon: BarChart3 },
            { title: "Alerts", url: "/sales/alerts", icon: AlertTriangle },
          ],
        },
      ];
    case "operations":
      return [
        {
          label: "Operations",
          items: [
            { title: "Overview", url: "/", icon: LayoutDashboard },
            { title: "Inventory", url: "/inventory", icon: Package },
            { title: "Orders", url: "/orders", icon: ShoppingCart },
            { title: "Shipments", url: "/shipments", icon: Truck },
            { title: "Production", url: "/purchase-orders", icon: FileText },
          ],
        },
        {
          label: "Insights",
          items: [
            { title: "Analytics", url: "/reports", icon: BarChart3 },
            { title: "Alerts", url: "/alerts", icon: AlertTriangle },
          ],
        },
      ];
    case "finance":
      return [
        {
          label: "Finance",
          items: [
            { title: "Overview", url: "/", icon: LayoutDashboard },
            { title: "Payments", url: "/finance", icon: Receipt },
            { title: "Orders", url: "/orders", icon: ShoppingCart },
            { title: "Accounts", url: "/accounts", icon: Users },
          ],
        },
        {
          label: "Insights",
          items: [
            { title: "Analytics", url: "/reports", icon: BarChart3 },
            { title: "Alerts", url: "/alerts", icon: AlertTriangle },
          ],
        },
      ];
    default:
      return [];
  }
}

function NavSection({
  items,
  label,
  collapsed,
  onNavigate,
}: {
  items: NavItem[];
  label: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const { t } = useLanguage();
  if (items.length === 0) return null;
  return (
    <SidebarGroup className={cn(collapsed && "px-0")}>
      {!collapsed && (
        <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/40">{t(label)}</p>
      )}
      <SidebarGroupContent>
        <SidebarMenu className={cn(collapsed && "items-center")}>
          {items.map((item) => {
            const end = navPathEndFlag(item.url, allUrls);
            const isActive = isSidebarNavItemActive(item.url, location.pathname, location.search, end);
            return (
              <SidebarMenuItem key={item.title + item.url} className={cn(collapsed && "flex w-full justify-center")}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link
                    to={item.url}
                    onClick={() => onNavigate?.()}
                    className={cn(
                      "flex items-center rounded-md text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full text-left",
                      collapsed ? "size-8 shrink-0 justify-center gap-0 p-0" : "min-h-10 gap-3 px-3 py-2",
                      isActive && "bg-sidebar-accent text-sidebar-primary font-medium",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="leading-snug">{t(item.title)}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { user, signOut } = useAuth();
  const { language, setLanguage, options, t } = useLanguage();
  const collapsed = state === "collapsed";
  const closeMobileNav = () => {
    if (isMobile) setOpenMobile(false);
  };

  const groups = navGroupsForRole(user.role);
  const initials =
    user.displayName
      .split(/\s+/)
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className={cn("p-4", collapsed && "items-center gap-0 px-0 py-2")}>
        <div className={cn("flex items-center gap-2", collapsed && "w-full justify-center")}>
          <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sidebar-accent/60">
            <HajimeLogo variant="dark" className="h-7 w-7 object-contain" alt="" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-display text-base font-semibold text-sidebar-foreground">Hajime</h1>
              <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40">Supply chain OS</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className={cn("px-2", collapsed && "px-0")}>
        {groups.map((g) => (
          <NavSection key={g.label} label={g.label} items={g.items} collapsed={collapsed} onNavigate={closeMobileNav} />
        ))}
      </SidebarContent>

      <SidebarFooter className={cn("gap-2 p-4", collapsed && "items-center gap-0 px-0 py-2")}>
        {!collapsed && (
          <>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
                {initials}
              </div>
              <div className="min-w-0 flex-1 text-xs">
                <p className="truncate font-medium text-sidebar-foreground">{user.displayName}</p>
                <p className="truncate text-sidebar-foreground/40">{ROLE_BADGE[user.role]}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40">{t("Language")}</p>
              <Select value={language} onValueChange={(v) => setLanguage(v as typeof language)}>
                <SelectTrigger className="h-8 bg-sidebar text-xs">
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
          </>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "w-full touch-manipulation",
            collapsed && "mx-auto size-8 shrink-0 justify-center p-0 !px-0",
          )}
          onClick={() => signOut()}
        >
          <LogOut className={cn("h-4 w-4", !collapsed && "mr-2")} />
          {!collapsed && t("Sign out")}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
