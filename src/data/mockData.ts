import accountsJson from "./hajime-accounts.json";

// Mock data for Hajime B2B Operations App

export const inventorySummary = {
  totalOnHand: 4820,
  available: 3240,
  reserved: 980,
  inTransit: 360,
  inProduction: 1200,
  damaged: 40,
};

export const salesSummary = {
  thisWeek: 142500,
  thisMonth: 578200,
  thisQuarter: 1842000,
  openOrders: 18,
  currency: "CAD",
};

export const alerts = [
  { id: "1", type: "low-stock" as const, message: "Hajime Original 750ml - below threshold (120 units)", time: "12 min ago", severity: "high" as const },
  { id: "2", type: "delay" as const, message: "PO-2024-047 production delayed by 3 days", time: "2 hrs ago", severity: "medium" as const },
  { id: "3", type: "reorder" as const, message: "Hajime Yuzu projected stockout in 14 days", time: "4 hrs ago", severity: "high" as const },
  { id: "4", type: "shipment" as const, message: "Shipment SH-1042 arrived at Toronto warehouse", time: "6 hrs ago", severity: "low" as const },
];

export const topAccounts = [
  { name: "LCBO Ontario", revenue: 245000, orders: 12, trend: 8.2 },
  { name: "Eataly Toronto", revenue: 89000, orders: 8, trend: 15.4 },
  { name: "Rinascente Milano", revenue: 67000, orders: 6, trend: -2.1 },
  { name: "Bar Basso", revenue: 54000, orders: 9, trend: 22.0 },
  { name: "The Drake Hotel", revenue: 42000, orders: 5, trend: 5.6 },
];

export type InTransitDetails = {
  transferOrderId: string;
  fromWarehouse: string;
  toWarehouse: string;
  toAccountId?: string;
  shipDate: string;
  expectedDelivery: string;
};

export type InventoryItem = {
  id: string;
  sku: string;
  productName: string;
  batchLot: string;
  productionDate: string;
  quantityBottles: number;
  quantityCases: number;
  warehouse: string;
  /** Business location classification - drives availability logic */
  locationType: "manufacturer" | "in_transit" | "distributor_warehouse" | "retail_shelf";
  status: "available" | "reserved" | "damaged";
  labelVersion: string;
  notes: string;
  /** For in_transit items: track the transfer order details */
  inTransitDetails?: InTransitDetails;
  /** For retail_shelf items: which account owns this stock */
  retailAccountId?: string;
};

export const inventoryItems: InventoryItem[] = [
  { id: "INV-001", sku: "HJM-OG-750", productName: "Hajime Original 750ml", batchLot: "B2024-112", productionDate: "2024-11-15", quantityBottles: 1440, quantityCases: 120, warehouse: "Toronto Main", locationType: "distributor_warehouse", status: "available", labelVersion: "v3.1", notes: "" },
  { id: "INV-002", sku: "HJM-OG-750", productName: "Hajime Original 750ml", batchLot: "B2024-108", productionDate: "2024-10-20", quantityBottles: 480, quantityCases: 40, warehouse: "Toronto Main", locationType: "distributor_warehouse", status: "reserved", labelVersion: "v3.1", notes: "Reserved for LCBO Q1" },
  { id: "INV-003", sku: "HJM-YZ-750", productName: "Hajime Yuzu 750ml", batchLot: "B2024-115", productionDate: "2024-12-01", quantityBottles: 720, quantityCases: 60, warehouse: "Toronto Main", locationType: "distributor_warehouse", status: "available", labelVersion: "v2.0", notes: "" },
  { id: "INV-004", sku: "HJM-YZ-750", productName: "Hajime Yuzu 750ml", batchLot: "B2024-116", productionDate: "2024-12-10", quantityBottles: 360, quantityCases: 30, warehouse: "Milan DC", locationType: "in_transit", status: "available", labelVersion: "v2.0", notes: "En route from manufacturer", inTransitDetails: { transferOrderId: "TO-2024-001", fromWarehouse: "Toronto Main", toWarehouse: "Milan DC", shipDate: "2024-12-15", expectedDelivery: "2025-01-15" } },
  { id: "INV-005", sku: "HJM-OG-375", productName: "Hajime Original 375ml", batchLot: "B2024-120", productionDate: "2024-12-15", quantityBottles: 960, quantityCases: 80, warehouse: "Toronto Main", locationType: "distributor_warehouse", status: "available", labelVersion: "v3.1", notes: "" },
  { id: "INV-006", sku: "HJM-SP-750", productName: "Hajime Sparkling 750ml", batchLot: "B2024-121", productionDate: "2025-01-05", quantityBottles: 1200, quantityCases: 100, warehouse: "Kirin Brewery Co.", locationType: "manufacturer", status: "available", labelVersion: "v1.0", notes: "New SKU launch batch" },
  { id: "INV-007", sku: "HJM-OG-750", productName: "Hajime Original 750ml", batchLot: "B2024-107", productionDate: "2024-10-01", quantityBottles: 48, quantityCases: 4, warehouse: "Toronto Main", locationType: "distributor_warehouse", status: "damaged", labelVersion: "v3.0", notes: "Water damage during storage" },
  { id: "INV-FP-01", sku: "HJM-FP-750", productName: "Hajime First Press Coffee Rhum 750ml", batchLot: "B2025-201", productionDate: "2025-03-01", quantityBottles: 360, quantityCases: 30, warehouse: "Toronto Main", locationType: "distributor_warehouse", status: "available", labelVersion: "v1.0", notes: "" },
];

