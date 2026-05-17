import { platformDb } from '../config/database.mjs';

/**
 * Resolve PostgreSQL database name from a knex instance.
 * @param {import('knex').Knex} knex
 */
export function getDatabaseNameFromKnex(knex) {
  const conn = knex?.client?.config?.connection;
  if (typeof conn === 'string') {
    try {
      const u = new URL(conn);
      const name = u.pathname?.replace(/^\//, '') ?? '';
      return decodeURIComponent(name);
    } catch {
      return null;
    }
  }
  if (conn && typeof conn === 'object') {
    return conn.database ?? null;
  }
  return null;
}

/**
 * True when migrations run against the platform (control) database, not an isolated distributor DB.
 * @param {import('knex').Knex} knex
 */
export function isPlatformKnex(knex) {
  const current = getDatabaseNameFromKnex(knex);
  if (!current) return true;

  if (String(current).startsWith('hajime_dist_')) {
    return false;
  }

  const platformName = getDatabaseNameFromKnex(platformDb);
  if (platformName) {
    return current === platformName;
  }

  return true;
}
