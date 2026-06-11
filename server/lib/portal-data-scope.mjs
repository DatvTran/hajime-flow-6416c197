import { Role } from '../rbac/permissions.mjs';
import { linkedAccountIdsForDistributor } from './distributor-scope.mjs';
import { findTeamMemberByEmail } from './retail-portal.mjs';
import { normalizeRepLabel, resolveSalesRepLabelForUser } from './sales-rep-label.mjs';

/**
 * Retail portal user → linked on-premise account.
 * @returns {{ accountId: string, tradingName: string | null } | null}
 */
export async function retailPortalContext(db, tenantId, user) {
  const email = String(user?.email ?? '')
    .trim()
    .toLowerCase();
  if (!tenantId || !email) return null;

  const tm = await findTeamMemberByEmail(db, tenantId, email);
  if (!tm || tm.role !== 'retail' || tm.is_active === false) return null;

  const accountId =
    tm.linked_account_id != null && String(tm.linked_account_id).trim() !== ''
      ? String(tm.linked_account_id).trim()
      : '';
  if (!accountId) return null;

  const acc = await db('accounts')
    .where({ id: accountId, tenant_id: tenantId })
    .whereNull('deleted_at')
    .first();

  const tradingName =
    tm.retail_trading_name != null && String(tm.retail_trading_name).trim() !== ''
      ? String(tm.retail_trading_name).trim()
      : acc?.trading_name || acc?.name
        ? String(acc.trading_name || acc.name).trim()
        : null;

  return { accountId, tradingName };
}

/** Account PKs a distributor may fulfill orders for. */
export async function distributorManagedAccountIds(db, tenantId, distributorUserId) {
  const distId = distributorUserId != null ? Number(distributorUserId) : NaN;
  if (!tenantId || !Number.isFinite(distId)) return [];

  const linked = await linkedAccountIdsForDistributor(db, tenantId, distId);
  const managed = await db('accounts')
    .where({ tenant_id: tenantId, managed_by_distributor_user_id: distId })
    .whereNull('deleted_at')
    .pluck('id');

  return [...new Set([...linked, ...managed].map((id) => String(id)))];
}

/**
 * @param {import('knex').Knex.QueryBuilder} qb — `sales_orders` query
 */
export function applySalesRepOrdersScope(qb, db, tenantId, user) {
  const repNorm = normalizeRepLabel(resolveSalesRepLabelForUser(user));
  const userId = user?.userId;

  return qb.where(function scopeRepOrders() {
    this.whereRaw('LOWER(TRIM(COALESCE(sales_orders.sales_rep, ?))) = ?', ['', repNorm]);
    if (userId) {
      this.orWhereIn('sales_orders.account_id', function sub() {
        sub
          .select('id')
          .from('accounts')
          .where({ tenant_id: tenantId })
          .whereNull('deleted_at')
          .where(function () {
            this.where('assigned_sales_rep_id', userId).orWhereRaw(
              'LOWER(TRIM(COALESCE(sales_owner, ?))) = ?',
              ['', repNorm],
            );
          });
      });
      this.orWhereIn('sales_orders.account_id', function crmSub() {
        crmSub
          .select('linked_account_id')
          .from('team_members')
          .where({ tenant_id: tenantId, crm_requested_by_user_id: userId })
          .whereNotNull('linked_account_id');
      });
    }
  });
}

export async function applyDistributorOrdersScope(qb, db, tenantId, user) {
  const ids = await distributorManagedAccountIds(db, tenantId, user?.userId);
  if (ids.length === 0) return qb.whereRaw('1 = 0');
  return qb.whereIn('sales_orders.account_id', ids);
}

export async function applyRetailOrdersScope(qb, db, tenantId, user) {
  const ctx = await retailPortalContext(db, tenantId, user);
  if (!ctx?.accountId) return qb.whereRaw('1 = 0');
  return qb.where('sales_orders.account_id', ctx.accountId);
}

export async function applyPortalOrdersScope(qb, db, tenantId, user) {
  const role = user?.role;
  if (role === Role.DISTRIBUTOR) return applyDistributorOrdersScope(qb, db, tenantId, user);
  if (role === Role.SALES_REP || role === Role.SALES) {
    return applySalesRepOrdersScope(qb, db, tenantId, user);
  }
  if (role === Role.RETAIL) return applyRetailOrdersScope(qb, db, tenantId, user);
  return qb;
}

function salesOrderIdsSubquery(db, tenantId, accountIds) {
  return db('sales_orders')
    .select('id')
    .where({ tenant_id: tenantId })
    .whereNull('deleted_at')
    .whereIn('account_id', accountIds);
}

export async function applyRetailShipmentsScope(qb, db, tenantId, user) {
  const ctx = await retailPortalContext(db, tenantId, user);
  if (!ctx?.accountId) return qb.whereRaw('1 = 0');
  return qb
    .where('shipments.order_type', 'sales_order')
    .whereIn('shipments.order_id', salesOrderIdsSubquery(db, tenantId, [ctx.accountId]));
}

