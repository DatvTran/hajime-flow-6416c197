import type { LucideIcon } from "lucide-react";
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
  LineChart,
  Receipt,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
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

export type NavItem = { title: string; url: string; icon: LucideIcon };

export type NavGroupDef = { label: string; items: NavItem[] };

const ROLE_BADGE: Record<HajimeRole, string> = {
  brand_operator: "Brand Operator (HQ)",
  manufacturer: "Manufacturer",
  distributor: "Distributor / Wholesaler",
  retail: "Retail Store / Account",
  sales_rep: "Sales Rep",
};

/** Spec §4 — focused sidebar per role; URLs map to shared AppData routes. */
function navGroupsForRole(role: HajimeRole): NavGroupDef[] {
  switch (role) {
    case "manufacturer":
      return [
        {
          label: "Manufacturer",
          items: [
            { title: "Overview", url: "/manufacturer", icon: LayoutDashboard },
            { title: "Production orders", url: "/purchase-orders", icon: FileText },
            { title: "Sell-in orders", url: "/orders", icon: ShoppingCart },
            { title: "Shipments", url: "/shipments", icon: Truck },
            { title: "Batch history", url: "/inventory", icon: Package },
            { title: "Market demand", url: "/manufacturer/market-demand", icon: Globe },
            { title: "Alerts", url: "/alerts", icon: AlertTriangle },
            { title: "Payments & receipts", url: "/finance", icon: Receipt },
          ],
        },
        {
          label: "Account",
          items: [{ title: "Profile", url: "/manufacturer/profile", icon: User }],
        },
      ];
    case "brand_operator":
      return [
        {
          label: "Operations",
          items: [
            { title: "Command center", url: "/", icon: LayoutDashboard },
            { title: "Inventory", url: "/inventory", icon: Package },
            { title: "Orders", url: "/orders", icon: ShoppingCart },
            { title: "Markets", url: "/markets", icon: Globe },
            { title: "Accounts", url: "/accounts", icon: Users },
            { title: "Shipments", url: "/shipments", icon: Truck },
          ],
        },
        {
          label: "Supply chain",
          items: [
            { title: "Production requests", url: "/purchase-orders", icon: FileText },
            { title: "Manufacturer portal", url: "/manufacturer", icon: Factory },
          ],
        },
        {
          label: "Insights",
          items: [
            { title: "Analytics", url: "/reports", icon: BarChart3 },
            { title: "Alerts", url: "/alerts", icon: AlertTriangle },
            { title: "Payments & AR/AP", url: "/finance", icon: Receipt },
          ],
        },
        {
          label: "HQ",
          items: [{ title: "Team / settings", url: "/settings", icon: Settings }],
        },
      ];
    case "distributor":
      return [
        {
          label: "Operations",
          items: [
            { title: "Overview", url: "/", icon: LayoutDashboard },
            { title: "Warehouse inventory", url: "/inventory", icon: Warehouse },
            { title: "Orders to fulfill", url: "/orders?tab=approved", icon: ShoppingCart },
            { title: "Production requests", url: "/purchase-orders", icon: FileText },
            { title: "Deliveries", url: "/shipments", icon: Truck },
            { title: "Retail accounts", url: "/accounts", icon: Users },
            { title: "Backorders", url: "/distributor/backorders", icon: ClipboardList },
            { title: "Payments & remits", url: "/finance", icon: Receipt },
          ],
        },
        {
          label: "Service",
          items: [
            { title: "Alerts", url: "/alerts", icon: AlertTriangle },
            { title: "Analytics", url: "/reports", icon: LineChart },
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
            { title: "Overview", url: "/", icon: LayoutDashboard },
            { title: "My accounts", url: "/accounts", icon: Users },
            { title: "Opportunities", url: "/sales/opportunities", icon: TrendingUp },
            { title: "Visit notes", url: "/sales/visits", icon: ClipboardList },
            { title: "Draft orders", url: "/orders?tab=pending-review", icon: FileText },
          ],
        },
        {
          label: "Performance",
          items: [
            { title: "Targets", url: "/sales/targets", icon: Target },
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
  if (items.length === 0) return null;
  return (
    <SidebarGroup className={cn(collapsed && "px-0")}>
      {!collapsed && (
        <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/40">{label}</p>
      )}
      <SidebarGroupContent>
        <SidebarMenu className={cn(collapsed && "items-center")}>
          {items.map((item) => (
            <SidebarMenuItem key={item.title + item.url} className={cn(collapsed && "flex w-full justify-center")}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/" || item.url === "/manufacturer"}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center rounded-md text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    collapsed ? "size-8 shrink-0 justify-center gap-0 p-0" : "min-h-10 gap-3 px-3 py-2",
                  )}
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="leading-snug">{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { user, signOut } = useAuth();
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
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
              {initials}
            </div>
            <div className="min-w-0 flex-1 text-xs">
              <p className="truncate font-medium text-sidebar-foreground">{user.displayName}</p>
              <p className="truncate text-sidebar-foreground/40">{ROLE_BADGE[user.role]}</p>
            </div>
          </div>
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
          {!collapsed && "Sign out"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
