/** Top-bar breadcrumbs for the distributor shell (matches distributor-app.html IA). */
export function distributorRouteChrome(pathname: string, _search: string): { section: string; page: string } {
  if (pathname === "/distributor" || pathname === "/distributor/") {
    return { section: "Operations", page: "Dashboard" };
  }
  if (pathname.startsWith("/distributor/purchase-orders")) {
    return { section: "Operations", page: "Purchase orders" };
  }
  if (pathname.startsWith("/distributor/inventory")) {
    return { section: "Operations", page: "Inventory" };
  }
  if (pathname.startsWith("/distributor/pick-pack")) {
    return { section: "Operations", page: "Pick & pack" };
  }
  if (pathname.startsWith("/distributor/log-shipment")) {
    return { section: "Operations", page: "Log shipment" };
  }
  if (pathname.startsWith("/distributor/orders")) {
    return { section: "Operations", page: "Orders to fulfill" };
  }
  if (pathname.startsWith("/distributor/shipments")) {
    return { section: "Logistics", page: "Shipments" };
  }
  if (pathname.startsWith("/distributor/accounts")) {
    return { section: "Logistics", page: "Retail accounts" };
  }
  if (pathname.startsWith("/distributor/crm")) {
    return { section: "Logistics", page: "Sales reps" };
  }
  if (pathname.startsWith("/distributor/depletions")) {
    return { section: "Operations", page: "Report depletions" };
  }
  if (pathname.startsWith("/distributor/adjustments")) {
    return { section: "Operations", page: "Inventory adjustments" };
  }
  if (pathname.startsWith("/distributor/sellthrough")) {
    return { section: "Operations", page: "Sell-through velocity" };
  }
  if (pathname.startsWith("/distributor/backorders")) {
    return { section: "Operations", page: "Backorders" };
  }
  if (pathname.startsWith("/distributor/finance")) {
    return { section: "Performance", page: "Payments & remits" };
  }
  if (pathname.startsWith("/distributor/partner-program")) {
    return { section: "Performance", page: "Partner program" };
  }
  if (pathname.startsWith("/distributor/reports")) {
    return { section: "Performance", page: "Analytics & reports" };
  }
  if (pathname.startsWith("/distributor/alerts")) {
    return { section: "Performance", page: "Support" };
  }
  if (pathname.startsWith("/settings")) {
    return { section: "Account", page: "Settings" };
  }

  return { section: "Operations", page: "Dashboard" };
}
