/**
 * Single-request app bootstrap — parallel DB reads, platform-first for HQ.
 * Replaces 11 sequential HTTP round-trips on initial load.
 */
import { getDb } from '../config/request-db.mjs';
import { platformDb } from '../config/database.mjs';
import { hqFetchForScope } from './hq-global-view.mjs';
import { hasPermission, Permission, Role } from '../rbac/permissions.mjs';
import {
  applyPortalOrdersScope,
  applyPortalShipmentsScope,
  distributorManagedAccountIds,
  hydrateShipmentsWithOrderNumbers,
} from './portal-data-scope.mjs';

const LIMITS = {
  products: 300,
  accounts: 300,
  orders: 100,
  inventory: 150,
  purchaseOrders: 120,
  shipments: 80,
  depletionReports: 100,
  newProductRequests: 50,
  teamMembers: 120,
  warehouses: 50,
};

async function scopedRows(req, fetchRows, scope) {
  const tenantId = req.user?.tenantId ?? null;
  if (req.hqGlobalView) {
    return hqFetchForScope(tenantId, fetchRows, scope);
  }
  if (!tenantId) return [];
  return (await fetchRows(getDb(), tenantId, null)) || [];
}

async function fetchProducts(req, scope) {
  const limit = LIMITS.products;
  const rows = await scopedRows(
    req,
    async (db, tid) => {
      if (!tid) return [];
      return db('products')
        .where({ tenant_id: tid })
        .whereNull('deleted_at')
        .orderBy('created_at', 'desc')
        .limit(limit);
    },
    scope,
  );
  return rows.slice(0, limit);
}

async function fetchAccounts(req, scope) {
  const limit = LIMITS.accounts;
  const rows = await scopedRows(
    req,
    async (db, tid) => {
      if (!tid) return [];
      return db('accounts')
        .where({ tenant_id: tid })
        .whereNull('deleted_at')
        .orderBy('created_at', 'desc')
        .limit(limit);
    },
    scope,
  );
  return rows.slice(0, limit);
}

async function fetchOrders(req, scope) {
  const limit = LIMITS.orders;
  const rows = await scopedRows(
    req,
    async (db, tid) => {
      if (!tid) return [];
      let q = db('sales_orders')
        .where('sales_orders.tenant_id', tid)
        .whereNull('sales_orders.deleted_at');
      if (req.user?.role === Role.DISTRIBUTOR) {
        const accountIds = await distributorManagedAccountIds(db, tid, req.user.userId);
        q =
          accountIds.length === 0
            ? q.whereRaw('1 = 0')
            : q.whereIn('sales_orders.account_id', accountIds);
      } else {
        q = await applyPortalOrdersScope(q, db, tid, req.user);
      }
      return q
        .leftJoin('accounts', 'sales_orders.account_id', 'accounts.id')
        .select(
          'sales_orders.*',
          'accounts.name as account_name',
          'accounts.account_number',
          'accounts.trading_name as account_trading_name',
        )
        .orderBy('sales_orders.created_at', 'desc')
        .limit(limit);
    },
    scope,
  );
  return rows.slice(0, limit);
}

async function fetchInventory(req, scope) {
  const limit = LIMITS.inventory;
  const rows = await scopedRows(
    req,
    async (db, tid) => {
      if (!tid) return [];
      return db('inventory')
        .where('inventory.tenant_id', tid)
        .join('products', 'inventory.product_id', 'products.id')
        .whereNull('products.deleted_at')
        .select(
          'inventory.*',
          'products.sku',
          'products.name as product_name',
          'products.category',
        )
        .orderBy('products.name')
        .limit(limit);
    },
    scope,
  );
  return rows.slice(0, limit);
}

async function fetchPurchaseOrders(req, scope) {
  const limit = LIMITS.purchaseOrders;
  const orders = await scopedRows(
    req,
    async (db, tid) => {
      if (!tid) return [];
      const list = await db('purchase_orders')
        .where({ tenant_id: tid })
        .whereNull('deleted_at')
        .orderBy('created_at', 'desc')
        .limit(limit);
      const ids = list.map((o) => o.id).filter(Boolean);
      const itemsByPo = new Map();
      if (ids.length > 0) {
        const itemRows = await db('purchase_order_items')
          .where({ tenant_id: tid })
          .whereIn('purchase_order_id', ids)
          .orderBy('id', 'asc');
        for (const row of itemRows) {
          const pid = row.purchase_order_id;
          if (!itemsByPo.has(pid)) itemsByPo.set(pid, []);
          itemsByPo.get(pid).push(row);
        }
      }
      return list.map((o) => ({ ...o, items: itemsByPo.get(o.id) || [] }));
    },
    scope,
  );
  return orders.slice(0, limit);
}

async function fetchShipments(req, scope) {
  const limit = LIMITS.shipments;
  const rows = await scopedRows(
    req,
    async (db, tid) => {
      if (!tid) return [];
      let q = db('shipments').where({ tenant_id: tid }).whereNull('deleted_at');
      q = await applyPortalShipmentsScope(q, db, tid, req.user);
      const list = await q.orderBy('created_at', 'desc').limit(limit);
      return hydrateShipmentsWithOrderNumbers(db, tid, list);
    },
    scope,
  );
  return rows.slice(0, limit);
}

