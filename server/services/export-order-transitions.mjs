import { platformDb } from "../config/database.mjs";
import { httpError } from "../lib/http-error.mjs";
import {
  applyIssueToChecklist,
  asJsonObject,
  priceExportLines,
} from "../lib/export-orders.mjs";
import { assertDepositGate, assertReleaseGate, latestException, loadPayments } from "./export-order-gates.mjs";
import { assertLinesAboveFloor } from "./pricing.mjs";
import { issueDocument } from "./export-issue-document.mjs";
import { createProductionPoForExport } from "./export-production-po.mjs";
import {
  bookExportOriginInventory,
  createDirectExportShipment,
  shipExportOriginInventory,
} from "./export-fob-inventory.mjs";

const HQ = ["founder_admin", "brand_operator", "operations"];
const FIN = [...HQ, "finance"];
const MFG = [...HQ, "manufacturer"];
const REL = ["founder_admin", "brand_operator"];

function parseLines(order) {
  if (Array.isArray(order.lines)) return order.lines;
  if (typeof order.lines === "string") {
    try {
      const p = JSON.parse(order.lines);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function appendEvent(trx, { tenantId, orderId, eventType, fromState, toState, action, detail, actor }) {
  if (!(await trx.schema.hasTable("export_order_events"))) return;
  await trx("export_order_events").insert({
    tenant_id: tenantId,
    export_order_id: orderId,
    event_type: eventType,
    from_state: fromState || null,
    to_state: toState || null,
    action: action || null,
    detail: JSON.stringify(detail || {}),
    actor_user_id: actor?.userId || null,
    actor_role: actor?.role || null,
    occurred_at: new Date(),
  });
}

async function stampIssued(trx, order, docType, actor) {
  const issued = { ...asJsonObject(order.issued_docs) };
  issued[docType] = { issuedAt: new Date().toISOString(), issuedBy: actor.email || actor.userId };
  const checklist = applyIssueToChecklist(order.checklist, docType);
  const doc = await issueDocument(trx, {
    tenantId: order.tenant_id,
    order: { ...order, issued_docs: issued },
    docType,
    actor,
  });
  return {
    issued_docs: JSON.stringify(issued),
    checklist: JSON.stringify(checklist),
    doc,
  };
}

const TRANSITIONS = {
  issue_quotation: {
    from: ["01_lead", "02_quotation"],
    to: "02_quotation",
    actors: HQ,
    async guard({ trx, tenantId, order }) {
      const lines = parseLines(order);
      if (!lines.length) return { ok: false, code: "NO_LINES" };
      return assertLinesAboveFloor(trx, tenantId, lines, null);
    },
    async effect({ trx, order, actor }) {
      const docs = await stampIssued(trx, order, "quotation", actor);
      const patch = { ...docs, quote_valid_until: order.quote_valid_until || "30 days" };
      if (docs.doc?.doc_number) patch.quote_no = docs.doc.doc_number;
      return { orderPatch: patch, detail: { doc: docs.doc?.doc_number } };
    },
  },
  requote: {
    from: ["02_quotation"],
    to: "02_quotation",
    actors: HQ,
    async guard({ trx, tenantId, order }) {
      return assertLinesAboveFloor(trx, tenantId, parseLines(order), null);
    },
    async effect({ trx, order, actor }) {
      const docs = await stampIssued(trx, order, "quotation", actor);
      return { orderPatch: docs, detail: { revision: true } };
    },
  },
  record_buyer_po: {
    from: ["02_quotation"],
    to: "03_buyer_po",
    actors: HQ,
    async guard({ payload, order }) {
      const ref = String(payload.buyerPoNo || payload.buyer_po_reference || order.buyer_po_no || "").trim();
      if (!ref) return { ok: false, code: "BUYER_PO_REQUIRED" };
      return { ok: true, ref };
    },
    async effect({ guard }) {
      return { orderPatch: { buyer_po_no: guard.ref }, detail: { buyer_po_no: guard.ref } };
    },
  },
  accept_po: {
    from: ["03_buyer_po"],
    to: "04_po_acceptance",
    actors: HQ,
    async guard() {
      return { ok: true };
    },
    async effect({ trx, order, actor }) {
      const docs = await stampIssued(trx, order, "po_acceptance", actor);
      const pack = priceExportLines(parseLines(order));
      return { orderPatch: { ...docs, subtotal_usd: pack.subtotalUsd } };
    },
  },
  issue_pi: {
    from: ["04_po_acceptance"],
    to: "05_proforma",
    actors: FIN,
    async guard({ order }) {
      const pack = priceExportLines(parseLines(order));
      if (!pack.lines.length) return { ok: false, code: "NO_LINES" };
      return { ok: true, pack };
    },
    async effect({ trx, order, actor, guard }) {
      const docs = await stampIssued(trx, order, "proforma", actor);
      const patch = {
        ...docs,
        deposit_due_usd: guard.pack.depositDueUsd,
        balance_due_usd: guard.pack.balanceDueUsd,
        subtotal_usd: guard.pack.subtotalUsd,
        deposit_amount_frozen: true,
      };
      if (docs.doc?.doc_number) patch.pi_no = docs.doc.doc_number;
      return { orderPatch: patch };
    },
  },
  record_payment: {
    from: ["05_proforma", "06_deposit", "11_balance"],
    to: null,
    actors: FIN,
    async guard({ trx, tenantId, order, payload }) {
      const type = payload.paymentType === "balance" ? "balance" : "deposit";
      if (type === "deposit" && !["05_proforma", "06_deposit"].includes(order.stage)) {
        return { ok: false, code: "ILLEGAL_TRANSITION" };
      }
      if (type === "balance" && order.stage !== "11_balance") {
        return { ok: false, code: "ILLEGAL_TRANSITION" };
      }
      const received = Number(payload.amountReceived ?? payload.amount_received ?? 0);
      const fees = Number(payload.bankFees ?? payload.bank_fees_deducted ?? 0);
      const net = Number((received - fees).toFixed(2));
      if (received < 0 || net < 0) return { ok: false, code: "INVALID_AMOUNT" };
      return { ok: true, type, received, fees, net };
    },
    async effect({ trx, tenantId, order, actor, guard, payload }) {
      if (await trx.schema.hasTable("export_payments")) {
        await trx("export_payments").insert({
          tenant_id: tenantId,
          export_order_id: order.id,
          payment_type: guard.type,
          amount_expected:
            guard.type === "deposit" ? Number(order.deposit_due_usd) : Number(order.balance_due_usd),
          amount_received: guard.received,
          bank_fees_deducted: guard.fees,
          net_credited_amount: guard.net,
          status: "cleared",
          payment_reference: payload.reference || payload.payment_reference || null,
          value_date: payload.valueDate || payload.value_date || null,
          verified_by: actor.userId || null,
          verified_at: new Date(),
        });
      }
      const payments = await loadPayments(trx, tenantId, order.id);
      const exception = await latestException(trx, tenantId, order.id);
      if (guard.type === "deposit") {
        const gate = assertDepositGate({ ...order, required_deposit_amount: order.deposit_due_usd }, payments, exception);
        if (!gate.ok) return { error: gate };
        const docs = await stampIssued(trx, order, "deposit", actor);
        return {
          toState: "06_deposit",
          orderPatch: {
            ...docs,
            deposit_status: "cleared",
            deposit_received_usd: guard.net,
            wire_fees_usd: guard.fees,
          },
        };
      }
      const value = Number(order.subtotal_usd || 0);
      const cleared = payments
        .filter((p) => p.status === "cleared")
        .reduce((s, p) => s + Number(p.net_credited_amount), 0);
      if (cleared + 1e-9 < value && exception?.kind !== "balance_waived") {
        return { error: { ok: false, code: "BALANCE_NOT_CLEARED", shortfall: Number((value - cleared).toFixed(2)) } };
      }
      return {
        toState: "11_balance",
        orderPatch: { balance_status: "cleared", balance_received_usd: guard.net },
      };
    },
  },
  authorize_production: {
    from: ["06_deposit"],
    to: "07_production_auth",
    actors: HQ,
    async guard({ trx, tenantId, order }) {
      const payments = await loadPayments(trx, tenantId, order.id);
      const exception = await latestException(trx, tenantId, order.id);
      const gate = assertDepositGate(
        { ...order, required_deposit_amount: order.deposit_due_usd },
        payments.length ? payments : [{ payment_type: "deposit", status: order.deposit_status, net_credited_amount: order.deposit_received_usd }],
        exception,
      );
      if (!gate.ok) return gate;
      if (!String(order.manufacturer_name || "").trim()) {
        return { ok: false, code: "MANUFACTURER_REQUIRED" };
      }
      return { ok: true };
    },
    async effect({ trx, tenantId, order, actor }) {
      const po = await createProductionPoForExport(trx, { tenantId, order, actor });
      const docs = await stampIssued(trx, order, "production_auth", actor);
      const patch = { ...docs, production_po_id: po.id, next_action: "Distillery to confirm slot" };
      if (docs.doc?.doc_number) patch.pa_no = docs.doc.doc_number;
      return { orderPatch: patch, detail: { production_po_id: po.id } };
    },
  },
  confirm_slot: {
    from: ["07_production_auth"],
    to: "07_production_auth",
    actors: MFG,
    async guard({ payload }) {
      if (!String(payload.productionSlot || payload.production_slot || "").trim()) {
        return { ok: false, code: "SLOT_REQUIRED" };
      }
      return { ok: true };
    },
    async effect({ payload, trx, tenantId, order }) {
      if (order.production_po_id) {
        await trx("purchase_orders")
          .where({ id: order.production_po_id, tenant_id: tenantId })
          .update({ status: "in-production", updated_at: new Date() });
      }
      return {
        orderPatch: {
          production_slot: payload.productionSlot || payload.production_slot,
          expected_completion: payload.expectedCompletion || payload.expected_completion || null,
          batch_plan: payload.batchPlan || payload.batch_plan || order.batch_plan,
          next_action: "Distillery to confirm ready to ship",
        },
      };
    },
  },
  confirm_ready: {
    from: ["07_production_auth"],
    to: "10_ready_to_ship",
    actors: MFG,
    async guard({ payload, order }) {
      const cases = payload.estimatedPallets || payload.estimated_pallets || order.estimated_pallets;
      const batch = payload.batchPlan || payload.batch_plan || order.batch_plan;
      if (!batch) return { ok: false, code: "BATCH_REQUIRED" };
      if (!cases) return { ok: false, code: "PALLET_REQUIRED" };
      return { ok: true };
    },
    async effect({ trx, tenantId, order, payload }) {
      await bookExportOriginInventory(trx, { tenantId, order });
      if (order.production_po_id) {
        await trx("purchase_orders")
          .where({ id: order.production_po_id, tenant_id: tenantId })
          .update({ status: "completed", updated_at: new Date() });
      }
      return {
        orderPatch: {
          estimated_pallets: payload.estimatedPallets || payload.estimated_pallets || order.estimated_pallets,
          cases_per_pallet: payload.casesPerPallet || payload.cases_per_pallet || order.cases_per_pallet,
          estimated_gross_weight: payload.estimatedGrossWeight || payload.estimated_gross_weight || order.estimated_gross_weight,
          batch_plan: payload.batchPlan || payload.batch_plan || order.batch_plan,
          ready_to_ship_on: payload.readyToShipOn || payload.ready_to_ship_on || new Date(),
          quantity_reconciled_at: new Date(),
          next_action: "Request final balance",
        },
      };
    },
  },
  request_balance: {
    from: ["10_ready_to_ship"],
    to: "11_balance",
    actors: FIN,
    async guard() {
      return { ok: true };
    },
    async effect() {
      return { orderPatch: { next_action: "Await buyer balance wire" } };
    },
  },
  release: {
    from: ["11_balance"],
    to: "12_shipment_release",
    actors: REL,
    async guard({ trx, tenantId, order }) {
      const payments = await loadPayments(trx, tenantId, order.id);
      const exception = await latestException(trx, tenantId, order.id);
      return assertReleaseGate(order, payments, order.checklist, exception);
    },
    async effect({ trx, tenantId, order, actor }) {
      const ship = await createDirectExportShipment(trx, { tenantId, order, actor });
      const docs = await stampIssued(trx, order, "shipment_release", actor);
      const patch = { ...docs, shipment_id: ship.id, next_action: "Confirm FOB handover" };
      if (docs.doc?.doc_number) patch.release_no = docs.doc.doc_number;
      return { orderPatch: patch, detail: { shipment_id: ship.id } };
    },
  },
  confirm_handover: {
    from: ["12_shipment_release"],
    to: "13_fob_handover",
    actors: HQ,
    async guard({ payload, order }) {
      const ref = String(payload.transportReference || payload.transport_reference || order.forwarder_instructions || "").trim();
      if (!ref) return { ok: false, code: "TRANSPORT_REF_REQUIRED" };
      return { ok: true, ref };
    },
    async effect({ trx, tenantId, order, guard }) {
      await shipExportOriginInventory(trx, { tenantId, order });
      if (order.production_po_id) {
        await trx("purchase_orders")
          .where({ id: order.production_po_id, tenant_id: tenantId })
          .update({ status: "shipped", updated_at: new Date() });
      }
      return {
        orderPatch: {
          actual_ship_date: new Date(),
          next_action: "Close commercial file",
          notes: [order.notes, `Transport ${guard.ref}`].filter(Boolean).join("\n"),
        },
      };
    },
  },
  close: {
    from: ["13_fob_handover", "14_closing"],
    to: "15_closeout",
    actors: HQ,
    async guard() {
      return { ok: true };
    },
    async effect() {
      return { orderPatch: { next_action: null } };
    },
  },
  hold: {
    from: "*",
    to: "on_hold",
    actors: HQ,
    async guard({ payload, order }) {
      if (["15_closeout", "cancelled", "on_hold"].includes(order.stage)) {
        return { ok: false, code: "ILLEGAL_TRANSITION" };
      }
      const reason = String(payload.reason || "").trim();
      if (!reason) return { ok: false, code: "REASON_REQUIRED" };
      return { ok: true, reason };
    },
    async effect({ order, guard }) {
      return { orderPatch: { state_before_hold: order.stage, hold_reason: guard.reason } };
    },
  },
  resume: {
    from: ["on_hold"],
    to: "restore",
    actors: HQ,
    async guard({ order }) {
      if (!order.state_before_hold) return { ok: false, code: "NO_PRIOR_STATE" };
      return { ok: true };
    },
    async effect() {
      return { orderPatch: { hold_reason: null } };
    },
  },
  cancel: {
    from: "*",
    to: "cancelled",
    actors: HQ,
    async guard({ payload, order }) {
      const idx = ["12_shipment_release", "13_fob_handover", "14_closing", "15_closeout"].includes(order.stage);
      if (idx) return { ok: false, code: "TOO_LATE_TO_CANCEL" };
      const reason = String(payload.reason || "").trim();
      if (!reason) return { ok: false, code: "REASON_REQUIRED" };
      return { ok: true, reason };
    },
    async effect({ trx, tenantId, order, guard }) {
      if (order.production_po_id) {
        await trx("purchase_orders")
          .where({ id: order.production_po_id, tenant_id: tenantId })
          .update({ status: "cancelled", updated_at: new Date() })
          .catch(() => {});
      }
      return { orderPatch: { hold_reason: guard.reason, next_action: null } };
    },
  },
};

export async function applyTransition({ tenantId, orderId, action, actor, payload = {}, db = platformDb }) {
  return db.transaction(async (trx) => {
    const order = await trx("export_orders")
      .where({ id: orderId, tenant_id: tenantId })
      .forUpdate()
      .first();
    if (!order) throw httpError(404, "Export order not found");

    const rule = TRANSITIONS[action];
    if (!rule) throw httpError(400, `Unknown action: ${action}`);

    const fromStates = rule.from === "*" ? [order.stage] : rule.from;
    if (!fromStates.includes(order.stage) && rule.from !== "*") {
      throw httpError(409, `Cannot ${action} from state ${order.stage}`, {
        code: "ILLEGAL_TRANSITION",
        allowedFrom: rule.from,
      });
    }
    if (!rule.actors.includes(actor.role)) {
      throw httpError(403, `Role ${actor.role} cannot ${action}`);
    }

    const guard = await rule.guard({ trx, tenantId, order, payload, actor });
    if (!guard.ok) throw httpError(422, guard.code || "GUARD_FAILED", guard);

    const effects = await rule.effect({ trx, tenantId, order, payload, actor, guard });
    if (effects?.error && effects.error.ok === false) {
      throw httpError(422, effects.error.code, effects.error);
    }

    const toState =
      effects.toState ||
      (rule.to === "restore" ? order.state_before_hold : rule.to) ||
      order.stage;

    const patch = {
      ...(effects.orderPatch || {}),
      stage: toState,
      updated_at: new Date(),
    };
    delete patch.doc;

    await trx("export_orders").where({ id: orderId, tenant_id: tenantId }).update(patch);

    await appendEvent(trx, {
      tenantId,
      orderId,
      eventType: "transition",
      fromState: order.stage,
      toState,
      action,
      detail: effects.detail || {},
      actor,
    });

    return trx("export_orders").where({ id: orderId, tenant_id: tenantId }).first();
  });
}

export async function approveException({ tenantId, orderId, actor, kind, reason, shortfall, db = platformDb }) {
  if (!kind || !String(reason || "").trim()) {
    throw httpError(400, "Exception kind and reason are required");
  }
  return db.transaction(async (trx) => {
    const order = await trx("export_orders").where({ id: orderId, tenant_id: tenantId }).forUpdate().first();
    if (!order) throw httpError(404, "Export order not found");
    await appendEvent(trx, {
      tenantId,
      orderId,
      eventType: "exception_approved",
      fromState: order.stage,
      toState: order.stage,
      action: "exception",
      detail: { kind, reason, shortfall, approved_by: actor.userId },
      actor,
    });
    return order;
  });
}

export { TRANSITIONS };
