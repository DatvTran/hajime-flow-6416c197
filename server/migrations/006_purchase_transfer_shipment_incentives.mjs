/**
 * Migration 006: Purchase Orders, Transfer Orders, Shipments, and Incentives
 * Adds full database tables for production workflow entities
 */

export async function up(knex) {
  // ===== PURCHASE ORDERS =====
  await knex.schema.createTable('purchase_orders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable();
    table.string('po_number', 50).notNullable();
    table.uuid('manufacturer_id').notNullable();
    table.enum('status', [
      'draft', 'submitted', 'acknowledged', 'in_production', 
      'ready_for_shipment', 'shipped', 'delivered', 'cancelled'
    ]).defaultTo('draft');
    table.date('order_date').notNullable();
    table.date('delivery_date');
    table.string('market_destination', 50); // e.g., 'Toronto', 'Milan', 'Paris'
    table.integer('total_bottles').defaultTo(0);
    table.decimal('total_amount', 12, 2).defaultTo(0);
    table.text('notes');
    table.timestamp('delivered_at');
    table.uuid('created_by');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at'); // Soft delete

    table.index(['tenant_id', 'status']);
    table.index(['tenant_id', 'manufacturer_id']);
    table.index(['tenant_id', 'po_number']);
    table.index(['deleted_at']);
  });

  await knex.schema.createTable('purchase_order_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable();
    table.uuid('purchase_order_id').notNullable().references('id').inTable('purchase_orders').onDelete('CASCADE');
    table.uuid('product_id');
    table.string('sku', 50).notNullable();
    table.string('product_name', 255).notNullable();
    table.integer('quantity').notNullable().defaultTo(0);
    table.decimal('unit_price', 10, 2).defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['tenant_id', 'purchase_order_id']);
    table.index(['product_id']);
  });

  // ===== TRANSFER ORDERS =====
  await knex.schema.createTable('transfer_orders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable();
    table.string('to_number', 50).notNullable();
    table.string('from_location', 100).notNullable();
    table.string('to_location', 100).notNullable();
    table.enum('status', [
      'draft', 'pending', 'approved', 'packed', 'shipped', 
      'in_transit', 'delivered', 'cancelled'
    ]).defaultTo('draft');
    table.date('request_date').notNullable();
    table.date('ship_date');
    table.date('delivery_date');
    table.string('tracking_number', 100);
    table.string('carrier', 50);
    table.integer('total_bottles').defaultTo(0);
    table.text('notes');
    table.timestamp('shipped_at');
    table.timestamp('delivered_at');
    table.uuid('created_by');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at'); // Soft delete

    table.index(['tenant_id', 'status']);
    table.index(['tenant_id', 'from_location']);
    table.index(['tenant_id', 'to_location']);
    table.index(['deleted_at']);
  });

  await knex.schema.createTable('transfer_order_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable();
    table.uuid('transfer_order_id').notNullable().references('id').inTable('transfer_orders').onDelete('CASCADE');
    table.uuid('product_id');
    table.string('sku', 50).notNullable();
    table.string('product_name', 255).notNullable();
    table.integer('quantity').notNullable().defaultTo(0);
    table.uuid('batch_id'); // Reference to inventory batch
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['tenant_id', 'transfer_order_id']);
    table.index(['product_id']);
  });

  // ===== SHIPMENTS =====
  await knex.schema.createTable('shipments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable();
    table.string('shipment_number', 50).notNullable();
    table.uuid('order_id').notNullable();
    table.enum('order_type', ['sales_order', 'purchase_order', 'transfer_order']).notNullable();
    table.string('carrier', 50);
    table.string('tracking_number', 100);
    table.string('from_location', 100);
    table.string('to_location', 100);
    table.enum('status', [
      'packed', 'picked_up', 'in_transit', 'out_for_delivery', 
      'delivered', 'exception', 'cancelled'
    ]).defaultTo('packed');
    table.timestamp('ship_date');
    table.timestamp('estimated_delivery');
    table.timestamp('delivered_at');
    table.integer('total_bottles').defaultTo(0);
    table.text('notes');
    table.uuid('created_by');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at'); // Soft delete

    table.index(['tenant_id', 'status']);
    table.index(['tenant_id', 'order_id', 'order_type']);
    table.index(['tenant_id', 'shipment_number']);
    table.index(['tracking_number']);
    table.index(['deleted_at']);
  });

  await knex.schema.createTable('shipment_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable();
    table.uuid('shipment_id').notNullable().references('id').inTable('shipments').onDelete('CASCADE');
    table.uuid('product_id');
    table.string('sku', 50).notNullable();
    table.string('product_name', 255).notNullable();
    table.integer('quantity').notNullable().defaultTo(0);
    table.uuid('batch_id');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['tenant_id', 'shipment_id']);
    table.index(['product_id']);
  });

  // ===== INCENTIVES =====
  await knex.schema.createTable('incentives', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('tenant_id').notNullable();
    table.string('name', 255).notNullable();
    table.enum('type', [
      'volume_rebate', // Buy X cases, get Y% back
      'buy_one_get_one', // BOGO
      'free_goods', // Buy X, get Y free bottles
      'payment_terms_discount', // Pay early, get discount
      'display_contest', // Best display wins
      'staff_incentive', // Staff rewards
      'trial_incentive' // First order discount
    ]).notNullable();
    table.string('target_sku', 50); // Specific SKU or null for all
    table.uuid('target_account_id'); // Specific account or null for all
    table.integer('threshold_quantity'); // Minimum quantity to trigger
    table.enum('reward_type', ['percentage_discount', 'fixed_amount', 'free_bottles', 'extended_payment_terms']).notNullable();
    table.decimal('reward_amount', 10, 2); // Percentage or fixed amount
    table.date('start_date');
    table.date('end_date');
    table.enum('status', ['draft', 'active', 'paused', 'completed', 'cancelled']).defaultTo('draft');
    table.text('notes');
    table.uuid('created_by');
    table.uuid('updated_by');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at'); // Soft delete

    table.index(['tenant_id', 'status']);
    table.index(['tenant_id', 'type']);
    table.index(['tenant_id', 'target_account_id']);
    table.index(['target_sku']);
    table.index(['deleted_at']);
  });

  console.log('[Migration 006] Created tables: purchase_orders, purchase_order_items, transfer_orders, transfer_order_items, shipments, shipment_items, incentives');
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('incentive_redemptions');
  await knex.schema.dropTableIfExists('incentives');
  await knex.schema.dropTableIfExists('shipment_items');
  await knex.schema.dropTableIfExists('shipments');
  await knex.schema.dropTableIfExists('transfer_order_items');
  await knex.schema.dropTableIfExists('transfer_orders');
  await knex.schema.dropTableIfExists('purchase_order_items');
  await knex.schema.dropTableIfExists('purchase_orders');
  
  console.log('[Migration 006] Dropped tables');
}
