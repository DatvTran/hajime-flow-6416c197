/**
 * Repair Metro pick-pack demo: confirmed orders + sales_order_items rows.
 */
import { platformDb } from '../config/database.mjs';
import { getDistributorKnex } from '../config/distributor-database-pool.mjs';
import { isPlatformKnex } from '../lib/migration-context.mjs';

const DEMO_SLUG = 'metro_logistics';

const REPAIRS = [
  { order_number: 'SO-2025-010', quantity_ordered: 480, unit_price: 77.08 },
  { order_number: 'SO-2025-006', quantity_ordered: 36, unit_price: 76.94 },
];

export async function up(knex) {
  if (!isPlatformKnex(knex)) return;

  const org = await platformDb('distributor_organizations')
    .where({ slug: DEMO_SLUG, is_active: true })
    .first();
  if (!org?.database_name) {
    console.log('[034] Metro org missing');
    return;
  }

  const distKnex = getDistributorKnex(org.database_name);
  const tenantId = org.tenant_id;

  let convoy = await distKnex('accounts')
    .where({ tenant_id: tenantId })
    .where(function () {
      this.whereILike('trading_name', '%Convoy Supply%').orWhereILike('name', '%Convoy Supply%');
    })
    .whereNull('deleted_at')
    .first();

  const distUser = await platformDb('users')
    .where({ email: 'fulfillment@metrologistics.example' })
    .whereNull('deleted_at')
    .first();

  const product =
    (await distKnex('products').where({ tenant_id: tenantId, sku: 'HJM-OG-750' }).first()) ??
    (await distKnex('products').where({ tenant_id: tenantId }).orderBy('id', 'asc').first());

  if (!product) {
    console.log('[034] No product in distributor DB — skip');
    return;
  }

  if (!convoy && distUser) {
    [convoy] = await distKnex('accounts')
      .insert({
        tenant_id: tenantId,
        account_number: 'ACC-CONV-ONT',
        name: 'Convoy Supply Ontario',
        trading_name: 'Convoy Supply Ontario',
        type: 'Wholesaler',
        market: 'Ontario',
        status: 'active',
        managed_by_distributor_user_id: distUser.id,
      })
      .returning('*');
  }

  if (!convoy) {
    console.log('[034] No Convoy account — skip');
    return;
  }

  let order006 = await distKnex('sales_orders')
    .where({ tenant_id: tenantId, order_number: 'SO-2025-006' })
    .whereNull('deleted_at')
    .first();
  if (!order006 && distUser) {
    [order006] = await distKnex('sales_orders')
      .insert({
        tenant_id: tenantId,
        order_number: 'SO-2025-006',
        account_id: convoy.id,
        status: 'confirmed',
        order_date: '2026-03-22',
        requested_delivery_date: '2026-04-02',
        subtotal: 2770,
        tax_amount: 0,
        shipping_cost: 0,
        total_amount: 2770,
        notes: "Pusateri's restock",
        created_by: distUser.id,
      })
      .returning('*');
    console.log('[034] Created SO-2025-006');
  }

  for (const spec of REPAIRS) {
    const order = await distKnex('sales_orders')
      .where({ tenant_id: tenantId, order_number: spec.order_number })
      .whereNull('deleted_at')
      .first();

    if (!order) {
      console.log('[034] Missing order', spec.order_number);
      continue;
    }

    await distKnex('sales_orders')
      .where({ id: order.id })
      .update({ status: 'confirmed', updated_at: new Date() });

    await distKnex('sales_order_items').where({ sales_order_id: order.id, tenant_id: tenantId }).del();

    await distKnex('sales_order_items').insert({
      tenant_id: tenantId,
      sales_order_id: order.id,
      product_id: product.id,
      sku: product.sku,
      product_name: product.name,
      quantity_ordered: spec.quantity_ordered,
      unit_price: spec.unit_price,
    });

    console.log(`[034] Repaired ${spec.order_number} (id ${order.id}) with ${spec.quantity_ordered} units`);
  }
}

export async function down() {}
