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
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
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

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Orders", url: "/orders", icon: ShoppingCart },
  { title: "Accounts", url: "/accounts", icon: Users },
];

const supplyNav = [
  { title: "Purchase Orders", url: "/purchase-orders", icon: FileText },
  { title: "Manufacturer", url: "/manufacturer", icon: Factory },
  { title: "Shipments", url: "/shipments", icon: Truck },
];

const insightsNav = [
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

function NavSection({ items, label, collapsed }: { items: typeof mainNav; label: string; collapsed: boolean }) {
  return (
    <SidebarGroup>
      {!collapsed && (
        <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/40">
          {label}
        </p>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/"}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
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
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
            <span className="text-sm font-bold text-sidebar-primary-foreground">H</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-display text-base font-semibold text-sidebar-foreground">Hajime</h1>
              <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40">B2B Operations</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <NavSection items={mainNav} label="Operations" collapsed={collapsed} />
        <NavSection items={supplyNav} label="Supply Chain" collapsed={collapsed} />
        <NavSection items={insightsNav} label="Insights" collapsed={collapsed} />
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
              AK
            </div>
            <div className="text-xs">
              <p className="font-medium text-sidebar-foreground">Admin</p>
              <p className="text-sidebar-foreground/40">Founder</p>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