export async function applySalesRepShipmentsScope(qb, db, tenantId, user) {
  const repNorm = normalizeRepLabel(resolveSalesRepLabelForUser(user));
  const userId = user?.userId;

  let ids = await db('accounts')
    .where({ tenant_id: tenantId })
    .whereNull('deleted_at')
    .where(function () {
      this.whereRaw('LOWER(TRIM(COALESCE(sales_owner, ?))) = ?', ['', repNorm]);
      if (userId) this.orWhere('assigned_sales_rep_id', userId);
    })
    .pluck('id');

  if (userId) {
    const crmLinked = await db('team_members')
      .where({ tenant_id: tenantId, crm_requested_by_user_id: userId })
      .whereNotNull('linked_account_id')
      .pluck('linked_account_id');
    ids = [...ids, ...crmLinked];
  }

  ids = [...new Set(ids.map(String))];
  if (ids.length === 0) {
    return qb
      .where('shipments.order_type', 'sales_order')
      .whereRaw('1 = 0');
  }

  return qb
    .where('shipments.order_type', 'sales_order')
    .whereIn('shipments.order_id', salesOrderIdsSubquery(db, tenantId, ids));
}

export async function applyPortalShipmentsScope(qb, db, tenantId, user) {
  const role = user?.role;
  if (role === Role.RETAIL) return applyRetailShipmentsScope(qb, db, tenantId, user);
  if (role === Role.SALES_REP || role === Role.SALES) {
    return applySalesRepShipmentsScope(qb, db, tenantId, user);
  }
  return qb;
}

/** Resolve route/body id (numeric PK or order_number like SO-2025-001). */
export async function resolveSalesOrderPk(db, tenantId, idOrNumber) {
  const raw = String(idOrNumber ?? '').trim();
  if (!raw) return null;

  if (/^\d+$/.test(raw)) {
    const n = Number(raw);
    const row = await db('sales_orders')
      .where({ id: n, tenant_id: tenantId })
      .whereNull('deleted_at')
      .first();
    return row ? Number(row.id) : null;
  }

  const row = await db('sales_orders')
    .where({ tenant_id: tenantId, order_number: raw })
    .whereNull('deleted_at')
    .first();
  return row ? Number(row.id) : null;
}

export async function assertCanAccessSalesOrder(db, tenantId, user, orderRow) {
  if (!orderRow) {
    return { ok: false, status: 404, error: 'Order not found' };
  }

  const role = user?.role;
  if (
    role === Role.FOUNDER_ADMIN ||
    role === Role.BRAND_OPERATOR ||
    role === Role.OPERATIONS ||
    role === Role.FINANCE ||
    role === Role.MANUFACTURER
  ) {
    return { ok: true };
  }

  if (role === Role.DISTRIBUTOR) {
    const ids = await distributorManagedAccountIds(db, tenantId, user?.userId);
    if (ids.includes(String(orderRow.account_id))) return { ok: true };
    return {
      ok: false,
      status: 403,
      error: 'You can only access orders for accounts in your distribution network.',
    };
  }

  if (role === Role.SALES_REP || role === Role.SALES) {
    const repNorm = normalizeRepLabel(resolveSalesRepLabelForUser(user));
    const orderRep = normalizeRepLabel(orderRow.sales_rep);
    if (orderRep === repNorm && orderRep !== '') return { ok: true };

    const acc = await db('accounts')
      .where({ id: orderRow.account_id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .first();
    if (acc) {
      const ownerNorm = normalizeRepLabel(acc.sales_owner);
      if (ownerNorm === repNorm) return { ok: true };
      if (
        user?.userId &&
        acc.assigned_sales_rep_id != null &&
        String(acc.assigned_sales_rep_id) === String(user.userId)
      ) {
        return { ok: true };
      }
    }
    return {
      ok: false,
      status: 403,
      error: 'You can only access orders for your accounts and territory.',
    };
  }

  if (role === Role.RETAIL) {
    const ctx = await retailPortalContext(db, tenantId, user);
    if (ctx && String(orderRow.account_id) === ctx.accountId) return { ok: true };
    return {
      ok: false,
      status: 403,
      error: 'You can only access orders for your store account.',
    };
  }

  return { ok: true };
}

/** Attach `sales_order_number` for client order linking on shipment rows. */
export async function hydrateShipmentsWithOrderNumbers(db, tenantId, shipmentRows) {
  if (!Array.isArray(shipmentRows) || shipmentRows.length === 0) return shipmentRows;

  const soIds = [
    ...new Set(
      shipmentRows
        .filter((r) => r.order_type === 'sales_order' && r.order_id != null)
        .map((r) => Number(r.order_id))
        .filter((n) => Number.isFinite(n)),
    ),
  ];

  if (soIds.length === 0) return shipmentRows;

  const orders = await db('sales_orders')
    .where({ tenant_id: tenantId })
    .whereIn('id', soIds)
    .select('id', 'order_number', 'account_id', 'status');

  const byId = new Map(orders.map((o) => [Number(o.id), o]));

  return shipmentRows.map((row) => {
    if (row.order_type !== 'sales_order' || row.order_id == null) return row;
    const so = byId.get(Number(row.order_id));
    if (!so) return row;
    return {
      ...row,
      sales_order_number: so.order_number,
      sales_order_status: so.status,
      sales_order_account_id: so.account_id,
    };
  });
}
