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
  { id: "1", type: "low-stock" as const, message: "Hajime Original 750ml — below threshold (120 units)", time: "12 min ago", severity: "high" as const },
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

export type InventoryItem = {
  id: string;
  sku: string;
  productName: string;
  batchLot: string;
  productionDate: string;
  quantityBottles: number;
  quantityCases: number;
  warehouse: string;
  status: "available" | "reserved" | "damaged" | "in-transit" | "in-production";
  labelVersion: string;
  notes: string;
};

export const inventoryItems: InventoryItem[] = [
  { id: "INV-001", sku: "HJM-OG-750", productName: "Hajime Original 750ml", batchLot: "B2024-112", productionDate: "2024-11-15", quantityBottles: 1440, quantityCases: 120, warehouse: "Toronto Main", status: "available", labelVersion: "v3.1", notes: "" },
  { id: "INV-002", sku: "HJM-OG-750", productName: "Hajime Original 750ml", batchLot: "B2024-108", productionDate: "2024-10-20", quantityBottles: 480, quantityCases: 40, warehouse: "Toronto Main", status: "reserved", labelVersion: "v3.1", notes: "Reserved for LCBO Q1" },
  { id: "INV-003", sku: "HJM-YZ-750", productName: "Hajime Yuzu 750ml", batchLot: "B2024-115", productionDate: "2024-12-01", quantityBottles: 720, quantityCases: 60, warehouse: "Toronto Main", status: "available", labelVersion: "v2.0", notes: "" },
  { id: "INV-004", sku: "HJM-YZ-750", productName: "Hajime Yuzu 750ml", batchLot: "B2024-116", productionDate: "2024-12-10", quantityBottles: 360, quantityCases: 30, warehouse: "Milan Depot", status: "in-transit", labelVersion: "v2.0", notes: "En route from manufacturer" },
  { id: "INV-005", sku: "HJM-OG-375", productName: "Hajime Original 375ml", batchLot: "B2024-120", productionDate: "2024-12-15", quantityBottles: 960, quantityCases: 80, warehouse: "Toronto Main", status: "available", labelVersion: "v3.1", notes: "" },
  { id: "INV-006", sku: "HJM-SP-750", productName: "Hajime Sparkling 750ml", batchLot: "B2024-121", productionDate: "2025-01-05", quantityBottles: 1200, quantityCases: 100, warehouse: "Production", status: "in-production", labelVersion: "v1.0", notes: "New SKU launch batch" },
  { id: "INV-007", sku: "HJM-OG-750", productName: "Hajime Original 750ml", batchLot: "B2024-107", productionDate: "2024-10-01", quantityBottles: 48, quantityCases: 4, warehouse: "Toronto Main", status: "damaged", labelVersion: "v3.0", notes: "Water damage during storage" },
];

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
};

export const salesOrders: SalesOrder[] = [
  { id: "SO-2025-001", account: "LCBO Ontario", market: "Ontario", orderDate: "2025-01-15", requestedDelivery: "2025-01-25", sku: "HJM-OG-750", quantity: 240, price: 18500, salesRep: "Marcus Chen", status: "confirmed", paymentStatus: "pending" },
  { id: "SO-2025-002", account: "Eataly Toronto", market: "Toronto", orderDate: "2025-01-18", requestedDelivery: "2025-01-28", sku: "HJM-YZ-750", quantity: 60, price: 5400, salesRep: "Sarah Kim", status: "packed", paymentStatus: "pending" },
  { id: "SO-2025-003", account: "Bar Basso", market: "Milan", orderDate: "2025-01-10", requestedDelivery: "2025-02-01", sku: "HJM-OG-750", quantity: 120, price: 9200, salesRep: "Luca Moretti", status: "shipped", paymentStatus: "paid" },
  { id: "SO-2025-004", account: "The Drake Hotel", market: "Toronto", orderDate: "2025-01-20", requestedDelivery: "2025-02-05", sku: "HJM-OG-375", quantity: 48, price: 2160, salesRep: "Marcus Chen", status: "draft", paymentStatus: "pending" },
  { id: "SO-2025-005", account: "Rinascente Milano", market: "Milan", orderDate: "2025-01-12", requestedDelivery: "2025-01-22", sku: "HJM-YZ-750", quantity: 96, price: 8640, salesRep: "Luca Moretti", status: "delivered", paymentStatus: "paid" },
  { id: "SO-2025-006", account: "Pusateri's", market: "Toronto", orderDate: "2025-01-22", requestedDelivery: "2025-02-10", sku: "HJM-OG-750", quantity: 36, price: 2770, salesRep: "Sarah Kim", status: "confirmed", paymentStatus: "pending" },
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
};

