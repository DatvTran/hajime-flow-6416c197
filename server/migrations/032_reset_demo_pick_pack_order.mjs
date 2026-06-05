/**
 * Reset Metro demo order to confirmed so pick & pack queue is usable after testing.
 */
import { platformDb } from '../config/database.mjs';
import { getDistributorKnex } from '../config/distributor-database-pool.mjs';
import { isPlatformKnex } from '../lib/migration-context.mjs';

const DEMO_SLUG = 'metro_logistics';
const ORDER_NUMBER = 'SO-2025-010';

export async function up(knex) {
  if (!isPlatformKnex(knex)) return;

  const org = await platformDb('distributor_organizations')
    .where({ slug: DEMO_SLUG, is_active: true })
    .first();
  if (!org?.database_name) return;

  const distKnex = getDistributorKnex(org.database_name);
  await distKnex('sales_orders')
    .where({ tenant_id: org.tenant_id, order_number: ORDER_NUMBER })
    .whereNull('deleted_at')
    .update({ status: 'confirmed', updated_at: new Date() });

  console.log(`[032] Reset ${ORDER_NUMBER} to confirmed in ${org.database_name}`);
}

export async function down() {}
