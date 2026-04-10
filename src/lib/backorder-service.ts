import type { SalesOrder, SalesOrderLine } from "@/data/mockData";

export type BackorderStatus = 
  | "pending"      // Waiting for inventory to become available
  | "picking"      // Being picked from available stock
  | "shipped"      // Shipped (full or partial)
  | "cancelled";   // Cancelled due to customer request or stock discontinuation

export type BackorderShipmentSplit = {
  splitId: string;
  quantityShipped: number;
  shippedAt: string;
  trackingNumber?: string;
  notes?: string;
};

export type BackorderLine = {
  id: string;
  salesOrderId: string;
  account: string;
  sku: string;
  productName?: string;
  originalQuantity: number;      // Quantity originally ordered
  availableToShip: number;       // Quantity currently available to ship
  backorderQuantity: number;     // Quantity on backorder (original - available - already_shipped)
  alreadyShipped: number;        // Quantity already shipped in previous splits
  status: BackorderStatus;
  priority: "low" | "medium" | "high" | "critical";
  createdAt: string;
  updatedAt: string;
  promisedDate?: string;         // When we promised to fulfill
  notes?: string;
  splits: BackorderShipmentSplit[];
  /** If this backorder was auto-created from inventory shortfall */
  autoCreated: boolean;
  /** Reason for backorder */
  reason: "insufficient_stock" | "quality_hold" | "customer_request" | "allocation_priority";
};

export type BackorderSummary = {
  totalLines: number;
  totalBottlesBackordered: number;
  totalBottlesAvailable: number;
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;
  bySku: Record<string, { backordered: number; available: number }>;
};

const STORAGE_KEY = "hajime_backorders_v1";

