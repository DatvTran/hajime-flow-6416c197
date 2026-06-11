import type { SalesOrder, Shipment } from "@/data/mockData";

export type PartnerPerformanceMetrics = {
  fillRate: number;
  onTime: number;
  casesQ: number;
  platinumCasesTarget: number;
  platinumFillTarget: number;
  platinumOnTimeTarget: number;
};

export function currentQuarterLabel(now = new Date()): string {
  const q = Math.floor(now.getMonth() / 3) + 1;
  return `Q${q} ${now.getFullYear()}`;
}

export function computeDistributorPartnerMetrics(
  shipments: Shipment[],
  salesOrders: SalesOrder[],
  fallbackCases = 0,
): PartnerPerformanceMetrics {
  const outbound = shipments.filter(
    (s) => s.type === "outbound" || s.orderType === "sales_order",
  );

  let casesQ = 0;
  for (const s of outbound) {
    for (const li of s.lineItems ?? []) {
      casesQ += li.cases ?? Math.max(1, Math.ceil(li.quantity / (li.caseSize || 12)));
    }
  }
  if (casesQ === 0) casesQ = fallbackCases;

  const fulfillable = salesOrders.filter(
    (o) => o.status !== "cancelled" && o.status !== "draft",
  );
  const fulfilled = fulfillable.filter((o) => o.status === "shipped" || o.status === "delivered");
  const fillRate =
    fulfillable.length > 0
      ? Math.min(100, Math.round((fulfilled.length / fulfillable.length) * 1000) / 10)
      : 97.8;

  const deliveredShipments = outbound.filter((s) => s.status === "delivered");
  const onTimeShipments = outbound.filter(
    (s) => s.status === "delivered" || s.status === "in-transit" || s.status === "preparing",
  );
  const onTime =
    outbound.length > 0
      ? Math.min(
          100,
          Math.round(
            ((onTimeShipments.length - outbound.filter((s) => s.status === "delayed").length) /
              Math.max(outbound.length, 1)) *
              1000,
          ) / 10,
        )
      : deliveredShipments.length > 0
        ? 94.2
        : 94.2;

  return {
    fillRate,
    onTime,
    casesQ,
    platinumCasesTarget: 2000,
    platinumFillTarget: 99,
    platinumOnTimeTarget: 98,
  };
}

export function formatMoney(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
