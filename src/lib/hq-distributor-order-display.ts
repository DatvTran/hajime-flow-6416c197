import type { SalesOrder } from "@/data/mockData";

const CASE_SIZE = 12;
const CASES_PER_PALLET = 56;

const UNIT_PRICES: Record<string, number> = {
  "HJM-FP-750": 38,
  "Florin Peaks 750ml": 38,
  "HJM-JN-720": 26,
  "Junmai Shiro 720ml": 26,
  "HJM-RY-500": 65,
  "Ryusui Reserve 500ml": 65,
  "EU-FP-750": 42,
  "First Press 750ml": 42,
};

export type HqOrderLine = {
  sku: string;
  cases: number;
  pallets: number;
  unitPrice: number;
  lineTotal: number;
};

export type HqOrderDisplayStatus = {
  tone: "green" | "amber" | "blue" | "red" | "neutral";
  label: string;
  /** 1-based pipeline stage index for progress UI */
  stage: number;
};

export const HQ_ORDER_PIPELINE_STEPS = [
  "Placed",
  "Approved",
  "In production / picking",
  "In transit",
  "Delivered",
] as const;

export function casesForOrder(order: SalesOrder): number {
  if (order.lines?.length) {
    return order.lines.reduce((sum, l) => sum + Math.ceil(l.quantityBottles / CASE_SIZE), 0);
  }
  return Math.max(1, Math.ceil(order.quantity / CASE_SIZE));
}

export function palletsForCases(cases: number): number {
  return Math.max(1, Math.round(cases / CASES_PER_PALLET));
}

export function unitPriceForSku(sku: string): number {
  const trimmed = sku.trim();
  if (UNIT_PRICES[trimmed] != null) return UNIT_PRICES[trimmed];
  const code = trimmed.split(/\s+/)[0];
  if (UNIT_PRICES[code] != null) return UNIT_PRICES[code];
  return 38;
}

export function orderLines(order: SalesOrder): HqOrderLine[] {
  if (order.lines?.length) {
    return order.lines.map((line) => {
      const cases = Math.max(1, Math.ceil(line.quantityBottles / CASE_SIZE));
      const unit = cases > 0 ? Math.round(line.lineTotal / cases) : unitPriceForSku(line.sku);
      return {
        sku: line.sku,
        cases,
        pallets: palletsForCases(cases),
        unitPrice: unit,
        lineTotal: line.lineTotal,
      };
    });
  }
  const cases = casesForOrder(order);
  const unit = unitPriceForSku(order.sku);
  return [
    {
      sku: order.sku,
      cases,
      pallets: palletsForCases(cases),
      unitPrice: unit,
      lineTotal: order.price || cases * unit,
    },
  ];
}

export function orderTotal(order: SalesOrder): number {
  const lines = orderLines(order);
  return lines.reduce((sum, l) => sum + l.lineTotal, 0);
}

export function hqOrderDisplayStatus(order: SalesOrder): HqOrderDisplayStatus {
  if (order.status === "delivered") {
    return { tone: "green", label: "delivered", stage: 5 };
  }
  if (order.status === "shipped") {
    return { tone: "blue", label: "in-transit", stage: 4 };
  }
  if (order.status === "packed") {
    return { tone: "blue", label: "in production / picking", stage: 3 };
  }
  if (order.status === "confirmed") {
    return { tone: "green", label: "approved", stage: 2 };
  }
  if (order.status === "cancelled") {
    return { tone: "red", label: "cancelled", stage: 1 };
  }
  const onHold = /allocation|on hold|sign-off|below cover/i.test(order.orderNotes || "");
  if (onHold) {
    return { tone: "red", label: "on hold", stage: 1 };
  }
  return { tone: "amber", label: "pending", stage: 1 };
}

export function formatHqOrderCurrency(amount: number): string {
  return `$${amount.toLocaleString()}`;
}
