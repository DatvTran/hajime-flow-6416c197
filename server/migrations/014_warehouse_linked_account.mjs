/**
 * Optional link from a warehouse row to a distributor/wholesaler account (Accounts).
 */

export async function up(knex) {
  const has = await knex.schema.hasColumn('warehouses', 'linked_account_id');
  if (has) return;

  await knex.schema.alterTable('warehouses', (table) => {
    table.string('linked_account_id', 64).nullable();
  });

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS warehouses_tenant_linked_account_idx
    ON warehouses (tenant_id, linked_account_id)
    WHERE linked_account_id IS NOT NULL
  `);

  console.log('[Migration 014] Added warehouses.linked_account_id');
}

export async function down(knex) {
  await knex.raw(`DROP INDEX IF EXISTS warehouses_tenant_linked_account_idx`);
  const has = await knex.schema.hasColumn('warehouses', 'linked_account_id');
  if (has) {
    await knex.schema.alterTable('warehouses', (table) => {
      table.dropColumn('linked_account_id');
    });
  }
  console.log('[Migration 014] Removed warehouses.linked_account_id');
}
