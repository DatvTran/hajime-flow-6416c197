import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TRANSITIONS } from "../services/export-order-transitions.mjs";
import { floorLinesKey, latestException } from "../services/export-order-gates.mjs";

/** Minimal knex stand-in: no price list tables, and the given exception events newest first. */
function fakeTrx(events = []) {
  const trx = () => {
    const q = {
      where: () => q,
      orderBy: () => Promise.resolve(events.map((detail) => ({ detail: JSON.stringify(detail) }))),
    };
    return q;
  };
  trx.schema = { hasTable: async (name) => name === "export_order_events" };
  return trx;
}

const belowFloor = [{ sku: "first_press_750", cases: 2, unitFobUsd: 30 }];
const order = (lines) => ({ id: 7, stage: "02_quotation", lines: JSON.stringify(lines) });

test("a below-floor quotation is blocked without an approval", async () => {
  const r = await TRANSITIONS.issue_quotation.guard({ trx: fakeTrx(), tenantId: "t", order: order(belowFloor) });
  assert.equal(r.ok, false);
  assert.equal(r.code, "BELOW_INTERNAL_FLOOR");
});

test("a matching below-floor approval lets the quotation issue", async () => {
  const approval = { kind: "below_floor_approved", reason: "Expo trial", lines: floorLinesKey(belowFloor) };
  const r = await TRANSITIONS.issue_quotation.guard({
    trx: fakeTrx([{ kind: "deposit_waived" }, approval]),
    tenantId: "t",
    order: order(belowFloor),
  });
  assert.equal(r.ok, true);
  const again = await TRANSITIONS.requote.guard({ trx: fakeTrx([approval]), tenantId: "t", order: order(belowFloor) });
  assert.equal(again.ok, true);
});

test("changing the price or cases after approval blocks it again", async () => {
  const approval = { kind: "below_floor_approved", reason: "Expo trial", lines: floorLinesKey(belowFloor) };
  for (const changed of [
    [{ sku: "first_press_750", cases: 2, unitFobUsd: 25 }],
    [{ sku: "first_press_750", cases: 5, unitFobUsd: 30 }],
  ]) {
    const r = await TRANSITIONS.issue_quotation.guard({ trx: fakeTrx([approval]), tenantId: "t", order: order(changed) });
    assert.equal(r.ok, false);
    assert.equal(r.code, "BELOW_INTERNAL_FLOOR");
  }
});

test("a floor approval does not hide an earlier payment exception", async () => {
  const ex = await latestException(
    fakeTrx([{ kind: "below_floor_approved", lines: "x" }, { kind: "deposit_waived", reason: "HQ" }]),
    "t",
    7,
  );
  assert.equal(ex.kind, "deposit_waived");
});

test("the quotation no longer mentions volume tiers", () => {
  const src = readFileSync(new URL("../../src/components/export/ExportOrderDocView.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(src, /Volume bands|750 ml tiers/);
  assert.match(src, /No volume\s+discount/);
});
