#!/usr/bin/env node
/**
 * Fly.io release_command entrypoint — retry migrations while Postgres warms up.
 */
import knex from 'knex';
import config from '../knexfile.mjs';
import { isTransactionPoolerUrl } from '../config/fly-database-url.mjs';

const MAX_ATTEMPTS = 10;
const BASE_DELAY_MS = 2_000;

function knexEnv() {
  const nodeEnv = process.env.NODE_ENV || 'production';
  if (nodeEnv === 'staging') return 'staging';
  if (nodeEnv === 'development') return 'development';
  return 'production';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runOnce() {
  const env = knexEnv();
  const db = knex({
    ...config[env],
    pool: { min: 0, max: 1 },
  });

  try {
    await db.raw('SELECT 1');
    const [batch, log] = await db.migrate.latest();
    if (log.length === 0) {
      console.log('[migrate-release] Database is already up to date');
    } else {
      console.log(`[migrate-release] Ran batch ${batch}: ${log.join(', ')}`);
    }
  } finally {
    await db.destroy();
  }
}

async function main() {
  if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
    console.error(
      '[migrate-release] DATABASE_URL is missing. Set the Supabase (or Postgres) URI on the app.',
    );
    process.exit(1);
  }

  if (isTransactionPoolerUrl(process.env.DATABASE_URL)) {
    console.error(
      '[migrate-release] DATABASE_URL uses the Supabase transaction pooler (:6543). Use the direct connection (db.<ref>.supabase.co:5432).',
    );
    process.exit(1);
  }

  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await runOnce();
      return;
    } catch (err) {
      lastError = err;
      const delay = Math.min(30_000, BASE_DELAY_MS * attempt);
      console.warn(
        `[migrate-release] Attempt ${attempt}/${MAX_ATTEMPTS} failed: ${err?.message || err}`,
      );
      if (attempt < MAX_ATTEMPTS) {
        console.warn(`[migrate-release] Retrying in ${delay}ms…`);
        await sleep(delay);
      }
    }
  }

  console.error('[migrate-release] All migration attempts failed');
  if (lastError?.stack) console.error(lastError.stack);
  console.error(
    '[migrate-release] Postgres may be down. Check the Supabase project status (or Fly Postgres if still in use).',
  );
  process.exit(1);
}

main();