export type SalesOrderLine = {
  sku: string;
  quantityBottles: number;
  lineTotal: number;
};

export type OrderRoutingTarget = "manufacturer" | "wholesaler" | "sales_rep" | "retail";
export type OrderCreatedByRole = "brand_operator" | "distributor" | "sales_rep" | "retail" | "manufacturer";
export type RepApprovalStatus = "not_required" | "pending" | "approved";

export type SalesOrder = {
  id: string;
  account: string;
  market: string;
  orderDate: string;
  requestedDelivery: string;
  sku: string;
  quantity: number;
  price: number;
  salesRep: string;
  status: "draft" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "pending" | "paid" | "overdue";
  /** Intended pathway (Brand HQ / B2B creator). */
  orderRoutingTarget?: OrderRoutingTarget;
  /** Portal role that created the order. */
  orderCreatedByRole?: OrderCreatedByRole;
  /** Retail portal: sales rep must approve before payment; then wholesaler ships. */
  repApprovalStatus?: RepApprovalStatus;
  /** Wholesaler ordering on behalf of a field rep's territory. */
  assignedSalesRep?: string;
  /** Multi-SKU retail checkout — when set, sku/quantity/price remain rollup for legacy views */
  lines?: SalesOrderLine[];
  customerPoReference?: string;
  orderNotes?: string;
  deliveryAddress?: string;
  invoiceStatus?: "not_invoiced" | "invoiced" | "paid";
  /** Sell-through (depletion) — optional Phase 1 field for account-level consumer movement */
  sellThroughUnits?: number;
  /** Actual delivery when known */
  actualDeliveryDate?: string;
  /** After retail pays — wholesaler must acknowledge before packing (demo workflow). */
  wholesalerFulfillmentStatus?: "pending_ack" | "acknowledged" | "in_fulfillment";
  /** Sales rep created this B2B order for a retail account (on behalf of retailer). */
  placedOnBehalfByRep?: boolean;
  /** PROXY MODE: Role that actually placed the order (when different from account owner) */
  placedByRole?: OrderCreatedByRole;
  /** PROXY MODE: Account ID that this order was placed on behalf of */
  onBehalfOfAccount?: string;
};

