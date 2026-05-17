#!/usr/bin/env node
/**
 * Provision an isolated PostgreSQL database for one distributor.
 * Usage: node server/scripts/provision-distributor.mjs "Tre Amici Imports" tre_amici [ownerUserId]
 */
import { platformDb } from '../config/database.mjs';
import { createDistributorOrganization } from '../lib/distributor-organization.mjs';

const name = process.argv[2];
const slug = process.argv[3];
const ownerUserId = process.argv[4] ? Number(process.argv[4]) : null;

if (!name) {
  console.error('Usage: node server/scripts/provision-distributor.mjs "<Name>" <slug> [ownerUserId]');
  process.exit(1);
}

try {
  const tenant =
    (await platformDb('tenants').where({ subdomain: 'hajime' }).first()) ??
    (await platformDb('tenants').orderBy('created_at', 'asc').first());

  const org = await createDistributorOrganization({
    name,
    slug: slug || name,
    ownerUserId,
    platformTenantId: tenant?.id,
  });

  console.log('Provisioned distributor organization:');
  console.log(JSON.stringify(org, null, 2));
  process.exit(0);
} catch (err) {
  console.error(err);
  process.exit(1);
} finally {
  await platformDb.destroy();
}
