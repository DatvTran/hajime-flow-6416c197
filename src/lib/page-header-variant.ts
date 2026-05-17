import type { HajimeRole } from "@/contexts/AuthContext";

export type PageHeaderKitVariant = "default" | "retail" | "sales_rep";

/** Typography for retail shell, sales rep shell (`SalesRepLayout`), and shared routes (/inventory, /sales/*). */
export function pageHeaderVariantForRole(role: HajimeRole): PageHeaderKitVariant {
  if (role === "retail") return "retail";
  if (role === "sales_rep" || role === "sales") return "sales_rep";
  return "default";
}
