/** Top-bar breadcrumbs for the HQ operator shell (hq-operator-app.html IA). */
export function hqRouteChrome(pathname: string, search = ""): { section: string; page: string } {
  const path = pathname.replace(/\/$/, "") || "/";
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);

  if (path === "/" || path === "") {
    return { section: "HQ", page: "Dashboard" };
  }
  if (path.startsWith("/purchase-orders/new")) {
    return { section: "Command", page: "New production request" };
  }
  if (path.startsWith("/purchase-orders")) {
    return { section: "Command", page: "Production requests" };
  }
  if (path.startsWith("/orders")) {
    if (params.get("view") === "replenishment") {
      return { section: "Command", page: "Replenishment orders" };
    }
    if (params.get("view") === "sales") {
      return { section: "Command", page: "Distributor sales" };
    }
    return { section: "Command", page: "Distributor orders" };
  }
  if (path.startsWith("/markets")) {
    return { section: "Command", page: "Markets & allocation" };
  }
  if (path.startsWith("/manufacturer/profiles") || path.startsWith("/manufacturer")) {
    return { section: "Network", page: "Manufacturers" };
  }
  if (path.startsWith("/accounts/add")) {
    return { section: "Network", page: "Add distributor" };
  }
  if (path.startsWith("/partners/distributor")) {
    return { section: "Network", page: "Distributors" };
  }
  if (path.startsWith("/accounts")) {
    if (params.get("view") === "sales") {
      return { section: "Command", page: "Distributor sales" };
    }
    return { section: "Network", page: "Distributors" };
  }
  if (path.startsWith("/incentives")) {
    return { section: "Brand", page: "Incentive programs" };
  }
  if (path.startsWith("/product-development/new")) {
    return { section: "Brand", page: "New product request" };
  }
  if (path.startsWith("/product-development")) {
    return { section: "Brand", page: "Product development" };
  }
  if (path.startsWith("/inventory/add")) {
    return { section: "Brand", page: "Add SKU" };
  }
  if (path.startsWith("/inventory/sku/")) {
    return { section: "Brand", page: "Edit SKU" };
  }
  if (path.startsWith("/inventory")) {
    return { section: "Brand", page: "Product catalog" };
  }
  if (path.startsWith("/reports")) {
    return { section: "Brand", page: "Analytics" };
  }
  if (path.startsWith("/settings")) {
    return { section: "Brand", page: "Settings" };
  }
  if (path.startsWith("/alerts")) {
    return { section: "HQ", page: "Alerts" };
  }
  if (path.startsWith("/shipments")) {
    return { section: "Command", page: "Shipments" };
  }
  if (path.startsWith("/crm")) {
    return { section: "Network", page: "CRM" };
  }
  if (path.startsWith("/finance")) {
    return { section: "Brand", page: "Payments" };
  }
  if (path.startsWith("/global-markets")) {
    return { section: "Command", page: "Global markets" };
  }

  return { section: "HQ", page: "Workspace" };
}