export const salesOrders: SalesOrder[] = [
  { id: "SO-2025-001", account: "LCBO Ontario", market: "Ontario", orderDate: "2026-03-28", requestedDelivery: "2026-04-07", sku: "HJM-OG-750", quantity: 240, price: 18500, salesRep: "Marcus Chen", status: "confirmed", paymentStatus: "pending" },
  { id: "SO-2025-002", account: "Eataly Toronto", market: "Toronto", orderDate: "2026-03-20", requestedDelivery: "2026-03-30", sku: "HJM-YZ-750", quantity: 60, price: 5400, salesRep: "Sarah Kim", status: "packed", paymentStatus: "pending" },
  { id: "SO-2025-003", account: "Bar Basso", market: "Milan", orderDate: "2026-03-18", requestedDelivery: "2026-03-28", sku: "HJM-OG-750", quantity: 120, price: 9200, salesRep: "Luca Moretti", status: "shipped", paymentStatus: "paid" },
  { id: "SO-2025-004", account: "The Drake Hotel", market: "Toronto", orderDate: "2026-03-25", requestedDelivery: "2026-04-05", sku: "HJM-OG-375", quantity: 48, price: 2160, salesRep: "Marcus Chen", status: "draft", paymentStatus: "pending" },
  { id: "SO-2025-005", account: "Rinascente Milano", market: "Milan", orderDate: "2026-03-12", requestedDelivery: "2026-03-22", sku: "HJM-YZ-750", quantity: 96, price: 8640, salesRep: "Luca Moretti", status: "delivered", paymentStatus: "paid" },
  { id: "SO-2025-006", account: "Pusateri's", market: "Toronto", orderDate: "2026-03-22", requestedDelivery: "2026-04-02", sku: "HJM-OG-750", quantity: 36, price: 2770, salesRep: "Sarah Kim", status: "confirmed", paymentStatus: "pending" },
  { id: "SO-2025-007", account: "Galeries Lafayette Paris", market: "Paris", orderDate: "2026-03-10", requestedDelivery: "2026-03-22", sku: "HJM-OG-750", quantity: 72, price: 6480, salesRep: "Luca Moretti", status: "packed", paymentStatus: "pending" },
  {
    id: "SO-2025-008",
    account: "The Drake Hotel",
    market: "Toronto",
    orderDate: "2026-03-29",
    requestedDelivery: "2026-04-05",
    sku: "HJM-FP-750",
    quantity: 72,
    price: 8640,
    salesRep: "Marcus Chen",
    status: "shipped",
    paymentStatus: "pending",
    lines: [{ sku: "HJM-FP-750", quantityBottles: 72, lineTotal: 8640 }],
    customerPoReference: "DRK-Q1-14",
    invoiceStatus: "not_invoiced",
  },
  {
    id: "SO-2025-009",
    account: "The Drake Hotel",
    market: "Toronto",
    orderDate: "2026-03-15",
    requestedDelivery: "2026-03-22",
    sku: "HJM-OG-750",
    quantity: 120,
    price: 9480,
    salesRep: "Marcus Chen",
    status: "delivered",
    paymentStatus: "paid",
    lines: [
      { sku: "HJM-OG-750", quantityBottles: 48, lineTotal: 3840 },
      { sku: "HJM-FP-750", quantityBottles: 72, lineTotal: 5640 },
    ],
    actualDeliveryDate: "2026-03-21",
    invoiceStatus: "paid",
  },
  {
    id: "SO-2025-010",
    account: "Convoy Supply Ontario",
    market: "Ontario",
    orderDate: "2026-03-26",
    requestedDelivery: "2026-04-02",
    sku: "HJM-OG-750",
    quantity: 480,
    price: 37000,
    salesRep: "Marcus Chen",
    status: "confirmed",
    paymentStatus: "pending",
    customerPoReference: "CVY-ONT-Q1-02",
    deliveryAddress: "Convoy Supply DC, 2200 Meadowpine Blvd, Mississauga, ON L5N 0A4, Canada",
    orderNotes: "Pallet release for LCBO lane - coordinate with SH-1043 timing.",
  },
  {
    id: "SO-2025-011",
    account: "Otto Atelier",
    market: "Toronto",
    orderDate: "2026-03-24",
    requestedDelivery: "2026-03-30",
    sku: "HJM-YZ-750",
    quantity: 24,
    price: 2160,
    salesRep: "Sarah Kim",
    status: "delivered",
    paymentStatus: "paid",
    actualDeliveryDate: "2026-03-28",
    invoiceStatus: "paid",
  },
  {
    id: "SO-2026-REG-01",
    account: "Nobu Toronto",
    market: "Toronto",
    orderDate: "2026-03-28",
    requestedDelivery: "2026-04-08",
    sku: "HJM-OG-750",
    quantity: 48,
    price: 4320,
    salesRep: "Jordan Lee",
    status: "confirmed",
    paymentStatus: "pending",
  },
  {
    id: "SO-2026-REG-02",
    account: "Otto Atelier",
    market: "Toronto",
    orderDate: "2026-03-30",
    requestedDelivery: "2026-04-06",
    sku: "HJM-YZ-750",
    quantity: 36,
    price: 2880,
    salesRep: "Jordan Lee",
    status: "packed",
    paymentStatus: "pending",
  },
  {
    id: "SO-2026-REG-03",
    account: "Bar Basso",
    market: "Milan",
    orderDate: "2026-03-26",
    requestedDelivery: "2026-04-02",
    sku: "HJM-OG-750",
    quantity: 72,
    price: 7200,
    salesRep: "Jordan Lee",
    status: "shipped",
    paymentStatus: "paid",
  },
  {
    id: "SO-2026-REG-04",
    account: "Rinascente Milano",
    market: "Milan",
    orderDate: "2026-03-29",
    requestedDelivery: "2026-04-05",
    sku: "HJM-YZ-750",
    quantity: 48,
    price: 5120,
    salesRep: "Jordan Lee",
    status: "confirmed",
    paymentStatus: "pending",
  },
];

