/**
 * Migration 006: Purchase Orders, Transfer Orders, Shipments, and Incentives
 * Adds full database tables for production workflow entities
 * NOTE: Uses bigint IDs to match migration 002 schema
 */

export async function up(knex) {
  // ===== PURCHASE ORDERS =====
  // Note: purchase_orders already exists from migration 002 with bigint IDs
  // We add new columns for the enhanced workflow
  const hasPurchaseOrders = await knex.schema.hasTable('purchase_orders');
  
  if (hasPurchaseOrders) {
    // Add new columns to existing table
    const columns = await knex.table('purchase_orders').columnInfo();
    
    if (!columns.po_type) {
      await knex.schema.alterTable('purchase_orders', (table) => {
        table.enum('po_type', ['sales', 'production']).defaultTo('production');
        table.bigInteger('distributor_account_id').nullable();
        table.timestamp('brand_operator_acknowledged_at');
      });
      console.log('[Migration 006] Added po_type, distributor_account_id, brand_operator_acknowledged_at to purchase_orders');
    } else {
      console.log('[Migration 006] purchase_orders already has new columns, skipping');
    }
  } else {
    console.log('[Migration 006] purchase_orders table does not exist - expected from migration 002');
  }

  // ===== TRANSFER ORDERS =====
  const hasTransferOrders = await knex.schema.hasTable('transfer_orders');
  
  if (!hasTransferOrders) {
    await knex.schema.createTable('transfer_orders', (table) => {
      table.bigIncrements('id').primary();
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
      table.bigInteger('created_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.timestamp('deleted_at');

      table.index(['tenant_id', 'status']);
      table.index(['tenant_id', 'from_location']);
      table.index(['tenant_id', 'to_location']);
      table.index(['deleted_at']);
    });
    console.log('[Migration 006] Created transfer_orders');
  } else {
    console.log('[Migration 006] transfer_orders already exists, skipping');
  }

  const hasTransferOrderItems = await knex.schema.hasTable('transfer_order_items');
  if (!hasTransferOrderItems) {
    await knex.schema.createTable('transfer_order_items', (table) => {
      table.bigIncrements('id').primary();
      table.uuid('tenant_id').notNullable();
      table.bigInteger('transfer_order_id').notNullable();
      table.bigInteger('product_id').nullable();
      table.string('sku', 50).notNullable();
      table.string('product_name', 255).notNullable();
      table.integer('quantity').notNullable().defaultTo(0);
      table.bigInteger('batch_id').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.index(['tenant_id', 'transfer_order_id']);
      table.index(['product_id']);
    });
    console.log('[Migration 006] Created transfer_order_items');
  } else {
    console.log('[Migration 006] transfer_order_items already exists, skipping');
  }

  // ===== SHIPMENTS =====
  // Note: shipments already exists from migration 002 with bigint IDs
  const hasShipments = await knex.schema.hasTable('shipments');
  
  if (!hasShipments) {
    // Only create if doesn't exist (should exist from migration 002)
    await knex.schema.createTable('shipments', (table) => {
      table.bigIncrements('id').primary();
      table.uuid('tenant_id').notNullable();
      table.string('shipment_number', 50).notNullable();
      table.bigInteger('order_id').notNullable();
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
      table.bigInteger('created_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.timestamp('deleted_at');

      table.index(['tenant_id', 'status']);
      table.index(['tenant_id', 'order_id', 'order_type']);
      table.index(['tenant_id', 'shipment_number']);
      table.index(['tracking_number']);
      table.index(['deleted_at']);
    });
    console.log('[Migration 006] Created shipments');
  } else {
    console.log('[Migration 006] shipments already exists, skipping');
  }

  const hasShipmentItems = await knex.schema.hasTable('shipment_items');
  if (!hasShipmentItems) {
    await knex.schema.createTable('shipment_items', (table) => {
      table.bigIncrements('id').primary();
      table.uuid('tenant_id').notNullable();
      table.bigInteger('shipment_id').notNullable();
      table.bigInteger('product_id').nullable();
      table.string('sku', 50).notNullable();
      table.string('product_name', 255).notNullable();
      table.integer('quantity').notNullable().defaultTo(0);
      table.bigInteger('batch_id').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.index(['tenant_id', 'shipment_id']);
      table.index(['product_id']);
    });
    console.log('[Migration 006] Created shipment_items');
  } else {
    console.log('[Migration 006] shipment_items already exists, skipping');
  }

  // ===== INCENTIVES =====
  const hasIncentives = await knex.schema.hasTable('incentives');
  
  if (!hasIncentives) {
    await knex.schema.createTable('incentives', (table) => {
      table.bigIncrements('id').primary();
      table.uuid('tenant_id').notNullable();
      table.string('name', 255).notNullable();
      table.enum('type', [
        'volume_rebate',
        'buy_one_get_one',
        'free_goods',
        'payment_terms_discount',
        'display_contest',
        'staff_incentive',
        'trial_incentive'
      ]).notNullable();
      table.string('target_sku', 50);
      table.bigInteger('target_account_id').nullable();
      table.integer('threshold_quantity');
      table.enum('reward_type', ['percentage_discount', 'fixed_amount', 'free_bottles', 'extended_payment_terms']).notNullable();
      table.decimal('reward_amount', 10, 2);
      table.date('start_date');
      table.date('end_date');
      table.enum('status', ['draft', 'active', 'paused', 'completed', 'cancelled']).defaultTo('draft');
      table.text('notes');
      table.bigInteger('created_by').nullable();
      table.bigInteger('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.timestamp('deleted_at');

      table.index(['tenant_id', 'status']);
      table.index(['tenant_id', 'type']);
      table.index(['tenant_id', 'target_account_id']);
      table.index(['target_sku']);
      table.index(['deleted_at']);
    });
    console.log('[Migration 006] Created incentives');
  } else {
    console.log('[Migration 006] incentives already exists, skipping');
  }

  console.log('[Migration 006] Completed');
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('incentive_redemptions');
  await knex.schema.dropTableIfExists('incentives');
  await knex.schema.dropTableIfExists('shipment_items');
  // Note: Don't drop shipments - it exists from migration 002
  await knex.schema.dropTableIfExists('transfer_order_items');
  await knex.schema.dropTableIfExists('transfer_orders');
  // Note: Don't drop purchase_orders or purchase_order_items - they exist from migration 002
  
  console.log('[Migration 006] Dropped tables');
}
