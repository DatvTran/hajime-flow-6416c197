import { AsyncLocalStorage } from 'node:async_hooks';
import { platformDb } from './database.mjs';

const als = new AsyncLocalStorage();

/**
 * Active Knex connection for this HTTP request.
 * Defaults to platform DB (auth, HQ, legacy shared data).
 */
export function getDb() {
  return als.getStore()?.db ?? platformDb;
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
