import { getDistributorKnex } from '../config/distributor-database-pool.mjs';
import { platformDb } from '../config/database.mjs';
import { runTenantMigrations } from './tenant-migrations.mjs';

/**
 * Create physical DB and apply tenant migrations (001–027 only).
 * Platform-only migrations (028 registry, 029 demo provision) are excluded.
 * @param {string} databaseName
 */
export async function provisionDistributorDatabase(databaseName) {
  const name = String(databaseName || '').trim();
  if (!/^hajime_dist_[a-z0-9_]+$/.test(name)) {
    throw new Error(`Invalid distributor database name: ${name}`);
  }

  const safeName = name.replace(/"/g, '');
  await platformDb.raw(`CREATE DATABASE "${safeName}"`);

  const distKnex = getDistributorKnex(name);
  try {
    await runTenantMigrations(distKnex);
    console.log(`[provision] Migrated distributor database: ${name}`);
  } catch (err) {
    console.error(`[provision] Migration failed for ${name}:`, err);
    throw err;
  }
  return distKnex;
}
