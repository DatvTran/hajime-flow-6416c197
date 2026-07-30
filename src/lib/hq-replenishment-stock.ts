import type { SalesOrder } from "@/data/mockData";

export const REPLENISHMENT_CASE_SIZE = 12;

export type ReplenishmentStock = {
  /** Cases the distributor is requesting. */
  neededCases: number;
  /** Cases HQ can fulfil from available finished goods. */
  availableCases: number;
  /** True when available finished goods cannot cover the request. */
  short: boolean;
  /** Cases that must be produced to cover the request. */
  shortfallCases: number;
  /** Primary SKU the shortfall is for (drives the production request). */
  sku: string;
};

export function casesForOrder(order: SalesOrder, caseSize = REPLENISHMENT_CASE_SIZE): number {
  if (order.lines?.length) {
    return order.lines.reduce((sum, line) => sum + Math.ceil(line.quantityBottles / caseSize), 0);
  }
  return Math.ceil(order.quantity / caseSize);
}

function skusForOrder(order: SalesOrder): string[] {
  if (order.lines?.length) {
    return Array.from(new Set(order.lines.map((l) => l.sku)));
  }
  return [order.sku];
}

/**
 * Real "short" detection: compares each replenishment order against actual available
 * finished-goods inventory (bottles → cases) rather than the order's draft status.
 */
export function buildReplenishmentStock(
  orders: SalesOrder[],
  availableBottlesForSku: (sku: string) => number,
  caseSize = REPLENISHMENT_CASE_SIZE,
): Map<string, ReplenishmentStock> {
  const map = new Map<string, ReplenishmentStock>();
  for (const order of orders) {
    const neededCases = casesForOrder(order, caseSize);
    const skus = skusForOrder(order);
    const availableCases = skus.reduce(
      (sum, sku) => sum + Math.floor(availableBottlesForSku(sku) / caseSize),
      0,
    );
    const shortfallCases = Math.max(0, neededCases - availableCases);
    map.set(order.id, {
      neededCases,
      availableCases,
      short: shortfallCases > 0,
      shortfallCases,
      sku: order.sku || skus[0],
    });
  }
  return map;
}
