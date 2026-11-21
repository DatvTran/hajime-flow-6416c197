/**
 * Remove seeded demo warehouse locations from the directory.
 * Clears distributor primary links, then deletes the demo rows
 * (shipments.destination_warehouse_id is ON DELETE SET NULL).
 */

const DEMO_WAREHOUSE_NAMES = [
  "toronto main",
  "toronto main warehouse",
  "toronto lcbo warehouse",
  "milan depot",
  "milan dc",
  "production",
  "paris hub",
  "nyc warehouse",
];

export async function up(knex) {
  if (!(await knex.schema.hasTable("warehouses"))) return;

  const rows = await knex("warehouses").select("id", "name");
  const demoIds = rows
    .filter((r) => DEMO_WAREHOUSE_NAMES.includes(String(r.name ?? "").trim().toLowerCase()))
    .map((r) => r.id);

  if (demoIds.length === 0) {
    console.log("[Migration 062] No demo warehouses found");
    return;
  }

  if (await knex.schema.hasColumn("team_members", "primary_warehouse_id")) {
    await knex("team_members").whereIn("primary_warehouse_id", demoIds).update({
      primary_warehouse_id: null,
      updated_at: knex.fn.now(),
    });
  }

  await knex("warehouses").whereIn("id", demoIds).del();

  console.log(`[Migration 062] Deleted ${demoIds.length} demo warehouse(s)`);
}

export async function down() {
  console.log("[Migration 062] down: no-op (demo warehouses not restored)");
}
