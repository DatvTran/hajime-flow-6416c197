/**
 * Link warehouse to a CRM team_member (distributor role) — matches Settings → CRM, not only Accounts.
 */

export async function up(knex) {
  const has = await knex.schema.hasColumn('warehouses', 'linked_team_member_id');
  if (has) return;

  await knex.schema.alterTable('warehouses', (table) => {
    table.string('linked_team_member_id', 64).nullable();
  });

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS warehouses_tenant_linked_team_member_idx
    ON warehouses (tenant_id, linked_team_member_id)
    WHERE linked_team_member_id IS NOT NULL
  `);

  console.log('[Migration 015] Added warehouses.linked_team_member_id');
}

export async function down(knex) {
  await knex.raw(`DROP INDEX IF EXISTS warehouses_tenant_linked_team_member_idx`);
  const has = await knex.schema.hasColumn('warehouses', 'linked_team_member_id');
  if (has) {
    await knex.schema.alterTable('warehouses', (table) => {
      table.dropColumn('linked_team_member_id');
    });
  }
  console.log('[Migration 015] Removed warehouses.linked_team_member_id');
}
