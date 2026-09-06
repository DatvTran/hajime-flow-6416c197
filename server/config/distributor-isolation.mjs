/**
 * Hosted Supabase exposes a single Postgres database. Distributor isolation
 * uses schemas (`hajime_dist_*`) instead of CREATE DATABASE.
 *
 * Set DISTRIBUTOR_ISOLATION=database to keep the legacy multi-database layout
 * (local Docker / old Fly Postgres) during a transition.
 */

export function useDistributorSchemas() {
  const mode = (process.env.DISTRIBUTOR_ISOLATION || '').trim().toLowerCase();
  if (mode === 'database' || mode === 'db') return false;
  if (mode === 'schema') return true;
  return true;
}

export function assertDistributorName(databaseName) {
  const name = String(databaseName || '').trim();
  if (!/^hajime_dist_[a-z0-9_]+$/.test(name)) {
    throw new Error(`Invalid distributor database name: ${name}`);
  }
  return name;
}
