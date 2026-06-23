import { platformDb } from '../config/database.mjs';
import { resolveSalesRepLabelForUser } from './sales-rep-label.mjs';
import { linkAccountToDistributorDepot } from './retail-portal.mjs';

/**
 * Ensure a prospect retail account exists and is wired to wholesaler + assigned rep.
 * @returns {Promise<string>} account id
 */
export async function ensureRetailAccountForTeamMember(
  db,
  tenantId,
  memberRow,
  { distributorUserId, repUserId },
) {
  const repId =
    repUserId != null && Number.isFinite(Number(repUserId)) ? Number(repUserId) : null;
  const distId =
    distributorUserId != null && Number.isFinite(Number(distributorUserId))
      ? Number(distributorUserId)
      : null;

  let salesOwner = null;
  if (repId) {
    const repUser = await platformDb('users').where({ id: repId }).whereNull('deleted_at').first();
    if (repUser) {
      salesOwner = resolveSalesRepLabelForUser(repUser);
    }
  }

  const storeName =
    memberRow.retail_trading_name != null && String(memberRow.retail_trading_name).trim() !== ''
      ? String(memberRow.retail_trading_name).trim()
      : String(memberRow.name || memberRow.email || 'Retail store').trim();

  let accountId =
    memberRow.linked_account_id != null && String(memberRow.linked_account_id).trim() !== ''
      ? String(memberRow.linked_account_id).trim()
      : null;

  if (!accountId) {
    const [account] = await db('accounts')
      .insert({
        tenant_id: tenantId,
        name: storeName,
        trading_name: storeName,
        type: 'retail',
        market: '—',
        status: 'prospect',
        email: memberRow.email,
        phone: memberRow.phone || null,
        sales_owner: salesOwner || 'Unassigned',
        managed_by_distributor_user_id: distId,
        assigned_sales_rep_id: repId,
        payment_terms: 'Net 30',
      })
      .returning('*');
    accountId = String(account.id);

    await db('team_members')
      .where({ id: memberRow.id, tenant_id: tenantId })
      .update({
        linked_account_id: accountId,
        retail_trading_name: storeName,
        updated_at: new Date(),
      });
  } else {
    const patch = { updated_at: new Date() };
    if (distId) patch.managed_by_distributor_user_id = distId;
    if (repId) {
      patch.assigned_sales_rep_id = repId;
      if (salesOwner) patch.sales_owner = salesOwner;
    }
    await db('accounts').where({ id: accountId, tenant_id: tenantId }).whereNull('deleted_at').update(patch);
  }

  if (distId && accountId) {
    const distUser = await platformDb('users').where({ id: distId }).first();
    if (distUser?.email) {
      await linkAccountToDistributorDepot(db, tenantId, distUser.email, accountId);
    }
  }

  return accountId;
}