async function fetchDepletionReports(req, scope) {
  const limit = LIMITS.depletionReports;
  const rows = await scopedRows(
    req,
    async (db, tid) => {
      if (!tid) return [];
      return db('depletion_reports')
        .where({ tenant_id: tid })
        .orderBy('created_at', 'desc')
        .limit(limit);
    },
    scope,
  );
  return rows.slice(0, limit);
}

async function fetchNewProductRequests(req, scope) {
  const limit = LIMITS.newProductRequests;
  const rows = await scopedRows(
    req,
    async (db, tid) => {
      if (!tid) return [];
      return db('new_product_requests')
        .where({ tenant_id: tid })
        .orderBy('requested_at', 'desc')
        .limit(limit);
    },
    scope,
  );
  return rows.slice(0, limit);
}

async function fetchTeamMembers(req, scope) {
  const limit = LIMITS.teamMembers;
  const rows = await scopedRows(
    req,
    async (db, tid) => {
      if (!tid) return [];
      return db('team_members')
        .where({ tenant_id: tid })
        .orderBy('created_at', 'desc')
        .limit(limit);
    },
    scope,
  );
  return rows.slice(0, limit);
}

async function fetchWarehouses(req, scope) {
  const limit = LIMITS.warehouses;
  const rows = await scopedRows(
    req,
    async (db, tid) => {
      if (!tid) return [];
      return db('warehouses')
        .where({ tenant_id: tid })
        .orderBy('sort_order', 'asc')
        .orderBy('name', 'asc')
        .limit(limit);
    },
    scope,
  );
  return rows.slice(0, limit);
}

async function fetchOperationalSettings(req) {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return null;
  try {
    if (req.hqGlobalView) {
      let settings = await platformDb('operational_settings').where({ tenant_id: tenantId }).first();
      if (!settings) {
        const [created] = await platformDb('operational_settings')
          .insert({ tenant_id: tenantId })
          .returning('*');
        settings = created;
      }
      return settings;
    }
    let settings = await getDb('operational_settings').where({ tenant_id: tenantId }).first();
    if (!settings) {
      const [created] = await getDb('operational_settings')
        .insert({ tenant_id: tenantId })
        .returning('*');
      settings = created;
    }
    return settings;
  } catch {
    return null;
  }
}

/**
 * @param {import('express').Request} req
 * @param {{ scope?: 'platform' | 'full' }} opts
 */
export async function buildAppBootstrapPayload(req, opts = {}) {
  const scope = opts.scope === 'full' ? 'full' : 'platform';
  const role = req.user?.role;
  const started = Date.now();

  const tasks = [];

  if (hasPermission(role, Permission.INVENTORY_READ)) {
    tasks.push(
      fetchProducts(req, scope).then((data) => ({ key: 'products', data })),
      fetchInventory(req, scope).then((data) => ({ key: 'inventory', data })),
    );
  }
  if (hasPermission(role, Permission.ACCOUNTS_READ)) {
    tasks.push(fetchAccounts(req, scope).then((data) => ({ key: 'accounts', data })));
  }
  if (hasPermission(role, Permission.ORDERS_READ)) {
    tasks.push(fetchOrders(req, scope).then((data) => ({ key: 'orders', data })));
  }
  if (hasPermission(role, Permission.PO_READ)) {
    tasks.push(fetchPurchaseOrders(req, scope).then((data) => ({ key: 'purchaseOrders', data })));
  }
  if (hasPermission(role, Permission.SHIPMENTS_READ)) {
    tasks.push(fetchShipments(req, scope).then((data) => ({ key: 'shipments', data })));
  }
  if (hasPermission(role, Permission.INVENTORY_READ)) {
    tasks.push(
      fetchDepletionReports(req, scope).then((data) => ({ key: 'depletionReports', data })),
    );
  }
  if (hasPermission(role, Permission.PRODUCTION_READ)) {
    tasks.push(
      fetchNewProductRequests(req, scope).then((data) => ({ key: 'newProductRequests', data })),
    );
  }
  if (hasPermission(role, Permission.USERS_READ) || hasPermission(role, Permission.ACCOUNTS_READ)) {
    tasks.push(fetchTeamMembers(req, scope).then((data) => ({ key: 'teamMembers', data })));
  }
  if (hasPermission(role, Permission.SETTINGS_READ) || hasPermission(role, Permission.INVENTORY_READ)) {
    tasks.push(fetchWarehouses(req, scope).then((data) => ({ key: 'warehouses', data })));
    tasks.push(
      fetchOperationalSettings(req).then((data) => ({ key: 'operationalSettings', data })),
    );
  }

  const settled = await Promise.allSettled(tasks);
  const payload = {
    products: [],
    accounts: [],
    orders: [],
    inventory: [],
    purchaseOrders: [],
    shipments: [],
    depletionReports: [],
    newProductRequests: [],
    teamMembers: [],
    warehouses: [],
    operationalSettings: null,
  };

  for (const result of settled) {
    if (result.status !== 'fulfilled') {
      console.error('[bootstrap] slice failed:', result.reason?.message || result.reason);
      continue;
    }
    const { key, data } = result.value;
    payload[key] = data;
  }

  return {
    ...payload,
    meta: {
      scope,
      ms: Date.now() - started,
    },
  };
}
