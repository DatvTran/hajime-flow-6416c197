import { AsyncLocalStorage } from 'node:async_hooks';
import { platformDb } from './database.mjs';

const als = new AsyncLocalStorage();

/**
 * Active Knex connection for this HTTP request.
 * Defaults to platform DB (auth, HQ, legacy shared data).
 *
 * @param {string} [tableName] When set, returns a query builder for that table (same as `knex('table')`).
 */
export function getDb(tableName) {
  const db = als.getStore()?.db ?? platformDb;
  if (typeof tableName === 'string' && tableName.length > 0) {
    return db(tableName);
  }
  return db;
}

/**
 * Run handler with a specific DB bound (platform or distributor).
 * @param {import('knex').Knex} dbConn
 * @param {() => void | Promise<void>} fn
 */
export function runWithRequestDb(dbConn, fn) {
  return als.run({ db: dbConn }, fn);
}

export { platformDb };