// Helper to generate IDs
function generateId(): string {
  return `BO-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}

// Load backorders from localStorage
export function loadBackorders(): BackorderLine[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

// Save backorders to localStorage
export function saveBackorders(backorders: BackorderLine[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(backorders));
}

// Calculate available inventory by SKU
export function calculateAvailableBySku(
  inventory: { sku: string; quantityBottles: number; status: string }[]
): Record<string, number> {
  const avail: Record<string, number> = {};
  for (const row of inventory) {
    if (row.status !== "available") continue;
    avail[row.sku] = (avail[row.sku] ?? 0) + row.quantityBottles;
  }
  return avail;
}

// Calculate reserved inventory by SKU from open orders
export function calculateReservedBySku(
  salesOrders: { sku: string; quantity: number; status: string }[]
): Record<string, number> {
  const reserved: Record<string, number> = {};
  for (const order of salesOrders) {
    if (["confirmed", "packed"].includes(order.status)) {
      reserved[order.sku] = (reserved[order.sku] ?? 0) + order.quantity;
    }
  }
  return reserved;
}

// Auto-create backorders from inventory shortfalls
export function autoCreateBackorders(
  salesOrders: SalesOrder[],
  inventory: { sku: string; quantityBottles: number; status: string; productName?: string }[],
  existingBackorders: BackorderLine[]
): { newBackorders: BackorderLine[]; updatedExisting: BackorderLine[] } {
  const available = calculateAvailableBySku(inventory);
  const reserved = calculateReservedBySku(salesOrders);
  const newBackorders: BackorderLine[] = [];
  const updatedExisting: BackorderLine[] = [];
  
  // Track which orders already have backorders
  const existingOrderSkuPairs = new Set(
    existingBackorders.map(bo => `${bo.salesOrderId}-${bo.sku}`)
  );

  for (const order of salesOrders) {
    // Skip orders that are already shipped, delivered, or cancelled
    if (["shipped", "delivered", "cancelled", "draft"].includes(order.status)) continue;

    const sku = order.sku;
    const orderQty = order.quantity;
    const availQty = available[sku] ?? 0;
    const reservedQty = reserved[sku] ?? 0;
    const netAvailable = Math.max(0, availQty - reservedQty + orderQty); // Add back this order's quantity

    const existingKey = `${order.id}-${sku}`;
    const existingBo = existingBackorders.find(bo => 
      bo.salesOrderId === order.id && bo.sku === sku && bo.status !== "shipped"
    );

    if (existingBo) {
      // Update existing backorder if quantities changed
      const newAvailableToShip = Math.min(orderQty, netAvailable);
      const newBackorderQty = orderQty - newAvailableToShip - existingBo.alreadyShipped;
      
      if (newAvailableToShip !== existingBo.availableToShip || 
          newBackorderQty !== existingBo.backorderQuantity) {
        updatedExisting.push({
          ...existingBo,
          availableToShip: newAvailableToShip,
          backorderQuantity: Math.max(0, newBackorderQty),
          status: newBackorderQty > 0 ? "pending" : (existingBo.alreadyShipped > 0 ? "shipped" : "picking"),
          updatedAt: new Date().toISOString(),
        });
      }
    } else if (netAvailable < orderQty) {
      // Create new backorder
      const availableToShip = Math.max(0, netAvailable);
      const backorderQty = orderQty - availableToShip;
      
      if (backorderQty > 0) {
        const product = inventory.find(i => i.sku === sku);
        
        // Determine priority based on order age and customer
        const orderAge = Date.now() - new Date(order.orderDate).getTime();
        const daysOld = orderAge / (1000 * 60 * 60 * 24);
        let priority: BackorderLine["priority"] = "medium";
        if (daysOld > 14) priority = "critical";
        else if (daysOld > 7) priority = "high";
        else if (daysOld < 2) priority = "low";

        newBackorders.push({
          id: generateId(),
          salesOrderId: order.id,
          account: order.account,
          sku,
          productName: product?.productName,
          originalQuantity: orderQty,
          availableToShip,
          backorderQuantity: backorderQty,
          alreadyShipped: 0,
          status: availableToShip > 0 ? "picking" : "pending",
          priority,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          promisedDate: order.requestedDelivery,
          splits: [],
          autoCreated: true,
          reason: "insufficient_stock",
        });
      }
    }
  }

  return { newBackorders, updatedExisting };
}

// Ship available quantity (creates a split)
export function shipAvailableQuantity(
  backorder: BackorderLine,
  quantity: number,
  trackingNumber?: string,
  notes?: string
): BackorderLine {
  const actualShipQty = Math.min(quantity, backorder.availableToShip);
  if (actualShipQty <= 0) return backorder;

  const newSplit: BackorderShipmentSplit = {
    splitId: `SPLIT-${Date.now()}`,
    quantityShipped: actualShipQty,
    shippedAt: new Date().toISOString(),
    trackingNumber,
    notes,
  };

  const newAlreadyShipped = backorder.alreadyShipped + actualShipQty;
  const newAvailableToShip = backorder.availableToShip - actualShipQty;
  const remainingBackorder = backorder.originalQuantity - newAlreadyShipped - newAvailableToShip;

  return {
    ...backorder,
    availableToShip: newAvailableToShip,
    backorderQuantity: remainingBackorder,
    alreadyShipped: newAlreadyShipped,
    splits: [...backorder.splits, newSplit],
    status: remainingBackorder > 0 ? "pending" : "shipped",
    updatedAt: new Date().toISOString(),
  };
}

// Release inventory to a backorder (when stock becomes available)
export function releaseInventoryToBackorder(
  backorder: BackorderLine,
  quantity: number
): BackorderLine {
  const actualRelease = Math.min(quantity, backorder.backorderQuantity);
  if (actualRelease <= 0) return backorder;

  return {
    ...backorder,
    availableToShip: backorder.availableToShip + actualRelease,
    backorderQuantity: backorder.backorderQuantity - actualRelease,
    status: "picking",
    updatedAt: new Date().toISOString(),
  };
}

// Calculate summary statistics
export function calculateBackorderSummary(backorders: BackorderLine[]): BackorderSummary {
  const byPriority: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  const byStatus: Record<string, number> = { pending: 0, picking: 0, shipped: 0, cancelled: 0 };
  const bySku: Record<string, { backordered: number; available: number }> = {};

  let totalBottlesBackordered = 0;
  let totalBottlesAvailable = 0;

  for (const bo of backorders) {
    byPriority[bo.priority] = (byPriority[bo.priority] ?? 0) + bo.backorderQuantity;
    byStatus[bo.status] = (byStatus[bo.status] ?? 0) + 1;
    
    if (!bySku[bo.sku]) {
      bySku[bo.sku] = { backordered: 0, available: 0 };
    }
    bySku[bo.sku].backordered += bo.backorderQuantity;
    bySku[bo.sku].available += bo.availableToShip;

    totalBottlesBackordered += bo.backorderQuantity;
    totalBottlesAvailable += bo.availableToShip;
  }

  return {
    totalLines: backorders.length,
    totalBottlesBackordered,
    totalBottlesAvailable,
    byPriority,
    byStatus,
    bySku,
  };
}

// Get suggested fulfillment order (priority-based)
export function getFulfillmentPriorityQueue(backorders: BackorderLine[]): BackorderLine[] {
  const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
  
  return [...backorders]
    .filter(bo => bo.status !== "shipped" && bo.status !== "cancelled")
    .sort((a, b) => {
      // First by priority
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (priorityDiff !== 0) return -priorityDiff;
      
      // Then by age (older first)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
}
