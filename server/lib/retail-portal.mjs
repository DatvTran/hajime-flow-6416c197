import { hasPermission, Permission } from '../rbac/permissions.mjs';

export const ON_PREMISE_ACCOUNT_TYPES = new Set(['retail', 'bar', 'restaurant', 'hotel']);

export function isOnPremiseAccountType(type) {
  return ON_PREMISE_ACCOUNT_TYPES.has(String(type ?? '').toLowerCase());
}

/**
 * @param {import('knex').Knex} db
 * @param {string} tenantId
 * @param {string} email
 */
export async function findTeamMemberByEmail(db, tenantId, email) {
  const em = String(email ?? '')
    .trim()
    .toLowerCase();
  if (!em) return null;
  return db('team_members').where({ tenant_id: tenantId, email: em }).first();
}

/**
 * @param {import('knex').Knex} db
 * @param {string} tenantId
 * @param {string} userEmail
 */
export async function findDistributorTeamMemberByEmail(db, tenantId, userEmail) {
  const row = await findTeamMemberByEmail(db, tenantId, userEmail);
  if (!row || row.role !== 'distributor' || row.is_active === false) return null;
  return row;
}

/**
 * @param {import('knex').Knex} db
 * @param {string} tenantId
 * @param {string} accountId
 */
export async function loadAccountForPortal(db, tenantId, accountId) {
  return db('accounts')
    .where({ id: accountId, tenant_id: tenantId })
    .whereNull('deleted_at')
    .first();
}

/**
 * Uses same depot bridge as outbound shipments (warehouses.linked_account_id).
 * @param {import('knex').Knex} db
 * @param {string} tenantId
 * @param {object} distributorTeamMemberRow
 * @param {string} accountId
 * @param {(distributors: object[], warehouseRows: object[], accountIdStr: string) => object[]} bridgeFn
 */
export async function distributorTeamMemberManagesAccountViaDepot(
  db,
  tenantId,
  distributorTeamMemberRow,
  accountId,
  bridgeFn,
) {
  if (!distributorTeamMemberRow || !accountId) return false;
  const warehouses = await db('warehouses').where({ tenant_id: tenantId });
  const matched = bridgeFn([distributorTeamMemberRow], warehouses, String(accountId));
  return matched.length > 0;
}

/**
 * @param {import('knex').Knex} db
 * @param {object} reqUser — req.user
 * @param {string} tenantId
 * @param {string} accountId
 * @param {(distributors: object[], warehouseRows: object[], accountIdStr: string) => object[]} bridgeFn
 */
export async function assertCanManageRetailPortalUsers(db, reqUser, tenantId, accountId, bridgeFn) {
  const account = await loadAccountForPortal(db, tenantId, accountId);
  if (!account) {
    return { ok: false, status: 404, error: 'Account not found', account: null };
  }
  if (!isOnPremiseAccountType(account.type)) {
    return {
      ok: false,
      status: 400,
      error: 'Portal users can only be added to on-premise retail accounts.',
      account,
    };
  }

  if (hasPermission(reqUser.role, Permission.SETTINGS_WRITE)) {
    return { ok: true, account };
  }

  if (reqUser.role !== 'distributor') {
    return {
      ok: false,
      status: 403,
      error: 'Only the managing wholesaler/distributor can add or remove retail portal users.',
      account,
    };
  }

  const distTm = await findDistributorTeamMemberByEmail(db, tenantId, reqUser.email);
  if (!distTm) {
    return {
      ok: false,
      status: 403,
      error: 'Your distributor CRM profile is required to manage retail portal users.',
      account,
    };
  }

  const viaDepot = await distributorTeamMemberManagesAccountViaDepot(
    db,
    tenantId,
    distTm,
    accountId,
    bridgeFn,
  );
  if (!viaDepot) {
    return {
      ok: false,
      status: 403,
      error:
        'This account is not linked to your receiving depot. Link the account in Brand HQ → Settings → Warehouses first.',
      account,
    };
  }

  return { ok: true, account };
}

/**
 * @param {import('knex').Knex} db
 * @param {string} tenantId
 * @param {string} accountId
 */
export async function listRetailPortalUsersForAccount(db, tenantId, accountId) {
  return db('team_members')
    .where({
      tenant_id: tenantId,
      role: 'retail',
      linked_account_id: accountId,
    })
    .where(function activeOrPending() {
      this.where('is_active', true).orWhere('pending_distributor_approval', true);
    })
    .orderBy('created_at', 'desc');
}

/**
 * @param {object} row — team_members row
 */
export function serializePortalUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? null,
    isActive: row.is_active !== false,
    pendingDistributorApproval: Boolean(row.pending_distributor_approval),
    linkedAccountId: row.linked_account_id ?? null,
    retailTradingName: row.retail_trading_name ?? null,
    managedByUserId:
      row.managed_by_user_id != null && row.managed_by_user_id !== ''
        ? String(row.managed_by_user_id)
        : null,
    createdAt: row.created_at,
  };
}

const DEFAULT_NOTIFICATION_PREFS = {
  order: true,
  delivery: true,
  backbar: true,
  partner: true,
  products: false,
  invoice: true,
  digest: false,
};

/**
 * @param {unknown} raw
 */
export function normalizeNotificationPrefs(raw) {
  const base = { ...DEFAULT_NOTIFICATION_PREFS };
  if (!raw || typeof raw !== 'object') return base;
  const o = /** @type {Record<string, unknown>} */ (raw);
  for (const key of Object.keys(base)) {
    if (typeof o[key] === 'boolean') base[key] = o[key];
  }
  return base;
}

/**
 * @param {import('knex').Knex} db
 * @param {string} tenantId
 * @param {number|string} userId
 */
export async function loadRetailPortalSettings(db, tenantId, userId) {
  return db('retail_portal_settings').where({ tenant_id: tenantId, user_id: userId }).first();
}

/**
 * After a distributor creates an on-premise account, link it to their receiving depot
 * so portal-user management and shipment routing work.
 */
export async function linkAccountToDistributorDepot(db, tenantId, distributorEmail, accountId) {
  const distTm = await findDistributorTeamMemberByEmail(db, tenantId, distributorEmail);
  if (!distTm || !accountId) return { linked: false, reason: 'no_distributor_crm' };

  const pwRaw = distTm.primary_warehouse_id;
  if (pwRaw != null && String(pwRaw).trim() !== '') {
    const wid = String(pwRaw).trim();
    const updated = await db('warehouses')
      .where({ id: wid, tenant_id: tenantId })
      .update({ linked_account_id: String(accountId), updated_at: new Date() });
    if (updated > 0) return { linked: true, warehouseId: wid };
  }

  const wh = await db('warehouses')
    .where({ tenant_id: tenantId, linked_team_member_id: String(distTm.id), is_active: true })
    .first();
  if (wh) {
    await db('warehouses')
      .where({ id: wh.id, tenant_id: tenantId })
      .update({ linked_account_id: String(accountId), updated_at: new Date() });
    return { linked: true, warehouseId: wh.id };
  }

  return { linked: false, reason: 'no_depot' };
}
