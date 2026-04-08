import knex from 'knex';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Parse DATABASE_URL if available (Fly.io format)
function parseDatabaseUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: Number(parsed.port) || 5432,
      database: parsed.pathname.slice(1), // Remove leading /
      user: parsed.username,
      password: parsed.password,
      ssl: parsed.searchParams.get('sslmode') === 'disable' ? false : { rejectUnauthorized: false },
    };
  } catch {
    return null;
  }
}

const dbUrlConfig = parseDatabaseUrl(process.env.DATABASE_URL);

const config = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'hajime_dev',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    },
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
  },
  production: {
    client: 'postgresql',
    connection: dbUrlConfig || {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
    },
    migrations: {
      directory: path.join(__dirname, '..', 'migrations'),
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: path.join(__dirname, '..', 'seeds'),
    },
    pool: {
      min: 2,
      max: 20,
    },
  },
  staging: {
    client: 'postgresql',
    connection: dbUrlConfig || {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
    },
    migrations: {
      directory: path.join(__dirname, '..', 'migrations'),
      tableName: 'knex_migrations',
    },
    pool: {
      min: 2,
      max: 20,
    },
  },
};

const environment = process.env.NODE_ENV || 'development';
export const db = knex(config[environment]);
export default config;
