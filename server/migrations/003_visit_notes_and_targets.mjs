/**
 * Migration: Add visit notes and sales targets tables
 * For Sales Rep feature completion
 */

export async function up(knex) {
  // Visit notes table - using bigInteger to match accounts.id type
  await knex.schema.createTable('visit_notes', (table) => {
    table.bigIncrements('id').primary();
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.bigInteger('account_id').notNullable().references('id').inTable('accounts').onDelete('CASCADE');
    table.text('note').notNullable();
    table.timestamp('visit_date').notNullable();
    table.bigInteger('created_by').references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['tenant_id', 'account_id']);
    table.index(['tenant_id', 'created_by']);
    table.index('visit_date');
  });

  // Sales targets table
  await knex.schema.createTable('sales_targets', (table) => {
    table.bigIncrements('id').primary();
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

  // Note: inventory_adjustments already exists from migration 002
  // This migration only adds visit_notes and sales_targets

  console.log('[Migration 003] Created visit_notes and sales_targets tables');
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('sales_targets');
  await knex.schema.dropTableIfExists('visit_notes');
  
  console.log('[Migration 003] Dropped visit_notes and sales_targets tables');
}
