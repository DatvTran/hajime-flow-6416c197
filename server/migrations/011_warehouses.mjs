/**
 * Tenant-scoped warehouse directory (inventory / transfer locations).
 */

export async function up(knex) {
  const exists = await knex.schema.hasTable('warehouses');
  if (exists) return;

  await knex.schema.createTable('warehouses', (table) => {
    table.string('id', 64).primary();
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.integer('sort_order').notNullable().defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.unique(['tenant_id', 'name']);
    table.index(['tenant_id', 'is_active']);
    table.index(['tenant_id', 'sort_order']);
  });

  console.log('[Migration 011] Created warehouses');
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('warehouses');
  console.log('[Migration 011] Dropped warehouses');
}
