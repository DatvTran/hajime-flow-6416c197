import knex from 'knex';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { flyDatabaseConnection } from './fly-database-url.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const baseConfig = {
  client: 'postgresql',
  migrations: {
    directory: path.join(__dirname, '..', 'migrations'),
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: path.join(__dirname, '..', 'seeds'),
  },
  pool: {
    min: 2,
    max: 10,
  },
};

const config = {
  development: {
    ...baseConfig,
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'hajime_dev',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    },
  },
  test: {
    ...baseConfig,
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'hajime_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    },
    pool: {
      min: 0,
      max: 2,
    },
  },
  production: {
    ...baseConfig,
    connection: flyDatabaseConnection({
      ssl: { rejectUnauthorized: false },
    }),
    pool: {
      min: 2,
      max: 20,
    },
  },
  staging: {
    ...baseConfig,
    connection: flyDatabaseConnection({
      ssl: { rejectUnauthorized: false },
    }),
    pool: {
      min: 2,
      max: 20,
    },
  },
};

const environment = process.env.NODE_ENV || 'development';
/** Platform / control database (auth, users, distributor registry). */
export const platformDb = knex(config[environment]);
/** @deprecated Use platformDb or getDb() from request-db.mjs */
export const db = platformDb;
export default config;
