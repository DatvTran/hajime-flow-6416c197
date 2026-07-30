/**
 * Manufacturer supply-chain persistence:
 *  - production_statuses: brew/bottling stage events per PO (complements the stage
 *    derived from purchase_orders.status). Backs the existing /production-statuses API.
 *  - manufacturer_finished_goods: bottling output lots, decremented by outbound shipments.
 */

export async function up(knex) {
  const hasStatuses = await knex.schema.hasTable('production_statuses');
  if (!hasStatuses) {
    await knex.schema.createTable('production_statuses', (table) => {
      table.bigIncrements('id').primary();
      table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
      table.string('po_id', 64).notNullable();
      table.string('batch_id', 64).nullable();
      table.string('stage', 64).notNullable();
      table.string('status', 32).notNullable().defaultTo('in_progress');
      table.text('notes');
      table.timestamp('started_at').nullable();
      table.timestamp('completed_at').nullable();
      table.bigInteger('created_by').nullable();
      table.timestamps(true, true);

      table.index(['tenant_id', 'po_id']);
      table.index(['tenant_id', 'created_at']);
    });
    console.log('[Migration 039] Created production_statuses');
  }

  const hasFg = await knex.schema.hasTable('manufacturer_finished_goods');
  if (!hasFg) {
    await knex.schema.createTable('manufacturer_finished_goods', (table) => {
      table.bigIncrements('id').primary();
      table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
      table.string('sku', 100).notNullable();
      table.string('name', 255).notNullable();
      table.string('lot', 64).notNullable();
      table.integer('cases').notNullable().defaultTo(0);
      table.integer('reserved').notNullable().defaultTo(0);
      table.string('status', 20).notNullable().defaultTo('ok');
      table.string('po_number', 64).nullable();
      table.timestamps(true, true);

      table.unique(['tenant_id', 'sku', 'lot']);
      table.index(['tenant_id', 'sku']);
    });
    console.log('[Migration 039] Created manufacturer_finished_goods');
  }
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('manufacturer_finished_goods');
  await knex.schema.dropTableIfExists('production_statuses');
  console.log('[Migration 039] Dropped production_statuses + manufacturer_finished_goods');
}
