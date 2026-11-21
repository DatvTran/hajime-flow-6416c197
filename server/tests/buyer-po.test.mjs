import test from "node:test";
import assert from "node:assert/strict";
import { hashSignToken, validateBuyerPoSign } from "../lib/po-acceptance.mjs";
import { TRANSITIONS } from "../services/export-order-transitions.mjs";
import { loadBuyerPoForSigning, signBuyerPo } from "../services/buyer-po.mjs";
import { addMonths, hktMonth, monthLabel } from "../lib/first-press-capacity.mjs";
import { memoryDb } from "./_memory-db.mjs";

delete process.env.RESEND_API_KEY;

/** Knex stand-in for guards: no price list tables, no exception events. */
function guardTrx() {
  const trx = () => {
    const q = { where: () => q, orderBy: () => Promise.resolve([]) };
    return q;
  };
  trx.schema = { hasTable: async (name) => name === "export_order_events" };
  return trx;
}

const TOKEN = "t".repeat(43);
const NEXT_MONTH = addMonths(hktMonth(new Date()), 1);
const future = new Date(Date.now() + 86400000);

function fixture({ stage = "02_quotation", doc = {}, order = {}, others = [] } = {}) {
  return {
    export_documents: [
      {
        id: 1,
        tenant_id: "t1",
        export_order_id: 7,
        doc_type: "buyer_po",
        doc_number: "HJ-BPO-2026-0001",
        revision: 1,
        sign_token_hash: hashSignToken(TOKEN),
        sign_token_expires_at: future,
        seller_notice_email: "hq@hajime.jp",
        payload: "{}",
        ...doc,
      },
    ],
    export_orders: [
      {
        id: 7,
        tenant_id: "t1",
        display_id: "HX-0007",
        stage,
        buyer_email: "buyer@co.test",
        buyer_po_no: null,
        lines: JSON.stringify([{ sku: "first_press_750", cases: 40 }]),
        issued_docs: "{}",
        delivery_window: "",
        requested_month: null,
        capacity_reserved_at: null,
        ...order,
      },
      ...others,
    ],
    export_order_events: [],
  };
}

const signer = {
  legalName: "Buyer Co Ltd",
  registrationNo: "N/A",
  registeredAddress: "1 Main St",
  noticeEmail: "legal@buyer.co",
  signatoryName: "Ana Lee",
  signatoryTitle: "Director",
  priceInitials: "AL",
  requestedMonth: NEXT_MONTH,
  authority: true,
};

/** Another tenant order already holding `cases` of 750 ml for delivery in `month`. */
function reservedOrder(id, cases, month = NEXT_MONTH) {
  return {
    id,
    tenant_id: "t1",
    stage: "05_proforma",
    lines: JSON.stringify([{ sku: "first_press_750", cases }]),
    issued_docs: "{}",
    requested_month: month,
    capacity_reserved_at: new Date(),
  };
}

const quotedOrder = {
  id: 7,
  stage: "02_quotation",
  lines: JSON.stringify([{ sku: "first_press_750", cases: 40 }]),
  issued_docs: JSON.stringify({ quotation: { issuedAt: "2026-11-03" } }),
  buyer_email: "buyer@co.test",
};

test("issue_buyer_po needs an issued quotation and a buyer email", async () => {
  assert.deepEqual(TRANSITIONS.issue_buyer_po.from, ["02_quotation"]);
  const notQuoted = await TRANSITIONS.issue_buyer_po.guard({
    trx: guardTrx(),
    tenantId: "t1",
    order: { ...quotedOrder, issued_docs: "{}" },
  });
  assert.equal(notQuoted.ok, false);
  assert.match(notQuoted.code, /quotation/);
  const noEmail = await TRANSITIONS.issue_buyer_po.guard({
    trx: guardTrx(),
    tenantId: "t1",
    order: { ...quotedOrder, buyer_email: "" },
  });
  assert.equal(noEmail.ok, false);
  assert.match(noEmail.code, /email/);
  const ok = await TRANSITIONS.issue_buyer_po.guard({ trx: guardTrx(), tenantId: "t1", order: quotedOrder });
  assert.equal(ok.ok, true);
});

