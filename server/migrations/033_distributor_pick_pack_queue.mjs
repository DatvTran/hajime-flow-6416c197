/**
 * Keep Metro Logistics pick & pack queue populated with confirmed orders + line items.
 */
import { platformDb } from '../config/database.mjs';
import { getDistributorKnex } from '../config/distributor-database-pool.mjs';
import { isPlatformKnex } from '../lib/migration-context.mjs';
import { ensurePlatformUserInTenantDb } from '../lib/tenant-user-mirror.mjs';

const DEMO_SLUG = 'metro_logistics';
const DIST_EMAIL = 'fulfillment@metrologistics.example';

const QUEUE_ORDERS = [
  {
    order_number: 'SO-2025-010',
    status: 'confirmed',
    order_date: '2026-03-26',
    requested_delivery_date: '2026-04-02',
    subtotal: 37000,
    total_amount: 37000,
    notes: 'CVY-ONT-Q1-02 — pallet release for LCBO lane · Rep: Marcus Chen',
    quantity_ordered: 480,
    unit_price: 77.08,
  },
  {
    order_number: 'SO-2025-006',
    status: 'confirmed',
    order_date: '2026-03-22',
    requested_delivery_date: '2026-04-02',
    subtotal: 2770,
    total_amount: 2770,
    notes: "Pusateri's restock — Original 750ml",
    quantity_ordered: 36,
    unit_price: 76.94,
  },
];

export async function up(knex) {
  if (!isPlatformKnex(knex)) return;

  const distUser = await platformDb('users')
    .where({ email: DIST_EMAIL })
    .whereNull('deleted_at')
    .first();
  const org = await platformDb('distributor_organizations')
    .where({ slug: DEMO_SLUG, is_active: true })
    .first();
  if (!distUser || !org?.database_name) return;

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
  if (!convoy) return;

  const product =
    (await distKnex('products').where({ tenant_id: tenantId, sku: 'HJM-OG-750' }).whereNull('deleted_at').first()) ??
    (await distKnex('products').where({ tenant_id: tenantId }).whereNull('deleted_at').orderBy('id', 'asc').first());
  if (!product) return;

  for (const spec of QUEUE_ORDERS) {
    let order = await distKnex('sales_orders')
      .where({ tenant_id: tenantId, order_number: spec.order_number })
      .whereNull('deleted_at')
      .first();

    if (order) {
      await distKnex('sales_orders')
        .where({ id: order.id })
        .update({
          status: spec.status,
          order_date: spec.order_date,
          requested_delivery_date: spec.requested_delivery_date,
          subtotal: spec.subtotal,
          total_amount: spec.total_amount,
          notes: spec.notes,
          updated_at: new Date(),
        });
    } else {
      [order] = await distKnex('sales_orders')
        .insert({
          tenant_id: tenantId,
          order_number: spec.order_number,
          account_id: convoy.id,
          status: spec.status,
          order_date: spec.order_date,
          requested_delivery_date: spec.requested_delivery_date,
          subtotal: spec.subtotal,
          tax_amount: 0,
          shipping_cost: 0,
          total_amount: spec.total_amount,
          notes: spec.notes,
          shipping_address: JSON.stringify({
            street: '2200 Meadowpine Blvd',
            city: 'Mississauga',
            province: 'ON',
            postal: 'L5N 0A4',
          }),
          created_by: distUser.id,
        })
        .returning('*');
    }

    const existingItems = await distKnex('sales_order_items')
      .where({ tenant_id: tenantId, sales_order_id: order.id })
      .first();
    if (!existingItems) {
      await distKnex('sales_order_items').insert({
        tenant_id: tenantId,
        sales_order_id: order.id,
        product_id: product.id,
        sku: product.sku,
        product_name: product.name,
        quantity_ordered: spec.quantity_ordered,
        unit_price: spec.unit_price,
      });
    }
  }

  console.log(`[033] Ensured ${QUEUE_ORDERS.length} confirmed pick-pack orders in ${org.database_name}`);
}

export async function down() {}
