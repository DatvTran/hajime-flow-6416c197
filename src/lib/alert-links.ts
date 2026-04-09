import type { HajimeRole } from "@/contexts/AuthContext";
import type { DerivedAlert } from "@/lib/hajime-metrics";

/**
 * Deep links from derived alerts to the screen where the user can act (inventory, PO, shipment, order, markets).
 * Respects role: retail/sales_rep cannot open HQ-only routes.
 */
export function resolveAlertHref(alert: DerivedAlert, role: HajimeRole): string {
  const { id, type } = alert;

  if (type === "low-stock" && id.startsWith("low-")) {
    const sku = id.slice("low-".length);
    if (role === "retail") {
      return `/retail/new-order?sku=${encodeURIComponent(sku)}&cases=1`;
    }
    if (role === "manufacturer") {
      return `/manufacturer/inventory?sku=${encodeURIComponent(sku)}`;
    }
    return `/inventory?sku=${encodeURIComponent(sku)}`;
  }

  if (type === "reorder" && id.startsWith("reorder-")) {
    const sku = id.slice("reorder-".length);
    if (role === "retail") {
      return `/retail/new-order?sku=${encodeURIComponent(sku)}&cases=1`;
    }
    if (role === "manufacturer") {
      return `/manufacturer/inventory?sku=${encodeURIComponent(sku)}`;
    }
    return `/inventory?sku=${encodeURIComponent(sku)}`;
  }

  if (type === "delay" && id.startsWith("po-delay-")) {
    if (role === "sales_rep" || role === "retail") return "/sales/alerts";
    if (role === "manufacturer") {
      const poId = id.slice("po-delay-".length);
      return `/manufacturer/purchase-orders?po=${encodeURIComponent(poId)}`;
    }
    const poId = id.slice("po-delay-".length);
    return `/purchase-orders?po=${encodeURIComponent(poId)}`;
  }

  if (type === "shipment") {
    let shId: string | null = null;
    if (id.startsWith("sh-late-")) shId = id.slice("sh-late-".length);
    else if (id.startsWith("sh-")) shId = id.slice("sh-".length);
    if (shId) {
      if (role === "manufacturer") {
        return `/manufacturer/shipments?q=${encodeURIComponent(shId)}`;
      }
      return `/shipments?q=${encodeURIComponent(shId)}`;
    }
  }

  if (type === "payment" && id.startsWith("pay-")) {
    const orderId = id.slice("pay-".length);
    if (role === "retail") return `/retail/orders/${encodeURIComponent(orderId)}`;
    if (role === "manufacturer") {
      return `/manufacturer/orders?order=${encodeURIComponent(orderId)}`;
    }
    return `/orders?order=${encodeURIComponent(orderId)}`;
  }

  if (type === "demand-spike") {
    if (role === "retail" || role === "sales_rep") return "/sales/alerts";
    if (role === "manufacturer") return "/manufacturer/alerts";
    return "/markets";
  }

  if (type === "account") {
    if (role === "sales_rep") return "/sales/accounts";
    return "/accounts";
  }

  if (role === "sales_rep") return "/sales/alerts";
  if (role === "manufacturer") return "/manufacturer/alerts";
  return "/alerts";
}