export const accounts: Account[] = [
  { id: "ACC-001", legalName: "Liquor Control Board of Ontario", tradingName: "LCBO Ontario", country: "Canada", city: "Toronto", type: "retail", contactName: "James Park", contactRole: "Category Manager", phone: "+1 416-555-0101", email: "jpark@lcbo.com", salesOwner: "Marcus Chen", paymentTerms: "Net 30", firstOrderDate: "2024-03-15", lastOrderDate: "2025-01-15", avgOrderSize: 20400, status: "active", tags: ["key-account", "ontario"] },
  { id: "ACC-002", legalName: "Eataly SPA - Toronto", tradingName: "Eataly Toronto", country: "Canada", city: "Toronto", type: "retail", contactName: "Maria Rossi", contactRole: "Beverage Buyer", phone: "+1 416-555-0202", email: "mrossi@eataly.com", salesOwner: "Sarah Kim", paymentTerms: "Net 15", firstOrderDate: "2024-06-01", lastOrderDate: "2025-01-18", avgOrderSize: 5800, status: "active", tags: ["premium", "toronto"] },
  { id: "ACC-003", legalName: "La Rinascente SPA", tradingName: "Rinascente Milano", country: "Italy", city: "Milan", type: "retail", contactName: "Alessandro Bianchi", contactRole: "F&B Director", phone: "+39 02-555-0303", email: "abianchi@rinascente.it", salesOwner: "Luca Moretti", paymentTerms: "Net 45", firstOrderDate: "2024-09-10", lastOrderDate: "2025-01-12", avgOrderSize: 8200, status: "active", tags: ["luxury", "milan", "export"] },
  { id: "ACC-004", legalName: "Bar Basso SRL", tradingName: "Bar Basso", country: "Italy", city: "Milan", type: "bar", contactName: "Mirko Stocchetto", contactRole: "Owner", phone: "+39 02-555-0404", email: "mirko@barbasso.it", salesOwner: "Luca Moretti", paymentTerms: "Net 30", firstOrderDate: "2024-07-20", lastOrderDate: "2025-01-10", avgOrderSize: 6000, status: "active", tags: ["iconic", "milan", "bar"] },
  { id: "ACC-005", legalName: "The Drake Hotel Inc", tradingName: "The Drake Hotel", country: "Canada", city: "Toronto", type: "hotel", contactName: "Jeff Guignard", contactRole: "Beverage Director", phone: "+1 416-555-0505", email: "jeff@thedrake.ca", salesOwner: "Marcus Chen", paymentTerms: "Net 30", firstOrderDate: "2024-08-15", lastOrderDate: "2025-01-20", avgOrderSize: 2400, status: "active", tags: ["hotel", "toronto"] },
  { id: "ACC-006", legalName: "Pusateri's Fine Foods", tradingName: "Pusateri's", country: "Canada", city: "Toronto", type: "retail", contactName: "Frank Luchetta", contactRole: "Grocery Manager", phone: "+1 416-555-0606", email: "frank@pusateris.com", salesOwner: "Sarah Kim", paymentTerms: "Net 15", firstOrderDate: "2024-11-01", lastOrderDate: "2025-01-22", avgOrderSize: 2800, status: "active", tags: ["gourmet", "toronto"] },
  { id: "ACC-007", legalName: "Nobu Toronto", tradingName: "Nobu Toronto", country: "Canada", city: "Toronto", type: "restaurant", contactName: "Yuki Tanaka", contactRole: "GM", phone: "+1 416-555-0707", email: "yuki@nobu.com", salesOwner: "Marcus Chen", paymentTerms: "Net 30", firstOrderDate: "", lastOrderDate: "", avgOrderSize: 0, status: "prospect", tags: ["prospect", "restaurant", "toronto"] },
];

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
};

