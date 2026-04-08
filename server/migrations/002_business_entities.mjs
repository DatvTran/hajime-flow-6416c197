/**
 * Migration: Business entities schema
 * Creates: products, inventory, accounts, sales_orders, purchase_orders, shipments, production_runs, audit_logs
 */

export async function up(knex) {
  // Products table
  await knex.schema.createTable('products', (table) => {
    table.bigIncrements('id').primary();
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants');
    table.string('sku', 100).notNullable();
    table.string('name', 255).notNullable();
    table.text('description');
    table.string('category', 100);
    table.string('unit_size', 50);
    table.jsonb('metadata').defaultTo('{}');
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
    table.integer('version').defaultTo(1);

    table.unique(['tenant_id', 'sku']);
    table.index(['tenant_id', 'deleted_at']);
  });

  // Inventory table
  await knex.schema.createTable('inventory', (table) => {
    table.bigIncrements('id').primary();
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants');
    table.bigInteger('product_id').notNullable().references('id').inTable('products');
    table.string('location', 100).notNullable().defaultTo('Main Warehouse');
    table.integer('quantity_on_hand').notNullable().defaultTo(0);
    table.integer('reserved_quantity').defaultTo(0);
    table.integer('reorder_point').nullable();
    table.integer('reorder_quantity').nullable();
    table.date('last_count_date');
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.integer('version').defaultTo(1);

    table.unique(['tenant_id', 'product_id', 'location']);
    table.index(['tenant_id', 'product_id']);
  });

  // Add generated column for available_quantity
  await knex.raw(`
    ALTER TABLE inventory
    ADD COLUMN available_quantity INTEGER GENERATED ALWAYS AS (quantity_on_hand - reserved_quantity) STORED
  `);

  // Inventory adjustments history
  await knex.schema.createTable('inventory_adjustments', (table) => {
    table.bigIncrements('id').primary();
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants');
    table.bigInteger('inventory_id').references('id').inTable('inventory');
    table.bigInteger('product_id').references('id').inTable('products');
    table.string('location', 100);
    table.string('adjustment_type', 50).notNullable();
    table.integer('quantity_before');
    table.integer('quantity_after');
    table.integer('quantity_changed');
    table.string('reference_type', 50);
    table.bigInteger('reference_id');
    table.text('notes');
    table.bigInteger('created_by').references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['tenant_id', 'created_at']);
  });

  // Accounts (customers/retailers)
  await knex.schema.createTable('accounts', (table) => {
    table.bigIncrements('id').primary();
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants');
    table.string('account_number', 50);
    table.string('name', 255).notNullable();
    table.string('type', 50);
    table.string('market', 100);
    table.string('status', 50).defaultTo('active');
    table.string('email', 255);
    table.string('phone', 50);
    table.jsonb('billing_address').defaultTo('{}');
    table.jsonb('shipping_address').defaultTo('{}');
    table.string('payment_terms', 50);
    table.decimal('credit_limit', 12, 2);
    table.text('notes');
    table.bigInteger('assigned_sales_rep_id').references('id').inTable('users');
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
    table.integer('version').defaultTo(1);

    table.unique(['tenant_id', 'account_number']);
    table.index(['tenant_id', 'deleted_at']);
    table.index(['tenant_id', 'market']);
  });

  // Sales Orders
  await knex.schema.createTable('sales_orders', (table) => {
    table.bigIncrements('id').primary();
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants');
    table.string('order_number', 50).notNullable();
    table.bigInteger('account_id').references('id').inTable('accounts');
    table.string('status', 50).notNullable().defaultTo('draft');
    table.date('order_date');
    table.date('requested_delivery_date');
    table.decimal('subtotal', 12, 2);
    table.decimal('tax_amount', 12, 2);
    table.decimal('shipping_cost', 12, 2);
    table.decimal('total_amount', 12, 2);
    table.jsonb('shipping_address').defaultTo('{}');
    table.text('notes');
    table.bigInteger('created_by').references('id').inTable('users');
    table.bigInteger('approved_by').references('id').inTable('users');
    table.timestamp('fulfilled_at');
    table.timestamp('cancelled_at');
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
    table.integer('version').defaultTo(1);

    table.unique(['tenant_id', 'order_number']);
    table.index(['tenant_id', 'status']);
    table.index(['account_id', 'created_at']);
  });

  // Sales Order Line Items
  await knex.schema.createTable('sales_order_items', (table) => {
    table.bigIncrements('id').primary();
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants');
    table.bigInteger('sales_order_id').notNullable().references('id').inTable('sales_orders').onDelete('CASCADE');
    table.bigInteger('product_id').references('id').inTable('products');
    table.string('sku', 100);
    table.string('product_name', 255);
    table.integer('quantity_ordered').notNullable();
    table.integer('quantity_fulfilled').defaultTo(0);
    table.decimal('unit_price', 12, 2).notNullable();
    table.decimal('line_total', 12, 2);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['sales_order_id']);
  });

  // Add generated column for line_total
  await knex.raw(`
    ALTER TABLE sales_order_items
    ALTER COLUMN line_total SET DEFAULT 0
  `);

  // Purchase Orders
  await knex.schema.createTable('purchase_orders', (table) => {
    table.bigIncrements('id').primary();
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants');
    table.string('po_number', 50).notNullable();
    table.string('supplier_name', 255).notNullable();
    table.string('status', 50).notNullable().defaultTo('draft');
    table.date('order_date');
    table.date('expected_delivery_date');
    table.decimal('subtotal', 12, 2);
    table.decimal('total_amount', 12, 2);
    table.text('notes');
    table.bigInteger('created_by').references('id').inTable('users');
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
    table.integer('version').defaultTo(1);

    table.unique(['tenant_id', 'po_number']);
    table.index(['tenant_id', 'status']);
  });

  // Purchase Order Line Items
  await knex.schema.createTable('purchase_order_items', (table) => {
    table.bigIncrements('id').primary();
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants');
    table.bigInteger('purchase_order_id').notNullable().references('id').inTable('purchase_orders').onDelete('CASCADE');
    table.bigInteger('product_id').references('id').inTable('products');
    table.integer('quantity_ordered').notNullable();
    table.integer('quantity_received').defaultTo(0);
    table.decimal('unit_cost', 12, 2).notNullable();
    table.decimal('line_total', 12, 2);

    table.index(['purchase_order_id']);
  });

  // Shipments
  await knex.schema.createTable('shipments', (table) => {
    table.bigIncrements('id').primary();
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants');
    table.bigInteger('sales_order_id').references('id').inTable('sales_orders');
    table.string('tracking_number', 100);
    table.string('carrier', 100);
    table.string('status', 50).defaultTo('pending');
    table.timestamp('shipped_at');
    table.timestamp('delivered_at');
    table.jsonb('shipping_address').defaultTo('{}');
    table.timestamps(true, true);

    table.index(['tenant_id', 'status']);
    table.index(['sales_order_id']);
  });

  // Production Runs
  await knex.schema.createTable('production_runs', (table) => {
    table.bigIncrements('id').primary();
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants');
    table.string('batch_number', 100).notNullable();
    table.bigInteger('product_id').references('id').inTable('products');
    table.string('status', 50).defaultTo('scheduled');
    table.integer('quantity_planned').notNullable();
    table.integer('quantity_completed').defaultTo(0);
    table.date('scheduled_start_date');
    table.date('actual_start_date');
    table.date('scheduled_completion_date');
    table.text('notes');
    table.timestamps(true, true);
    table.integer('version').defaultTo(1);

    table.unique(['tenant_id', 'batch_number']);
    table.index(['tenant_id', 'status']);
  });

  // Audit Logs
  await knex.schema.createTable('audit_logs', (table) => {
    table.bigIncrements('id').primary();
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants');
    table.string('table_name', 100).notNullable();
    table.bigInteger('record_id').notNullable();
    table.string('action', 20).notNullable(); // INSERT, UPDATE, DELETE
    table.jsonb('old_values');
    table.jsonb('new_values');
    table.specificType('changed_fields', 'TEXT[]');
    table.bigInteger('user_id').references('id').inTable('users');
    table.specificType('ip_address', 'inet');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['tenant_id', 'created_at']);
    table.index(['table_name', 'record_id']);
  });

  // Add updated_at triggers for versioned tables
  const versionedTables = [
    'products',
    'inventory',
    'accounts',
    'sales_orders',
    'purchase_orders',
    'production_runs',
  ];

  for (const tableName of versionedTables) {
    await knex.raw(`
      CREATE TRIGGER update_${tableName}_updated_at
      BEFORE UPDATE ON ${tableName}
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
  }
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('production_runs');
  await knex.schema.dropTableIfExists('shipments');
  await knex.schema.dropTableIfExists('purchase_order_items');
  await knex.schema.dropTableIfExists('purchase_orders');
  await knex.schema.dropTableIfExists('sales_order_items');
  await knex.schema.dropTableIfExists('sales_orders');
  await knex.schema.dropTableIfExists('accounts');
  await knex.schema.dropTableIfExists('inventory_adjustments');
  await knex.schema.dropTableIfExists('inventory');
  await knex.schema.dropTableIfExists('products');
}
