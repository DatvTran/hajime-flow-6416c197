/**
 * Demo: confirmed sales order for Metro Logistics pick & pack (isolated distributor DB).
 * Platform-only — seeds the distributor org DB so fulfillment status PATCH works.
 */
import { platformDb } from '../config/database.mjs';
import { getDistributorKnex } from '../config/distributor-database-pool.mjs';
import { isPlatformKnex } from '../lib/migration-context.mjs';
import { ensurePlatformUserInTenantDb } from '../lib/tenant-user-mirror.mjs';

const DIST_EMAIL = 'fulfillment@metrologistics.example';
const DEMO_SLUG = 'metro_logistics';
const ORDER_NUMBER = 'SO-2025-010';

export async function up(knex) {
  if (!isPlatformKnex(knex)) {
    console.log('[031] Skipping distributor pick-pack seed on non-platform database');
    return;
  }

  const distUser = await platformDb('users')
    .where({ email: DIST_EMAIL })
    .whereNull('deleted_at')
    .first();
  const org = await platformDb('distributor_organizations')
    .where({ slug: DEMO_SLUG, is_active: true })
    .first();

  if (!distUser || !org?.database_name) {
    console.log('[031] Metro distributor org not found — skip pick-pack seed');
    return;
  }

  const tenantId = org.tenant_id;
  const distKnex = getDistributorKnex(org.database_name);

  await ensurePlatformUserInTenantDb(distKnex, tenantId, distUser.id);

  let convoy = await distKnex('accounts')
    .where({ tenant_id: tenantId })
    .where(function () {
      this.whereILike('trading_name', '%Convoy Supply%').orWhereILike('name', '%Convoy Supply%');
    })
    .whereNull('deleted_at')
    .first();

  if (!convoy) {
    [convoy] = await distKnex('accounts')
      .insert({
        tenant_id: tenantId,
        account_number: 'ACC-CONV-ONT',
        name: 'Convoy Supply Ontario',
        trading_name: 'Convoy Supply Ontario',
        type: 'Wholesaler',
        market: 'Ontario',
        status: 'active',
        sales_owner: 'Marcus Chen',
        email: 'pnandakumar@convoysupply.example',
        managed_by_distributor_user_id: distUser.id,
        payment_terms: 'Net 30',
      })
      .returning('*');
  } else if (convoy.managed_by_distributor_user_id == null) {
    await distKnex('accounts')
      .where({ id: convoy.id })
      .update({ managed_by_distributor_user_id: distUser.id });
  }

  const existingOrder = await distKnex('sales_orders')
    .where({ tenant_id: tenantId, order_number: ORDER_NUMBER })
    .whereNull('deleted_at')
    .first();

  if (existingOrder) {
    console.log('[031] Demo pick-pack order already exists:', ORDER_NUMBER);
    return;
  }

  let product = await distKnex('products')
    .where({ tenant_id: tenantId, sku: 'HJM-OG-750' })
    .whereNull('deleted_at')
    .first();
  if (!product) {
    product = await distKnex('products')
      .where({ tenant_id: tenantId })
      .whereNull('deleted_at')
      .orderBy('id', 'asc')
      .first();
  }

  const [order] = await distKnex('sales_orders')
    .insert({
      tenant_id: tenantId,
      order_number: ORDER_NUMBER,
      account_id: convoy.id,
      status: 'confirmed',
      order_date: '2026-03-26',
      requested_delivery_date: '2026-04-02',
      subtotal: 37000,
      tax_amount: 0,
      shipping_cost: 0,
      total_amount: 37000,
      notes: 'CVY-ONT-Q1-02 — pallet release for LCBO lane · Rep: Marcus Chen',
      shipping_address: JSON.stringify({
        street: '2200 Meadowpine Blvd',
        city: 'Mississauga',
        province: 'ON',
        postal: 'L5N 0A4',
      }),
      created_by: distUser.id,
    })
    .returning('*');

  if (product) {
    await distKnex('sales_order_items').insert({
      tenant_id: tenantId,
      sales_order_id: order.id,
      product_id: product.id,
      sku: product.sku,
      product_name: product.name,
      quantity_ordered: 480,
      unit_price: 77.08,
    });
  }

  console.log(`[031] Seeded ${ORDER_NUMBER} (id ${order.id}) in ${org.database_name}`);
}

export async function down() {
  // Demo seed — leave in place.
}
