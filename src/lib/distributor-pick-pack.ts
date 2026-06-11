import type { Account, InventoryItem, SalesOrder, SalesOrderLine } from "@/data/mockData";
import { orderLineEntries } from "@/lib/order-lines";
export type DistributorQueuePillTone = "green" | "blue" | "amber" | "red" | "neutral" | "ink";

export const CASE_SIZE_DEFAULT = 12;

export function pickProgressKey(orderId: string): string {
  return `hajime-dist-pick:${orderId}`;
}

export function pickSessionKey(orderId: string): string {
  return `hajime-dist-pick-session:${orderId}`;
}

export function readPickingSessionActive(orderId: string): boolean {
  try {
    return sessionStorage.getItem(pickSessionKey(orderId)) === "1";
  } catch {
    return false;
  }
}

export function writePickingSessionActive(orderId: string, active: boolean): void {
  try {
    if (active) sessionStorage.setItem(pickSessionKey(orderId), "1");
    else sessionStorage.removeItem(pickSessionKey(orderId));
  } catch {
    // ignore quota errors
  }
}

export function readCheckedKeys(orderId: string): Set<string> {
  try {
    const raw = sessionStorage.getItem(pickProgressKey(orderId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x) => typeof x === "string"));
  } catch {
    return new Set();
  }
}

export function writeCheckedKeys(orderId: string, keys: Set<string>): void {
  sessionStorage.setItem(pickProgressKey(orderId), JSON.stringify([...keys]));
}

export function lineKey(line: SalesOrderLine, index: number): string {
  return `${line.sku}:${index}`;
}

export function casesFromBottles(bottles: number, caseSize: number): number {
  const cs = caseSize > 0 ? bottles / caseSize : bottles;
  const r = Math.round(cs * 10) / 10;
  return Number.isInteger(r) ? r : r;
}

export function formatCasesTotal(cases: number): string {
  const n = Math.round(cases * 10) / 10;
  const label = Number.isInteger(n) ? String(n) : n.toFixed(1);
  return `${label} case${n === 1 ? "" : "s"} total`;
}

export function formatCasesShort(cases: number): string {
  const n = Math.round(cases * 10) / 10;
  if (Number.isInteger(n)) return `${n} cs`;
  return `${n.toFixed(1)} cs`;
}

export function orderPoRef(order: SalesOrder): string {
  const po = order.customerPoReference?.trim();
  if (po) return po;
  const num = order.orderNumber?.trim();
  if (num) return num;
  const m = order.id.match(/^SO-(\d{4})-(\d+)$/);
  if (m) return `PO-${m[1]}-${m[2]}`;
  return order.id;
}

