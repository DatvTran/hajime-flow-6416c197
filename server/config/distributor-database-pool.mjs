import knex from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';
import { platformDb } from './database.mjs';
import { flyDatabaseConnection } from './fly-database-url.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const poolCache = new Map();

function buildDistributorConnection(databaseName) {
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (nodeEnv === 'production' || nodeEnv === 'staging') {
    const base = flyDatabaseConnection({ ssl: { rejectUnauthorized: false } });
    if (typeof base === 'string') {
      const u = new URL(base);
      u.pathname = `/${databaseName}`;
      return u.toString();
    }
    return { ...base, database: databaseName };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: databaseName,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  };
}

function baseKnexConfig(databaseName) {
  const migrationsDir = path.join(__dirname, '..', 'migrations');

  return {
    client: 'postgresql',
    connection: buildDistributorConnection(databaseName),
    migrations: {
      directory: migrationsDir,
      tableName: 'knex_migrations',
    },
    pool: { min: 0, max: 8 },
  };
}

/**
 * @param {string} databaseName
 * @returns {import('knex').Knex}
 */
export function getDistributorKnex(databaseName) {
  const name = String(databaseName || '').trim();
  if (!name) {
    throw new Error('database_name is required for distributor connection');
  }
  if (poolCache.has(name)) {
    return poolCache.get(name);
  }
  const instance = knex(baseKnexConfig(name));
  poolCache.set(name, instance);
  return instance;
}

export async function databaseExists(databaseName) {
  const name = String(databaseName || '').trim();
  const row = await platformDb.raw('SELECT 1 FROM pg_database WHERE datname = ?', [name]);
  return Boolean(row.rows?.length);
}

export async function closeAllDistributorPools() {
  for (const [name, instance] of poolCache.entries()) {
    await instance.destroy();
    poolCache.delete(name);
  }
}
