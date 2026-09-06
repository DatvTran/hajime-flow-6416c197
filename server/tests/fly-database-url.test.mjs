import test from 'node:test';
import assert from 'node:assert/strict';

import {
  flyDatabaseConnection,
  isTransactionPoolerUrl,
  normalizeFlyDatabaseUrl,
} from '../config/fly-database-url.mjs';

test('normalizeFlyDatabaseUrl rewrites flycast to internal', () => {
  const out = normalizeFlyDatabaseUrl(
    'postgres://user:pass@hajime-db.flycast:5432/hajime_app?sslmode=disable',
  );
  assert.match(out, /hajime-db\.internal/);
  assert.doesNotMatch(out, /\.flycast/);
});

test('flyDatabaseConnection disables SSL on Fly internal hosts without sslmode', () => {
  const prev = process.env.DATABASE_URL;
  process.env.DATABASE_URL =
    'postgres://user:secret@top1.nearest.of.hajime-db.internal:5432/hajime_app';
  try {
    const conn = flyDatabaseConnection();
    assert.equal(conn.host, 'top1.nearest.of.hajime-db.internal');
    assert.equal(conn.ssl, false);
    assert.equal(conn.database, 'hajime_app');
  } finally {
    if (prev === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = prev;
  }
});

test('flyDatabaseConnection honors sslmode=require for external hosts', () => {
  const prev = process.env.DATABASE_URL;
  process.env.DATABASE_URL =
    'postgres://user:secret@db.example.com:5432/hajime_app?sslmode=require';
  try {
    const conn = flyDatabaseConnection();
    assert.deepEqual(conn.ssl, { rejectUnauthorized: false });
  } finally {
    if (prev === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = prev;
  }
});

test('flyDatabaseConnection disables SSL on internal host even with sslmode=require', () => {
  const prev = process.env.DATABASE_URL;
  process.env.DATABASE_URL =
    'postgres://user:secret@hajime-db.internal:5432/hajime_app?sslmode=require';
  try {
    const conn = flyDatabaseConnection();
    assert.equal(conn.ssl, false);
  } finally {
    if (prev === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = prev;
  }
});

test('flyDatabaseConnection enables SSL for Supabase hosts without sslmode', () => {
  const prev = process.env.DATABASE_URL;
  process.env.DATABASE_URL =
    'postgresql://postgres.abc:secret@db.abc.supabase.co:5432/postgres';
  try {
    const conn = flyDatabaseConnection();
    assert.equal(conn.host, 'db.abc.supabase.co');
    assert.deepEqual(conn.ssl, { rejectUnauthorized: false });
    assert.equal(conn.database, 'postgres');
  } finally {
    if (prev === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = prev;
  }
});

test('isTransactionPoolerUrl detects Supabase :6543', () => {
  assert.equal(
    isTransactionPoolerUrl(
      'postgresql://postgres.abc:secret@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
    ),
    true,
  );
  assert.equal(
    isTransactionPoolerUrl('postgresql://postgres.abc:secret@db.abc.supabase.co:5432/postgres'),
    false,
  );
});

test('flyDatabaseConnection throws when DATABASE_URL and DB_HOST are missing', () => {
  const prevUrl = process.env.DATABASE_URL;
  const prevHost = process.env.DB_HOST;
  delete process.env.DATABASE_URL;
  delete process.env.DB_HOST;
  try {
    assert.throws(() => flyDatabaseConnection(), /DATABASE_URL is not set/);
  } finally {
    if (prevUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = prevUrl;
    if (prevHost === undefined) delete process.env.DB_HOST;
    else process.env.DB_HOST = prevHost;
  }
});
