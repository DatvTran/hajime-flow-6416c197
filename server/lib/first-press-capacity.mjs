import { asJsonObject } from "./export-orders.mjs";

/** The distillery bottles at most 7,500 L of First Press a month (10,000 × 750 ml), shared by both sizes. Keep in sync with src/lib/first-press-capacity.ts. */
export const FIRST_PRESS_MONTHLY_ML = 7_500_000;

/** Liquid per case in ml: 12 × 750 ml and 24 × 200 ml. */
export const FIRST_PRESS_ML_PER_CASE = { first_press_750: 9_000, first_press_200: 4_800 };

/** Delivery months offered to buyers, starting next month. */
export const DELIVERY_MONTHS_AHEAD = 6;

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function parseLines(lines) {
  if (Array.isArray(lines)) return lines;
  if (typeof lines === "string") {
    try {
      const p = JSON.parse(lines);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function firstPressMl(lines) {
  return parseLines(lines).reduce((ml, l) => {
    const per = FIRST_PRESS_ML_PER_CASE[l?.sku];
    const cases = Math.max(0, Math.floor(Number(l?.cases) || 0));
    return per ? ml + per * cases : ml;
  }, 0);
}

/** Months run on Hong Kong time, e.g. "2026-11". */
export function hktMonth(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() + 8 * 3600_000).toISOString().slice(0, 7);
}

export function isMonth(v) {
  return MONTH_RE.test(String(v || ""));
}

export function addMonths(month, n) {
  const [y, m] = String(month).split("-").map(Number);
  const i = y * 12 + (m - 1) + n;
  return `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;
}

/** We bottle the month before the goods are due. */
export function productionMonth(requestedMonth) {
  return isMonth(requestedMonth) ? addMonths(requestedMonth, -1) : null;
}

export function monthLabel(month) {
  if (!isMonth(month)) return "";
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function deliveryWindowFor(month) {
  return isMonth(month) ? `Delivery in ${monthLabel(month)}` : "";
}

/** The new delivery window text for a month change, or null to keep what HQ typed. */
export function followMonth(window, fromMonth, toMonth) {
  const w = String(window || "").trim();
  if (!isMonth(toMonth)) return null;
  if (w && w !== deliveryWindowFor(fromMonth)) return null;
  return deliveryWindowFor(toMonth);
}

/** The earliest delivery month is next month, so production can still happen this month. */
export function isBookableDeliveryMonth(month, now = new Date()) {
  return isMonth(month) && month > hktMonth(now);
}

/** Columns for a delivery month given when an order is created; an empty value leaves both unset. */
export function newOrderMonthFields(value, now = new Date()) {
  const month = String(value ?? "").trim();
  if (!month) return { fields: {} };
  if (!isBookableDeliveryMonth(month, now)) return { error: "Pick a delivery month from next month onwards." };
  return { fields: { requested_month: month, delivery_window: deliveryWindowFor(month) } };
}

export function deliveryMonthOptions(now = new Date(), count = DELIVERY_MONTHS_AHEAD) {
  const first = addMonths(hktMonth(now), 1);
  return Array.from({ length: count }, (_, i) => addMonths(first, i));
}

export function litres(ml) {
  return Math.round(ml / 100) / 10;
}

/** The production month an order's litres sit in, or null when it holds none. */
export function orderCapacityMonth(row) {
  if (!row || row.stage === "cancelled") return null;
  if (row.capacity_reserved_at && isMonth(row.requested_month)) return productionMonth(row.requested_month);
  const authorizedAt = asJsonObject(row.issued_docs).production_auth?.issuedAt;
  return authorizedAt ? hktMonth(authorizedAt) : null;
}

export function capacitySummary(usedMl, month) {
  const leftMl = Math.max(0, FIRST_PRESS_MONTHLY_ML - usedMl);
  return {
    month,
    capacityLitres: litres(FIRST_PRESS_MONTHLY_ML),
    usedLitres: litres(usedMl),
    leftLitres: litres(leftMl),
    leftMl,
    leftCases750: Math.floor(leftMl / FIRST_PRESS_ML_PER_CASE.first_press_750),
    leftCases200: Math.floor(leftMl / FIRST_PRESS_ML_PER_CASE.first_press_200),
  };
}

async function loadOrders(db, tenantId) {
  return db("export_orders")
    .where({ tenant_id: tenantId })
    .whereNot("stage", "cancelled")
    .select("id", "stage", "lines", "issued_docs", "requested_month", "capacity_reserved_at");
}

function usedIn(rows, month, excludeOrderId) {
  return rows.reduce((ml, r) => {
    if (excludeOrderId != null && String(r.id) === String(excludeOrderId)) return ml;
    return orderCapacityMonth(r) === month ? ml + firstPressMl(r.lines) : ml;
  }, 0);
}

/** First Press already held in a production month (reserved orders, plus orders authorized before reservations existed). */
export async function firstPressUsedMl(db, tenantId, month, { excludeOrderId } = {}) {
  return usedIn(await loadOrders(db, tenantId), month, excludeOrderId);
}

/** Litres left for each upcoming delivery month, keyed by the production month behind it. */
export async function capacityByMonth(db, tenantId, { now = new Date(), months = DELIVERY_MONTHS_AHEAD, excludeOrderId } = {}) {
  const rows = await loadOrders(db, tenantId);
  return deliveryMonthOptions(now, months).map((deliveryMonth) => {
    const prod = productionMonth(deliveryMonth);
    return { deliveryMonth, productionMonth: prod, ...capacitySummary(usedIn(rows, prod, excludeOrderId), prod) };
  });
}

/** Null when the order fits, otherwise the reason it can't be booked. */
export function capacityShortfall(orderMl, usedMl, prodMonth) {
  if (orderMl <= 0) return null;
  const left = Math.max(0, FIRST_PRESS_MONTHLY_ML - usedMl);
  if (orderMl <= left) return null;
  const s = capacitySummary(usedMl, prodMonth || "");
  const when = prodMonth
    ? `for production in ${monthLabel(prodMonth)} (delivery ${monthLabel(addMonths(prodMonth, 1))})`
    : "this month";
  return (
    `Not enough First Press capacity ${when}. This order needs ${litres(orderMl).toLocaleString("en-US")} L; ` +
    `${s.leftLitres.toLocaleString("en-US")} L of ${s.capacityLitres.toLocaleString("en-US")} L is left ` +
    `(up to ${s.leftCases750.toLocaleString("en-US")} cases of 750 ml or ${s.leftCases200.toLocaleString("en-US")} of 200 ml). ` +
    `Pick a later delivery month or reduce the cases.`
  );
}

export async function lockCapacity(trx, tenantId) {
  if (typeof trx.raw === "function") {
    await trx.raw("SELECT pg_advisory_xact_lock(hashtext(?))", [`first_press_capacity:${tenantId}`]);
  }
}

/**
 * Checks the order's requested delivery month has room for its First Press. Holds the capacity lock until the
 * surrounding transaction ends, so a reservation written in the same transaction can't be overtaken.
 */
export async function assertMonthHasRoom(trx, tenantId, order, { requestedMonth, lines } = {}) {
  const month = requestedMonth ?? order.requested_month;
  const orderMl = firstPressMl(lines ?? order.lines);
  if (orderMl <= 0) return { ok: true };
  if (!isMonth(month)) return { ok: false, code: "Set the requested delivery month first." };
  await lockCapacity(trx, tenantId);
  const prod = productionMonth(month);
  const usedMl = await firstPressUsedMl(trx, tenantId, prod, { excludeOrderId: order.id });
  const shortfall = capacityShortfall(orderMl, usedMl, prod);
  return shortfall ? { ok: false, code: shortfall, capacityFull: true } : { ok: true };
}

let columnsReady = null;

/** Public signing routes can run before any HQ request has created the capacity columns. */
export function ensureCapacityColumns(db) {
  if (!columnsReady) {
    columnsReady = import("../migrations/058_export_capacity_month.mjs")
      .then((m) => m.up(db))
      .catch((err) => {
        columnsReady = null;
        console.error("[first-press-capacity] ensure columns failed:", err);
      });
  }
  return columnsReady;
}
