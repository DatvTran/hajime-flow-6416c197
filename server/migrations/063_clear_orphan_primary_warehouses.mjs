/**
 * Clear team_members.primary_warehouse_id when the warehouse row is gone
 * (e.g. after demo warehouse deletion), so distributors can create a new one.
 */

export async function up(knex) {
  if (!(await knex.schema.hasTable("team_members"))) return;
  if (!(await knex.schema.hasColumn("team_members", "primary_warehouse_id"))) return;
  if (!(await knex.schema.hasTable("warehouses"))) return;

  const result = await knex.raw(`
    UPDATE team_members tm
    SET primary_warehouse_id = NULL,
        updated_at = NOW()
    WHERE tm.primary_warehouse_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM warehouses w
        WHERE w.id = tm.primary_warehouse_id
          AND w.tenant_id = tm.tenant_id
          AND w.is_active IS DISTINCT FROM FALSE
      )
  `);

  const n = result?.rowCount ?? result?.rows?.length ?? "?";
  console.log(`[Migration 063] Cleared orphan/inactive primary_warehouse_id rows (${n})`);
}

export async function down() {
  console.log("[Migration 063] down: no-op");
}
