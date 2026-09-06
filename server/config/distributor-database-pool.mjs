import knex from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';
import { platformDb } from './database.mjs';
import { flyDatabaseConnection } from './fly-database-url.mjs';
import { localDbHost } from './local-db-host.mjs';
import { assertDistributorName, useDistributorSchemas } from './distributor-isolation.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const poolCache = new Map();

function platformConnection() {
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (nodeEnv === 'production' || nodeEnv === 'staging' || process.env.DATABASE_URL?.trim()) {
    return flyDatabaseConnection({ ssl: { rejectUnauthorized: false } });
  }

  return {
    host: localDbHost(),
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'hajime_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  };
}

function buildDistributorConnection(databaseName) {
  const base = platformConnection();
  if (useDistributorSchemas()) {
    return base;
  }

  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv === 'production' || nodeEnv === 'staging' || process.env.DATABASE_URL?.trim()) {
    return { ...base, database: databaseName };
  }

  return {
    host: localDbHost(),
    port: Number(process.env.DB_PORT) || 5432,
    database: databaseName,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  };
}

function baseKnexConfig(databaseName) {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const schemas = useDistributorSchemas();
  const name = assertDistributorName(databaseName);

  return {
    client: 'postgresql',
    connection: buildDistributorConnection(name),
    searchPath: schemas ? [name, 'public'] : undefined,
    migrations: {
      directory: migrationsDir,
      tableName: 'knex_migrations',
      schemaName: schemas ? name : undefined,
    },
    pool: {
      min: 0,
      max: 8,
      afterCreate: schemas
        ? (conn, done) => {
            conn.query(`SET search_path TO "${name}", public`, (err) => done(err, conn));
          }
        : undefined,
    },
  };
}

/**
 * @param {string} databaseName schema or database name (`hajime_dist_*`)
 * @returns {import('knex').Knex}
 */
export function getDistributorKnex(databaseName) {
  const name = String(databaseName || '').trim();
  if (!name) {
    throw new Error('database_name is required for distributor connection');
  }
  const cacheKey = `${useDistributorSchemas() ? 'schema' : 'db'}:${name}`;
  if (poolCache.has(cacheKey)) {
    return poolCache.get(cacheKey);
  }
  const instance = knex(baseKnexConfig(name));
  poolCache.set(cacheKey, instance);
  return instance;
}

export async function databaseExists(databaseName) {
  const name = String(databaseName || '').trim();
  if (useDistributorSchemas()) {
    const row = await platformDb.raw(
      'SELECT 1 FROM information_schema.schemata WHERE schema_name = ?',
      [name],
    );
    return Boolean(row.rows?.length);
  }
  const row = await platformDb.raw('SELECT 1 FROM pg_database WHERE datname = ?', [name]);
  return Boolean(row.rows?.length);
}

export async function closeAllDistributorPools() {
  for (const [name, instance] of poolCache.entries()) {
    await instance.destroy();
    poolCache.delete(name);
  }
}
