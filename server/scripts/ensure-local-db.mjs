#!/usr/bin/env node
/**
 * Fail fast with a helpful message when local Postgres is not reachable.
 * Skipped when DATABASE_URL is set (Fly/production release migrations).
 */
import net from 'net';
import { localDbHost } from '../config/local-db-host.mjs';

const port = Number(process.env.DB_PORT) || 5432;

async function canConnect(host) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (ok) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(2000);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}

async function main() {
  if (process.env.DATABASE_URL?.trim()) return;

  const host = localDbHost();
  const ok = await canConnect(host);
  if (ok) return;

  console.error(`
Cannot reach PostgreSQL at ${host}:${port}.

This project uses Fly.io Postgres by default — run migrations against Fly:

  npm run db:migrate:fly

Migrations also run automatically on every \`fly deploy\` (release_command).

Optional local Postgres (Docker):

  1. Start Docker Desktop
  2. npm run db:up
  3. npm run db:migrate
`);
  process.exit(1);
}

main();
