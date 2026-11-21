import test from "node:test";
import assert from "node:assert/strict";
import {
  FIRST_PRESS_MONTHLY_ML,
  capacityShortfall,
  capacitySummary,
  firstPressMl,
  firstPressUsedMl,
  addMonths,
  capacityByMonth,
  deliveryMonthOptions,
  hktMonth,
  isBookableDeliveryMonth,
  orderCapacityMonth,
  productionMonth,
} from "../lib/first-press-capacity.mjs";
import { hashSignToken } from "../lib/po-acceptance.mjs";
import { countersignPoa } from "../services/po-acceptance.mjs";
import { memoryDb } from "./_memory-db.mjs";

delete process.env.RESEND_API_KEY;
import { prepareBoothFile } from "../lib/expo-booth.mjs";
import { TRANSITIONS } from "../services/export-order-transitions.mjs";

test("7,500 L a month is 833 cases of 750 ml or 1,562 of 200 ml", () => {
  assert.equal(FIRST_PRESS_MONTHLY_ML, 10_000 * 750);
  const s = capacitySummary(0, "2026-11");
  assert.equal(s.capacityLitres, 7500);
  assert.equal(s.leftCases750, 833);
  assert.equal(s.leftCases200, 1562);
});

test("both sizes draw on the same litres and Second Bloom doesn't count", () => {
  assert.equal(
    firstPressMl([
      { sku: "first_press_750", cases: 10 },
      { sku: "first_press_200", cases: 10 },
      { sku: "yuzu_mint_750", cases: 50 },
    ]),
    90_000 + 48_000,
  );
  assert.equal(firstPressMl(JSON.stringify([{ sku: "first_press_750", cases: 2 }])), 18_000);
});

test("months run on Hong Kong time", () => {
  assert.equal(hktMonth("2026-11-30T15:59:00Z"), "2026-11");
  assert.equal(hktMonth("2026-11-30T16:00:00Z"), "2026-12");
});

test("an order that fits passes; one over what's left is blocked with the numbers", () => {
  assert.equal(capacityShortfall(833 * 9_000, 0), null);
  assert.equal(capacityShortfall(0, FIRST_PRESS_MONTHLY_ML), null);
  const msg = capacityShortfall(834 * 9_000, 0);
  assert.match(msg, /Not enough First Press capacity this month/);
  assert.match(msg, /7,506 L/);
  assert.match(msg, /833 cases of 750 ml/);
});

function ordersDb(rows) {
  const db = () => {
    const q = { where: () => q, whereNot: () => q, select: async () => rows };
    return q;
  };
  db.schema = { hasTable: async () => true };
  return db;
}

test("only this month's production authorizations count, not cancelled or other months", async () => {
  const auth = (issuedAt) => JSON.stringify({ production_auth: { issuedAt } });
  const rows = [
    { id: 1, lines: [{ sku: "first_press_750", cases: 400 }], issued_docs: auth("2026-11-05T02:00:00Z") },
    { id: 2, lines: [{ sku: "first_press_200", cases: 100 }], issued_docs: auth("2026-10-20T02:00:00Z") },
    { id: 3, lines: [{ sku: "first_press_750", cases: 100 }], issued_docs: "{}" },
    { id: 4, lines: [{ sku: "first_press_750", cases: 50 }], issued_docs: auth("2026-11-06T02:00:00Z") },
  ];
  assert.equal(await firstPressUsedMl(ordersDb(rows), "t1", "2026-11"), 450 * 9_000);
  assert.equal(await firstPressUsedMl(ordersDb(rows), "t1", "2026-11", { excludeOrderId: 4 }), 400 * 9_000);
});

test("production authorization is blocked when the month is full", async () => {
  const now = new Date().toISOString();
  const full = [{ id: 1, lines: [{ sku: "first_press_750", cases: 800 }], issued_docs: JSON.stringify({ production_auth: { issuedAt: now } }) }];
  const trx = (name) => {
    const q = {
      where: () => q,
      whereNot: () => q,
      orderBy: async () => [],
      select: async () => (name === "export_orders" ? full : []),
    };
    return q;
  };
  trx.schema = { hasTable: async (name) => name !== "export_payments" };
  const order = {
    id: 9,
    manufacturer_name: "Distillery",
    deposit_status: "cleared",
    deposit_due_usd: 100,
    deposit_received_usd: 100,
    lines: JSON.stringify([{ sku: "first_press_750", cases: 40 }]),
  };
  const r = await TRANSITIONS.authorize_production.guard({ trx, tenantId: "t1", order });
  assert.equal(r.ok, false);
  assert.match(r.code, /Not enough First Press capacity/);
  const fits = await TRANSITIONS.authorize_production.guard({
    trx,
    tenantId: "t1",
    order: { ...order, lines: JSON.stringify([{ sku: "first_press_750", cases: 33 }]) },
  });
  assert.equal(fits.ok, true, JSON.stringify(fits));
});

