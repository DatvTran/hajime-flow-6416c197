/**
 * Align purchase_orders / purchase_order_items with API route expectations:
 * CRM manufacturer_id, line-item SKU labels, destination + extras metadata.
 */

export async function up(knex) {
  const addPoCol = async (col, fn) => {
    if (!(await knex.schema.hasTable('purchase_orders'))) return;
    const has = await knex.schema.hasColumn('purchase_orders', col);
    if (!has) await knex.schema.alterTable('purchase_orders', (t) => fn(t));
  };

  await addPoCol('manufacturer_id', (t) => t.string('manufacturer_id', 32).nullable());
  await addPoCol('market_destination', (t) => t.string('market_destination', 255).nullable());
  await addPoCol('total_bottles', (t) => t.integer('total_bottles').defaultTo(0));
  await addPoCol('metadata', (t) => t.jsonb('metadata').notNullable().defaultTo('{}'));
  await addPoCol('delivery_date', (t) => t.date('delivery_date').nullable());
  await addPoCol('delivered_at', (t) => t.timestamp('delivered_at').nullable());

  const addItemCol = async (col, fn) => {
    if (!(await knex.schema.hasTable('purchase_order_items'))) return;
    const has = await knex.schema.hasColumn('purchase_order_items', col);
    if (!has) await knex.schema.alterTable('purchase_order_items', (t) => fn(t));
  };

  await addItemCol('sku', (t) => t.string('sku', 100).nullable());
  await addItemCol('product_name', (t) => t.string('product_name', 255).nullable());
}

export async function down() {
  // Forward-only; dropping columns risks data loss on varied deployments.
}