export type Account = {
  id: string;
  legalName: string;
  tradingName: string;
  country: string;
  city: string;
  type: "retail" | "bar" | "restaurant" | "hotel" | "distributor" | "lifestyle";
  contactName: string;
  contactRole: string;
  phone: string;
  email: string;
  salesOwner: string;
  paymentTerms: string;
  firstOrderDate: string;
  lastOrderDate: string;
  avgOrderSize: number;
  status: "active" | "prospect" | "inactive";
  tags: string[];
  /** Default card on file (Stripe) - last four digits */
  cardOnFileLast4?: string;
  /** Estimated consumer depletion in last reporting period (bottles) */
  sellThroughLastPeriod?: number;
  lastContactDate?: string;
  nextActionDate?: string;
  listingStatus?: string;
  /** ISO 4217 - primary invoicing currency for this partner */
  defaultCurrency?: string;
  /** IANA timezone for scheduling and cutoffs */
  timezone?: string;
  /** Wholesale credit ceiling in CAD (reference) */
  creditLimitCad?: number;
  /** How this account prefers to place orders */
  orderChannelPreference?: string;
  /** One paragraph: role in Hajime network (production → DC → retail) */
  networkRole?: string;
  deliveryAddress?: string;
  billingAddress?: string;
  /** CRM / ops narrative for demos */
  internalNotes?: string;
  /** New retailer onboarding - multi-step pipeline (sales → wholesaler → brand). */
  onboardingPipeline?: "none" | "sales_intake" | "brand_review" | "complete";
  /** Set when brand completes onboarding (standard / premium / key). */
  pricingTier?: "standard" | "premium" | "key";
  /** Sales rep narrative when submitting a new retailer application. */
  applicationBusinessSummary?: string;
  /** Wholesaler verification notes before HQ approval. */
  wholesalerReviewNotes?: string;
  /** ISO timestamp when sales submitted intake. */
  applicationSubmittedAt?: string;
  /** Portal login email communicated on approval (demo). */
  portalLoginEmail?: string;
};

export const accounts: Account[] = accountsJson as Account[];

export type PurchaseOrder = {
  id: string;
  manufacturer: string;
  issueDate: string;
  requiredDate: string;
  requestedShipDate: string;
  sku: string;
  quantity: number;
  packagingInstructions: string;
  labelVersion: string;
  marketDestination: string;
  status: "draft" | "approved" | "in-production" | "completed" | "shipped" | "delivered" | "delayed";
  notes: string;
  /** Set once inventory has been reduced for this PO (shipped/delivered). */
  inventoryConsumed?: boolean;
  /** PO Type: sales (distributor ordering from manufacturer) vs production (brand op ordering directly) */
  poType?: "sales" | "production";
  /** For sales POs: the distributor account that placed the order */
  distributorAccountId?: string;
  /** For sales POs: brand operator who approved (visibility, not mandatory gate) */
  brandOperatorAcknowledgedAt?: string;
};

/** Transfer Order: moves existing inventory between locations (wholesaler fulfillment) */
export type TransferOrder = {
  id: string;
  /** Origin warehouse or inventory location */
  fromLocation: string;
  /** Destination: account, distributor, or warehouse */
  toLocation: string;
  toAccountId?: string;
  sku: string;
  quantity: number;
  /** When the shipment should leave */
  shipDate: string;
  /** When it should arrive */
  deliveryDate: string;
  status: "draft" | "picked" | "packed" | "shipped" | "delivered" | "cancelled";
  /** Reference to linked sales order if this fulfills one */
  linkedSalesOrderId?: string;
  /** Internal tracking / BOL number */
  trackingNumber?: string;
  notes: string;
  /** Set once inventory has been reduced for this transfer. */
  inventoryConsumed?: boolean;
};

