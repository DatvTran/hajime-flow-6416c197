/**
 * Migration: Add visit notes and sales targets tables
 * For Sales Rep feature completion
 */

export async function up(knex) {
  // Visit notes table
  await knex.schema.createTable('visit_notes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.uuid('account_id').notNullable().references('id').inTable('accounts').onDelete('CASCADE');
    table.text('note').notNullable();
    table.timestamp('visit_date').notNullable();
    table.uuid('created_by').references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['tenant_id', 'account_id']);
    table.index(['tenant_id', 'created_by']);
    table.index('visit_date');
  });

  // Sales targets table
  await knex.schema.createTable('sales_targets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.string('sales_rep').notNullable();
    table.integer('quarter').notNullable();
    table.integer('year').notNullable();
    table.decimal('target_amount', 12, 2).notNullable().defaultTo(0);
    table.decimal('achieved_amount', 12, 2).defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Unique constraint - one target per rep per quarter
    table.unique(['tenant_id', 'sales_rep', 'quarter', 'year']);
    
    // Indexes
    table.index(['tenant_id', 'sales_rep']);
    table.index(['tenant_id', 'quarter', 'year']);
  });

  // Inventory adjustments table (for audit trail)
  await knex.schema.createTable('inventory_adjustments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.uuid('inventory_id').references('id').inTable('inventory').onDelete('SET NULL');
    table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    table.string('location').notNullable();
    table.string('adjustment_type').notNullable(); // manual, receive, damage, transfer
    table.integer('quantity_before').notNullable();
    table.integer('quantity_after').notNullable();
    table.integer('quantity_changed').notNullable();
    table.text('notes');
    table.uuid('created_by').references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['tenant_id', 'product_id']);
    table.index(['tenant_id', 'inventory_id']);
    table.index('created_at');
  });

  console.log('[Migration 003] Created visit_notes, sales_targets, inventory_adjustments tables');
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('inventory_adjustments');
  await knex.schema.dropTableIfExists('sales_targets');
  await knex.schema.dropTableIfExists('visit_notes');
  
  console.log('[Migration 003] Dropped visit_notes, sales_targets, inventory_adjustments tables');
}
