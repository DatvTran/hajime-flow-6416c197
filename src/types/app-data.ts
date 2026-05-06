import type {
  Account,
  InventoryItem,
  Product,
  ProductionStatus,
  PurchaseOrder,
  SalesOrder,
  Shipment,
  NewProductRequest,
  TransferOrder,
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
  /** Retail shelf — alert when on-premise bottles fall below this (per SKU line). */
  retailerStockThresholdBottles?: number;
  /** HQ labels — persisted in operational_settings (Settings → Company & replenishment). */
  companyName?: string;
  primaryMarkets?: string;
  manufacturerName?: string;
};

/** Multi-node cash visibility: retailer → wholesaler → manufacturer (demo ledger). */
export type FinancingLedgerEntry = {
  id: string;
  at: string;
  kind: "retailer_to_wholesaler" | "wholesaler_to_manufacturer" | "manufacturer_receipt";
  fromLabel: string;
  toLabel: string;
  amountCad: number;
  description: string;
  orderId?: string;
  purchaseOrderId?: string;
  status: "recorded" | "pending";
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
  /** When false, row exists in DB but was soft-deleted from CRM (not returned by default API). */
  isActive?: boolean;
  /** Receiving depot chosen by distributor (`PATCH /me/primary-warehouse`). */
  primaryWarehouseId?: string;
  /** Sales-rep-submitted retail row awaiting wholesaler approval (`POST /team-members/:id/approve-retail`). */
  pendingDistributorApproval?: boolean;
  crmRequestedByUserId?: string;
};

/** Brand HQ warehouse / depot locations for inventory and transfers. */
export type Warehouse = {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  /** @deprecated Prefer linkedTeamMemberId — CRM distributor contact */
  linkedAccountId?: string;
  /** CRM contact (`team_members`) with distributor role — matches Settings → CRM. */
  linkedTeamMemberId?: string;
};

export type ManufacturerProfileCertification = {
  id: string;
  name: string;
  issuer: string;
  issuedAt: string;
  expiresAt: string;
  status: "active" | "expired" | "pending";
};

export type ManufacturerProfileEquipment = {
  id: string;
  name: string;
  capacity: string;
  status: "operational" | "maintenance" | "offline";
};

/** Manufacturer portal profile (UI state; persisted via `/api/v1/manufacturer-profiles`). */
export type ManufacturerProfile = {
  id?: string;
  manufacturerId?: string;
  companyName: string;
  legalName: string;
  address: {
    street: string;
    city: string;
    region: string;
    country: string;
    postalCode: string;
  };
  primaryContact: {
    name: string;
    role: string;
    email: string;
    phone: string;
  };
  backupContact: {
    name: string;
    role: string;
    email: string;
    phone: string;
  };
  productionCapacity: {
    monthlyCases: number;
    peakCapacity: number;
    currentUtilization: number;
  };
  certifications: ManufacturerProfileCertification[];
  equipment: ManufacturerProfileEquipment[];
  taxId: string;
  website: string;
  description: string;
};

export type AppData = {
  version: 1;
  products: Product[];
  inventory: InventoryItem[];
  accounts: Account[];
  salesOrders: SalesOrder[];
  purchaseOrders: PurchaseOrder[];
  transferOrders?: TransferOrder[];
  shipments: Shipment[];
  productionStatuses: ProductionStatus[];
  operationalSettings?: OperationalSettings;
  auditLogs?: AuditLogEntry[];
  /** Directory of invited portal users (V1: roster + intended role; auth remains demo). */
  teamMembers?: TeamMember[];
  /** Retailer venue shelf / back-bar stock (account id → sku → bottles). */
  retailerShelfStock?: Record<string, Record<string, number>>;
  /** AR/AP style entries across nodes (Brand sees all). */
  financingLedger?: FinancingLedgerEntry[];
  /** Field visit notes — synced across roles via AppData (replaces localStorage-only). */
  visitNotes?: VisitNoteEntry[];
  /** New product development requests — brand → manufacturer → production PO pipeline. */
  newProductRequests?: NewProductRequest[];
  /** Distributor-reported depletion data — actual sell-through vs orders. */
  depletionReports?: import("@/data/mockData").DepletionReport[];
  /** Distributor inventory adjustment requests — reconcile physical counts. */
  inventoryAdjustmentRequests?: import("@/data/mockData").InventoryAdjustmentRequest[];
  /** Warehouse / depot directory (Settings-managed). */
  warehouses?: Warehouse[];
  /** Manufacturer portal company profile (Manufacturer Profile page). */
  manufacturerProfile?: ManufacturerProfile;
};

export type VisitNoteEntry = {
  id: string;
  /** ISO or display timestamp */
  at: string;
  account: string;
  body: string;
  /** Matches `salesRep` / team roster name */
  authorRep: string;
};