export const purchaseOrders: PurchaseOrder[] = [
  { id: "PO-2025-001", manufacturer: "Kirin Brewery Co.", issueDate: "2026-03-01", requiredDate: "2026-03-25", requestedShipDate: "2026-03-28", sku: "HJM-OG-750", quantity: 2400, packagingInstructions: "Standard 12-bottle case", labelVersion: "v3.1", marketDestination: "Ontario", status: "in-production", notes: "Priority order for LCBO restock" },
  { id: "PO-2025-002", manufacturer: "Kirin Brewery Co.", issueDate: "2026-02-10", requiredDate: "2026-03-28", requestedShipDate: "2026-04-02", sku: "HJM-YZ-750", quantity: 1200, packagingInstructions: "Standard 12-bottle case", labelVersion: "v2.0", marketDestination: "Milan", status: "approved", notes: "For European market" },
  { id: "PO-2025-003", manufacturer: "Kirin Brewery Co.", issueDate: "2026-03-05", requiredDate: "2026-03-28", requestedShipDate: "2026-04-08", sku: "HJM-SP-750", quantity: 1800, packagingInstructions: "6-bottle premium case", labelVersion: "v1.0", marketDestination: "Toronto", status: "draft", notes: "New SKU launch batch - confirm specs" },
  { id: "PO-2024-047", manufacturer: "Kirin Brewery Co.", issueDate: "2026-03-01", requiredDate: "2026-04-10", requestedShipDate: "2026-04-15", sku: "HJM-OG-375", quantity: 960, packagingInstructions: "24-bottle case", labelVersion: "v3.1", marketDestination: "Ontario", status: "delayed", notes: "Label supply issue - estimated 3-day delay" },
];

export const transferOrders: TransferOrder[] = [
  { id: "TO-2025-001", fromLocation: "Toronto Main", toLocation: "The Drake Hotel", toAccountId: "ACC-005", sku: "HJM-OG-750", quantity: 48, shipDate: "2026-04-10", deliveryDate: "2026-04-11", status: "shipped", linkedSalesOrderId: "SO-2026-001", trackingNumber: "TRK789456123", notes: "Weekly restock" },
  { id: "TO-2025-002", fromLocation: "Toronto Main", toLocation: "Bar Isabel", toAccountId: "ACC-002", sku: "HJM-YZ-750", quantity: 24, shipDate: "2026-04-12", deliveryDate: "2026-04-13", status: "packed", linkedSalesOrderId: "SO-2026-002", notes: "Express delivery requested" },
  { id: "TO-2025-003", fromLocation: "Milan DC", toLocation: "Bar Basso", toAccountId: "ACC-MIL-001", sku: "HJM-OG-750", quantity: 72, shipDate: "2026-04-15", deliveryDate: "2026-04-18", status: "draft", linkedSalesOrderId: "SO-2026-REG-03", notes: "Awaiting payment confirmation" },
];

export type ProductionStatus = {
  poId: string;
  stage: string;
  updatedAt: string;
  notes: string;
};

/** Canonical manufacturer pipeline (developer brief §5.C) */
export const MANUFACTURER_STAGE_PIPELINE = [
  "PO Received",
  "Raw Materials Secured",
  "Scheduled",
  "In Production",
  "Bottled",
  "Labelled",
  "Packed",
  "Ready to Ship",
  "Shipped",
  "Delivered",
  "Delayed / Issue",
] as const;

/** Map legacy / alternate labels to pipeline index */
export function manufacturerStageIndex(stage: string): number {
  const s = stage.trim().toLowerCase();
  const aliases: [string, number][] = [
    ["po received", 0],
    ["materials secured", 1],
    ["raw materials secured", 1],
    ["scheduled", 2],
    ["in production", 3],
    ["bottled", 4],
    ["labelled", 5],
    ["labeled", 5],
    ["packed", 6],
    ["ready to ship", 7],
    ["shipped", 8],
    ["delivered", 9],
    ["delayed", 10],
    ["delayed / issue", 10],
  ];
  for (const [needle, idx] of aliases) {
    if (s === needle || s.includes(needle)) return idx;
  }
  return -1;
}

export const productionStatuses: ProductionStatus[] = [
  { poId: "PO-2025-001", stage: "In Production", updatedAt: "2026-03-20", notes: "Brewing phase complete, moving to bottling" },
  { poId: "PO-2025-001", stage: "Materials Secured", updatedAt: "2026-03-08", notes: "All ingredients received" },
  { poId: "PO-2025-002", stage: "PO Received", updatedAt: "2026-02-15", notes: "Acknowledged and scheduled" },
  { poId: "PO-2024-047", stage: "Delayed", updatedAt: "2026-03-18", notes: "Label supplier delayed - new ETA Apr 12" },
  { poId: "PO-2024-047", stage: "Bottled", updatedAt: "2026-03-12", notes: "Bottling complete, awaiting labels" },
];

