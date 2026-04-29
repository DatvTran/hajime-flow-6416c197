import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { DataMigrationService } from './data-migration.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');

function tenantFile(tenantId) {
  return path.join(dataDir, `app-state.${tenantId}.json`);
}

test('stage<=2 requires tenant scope and never serves shared JSON metadata', () => {
  const svc = new DataMigrationService();
  svc.stage = 2;

  assert.throws(() => svc.getDataMetaIfJSON(), /tenantId is missing/);
  assert.throws(() => svc.getDataMetaIfJSON(''), /tenantId is missing/);

  const tenantMeta = svc.getDataMetaIfJSON('tenant-guard');
  assert.ok(tenantMeta.etag);
  assert.equal(fs.existsSync(tenantFile('tenant-guard')), true);
});

test('saveData writes tenant-scoped JSON files instead of shared app-state.json', async () => {
  const svc = new DataMigrationService();
  svc.stage = 0;

  const tenantA = 'tenant-alpha';
  const tenantB = 'tenant-beta';

  const stateA = { products: [{ sku: 'A' }], accounts: [], inventory: [], salesOrders: [], purchaseOrders: [], shipments: [], productionStatuses: [] };
  const stateB = { products: [{ sku: 'B' }], accounts: [], inventory: [], salesOrders: [], purchaseOrders: [], shipments: [], productionStatuses: [] };

  await svc.saveData(stateA, tenantA);
  await svc.saveData(stateB, tenantB);

  assert.equal(fs.existsSync(tenantFile(tenantA)), true);
  assert.equal(fs.existsSync(tenantFile(tenantB)), true);

  const writtenA = JSON.parse(fs.readFileSync(tenantFile(tenantA), 'utf8'));
  const writtenB = JSON.parse(fs.readFileSync(tenantFile(tenantB), 'utf8'));
  assert.deepEqual(writtenA.products, stateA.products);
  assert.deepEqual(writtenB.products, stateB.products);
});