test("issue_buyer_po blocks a below-floor price without approval", async () => {
  const r = await TRANSITIONS.issue_buyer_po.guard({
    trx: guardTrx(),
    tenantId: "t1",
    order: { ...quotedOrder, lines: JSON.stringify([{ sku: "first_press_750", cases: 2, unitFobUsd: 30 }]) },
  });
  assert.equal(r.ok, false);
  assert.equal(r.code, "BELOW_INTERNAL_FLOOR");
});

test("the buyer's PO reference is optional and capped", () => {
  assert.equal(validateBuyerPoSign(signer).value.buyerPoRef, "");
  assert.equal(validateBuyerPoSign({ ...signer, buyerPoRef: ` ${"x".repeat(80)} ` }).value.buyerPoRef.length, 64);
  assert.equal(validateBuyerPoSign({ ...signer, authority: false }).ok, false);
});

test("the buyer must initial the agreed prices", () => {
  const missing = validateBuyerPoSign({ ...signer, priceInitials: "  " });
  assert.equal(missing.ok, false);
  assert.ok(missing.errors.priceInitials);
  assert.equal(validateBuyerPoSign({ ...signer, priceInitials: "x".repeat(30) }).value.priceInitials.length, 12);
});

test("signing with no reference records the HJ-BPO number and moves the file to Buyer PO", async () => {
  const tables = fixture();
  const view = await signBuyerPo(memoryDb(tables), TOKEN, signer, { ip: "1.2.3.4", userAgent: "test" });
  const order = tables.export_orders[0];
  assert.equal(order.buyer_po_no, "HJ-BPO-2026-0001");
  assert.equal(order.stage, "03_buyer_po");
  assert.equal(order.next_action, "Issue PO acceptance");
  assert.equal(order.buyer_legal_name, "Buyer Co Ltd");
  assert.equal(view.status, "signed");
  assert.equal(view.buyerSignature.name, "Ana Lee");
  assert.equal(tables.export_order_events[0].event_type, "buyer_signed_po");
  assert.equal(order.requested_month, NEXT_MONTH);
  assert.equal(order.delivery_window, `Delivery in ${monthLabel(NEXT_MONTH)}`);
  assert.equal(order.capacity_reserved_at, null, "signing the buyer PO does not reserve litres");
  assert.equal(JSON.parse(tables.export_documents[0].buyer_details).requestedMonth, NEXT_MONTH);
});

test("the buyer must pick a delivery month from next month on", async () => {
  assert.ok(validateBuyerPoSign({ ...signer, requestedMonth: "" }).errors.requestedMonth);
  await assert.rejects(
    signBuyerPo(memoryDb(fixture()), TOKEN, { ...signer, requestedMonth: hktMonth(new Date()) }, {}),
    (err) => Boolean(err.payload?.fields?.requestedMonth),
  );
});

test("a month without room for the order is refused and offered as unavailable", async () => {
  const tables = fixture({ others: [reservedOrder(8, 800)] });
  const view = await loadBuyerPoForSigning(memoryDb(tables), TOKEN);
  assert.deepEqual(view.deliveryMonths[0], { month: NEXT_MONTH, available: false });
  assert.equal(view.deliveryMonths[1].available, true);
  await assert.rejects(
    signBuyerPo(memoryDb(tables), TOKEN, signer, {}),
    (err) => err.payload?.code === "CAPACITY_FULL" && Boolean(err.payload.fields.requestedMonth),
  );
  assert.equal(tables.export_documents[0].buyer_signed_at, undefined);
  tables.export_orders[0].requested_month = NEXT_MONTH;
  tables.export_orders[0].delivery_window = `Delivery in ${monthLabel(NEXT_MONTH)}`;
  await signBuyerPo(memoryDb(tables), TOKEN, { ...signer, requestedMonth: addMonths(NEXT_MONTH, 1) }, {});
  assert.equal(tables.export_orders[0].requested_month, addMonths(NEXT_MONTH, 1));
  assert.equal(tables.export_orders[0].delivery_window, `Delivery in ${monthLabel(addMonths(NEXT_MONTH, 1))}`, "the booth's text follows the month");
});

test("a delivery window HQ typed is kept when the buyer picks a month", async () => {
  const tables = fixture({ order: { delivery_window: "8 weeks from deposit", requested_month: NEXT_MONTH } });
  await signBuyerPo(memoryDb(tables), TOKEN, { ...signer, requestedMonth: addMonths(NEXT_MONTH, 1) }, {});
  assert.equal(tables.export_orders[0].delivery_window, "8 weeks from deposit");
});

