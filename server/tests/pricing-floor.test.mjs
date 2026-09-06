import test from "node:test";
import assert from "node:assert/strict";
import { assertAboveFloor } from "../services/pricing.mjs";

test("below floor requires exception", () => {
  const resolved = { internalFloorCase: 336 };
  assert.equal(assertAboveFloor(resolved, 384).ok, true);
  const fail = assertAboveFloor(resolved, 300, null);
  assert.equal(fail.ok, false);
  assert.equal(fail.code, "BELOW_INTERNAL_FLOOR");
  assert.equal(assertAboveFloor(resolved, 300, { kind: "below_floor_approved" }).ok, true);
});
