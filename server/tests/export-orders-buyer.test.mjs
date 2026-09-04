import test from "node:test";
import assert from "node:assert/strict";
import {
  serializeExportOrder,
  isBuyerExportDoc,
  distributorCanViewStage,
  applyIssueToChecklist,
  requiredChecklistReady,
  defaultChecklistState,
} from "../lib/export-orders.mjs";

const row = {
  id: 9,
  display_id: "HJ-X-0009",
  seq: 9,
  quote_no: "HJ-Q-0009",
  pi_no: "HJ-PI-0009",
  deposit_no: "HJ-DEP-0009",
  pa_no: "HJ-PA-0009",
  release_no: "HJ-SR-0009",
  expo_lead_id: 3,
  account_id: 88,
  distributor_org_id: "org-1",
  buyer_name: "Alex",
  buyer_company: "Lion City",
  buyer_address: "SG",
  buyer_email: "alex@lion.sg",
  territory: "Singapore",
  destination_country: "Singapore",
  buyer_po_no: "PO-1",
  stage: "05_proforma",
  lines: [{ sku: "first_press_750", cases: 25, unitFobUsd: 32 }],
  subtotal_usd: 9600,
  deposit_due_usd: 4800,
  balance_due_usd: 4800,
  deposit_status: "pending",
  deposit_received_usd: null,
  wire_fees_usd: null,
  deposit_ref: null,
  deposit_value_date: null,
  deposit_notes: "internal bank note",
  balance_status: "pending",
  balance_received_usd: null,
  balance_ref: null,
  manufacturer_name: "Kosapan",
  requested_completion: null,
  production_slot: "W12",
  expected_completion: null,
  batch_plan: "secret",
  cases_per_pallet: "60",
  estimated_pallets: "2",
  estimated_gross_weight: "400kg",
  factory_contact: "hidden",
  ready_to_ship_on: null,
  forwarder_name: "Buyer fwd",
  forwarder_instructions: "Laem Chabang",
  fob_named_point: null,
  planned_departure: null,
  checklist: { buyer_po: { status: "required" } },
  checklist_cleared: false,
  checklist_open_items: "COO",
  exclusivity: true,
  notes: "do not share",
  quote_valid_until: "30 days",
  created_at: new Date(),
  updated_at: new Date(),
};

test("buyer-facing serialize strips floors, PA, notes, and manufacturer internals", () => {
  const data = serializeExportOrder(row, { includeInternalEconomics: false, buyerFacing: true });
  assert.equal(data.belowFloor, undefined);
  assert.equal(data.paNo, undefined);
  assert.equal(data.notes, undefined);
  assert.equal(data.depositNotes, undefined);
  assert.equal(data.batchPlan, undefined);
  assert.equal(data.factoryContact, undefined);
  assert.equal(data.checklist, undefined);
  assert.equal(data.exclusivity, false);
  assert.equal(data.forwarderName, "Buyer fwd");
  assert.equal(data.quoteNo, "HJ-Q-0009");
  assert.ok(!("floorFobUsd" in (data.lines[0] || {})));
  assert.equal(data.origin, "hq");
});

test("HQ serialize keeps internals", () => {
  const data = serializeExportOrder(row, { includeInternalEconomics: true, buyerFacing: false });
  assert.equal(data.notes, "do not share");
  assert.equal(data.paNo, "HJ-PA-0009");
  assert.equal(data.exclusivity, true);
  assert.equal(data.lines[0].floorFobUsd, 28);
});

test("issuing commercial docs marks matching checklist keys issued", () => {
  const next = applyIssueToChecklist(defaultChecklistState(), "quotation");
  assert.equal(next.quote_acceptance.status, "issued");
  const po = applyIssueToChecklist(next, "po_acceptance");
  assert.equal(po.buyer_po.status, "issued");
  assert.equal(requiredChecklistReady(defaultChecklistState()), false);
  const allIssued = {};
  for (const k of Object.keys(defaultChecklistState())) {
    allIssued[k] = { status: "issued", notes: "" };
  }
  assert.equal(requiredChecklistReady(allIssued), true);
});

test("doc allowlist and stage gate", () => {
  assert.equal(isBuyerExportDoc("quotation"), true);
  assert.equal(isBuyerExportDoc("production_auth"), false);
  assert.equal(distributorCanViewStage("01_lead"), false);
  assert.equal(distributorCanViewStage("02_quotation"), true);
});
