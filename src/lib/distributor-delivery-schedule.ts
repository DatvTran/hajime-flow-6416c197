import type { SalesOrder, Shipment } from "@/data/mockData";
import { resolveSalesOrderIdFromShipmentLink } from "@/lib/distributor-fulfillment-links";
import { shipmentLineContentsLabel } from "@/lib/order-lines";

export type ScheduleDelivery = {
  id: string;
  time: string;
  account: string;
  items: string;
  tracking: string;
  pill: { tone: "green" | "blue" | "amber" | "red" | "neutral"; label: string };
  shipment?: Shipment;
  order?: SalesOrder;
};

export type ScheduleDay = {
  sortKey: string;
  label: string;
  deliveries: ScheduleDelivery[];
};

const MS_DAY = 86_400_000;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseDateLike(raw: string | undefined): Date | null {
  const t = raw?.trim();
  if (!t) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) {
    const d = new Date(t.includes("T") ? t : `${t}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const stripped = t.replace(/^(Delivered|Received|ETA)\s+/i, "").trim();
  const d = new Date(stripped.includes("T") ? stripped : `${stripped}T12:00:00`);
  if (!Number.isNaN(d.getTime())) return d;
  const match = stripped.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(\d{1,2})\s+([A-Za-z]{3})/i);
  if (match) {
    const year = new Date().getFullYear();
    const attempt = new Date(`${match[2]} ${match[3]} ${year} 12:00:00`);
    return Number.isNaN(attempt.getTime()) ? null : attempt;
  }
  return null;
}

function formatDayLabel(d: Date, now: Date): string {
  const diff = Math.round((startOfDay(d).getTime() - startOfDay(now).getTime()) / MS_DAY);
  const datePart = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  if (diff === 0) return `Today — ${datePart}`;
  if (diff === 1) return `Tomorrow — ${datePart}`;
  return datePart;
}

function formatTimeLabel(raw: string | undefined, order?: SalesOrder): string {
  const fromEta = raw?.trim();
  if (fromEta && /\d{1,2}(:\d{2})?\s*(–|-|to)\s*\d/i.test(fromEta)) {
    const m = fromEta.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*(?:–|-|to)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    if (m) return m[1].replace(/\s+/g, " ").trim();
  }
  const window = order?.requestedDelivery?.trim();
  if (window && /\d{1,2}/.test(window) && window.length < 40) return window;
  const d = parseDateLike(fromEta || order?.requestedDelivery);
  if (d) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return "—";
}

function accountLabel(destination: string, order?: SalesOrder): string {
  if (order?.account?.trim()) return order.account.trim();
  const dest = destination.trim();
  if (!dest || dest === "—") return "Retail account";
  return dest.split(" — ")[0].split(" - ")[0].trim();
}

function pillForShipment(s: Shipment): ScheduleDelivery["pill"] {
  if (s.status === "delivered") return { tone: "green", label: "delivered" };
  if (s.status === "in-transit" || s.status === "delayed") return { tone: "blue", label: "in-transit" };
  return { tone: "blue", label: "confirmed" };
}

function pillForOrder(o: SalesOrder): ScheduleDelivery["pill"] {
  if (o.status === "packed") return { tone: "amber", label: "scheduled" };
  if (o.status === "shipped") return { tone: "blue", label: "in-transit" };
  return { tone: "neutral", label: "scheduled" };
}

function isOutboundShipment(s: Shipment): boolean {
  return s.type === "outbound" || s.orderType === "sales_order";
}

export function buildDistributorDeliverySchedule(
  shipments: Shipment[],
  salesOrders: SalesOrder[],
  options?: { horizonDays?: number; now?: Date },
): ScheduleDay[] {
  const now = options?.now ?? new Date();
  const horizon = options?.horizonDays ?? 7;
  const todayStart = startOfDay(now).getTime();
  const end = todayStart + horizon * MS_DAY;

  const entries: { sortKey: string; sortTime: string; delivery: ScheduleDelivery }[] = [];
  const linkedOrderKeys = new Set<string>();
  let fallbackDayOffset = 0;

  function scheduleDayForActiveShipment(
    etaRaw: string | undefined,
    order: SalesOrder | undefined,
  ): Date | null {
    const parsed = parseDateLike(etaRaw) ?? parseDateLike(order?.requestedDelivery);
    if (parsed) {
      const dayStart = startOfDay(parsed).getTime();
      if (dayStart >= todayStart && dayStart <= end) return parsed;
      // Stale ETA on an still-active shipment — roll forward into the 7-day window.
      if (dayStart < todayStart) {
        const rolled = new Date(todayStart + Math.min(fallbackDayOffset, horizon - 1) * MS_DAY);
        fallbackDayOffset += 1;
        return rolled;
      }
    }
    const rolled = new Date(todayStart + Math.min(fallbackDayOffset, horizon - 1) * MS_DAY);
    fallbackDayOffset += 1;
    return rolled;
  }

  for (const s of shipments.filter(isOutboundShipment)) {
    if (s.status === "delivered") continue;
    const orderId = resolveSalesOrderIdFromShipmentLink(s.linkedOrder, salesOrders, s.linkedOrderDbId);
    const order = orderId ? salesOrders.find((o) => o.id === orderId) : undefined;
    if (order) {
      linkedOrderKeys.add(order.id);
      if (order.orderNumber) linkedOrderKeys.add(order.orderNumber);
    }
    const day = scheduleDayForActiveShipment(s.eta, order);
    if (!day) continue;

    const tracking = s.waybillNumber?.trim() || s.id;
    entries.push({
      sortKey: startOfDay(day).toISOString().slice(0, 10),
      sortTime: formatTimeLabel(s.eta, order),
      delivery: {
        id: `sh-${s.id}`,
        time: formatTimeLabel(s.eta, order),
        account: accountLabel(s.destination, order),
        items: shipmentLineContentsLabel(s) || order?.account || "Outbound delivery",
        tracking,
        pill: pillForShipment(s),
        shipment: s,
        order,
      },
    });
  }

  for (const order of salesOrders) {
    if (order.status === "cancelled" || order.status === "delivered" || order.status === "draft") continue;
    if (linkedOrderKeys.has(order.id) || (order.orderNumber && linkedOrderKeys.has(order.orderNumber))) continue;
    if (!["confirmed", "packed", "shipped"].includes(order.status)) continue;

    let day = parseDateLike(order.requestedDelivery);
    if (!day || startOfDay(day).getTime() < todayStart) {
      day = new Date(todayStart + Math.min(fallbackDayOffset, horizon - 1) * MS_DAY);
      fallbackDayOffset += 1;
    }
    const dayStart = startOfDay(day).getTime();
    if (dayStart > end) continue;

    entries.push({
      sortKey: startOfDay(day).toISOString().slice(0, 10),
      sortTime: formatTimeLabel(undefined, order),
      delivery: {
        id: `ord-${order.id}`,
        time: formatTimeLabel(undefined, order),
        account: order.account,
        items: order.lines?.length
          ? order.lines.map((l) => `${l.sku} × ${l.quantityBottles}`).join(", ")
          : `${order.sku} × ${order.quantity}`,
        tracking: "Pending",
        pill: pillForOrder(order),
        order,
      },
    });
  }

  entries.sort((a, b) => {
    if (a.sortKey !== b.sortKey) return a.sortKey.localeCompare(b.sortKey);
    return a.sortTime.localeCompare(b.sortTime);
  });

  const byDay = new Map<string, ScheduleDay>();
  for (const entry of entries) {
    const dayDate = new Date(`${entry.sortKey}T12:00:00`);
    const label = formatDayLabel(dayDate, now);
    const bucket = byDay.get(entry.sortKey) ?? { sortKey: entry.sortKey, label, deliveries: [] };
    bucket.deliveries.push(entry.delivery);
    byDay.set(entry.sortKey, bucket);
  }

  return [...byDay.values()].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}
