import type { InventoryItem } from "@/data/mockData";

export type MovementResult = {
  success: boolean;
  nextInventory: InventoryItem[];
  error?: string;
  movedItems?: InventoryItem[];
};

export type InTransitDetails = {
  transferOrderId: string;
  fromWarehouse: string;
  toWarehouse: string;
  toAccountId?: string;
  shipDate: string;
  expectedDelivery: string;
};

/**
 * Move inventory from one location to another.
 * Used when transfer order is shipped (source → in_transit) or delivered (in_transit → destination).
 */
export function moveInventory(
  items: InventoryItem[],
  sku: string,
  quantity: number,
  fromLocation: { warehouse: string; locationType: InventoryItem["locationType"] },
  toLocation: { warehouse: string; locationType: InventoryItem["locationType"]; retailAccountId?: string },
  options?: {
    transferOrderId?: string;
    shipDate?: string;
    expectedDelivery?: string;
    caseSize?: number;
  }
): MovementResult {
  if (quantity <= 0) {
    return { success: false, nextInventory: items, error: "Quantity must be positive" };
  }

  // Find available inventory at source
  const sourceItems = items
    .filter(
      (i) =>
        i.sku === sku &&
        i.warehouse === fromLocation.warehouse &&
        i.locationType === fromLocation.locationType &&
        i.status === "available"
    )
    .sort((a, b) => a.productionDate.localeCompare(b.productionDate));

  const totalAvailable = sourceItems.reduce((sum, i) => sum + i.quantityBottles, 0);
  if (totalAvailable < quantity) {
    return {
      success: false,
      nextInventory: items,
      error: `Insufficient stock at source. Need ${quantity}, have ${totalAvailable}`,
    };
  }

  const working = [...items];
  const movedItems: InventoryItem[] = [];
  let remaining = quantity;

  // Deduct from source (FIFO)
  for (const sourceItem of sourceItems) {
    if (remaining <= 0) break;

    const take = Math.min(sourceItem.quantityBottles, remaining);
    const sourceIndex = working.findIndex((i) => i.id === sourceItem.id);

    if (sourceIndex < 0) continue;

    const newBottles = sourceItem.quantityBottles - take;
    if (newBottles <= 0) {
      // Remove empty line
      working.splice(sourceIndex, 1);
    } else {
      // Reduce quantity
      working[sourceIndex] = {
        ...sourceItem,
        quantityBottles: newBottles,
        quantityCases: Math.floor(newBottles / (options?.caseSize || 12)),
      };
    }

    // Create moved item record
    const movedItem: InventoryItem = {
      ...sourceItem,
      id: `${sourceItem.id}-moved-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      quantityBottles: take,
      quantityCases: Math.floor(take / (options?.caseSize || 12)),
      warehouse: toLocation.warehouse,
      locationType: toLocation.locationType,
      retailAccountId: toLocation.retailAccountId,
      status: "available" as const,
      notes: `Transferred from ${fromLocation.warehouse} to ${toLocation.warehouse}`,
    };

    // Add in-transit metadata if applicable
    if (toLocation.locationType === "in_transit" && options?.transferOrderId) {
      (movedItem as any).inTransitDetails = {
        transferOrderId: options.transferOrderId,
        fromWarehouse: fromLocation.warehouse,
        toWarehouse: toLocation.warehouse,
        toAccountId: toLocation.retailAccountId,
        shipDate: options.shipDate || new Date().toISOString().slice(0, 10),
        expectedDelivery: options.expectedDelivery || new Date().toISOString().slice(0, 10),
      };
    }

    movedItems.push(movedItem);
    remaining -= take;
  }

  // Add moved items to destination
  const nextInventory = [...working, ...movedItems];

  return {
    success: true,
    nextInventory,
    movedItems,
  };
}

/**
 * Reserve inventory for picking (soft hold, doesn't move location).
 * Called when transfer order status → 'picked' or 'packed'.
 */
export function reserveInventory(
  items: InventoryItem[],
  sku: string,
  quantity: number,
  warehouse: string,
  reservationId: string,
  caseSize?: number
): MovementResult {
  if (quantity <= 0) {
    return { success: false, nextInventory: items, error: "Quantity must be positive" };
  }

  const availableItems = items
    .filter(
      (i) =>
        i.sku === sku &&
        i.warehouse === warehouse &&
        i.status === "available"
    )
    .sort((a, b) => a.productionDate.localeCompare(b.productionDate));

  const totalAvailable = availableItems.reduce((sum, i) => sum + i.quantityBottles, 0);
  if (totalAvailable < quantity) {
    return {
      success: false,
      nextInventory: items,
      error: `Insufficient available stock. Need ${quantity}, have ${totalAvailable}`,
    };
  }

  const working = [...items];
  let remaining = quantity;

  for (const item of availableItems) {
    if (remaining <= 0) break;

    const take = Math.min(item.quantityBottles, remaining);
    const index = working.findIndex((i) => i.id === item.id);

    if (index < 0) continue;

    const newBottles = item.quantityBottles - take;
    if (newBottles <= 0) {
      working.splice(index, 1);
    } else {
      working[index] = {
        ...item,
        quantityBottles: newBottles,
        quantityCases: Math.floor(newBottles / (caseSize || 12)),
      };
    }

    // Create reserved item
    const reservedItem: InventoryItem = {
      ...item,
      id: `${item.id}-reserved-${reservationId}`,
      quantityBottles: take,
      quantityCases: Math.floor(take / (caseSize || 12)),
      status: "reserved" as const,
      notes: `Reserved for ${reservationId}`,
    };

    working.push(reservedItem);
    remaining -= take;
  }

  return {
    success: true,
    nextInventory: working,
  };
}

/**
 * Release reserved inventory back to available.
 * Called when transfer order is cancelled.
 */
export function releaseReservation(
  items: InventoryItem[],
  reservationId: string,
  caseSize?: number
): MovementResult {
  const working = [...items];
  const reservedItems = working.filter(
    (i) => i.status === "reserved" && i.notes?.includes(reservationId)
  );

  if (reservedItems.length === 0) {
    return { success: true, nextInventory: items };
  }

  for (const reserved of reservedItems) {
    // Find the original item to merge back into (same batch, available)
    const originalId = reserved.id.split("-reserved-")[0];
    const originalIndex = working.findIndex(
      (i) => i.id === originalId && i.status === "available"
    );

    if (originalIndex >= 0) {
      // Merge back into original
      const original = working[originalIndex];
      const newBottles = original.quantityBottles + reserved.quantityBottles;
      working[originalIndex] = {
        ...original,
        quantityBottles: newBottles,
        quantityCases: Math.floor(newBottles / (caseSize || 12)),
      };
    } else {
      // Create new available line
      working.push({
        ...reserved,
        id: `${originalId}-available-${Date.now()}`,
        status: "available" as const,
        notes: `Released from ${reservationId}`,
      });
    }

    // Remove reserved line
    const reservedIndex = working.findIndex((i) => i.id === reserved.id);
    if (reservedIndex >= 0) {
      working.splice(reservedIndex, 1);
    }
  }

  return { success: true, nextInventory: working };
}

/**
 * Find and deduct in-transit inventory for a transfer order.
 * Used when transfer order is delivered.
 */
export function deductInTransitInventory(
  items: InventoryItem[],
  transferOrderId: string,
  caseSize?: number
): MovementResult {
  const inTransitItems = items.filter(
    (i) =>
      i.locationType === "in_transit" &&
      (i as any).inTransitDetails?.transferOrderId === transferOrderId
  );

  if (inTransitItems.length === 0) {
    return {
      success: false,
      nextInventory: items,
      error: `No in-transit inventory found for transfer ${transferOrderId}`,
    };
  }

  const working = items.filter(
    (i) =>
      !(
        i.locationType === "in_transit" &&
        (i as any).inTransitDetails?.transferOrderId === transferOrderId
      )
  );

  return {
    success: true,
    nextInventory: working,
    movedItems: inTransitItems,
  };
}

/**
 * Get inventory summary by location type.
 */
export function getInventoryByLocation(
  items: InventoryItem[],
  sku?: string
): Record<InventoryItem["locationType"], number> {
  const result: Record<string, number> = {
    manufacturer: 0,
    distributor_warehouse: 0,
    in_transit: 0,
    retail_shelf: 0,
  };

  for (const item of items) {
    if (sku && item.sku !== sku) continue;
    if (item.status !== "available") continue;
    result[item.locationType] = (result[item.locationType] || 0) + item.quantityBottles;
  }

  return result as Record<InventoryItem["locationType"], number>;
}

/**
 * Check if a transfer order can be shipped (sufficient stock at source).
 */
export function canShipTransfer(
  items: InventoryItem[],
  sku: string,
  quantity: number,
  fromWarehouse: string
): { canShip: boolean; available: number; shortfall: number } {
  const available = items
    .filter(
      (i) =>
        i.sku === sku &&
        i.warehouse === fromWarehouse &&
        i.locationType === "distributor_warehouse" &&
        i.status === "available"
    )
    .reduce((sum, i) => sum + i.quantityBottles, 0);

  return {
    canShip: available >= quantity,
    available,
    shortfall: Math.max(0, quantity - available),
  };
}
