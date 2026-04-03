import type {
  Account,
  InventoryItem,
  Product,
  ProductionStatus,
  PurchaseOrder,
  SalesOrder,
  Shipment,
} from "@/data/mockData";

export type AuditLogEntry = {
  id: string;
  at: string;
  action: string;
  entityType?: string;
  entityId?: string;
  detail?: string;
  userLabel?: string;
};

export type OperationalSettings = {
  manufacturerLeadTimeDays: number;
  /** Per-SKU low-stock / reorder safety floor in bottles */
  safetyStockBySku: Record<string, number>;
};

/** Partner / field roles invitable from HQ (maps to `HajimeRole` at login, excluding `brand_operator`). */
export type TeamMemberPortalRole = "sales_rep" | "retail" | "distributor" | "manufacturer";

export type TeamMember = {
  id: string;
  displayName: string;
  email: string;
  role: TeamMemberPortalRole;
  /** ISO date */
  createdAt: string;
};

export type AppData = {
  version: 1;
  products: Product[];
  inventory: InventoryItem[];
  accounts: Account[];
  salesOrders: SalesOrder[];
  purchaseOrders: PurchaseOrder[];
  shipments: Shipment[];
  productionStatuses: ProductionStatus[];
  operationalSettings?: OperationalSettings;
  auditLogs?: AuditLogEntry[];
  /** Directory of invited portal users (V1: roster + intended role; auth remains demo). */
  teamMembers?: TeamMember[];
};
