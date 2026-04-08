import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

// Parse DATABASE_URL if available (Fly.io format)
function parseDatabaseUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const sslmode = parsed.searchParams.get('sslmode');
    return {
      host: parsed.hostname,
      port: Number(parsed.port) || 5432,
      database: parsed.pathname.slice(1),
      user: parsed.username,
      password: parsed.password,
      ssl: sslmode === 'disable' ? false : { rejectUnauthorized: false },
    };
  } catch {
    return null;
  }
}

const dbUrlConfig = parseDatabaseUrl(process.env.DATABASE_URL);

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
    connection: dbUrlConfig || {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
    },
  },

  production: {
    ...baseConfig,
    connection: dbUrlConfig || {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
    },
  },
};

export default config;
