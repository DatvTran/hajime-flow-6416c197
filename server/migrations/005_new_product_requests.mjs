/**
 * Migration: New Product Requests
 * Tracks SKU development workflow from proposal through approval to production.
 */
export async function up(knex) {
  // New product requests table
  await knex.schema.createTable('new_product_requests', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable().index();
    table.string('request_id', 50).notNullable(); // NPR-YYYY-NNNN format
    table.string('title').notNullable();
    table.enum('requested_by', ['brand_operator', 'manufacturer']).notNullable().defaultTo('brand_operator');
    table.timestamp('requested_at').notNullable().defaultTo(knex.fn.now());
    
    // Specifications (stored as JSONB for flexibility)
    table.jsonb('specs').notNullable();
    
    // Status workflow
    table.enum('status', [
      'draft',
      'submitted',
      'under_review',
      'proposed',
      'approved',
      'rejected',
      'declined'
    ]).notNullable().defaultTo('draft');
    
    // Assignment
    table.string('assigned_manufacturer');
    
    // Timeline tracking
    table.timestamp('submitted_at');
    table.timestamp('review_started_at');
    table.timestamp('proposal_received_at');
    table.timestamp('decided_at');
    
    // Manufacturer proposal (stored as JSONB)
    table.jsonb('manufacturer_proposal');
    
    // Brand decision
    table.jsonb('brand_decision');
    
    // Linked production PO
    table.string('production_po_id');
    
    // Resulting SKU after approval
    table.string('resulting_sku');
    
    // Attachments
    table.jsonb('attachments').defaultTo('[]');
    
    // Notes
    table.text('notes');
    
    // Audit
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['tenant_id', 'status']);
    table.index(['tenant_id', 'assigned_manufacturer']);
    table.index(['tenant_id', 'request_id']);
  });
  
  console.log('Created new_product_requests table');
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('new_product_requests');
  console.log('Dropped new_product_requests table');
}