export type Shipment = {
  id: string;
  origin: string;
  destination: string;
  carrier: string;
  shipDate: string;
  eta: string;
  actualDelivery: string;
  linkedOrder: string;
  type: "inbound" | "outbound";
  status: "preparing" | "in-transit" | "delivered" | "delayed";
  notes: string;
};

export const shipments: Shipment[] = [
  { id: "SH-1042", origin: "Kirin Facility", destination: "Toronto Main Warehouse", carrier: "Nippon Express", shipDate: "2026-03-05", eta: "2026-03-18", actualDelivery: "2026-03-18", linkedOrder: "PO-2024-045", type: "inbound", status: "delivered", notes: "Arrived on time" },
  { id: "SH-1043", origin: "Toronto Main Warehouse", destination: "LCBO Distribution", carrier: "Day & Ross", shipDate: "2026-03-20", eta: "2026-03-22", actualDelivery: "", linkedOrder: "SO-2025-001", type: "outbound", status: "in-transit", notes: "" },
  { id: "SH-1044", origin: "Kirin Facility", destination: "Milan Depot", carrier: "DHL Global", shipDate: "2026-03-08", eta: "2026-03-18", actualDelivery: "", linkedOrder: "PO-2025-002", type: "inbound", status: "in-transit", notes: "Customs clearance pending" },
  { id: "SH-1045", origin: "Toronto Main Warehouse", destination: "Eataly Toronto", carrier: "Local Courier", shipDate: "2026-03-24", eta: "2026-03-26", actualDelivery: "", linkedOrder: "SO-2025-002", type: "outbound", status: "preparing", notes: "Packing today" },
  {
    id: "SH-1046",
    origin: "Toronto Main Warehouse",
    destination: "The Drake Hotel - 1150 Queen St W",
    carrier: "Metro Logistics",
    shipDate: "2026-03-28",
    eta: "2026-04-05",
    actualDelivery: "",
    linkedOrder: "SO-2025-008",
    type: "outbound",
    status: "in-transit",
    notes: "",
  },
  {
    id: "SH-1047",
    origin: "Toronto Main Warehouse",
    destination: "Convoy Supply DC - Mississauga",
    carrier: "Day & Ross LTL",
    shipDate: "2026-03-22",
    eta: "2026-03-23",
    actualDelivery: "",
    linkedOrder: "SO-2025-010",
    type: "outbound",
    status: "preparing",
    notes: "Staging pallets for Convoy wholesale release",
  },
];

export type Product = {
  sku: string;
  name: string;
  size: string;
  caseSize: number;
  status: "active" | "development";
  shortDescription?: string;
  abv?: string;
  /** Placeholder image for retail cards */
  imageUrl?: string;
  minOrderCases?: number;
  /** Estimated wholesale per case (CAD) for retail cart display */
  wholesaleCasePrice?: number;
};

export const products: Product[] = [
  {
    sku: "HJM-FP-750",
    name: "Hajime First Press Coffee Rhum Liqueur",
    size: "750ml",
    caseSize: 12,
    status: "active",
    shortDescription: "Small-batch coffee rum - rich, smooth, bar-ready.",
    abv: "28%",
    minOrderCases: 1,
    wholesaleCasePrice: 1440,
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=400&fit=crop",
  },
  {
    sku: "HJM-OG-750",
    name: "Hajime Original",
    size: "750ml",
    caseSize: 12,
    status: "active",
    shortDescription: "Signature Japanese-style spirit. Versatile for cocktails and by the glass.",
    abv: "24%",
    minOrderCases: 1,
    wholesaleCasePrice: 920,
    imageUrl: "https://images.unsplash.com/photo-1569529465840-d8fa6c4f4e85?w=400&h=400&fit=crop",
  },
  {
    sku: "HJM-OG-375",
    name: "Hajime Original",
    size: "375ml",
    caseSize: 24,
    status: "active",
    shortDescription: "Half bottle format for programs and tastings.",
    abv: "24%",
    minOrderCases: 1,
    wholesaleCasePrice: 780,
    imageUrl: "https://images.unsplash.com/photo-1546171753-97d7676e4602?w=400&h=400&fit=crop",
  },
  {
    sku: "HJM-YZ-750",
    name: "Hajime Yuzu",
    size: "750ml",
    caseSize: 12,
    status: "active",
    shortDescription: "Bright yuzu citrus - premium back bar staple.",
    abv: "22%",
    minOrderCases: 1,
    wholesaleCasePrice: 980,
    imageUrl: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400&h=400&fit=crop",
  },
  {
    sku: "HJM-SP-750",
    name: "Hajime Sparkling",
    size: "750ml",
    caseSize: 6,
    status: "development",
    shortDescription: "Limited sparkling release - ask your rep for allocation.",
    abv: "11%",
    minOrderCases: 2,
    wholesaleCasePrice: 1320,
    imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop",
  },
];

