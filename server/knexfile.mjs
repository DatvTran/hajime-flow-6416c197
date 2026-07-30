import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { flyDatabaseConnection } from './config/fly-database-url.mjs';
import { localDbHost } from './config/local-db-host.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const baseConfig = {
  client: 'postgresql',
  migrations: {
    directory: path.join(__dirname, 'migrations'),
    tableName: 'knex_migrations',
    loadExtensions: ['.mjs', '.js'],
  },
  seeds: {
    directory: path.join(__dirname, 'seeds'),
    loadExtensions: ['.mjs', '.js'],
  },
};

const config = {
  development: {
    ...baseConfig,
    connection: process.env.DATABASE_URL?.trim()
      ? flyDatabaseConnection({ ssl: { rejectUnauthorized: false } })
      : {
          host: localDbHost(),
          port: Number(process.env.DB_PORT) || 5432,
          database: process.env.DB_NAME || 'hajime_dev',
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
        },
  },

  production: {
    ...baseConfig,
    connection: flyDatabaseConnection({
      ssl: { rejectUnauthorized: false },
    }),
    pool: {
      min: 0,
      max: 10,
      acquireTimeoutMillis: 30_000,
    },
  },
  staging: {
    ...baseConfig,
    connection: flyDatabaseConnection({
      ssl: { rejectUnauthorized: false },
    }),
    pool: {
      min: 0,
      max: 10,
      acquireTimeoutMillis: 30_000,
    },
  },
};

export default config;
