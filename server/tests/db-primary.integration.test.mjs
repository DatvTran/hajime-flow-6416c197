import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { db } from '../config/database.mjs';
import { DataMigrationService } from '../services/data-migration.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_STATE_PATH = path.join(__dirname, '..', 'data', 'app-state.json');

test('DB-primary create/update persists to PostgreSQL and survives migration-service restart without JSON writes', async (t) => {
  if (!process.env.DATABASE_URL) {
    t.skip('DATABASE_URL is not configured; skipping PostgreSQL integration check.');
    return;
  }

  process.env.FEATURE_FLAG_DB_MIGRATION_STAGE = '3';

  await db.raw('SELECT 1');

  const tenantId = '11111111-1111-1111-1111-111111111111';
  const sku = `INT-${Date.now()}`;

  const beforeExists = fs.existsSync(APP_STATE_PATH);
  const beforeStat = beforeExists ? fs.statSync(APP_STATE_PATH) : null;

  const [created] = await db('products')
    .insert({
      tenant_id: tenantId,
      sku,
      name: 'DB Primary Integration Product',
      description: 'created via integration check',
      category: 'spirits',
      unit_size: '750ml',
      metadata: JSON.stringify({ source: 'integration-check', version: 1 }),
    })
    .returning(['id', 'tenant_id', 'sku', 'name']);

  assert.equal(created.sku, sku);

  await db('products')
    .where({ id: created.id, tenant_id: tenantId })
    .update({
      name: 'DB Primary Integration Product Updated',
      metadata: JSON.stringify({ source: 'integration-check', version: 2 }),
      updated_at: new Date(),
    });

  const serviceAfterRestart = new DataMigrationService();
  assert.equal(serviceAfterRestart.isDbPrimaryEnabled(), true);

  const data = await serviceAfterRestart.getData(tenantId);
  const product = data.products.find((row) => row.sku === sku);

  assert.ok(product, `Expected to find product with sku ${sku}`);
  assert.equal(product.name, 'DB Primary Integration Product Updated');

  const afterExists = fs.existsSync(APP_STATE_PATH);
  const afterStat = afterExists ? fs.statSync(APP_STATE_PATH) : null;

  assert.equal(afterExists, beforeExists, 'app-state.json existence changed unexpectedly');
  if (beforeStat && afterStat) {
    assert.equal(
      afterStat.mtimeMs,
      beforeStat.mtimeMs,
      'app-state.json mtime changed; DB-primary flow should not write JSON state'
    );
  }

  await db('products').where({ id: created.id, tenant_id: tenantId }).del();
});