test("the booth refuses a quote larger than one month of production", () => {
  const buyer = { company: "Co", contact: "A", email: "a@co.test", country: "HK", city: "HK", address: "1 St" };
  const over = prepareBoothFile({ ...buyer, lines: [{ sku: "first_press_750", cases: 834 }] });
  assert.equal(over.ok, false);
  assert.match(over.errors.join(" "), /needs 7,506 L of First Press, more than one month of production \(7,500 L\)/);
  const mixed = prepareBoothFile({ ...buyer, lines: [{ sku: "first_press_750", cases: 400 }, { sku: "first_press_200", cases: 812 }] });
  assert.equal(mixed.ok, true, "400 × 9 L + 812 × 4.8 L = 7,497.6 L fits");
  const mixedOver = prepareBoothFile({ ...buyer, lines: [{ sku: "first_press_750", cases: 400 }, { sku: "first_press_200", cases: 813 }] });
  assert.equal(mixedOver.ok, false, "7,502.4 L is over");
  assert.equal(prepareBoothFile({ ...buyer, lines: [{ sku: "first_press_750", cases: 833 }] }).ok, true);
});

test("production runs the month before delivery, across the year end", () => {
  assert.equal(productionMonth("2027-01"), "2026-12");
  assert.equal(productionMonth("2026-12"), "2026-11");
  assert.equal(productionMonth("Jan"), null);
  assert.equal(addMonths("2026-12", 1), "2027-01");
  const dec31 = new Date("2026-12-31T15:00:00Z");
  assert.deepEqual(deliveryMonthOptions(dec31, 3), ["2027-01", "2027-02", "2027-03"]);
  assert.deepEqual(deliveryMonthOptions(new Date("2026-12-31T16:00:00Z"), 1), ["2027-02"], "already January in Hong Kong");
  assert.equal(isBookableDeliveryMonth("2026-12", dec31), false);
  assert.equal(isBookableDeliveryMonth("2027-01", dec31), true);
});

test("reserved orders count in their production month, older authorizations by date, cancelled not at all", () => {
  const auth = JSON.stringify({ production_auth: { issuedAt: "2026-11-05T02:00:00Z" } });
  assert.equal(orderCapacityMonth({ requested_month: "2027-01", capacity_reserved_at: new Date() }), "2026-12");
  assert.equal(orderCapacityMonth({ requested_month: "2027-01", capacity_reserved_at: null }), null, "a month alone holds nothing");
  assert.equal(orderCapacityMonth({ issued_docs: auth }), "2026-11");
  assert.equal(
    orderCapacityMonth({ issued_docs: auth, requested_month: "2027-01", capacity_reserved_at: new Date() }),
    "2026-12",
    "the reservation wins over the authorization date",
  );
  assert.equal(orderCapacityMonth({ stage: "cancelled", requested_month: "2027-01", capacity_reserved_at: new Date() }), null);
});

function reserved(id, cases, month, extra = {}) {
  return {
    id,
    tenant_id: "t1",
    stage: "05_proforma",
    lines: JSON.stringify([{ sku: "first_press_750", cases }]),
    issued_docs: "{}",
    requested_month: month,
    capacity_reserved_at: new Date(),
    ...extra,
  };
}

test("each delivery month shows the litres left in the month before it", async () => {
  const db = memoryDb({
    export_orders: [
      reserved(1, 500, "2027-01"),
      reserved(2, 100, "2027-02", { stage: "cancelled" }),
      { ...reserved(3, 200, "2027-02"), capacity_reserved_at: null },
    ],
  });
  const months = await capacityByMonth(db, "t1", { now: new Date("2026-12-10T00:00:00Z"), months: 2 });
  assert.deepEqual(
    months.map((m) => [m.deliveryMonth, m.productionMonth, m.leftLitres]),
    [
      ["2027-01", "2026-12", 3000],
      ["2027-02", "2027-01", 7500],
    ],
  );
  const without = await capacityByMonth(db, "t1", { now: new Date("2026-12-10T00:00:00Z"), months: 1, excludeOrderId: 1 });
  assert.equal(without[0].leftLitres, 7500);
});

const NEXT = addMonths(hktMonth(new Date()), 1);
const ready = {
  id: 9,
  tenant_id: "t1",
  stage: "03_buyer_po",
  incoterm_rule: "FOB",
  fob_named_point: "Kobe",
  delivery_window: "Delivery in month",
  buyer_email: "a@b.co",
  lines: JSON.stringify([{ sku: "first_press_750", cases: 40 }]),
  issued_docs: "{}",
  requested_month: NEXT,
  capacity_reserved_at: null,
};

