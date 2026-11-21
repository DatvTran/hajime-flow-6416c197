import test from "node:test";
import assert from "node:assert/strict";
import { createBoothFile, prepareBoothFile } from "../lib/expo-booth.mjs";
import { memoryDb } from "./_memory-db.mjs";

const buyer = {
  company: "Lotus Trading Ltd",
  contact: "Ana Lee",
  email: "Ana@Lotus.hk",
  country: "Singapore",
  city: "Singapore",
  address: "8 Jurong Port Road",
};

test("booth save rejects a missing company and an order with no cases", () => {
  const noCompany = prepareBoothFile({ ...buyer, company: "  ", lines: [{ sku: "first_press_750", cases: 1 }] });
  assert.equal(noCompany.ok, false);
  assert.ok(noCompany.errors.some((e) => /company/i.test(e)));

  const noCases = prepareBoothFile({ ...buyer, lines: [{ sku: "first_press_750", cases: 0 }] });
  assert.equal(noCases.ok, false);
  assert.ok(noCases.errors.some((e) => /at least one/i.test(e)));
});

test("expression and bottle format follow the SKUs that have cases", () => {
  const one = prepareBoothFile({ ...buyer, lines: [{ sku: "first_press_750", cases: 2 }] });
  assert.equal(one.ok, true);
  assert.equal(one.buyer.expression, "first_press");
  assert.equal(one.buyer.bottle_format, "750ml");
  assert.equal(one.buyer.business_type, "importer_distributor");
  assert.equal(one.buyer.job_title, "Buyer");

  const both = prepareBoothFile({
    ...buyer,
    lines: [
      { sku: "first_press_200", cases: 1 },
      { sku: "first_press_750", cases: 1 },
    ],
  });
  assert.equal(both.buyer.expression, "first_press");
  assert.equal(both.buyer.bottle_format, "both");
});

test("the booth rejects Second Bloom cases and ignores empty Second Bloom rows", () => {
  const sb = prepareBoothFile({ ...buyer, lines: [{ sku: "first_press_750", cases: 1 }, { sku: "yuzu_mint_750", cases: 2 }] });
  assert.equal(sb.ok, false);
  assert.match(sb.errors[0], /Second Bloom/);
  const empty = prepareBoothFile({ ...buyer, lines: [{ sku: "first_press_750", cases: 1 }, { sku: "yuzu_mint_200", cases: 0 }] });
  assert.equal(empty.ok, true);
  assert.deepEqual(empty.lines.map((l) => l.sku), ["first_press_750"]);
});

test("a typed unit price is kept and flagged below the floor", () => {
  const q = prepareBoothFile({
    ...buyer,
    lines: [{ sku: "first_press_750", cases: 2, unitFobUsd: 30 }],
  });
  assert.equal(q.ok, true);
  assert.equal(q.priced.lines[0].unitFobUsd, 30);
  assert.equal(q.priced.lines[0].belowFloor, true);
  assert.equal(q.order.depositStatus, "pending");
});

test("list prices split 50/50 and the deposit stays pending", () => {
  const q = prepareBoothFile({
    ...buyer,
    destination: "",
    importer: "Lotus Imports",
    buyerPo: "LT-1",
    lines: [{ sku: "first_press_750", cases: 40 }],
  });
  assert.equal(q.priced.lines[0].unitFobUsd, 34.1);
  assert.equal(q.priced.lines[0].belowFloor, false);
  assert.equal(Math.round((q.priced.depositDueUsd + q.priced.balanceDueUsd) * 100), Math.round(q.priced.subtotalUsd * 100));
  assert.equal(q.priced.depositDueUsd, q.priced.balanceDueUsd);
  assert.equal(q.order.depositStatus, "pending");
  assert.equal(q.order.destinationCountry, "Singapore");
  assert.equal(q.order.consignee, "Lotus Imports");
  assert.equal(q.order.buyerPoNo, "LT-1");
  assert.equal(q.order.buyerAddress, "8 Jurong Port Road\nSingapore");
  assert.equal(q.buyer.business_email, "ana@lotus.hk");
});

test("a booth save retried with the same submission key returns the first lead and order", async () => {
  const tables = { expo_leads: [], export_orders: [] };
  const db = memoryDb(tables);
  const body = {
    company: "Offline Co",
    contact: "Ana",
    email: "ana@offline.test",
    country: "HK",
    city: "HK",
    address: "1 St",
    submissionKey: "booth-3f9c2a7e-1",
    lines: [{ sku: "first_press_750", cases: 40 }],
  };
  const first = await createBoothFile(db, { tenantId: "t1", staffUserId: 1, body });
  const again = await createBoothFile(db, { tenantId: "t1", staffUserId: 1, body });
  assert.equal(tables.expo_leads.length, 1);
  assert.equal(tables.export_orders.length, 1);
  assert.equal(again.order.display_id, first.order.display_id);
  assert.equal(again.priced.depositDueUsd, first.priced.depositDueUsd);
  assert.equal(again.replayed, true);
  await createBoothFile(db, { tenantId: "t1", staffUserId: 1, body: { ...body, submissionKey: "booth-another-2" } });
  assert.equal(tables.export_orders.length, 2, "a new key is a new buyer");
  assert.equal(prepareBoothFile({ ...body, submissionKey: "bad key!" }).buyer.submission_key, undefined);
});
