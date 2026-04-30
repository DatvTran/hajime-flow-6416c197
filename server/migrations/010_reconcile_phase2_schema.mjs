/**
 * Migration 010: Reconcile schema for Phase 2 routes
 *
 * Why:
 * - Earlier migrations created `shipments` with a minimal schema (migration 002).
 * - API v1 routes expect additional columns added in later “workflow” schema.
 * - Migration 006 only created `shipments` if missing and did not ALTER existing tables.
 *
 * This migration is idempotent and safe to run on existing DBs.
 */

async function ensurePgcrypto(knex) {
  // Needed for gen_random_uuid() defaults in some environments.
  try {
    await knex.raw('create extension if not exists pgcrypto');
  } catch (e) {
    // Extension creation can be disallowed in some managed setups; ignore if it fails.
    console.warn('[Migration 010] Unable to ensure pgcrypto extension:', e?.message || e);
  }
}

async function ensureShipmentsColumns(knex) {
  const hasShipments = await knex.schema.hasTable('shipments');
  if (!hasShipments) return;

  const addColIfMissing = async (col, fn) => {
    const has = await knex.schema.hasColumn('shipments', col);
    if (has) return false;
    await knex.schema.alterTable('shipments', (t) => fn(t));
    return true;
  };

  // Soft delete support used by API routes.
  await addColIfMissing('deleted_at', (t) => t.timestamp('deleted_at'));

  // Workflow shipment identity.
  await addColIfMissing('shipment_number', (t) => t.string('shipment_number', 50));

  // API v1 expects generic order linkage (sales/purchase/transfer).
  // Use bigint + string; avoid enum alterations on existing DBs.
  await addColIfMissing('order_id', (t) => t.bigInteger('order_id'));
  await addColIfMissing('order_type', (t) => t.string('order_type', 50));

  await addColIfMissing('from_location', (t) => t.string('from_location', 100));
  await addColIfMissing('to_location', (t) => t.string('to_location', 100));
  await addColIfMissing('estimated_delivery', (t) => t.timestamp('estimated_delivery'));
  await addColIfMissing('ship_date', (t) => t.timestamp('ship_date'));
  await addColIfMissing('total_bottles', (t) => t.integer('total_bottles').defaultTo(0));
  await addColIfMissing('notes', (t) => t.text('notes'));
  await addColIfMissing('created_by', (t) => t.bigInteger('created_by'));

  // Ensure timestamps exist; some older tables may not have both.
  await addColIfMissing('created_at', (t) => t.timestamp('created_at').defaultTo(knex.fn.now()));
  await addColIfMissing('updated_at', (t) => t.timestamp('updated_at').defaultTo(knex.fn.now()));
}

async function ensureTeamMembersTable(knex) {
  const has = await knex.schema.hasTable('team_members');
  if (has) return;

  await knex.schema.createTable('team_members', (table) => {
    table.string('id', 32).primary();
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.string('email', 255).notNullable();
    table.string('role', 50).notNullable();
    table.string('phone', 50);
    table.string('department', 100);
    table.boolean('is_active').defaultTo(true);
    table.bigInteger('created_by').references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.unique(['tenant_id', 'email']);
    table.index(['tenant_id', 'role']);
    table.index(['tenant_id', 'is_active']);
  });
  console.log('[Migration 010] Created team_members (missing on target DB)');
}

async function ensureNewProductRequestsTable(knex) {
  const has = await knex.schema.hasTable('new_product_requests');
  if (has) return;

  await ensurePgcrypto(knex);

  await knex.schema.createTable('new_product_requests', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable().index();
    table.string('request_id', 50).notNullable();
    table.string('title').notNullable();
    table.enum('requested_by', ['brand_operator', 'manufacturer']).notNullable().defaultTo('brand_operator');
    table.timestamp('requested_at').notNullable().defaultTo(knex.fn.now());

    table.jsonb('specs').notNullable().defaultTo('{}');

    table.enum('status', [
      'draft',
      'submitted',
      'under_review',
      'proposed',
      'approved',
      'rejected',
      'declined',
    ]).notNullable().defaultTo('draft');

    table.string('assigned_manufacturer');

    table.timestamp('submitted_at');
    table.timestamp('review_started_at');
    table.timestamp('proposal_received_at');
    table.timestamp('decided_at');

    table.jsonb('manufacturer_proposal');
    table.jsonb('brand_decision');
    table.string('production_po_id');
    table.string('resulting_sku');
    table.jsonb('attachments').defaultTo('[]');
    table.text('notes');

    table.bigInteger('created_by');
    table.bigInteger('updated_by');
    table.timestamps(true, true);

    table.index(['tenant_id', 'status']);
    table.index(['tenant_id', 'assigned_manufacturer']);
    table.index(['tenant_id', 'request_id']);
  });

  console.log('[Migration 010] Created new_product_requests (missing on target DB)');
}

export async function up(knex) {
  await ensureShipmentsColumns(knex);
  await ensureTeamMembersTable(knex);
  await ensureNewProductRequestsTable(knex);
  console.log('[Migration 010] Phase 2 schema reconciliation complete');
}

export async function down(_knex) {
  // No-op: this migration is intended to be a forward-only reconciliation.
  console.log('[Migration 010] down() is a no-op');
}

