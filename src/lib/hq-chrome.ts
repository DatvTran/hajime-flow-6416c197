import { EXPORT_SELLER } from "@/lib/export-commercial";

/** Top-bar breadcrumbs for the HQ operator shell (hq-operator-app.html IA). */
export function hqRouteChrome(pathname: string, search = ""): { section: string; page: string } {
  const path = pathname.replace(/\/$/, "") || "/";
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);

  if (path === "/" || path === "") {
    return { section: "HQ", page: "Dashboard" };
  }
  if (path.startsWith("/production-requests/new") || path.startsWith("/purchase-orders/new")) {
    return { section: "Command", page: "Reorder production" };
  }
  if (path.startsWith("/production-requests") || path.startsWith("/purchase-orders")) {
    return { section: "Command", page: "Production requests" };
  }
  if (path.startsWith("/product-development/new")) {
    return { section: "Command", page: "New alcohol concept" };
  }
  if (/^\/product-development\/[^/]+$/.test(path) && path !== "/product-development/new") {
    return { section: "Command", page: "Concept brief" };
  }
  if (path.startsWith("/product-development")) {
    return { section: "Command", page: "Product Development" };
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
    return { section: "Network", page: "Distilleries" };
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
    if (params.get("view") === "retail") {
      return { section: "Network", page: "Retail accounts" };
    }
    return { section: "Network", page: "Distributors" };
  }
  if (path.startsWith("/incentives")) {
    return { section: "Brand", page: "Incentive programs" };
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
  if (path.startsWith("/expo-leads/booth")) {
    return { section: "Command", page: "Expo booth" };
  }
  if (path.startsWith("/expo-leads")) {
    return { section: "Command", page: "Expo leads" };
  }
  if (path.startsWith("/export-orders")) {
    return { section: "Command", page: "Export orders" };
  }
  if (path.startsWith("/brand-kit")) {
    return { section: "Brand", page: "Brand kit" };
  }
  if (path.startsWith("/crm")) {
    return { section: "Network", page: "Sales reps" };
  }
  if (path.startsWith("/finance")) {
    return { section: "Brand", page: "Payments" };
  }
  if (path.startsWith("/global-markets")) {
    return { section: "Command", page: "Global markets" };
  }

  return { section: "HQ", page: "Workspace" };
}

/**
 * Left crumb account/org for HQ top bar.
 * Export commercial surfaces → Hajime Ltd.; partner detail → that wholesaler; else HQ.
 */
export function hqChromeOrgLabel(
  pathname: string,
  opts?: { partnerOrgName?: string | null },
): string {
  const path = pathname.replace(/\/$/, "") || "/";
  if (path.startsWith("/export-orders") || path.startsWith("/brand-kit")) {
    return EXPORT_SELLER.legalName;
  }
  if (path.startsWith("/partners/distributor")) {
    const name = (opts?.partnerOrgName || "").trim();
    if (name) return name;
  }
  return "HQ";
}
