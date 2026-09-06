/**
 * Hide seed wholesalers from live HQ (Metro / Empire / Midwest / Kanto / Cave Lumière).
 * Platform DB only.
 */
import { isPlatformKnex } from '../lib/migration-context.mjs';
import { isDemoDistributorOrg } from '../lib/demo-distributor-orgs.mjs';

export async function up(knex) {
  if (!isPlatformKnex(knex)) {
    console.log('[052] Skipping demo distributor deactivation on non-platform database');
    return;
  }

  if (await knex.schema.hasTable('distributor_organizations')) {
    const orgs = await knex('distributor_organizations').select('id', 'name', 'slug', 'is_active');
    const demoIds = orgs.filter((o) => isDemoDistributorOrg(o)).map((o) => o.id);
    if (demoIds.length) {
      await knex('distributor_organizations').whereIn('id', demoIds).update({ is_active: false });
      console.log('[052] Deactivated demo distributor orgs:', demoIds.length);
    }
  }

  if (await knex.schema.hasTable('accounts')) {
    const rows = await knex('accounts')
      .where({ type: 'distributor' })
      .whereNull('deleted_at')
      .select('id', 'name', 'trading_name', 'email');
    const demoAccountIds = rows
      .filter((a) =>
        isDemoDistributorOrg({
          name: a.trading_name || a.name,
        }) || isDemoDistributorOrg({ name: a.name }),
      )
      .map((a) => a.id);
    if (demoAccountIds.length) {
      await knex('accounts').whereIn('id', demoAccountIds).update({ deleted_at: knex.fn.now() });
      console.log('[052] Soft-deleted demo distributor accounts:', demoAccountIds.length);
    }
  }
}

export async function down() {
  console.log('[052] down: demo distributor rows stay inactive');
}
