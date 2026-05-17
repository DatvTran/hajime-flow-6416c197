import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Business schema only — platform registry migrations (028+) must not run on distributor DBs. */
export const TENANT_MIGRATION_MAX = 27;

const migrationsDir = path.join(__dirname, '..', 'migrations');

function tenantMigrationFiles() {
  return fs
    .readdirSync(migrationsDir)
    .filter((f) => /^\d{3}_[\w.-]+\.mjs$/.test(f))
    .filter((f) => {
      const num = Number.parseInt(f.slice(0, 3), 10);
      return Number.isFinite(num) && num >= 1 && num <= TENANT_MIGRATION_MAX;
    })
    .sort();
}

export function createTenantMigrationSource() {
  const files = tenantMigrationFiles();

  return {
    getMigrations() {
      return Promise.resolve(files.map((f) => path.join(migrationsDir, f)));
    },
    getMigrationName(migration) {
      return path.basename(migration);
    },
    getMigration(migration) {
      return import(pathToFileURL(migration).href);
    },
  };
}

/**
 * Apply tenant/business migrations (001–027) to an isolated distributor database.
 * @param {import('knex').Knex} knex
 */
export async function runTenantMigrations(knex) {
  await knex.migrate.latest({
    migrationSource: createTenantMigrationSource(),
  });
}
