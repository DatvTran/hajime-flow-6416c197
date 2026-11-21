import { asJsonObject, priceExportLines, requiredChecklistReady } from "../lib/export-orders.mjs";

export function fobTerminalNamed(point) {
  const s = String(point || "").trim();
  if (!s) return false;
  if (/^fob bangkok$/i.test(s)) return false;
  return s.length > 12;
}

export function assertDepositGate(order, payments, exception) {
  const cleared = (payments || [])
    .filter((p) => p.payment_type === "deposit" && p.status === "cleared")
    .reduce((sum, p) => sum + Number(p.net_credited_amount), 0);
  const required = Number(order.required_deposit_amount ?? order.deposit_due_usd ?? 0);
  const tolerance = Number(order.short_payment_tolerance ?? 0);
  if (cleared + 1e-9 >= required) return { ok: true, basis: "cleared" };
  if (cleared >= required - tolerance && exception?.kind === "short_payment_accepted") {
    return { ok: true, basis: "tolerance", exception };
  }
  if (exception?.kind === "deposit_waived") return { ok: true, basis: "exception", exception };
  return {
    ok: false,
    code: "DEPOSIT_NOT_CLEARED",
    shortfall: Number((required - cleared).toFixed(2)),
  };
}

export function assertReleaseGate(order, payments, checklist, exception) {
  const failures = [];
  const clearedTotal = (payments || [])
    .filter((p) => p.status === "cleared")
    .reduce((sum, p) => sum + Number(p.net_credited_amount), 0);
  const value = Number(order.confirmed_order_value ?? order.subtotal_usd ?? 0);
  if (clearedTotal + 1e-9 < value && exception?.kind !== "balance_waived") {
    failures.push("BALANCE_NOT_CLEARED");
  }
  const cl = asJsonObject(checklist ?? order.checklist);
  if (!requiredChecklistReady(cl, order) && !order.checklist_cleared) {
    failures.push("CHECKLIST_OPEN");
  }
  if (!fobTerminalNamed(order.fob_named_point || order.fobNamedPoint)) {
    failures.push("FOB_TERMINAL_NOT_NAMED");
  }
  if (!String(order.forwarder_name || "").trim()) failures.push("FORWARDER_MISSING");
  if (!order.quantity_reconciled_at) failures.push("QUANTITY_NOT_RECONCILED");
  return failures.length === 0
    ? { ok: true }
    : { ok: false, code: "RELEASE_BLOCKED", failures };
}

/** Latest payment or release exception. Below-floor price approvals are matched separately and never count here. */
export async function latestException(trx, tenantId, orderId) {
  const rows = await trx("export_order_events")
    .where({
      tenant_id: tenantId,
      export_order_id: orderId,
      event_type: "exception_approved",
    })
    .orderBy("occurred_at", "desc");
  for (const row of rows || []) {
    const detail = typeof row.detail === "string" ? JSON.parse(row.detail) : row.detail || {};
    if (detail.kind !== "below_floor_approved") return { kind: detail.kind, ...detail };
  }
  return null;
}

export async function latestExceptionOfKind(trx, tenantId, orderId, kind) {
  if (!(await trx.schema.hasTable("export_order_events"))) return null;
  const rows = await trx("export_order_events")
    .where({
      tenant_id: tenantId,
      export_order_id: orderId,
      event_type: "exception_approved",
    })
    .orderBy("occurred_at", "desc");
  for (const row of rows || []) {
    const detail = typeof row.detail === "string" ? JSON.parse(row.detail) : row.detail || {};
    if (detail.kind === kind) return { ...detail, kind };
  }
  return null;
}

/** Priced lines reduced to sku, cases and unit price, so an approval can be matched to the exact quote it approved. */
export function floorLinesKey(lines) {
  return priceExportLines(lines)
    .lines.map((l) => `${l.sku}:${l.cases}:${l.unitFobUsd}`)
    .sort()
    .join("|");
}

/** A below-floor approval only counts while the lines still match the snapshot taken when it was approved. */
export function matchingFloorApproval(exception, lines) {
  if (exception?.kind !== "below_floor_approved") return null;
  if (!exception.lines || exception.lines !== floorLinesKey(lines)) return null;
  return exception;
}

export async function loadPayments(trx, tenantId, orderId) {
  if (!(await trx.schema.hasTable("export_payments"))) return [];
  return trx("export_payments").where({ tenant_id: tenantId, export_order_id: orderId });
}
