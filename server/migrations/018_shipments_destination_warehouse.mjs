/**
 * Links inbound (and other) shipments to the tenant warehouse directory for clear receiving location.
 */

export async function up(knex) {
  const has = await knex.schema.hasColumn('shipments', 'destination_warehouse_id');
  if (!has) {
    await knex.schema.alterTable('shipments', (table) => {
      table
        .string('destination_warehouse_id', 64)
        .nullable()
        .references('id')
        .inTable('warehouses')
        .onDelete('SET NULL');
    });
    await knex.raw(`
      CREATE INDEX IF NOT EXISTS shipments_tenant_destination_warehouse_idx
      ON shipments (tenant_id, destination_warehouse_id)
      WHERE destination_warehouse_id IS NOT NULL AND deleted_at IS NULL
    `);
    console.log('[Migration 018] Added shipments.destination_warehouse_id');
  }
}

export async function down(knex) {
  await knex.raw(`DROP INDEX IF EXISTS shipments_tenant_destination_warehouse_idx`);
  const has = await knex.schema.hasColumn('shipments', 'destination_warehouse_id');
  if (has) {
    await knex.schema.alterTable('shipments', (table) => {
      table.dropColumn('destination_warehouse_id');
    });
    console.log('[Migration 018] Removed shipments.destination_warehouse_id');
  }
}
