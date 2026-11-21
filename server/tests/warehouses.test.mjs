import test from "node:test";
import assert from "node:assert/strict";
import {
  canDistributorSelectWarehouse,
  distributorAlreadyHasReceivingWarehouse,
  distributorPrimaryWarehouseIsStale,
  filterWarehouseOptionsForDistributor,
  normalizeWarehouseKind,
  warehouseIsActive,
} from "../lib/warehouses.mjs";

test("normalizeWarehouseKind accepts brand and distributor", () => {
  assert.equal(normalizeWarehouseKind("brand"), "brand");
  assert.equal(normalizeWarehouseKind("DISTRIBUTOR"), "distributor");
  assert.equal(normalizeWarehouseKind("nope"), "brand");
  assert.equal(normalizeWarehouseKind(null, "distributor"), "distributor");
});

test("distributorAlreadyHasReceivingWarehouse detects active primary or CRM link", () => {
  const member = { id: "tm-1", primary_warehouse_id: null };
  assert.equal(distributorAlreadyHasReceivingWarehouse(member, []), false);
  assert.equal(
    distributorAlreadyHasReceivingWarehouse(
      { ...member, primary_warehouse_id: "wh-a" },
      [{ id: "wh-a", is_active: true }],
    ),
    true,
  );
  // Orphan primary after demo delete — does not count
  assert.equal(
    distributorAlreadyHasReceivingWarehouse(
      { ...member, primary_warehouse_id: "wh-gone" },
      [],
    ),
    false,
  );
  assert.equal(
    distributorAlreadyHasReceivingWarehouse(
      { ...member, primary_warehouse_id: "wh-off" },
      [{ id: "wh-off", is_active: false }],
    ),
    false,
  );
  assert.equal(
    distributorAlreadyHasReceivingWarehouse(member, [
      { id: "wh-b", linked_team_member_id: "tm-1", is_active: true },
    ]),
    true,
  );
  assert.equal(
    distributorAlreadyHasReceivingWarehouse(member, [
      { id: "wh-c", linked_team_member_id: "tm-other", is_active: true },
    ]),
    false,
  );
});

test("warehouseIsActive requires explicit true", () => {
  assert.equal(warehouseIsActive({ is_active: true }), true);
  assert.equal(warehouseIsActive({ is_active: false }), false);
  assert.equal(warehouseIsActive({ is_active: null }), false);
  assert.equal(warehouseIsActive({}), false);
});

test("distributorPrimaryWarehouseIsStale detects orphan or inactive primary", () => {
  assert.equal(distributorPrimaryWarehouseIsStale({ primary_warehouse_id: null }, []), false);
  assert.equal(
    distributorPrimaryWarehouseIsStale({ primary_warehouse_id: "wh-gone" }, []),
    true,
  );
  assert.equal(
    distributorPrimaryWarehouseIsStale(
      { primary_warehouse_id: "wh-off" },
      [{ id: "wh-off", is_active: false }],
    ),
    true,
  );
  assert.equal(
    distributorPrimaryWarehouseIsStale(
      { primary_warehouse_id: "wh-null" },
      [{ id: "wh-null", is_active: null }],
    ),
    true,
  );
  assert.equal(
    distributorPrimaryWarehouseIsStale(
      { primary_warehouse_id: "wh-ok" },
      [{ id: "wh-ok", is_active: true }],
    ),
    false,
  );
});

test("null-active linked warehouse does not block create-if-none", () => {
  const member = { id: "tm-1", primary_warehouse_id: "wh-ghost" };
  assert.equal(
    distributorAlreadyHasReceivingWarehouse(member, [
      { id: "wh-ghost", is_active: null, linked_team_member_id: "tm-1" },
    ]),
    false,
  );
  assert.equal(
    filterWarehouseOptionsForDistributor(
      [{ id: "wh-ghost", is_active: null, linked_team_member_id: "tm-1", kind: "distributor" }],
      member,
    ).length,
    0,
  );
});

test("filterWarehouseOptionsForDistributor scopes out brand pool and other partner DCs", () => {
  const member = {
    id: "tm-metro",
    primary_warehouse_id: null,
    linked_account_id: "acc-metro",
  };
  const rows = [
    { id: "wh-brand", name: "Toronto", kind: "brand", is_active: true },
    {
      id: "wh-mine",
      name: "Metro DC",
      kind: "distributor",
      is_active: true,
      linked_team_member_id: "tm-metro",
    },
    {
      id: "wh-acct",
      name: "Metro Linked Acc",
      kind: "distributor",
      is_active: true,
      linked_account_id: "acc-metro",
    },
    {
      id: "wh-other",
      name: "Rival DC",
      kind: "distributor",
      is_active: true,
      linked_team_member_id: "tm-rival",
    },
    { id: "wh-off", name: "Inactive Brand", kind: "brand", is_active: false },
  ];
  const scoped = filterWarehouseOptionsForDistributor(rows, member);
  const ids = scoped.map((w) => w.id).sort();
  assert.deepEqual(ids, ["wh-acct", "wh-mine"]);
});

test("filter includes current primary even if otherwise out of scope", () => {
  const member = {
    id: "tm-1",
    primary_warehouse_id: "wh-legacy",
    linked_account_id: null,
  };
  const rows = [
    {
      id: "wh-legacy",
      name: "Legacy",
      kind: "distributor",
      is_active: true,
      linked_team_member_id: "tm-someone-else",
    },
  ];
  const scoped = filterWarehouseOptionsForDistributor(rows, member);
  assert.equal(scoped.length, 1);
  assert.equal(scoped[0].id, "wh-legacy");
});

test("canDistributorSelectWarehouse blocks brand pool and other partner DCs", () => {
  const member = { id: "tm-1", primary_warehouse_id: null };
  assert.equal(
    canDistributorSelectWarehouse(
      { id: "wh-brand", kind: "brand", is_active: true },
      member,
    ),
    false,
  );
  assert.equal(
    canDistributorSelectWarehouse(
      {
        id: "wh-mine",
        kind: "distributor",
        is_active: true,
        linked_team_member_id: "tm-1",
      },
      member,
    ),
    true,
  );
  assert.equal(
    canDistributorSelectWarehouse(
      {
        id: "wh-other",
        kind: "distributor",
        is_active: true,
        linked_team_member_id: "tm-2",
      },
      member,
    ),
    false,
  );
  assert.equal(
    canDistributorSelectWarehouse(
      { id: "wh-off", kind: "brand", is_active: false },
      member,
    ),
    false,
  );
});
