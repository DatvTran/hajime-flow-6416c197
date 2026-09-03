import { getDistributorKnex } from '../config/distributor-database-pool.mjs';
import { platformDb } from '../config/database.mjs';
import { assertDistributorName, useDistributorSchemas } from '../config/distributor-isolation.mjs';
import { runTenantMigrations } from './tenant-migrations.mjs';

/**
 * Create a distributor schema (Supabase / default) or database, then apply
 * tenant migrations (001–027 only).
 * @param {string} databaseName
 */
export async function provisionDistributorDatabase(databaseName) {
  const name = assertDistributorName(databaseName);

  if (useDistributorSchemas()) {
    await platformDb.raw(`CREATE SCHEMA IF NOT EXISTS "${name}"`);
  } else {
    await platformDb.raw(`CREATE DATABASE "${name}"`);
  }

  const distKnex = getDistributorKnex(name);
  try {
    await runTenantMigrations(distKnex);
    console.log(`[provision] Migrated distributor ${useDistributorSchemas() ? 'schema' : 'database'}: ${name}`);
  } catch (err) {
    console.error(`[provision] Migration failed for ${name}:`, err);
    throw err;
  }
  return distKnex;
}
