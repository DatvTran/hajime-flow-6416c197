import test from "node:test";
import assert from "node:assert/strict";
import {
  findLiveOrderForLead,
  isExportLeadType,
  leadStarterLines,
  priceExportLines,
  TRIAL_ORDER_CASES,
} from "../lib/export-orders.mjs";
import { newOrderMonthFields } from "../lib/first-press-capacity.mjs";

const total = (lines) => lines.reduce((n, l) => n + l.cases, 0);

test("First Press with no bottle format starts at 40 cases of 750 ml", () => {
  assert.deepEqual(leadStarterLines({ expression: "first_press", bottle_format: null }), [
    { sku: "first_press_750", cases: 40 },
  ]);
  assert.deepEqual(leadStarterLines({}), [{ sku: "first_press_750", cases: 40 }]);
});

test("both formats split the trial order across First Press 750 and 200 ml", () => {
  assert.deepEqual(leadStarterLines({ expression: "both", bottle_format: "both" }), [
    { sku: "first_press_750", cases: 20 },
    { sku: "first_press_200", cases: 20 },
  ]);
});

test("a Second Bloom lead starts on First Press while Second Bloom is off the expo", () => {
  assert.deepEqual(leadStarterLines({ expression: "yuzu_mint", bottle_format: "200ml" }), [
    { sku: "first_press_200", cases: 40 },
  ]);
});

test("every combination totals one trial order and prices at list", () => {
  for (const expression of ["first_press", "yuzu_mint", "both", null]) {
    for (const bottle_format of ["750ml", "200ml", "both", null]) {
      const lines = leadStarterLines({ expression, bottle_format });
      assert.equal(total(lines), TRIAL_ORDER_CASES);
      const priced = priceExportLines(lines);
      assert.equal(priced.lines.length, lines.length, "every starter SKU is a real export SKU");
      assert.equal(priced.belowFloor, false);
    }
  }
});

test("importers, distributors, wholesale and duty free can open an export file", () => {
  for (const t of ["importer", "importer_distributor", "wholesale", "duty_free"]) assert.equal(isExportLeadType(t), true);
  for (const t of ["restaurant", "bar", "hotel", "retail", "retailer", "hospitality", "media", "other", null]) {
    assert.equal(isExportLeadType(t), false);
  }
});

test("the duplicate guard looks for a live order on the same lead and tenant", async () => {
  const calls = [];
  const live = { id: 9, display_id: "HX-0009", stage: "02_quotation" };
  const db = (table) => {
    calls.push(["table", table]);
    const q = {
      where: (w) => (calls.push(["where", w]), q),
      whereNot: (col, val) => (calls.push(["whereNot", col, val]), q),
      orderBy: () => q,
      first: async () => live,
    };
    return q;
  };
  const found = await findLiveOrderForLead(db, "t1", 42);
  assert.equal(found, live);
  assert.deepEqual(calls, [
    ["table", "export_orders"],
    ["where", { tenant_id: "t1", expo_lead_id: 42 }],
    ["whereNot", "stage", "cancelled"],
  ]);
});

test("opening a lead's file with a delivery month stores the month and its delivery window", () => {
  const now = new Date("2026-11-04T02:00:00Z");
  assert.deepEqual(newOrderMonthFields("2027-01", now), {
    fields: { requested_month: "2027-01", delivery_window: "Delivery in January 2027" },
  });
});

test("a past or current month is refused when opening a lead's file", () => {
  const now = new Date("2026-11-04T02:00:00Z");
  for (const m of ["2026-11", "2026-10", "2027-13", "soon"]) {
    assert.equal(newOrderMonthFields(m, now).error, "Pick a delivery month from next month onwards.");
  }
});

test("no delivery month leaves the new order as before", () => {
  for (const m of [undefined, null, "", "  "]) assert.deepEqual(newOrderMonthFields(m), { fields: {} });
});