test("signing again after a reservation keeps the reserved month", async () => {
  const later = addMonths(NEXT_MONTH, 2);
  const tables = fixture({ order: { requested_month: later, capacity_reserved_at: new Date() } });
  await signBuyerPo(memoryDb(tables), TOKEN, signer, {});
  assert.equal(tables.export_orders[0].requested_month, later);
});

test("signing with the buyer's own reference records that reference", async () => {
  const tables = fixture();
  await signBuyerPo(memoryDb(tables), TOKEN, { ...signer, buyerPoRef: "ACME-PO-881" }, {});
  assert.equal(tables.export_orders[0].buyer_po_no, "ACME-PO-881");
});

test("signing after the file has moved on records the PO without changing the stage", async () => {
  const tables = fixture({ stage: "04_po_acceptance" });
  await signBuyerPo(memoryDb(tables), TOKEN, signer, {});
  assert.equal(tables.export_orders[0].stage, "04_po_acceptance");
});

test("a signed, replaced or expired PO cannot be signed", async () => {
  const cases = [
    [{ buyer_signed_at: new Date() }, "ALREADY_SIGNED"],
    [{ superseded_by: 2 }, "REPLACED"],
    [{ sign_token_expires_at: new Date(Date.now() - 1000) }, "EXPIRED"],
  ];
  for (const [doc, code] of cases) {
    await assert.rejects(signBuyerPo(memoryDb(fixture({ doc })), TOKEN, signer, {}), (err) => err.payload?.code === code);
  }
  await assert.rejects(signBuyerPo(memoryDb(fixture({ stage: "cancelled" })), TOKEN, signer, {}), /no longer open/);
});

test("a wrong token is rejected", async () => {
  await assert.rejects(signBuyerPo(memoryDb(fixture()), "x".repeat(43), signer, {}), /not valid/);
});

test("signing emails the signed PDF to the buyer and to HQ", async () => {
  const tables = fixture({
    doc: { payload: JSON.stringify({ quoteNo: "Q-0007", totalOrderUsd: 16368, lines: [{ sku: "first_press_750", cases: 40, unitFobUsd: 34.1, lineTotalUsd: 16368 }] }) },
  });
  const logged = [];
  const log = console.log;
  console.log = (...a) => logged.push(a.join(" "));
  try {
    await signBuyerPo(memoryDb(tables), TOKEN, signer, { ip: "1.2.3.4", userAgent: "test" });
  } finally {
    console.log = log;
  }
  const out = logged.join("\n");
  assert.match(out, /To: legal@buyer\.co/);
  assert.match(out, /To: hq@hajime\.jp/);
  assert.match(out, /Prices agreed and initialled "AL": order total US\$16,368\.00/);
  assert.match(out, new RegExp(`Requested delivery: ${monthLabel(NEXT_MONTH)}\\.`));
  assert.equal(JSON.parse(tables.export_documents[0].buyer_details).priceInitials, "AL");
  assert.equal(out.match(/Attachment: HJ-BPO-2026-0001-signed\.pdf \(\d+ bytes\)/g)?.length, 2);
});

test("the signed PO renders as a one-page PDF", async () => {
  const { renderBuyerPoPdf, buyerPoPdfModel } = await import("../services/buyer-po-pdf.mjs");
  const doc = {
    ...fixture().export_documents[0],
    issued_at: new Date(),
    buyer_signed_name: "Ana Lee",
    buyer_signed_title: "Director",
    buyer_signed_at: new Date(),
    buyer_details: JSON.stringify({ legalName: "Buyer Co Ltd", buyerPoRef: "BC-1", priceInitials: "AL", requestedMonth: "2027-01" }),
    payload: JSON.stringify({ lines: [{ sku: "yuzu_mint_200", cases: 5, unitFobUsd: 18, lineTotalUsd: 2160 }, { sku: "first_press_750", cases: 0 }] }),
  };
  const m = buyerPoPdfModel(doc);
  assert.equal(m.rows.length, 1);
  assert.equal(m.rows[0].bottles, 120);
  assert.equal(m.buyerPoRef, "BC-1");
  assert.equal(m.signer, "Ana Lee, Director");
  assert.equal(m.priceInitials, "AL");
  assert.equal(m.requestedDelivery, "January 2027");
  const pdf = await renderBuyerPoPdf(doc);
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  assert.equal(pdf.toString("latin1").match(/\/Type \/Page[^s]/g).length, 1);
});
