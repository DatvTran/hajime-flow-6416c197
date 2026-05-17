import { platformDb } from '../config/database.mjs';
import { getDb } from '../config/request-db.mjs';
import { findTeamMemberByEmail } from './retail-portal.mjs';
import { resolveSalesRepLabelForUser } from './sales-rep-label.mjs';

/**
 * Parent distributor (users.id) for a logged-in sales rep.
 * 1) users.managed_by_distributor_user_id
 * 2) team_members (role sales_rep, same email) → managed_by_user_id
 * 3) single active distributor in tenant (demo / legacy)
 */
export async function resolveDistributorUserIdForSalesRep(db, tenantId, salesRepUser) {
  const userId = salesRepUser?.userId ?? salesRepUser?.id;
  const email = String(salesRepUser?.email ?? '').trim().toLowerCase();
  if (!tenantId || !userId) return null;

  const user = await platformDb('users')
    .where({ id: userId, tenant_id: tenantId })
    .whereNull('deleted_at')
    .first();

  if (user?.managed_by_distributor_user_id != null) {
    return Number(user.managed_by_distributor_user_id);
  }

  if (email) {
    const tm = await findTeamMemberByEmail(db, tenantId, email);
    if (tm?.role === 'sales_rep' && tm.managed_by_user_id != null) {
      return Number(tm.managed_by_user_id);
    }
  }

  const distributors = await platformDb('users')
    .where({ tenant_id: tenantId, role: 'distributor', is_active: true })
    .whereNull('deleted_at');

  if (distributors.length === 1) {
    return Number(distributors[0].id);
  }

  return null;
}

/** Account ids linked to retail CRM rows owned by this distributor. */
export async function linkedAccountIdsForDistributor(db, tenantId, distributorUserId) {
  const distId = distributorUserId != null ? Number(distributorUserId) : null;
  if (!tenantId || !distId) return [];

  return getDb()('team_members')
    .where({ tenant_id: tenantId, managed_by_user_id: distId })
    .whereNotNull('linked_account_id')
    .pluck('linked_account_id');
}

/** Sales rep portal user ids reporting to this distributor. */
export async function salesRepUserIdsForDistributor(db, tenantId, distributorUserId) {
  const distId = distributorUserId != null ? Number(distributorUserId) : null;
  if (!tenantId || !distId) return [];

  const fromUsers = await platformDb('users')
    .where({ tenant_id: tenantId, role: 'sales_rep', managed_by_distributor_user_id: distId })
    .whereNull('deleted_at')
    .pluck('id');

  const repEmails = await getDb()('team_members')
    .where({ tenant_id: tenantId, role: 'sales_rep', managed_by_user_id: distId })
    .pluck('email');

  if (repEmails.length === 0) return fromUsers.map(Number);

  const fromEmail = await platformDb('users')
    .where({ tenant_id: tenantId, role: 'sales_rep' })
    .whereIn(
      'email',
      repEmails.map((e) => String(e).toLowerCase()),
    )
    .whereNull('deleted_at')
    .pluck('id');

  return [...new Set([...fromUsers, ...fromEmail].map(Number))];
}

export function distributorOwnsTeamMemberRow(distributorUserId, memberRow) {
  const distId = distributorUserId != null ? String(distributorUserId) : '';
  if (!distId || !memberRow) return false;

  const owner =
    memberRow.managed_by_user_id != null && memberRow.managed_by_user_id !== ''
      ? String(memberRow.managed_by_user_id)
      : '';
  if (owner === distId) return true;

  return false;
}

/**
 * Distributor store invite: validate optional assigned rep (platform users.id or email).
 * @returns {{ repUserId: number, salesOwnerLabel: string } | { repUserId: null, salesOwnerLabel: null } | { error: string }}
 */
export async function resolveDistributorAssignedSalesRep({
  tenantId,
  distributorUserId,
  assignedSalesRepUserId = null,
  assignedSalesRepEmail = null,
}) {
  const idRaw =
    assignedSalesRepUserId != null && String(assignedSalesRepUserId).trim() !== ''
      ? Number(assignedSalesRepUserId)
      : null;
  const emailRaw =
    assignedSalesRepEmail != null ? String(assignedSalesRepEmail).trim().toLowerCase() : '';

  if (!idRaw && !emailRaw) {
    return { repUserId: null, salesOwnerLabel: null };
  }

  let repUser = null;
  if (idRaw != null && Number.isFinite(idRaw)) {
    repUser = await platformDb('users')
      .where({ id: idRaw, tenant_id: tenantId, role: 'sales_rep' })
      .whereNull('deleted_at')
      .first();
  } else if (emailRaw) {
    repUser = await platformDb('users')
      .where({ tenant_id: tenantId, role: 'sales_rep' })
      .whereRaw('LOWER(email) = ?', [emailRaw])
      .whereNull('deleted_at')
      .first();
  }

  if (!repUser) {
    return { error: 'Selected sales rep was not found.' };
  }

  const distId = distributorUserId != null ? Number(distributorUserId) : null;
  if (!distId) {
    return { error: 'Wholesaler identity is required to assign a sales rep.' };
  }

  const teamRepIds = await salesRepUserIdsForDistributor(getDb(), tenantId, distId);
  if (!teamRepIds.includes(Number(repUser.id))) {
    return { error: 'Selected sales rep is not on your team.' };
  }

  return {
    repUserId: Number(repUser.id),
    salesOwnerLabel: resolveSalesRepLabelForUser(repUser),
  };
}

export async function distributorCanAccessPendingRetail(db, tenantId, distributorUserId, memberRow) {
  if (!memberRow?.pending_distributor_approval) return false;
  if (distributorOwnsTeamMemberRow(distributorUserId, memberRow)) return true;

  const repIds = await salesRepUserIdsForDistributor(db, tenantId, distributorUserId);
  const requestedBy =
    memberRow.crm_requested_by_user_id != null
      ? Number(memberRow.crm_requested_by_user_id)
      : null;
  return requestedBy != null && repIds.includes(requestedBy);
}
