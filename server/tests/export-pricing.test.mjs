import test from "node:test";
import assert from "node:assert/strict";
import {
  applyNegotiatedCaseUsdToLines,
  exportCaseUsdFromNegotiatedFobPerBottle,
  priceExportLines,
  serializeExportOrder,
  SKUS,
} from "../lib/export-orders.mjs";

test("list FOB case math: 40 cs First Press 750 = $16,368 (50/50 deposit)", () => {
  const q = priceExportLines([{ sku: "first_press_750", cases: 40 }]);
  assert.equal(SKUS.first_press_750.listFobUsd, 34.1);
  assert.equal(q.lines[0].caseUsd, 409.2);
  assert.equal(q.subtotalUsd, 16368);
});

test("FOB × bottles × cases: negotiated bottle 45 / 20", () => {
  assert.equal(exportCaseUsdFromNegotiatedFobPerBottle(45, 12), 540);
  assert.equal(exportCaseUsdFromNegotiatedFobPerBottle(20, 24), 480);
  const lines = applyNegotiatedCaseUsdToLines(
    [
      { sku: "first_press_750", cases: 20 },
      { sku: "first_press_200", cases: 20 },
    ],
    new Map([
      ["first_press_750", 540],
      ["first_press_200", 480],
    ]),
  );
  const q = priceExportLines(lines);
  assert.equal(q.lines[0].caseUsd, 540);
  assert.equal(q.lines[0].lineTotalUsd, 10800);
  assert.equal(q.lines[1].caseUsd, 480);
  assert.equal(q.lines[1].lineTotalUsd, 9600);
  assert.equal(q.subtotalUsd, 20400);
  assert.equal(q.depositDueUsd, 10200);
});

test("serialize uses stored caseUsd from FOB×bottles", () => {
  const row = {
    id: 17,
    display_id: "HX-0017",
    seq: 17,
    quote_no: "Q-0017",
    pi_no: "PI-0017",
    deposit_no: "DP-0017",
    pa_no: "PA-0017",
    release_no: "SR-0017",
    origin: "portal",
    stage: "02_quotation",
    deposit_status: "pending",
    balance_status: "pending",
    deposit_amount_frozen: false,
    lines: JSON.stringify([
      { sku: "first_press_750", cases: 20, unitFobUsd: 45, caseUsd: 540 },
      { sku: "first_press_200", cases: 20, unitFobUsd: 20, caseUsd: 480 },
    ]),
    subtotal_usd: 20400,
    deposit_due_usd: 10200,
    balance_due_usd: 10200,
    checklist: "{}",
    issued_docs: "{}",
    buyer_name: "Buyer",
    buyer_company: "Hajime Ltd.",
    territory: "Hong Kong",
  };
  const s = serializeExportOrder(row, { includeInternalEconomics: true });
  assert.equal(s.lines[0].caseUsd, 540);
  assert.equal(s.lines[0].lineTotalUsd, 10800);
  assert.equal(s.lines[1].caseUsd, 480);
  assert.equal(s.subtotalUsd, 20400);
});

test("priceExportLines without unit uses list FOB", () => {
  const q = priceExportLines([{ sku: "first_press_750", cases: 1 }]);
  assert.equal(q.lines[0].unitFobUsd, 34.1);
  assert.equal(q.subtotalUsd, 409.2);
});