export const salesByMonth = [
  { month: "Aug", revenue: 124000 },
  { month: "Sep", revenue: 189000 },
  { month: "Oct", revenue: 215000 },
  { month: "Nov", revenue: 298000 },
  { month: "Dec", revenue: 342000 },
  { month: "Jan", revenue: 578200 },
];

export const inventoryByStatus = [
  { status: "Available", count: 3240, color: "hsl(152, 60%, 40%)" },
  { status: "Reserved", count: 980, color: "hsl(38, 80%, 55%)" },
  { status: "In Transit", count: 360, color: "hsl(210, 80%, 52%)" },
  { status: "In Production", count: 1200, color: "hsl(220, 20%, 46%)" },
  { status: "Damaged", count: 40, color: "hsl(0, 72%, 51%)" },
];

// New Product Development
export type NewProductRequestStatus = "draft" | "submitted" | "under_review" | "proposed" | "approved" | "rejected" | "declined";

export type NewProductAttachment = {
  name: string;
  url: string;
  type: "design_brief" | "tasting_notes" | "competitor_analysis" | "other";
};

export type NewProductManufacturerProposal = {
  feasible: boolean;
  canHitAbv: boolean;
  proposedAbv?: number;
  production: {
    equipmentRequired: string[];
    fermentationTime: string;
    agingTime?: string;
    batchSize: number;
    minimumBatchSize: number;
    capacityAvailable: boolean;
  };
  costs: {
    perBottleProduction: number;
    perBottlePackaging: number;
    perBottleLabeling: number;
    setupFee?: number;
    totalPerBottle: number;
  };
  timeline: {
    sampleAvailableDate: string;
    productionStartDate: string;
    firstDeliveryDate: string;
  };
  technicalNotes: string;
  regulatoryNotes: string;
  sampleQuantity: number;
  sampleShipDate: string;
};

export type NewProductBrandDecision = {
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  requestedChanges?: string;
};

export type NewProductRequest = {
  id: string;
  title: string;
  requestedBy: string;
  requestedAt: string;
  specs: {
    baseSpirit: string;
    targetAbv: number;
    flavorProfile: string[];
    sweetener?: string;
    targetPricePoint: "premium" | "super_premium" | "ultra_premium";
    packaging: {
      bottleSize: "750ml" | "1000ml" | "375ml";
      labelStyle: string;
      caseConfiguration: number;
    };
    minimumOrderQuantity: number;
    targetLaunchDate: string;
    regulatoryMarkets: string[];
  };
  attachments: NewProductAttachment[];
  notes: string;
  status: NewProductRequestStatus;
  assignedManufacturer?: string;
  submittedAt?: string;
  reviewStartedAt?: string;
  proposalReceivedAt?: string;
  decidedAt?: string;
  manufacturerProposal?: NewProductManufacturerProposal;
  brandDecision?: NewProductBrandDecision;
  sampleShipmentId?: string;
  productionPoId?: string;
  resultingSku?: string;
};

