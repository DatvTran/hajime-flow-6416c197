import type { HajimeRole } from "@/contexts/AuthContext";

export type PageHeaderKitVariant = "default" | "retail" | "sales_rep" | "distributor" | "hq";

/** Typography for portal shells and shared routes (/inventory, /sales/*, /distributor/*). */
export function pageHeaderVariantForRole(role: HajimeRole): PageHeaderKitVariant {
  if (role === "retail") return "retail";
  if (role === "sales_rep" || role === "sales") return "sales_rep";
  if (role === "distributor") return "distributor";
  if (role === "brand_operator" || role === "founder_admin") return "hq";
  return "default";
}
