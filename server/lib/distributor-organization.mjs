import { randomUUID } from 'node:crypto';
import { platformDb } from '../config/database.mjs';
import { getDistributorKnex, databaseExists } from '../config/distributor-database-pool.mjs';
import { provisionDistributorDatabase } from './provision-distributor-database.mjs';

function slugify(name) {
  return String(name || 'distributor')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48) || 'distributor';
}

/**
 * @param {import('knex').Knex} knex
 * @param {string} slug
 */
export async function findDistributorOrgBySlug(knex, slug) {
  return knex('distributor_organizations')
    .where({ slug: String(slug).trim().toLowerCase(), is_active: true })
    .first();
}

export async function findDistributorOrgById(knex, id) {
  if (!id) return null;
  return knex('distributor_organizations').where({ id, is_active: true }).first();
}

/**
 * Resolve which isolated DB this login should use.
 * @returns {Promise<import('knex').Knex>} platform or distributor connection
 */
export async function resolveRequestDatabase(reqUser) {
  const org = await resolveDistributorOrgForUser(reqUser);
  if (!org?.database_name) {
    return { db: platformDb, org: null };
  }
  const distDb = getDistributorKnex(org.database_name);
  return { db: distDb, org };
}

/**
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function resolveDistributorOrgForUser(reqUser) {
  if (!reqUser) return null;

  if (reqUser.distributorOrgId) {
    const org = await findDistributorOrgById(platformDb, reqUser.distributorOrgId);
    if (org) return org;
  }

  const userId = reqUser.userId ?? reqUser.id;
  if (!userId) return null;

  const user = await platformDb('users')
    .where({ id: userId })
    .whereNull('deleted_at')
    .first();

  if (!user) return null;

  if (user.distributor_org_id) {
    const org = await findDistributorOrgById(platformDb, user.distributor_org_id);
    if (org) return org;
  }

  if (user.role === 'distributor') {
    const owned = await platformDb('distributor_organizations')
      .where({ owner_user_id: user.id, is_active: true })
      .first();
    if (owned) return owned;
  }

  if (user.role === 'sales_rep' || user.role === 'sales') {
    const distUserId = user.managed_by_distributor_user_id;
    if (distUserId) {
      const distUser = await platformDb('users').where({ id: distUserId }).first();
      if (distUser?.distributor_org_id) {
        return findDistributorOrgById(platformDb, distUser.distributor_org_id);
      }
      const owned = await platformDb('distributor_organizations')
        .where({ owner_user_id: distUserId, is_active: true })
        .first();
      if (owned) return owned;
    }
  }

  return null;
}

/**
 * Create registry row + physical PostgreSQL database + run migrations.
 */
export async function createDistributorOrganization({
  name,
  slug: slugInput,
  ownerUserId = null,
  platformTenantId = null,
}) {
  const slug = slugify(slugInput || name);
  const databaseName = `hajime_dist_${slug}`;

  const existing = await platformDb('distributor_organizations').where({ slug }).first();
  if (existing) {
    const err = new Error('A distributor organization with this slug already exists.');
    err.status = 409;
    throw err;
  }

  if (await databaseExists(databaseName)) {
    const err = new Error(`Database ${databaseName} already exists.`);
    err.status = 409;
    throw err;
  }

  const tenantId = platformTenantId || randomUUID();

  const [org] = await platformDb('distributor_organizations')
    .insert({
      slug,
      name: String(name || slug).trim(),
      database_name: databaseName,
      tenant_id: tenantId,
      owner_user_id: ownerUserId,
      is_active: true,
    })
    .returning('*');

  const distKnex = await provisionDistributorDatabase(databaseName);

  const existingTenant = await distKnex('tenants').where({ id: tenantId }).first();
  if (!existingTenant) {
    await distKnex('tenants').insert({
      id: tenantId,
      name: String(name || slug).trim(),
      subdomain: slug,
      settings: JSON.stringify({ currency: 'CAD', timezone: 'America/Toronto' }),
    });
  }

  if (ownerUserId) {
    await platformDb('users')
      .where({ id: ownerUserId })
      .update({
        distributor_org_id: org.id,
        tenant_id: tenantId,
        updated_at: platformDb.fn.now(),
      });
  }

  return org;
}

/**
 * Register invite token on platform for public routes (licensee application).
 */
export async function registerInviteTokenRoute(token, distributorOrgId) {
  if (!token || !distributorOrgId) return;
  await platformDb('invite_token_routes')
    .insert({
      token: String(token).trim(),
      distributor_org_id: distributorOrgId,
    })
    .onConflict('token')
    .merge({ distributor_org_id: distributorOrgId });
}

export async function resolveDatabaseForInviteToken(token) {
  const t = String(token || '').trim();
  if (!t) return { db: platformDb, org: null };

  const route = await platformDb('invite_token_routes').where({ token: t }).first();
  if (!route?.distributor_org_id) {
    return { db: platformDb, org: null };
  }

  const org = await findDistributorOrgById(platformDb, route.distributor_org_id);
  if (!org?.database_name) {
    return { db: platformDb, org: null };
  }

  return { db: getDistributorKnex(org.database_name), org };
}
