import test from 'node:test';
import assert from 'node:assert/strict';
import { assertDistributorName, useDistributorSchemas } from '../config/distributor-isolation.mjs';

test('assertDistributorName accepts hajime_dist_*', () => {
  assert.equal(assertDistributorName('hajime_dist_metro_logistics'), 'hajime_dist_metro_logistics');
});

test('assertDistributorName rejects other names', () => {
  assert.throws(() => assertDistributorName('postgres'), /Invalid distributor/);
});

test('useDistributorSchemas defaults to schema mode', () => {
  const prev = process.env.DISTRIBUTOR_ISOLATION;
  delete process.env.DISTRIBUTOR_ISOLATION;
  try {
    assert.equal(useDistributorSchemas(), true);
  } finally {
    if (prev === undefined) delete process.env.DISTRIBUTOR_ISOLATION;
    else process.env.DISTRIBUTOR_ISOLATION = prev;
  }
});

test('useDistributorSchemas can opt into multi-database', () => {
  const prev = process.env.DISTRIBUTOR_ISOLATION;
  process.env.DISTRIBUTOR_ISOLATION = 'database';
  try {
    assert.equal(useDistributorSchemas(), false);
  } finally {
    if (prev === undefined) delete process.env.DISTRIBUTOR_ISOLATION;
    else process.env.DISTRIBUTOR_ISOLATION = prev;
  }
});
