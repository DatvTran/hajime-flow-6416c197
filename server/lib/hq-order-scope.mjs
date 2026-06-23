/** Brand HQ sell-in targets wholesalers only. */
export const WHOLESALE_ACCOUNT_TYPES = ['distributor'];

/**
 * HQ wholesale order filter — call after `sales_orders` is joined to `accounts`.
 * @param {import('knex').Knex.QueryBuilder} qb
 */
export function applyHqWholesaleOrdersScope(qb) {
  return qb.whereIn('accounts.type', WHOLESALE_ACCOUNT_TYPES);
}
