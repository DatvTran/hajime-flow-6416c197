/**
 * Warehouse directory helpers: brand vs wholesaler receiving depots.
 *
 * Note: isolated distributor DBs only auto-migrate through 027, so newer
 * warehouse columns (e.g. kind) and demo cleanup must be applied at request time.
 */

export const WAREHOUSE_KINDS = Object.freeze(["brand", "distributor"]);

export const DEMO_WAREHOUSE_NAMES = Object.freeze([
  "toronto main",
  "toronto main warehouse",
  "toronto lcbo warehouse",
  "milan depot",
  "milan dc",
  "production",
  "paris hub",
  "nyc warehouse",
]);

/**
 * Ensure warehouses.kind exists and remove seeded demo locations.
 * Safe to call on every request against platform or distributor DBs.
 *
 * @param {import('knex').Knex} db
 * @param {string} [tenantId]
 */
export async function ensureWarehousesReady(db, tenantId) {
  if (!(await db.schema.hasTable("warehouses"))) return;

  const addedKind = !(await db.schema.hasColumn("warehouses", "kind"));
  if (addedKind) {
    await db.schema.alterTable("warehouses", (table) => {
      table.string("kind", 32).notNullable().defaultTo("brand");
    });
  }

  // Backfill distributor kind whenever linked (also after first add of kind column).
  if (await db.schema.hasColumn("warehouses", "linked_team_member_id")) {
    let q = db("warehouses")
      .where((builder) => {
        builder.whereNotNull("linked_team_member_id").orWhereNotNull("linked_account_id");
      })
      .whereNot("kind", "distributor");
    if (tenantId) q = q.where({ tenant_id: tenantId });
    await q.update({ kind: "distributor" });
  }

  const rows = await db("warehouses")
    .modify((q) => {
      if (tenantId) q.where({ tenant_id: tenantId });
    })
    .select("id", "name");
  const demoIds = rows
    .filter((r) => DEMO_WAREHOUSE_NAMES.includes(String(r.name ?? "").trim().toLowerCase()))
    .map((r) => r.id);

  if (demoIds.length > 0) {
    if (await db.schema.hasColumn("team_members", "primary_warehouse_id")) {
      await db("team_members").whereIn("primary_warehouse_id", demoIds).update({
        primary_warehouse_id: null,
        updated_at: db.fn.now(),
      });
    }
    await db("warehouses").whereIn("id", demoIds).del();
  }

  if (await db.schema.hasColumn("team_members", "primary_warehouse_id")) {
    let orphanQ = db("team_members").whereNotNull("primary_warehouse_id");
    if (tenantId) orphanQ = orphanQ.where({ tenant_id: tenantId });
    const members = await orphanQ.select("id", "tenant_id", "primary_warehouse_id");
    for (const m of members) {
      const wh = await db("warehouses")
        .where({ id: m.primary_warehouse_id, tenant_id: m.tenant_id })
        .first();
      if (!warehouseIsActive(wh)) {
        await db("team_members").where({ id: m.id }).update({
          primary_warehouse_id: null,
          updated_at: db.fn.now(),
        });
      }
    }
  }
}

/** Match GET /me/warehouse-options: only rows that are explicitly active. */
export function warehouseIsActive(w) {
  if (!w) return false;
  return w.is_active === true || w.is_active === 1 || w.is_active === "t" || w.is_active === "true";
}

/**
 * @param {unknown} value
 * @param {'brand'|'distributor'} [fallback='brand']
 * @returns {'brand'|'distributor'}
 */
export function normalizeWarehouseKind(value, fallback = "brand") {
  const v = String(value ?? "")
    .trim()
    .toLowerCase();
  if (v === "distributor") return "distributor";
  if (v === "brand") return "brand";
  return fallback === "distributor" ? "distributor" : "brand";
}

/**
 * True only when the distributor has an **active** receiving warehouse they can use.
 * Orphan primary_warehouse_id (deleted demo) or inactive / null-active links do not count.
 *
 * @param {{ primary_warehouse_id?: string|null, id?: string }} member
 * @param {Array<{ id?: string, is_active?: boolean, linked_team_member_id?: string|null }>} warehouses
 */
export function distributorAlreadyHasReceivingWarehouse(member, warehouses) {
  const list = warehouses ?? [];
  const byId = new Map(list.map((w) => [String(w.id ?? "").trim(), w]));
  const primary =
    member?.primary_warehouse_id != null && String(member.primary_warehouse_id).trim() !== ""
      ? String(member.primary_warehouse_id).trim()
      : null;
  if (primary) {
    const wh = byId.get(primary);
    if (warehouseIsActive(wh)) return true;
  }
  const mid = member?.id != null ? String(member.id).trim() : "";
  if (!mid) return false;
  return list.some(
    (w) =>
      warehouseIsActive(w) &&
      w.linked_team_member_id != null &&
      String(w.linked_team_member_id).trim() !== "" &&
      String(w.linked_team_member_id).trim() === mid,
  );
}

/**
 * Whether primary_warehouse_id points at a missing or non-active warehouse.
 * @param {{ primary_warehouse_id?: string|null }} member
 * @param {Array<{ id?: string, is_active?: boolean }>} warehouses
 */
export function distributorPrimaryWarehouseIsStale(member, warehouses) {
  const primary =
    member?.primary_warehouse_id != null && String(member.primary_warehouse_id).trim() !== ""
      ? String(member.primary_warehouse_id).trim()
      : null;
  if (!primary) return false;
  const wh = (warehouses ?? []).find((w) => String(w.id ?? "").trim() === primary);
  return !warehouseIsActive(wh);
}

/**
 * Whether a distributor may set this warehouse as primary.
 * Only their current primary, CRM-linked, or account-linked depots — never peer DCs or HQ brand pool.
 *
 * @param {{ id?: string, kind?: string, is_active?: boolean, linked_team_member_id?: string|null, linked_account_id?: string|null }} warehouse
 * @param {{ id?: string, primary_warehouse_id?: string|null, linked_account_id?: string|null }} member
 */
export function canDistributorSelectWarehouse(warehouse, member) {
  if (!warehouseIsActive(warehouse)) return false;
  const wid = String(warehouse.id ?? "").trim();
  if (!wid) return false;
  const mid = member?.id != null ? String(member.id).trim() : "";
  const primary =
    member?.primary_warehouse_id != null && String(member.primary_warehouse_id).trim() !== ""
      ? String(member.primary_warehouse_id).trim()
      : null;
  if (primary && primary === wid) return true;

  if (
    mid &&
    warehouse.linked_team_member_id != null &&
    String(warehouse.linked_team_member_id).trim() === mid
  ) {
    return true;
  }

  const accountId =
    member?.linked_account_id != null && String(member.linked_account_id).trim() !== ""
      ? String(member.linked_account_id).trim()
      : null;
  if (
    accountId &&
    warehouse.linked_account_id != null &&
    String(warehouse.linked_account_id).trim() === accountId
  ) {
    return true;
  }

  return false;
}

/**
 * Options for distributor primary-depot / receive pickers.
 * Only this distributor's primary + CRM/account-linked warehouses (never peer DCs or brand pool).
 *
 * @param {Array<object>} warehouses active warehouse rows
 * @param {{ id?: string, primary_warehouse_id?: string|null, linked_account_id?: string|null }} member
 */
export function filterWarehouseOptionsForDistributor(warehouses, member) {
  return (warehouses ?? []).filter((w) => canDistributorSelectWarehouse(w, member));
}
