import type { Account } from "@/data/mockData";

/** B2B new-order dialog modes — retail uses `/retail/new-order` instead. */
export type NewSalesOrderFormVariant = "brand" | "distributor" | "manufacturer" | "sales_rep";

export type SalesOrderFormVariantConfig = {
  title: string;
  description: string;
  badge: string;
  accent: string;
  /** Optional note under the header */
  contextNote?: string;
  customerSectionLabel: string;
  lineItemSectionLabel: string;
  assignmentSectionLabel: string;
  submitLabel: string;
};

const VARIANT_CONFIG: Record<NewSalesOrderFormVariant, SalesOrderFormVariantConfig> = {
  brand: {
    title: "New wholesale order",
    description:
      "Create a sell-in on behalf of Hajime HQ — full CRM, allocation, and lifecycle. Same record feeds Command center and Analytics.",
    badge: "Brand HQ",
    accent: "border-t-4 border-t-primary bg-gradient-to-b from-primary/5 to-transparent",
    contextNote: "Orders start as draft unless you set otherwise; retail-originated requests land in Pending review.",
    customerSectionLabel: "Customer & market",
    lineItemSectionLabel: "Line item",
    assignmentSectionLabel: "Owner & lifecycle",
    submitLabel: "Create order",
  },
  distributor: {
    title: "Route order to account",
    description:
      "Log a wholesaler sell-in for your territory — prioritizes on-premise and retail accounts you fulfill. Feeds open pipeline and delivery planning.",
    badge: "Wholesaler",
    accent: "border-t-4 border-t-amber-500 bg-gradient-to-b from-amber-500/10 to-transparent",
    contextNote: "Account list favors venues and independents on your route; use All accounts in CRM if needed.",
    customerSectionLabel: "Delivery account & market",
    lineItemSectionLabel: "SKU & quantity",
    assignmentSectionLabel: "Rep & status",
    submitLabel: "Record route order",
  },
  manufacturer: {
    title: "Sell-in reference (visibility)",
    description:
      "Optional mirror of partner sell-in for planning — primary production path remains Production orders. Use for cross-checking depletion vs. POs.",
    badge: "Manufacturer",
    accent: "border-t-4 border-t-slate-500 bg-gradient-to-b from-slate-500/10 to-transparent",
    contextNote: "Defaults to draft; HQ may confirm. Does not reserve inventory until linked workflows run.",
    customerSectionLabel: "Partner / ship-to account",
    lineItemSectionLabel: "SKU line",
    assignmentSectionLabel: "Status (optional)",
    submitLabel: "Save sell-in line",
  },
  sales_rep: {
    title: "Draft for customer",
    description:
      "Create a field draft attributed to you — appears in Pending review until HQ or the customer confirms allocation and pricing.",
    badge: "Field sales",
    accent: "border-t-4 border-t-emerald-600 bg-gradient-to-b from-emerald-600/10 to-transparent",
    contextNote: "Sales rep is locked to your session for attribution.",
    customerSectionLabel: "Account & market",
    lineItemSectionLabel: "Product line",
    assignmentSectionLabel: "Review & handoff",
    submitLabel: "Submit draft",
  },
};

export function getSalesOrderFormVariantConfig(variant: NewSalesOrderFormVariant): SalesOrderFormVariantConfig {
  return VARIANT_CONFIG[variant];
}

export function accountsForSalesOrderVariant(accounts: Account[], variant: NewSalesOrderFormVariant): Account[] {
  if (variant === "distributor") {
    const route = accounts.filter((a) => ["retail", "restaurant", "bar", "hotel", "lifestyle"].includes(a.type));
    return route.length > 0 ? route : accounts;
  }
  if (variant === "manufacturer") {
    const b2b = accounts.filter(
      (a) =>
        a.type === "distributor" ||
        /lcbo|convoy|ontario|wholesale/i.test(a.tradingName + a.legalName),
    );
    return b2b.length > 0 ? b2b : accounts;
  }
  return accounts;
}

export function mapRoleToSalesOrderFormVariant(
  role: "brand_operator" | "distributor" | "manufacturer" | "sales_rep" | "retail",
): NewSalesOrderFormVariant {
  switch (role) {
    case "brand_operator":
      return "brand";
    case "distributor":
      return "distributor";
    case "manufacturer":
      return "manufacturer";
    case "sales_rep":
      return "sales_rep";
    default:
      return "brand";
  }
}
