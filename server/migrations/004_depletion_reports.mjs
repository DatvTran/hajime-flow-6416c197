/**
 * Migration: Depletion Reports
 * Creates: depletion_reports table for distributor sell-through reporting
 */

export async function up(knex) {
  // Depletion Reports - actual sell-through data from distributors
  await knex.schema.createTable('depletion_reports', (table) => {
    table.bigIncrements('id').primary();
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants');
    table.bigInteger('account_id').notNullable().references('id').inTable('accounts');
    table.bigInteger('product_id').references('id').inTable('products');
    table.string('sku', 100).notNullable();
    table.date('period_start').notNullable();
    table.date('period_end').notNullable();
    table.integer('bottles_sold').notNullable().defaultTo(0);
    table.integer('bottles_on_hand_at_end').notNullable().defaultTo(0);
    table.boolean('flagged_for_replenishment').defaultTo(false);
    table.text('notes');
    table.bigInteger('reported_by').references('id').inTable('users');
    table.string('reported_by_role', 50).defaultTo('distributor');
    table.timestamp('reported_at').defaultTo(knex.fn.now());
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
    table.integer('version').defaultTo(1);

    // Indexes for common queries
    table.index(['tenant_id', 'account_id']);
    table.index(['tenant_id', 'sku']);
    table.index(['tenant_id', 'period_start', 'period_end']);
    table.index(['tenant_id', 'flagged_for_replenishment']);
    table.index(['tenant_id', 'deleted_at']);
  });

  // Sell-through velocity summary (materialized view helper table)
  await knex.schema.createTable('sellthrough_summaries', (table) => {
    table.bigIncrements('id').primary();
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants');
    table.bigInteger('account_id').notNullable().references('id').inTable('accounts');
    table.string('sku', 100).notNullable();
    table.string('period_type', 20).notNullable(); // '7d', '30d', '90d', 'monthly'
    table.date('period_start').notNullable();
    table.date('period_end').notNullable();
    table.integer('bottles_sold').defaultTo(0);
    table.integer('bottles_delivered').defaultTo(0); // from orders
    table.decimal('sellthrough_pct', 5, 2); // calculated: sold / delivered * 100
    table.decimal('velocity_bottles_per_day', 8, 2); // sold / days in period
    table.timestamp('calculated_at').defaultTo(knex.fn.now());

    table.unique(['tenant_id', 'account_id', 'sku', 'period_type', 'period_start']);
    table.index(['tenant_id', 'sku', 'period_start']);
  });

  // Inventory adjustment requests from distributors
  await knex.schema.createTable('inventory_adjustment_requests', (table) => {
    table.bigIncrements('id').primary();
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants');
    table.bigInteger('account_id').notNullable().references('id').inTable('accounts');
    table.bigInteger('product_id').references('id').inTable('products');
    table.string('sku', 100).notNullable();
    table.string('adjustment_type', 50).notNullable(); // 'count_discrepancy', 'damage', 'theft', 'other'
    table.integer('quantity_expected').notNullable();
    table.integer('quantity_actual').notNullable();
    table.integer('quantity_adjustment').notNullable(); // actual - expected
    table.text('reason');
    table.string('status', 50).defaultTo('pending'); // 'pending', 'approved', 'rejected'
    table.bigInteger('requested_by').references('id').inTable('users');
    table.bigInteger('approved_by').references('id').inTable('users');
    table.timestamp('requested_at').defaultTo(knex.fn.now());
    table.timestamp('approved_at');
    table.text('rejection_reason');
    table.timestamps(true, true);

    table.index(['tenant_id', 'account_id', 'status']);
    table.index(['tenant_id', 'status']);
  });

  // Add updated_at trigger for depletion_reports
  await knex.raw(`
    CREATE TRIGGER update_depletion_reports_updated_at
    BEFORE UPDATE ON depletion_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
  `);
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('inventory_adjustment_requests');
  await knex.schema.dropTableIfExists('sellthrough_summaries');
  await knex.schema.dropTableIfExists('depletion_reports');
}
