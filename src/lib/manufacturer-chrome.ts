/** Top-bar breadcrumbs for the manufacturer shell (matches manufacturer-app.html IA). */
export function manufacturerRouteChrome(pathname: string): { section: string; page: string } {
  if (pathname === "/manufacturer" || pathname === "/manufacturer/") {
    return { section: "Production", page: "Dashboard" };
  }
  if (pathname.startsWith("/manufacturer/purchase-orders")) {
    return { section: "Production", page: "Production requests" };
  }
  if (pathname.startsWith("/manufacturer/brew-batches")) {
    return { section: "Production", page: "Brew batches" };
  }
  if (pathname.startsWith("/manufacturer/bottling-line")) {
    return { section: "Production", page: "Bottling line" };
  }
  if (pathname.startsWith("/manufacturer/materials")) {
    return { section: "Supply", page: "Raw materials" };
  }
  if (pathname.startsWith("/manufacturer/finished-goods")) {
    return { section: "Supply", page: "Finished goods" };
  }
  if (pathname.startsWith("/manufacturer/shipments")) {
    return { section: "Supply", page: "Shipments to HQ" };
  }
  if (pathname.startsWith("/manufacturer/quality")) {
    return { section: "Quality & performance", page: "Quality control" };
  }
  if (pathname.startsWith("/manufacturer/analytics")) {
    return { section: "Quality & performance", page: "Analytics & reports" };
  }
  if (pathname.startsWith("/manufacturer/support") || pathname.startsWith("/manufacturer/alerts")) {
    return { section: "Quality & performance", page: "Support" };
  }
  if (pathname.startsWith("/manufacturer/product-requests")) {
    return { section: "Production", page: "Production requests" };
  }
  if (pathname.startsWith("/manufacturer/inventory")) {
    return { section: "Supply", page: "Raw materials" };
  }
  if (pathname.startsWith("/manufacturer/profile")) {
    return { section: "Quality & performance", page: "Quality control" };
  }
  if (pathname.startsWith("/manufacturer/market-demand")) {
    return { section: "Quality & performance", page: "Analytics & reports" };
  }
  if (pathname.startsWith("/manufacturer/finance")) {
    return { section: "Supply", page: "Finished goods" };
  }

  return { section: "Production", page: "Dashboard" };
}
