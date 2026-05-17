/**
 * Demo: provision Metro Logistics isolated DB and link demo distributor + sales reps.
 * Safe to re-run (skips if org slug already exists).
 * Platform database only — must not run inside per-distributor migrate.latest().
 */
import { authService } from '../services/auth.mjs';
import { createDistributorOrganization } from '../lib/distributor-organization.mjs';
import { isPlatformKnex } from '../lib/migration-context.mjs';
import { databaseExists, getDistributorKnex } from '../config/distributor-database-pool.mjs';
import { platformDb } from '../config/database.mjs';
import { runTenantMigrations } from '../lib/tenant-migrations.mjs';

/** Provisioning creates databases and must not roll back if a later step fails. */
export const config = { transaction: false };

const DEMO_PASSWORD = 'admin123!';
const DEMO_SLUG = 'metro_logistics';
const DEMO_DB_NAME = 'hajime_dist_metro_logistics';
const DIST_EMAIL = 'fulfillment@metrologistics.example';
const REP_EMAILS = [
  'marcus.chen@hajime.jp',
  'sarah.kim@hajime.jp',
  'luca.moretti@hajime.jp',
  'jordan.lee@hajime.jp',
];

export async function up(knex) {
  if (!isPlatformKnex(knex)) {
    console.log('[029] Skipping demo distributor provision on non-platform database');
    return;
  }

  const hasRegistry = await platformDb.schema.hasTable('distributor_organizations');
  if (!hasRegistry) {
    console.log('[029] Platform registry missing — applying 028_distributor_organizations');
    const m028 = await import('./028_distributor_organizations.mjs');
    await m028.up(platformDb);
  }

  const tenant =
    (await platformDb('tenants').where({ subdomain: 'hajime' }).first()) ??
    (await platformDb('tenants').orderBy('created_at', 'asc').first());
  if (!tenant) {
    console.log('[029] No platform tenant — skip demo distributor DB');
    return;
  }

  const existing = await platformDb('distributor_organizations')
    .where({ slug: DEMO_SLUG })
    .first();
  if (existing) {
    console.log('[029] Demo distributor org already exists:', existing.database_name);
    try {
      const distKnex = getDistributorKnex(existing.database_name);
      await runTenantMigrations(distKnex);
    } catch (err) {
      console.warn('[029] Could not re-run distributor migrations:', err?.message || err);
    }
    return;
  }

  const passwordHash = await authService.hashPassword(DEMO_PASSWORD);

  let distUser = await platformDb('users')
    .where({ tenant_id: tenant.id, email: DIST_EMAIL })
    .whereNull('deleted_at')
    .first();

  if (!distUser) {
    [distUser] = await platformDb('users')
      .insert({
        tenant_id: tenant.id,
        email: DIST_EMAIL,
        password_hash: passwordHash,
        role: 'distributor',
        display_name: 'Metro Logistics Ops',
        is_active: true,
        email_verified: true,
      })
      .returning('*');
  }

  if (await databaseExists(DEMO_DB_NAME)) {
    console.log('[029] Repairing orphaned distributor database:', DEMO_DB_NAME);
    const distKnex = getDistributorKnex(DEMO_DB_NAME);
    await runTenantMigrations(distKnex);

    const [org] = await platformDb('distributor_organizations')
      .insert({
        slug: DEMO_SLUG,
        name: 'Metro Logistics',
        database_name: DEMO_DB_NAME,
        tenant_id: tenant.id,
        owner_user_id: distUser.id,
        is_active: true,
      })
      .returning('*');

    const distTenant = await distKnex('tenants').where({ id: tenant.id }).first();
    if (!distTenant) {
      await distKnex('tenants').insert({
        id: tenant.id,
        name: 'Metro Logistics',
        subdomain: DEMO_SLUG,
        settings: JSON.stringify({ currency: 'CAD', timezone: 'America/Toronto' }),
      });
    }

    await platformDb('users')
      .where({ id: distUser.id })
      .update({
        distributor_org_id: org.id,
        tenant_id: org.tenant_id,
        updated_at: platformDb.fn.now(),
      });

    for (const email of REP_EMAILS) {
      await platformDb('users')
        .where({ tenant_id: tenant.id, email })
        .whereNull('deleted_at')
        .update({
          managed_by_distributor_user_id: distUser.id,
          distributor_org_id: org.id,
          tenant_id: org.tenant_id,
          updated_at: platformDb.fn.now(),
        });
    }

    console.log(`[029] Repaired ${DEMO_DB_NAME} and linked ${REP_EMAILS.length} sales reps`);
    return;
  }

  const org = await createDistributorOrganization({
    name: 'Metro Logistics',
    slug: DEMO_SLUG,
    ownerUserId: distUser.id,
    platformTenantId: tenant.id,
  });

  for (const email of REP_EMAILS) {
    await platformDb('users')
      .where({ tenant_id: tenant.id, email })
      .whereNull('deleted_at')
      .update({
        managed_by_distributor_user_id: distUser.id,
        distributor_org_id: org.id,
        tenant_id: org.tenant_id,
        updated_at: platformDb.fn.now(),
      });
  }

  console.log(`[029] Provisioned ${org.database_name} and linked ${REP_EMAILS.length} sales reps`);
}

export async function down() {
  console.log('[029] down: demo distributor DB left in place (drop manually if needed)');
}
