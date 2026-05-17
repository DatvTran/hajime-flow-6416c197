/** Top-bar breadcrumbs for the sales rep shell (matches sales-rep-app.html tone). */
export function salesRepRouteChrome(pathname: string, search: string): { section: string; page: string } {
  const q = new URLSearchParams(search);
  const tab = q.get("tab");

  if (pathname === "/sales" || pathname === "/sales/") return { section: "Territory", page: "Overview" };
  if (pathname.startsWith("/sales/accounts")) return { section: "Territory", page: "Accounts" };
  if (pathname.startsWith("/sales/opportunities")) return { section: "Territory", page: "Pipeline" };
  if (pathname.startsWith("/sales/crm")) return { section: "Territory", page: "Retail CRM requests" };
  if (pathname.startsWith("/sales/visits")) return { section: "Performance", page: "Visit log" };
  if (pathname.startsWith("/sales/targets")) return { section: "Performance", page: "Targets" };
  if (pathname.startsWith("/sales/reports")) return { section: "Performance", page: "Territory analytics" };
  if (pathname.startsWith("/sales/alerts")) return { section: "Performance", page: "Alerts" };

  if (pathname.startsWith("/sales/orders")) {
    if (tab === "pending-review") return { section: "Orders", page: "Draft orders" };
    return { section: "Orders", page: "Submitted orders" };
  }

  if (pathname.startsWith("/inventory")) return { section: "Orders", page: "Stock & catalog" };
  if (pathname.startsWith("/alerts")) return { section: "Performance", page: "Alerts" };

  return { section: "Territory", page: "Overview" };
}
