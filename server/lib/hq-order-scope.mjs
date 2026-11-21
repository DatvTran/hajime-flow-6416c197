/** Brand HQ sell-in targets wholesalers only (API may store distributor or wholesaler). */
export const WHOLESALE_ACCOUNT_TYPES = ['distributor', 'wholesaler', 'Distributor', 'Wholesaler'];

/**
 * HQ wholesale order filter — call after `sales_orders` is joined to `accounts`.
 * @param {import('knex').Knex.QueryBuilder} qb
 */
export function applyHqWholesaleOrdersScope(qb) {
  return qb.whereRaw("lower(trim(coalesce(accounts.type, ''))) in ('distributor', 'wholesaler')");
}
