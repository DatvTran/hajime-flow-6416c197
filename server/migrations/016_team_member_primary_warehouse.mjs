/**
 * Distributors choose their receiving depot; mirrors warehouses.linked_team_member_id when synced.
 */

export async function up(knex) {
  const has = await knex.schema.hasColumn('team_members', 'primary_warehouse_id');
  if (has) return;

  await knex.schema.alterTable('team_members', (table) => {
    table.string('primary_warehouse_id', 64).nullable();
  });

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS team_members_tenant_primary_wh_idx
    ON team_members (tenant_id, primary_warehouse_id)
    WHERE primary_warehouse_id IS NOT NULL
  `);

  console.log('[Migration 016] Added team_members.primary_warehouse_id');
}

export async function down(knex) {
  await knex.raw(`DROP INDEX IF EXISTS team_members_tenant_primary_wh_idx`);
  const has = await knex.schema.hasColumn('team_members', 'primary_warehouse_id');
  if (has) {
    await knex.schema.alterTable('team_members', (table) => {
      table.dropColumn('primary_warehouse_id');
    });
  }
  console.log('[Migration 016] Removed team_members.primary_warehouse_id');
}
