import test from "node:test";
import assert from "node:assert/strict";
import { assertDepositGate, assertReleaseGate, fobTerminalNamed } from "../services/export-order-gates.mjs";
import { TRANSITIONS } from "../services/export-order-transitions.mjs";
import { serializeExportOrder } from "../lib/export-orders.mjs";

test("deposit gate fails on net shortfall", () => {
  const r = assertDepositGate(
    { required_deposit_amount: 50000 },
    [{ payment_type: "deposit", status: "cleared", net_credited_amount: 49950 }],
    null,
  );
  assert.equal(r.ok, false);
  assert.equal(r.code, "DEPOSIT_NOT_CLEARED");
  assert.equal(r.shortfall, 50);
});

test("deposit gate passes with short_payment_accepted exception", () => {
  const r = assertDepositGate(
    { required_deposit_amount: 50000, short_payment_tolerance: 50 },
    [{ payment_type: "deposit", status: "cleared", net_credited_amount: 49950 }],
    { kind: "short_payment_accepted" },
  );
  assert.equal(r.ok, true);
});

test("FOB Bangkok is not a named terminal", () => {
  assert.equal(fobTerminalNamed("FOB Bangkok"), false);
  assert.equal(fobTerminalNamed("Laem Chabang Terminal A"), true);
});

test("release blocked on unnamed FOB and open checklist", () => {
  const r = assertReleaseGate(
    {
      subtotal_usd: 100,
      fob_named_point: "FOB Bangkok",
      forwarder_name: "Kuehne",
      quantity_reconciled_at: new Date(),
      checklist_cleared: false,
      checklist: {},
    },
    [{ status: "cleared", net_credited_amount: 100 }],
    {},
    null,
  );
  assert.equal(r.ok, false);
  assert.ok(r.failures.includes("FOB_TERMINAL_NOT_NAMED"));
});

test("authorize_production is not allowed from pi stage in the map", () => {
  assert.deepEqual(TRANSITIONS.authorize_production.from, ["06_deposit"]);
  assert.ok(!TRANSITIONS.authorize_production.from.includes("05_proforma"));
});

test("manufacturer serialize strips unit prices", () => {
  const data = serializeExportOrder(
    {
      id: 1,
      display_id: "HX-1",
      lines: [{ sku: "first_press_750", cases: 25, unitFobUsd: 32 }],
      subtotal_usd: 9600,
      deposit_due_usd: 4800,
      balance_due_usd: 4800,
      stage: "07_production_auth",
      checklist: {},
      issued_docs: {},
    },
    { manufacturerFacing: true, includeInternalEconomics: false },
  );
  assert.equal(data.subtotalUsd, undefined);
  assert.ok(!("unitFobUsd" in (data.lines[0] || {})));
  assert.ok(!("floorFobUsd" in (data.lines[0] || {})));
});
