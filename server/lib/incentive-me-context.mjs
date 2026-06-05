/**
 * Resolve CRM / account links for GET /supply-chain-incentives/me.
 */

/**
 * @param {import('knex').Knex} db
 * @param {string} tenantId
 * @param {{ id: string | number, role: string, email?: string, retailAccountTradingName?: string | null }} user
 * @param {string} [tradingNameQuery]
 */
export async function loadIncentiveMeContext(db, tenantId, user, tradingNameQuery = '') {
  const emailLower = String(user.email || '')
    .trim()
    .toLowerCase();

  const tm = emailLower
    ? await db('team_members')
        .where({ tenant_id: tenantId, email: emailLower })
        .where('is_active', true)
        .first()
    : null;

  const teamMember = tm
    ? {
        name: String(tm.name ?? '').trim(),
        retailTradingName: tm.retail_trading_name ? String(tm.retail_trading_name).trim() : null,
        linkedAccountId: tm.linked_account_id ? String(tm.linked_account_id) : null,
      }
    : null;

  let retailTradingName = null;
  if (user.role === 'retail' || user.role === 'retail_account') {
    const fromQuery = String(tradingNameQuery || '').trim();
    retailTradingName =
      fromQuery ||
      (user.retailAccountTradingName ? String(user.retailAccountTradingName).trim() : '') ||
      teamMember?.retailTradingName ||
      null;
  }

  let linkedAccountTradingName = null;
  if (user.role === 'distributor') {
    const distUserId = user.id != null ? Number(user.id) : NaN;
    if (Number.isFinite(distUserId)) {
      const distAccount = await db('accounts')
        .where({ tenant_id: tenantId })
        .where('managed_by_distributor_user_id', distUserId)
        .whereNull('deleted_at')
        .orderBy('id', 'desc')
        .first();

      if (distAccount?.trading_name) {
        linkedAccountTradingName = String(distAccount.trading_name).trim();
      }
    }

    if (!linkedAccountTradingName && teamMember?.linkedAccountId) {
      const linked = await db('accounts')
        .where({ tenant_id: tenantId, id: teamMember.linkedAccountId })
        .whereNull('deleted_at')
        .first();
      if (linked?.trading_name) {
        linkedAccountTradingName = String(linked.trading_name).trim();
      }
    }
  }

  return {
    teamMember,
    retailTradingName,
    linkedAccountTradingName,
  };
}
