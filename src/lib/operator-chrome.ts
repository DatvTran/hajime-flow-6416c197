import type { HajimeRole } from "@/contexts/AuthContext";

export type OperatorRouteChrome = { section: string; page: string };

/** Longest-prefix wins; aligns top bar with sidebar IA from Hajime Design System shell. */
const RULES: { prefix: string; section: string; page: string }[] = [
  { prefix: "/manufacturer/product-requests", section: "Manufacturer", page: "New product requests" },
  { prefix: "/manufacturer/purchase-orders", section: "Manufacturer", page: "Production orders" },
  { prefix: "/manufacturer/market-demand", section: "Manufacturer", page: "Market demand" },
  { prefix: "/manufacturer/profiles", section: "Supply chain", page: "Manufacturer profiles" },
  { prefix: "/manufacturer/inventory", section: "Manufacturer", page: "Batch history" },
  { prefix: "/manufacturer/shipments", section: "Manufacturer", page: "Shipments" },
  { prefix: "/manufacturer/alerts", section: "Manufacturer", page: "Alerts" },
  { prefix: "/manufacturer/finance", section: "Manufacturer", page: "Payments & receipts" },
  { prefix: "/manufacturer/profile", section: "Account", page: "Profile" },
  { prefix: "/manufacturer", section: "Manufacturer", page: "Overview" },

  { prefix: "/distributor/purchase-orders", section: "Operations", page: "Production requests" },
  { prefix: "/distributor/inventory", section: "Operations", page: "Warehouse inventory" },
  { prefix: "/distributor/sellthrough", section: "Operations", page: "Sell-through velocity" },
  { prefix: "/distributor/depletions", section: "Operations", page: "Report depletions" },
  { prefix: "/distributor/adjustments", section: "Operations", page: "Inventory adjustments" },
  { prefix: "/distributor/backorders", section: "Operations", page: "Backorders" },
  { prefix: "/distributor/accounts", section: "Operations", page: "Retail accounts" },
  { prefix: "/distributor/crm", section: "Operations", page: "Partner CRM" },
  { prefix: "/distributor/finance", section: "Operations", page: "Payments & remits" },
  { prefix: "/distributor/reports", section: "Service", page: "Analytics" },
  { prefix: "/distributor/alerts", section: "Service", page: "Alerts hub" },
  { prefix: "/distributor/pick-pack", section: "Operations", page: "Pick & pack" },
  { prefix: "/distributor/log-shipment", section: "Operations", page: "Log shipment" },
  { prefix: "/distributor/orders", section: "Operations", page: "Orders to fulfill" },
  { prefix: "/distributor/shipments", section: "Operations", page: "Deliveries" },
  { prefix: "/distributor", section: "Operations", page: "Floor · today" },

  { prefix: "/sales/opportunities", section: "Field", page: "Opportunities" },
  { prefix: "/sales/accounts", section: "Field", page: "My accounts" },
  { prefix: "/sales/orders", section: "Field", page: "Draft orders" },
  { prefix: "/sales/visits", section: "Field", page: "Visit notes" },
  { prefix: "/sales/targets", section: "Performance", page: "Targets" },
  { prefix: "/sales/reports", section: "Performance", page: "Analytics" },
  { prefix: "/sales/alerts", section: "Performance", page: "Alerts" },
  { prefix: "/sales/crm", section: "Field", page: "Retail CRM requests" },
  { prefix: "/sales", section: "Field", page: "Field · today" },

  { prefix: "/global-markets", section: "Operations", page: "Global markets" },
  { prefix: "/purchase-orders", section: "Supply chain", page: "Production requests" },
  { prefix: "/product-development", section: "Supply chain", page: "Product development" },

  { prefix: "/inventory", section: "Operations", page: "Inventory" },
  { prefix: "/orders", section: "Operations", page: "Orders" },
  { prefix: "/accounts", section: "Operations", page: "Accounts" },
  { prefix: "/markets", section: "Operations", page: "Markets" },
  { prefix: "/shipments", section: "Operations", page: "Shipments" },
  { prefix: "/reports", section: "Insights", page: "Analytics" },
  { prefix: "/alerts", section: "Insights", page: "Alerts hub" },
  { prefix: "/finance", section: "Insights", page: "Payments & AR/AP" },
  { prefix: "/incentives", section: "Insights", page: "Incentive Manager" },
  { prefix: "/crm", section: "HQ", page: "CRM" },
  { prefix: "/settings", section: "HQ", page: "HQ settings" },
  { prefix: "/", section: "Operations", page: "Today · command center" },
];

export function operatorRouteChrome(pathname: string): OperatorRouteChrome {
  let path = pathname.split("?")[0] || "/";
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

  const sorted = [...RULES].sort((a, b) => b.prefix.length - a.prefix.length);

  for (const rule of sorted) {
    if (rule.prefix === "/") {
      if (path === "/" || path === "") return { section: rule.section, page: rule.page };
      continue;
    }
    if (path === rule.prefix || path.startsWith(`${rule.prefix}/`)) {
      return { section: rule.section, page: rule.page };
    }
  }

  return { section: "Hajime", page: "Workspace" };
}

export function alertsPathForRole(role: HajimeRole): string {
  if (role === "manufacturer") return "/manufacturer/alerts";
  if (role === "distributor") return "/distributor/alerts";
  if (role === "sales_rep" || role === "sales") return "/sales/alerts";
  return "/alerts";
}