export function parseDueDate(requestedDelivery: string): Date | null {
  const raw = requestedDelivery?.trim();
  if (!raw) return null;
  const d = new Date(raw.includes("T") ? raw : `${raw}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isDueToday(requestedDelivery: string): boolean {
  const d = parseDueDate(requestedDelivery);
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(d);
  due.setHours(0, 0, 0, 0);
  return due.getTime() === today.getTime();
}

export function formatActivePoMeta(order: SalesOrder, lineCount: number, totalCases: number): string {
  const d = parseDueDate(order.requestedDelivery);
  let duePart = "No delivery window set";
  if (d) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(d);
    due.setHours(0, 0, 0, 0);
    const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
    const time = d
      .toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
      .replace(/\s/g, "")
      .toLowerCase();
    if (diff === 0) duePart = `Due today ${time}`;
    else if (diff === 1) duePart = `Due tomorrow ${time}`;
    else if (diff < 0) duePart = "Overdue";
    else duePart = `Due ${d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}`;
  }
  const items = `${lineCount} item${lineCount === 1 ? "" : "s"}`;
  return `${duePart} · ${items} · ${formatCasesTotal(totalCases)}`;
}

export function formatQueueDue(requestedDelivery: string): string {
  const d = parseDueDate(requestedDelivery);
  if (!d) return "No due date";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(d);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
  const time = d
    .toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    .replace(/\s/g, "")
    .toLowerCase();
  if (diff === 0) return `Today ${time}`;
  if (diff === 1) return `Tomorrow ${time}`;
  if (diff === -1) return "Yesterday";
  if (diff < 0) return "Overdue";
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

export function formatDeliveryWindowInput(order: SalesOrder): string {
  const d = parseDueDate(order.requestedDelivery);
  if (!d) return "";
  return `${d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} · ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

export function queuePill(order: SalesOrder): { tone: DistributorQueuePillTone; label: string } {
  if (order.status === "packed") return { tone: "blue", label: "packed" };
  if (isDueToday(order.requestedDelivery)) return { tone: "red", label: "urgent" };
  return { tone: "amber", label: "picking" };
}

export function sortPickQueue(orders: SalesOrder[]): SalesOrder[] {
  return [...orders].sort((a, b) => {
    const rank = (o: SalesOrder) => {
      if (o.status === "confirmed" && isDueToday(o.requestedDelivery)) return 0;
      if (o.status === "confirmed") return 1;
      return 2;
    };
    const r = rank(a) - rank(b);
    if (r !== 0) return r;
    const da = parseDueDate(a.requestedDelivery)?.getTime() ?? Infinity;
    const db = parseDueDate(b.requestedDelivery)?.getTime() ?? Infinity;
    return da - db;
  });
}

function slotFromInventory(inv: InventoryItem): string {
  const lot = inv.batchLot.replace(/^B(\d{4})-/, "Lot ").replace(/^B/, "Lot ");
  const code = inv.id.replace(/\D/g, "");
  const n = code.length ? parseInt(code.slice(-2), 10) || 1 : 1;
  const bay = String((n % 16) + 1).padStart(2, "0");
  const wh = inv.warehouse.includes("Toronto") ? "C" : inv.warehouse.includes("Milan") ? "M" : "A";
  return `${lot} · Aisle ${wh}-04 · Bay ${bay}`;
}

function findWarehouseStock(sku: string, inventory: InventoryItem[]): InventoryItem | undefined {
  return (
    inventory.find(
      (i) =>
        i.sku === sku &&
        i.locationType === "distributor_warehouse" &&
        i.status === "available",
    ) ?? inventory.find((i) => i.sku === sku && i.locationType === "distributor_warehouse")
  );
}

export type PickLineView = {
  key: string;
  name: string;
  detail: string;
  detailShort: string;
  cases: number;
  casesLabel: string;
};

export function buildPickLines(
  order: SalesOrder,
  inventory: InventoryItem[],
  products: { sku: string; name?: string; caseSize?: number }[],
): PickLineView[] {
  const lines = orderLineEntries(order);
  return lines.map((line, index) => {
    const product = products.find((p) => p.sku === line.sku);
    const caseSize = product?.caseSize && product.caseSize > 0 ? product.caseSize : CASE_SIZE_DEFAULT;
    const stock = findWarehouseStock(line.sku, inventory);
    const name = stock?.productName ?? product?.name ?? line.sku;
    const slot = stock ? slotFromInventory(stock) : "";
    const detail = stock ? `${line.sku} · ${slot}` : line.sku;
    const lotOnly = stock ? slot.split(" · ")[0] ?? line.sku : line.sku;
    const detailShort = stock ? `${line.sku} · ${lotOnly}` : line.sku;
    const cases = casesFromBottles(line.quantityBottles, caseSize);
    return {
      key: lineKey(line, index),
      name,
      detail,
      detailShort,
      cases,
      casesLabel: formatCasesShort(cases),
    };
  });
}

export function findOrderAccount(order: SalesOrder, accounts: Account[]): Account | undefined {
  return accounts.find(
    (a) =>
      a.id === order.accountId ||
      a.tradingName === order.account ||
      a.legalName === order.account,
  );
}

export function defaultTrackingNumber(order: SalesOrder): string {
  const m = order.id.match(/(\d+)$/);
  const suffix = m ? m[1].padStart(4, "0") : String(Date.now()).slice(-4);
  const year = new Date().getFullYear();
  return `KT-${year}-${suffix}`;
}

export function deliveryRowsFromOrder(order: SalesOrder, account: Account | undefined) {
  const d = parseDueDate(order.requestedDelivery);
  const window =
    d != null
      ? `${d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
      : "—";
  const address =
    order.shippingAddress?.trim() ||
    order.deliveryAddress?.trim() ||
    (account ? `${account.city}, ${account.country}` : "—");
  return [
    { label: "Ship to", value: order.account },
    { label: "Address", value: address },
    { label: "Contact", value: account?.contactName?.trim() || order.salesRep || "—" },
    { label: "Window", value: window },
    { label: "Carrier", value: "Kentoku Logistics" },
    { label: "Payment", value: account?.paymentTerms?.trim() || "Net 30" },
  ];
}

export function formatPoTotal(order: SalesOrder): string {
  const total = order.totalAmount ?? order.price;
  if (typeof total === "number" && total > 0) {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
      total,
    );
  }
  return "—";
}
