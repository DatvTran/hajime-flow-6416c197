import { platformDb } from '../config/database.mjs';
import { getDistributorKnex } from '../config/distributor-database-pool.mjs';
import { Role } from '../rbac/permissions.mjs';
import { findDistributorOrgById } from './distributor-organization.mjs';

/** HQ roles that must see data across the platform DB and every distributor database. */
export function isHqGlobalViewer(role) {
  return (
    role === Role.BRAND_OPERATOR ||
    role === Role.FOUNDER_ADMIN ||
    role === Role.OPERATIONS
  );
}

export async function listActiveDistributorOrgs() {
  return platformDb('distributor_organizations')
    .where({ is_active: true })
    .orderBy('name', 'asc');
}

/**
 * Prefix row ids so numeric ids from different databases do not collide in the client.
 * @param {Record<string, unknown>} row
 * @param {Record<string, unknown> | null} org
 */
export function tagRowForHq(row, org) {
  if (!row) return row;
  const tagged = { ...row };
  if (org) {
    tagged.id = `${org.id}:${row.id}`;
    tagged.distributor_org_id = org.id;
    tagged.distributor_org_name = org.name;
    tagged._hq_raw_id = row.id;
  }
  return tagged;
}

/**
 * Run a fetcher against the platform DB (legacy tenant) and each active distributor DB.
 * @param {string | null | undefined} platformTenantId
 * @param {(db: import('knex').Knex, tenantId: string | null, org: Record<string, unknown> | null) => Promise<unknown[]>} fetchRows
 */
export async function hqFetchFromAllSources(platformTenantId, fetchRows) {
  const merged = [];

  try {
    const platformRows = await fetchRows(platformDb, platformTenantId ?? null, null);
    for (const r of platformRows || []) {
      merged.push(tagRowForHq(r, null));
    }
  } catch (err) {
    console.error('[HQ] Platform data fetch failed:', err?.message || err);
  }

  const orgs = await listActiveDistributorOrgs();
  await Promise.all(
    orgs.map(async (org) => {
      if (!org?.database_name) return;
      try {
        const knex = getDistributorKnex(org.database_name);
        const rows = await fetchRows(knex, org.tenant_id, org);
        for (const r of rows || []) {
          merged.push(tagRowForHq(r, org));
        }
      } catch (err) {
        console.error(`[HQ] Fetch failed for ${org.database_name}:`, err?.message || err);
      }
    }),
  );

  return merged;
}

/**
 * @param {unknown[]} rows
 * @param {{ page?: number, limit?: number, sortKey?: string }} opts
 */
export function paginateMergedRows(rows, opts = {}) {
  const page = Number(opts.page ?? 1);
  const limit = Number(opts.limit ?? 50);
  const sortKey = opts.sortKey ?? 'created_at';

  const sorted = [...rows].sort((a, b) => {
    const av = a?.[sortKey] ? new Date(a[sortKey]).getTime() : 0;
    const bv = b?.[sortKey] ? new Date(b[sortKey]).getTime() : 0;
    return bv - av;
  });

  const total = sorted.length;
  const offset = (page - 1) * limit;
  const data = sorted.slice(offset, offset + limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit) || 1),
    },
  };
}

/**
 * Resolve composite HQ id `orgUuid:rawId` to database + raw primary key.
 * @returns {Promise<{ db: import('knex').Knex, rawId: string, org: Record<string, unknown> | null } | null>}
 */
export async function resolveHqEntityTarget(compositeId) {
  const raw = String(compositeId ?? '');
  const sep = raw.indexOf(':');
  if (sep > 0) {
    const orgId = raw.slice(0, sep);
    const entityId = raw.slice(sep + 1);
    const org = await findDistributorOrgById(platformDb, orgId);
    if (!org?.database_name) return null;
    return {
      db: getDistributorKnex(org.database_name),
      rawId: entityId,
      org,
    };
  }
  return { db: platformDb, rawId: raw, org: null };
}