export const newProductRequests: NewProductRequest[] = [
  {
    id: "NPR-2025-0001",
    title: "Hazelnut Coffee Rhum 30%",
    requestedBy: "brand_operator",
    requestedAt: "2025-04-01T10:00:00Z",
    specs: {
      baseSpirit: "coffee_rhum",
      targetAbv: 30,
      flavorProfile: ["hazelnut", "vanilla", "caramel"],
      sweetener: "cane_sugar",
      targetPricePoint: "super_premium",
      packaging: { bottleSize: "750ml", labelStyle: "Minimalist ensō with copper foil", caseConfiguration: 12 },
      minimumOrderQuantity: 1200,
      targetLaunchDate: "2025-09-01",
      regulatoryMarkets: ["Ontario", "EU", "US"],
    },
    attachments: [],
    notes: "Competitor: Mr Black, but higher ABV and Japanese design positioning.",
    status: "under_review",
    assignedManufacturer: "Kirin Brewery Co.",
    submittedAt: "2025-04-02T10:00:00Z",
    reviewStartedAt: "2025-04-03T10:00:00Z",
  },
  {
    id: "NPR-2025-0002",
    title: "Vanilla Cold Brew Liqueur",
    requestedBy: "brand_operator",
    requestedAt: "2025-03-15T10:00:00Z",
    specs: {
      baseSpirit: "coffee_rhum",
      targetAbv: 25,
      flavorProfile: ["vanilla", "cold_brew"],
      sweetener: "cane_sugar",
      targetPricePoint: "premium",
      packaging: { bottleSize: "750ml", labelStyle: "Navy blue matte with silver ensō", caseConfiguration: 12 },
      minimumOrderQuantity: 2400,
      targetLaunchDate: "2025-08-15",
      regulatoryMarkets: ["Ontario", "US"],
    },
    attachments: [],
    notes: "Seasonal summer release.",
    status: "approved",
    assignedManufacturer: "Kirin Brewery Co.",
    submittedAt: "2025-03-16T10:00:00Z",
    reviewStartedAt: "2025-03-17T10:00:00Z",
    proposalReceivedAt: "2025-03-20T10:00:00Z",
    decidedAt: "2025-03-22T10:00:00Z",
    manufacturerProposal: {
      feasible: true,
      canHitAbv: true,
      production: { equipmentRequired: ["Standard still", "Fermentation tanks"], fermentationTime: "14 days", batchSize: 2400, minimumBatchSize: 2400, capacityAvailable: true },
      costs: { perBottleProduction: 8.5, perBottlePackaging: 2.2, perBottleLabeling: 0.8, setupFee: 5000, totalPerBottle: 11.5 },
      timeline: { sampleAvailableDate: "2025-05-20", productionStartDate: "2025-06-01", firstDeliveryDate: "2025-07-15" },
      technicalNotes: "Standard formulation.",
      regulatoryNotes: "No issues for Ontario / US.",
      sampleQuantity: 12,
      sampleShipDate: "2025-05-22",
    },
    brandDecision: { approved: true, approvedBy: "brand_operator", approvedAt: "2025-03-22T10:00:00Z" },
    productionPoId: "PO-2025-0089",
  },
];

/** Depletion Report: distributor reports actual sell-through to brand operator */
export type DepletionReport = {
  id: string;
  accountId: string;
  sku: string;
  periodStart: string; // ISO date YYYY-MM-DD
  periodEnd: string;   // ISO date YYYY-MM-DD
  bottlesSold: number;
  bottlesOnHandAtEnd: number;
  notes: string;
  reportedBy: string;
  reportedAt: string;  // ISO timestamp
  flaggedForReplenishment: boolean;
};

export const depletionReports: DepletionReport[] = [
  {
    id: "DEP-2025-001",
    accountId: "ACC-005",
    sku: "HJM-OG-750",
    periodStart: "2026-03-01",
    periodEnd: "2026-03-31",
    bottlesSold: 144,
    bottlesOnHandAtEnd: 36,
    notes: "Strong month - Drake cocktail program feature drove velocity",
    reportedBy: "distributor",
    reportedAt: "2026-04-01T10:00:00Z",
    flaggedForReplenishment: true,
  },
  {
    id: "DEP-2025-002",
    accountId: "ACC-002",
    sku: "HJM-YZ-750",
    periodStart: "2026-03-01",
    periodEnd: "2026-03-31",
    bottlesSold: 72,
    bottlesOnHandAtEnd: 48,
    notes: "Steady movement, no concerns",
    reportedBy: "distributor",
    reportedAt: "2026-04-01T11:00:00Z",
    flaggedForReplenishment: false,
  },
  {
    id: "DEP-2025-003",
    accountId: "ACC-MIL-001",
    sku: "HJM-OG-750",
    periodStart: "2026-03-01",
    periodEnd: "2026-03-31",
    bottlesSold: 96,
    bottlesOnHandAtEnd: 24,
    notes: "Bar Basso events drove high velocity - need restock soon",
    reportedBy: "distributor",
    reportedAt: "2026-04-02T09:00:00Z",
    flaggedForReplenishment: true,
  },
];

/** Inventory Adjustment Request: distributor reconciles physical counts with system */
export type InventoryAdjustmentRequest = {
  id: string;
  accountId: string;
  sku: string;
  adjustmentType: "count_discrepancy" | "damage" | "theft" | "other";
  quantityExpected: number;
  quantityActual: number;
  quantityAdjustment: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  approvedAt?: string;
  rejectionReason?: string;
};

export const inventoryAdjustmentRequests: InventoryAdjustmentRequest[] = [];
