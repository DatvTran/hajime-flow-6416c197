/**
 * Metro Logistics isolated DB: copy platform catalog + warehouse stock for pick & pack.
 */
import { platformDb } from '../config/database.mjs';
import { getDistributorKnex } from '../config/distributor-database-pool.mjs';
import { isPlatformKnex } from '../lib/migration-context.mjs';

const DEMO_SLUG = 'metro_logistics';

const DEMO_PRODUCTS = [
  {
    sku: 'HJM-OG-750',
    name: 'Hajime Original 750ml',
    category: 'Spirits',
    unit_size: '750ml',
    case_size: 12,
  },
  {
    sku: 'HJM-YZ-750',
    name: 'Hajime Yuzu 750ml',
    category: 'Spirits',
    unit_size: '750ml',
    case_size: 12,
  },
  {
    sku: 'HJM-OG-375',
    name: 'Hajime Original 375ml',
    category: 'Spirits',
    unit_size: '375ml',
    case_size: 12,
  },
];

export async function up(knex) {
  if (!isPlatformKnex(knex)) return;

  const org = await platformDb('distributor_organizations')
    .where({ slug: DEMO_SLUG, is_active: true })
    .first();
  if (!org?.database_name) return;

  const tenantId = org.tenant_id;
  const distKnex = getDistributorKnex(org.database_name);

  const productIds = new Map();

  for (const p of DEMO_PRODUCTS) {
    let row = await distKnex('products')
      .where({ tenant_id: tenantId, sku: p.sku })
      .whereNull('deleted_at')
      .first();

    if (!row) {
      const platformProduct = await platformDb('products')
        .where({ tenant_id: tenantId, sku: p.sku })
        .whereNull('deleted_at')
        .first();

      const insert = {
        tenant_id: tenantId,
        sku: p.sku,
        name: platformProduct?.name ?? p.name,
        description: platformProduct?.description ?? p.name,
        category: platformProduct?.category ?? p.category,
        unit_size: platformProduct?.unit_size ?? p.unit_size,
        metadata: platformProduct?.metadata ?? JSON.stringify({ caseSize: p.case_size }),
      };

      [row] = await distKnex('products').insert(insert).returning('*');
    }

    productIds.set(p.sku, row.id);

    const hasInv = await distKnex('inventory')
      .where({ tenant_id: tenantId, product_id: row.id, location: 'Toronto Main Warehouse' })
      .first();

    if (!hasInv) {
      await distKnex('inventory').insert({
        tenant_id: tenantId,
        product_id: row.id,
        location: 'Toronto Main Warehouse',
        quantity_on_hand: 2400,
        reserved_quantity: 0,
        reorder_point: 120,
        reorder_quantity: 480,
      });
    }
  }

  console.log(`[035] Seeded ${productIds.size} products + inventory in ${org.database_name}`);

  // Re-run line-item repair now that catalog exists
  const { up: repairUp } = await import('./034_fix_pick_pack_line_items.mjs');
  await repairUp(knex);
}

export async function down() {}
