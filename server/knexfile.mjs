import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { flyDatabaseConnection } from './config/fly-database-url.mjs';

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
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'hajime_dev',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    },
  },

  staging: {
    ...baseConfig,
    connection: flyDatabaseConnection({
      ssl: { rejectUnauthorized: false },
    }),
  },

  production: {
    ...baseConfig,
    connection: flyDatabaseConnection({
      ssl: { rejectUnauthorized: false },
    }),
  },
};

export default config;