test("the PO acceptance can't be issued for a month without room", async () => {
  const guard = (rows, order = ready) =>
    TRANSITIONS.accept_po.guard({ trx: memoryDb({ export_orders: rows }), tenantId: "t1", order, payload: { sellerTitle: "Director" } });
  const full = await guard([reserved(1, 800, NEXT)]);
  assert.equal(full.ok, false);
  assert.equal(full.capacityFull, true);
  assert.match(full.code, /Not enough First Press capacity for production/);
  assert.equal((await guard([reserved(1, 793, NEXT)])).ok, true, "793 + 40 = 833 cases fits");
  assert.equal((await guard([reserved(1, 800, addMonths(NEXT, 1))])).ok, true, "another month is untouched");
  const noMonth = await guard([], { ...ready, requested_month: null });
  assert.equal(noMonth.ok, false);
  assert.match(noMonth.code, /requested delivery month/);
  assert.equal(
    (await guard([reserved(1, 800, NEXT)], { ...ready, capacity_reserved_at: new Date() })).ok,
    true,
    "a reserved order re-issues without counting against itself",
  );
});

const TOKEN = "p".repeat(43);
function poaTables(others) {
  return {
    export_documents: [
      {
        id: 1,
        tenant_id: "t1",
        export_order_id: 9,
        doc_type: "po_acceptance",
        doc_number: "HJ-POA-2026-0001",
        revision: 1,
        sign_token_hash: hashSignToken(TOKEN),
        sign_token_expires_at: new Date(Date.now() + 86400000),
        issued_at: new Date(),
        payload: "{}",
      },
    ],
    export_orders: [{ ...ready, stage: "04_po_acceptance", display_id: "HX-0009" }, ...others],
    export_order_events: [],
  };
}
const countersigner = {
  legalName: "Buyer Co Ltd",
  registrationNo: "N/A",
  registeredAddress: "1 Main St",
  noticeEmail: "legal@buyer.co",
  signatoryName: "Ana Lee",
  signatoryTitle: "Director",
  authority: true,
};

async function quietly(fn) {
  const log = console.log;
  console.log = () => {};
  try {
    return await fn();
  } finally {
    console.log = log;
  }
}

test("countersigning reserves the litres, so the month fills up for the next order", async () => {
  const tables = poaTables([reserved(1, 700, NEXT)]);
  await quietly(() => countersignPoa(memoryDb(tables), TOKEN, countersigner, {}));
  const order = tables.export_orders[0];
  assert.ok(order.capacity_reserved_at instanceof Date);
  const [month] = await capacityByMonth(memoryDb(tables), "t1", { months: 1 });
  assert.equal(month.leftLitres, 7500 - 740 * 9);
});

test("countersigning is refused if the month filled up after the PO acceptance went out", async () => {
  const tables = poaTables([reserved(1, 800, NEXT)]);
  await assert.rejects(
    quietly(() => countersignPoa(memoryDb(tables), TOKEN, countersigner, {})),
    (err) => err.status === 409 && err.payload?.code === "CAPACITY_FULL",
  );
  assert.equal(tables.export_orders[0].capacity_reserved_at, null);
  assert.equal(tables.export_documents[0].buyer_signed_at, undefined);
});

test("cancelling a reserved order gives its litres back", async () => {
  const rows = [reserved(1, 800, NEXT)];
  const db = memoryDb({ export_orders: rows });
  assert.equal((await capacityByMonth(db, "t1", { months: 1 }))[0].leftLitres, 300);
  rows[0].stage = "cancelled";
  assert.equal((await capacityByMonth(db, "t1", { months: 1 }))[0].leftLitres, 7500);
});

test("production authorization skips the monthly check once litres are reserved", async () => {
  const now = new Date().toISOString();
  const trx = memoryDb({
    export_orders: [{ id: 1, tenant_id: "t1", stage: "06_production", lines: JSON.stringify([{ sku: "first_press_750", cases: 833 }]), issued_docs: JSON.stringify({ production_auth: { issuedAt: now } }) }],
    export_order_events: [],
  });
  const order = {
    id: 9,
    manufacturer_name: "Distillery",
    deposit_status: "cleared",
    deposit_due_usd: 100,
    deposit_received_usd: 100,
    lines: JSON.stringify([{ sku: "first_press_750", cases: 40 }]),
  };
  const r = await TRANSITIONS.authorize_production.guard({ trx, tenantId: "t1", order: { ...order, capacity_reserved_at: new Date() } });
  assert.equal(r.ok, true, JSON.stringify(r));
});