export const purchaseOrders: PurchaseOrder[] = [
  { id: "PO-2025-001", manufacturer: "Kirin Brewery Co.", issueDate: "2025-01-05", requiredDate: "2025-02-15", requestedShipDate: "2025-02-20", sku: "HJM-OG-750", quantity: 2400, packagingInstructions: "Standard 12-bottle case", labelVersion: "v3.1", marketDestination: "Ontario", status: "in-production", notes: "Priority order for LCBO restock" },
  { id: "PO-2025-002", manufacturer: "Kirin Brewery Co.", issueDate: "2025-01-10", requiredDate: "2025-03-01", requestedShipDate: "2025-03-05", sku: "HJM-YZ-750", quantity: 1200, packagingInstructions: "Standard 12-bottle case", labelVersion: "v2.0", marketDestination: "Milan", status: "approved", notes: "For European market" },
  { id: "PO-2025-003", manufacturer: "Kirin Brewery Co.", issueDate: "2025-01-15", requiredDate: "2025-03-15", requestedShipDate: "2025-03-20", sku: "HJM-SP-750", quantity: 1800, packagingInstructions: "6-bottle premium case", labelVersion: "v1.0", marketDestination: "Toronto", status: "draft", notes: "New SKU launch batch — confirm specs" },
  { id: "PO-2024-047", manufacturer: "Kirin Brewery Co.", issueDate: "2024-12-01", requiredDate: "2025-01-15", requestedShipDate: "2025-01-20", sku: "HJM-OG-375", quantity: 960, packagingInstructions: "24-bottle case", labelVersion: "v3.1", marketDestination: "Ontario", status: "delayed", notes: "Label supply issue — estimated 3-day delay" },
];

export type ProductionStatus = {
  poId: string;
  stage: string;
  updatedAt: string;
  notes: string;
};

export const productionStatuses: ProductionStatus[] = [
  { poId: "PO-2025-001", stage: "In Production", updatedAt: "2025-01-25", notes: "Brewing phase complete, moving to bottling" },
  { poId: "PO-2025-001", stage: "Materials Secured", updatedAt: "2025-01-15", notes: "All ingredients received" },
  { poId: "PO-2025-002", stage: "PO Received", updatedAt: "2025-01-12", notes: "Acknowledged and scheduled" },
  { poId: "PO-2024-047", stage: "Delayed", updatedAt: "2025-01-18", notes: "Label supplier delayed — new ETA Jan 21" },
  { poId: "PO-2024-047", stage: "Bottled", updatedAt: "2025-01-14", notes: "Bottling complete, awaiting labels" },
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
  { id: "SH-1042", origin: "Kirin Facility", destination: "Toronto Main Warehouse", carrier: "Nippon Express", shipDate: "2025-01-10", eta: "2025-01-24", actualDelivery: "2025-01-24", linkedOrder: "PO-2024-045", type: "inbound", status: "delivered", notes: "Arrived on time" },
  { id: "SH-1043", origin: "Toronto Main Warehouse", destination: "LCBO Distribution", carrier: "Day & Ross", shipDate: "2025-01-20", eta: "2025-01-22", actualDelivery: "", linkedOrder: "SO-2025-001", type: "outbound", status: "in-transit", notes: "" },
  { id: "SH-1044", origin: "Kirin Facility", destination: "Milan Depot", carrier: "DHL Global", shipDate: "2025-01-15", eta: "2025-02-01", actualDelivery: "", linkedOrder: "PO-2025-002", type: "inbound", status: "in-transit", notes: "Customs clearance pending" },
  { id: "SH-1045", origin: "Toronto Main Warehouse", destination: "Eataly Toronto", carrier: "Local Courier", shipDate: "2025-01-26", eta: "2025-01-26", actualDelivery: "", linkedOrder: "SO-2025-002", type: "outbound", status: "preparing", notes: "Packing today" },
];

export const products = [
  { sku: "HJM-OG-750", name: "Hajime Original", size: "750ml", caseSize: 12, status: "active" as const },
  { sku: "HJM-OG-375", name: "Hajime Original", size: "375ml", caseSize: 24, status: "active" as const },
  { sku: "HJM-YZ-750", name: "Hajime Yuzu", size: "750ml", caseSize: 12, status: "active" as const },
  { sku: "HJM-SP-750", name: "Hajime Sparkling", size: "750ml", caseSize: 6, status: "development" as const },
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
