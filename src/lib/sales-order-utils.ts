import type { Account, Product, SalesOrder, SalesOrderLine } from "@/data/mockData";

export function nextSalesOrderId(existing: Pick<SalesOrder, "id">[]): string {
  let maxSeq = 0;
  const year = new Date().getFullYear();
  for (const o of existing) {
    const m = o.id.match(/^SO-(\d{4})-(\d+)$/);
    if (m) {
      const y = parseInt(m[1], 10);
      const seq = parseInt(m[2], 10);
      if (y === year) maxSeq = Math.max(maxSeq, seq);
    }
  }
  return `SO-${year}-${String(maxSeq + 1).padStart(3, "0")}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function marketForRetailAccount(tradingName: string, accountList: Account[]): string {
  const acc = accountList.find((a) => a.tradingName === tradingName);
  if (!acc) return "";
  if (acc.tradingName === "LCBO Ontario" || acc.legalName.toLowerCase().includes("liquor control")) return "Ontario";
  return acc.city;
}

export function buildRetailCheckoutOrder(params: {
  existingOrders: SalesOrder[];
  accountTradingName: string;
  market: string;
  salesRep: string;
  lines: { sku: string; cases: number; product: Product }[];
  requestedDelivery: string;
  customerPoReference?: string;
  orderNotes?: string;
  deliveryAddress?: string;
}): SalesOrder {
  const orderLines: SalesOrderLine[] = [];
  let totalBottles = 0;
  let totalPrice = 0;
  let primarySku = "";

  for (const row of params.lines) {
    if (row.cases < 1) continue;
    const bottles = row.cases * row.product.caseSize;
    const casePrice = row.product.wholesaleCasePrice ?? 0;
    const lineTotal = Math.round(row.cases * casePrice);
    orderLines.push({ sku: row.sku, quantityBottles: bottles, lineTotal });
    totalBottles += bottles;
    totalPrice += lineTotal;
    if (!primarySku) primarySku = row.sku;
  }

  if (orderLines.length === 0) {
    throw new Error("Cart is empty");
  }

  return {
    id: nextSalesOrderId(params.existingOrders),
    account: params.accountTradingName,
    market: params.market,
    orderDate: todayISO(),
    requestedDelivery: params.requestedDelivery,
    sku: primarySku,
    quantity: totalBottles,
    price: totalPrice,
    lines: orderLines,
    salesRep: params.salesRep,
    status: "draft",
    paymentStatus: "pending",
    customerPoReference: params.customerPoReference?.trim() || undefined,
    orderNotes: params.orderNotes?.trim() || undefined,
    deliveryAddress: params.deliveryAddress?.trim() || undefined,
    invoiceStatus: "not_invoiced",
    orderRoutingTarget: "retail",
    orderCreatedByRole: "retail",
    repApprovalStatus: "pending",
  };
}
