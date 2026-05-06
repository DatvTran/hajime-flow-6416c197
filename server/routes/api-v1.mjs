/**
 * Granular API Routes - v1
 * RESTful endpoints for products, orders, accounts, inventory
 * With full RBAC protection
 */
import { Router } from 'express';
import { db } from '../config/database.mjs';
import {
  authenticateToken,
  requireAnyPermission,
  requirePermission,
  requireTenantAccess,
} from '../middleware/auth.mjs';
import { Permission, Role, hasPermission } from '../rbac/permissions.mjs';
import {
  createCrmUserInvite,
  sendCrmInviteEmail,
  CRM_TEAM_ROLE_LABELS,
} from '../services/crm-invite.mjs';

const router = Router();
const isDev = process.env.NODE_ENV === 'development';

/** After creating/reactivating a CRM contact, optionally send portal invite email. */
async function buildCrmContactInvitePayload(req, tenantId, member, { email, name, role }) {
  const invitedByUserId = req.user?.userId;
  if (!invitedByUserId) {
    return {
      data: member,
      invite: { status: 'skipped', reason: 'missing_inviter' },
    };
  }

  const inviteResult = await createCrmUserInvite({
    tenantId,
    email,
    teamMemberRole: role,
    invitedByUserId,
  });

  if (!inviteResult.ok) {
    return {
      data: member,
      invite: { status: 'skipped', reason: inviteResult.reason },
    };
  }

  try {
    const tenantRow = await db('tenants').where({ id: tenantId }).first();
    const sendResult = await sendCrmInviteEmail({
      to: email,
      inviteUrl: inviteResult.inviteUrl,
      recipientName: name,
      roleLabel: CRM_TEAM_ROLE_LABELS[role] || role,
      inviterDisplayName: req.user?.displayName,
      tenantName: tenantRow?.name,
    });

    const exposeInviteUrl = isDev || !sendResult.sent;
    return {
      data: member,
      invite: {
        status: 'sent',
        emailDispatched: sendResult.sent,
        ...(exposeInviteUrl && { inviteUrl: inviteResult.inviteUrl }),
      },
    };
  } catch (emailErr) {
    console.error('[API v1] CRM invite email failed:', emailErr);
    return {
      data: member,
      invite: {
        status: 'delivery_failed',
        inviteUrl: inviteResult.inviteUrl,
      },
    };
  }
}

/**
 * Set or clear a distributor's receiving warehouse: team_members.primary_warehouse_id
 * and warehouses.linked_team_member_id (at most one depot per distributor).
 * @param {import('knex').Knex.Transaction} trx
 * @param {string|null} wid - non-empty warehouse id, or null to clear
 */
async function setDistributorReceivingWarehouse(trx, tenantId, memberId, wid) {
  const id = wid && String(wid).trim() ? String(wid).trim() : null;
  if (id) {
    const wh = await trx('warehouses').where({ id, tenant_id: tenantId }).first();
    if (!wh) {
      const err = new Error('Warehouse not found');
      err.status = 404;
      throw err;
    }
    if (!wh.is_active) {
      const err = new Error('That warehouse is inactive.');
      err.status = 400;
      throw err;
    }
  }

  await trx('warehouses')
    .where({ tenant_id: tenantId, linked_team_member_id: memberId })
    .update({ linked_team_member_id: null, updated_at: new Date() });

  if (id) {
    await trx('warehouses')
      .where({ id, tenant_id: tenantId })
      .update({ linked_team_member_id: memberId, updated_at: new Date() });
  }

  await trx('team_members')
    .where({ id: memberId, tenant_id: tenantId })
    .update({
      primary_warehouse_id: id,
      updated_at: new Date(),
    });
}

function parseOptionalPrimaryWarehouseId(body) {
  if (!body) return undefined;
  const has =
    Object.prototype.hasOwnProperty.call(body, 'primary_warehouse_id') ||
    Object.prototype.hasOwnProperty.call(body, 'primaryWarehouseId');
  if (!has) return undefined;
  const v = body.primary_warehouse_id ?? body.primaryWarehouseId;
  if (v === null || v === '') return null;
  return String(v).trim();
}

// Apply auth to all routes
router.use(authenticateToken);
router.use(requireTenantAccess);

// Helper to get tenantId from authenticated user — throws 403 if missing to prevent cross-tenant leakage
function getTenantId(req, res) {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    res.status(403).json({ error: 'Tenant identity missing from token' });
    return null;
  }
  return tenantId;
}

/** Normalize multi-line / duplicate spaces for fuzzy CRM ↔ account matching. */
function normalizeReceivingLabelPart(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/** Conservative fuzzy equality for trading / CRM display names */
function receivingLabelsLikelySame(a, b) {
  const x = normalizeReceivingLabelPart(a);
  const y = normalizeReceivingLabelPart(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const min = 4;
  if (x.length < min || y.length < min) return false;
  return x.includes(y) || y.includes(x);
}

/**
 * Fuzzy name match CRM distributor ↔ commercial account when emails differ.
 */
function distributorTeamMemberMatchesSalesOrderAccountByName(tm, joinAccount, orderJoined) {
  if (!tm || String(tm.role ?? '') !== 'distributor') return false;
  const tmName = normalizeReceivingLabelPart(tm.name);
  const hints = [
    joinAccount?.trading_name,
    joinAccount?.name,
    orderJoined?.account_trading_name,
    orderJoined?.account_name,
  ];
  for (const h of hints) {
    if (receivingLabelsLikelySame(tmName, h)) return true;
  }
  return false;
}

/**
 * Prefer **exact wholesale account email** vs `team_members.email` so one distributor CRM row wins
 * (avoids stacking unrelated depots when trading names collide).
 */
function distributorsForSalesOrderReceivingDepots(distributors, joinAccount, orderJoined) {
  const ae = normalizeReceivingLabelPart(joinAccount?.email);
  if (ae) {
    const byEmail = distributors.filter((tm) => normalizeReceivingLabelPart(tm.email) === ae);
    if (byEmail.length > 0) {
      return { matched: byEmail, match_basis: 'account_email' };
    }
  }
  const byName = distributors.filter((tm) =>
    distributorTeamMemberMatchesSalesOrderAccountByName(tm, joinAccount, orderJoined),
  );
  return {
    matched: byName,
    match_basis: byName.length > 0 ? 'account_name' : 'none',
  };
}

// ===== PRODUCTS =====

// GET /api/v1/products - List all products
router.get('/products', requirePermission(Permission.INVENTORY_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { page = 1, limit = 50, category, search } = req.query;
    
    if (isDev) {
      console.log(`[API v1] GET /products - tenantId: ${tenantId}`);
    }
    
    let baseQuery = db('products')
      .where({ tenant_id: tenantId })
      .whereNull('deleted_at');
    
    if (category) {
      baseQuery = baseQuery.where('category', category);
    }
    
    if (search) {
      baseQuery = baseQuery.where(function() {
        this.where('name', 'ilike', `%${search}%`)
          .orWhere('sku', 'ilike', `%${search}%`);
      });
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const countQuery = baseQuery.clone().count('id as count').first();
    
    const dataQuery = baseQuery
      .clone()
      .orderBy('created_at', 'desc')
      .limit(Number(limit))
      .offset(offset);
    
    const [countResult, products] = await Promise.all([countQuery, dataQuery]);
    
    if (isDev) {
      console.log(`[API v1] Products found: ${products.length}, count: ${countResult?.count}`);
    }
    
    res.json({
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(countResult?.count || 0),
        totalPages: Math.ceil(Number(countResult?.count || 0) / Number(limit))
      }
    });
  } catch (err) {
    console.error('[API v1] Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/v1/products/:id - Get single product
router.get('/products/:id', requirePermission(Permission.INVENTORY_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    
    const product = await db('products')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .first();
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ data: product });
  } catch (err) {
    console.error('[API v1] Error fetching product:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/v1/products - Create product
router.post('/products', requirePermission(Permission.INVENTORY_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { sku, name, description, category, unit_size, metadata } = req.body;
    
    if (!sku || !name) {
      return res.status(400).json({ error: 'SKU and name are required' });
    }
    
    const [product] = await db('products')
      .insert({
        tenant_id: tenantId,
        sku,
        name,
        description,
        category,
        unit_size,
        metadata: metadata ? JSON.stringify(metadata) : '{}'
      })
      .onConflict(['tenant_id', 'sku'])
      .merge()
      .returning('*');
    
    res.status(201).json({ data: product });
  } catch (err) {
    console.error('[API v1] Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// DELETE /api/v1/products/by-sku/:sku — Soft delete by SKU (must be registered before /products/:id)
router.delete('/products/by-sku/:sku', requirePermission(Permission.INVENTORY_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const sku = decodeURIComponent(String(req.params.sku ?? '').trim());
    if (!sku) {
      return res.status(400).json({ error: 'SKU is required' });
    }

    const [product] = await db('products')
      .where({ tenant_id: tenantId, sku })
      .whereNull('deleted_at')
      .update({ deleted_at: new Date(), updated_at: new Date() })
      .returning('*');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ data: product, message: 'Product deleted' });
  } catch (err) {
    console.error('[API v1] Error deleting product by SKU:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// PUT /api/v1/products/:id - Update product
router.put('/products/:id', requirePermission(Permission.INVENTORY_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    const updates = req.body;
    
    delete updates.id;
    delete updates.tenant_id;
    delete updates.created_at;
    
    if (updates.metadata && typeof updates.metadata === 'object') {
      updates.metadata = JSON.stringify(updates.metadata);
    }
    
    updates.updated_at = new Date();
    
    const [product] = await db('products')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .update(updates)
      .returning('*');
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ data: product });
  } catch (err) {
    console.error('[API v1] Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/v1/products/:id - Soft delete product
router.delete('/products/:id', requirePermission(Permission.INVENTORY_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    
    const [product] = await db('products')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .update({ deleted_at: new Date(), updated_at: new Date() })
      .returning('*');
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ data: product, message: 'Product deleted' });
  } catch (err) {
    console.error('[API v1] Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ===== ACCOUNTS =====

// GET /api/v1/accounts - List all accounts
router.get('/accounts', requirePermission(Permission.ACCOUNTS_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { page = 1, limit = 50, type, market, status = 'active', sales_owner } = req.query;
    
    let baseQuery = db('accounts')
      .where({ tenant_id: tenantId })
      .whereNull('deleted_at');
    
    if (type) baseQuery = baseQuery.where('type', type);
    if (market) baseQuery = baseQuery.where('market', market);
    if (status) baseQuery = baseQuery.where('status', status);
    if (sales_owner) baseQuery = baseQuery.where('sales_owner', sales_owner);
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const countQuery = baseQuery.clone().count('id as count').first();
    
    const dataQuery = baseQuery
      .clone()
      .orderBy('created_at', 'desc')
      .limit(Number(limit))
      .offset(offset);
    
    const [countResult, accounts] = await Promise.all([countQuery, dataQuery]);
    
    res.json({
      data: accounts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(countResult?.count || 0),
        totalPages: Math.ceil(Number(countResult?.count || 0) / Number(limit))
      }
    });
  } catch (err) {
    console.error('[API v1] Error fetching accounts:', err);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// GET /api/v1/accounts/:id - Get single account
router.get('/accounts/:id', requirePermission(Permission.ACCOUNTS_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    
    const account = await db('accounts')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .first();
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    res.json({ data: account });
  } catch (err) {
    console.error('[API v1] Error fetching account:', err);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
});

// POST /api/v1/accounts - Create account
router.post('/accounts', requirePermission(Permission.ACCOUNTS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const accountData = req.body;
    
    if (!accountData.name) {
      return res.status(400).json({ error: 'Account name is required' });
    }
    
    const [account] = await db('accounts')
      .insert({
        tenant_id: tenantId,
        account_number: accountData.accountNumber,
        name: accountData.name,
        trading_name: accountData.tradingName,
        type: accountData.type,
        market: accountData.market,
        status: accountData.status || 'active',
        email: accountData.email,
        phone: accountData.phone,
        billing_address: accountData.billingAddress ? JSON.stringify(accountData.billingAddress) : null,
        shipping_address: accountData.shippingAddress ? JSON.stringify(accountData.shippingAddress) : null,
        payment_terms: accountData.paymentTerms,
        credit_limit: accountData.creditLimit,
        sales_owner: accountData.salesOwner,
        notes: accountData.notes
      })
      .returning('*');
    
    res.status(201).json({ data: account });
  } catch (err) {
    console.error('[API v1] Error creating account:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// PUT /api/v1/accounts/:id - Update account
router.put('/accounts/:id', requirePermission(Permission.ACCOUNTS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    const updates = req.body;
    
    delete updates.id;
    delete updates.tenant_id;
    delete updates.created_at;
    
    if (updates.billingAddress) updates.billing_address = JSON.stringify(updates.billingAddress);
    if (updates.shippingAddress) updates.shipping_address = JSON.stringify(updates.shippingAddress);
    if (updates.tradingName) updates.trading_name = updates.tradingName;
    if (updates.salesOwner) updates.sales_owner = updates.salesOwner;
    if (updates.paymentTerms) updates.payment_terms = updates.paymentTerms;
    if (updates.creditLimit) updates.credit_limit = updates.creditLimit;
    
    updates.updated_at = new Date();
    
    const [account] = await db('accounts')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .update(updates)
      .returning('*');
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    res.json({ data: account });
  } catch (err) {
    console.error('[API v1] Error updating account:', err);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

// DELETE /api/v1/accounts/:id - Soft delete account
router.delete('/accounts/:id', requirePermission(Permission.ACCOUNTS_DELETE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    
    const [account] = await db('accounts')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .update({ deleted_at: new Date(), updated_at: new Date() })
      .returning('*');
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    res.json({ data: account, message: 'Account deleted' });
  } catch (err) {
    console.error('[API v1] Error deleting account:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ===== SALES ORDERS =====

// GET /api/v1/orders - List sales orders
router.get('/orders', requirePermission(Permission.ORDERS_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { 
      page = 1, 
      limit = 50, 
      status, 
      account_id,
      account_name,
      date_from,
      date_to,
      sales_rep
    } = req.query;
    
    let baseQuery = db('sales_orders')
      .where('sales_orders.tenant_id', tenantId)
      .whereNull('sales_orders.deleted_at');
    
    if (status) baseQuery = baseQuery.where('sales_orders.status', status);
    if (account_id) baseQuery = baseQuery.where('sales_orders.account_id', account_id);
    if (date_from) baseQuery = baseQuery.where('sales_orders.order_date', '>=', date_from);
    if (date_to) baseQuery = baseQuery.where('sales_orders.order_date', '<=', date_to);
    if (sales_rep) baseQuery = baseQuery.where('sales_orders.sales_rep', sales_rep);
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const countQuery = baseQuery.clone().count('sales_orders.id as count').first();
    
    let dataQuery = baseQuery
      .clone()
      .orderBy('sales_orders.created_at', 'desc')
      .leftJoin('accounts', 'sales_orders.account_id', 'accounts.id')
      .select(
        'sales_orders.*',
        'accounts.name as account_name',
        'accounts.account_number',
        'accounts.trading_name as account_trading_name'
      );
    
    if (account_name) {
      dataQuery = dataQuery.where(function() {
        this.where('accounts.name', 'ilike', `%${account_name}%`)
          .orWhere('accounts.trading_name', 'ilike', `%${account_name}%`);
      });
    }
    
    const dataResultPromise = dataQuery.limit(Number(limit)).offset(offset);
    
    const [countResult, orders] = await Promise.all([countQuery, dataResultPromise]);
    
    res.json({
      data: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(countResult?.count || 0),
        totalPages: Math.ceil(Number(countResult?.count || 0) / Number(limit))
      }
    });
  } catch (err) {
    console.error('[API v1] Error fetching orders:', err.message);
    console.error('[API v1] Full error:', err);
    res.status(500).json({ error: 'Failed to fetch orders', details: err.message });
  }
});

// GET /api/v1/orders/:id - Get single order with items
router.get('/orders/:id', requirePermission(Permission.ORDERS_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    
    const order = await db('sales_orders')
      .where({ 'sales_orders.id': id, 'sales_orders.tenant_id': tenantId })
      .whereNull('sales_orders.deleted_at')
      .leftJoin('accounts', 'sales_orders.account_id', 'accounts.id')
      .select(
        'sales_orders.*',
        'accounts.name as account_name',
        'accounts.email as account_email',
        'accounts.account_number',
        'accounts.trading_name as account_trading_name'
      )
      .first();
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const items = await db('sales_order_items')
      .where({ sales_order_id: id, tenant_id: tenantId })
      .leftJoin('products', 'sales_order_items.product_id', 'products.id')
      .select(
        'sales_order_items.*',
        'products.sku',
        'products.name as product_name'
      );
    
    res.json({ data: { ...order, items } });
  } catch (err) {
    console.error('[API v1] Error fetching order:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

/**
 * GET /api/v1/orders/:id/receiving-warehouses
 * Authoritative resolver: warehouses linked to the order account and/or CRM distributor contacts
 * (primary_warehouse_id + warehouses.linked_team_member_id), keyed off the joined commercial account fields.
 */
router.get(
  '/orders/:id/receiving-warehouses',
  requirePermission(Permission.ORDERS_READ),
  async (req, res) => {
    try {
      const tenantId = getTenantId(req, res);
      if (!tenantId) return;
      const { id } = req.params;

      const order = await db('sales_orders')
        .where({ 'sales_orders.id': id, 'sales_orders.tenant_id': tenantId })
        .whereNull('sales_orders.deleted_at')
        .leftJoin('accounts', 'sales_orders.account_id', 'accounts.id')
        .select(
          'sales_orders.*',
          'accounts.name as account_name',
          'accounts.email as account_email',
          'accounts.account_number',
          'accounts.trading_name as account_trading_name',
          'accounts.type as account_type',
        )
        .first();

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const rawType = String(order.account_type ?? '').toLowerCase().trim();
      if (
        rawType &&
        rawType !== 'distributor' &&
        rawType !== 'wholesaler'
      ) {
        return res.status(400).json({
          error: 'Receiving depots apply to distributor or wholesaler orders only.',
        });
      }

      const accountIdStr = order.account_id != null ? String(order.account_id) : '';

      const joinAccount = {
        email: order.account_email,
        trading_name: order.account_trading_name,
        name: order.account_name,
      };

      const [warehouseRows, distributorRows] = await Promise.all([
        db('warehouses').where({ tenant_id: tenantId }).orderBy('sort_order', 'asc'),
        db('team_members')
          .where({ tenant_id: tenantId, role: 'distributor' })
          .select('*'),
      ]);

      const { matched, match_basis: matchBasis } = distributorsForSalesOrderReceivingDepots(
        distributorRows,
        joinAccount,
        order,
      );

      const ids = new Set();
      for (const w of warehouseRows) {
        if (
          w.linked_account_id != null &&
          accountIdStr &&
          String(w.linked_account_id) === accountIdStr
        ) {
          ids.add(String(w.id));
        }
      }
      for (const tm of matched) {
        const tid = String(tm.id);
        if (tm.primary_warehouse_id != null && String(tm.primary_warehouse_id).trim() !== '') {
          ids.add(String(tm.primary_warehouse_id));
        }
        for (const w of warehouseRows) {
          if (w.linked_team_member_id != null && String(w.linked_team_member_id) === tid) {
            ids.add(String(w.id));
          }
        }
      }

      let kind = 'none';
      if (ids.size > 0) kind = matched.length > 0 ? 'crm_aligned' : 'account_linked';

      let detail = '';
      if (matched.length > 0) {
        const labels = matched
          .map((m) => String(m.name ?? '').trim() || String(m.email ?? '').trim())
          .filter(Boolean);
        const basisPhrase =
          matchBasis === 'account_email'
            ? 'matched by the same email as this wholesale account'
            : 'matched by trading/legal name similarity (emails did not align — update CRM email to match when possible)';
        detail =
          labels.length > 0
            ? `Receiving options mapped from CRM distributor contact(s), ${basisPhrase}: ${labels.join(', ')}.`
            : `Receiving options mapped from CRM distributor contact(s); ${basisPhrase}.`;
      } else if (ids.size > 0) {
        detail =
          'Depots linked to this distributor account under Settings → Warehouses (no CRM distributor row matched the account email/name).';
      } else {
        detail =
          'No receiving depot matched. Align CRM distributor email with the wholesale account email, match trading or legal names, or link a depot to this account.';
      }

      const distributorWholesaleAccount =
        accountIdStr !== ''
          ? {
              id: accountIdStr,
              trading_name:
                order.account_trading_name != null && String(order.account_trading_name).trim() !== ''
                  ? String(order.account_trading_name).trim()
                  : null,
              legal_name:
                order.account_name != null && String(order.account_name).trim() !== ''
                  ? String(order.account_name).trim()
                  : null,
              email:
                order.account_email != null && String(order.account_email).trim() !== ''
                  ? String(order.account_email).trim().toLowerCase()
                  : null,
              type: order.account_type != null ? String(order.account_type).trim() : null,
            }
          : null;

      res.json({
        data: {
          warehouse_ids: Array.from(ids),
          kind,
          distributor_wholesale_account: distributorWholesaleAccount,
          matched_crm_contact_ids: matched.map((m) => String(m.id)),
          matched_crm_display: matched.map((m) => ({
            id: String(m.id),
            name: String(m.name ?? '').trim(),
            email: String(m.email ?? '').trim().toLowerCase(),
            primary_warehouse_id:
              m.primary_warehouse_id != null && String(m.primary_warehouse_id).trim() !== ''
                ? String(m.primary_warehouse_id).trim()
                : undefined,
          })),
          detail,
          match_basis: matchBasis,
        },
      });
    } catch (err) {
      console.error('[API v1] Error resolving receiving warehouses:', err);
      res.status(500).json({ error: 'Failed to resolve receiving warehouses' });
    }
  },
);

// POST /api/v1/orders - Create order
router.post('/orders', requirePermission(Permission.ORDERS_WRITE), async (req, res) => {
  const trx = await db.transaction();
  
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { order_number, account_id, status, order_date, items, sales_rep, ...orderData } = req.body;
    
    if (!order_number || !account_id) {
      await trx.rollback();
      return res.status(400).json({ error: 'Order number and account_id are required' });
    }
    
    const [order] = await trx('sales_orders')
      .insert({
        tenant_id: tenantId,
        order_number,
        account_id,
        status: status || 'draft',
        order_date: order_date || new Date(),
        sales_rep,
        subtotal: orderData.subtotal || 0,
        tax_amount: orderData.taxAmount || 0,
        shipping_cost: orderData.shippingCost || 0,
        total_amount: orderData.totalAmount || 0,
        shipping_address: orderData.shippingAddress ? JSON.stringify(orderData.shippingAddress) : null,
        notes: orderData.notes,
        created_by: req.user?.userId
      })
      .returning('*');
    
    if (items && items.length > 0) {
      const orderItems = items.map(item => ({
        tenant_id: tenantId,
        sales_order_id: order.id,
        product_id: item.product_id,
        sku: item.sku,
        product_name: item.product_name || item.name,
        quantity_ordered: item.quantity,
        unit_price: item.unit_price || item.price
      }));
      
      await trx('sales_order_items').insert(orderItems);
    }
    
    await trx.commit();
    
    res.status(201).json({ data: order });
  } catch (err) {
    await trx.rollback();
    console.error('[API v1] Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// PUT /api/v1/orders/:id - Update order (full update)
router.put('/orders/:id', requirePermission(Permission.ORDERS_WRITE), async (req, res) => {
  const trx = await db.transaction();
  
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    const { items, ...orderData } = req.body;
    
    const updates = {
      account_id: orderData.account_id,
      order_date: orderData.order_date,
      sales_rep: orderData.sales_rep,
      subtotal: orderData.subtotal,
      tax_amount: orderData.tax_amount,
      shipping_cost: orderData.shipping_cost,
      total_amount: orderData.total_amount,
      notes: orderData.notes,
      updated_at: new Date()
    };
    
    if (orderData.shippingAddress) {
      updates.shipping_address = JSON.stringify(orderData.shippingAddress);
    }
    
    const [order] = await trx('sales_orders')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .update(updates)
      .returning('*');
    
    if (!order) {
      await trx.rollback();
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (items && items.length > 0) {
      await trx('sales_order_items')
        .where({ sales_order_id: id, tenant_id: tenantId })
        .delete();
      
      const orderItems = items.map(item => ({
        tenant_id: tenantId,
        sales_order_id: id,
        product_id: item.product_id,
        sku: item.sku,
        product_name: item.product_name || item.name,
        quantity_ordered: item.quantity,
        unit_price: item.unit_price || item.price
      }));
      
      await trx('sales_order_items').insert(orderItems);
    }
    
    await trx.commit();
    
    res.json({ data: order });
  } catch (err) {
    await trx.rollback();
    console.error('[API v1] Error updating order:', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// PATCH /api/v1/orders/:id/status - Update order status
router.patch('/orders/:id/status', requirePermission(Permission.ORDERS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['draft', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const updates = { 
      status, 
      updated_at: new Date() 
    };
    
    if (status === 'delivered') {
      updates.delivered_at = new Date();
    } else if (status === 'cancelled') {
      updates.cancelled_at = new Date();
    }
    
    const [order] = await db('sales_orders')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .update(updates)
      .returning('*');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ data: order });
  } catch (err) {
    console.error('[API v1] Error updating order status:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// DELETE /api/v1/orders/:id - Soft delete order
router.delete('/orders/:id', requirePermission(Permission.ORDERS_DELETE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    
    const [order] = await db('sales_orders')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .update({ deleted_at: new Date(), updated_at: new Date() })
      .returning('*');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ data: order, message: 'Order deleted' });
  } catch (err) {
    console.error('[API v1] Error deleting order:', err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// ===== INVENTORY =====

// GET /api/v1/inventory - List inventory
router.get('/inventory', requirePermission(Permission.INVENTORY_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { page = 1, limit = 50, location, low_stock, product_id } = req.query;
    
    let countQuery = db('inventory')
      .where('inventory.tenant_id', tenantId)
      .join('products', 'inventory.product_id', 'products.id')
      .whereNull('products.deleted_at');
    
    if (location) countQuery = countQuery.where('inventory.location', location);
    if (product_id) countQuery = countQuery.where('inventory.product_id', product_id);
    if (low_stock === 'true') {
      countQuery = countQuery.whereRaw('inventory.available_quantity <= inventory.reorder_point');
    }
    
    const countResultPromise = countQuery.clone().count('inventory.id as count').first();
    
    let dataQuery = db('inventory')
      .where('inventory.tenant_id', tenantId)
      .join('products', 'inventory.product_id', 'products.id')
      .whereNull('products.deleted_at')
      .select(
        'inventory.*',
        'products.sku',
        'products.name as product_name',
        'products.category'
      );
    
    if (location) dataQuery = dataQuery.where('inventory.location', location);
    if (product_id) dataQuery = dataQuery.where('inventory.product_id', product_id);
    if (low_stock === 'true') {
      dataQuery = dataQuery.whereRaw('inventory.available_quantity <= inventory.reorder_point');
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const dataResultPromise = dataQuery
      .orderBy('products.name')
      .limit(Number(limit))
      .offset(offset);
    
    const [countResult, inventory] = await Promise.all([countResultPromise, dataResultPromise]);
    
    res.json({
      data: inventory,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(countResult?.count || 0),
        totalPages: Math.ceil(Number(countResult?.count || 0) / Number(limit))
      }
    });
  } catch (err) {
    console.error('[API v1] Error fetching inventory:', err.message);
    console.error('[API v1] Full error:', err);
    res.status(500).json({ error: 'Failed to fetch inventory', details: err.message });
  }
});

// POST /api/v1/inventory/adjust - Adjust inventory quantity
router.post('/inventory/adjust', requirePermission(Permission.INVENTORY_ADJUST), async (req, res) => {
  const trx = await db.transaction();
  
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { product_id, location = 'Main Warehouse', quantity, reason, notes } = req.body;
    
    if (!product_id || quantity === undefined) {
      await trx.rollback();
      return res.status(400).json({ error: 'product_id and quantity are required' });
    }
    
    let inventory = await trx('inventory')
      .where({ tenant_id: tenantId, product_id, location })
      .first();
    
    const quantityBefore = inventory ? inventory.quantity_on_hand : 0;
    const quantityAfter = quantityBefore + Number(quantity);
    
    if (inventory) {
      await trx('inventory')
        .where({ id: inventory.id })
        .update({
          quantity_on_hand: quantityAfter,
          available_quantity: quantityAfter - (inventory.reserved_quantity || 0),
          updated_at: new Date()
        });
    } else {
      [inventory] = await trx('inventory')
        .insert({
          tenant_id: tenantId,
          product_id,
          location,
          quantity_on_hand: quantityAfter,
          available_quantity: quantityAfter,
          reorder_point: 100
        })
        .returning('*');
    }
    
    await trx('inventory_adjustments').insert({
      tenant_id: tenantId,
      inventory_id: inventory?.id,
      product_id,
      location,
      adjustment_type: reason || 'manual',
      quantity_before: quantityBefore,
      quantity_after: quantityAfter,
      quantity_changed: Number(quantity),
      notes,
      created_by: req.user?.userId,
      created_at: new Date()
    });
    
    await trx.commit();
    
    res.json({ 
      data: { ...inventory, quantity_on_hand: quantityAfter },
      adjustment: { quantityBefore, quantityAfter, change: Number(quantity) }
    });
  } catch (err) {
    await trx.rollback();
    console.error('[API v1] Error adjusting inventory:', err);
    res.status(500).json({ error: 'Failed to adjust inventory' });
  }
});

// ===== DASHBOARD STATS =====

// GET /api/v1/dashboard/stats - Get dashboard statistics
router.get('/dashboard/stats', requirePermission(Permission.REPORTS_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    
    const [
      productsCount,
      accountsCount,
      ordersStats,
      inventoryStats
    ] = await Promise.all([
      db('products').where({ tenant_id: tenantId }).whereNull('deleted_at').count('id as count').first(),
      db('accounts').where({ tenant_id: tenantId }).whereNull('deleted_at').count('id as count').first(),
      db('sales_orders')
        .where({ tenant_id: tenantId })
        .whereNull('deleted_at')
        .select(
          db.raw('COUNT(*) as total_orders'),
          db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as pending_orders', ['pending']),
          db.raw('SUM(total_amount) as total_revenue')
        )
        .first(),
      db('inventory')
        .where('inventory.tenant_id', tenantId)
        .join('products', 'inventory.product_id', 'products.id')
        .whereNull('products.deleted_at')
        .select(
          db.raw('COUNT(*) as total_items'),
          db.raw('SUM(quantity_on_hand) as total_units'),
          db.raw('COUNT(CASE WHEN available_quantity <= reorder_point THEN 1 END) as low_stock_count')
        )
        .first()
    ]);
    
    res.json({
      data: {
        products: Number(productsCount.count),
        accounts: Number(accountsCount.count),
        orders: {
          total: Number(ordersStats.total_orders) || 0,
          pending: Number(ordersStats.pending_orders) || 0,
          revenue: Number(ordersStats.total_revenue) || 0
        },
        inventory: {
          items: Number(inventoryStats.total_items) || 0,
          units: Number(inventoryStats.total_units) || 0,
          lowStock: Number(inventoryStats.low_stock_count) || 0
        }
      }
    });
  } catch (err) {
    console.error('[API v1] Error fetching dashboard stats:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// ===== VISIT NOTES (for Sales Rep) =====

// GET /api/v1/visit-notes - List visit notes
router.get('/visit-notes', requirePermission(Permission.ACCOUNTS_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { account_id, sales_rep, page = 1, limit = 50 } = req.query;
    
    let query = db('visit_notes')
      .where({ tenant_id: tenantId })
      .orderBy('created_at', 'desc');
    
    if (account_id) query = query.where('account_id', account_id);
    if (sales_rep) query = query.where('created_by', sales_rep);
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const countQuery = query.clone().count('id as count').first();
    const dataQuery = query.clone().limit(Number(limit)).offset(offset);
    
    const [countResult, notes] = await Promise.all([countQuery, dataQuery]);
    
    res.json({
      data: notes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(countResult?.count || 0),
        totalPages: Math.ceil(Number(countResult?.count || 0) / Number(limit))
      }
    });
  } catch (err) {
    console.error('[API v1] Error fetching visit notes:', err);
    res.status(500).json({ error: 'Failed to fetch visit notes' });
  }
});

// POST /api/v1/visit-notes - Create visit note
router.post('/visit-notes', requirePermission(Permission.ACCOUNTS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { account_id, note, visit_date } = req.body;
    
    if (!account_id || !note) {
      return res.status(400).json({ error: 'account_id and note are required' });
    }
    
    const [visitNote] = await db('visit_notes')
      .insert({
        tenant_id: tenantId,
        account_id,
        note,
        visit_date: visit_date || new Date(),
        created_by: req.user?.userId,
        created_at: new Date()
      })
      .returning('*');
    
    res.status(201).json({ data: visitNote });
  } catch (err) {
    console.error('[API v1] Error creating visit note:', err);
    res.status(500).json({ error: 'Failed to create visit note' });
  }
});

// ===== SALES TARGETS =====

// GET /api/v1/sales-targets - List sales targets
router.get('/sales-targets', requirePermission(Permission.REPORTS_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { sales_rep, quarter, year } = req.query;
    
    let query = db('sales_targets')
      .where({ tenant_id: tenantId })
      .orderBy('created_at', 'desc');
    
    if (sales_rep) query = query.where('sales_rep', sales_rep);
    if (quarter) query = query.where('quarter', quarter);
    if (year) query = query.where('year', year);
    
    const targets = await query;
    
    res.json({ data: targets });
  } catch (err) {
    console.error('[API v1] Error fetching sales targets:', err);
    res.status(500).json({ error: 'Failed to fetch sales targets' });
  }
});

// POST /api/v1/sales-targets - Create/update sales target
router.post('/sales-targets', requirePermission(Permission.SETTINGS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { sales_rep, quarter, year, target_amount } = req.body;
    
    if (!sales_rep || !quarter || !year || target_amount === undefined) {
      return res.status(400).json({ error: 'sales_rep, quarter, year, and target_amount are required' });
    }
    
    const [target] = await db('sales_targets')
      .insert({
        tenant_id: tenantId,
        sales_rep,
        quarter,
        year,
        target_amount,
        created_at: new Date(),
        updated_at: new Date()
      })
      .onConflict(['tenant_id', 'sales_rep', 'quarter', 'year'])
      .merge()
      .returning('*');
    
    res.status(201).json({ data: target });
  } catch (err) {
    console.error('[API v1] Error creating sales target:', err);
    res.status(500).json({ error: 'Failed to create sales target' });
  }
});

// ===== DEPLETION REPORTS =====

// GET /api/v1/depletion-reports - List depletion reports
router.get('/depletion-reports', requirePermission(Permission.REPORTS_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { page = 1, limit = 50, account_id, sku, flagged, start_date, end_date } = req.query;
    
    let query = db('depletion_reports')
      .where('depletion_reports.tenant_id', tenantId)
      .whereNull('depletion_reports.deleted_at');
    
    if (account_id) query = query.where('depletion_reports.account_id', account_id);
    if (sku) query = query.where('depletion_reports.sku', sku);
    if (flagged === 'true') query = query.where('depletion_reports.flagged_for_replenishment', true);
    if (start_date) query = query.where('depletion_reports.period_end', '>=', start_date);
    if (end_date) query = query.where('depletion_reports.period_start', '<=', end_date);
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const countQuery = query.clone().count('id as count').first();
    const dataQuery = query
      .clone()
      .select(
        'depletion_reports.*',
        'accounts.name as account_name',
        'accounts.trading_name as account_trading_name'
      )
      .leftJoin('accounts', 'depletion_reports.account_id', 'accounts.id')
      .orderBy('depletion_reports.reported_at', 'desc')
      .limit(Number(limit))
      .offset(offset);
    
    const [countResult, reports] = await Promise.all([countQuery, dataQuery]);
    
    res.json({
      data: reports,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(countResult?.count || 0),
        totalPages: Math.ceil(Number(countResult?.count || 0) / Number(limit))
      }
    });
  } catch (err) {
    console.error('[API v1] Error fetching depletion reports:', err);
    res.status(500).json({ error: 'Failed to fetch depletion reports' });
  }
});

// GET /api/v1/depletion-reports/:id - Get single depletion report
router.get('/depletion-reports/:id', requirePermission(Permission.REPORTS_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    
    const report = await db('depletion_reports')
      .where({ 'depletion_reports.id': id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .select(
        'depletion_reports.*',
        'accounts.name as account_name',
        'accounts.trading_name as account_trading_name'
      )
      .leftJoin('accounts', 'depletion_reports.account_id', 'accounts.id')
      .first();
    
    if (!report) {
      return res.status(404).json({ error: 'Depletion report not found' });
    }
    
    res.json({ data: report });
  } catch (err) {
    console.error('[API v1] Error fetching depletion report:', err);
    res.status(500).json({ error: 'Failed to fetch depletion report' });
  }
});

// POST /api/v1/depletion-reports - Create depletion report
router.post('/depletion-reports', requirePermission(Permission.ORDERS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { 
      account_id, 
      sku, 
      period_start, 
      period_end, 
      bottles_sold, 
      bottles_on_hand_at_end,
      notes,
      flagged_for_replenishment
    } = req.body;
    
    if (!account_id || !sku || !period_start || !period_end) {
      return res.status(400).json({ 
        error: 'account_id, sku, period_start, and period_end are required' 
      });
    }
    
    // Find product_id from SKU
    const product = await db('products')
      .where({ tenant_id: tenantId, sku })
      .whereNull('deleted_at')
      .first();
    
    const [report] = await db('depletion_reports')
      .insert({
        tenant_id: tenantId,
        account_id,
        product_id: product?.id || null,
        sku,
        period_start,
        period_end,
        bottles_sold: Math.max(0, Number(bottles_sold) || 0),
        bottles_on_hand_at_end: Math.max(0, Number(bottles_on_hand_at_end) || 0),
        notes: notes || '',
        flagged_for_replenishment: flagged_for_replenishment || false,
        reported_by: req.user?.userId,
        reported_by_role: req.user?.role || 'distributor',
        reported_at: new Date()
      })
      .returning('*');
    
    res.status(201).json({ data: report });
  } catch (err) {
    console.error('[API v1] Error creating depletion report:', err);
    res.status(500).json({ error: 'Failed to create depletion report' });
  }
});

// PUT /api/v1/depletion-reports/:id - Update depletion report
router.put('/depletion-reports/:id', requirePermission(Permission.ORDERS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    const updates = req.body;
    
    delete updates.id;
    delete updates.tenant_id;
    delete updates.created_at;
    delete updates.reported_at; // Don't allow changing the original report time
    
    updates.updated_at = new Date();
    
    // Handle numeric fields
    if (updates.bottles_sold !== undefined) {
      updates.bottles_sold = Math.max(0, Number(updates.bottles_sold) || 0);
    }
    if (updates.bottles_on_hand_at_end !== undefined) {
      updates.bottles_on_hand_at_end = Math.max(0, Number(updates.bottles_on_hand_at_end) || 0);
    }
    
    // Update product_id if SKU changed
    if (updates.sku) {
      const product = await db('products')
        .where({ tenant_id: tenantId, sku: updates.sku })
        .whereNull('deleted_at')
        .first();
      updates.product_id = product?.id || null;
    }
    
    const [report] = await db('depletion_reports')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .update(updates)
      .returning('*');
    
    if (!report) {
      return res.status(404).json({ error: 'Depletion report not found' });
    }
    
    res.json({ data: report });
  } catch (err) {
    console.error('[API v1] Error updating depletion report:', err);
    res.status(500).json({ error: 'Failed to update depletion report' });
  }
});

// DELETE /api/v1/depletion-reports/:id - Soft delete depletion report
router.delete('/depletion-reports/:id', requirePermission(Permission.ORDERS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    
    const [report] = await db('depletion_reports')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .update({ deleted_at: new Date(), updated_at: new Date() })
      .returning('*');
    
    if (!report) {
      return res.status(404).json({ error: 'Depletion report not found' });
    }
    
    res.json({ data: report, message: 'Depletion report deleted' });
  } catch (err) {
    console.error('[API v1] Error deleting depletion report:', err);
    res.status(500).json({ error: 'Failed to delete depletion report' });
  }
});

// GET /api/v1/depletion-reports/sellthrough/velocity - Get sell-through velocity
router.get('/depletion-reports/sellthrough/velocity', requirePermission(Permission.REPORTS_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { account_id, sku, days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));
    
    let query = db('depletion_reports')
      .where({ tenant_id: tenantId })
      .whereNull('deleted_at')
      .where('period_end', '>=', startDate.toISOString().split('T')[0]);
    
    if (account_id) query = query.where('account_id', account_id);
    if (sku) query = query.where('sku', sku);
    
    // Aggregate by account and SKU
    const velocity = await query
      .select(
        'account_id',
        'sku',
        db.raw('SUM(bottles_sold) as total_bottles_sold'),
        db.raw('SUM(bottles_on_hand_at_end) as avg_on_hand'),
        db.raw('COUNT(*) as report_count'),
        db.raw('MIN(period_start) as first_period'),
        db.raw('MAX(period_end) as last_period')
      )
      .groupBy('account_id', 'sku');
    
    // Get account names
    const accountIds = [...new Set(velocity.map(v => v.account_id))];
    const accounts = await db('accounts')
      .whereIn('id', accountIds)
      .where({ tenant_id: tenantId })
      .select('id', 'name', 'trading_name');
    
    const accountMap = Object.fromEntries(accounts.map(a => [a.id, a]));
    
    // Calculate velocity (bottles per day)
    const result = velocity.map(v => {
      const daysInPeriod = Math.max(1, Number(days));
      return {
        ...v,
        account_name: accountMap[v.account_id]?.trading_name || accountMap[v.account_id]?.name,
        velocity_bottles_per_day: Number((Number(v.total_bottles_sold) / daysInPeriod).toFixed(2)),
        days_in_period: daysInPeriod
      };
    });
    
    res.json({ data: result });
  } catch (err) {
    console.error('[API v1] Error calculating sell-through velocity:', err);
    res.status(500).json({ error: 'Failed to calculate sell-through velocity' });
  }
});

// GET /api/v1/depletion-reports/sellthrough/summary - Get summary by period
router.get('/depletion-reports/sellthrough/summary', requirePermission(Permission.REPORTS_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { period = '30d' } = req.query;
    
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get total depletions
    const depletionsResult = await db('depletion_reports')
      .where({ tenant_id: tenantId })
      .whereNull('deleted_at')
      .where('period_end', '>=', startDate.toISOString().split('T')[0])
      .select(
        db.raw('SUM(bottles_sold) as total_sold'),
        db.raw('SUM(bottles_on_hand_at_end) as total_on_hand'),
        db.raw('COUNT(DISTINCT account_id) as accounts_reporting'),
        db.raw('COUNT(*) as total_reports')
      )
      .first();
    
    // Get flagged for replenishment
    const flaggedResult = await db('depletion_reports')
      .where({ tenant_id: tenantId, flagged_for_replenishment: true })
      .whereNull('deleted_at')
      .where('period_end', '>=', startDate.toISOString().split('T')[0])
      .count('id as count')
      .first();
    
    // Get top SKUs by velocity
    const topSkus = await db('depletion_reports')
      .where({ tenant_id: tenantId })
      .whereNull('deleted_at')
      .where('period_end', '>=', startDate.toISOString().split('T')[0])
      .select('sku')
      .select(db.raw('SUM(bottles_sold) as total_sold'))
      .groupBy('sku')
      .orderBy('total_sold', 'desc')
      .limit(5);
    
    res.json({
      data: {
        period,
        period_days: days,
        total_bottles_sold: Number(depletionsResult?.total_sold || 0),
        total_bottles_on_hand: Number(depletionsResult?.total_on_hand || 0),
        accounts_reporting: Number(depletionsResult?.accounts_reporting || 0),
        total_reports: Number(depletionsResult?.total_reports || 0),
        flagged_for_replenishment: Number(flaggedResult?.count || 0),
        top_skus: topSkus,
        calculated_at: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('[API v1] Error fetching sell-through summary:', err);
    res.status(500).json({ error: 'Failed to fetch sell-through summary' });
  }
});

// ===== INVENTORY ADJUSTMENT REQUESTS =====

// GET /api/v1/inventory-adjustment-requests - List adjustment requests
router.get('/inventory-adjustment-requests', requirePermission(Permission.REPORTS_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { page = 1, limit = 50, account_id, status } = req.query;
    
    let query = db('inventory_adjustment_requests')
      .where({ tenant_id: tenantId })
      .orderBy('requested_at', 'desc');
    
    if (account_id) query = query.where('account_id', account_id);
    if (status) query = query.where('status', status);
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const countQuery = query.clone().count('id as count').first();
    const dataQuery = query
      .clone()
      .select(
        'inventory_adjustment_requests.*',
        'accounts.name as account_name',
        'accounts.trading_name as account_trading_name'
      )
      .leftJoin('accounts', 'inventory_adjustment_requests.account_id', 'accounts.id')
      .limit(Number(limit))
      .offset(offset);
    
    const [countResult, requests] = await Promise.all([countQuery, dataQuery]);
    
    res.json({
      data: requests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(countResult?.count || 0),
        totalPages: Math.ceil(Number(countResult?.count || 0) / Number(limit))
      }
    });
  } catch (err) {
    console.error('[API v1] Error fetching adjustment requests:', err);
    res.status(500).json({ error: 'Failed to fetch adjustment requests' });
  }
});

// POST /api/v1/inventory-adjustment-requests - Create adjustment request
router.post('/inventory-adjustment-requests', requirePermission(Permission.ORDERS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { 
      account_id, 
      sku, 
      adjustment_type,
      quantity_expected,
      quantity_actual,
      reason
    } = req.body;
    
    if (!account_id || !sku || !adjustment_type) {
      return res.status(400).json({ 
        error: 'account_id, sku, and adjustment_type are required' 
      });
    }
    
    const expected = Number(quantity_expected) || 0;
    const actual = Number(quantity_actual) || 0;
    const adjustment = actual - expected;
    
    // Find product_id from SKU
    const product = await db('products')
      .where({ tenant_id: tenantId, sku })
      .whereNull('deleted_at')
      .first();
    
    const [request] = await db('inventory_adjustment_requests')
      .insert({
        tenant_id: tenantId,
        account_id,
        product_id: product?.id || null,
        sku,
        adjustment_type,
        quantity_expected: expected,
        quantity_actual: actual,
        quantity_adjustment: adjustment,
        reason: reason || '',
        status: 'pending',
        requested_by: req.user?.userId,
        requested_at: new Date()
      })
      .returning('*');
    
    res.status(201).json({ data: request });
  } catch (err) {
    console.error('[API v1] Error creating adjustment request:', err);
    res.status(500).json({ error: 'Failed to create adjustment request' });
  }
});

// PATCH /api/v1/inventory-adjustment-requests/:id/approve - Approve/reject adjustment
router.patch('/inventory-adjustment-requests/:id/approve', requirePermission(Permission.INVENTORY_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    const { approved, rejection_reason } = req.body;
    
    const [request] = await db('inventory_adjustment_requests')
      .where({ id, tenant_id: tenantId, status: 'pending' })
      .first();
    
    if (!request) {
      return res.status(404).json({ error: 'Adjustment request not found or already processed' });
    }
    
    const updates = {
      status: approved ? 'approved' : 'rejected',
      approved_by: req.user?.userId,
      approved_at: new Date(),
      rejection_reason: approved ? null : (rejection_reason || ''),
      updated_at: new Date()
    };
    
    const [updated] = await db('inventory_adjustment_requests')
      .where({ id, tenant_id: tenantId })
      .update(updates)
      .returning('*');
    
    // If approved, also adjust inventory
    if (approved) {
      // Find inventory record
      const inventory = await db('inventory')
        .where({ 
          tenant_id: tenantId, 
          product_id: request.product_id 
        })
        .first();
      
      if (inventory) {
        const quantityBefore = inventory.quantity_on_hand;
        const quantityAfter = quantityBefore + request.quantity_adjustment;
        
        await db('inventory')
          .where({ id: inventory.id })
          .update({ 
            quantity_on_hand: quantityAfter,
            updated_at: new Date()
          });
        
        // Log the adjustment
        await db('inventory_adjustments').insert({
          tenant_id: tenantId,
          inventory_id: inventory.id,
          product_id: request.product_id,
          location: inventory.location,
          adjustment_type: `distributor_${request.adjustment_type}`,
          quantity_before: quantityBefore,
          quantity_after: quantityAfter,
          quantity_changed: request.quantity_adjustment,
          reference_type: 'adjustment_request',
          reference_id: id,
          notes: `Distributor adjustment: ${request.reason}`,
          created_by: req.user?.userId,
          created_at: new Date()
        });
      }
    }
    
    res.json({ data: updated });
  } catch (err) {
    console.error('[API v1] Error approving adjustment request:', err);
    res.status(500).json({ error: 'Failed to approve adjustment request' });
  }
});

// ===== NEW PRODUCT REQUESTS =====

// GET /api/v1/new-product-requests - List new product requests
router.get('/new-product-requests', requirePermission(Permission.PRODUCTION_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { status, assigned_manufacturer, limit = 50, offset = 0 } = req.query;
    
    let query = db('new_product_requests')
      .where({ tenant_id: tenantId })
      .orderBy('requested_at', 'desc');
    
    if (status) {
      query = query.where('status', status);
    }
    
    if (assigned_manufacturer) {
      query = query.where('assigned_manufacturer', assigned_manufacturer);
    }
    
    // Postgres does not allow ORDER BY in COUNT queries unless grouped; clear ordering for count.
    const countQuery = query.clone().clearOrder().count('id as count').first();
    
    const dataQuery = query
      .limit(parseInt(limit))
      .offset(parseInt(offset));
    
    const [{ count }, data] = await Promise.all([countQuery, dataQuery]);
    
    // Parse JSONB fields
    const parsed = data.map(row => ({
      ...row,
      specs: row.specs || {},
      manufacturer_proposal: row.manufacturer_proposal || null,
      brand_decision: row.brand_decision || null,
      attachments: row.attachments || []
    }));
    
    res.json({ 
      data: parsed,
      pagination: {
        total: parseInt(count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (err) {
    console.error('[API v1] Error fetching new product requests:', err);
    res.status(500).json({ error: 'Failed to fetch new product requests' });
  }
});

// GET /api/v1/new-product-requests/:id - Get single request
router.get('/new-product-requests/:id', requirePermission(Permission.PRODUCTION_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    
    const request = await db('new_product_requests')
      .where({ id, tenant_id: tenantId })
      .first();
    
    if (!request) {
      return res.status(404).json({ error: 'New product request not found' });
    }
    
    // Parse JSONB fields
    res.json({ 
      data: {
        ...request,
        specs: request.specs || {},
        manufacturer_proposal: request.manufacturer_proposal || null,
        brand_decision: request.brand_decision || null,
        attachments: request.attachments || []
      }
    });
  } catch (err) {
    console.error('[API v1] Error fetching new product request:', err);
    res.status(500).json({ error: 'Failed to fetch new product request' });
  }
});

// POST /api/v1/new-product-requests - Create new request
router.post('/new-product-requests', requirePermission(Permission.PRODUCTION_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const {
      request_id,
      title,
      requested_by = 'brand_operator',
      specs,
      notes,
      assigned_manufacturer,
      status = 'draft'
    } = req.body;
    
    if (!title || !specs) {
      return res.status(400).json({ error: 'title and specs are required' });
    }
    
    const [request] = await db('new_product_requests')
      .insert({
        tenant_id: tenantId,
        request_id: request_id || `NPR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        title,
        requested_by,
        requested_at: new Date(),
        specs: JSON.stringify(specs),
        status,
        assigned_manufacturer,
        notes,
        created_by: req.user?.userId
      })
      .returning('*');
    
    res.status(201).json({ 
      data: {
        ...request,
        specs: request.specs || {},
        manufacturer_proposal: null,
        brand_decision: null,
        attachments: []
      }
    });
  } catch (err) {
    console.error('[API v1] Error creating new product request:', err);
    res.status(500).json({ error: 'Failed to create new product request' });
  }
});

// PUT /api/v1/new-product-requests/:id - Update request
router.put('/new-product-requests/:id', requirePermission(Permission.PRODUCTION_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    const updates = req.body;
    
    // JSONB fields need stringification
    if (updates.specs) updates.specs = JSON.stringify(updates.specs);
    if (updates.manufacturer_proposal) updates.manufacturer_proposal = JSON.stringify(updates.manufacturer_proposal);
    if (updates.brand_decision) updates.brand_decision = JSON.stringify(updates.brand_decision);
    if (updates.attachments) updates.attachments = JSON.stringify(updates.attachments);
    
    updates.updated_at = new Date();
    updates.updated_by = req.user?.userId;
    
    const [updated] = await db('new_product_requests')
      .where({ id, tenant_id: tenantId })
      .update(updates)
      .returning('*');
    
    if (!updated) {
      return res.status(404).json({ error: 'New product request not found' });
    }
    
    res.json({ 
      data: {
        ...updated,
        specs: updated.specs || {},
        manufacturer_proposal: updated.manufacturer_proposal || null,
        brand_decision: updated.brand_decision || null,
        attachments: updated.attachments || []
      }
    });
  } catch (err) {
    console.error('[API v1] Error updating new product request:', err);
    res.status(500).json({ error: 'Failed to update new product request' });
  }
});

// DELETE /api/v1/new-product-requests/:id - Delete request
router.delete('/new-product-requests/:id', requirePermission(Permission.PRODUCTION_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    
    const deleted = await db('new_product_requests')
      .where({ id, tenant_id: tenantId })
      .del();
    
    if (!deleted) {
      return res.status(404).json({ error: 'New product request not found' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('[API v1] Error deleting new product request:', err);
    res.status(500).json({ error: 'Failed to delete new product request' });
  }
});

// ===== PURCHASE ORDERS =====

// GET /api/v1/purchase-orders - List purchase orders
router.get('/purchase-orders', requirePermission(Permission.PRODUCTION_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { page = 1, limit = 50, status, manufacturer_id } = req.query;
    
    let baseQuery = db('purchase_orders')
      .where({ tenant_id: tenantId })
      .whereNull('deleted_at');
    
    if (status) baseQuery = baseQuery.where('status', status);
    if (manufacturer_id) baseQuery = baseQuery.where('manufacturer_id', manufacturer_id);
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const countQuery = baseQuery.clone().count('id as count').first();
    
    const dataQuery = baseQuery
      .clone()
      .orderBy('created_at', 'desc')
      .limit(Number(limit))
      .offset(offset);
    
    const [countResult, orders] = await Promise.all([countQuery, dataQuery]);
    
    res.json({
      data: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(countResult?.count || 0),
        totalPages: Math.ceil(Number(countResult?.count || 0) / Number(limit))
      }
    });
  } catch (err) {
    console.error('[API v1] Error fetching purchase orders:', err);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// GET /api/v1/purchase-orders/:id - Get single purchase order with items
router.get('/purchase-orders/:id', requirePermission(Permission.PRODUCTION_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    
    const order = await db('purchase_orders')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .first();
    
    if (!order) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    const items = await db('purchase_order_items')
      .where({ purchase_order_id: id, tenant_id: tenantId });
    
    res.json({ data: { ...order, items } });
  } catch (err) {
    console.error('[API v1] Error fetching purchase order:', err);
    res.status(500).json({ error: 'Failed to fetch purchase order' });
  }
});

// POST /api/v1/purchase-orders - Create purchase order
router.post('/purchase-orders', requirePermission(Permission.PRODUCTION_WRITE), async (req, res) => {
  const trx = await db.transaction();
  
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { po_number, manufacturer_id, status, order_date, delivery_date, items, ...orderData } = req.body;
    
    if (!po_number || !manufacturer_id) {
      await trx.rollback();
      return res.status(400).json({ error: 'po_number and manufacturer_id are required' });
    }
    
    const [order] = await trx('purchase_orders')
      .insert({
        tenant_id: tenantId,
        po_number,
        manufacturer_id,
        status: status || 'draft',
        order_date: order_date || new Date(),
        delivery_date,
        market_destination: orderData.marketDestination,
        total_bottles: orderData.totalBottles || 0,
        total_amount: orderData.totalAmount || 0,
        notes: orderData.notes,
        created_by: req.user?.userId
      })
      .returning('*');
    
    if (items && items.length > 0) {
      const orderItems = items.map(item => ({
        tenant_id: tenantId,
        purchase_order_id: order.id,
        product_id: item.productId || item.product_id,
        sku: item.sku,
        product_name: item.productName || item.product_name || item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice || item.unit_price || 0
      }));
      
      await trx('purchase_order_items').insert(orderItems);
    }
    
    await trx.commit();
    
    res.status(201).json({ data: order });
  } catch (err) {
    await trx.rollback();
    console.error('[API v1] Error creating purchase order:', err);
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

// PUT /api/v1/purchase-orders/:id - Update purchase order
router.put('/purchase-orders/:id', requirePermission(Permission.PRODUCTION_WRITE), async (req, res) => {
  const trx = await db.transaction();
  
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    const { items, ...orderData } = req.body;
    
    const updates = {
      manufacturer_id: orderData.manufacturer_id || orderData.manufacturerId,
      order_date: orderData.order_date || orderData.orderDate,
      delivery_date: orderData.delivery_date || orderData.deliveryDate,
      market_destination: orderData.market_destination || orderData.marketDestination,
      total_bottles: orderData.total_bottles || orderData.totalBottles,
      total_amount: orderData.total_amount || orderData.totalAmount,
      notes: orderData.notes,
      updated_at: new Date()
    };
    
    const [order] = await trx('purchase_orders')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .update(updates)
      .returning('*');
    
    if (!order) {
      await trx.rollback();
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    if (items && items.length > 0) {
      await trx('purchase_order_items')
        .where({ purchase_order_id: id, tenant_id: tenantId })
        .delete();
      
      const orderItems = items.map(item => ({
        tenant_id: tenantId,
        purchase_order_id: id,
        product_id: item.productId || item.product_id,
        sku: item.sku,
        product_name: item.productName || item.product_name || item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice || item.unit_price || 0
      }));
      
      await trx('purchase_order_items').insert(orderItems);
    }
    
    await trx.commit();
    
    res.json({ data: order });
  } catch (err) {
    await trx.rollback();
    console.error('[API v1] Error updating purchase order:', err);
    res.status(500).json({ error: 'Failed to update purchase order' });
  }
});

// PATCH /api/v1/purchase-orders/:id/status - Update purchase order status
router.patch('/purchase-orders/:id/status', requirePermission(Permission.PRODUCTION_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['draft', 'submitted', 'acknowledged', 'in_production', 'ready_for_shipment', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const updates = { 
      status, 
      updated_at: new Date() 
    };
    
    if (status === 'delivered') {
      updates.delivered_at = new Date();
    }
    
    const [order] = await db('purchase_orders')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .update(updates)
      .returning('*');
    
    if (!order) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    res.json({ data: order });
  } catch (err) {
    console.error('[API v1] Error updating purchase order status:', err);
    res.status(500).json({ error: 'Failed to update purchase order status' });
  }
});

// DELETE /api/v1/purchase-orders/:id - Soft delete purchase order
router.delete('/purchase-orders/:id', requirePermission(Permission.PRODUCTION_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    
    const [order] = await db('purchase_orders')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .update({ deleted_at: new Date(), updated_at: new Date() })
      .returning('*');
    
    if (!order) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    res.json({ data: order, message: 'Purchase order deleted' });
  } catch (err) {
    console.error('[API v1] Error deleting purchase order:', err);
    res.status(500).json({ error: 'Failed to delete purchase order' });
  }
});

// ===== TRANSFER ORDERS =====

// GET /api/v1/transfer-orders - List transfer orders
router.get('/transfer-orders', requirePermission(Permission.INVENTORY_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { page = 1, limit = 50, status, from_location, to_location } = req.query;
    
    let baseQuery = db('transfer_orders')
      .where({ tenant_id: tenantId })
      .whereNull('deleted_at');
    
    if (status) baseQuery = baseQuery.where('status', status);
    if (from_location) baseQuery = baseQuery.where('from_location', from_location);
    if (to_location) baseQuery = baseQuery.where('to_location', to_location);
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const countQuery = baseQuery.clone().count('id as count').first();
    
    const dataQuery = baseQuery
      .clone()
      .orderBy('created_at', 'desc')
      .limit(Number(limit))
      .offset(offset);
    
    const [countResult, orders] = await Promise.all([countQuery, dataQuery]);
    
    res.json({
      data: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(countResult?.count || 0),
        totalPages: Math.ceil(Number(countResult?.count || 0) / Number(limit))
      }
    });
  } catch (err) {
    console.error('[API v1] Error fetching transfer orders:', err);
    res.status(500).json({ error: 'Failed to fetch transfer orders' });
  }
});

// GET /api/v1/transfer-orders/:id - Get single transfer order with items
router.get('/transfer-orders/:id', requirePermission(Permission.INVENTORY_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    
    const order = await db('transfer_orders')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .first();
    
    if (!order) {
      return res.status(404).json({ error: 'Transfer order not found' });
    }
    
    const items = await db('transfer_order_items')
      .where({ transfer_order_id: id, tenant_id: tenantId });
    
    res.json({ data: { ...order, items } });
  } catch (err) {
    console.error('[API v1] Error fetching transfer order:', err);
    res.status(500).json({ error: 'Failed to fetch transfer order' });
  }
});

// POST /api/v1/transfer-orders - Create transfer order
router.post('/transfer-orders', requirePermission(Permission.INVENTORY_WRITE), async (req, res) => {
  const trx = await db.transaction();
  
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { to_number, from_location, to_location, status, request_date, ship_date, items, ...orderData } = req.body;
    
    if (!to_number || !from_location || !to_location) {
      await trx.rollback();
      return res.status(400).json({ error: 'to_number, from_location, and to_location are required' });
    }
    
    const [order] = await trx('transfer_orders')
      .insert({
        tenant_id: tenantId,
        to_number,
        from_location,
        to_location,
        status: status || 'draft',
        request_date: request_date || new Date(),
        ship_date,
        delivery_date: orderData.deliveryDate,
        tracking_number: orderData.trackingNumber,
        carrier: orderData.carrier,
        total_bottles: orderData.totalBottles || 0,
        notes: orderData.notes,
        created_by: req.user?.userId
      })
      .returning('*');
    
    if (items && items.length > 0) {
      const orderItems = items.map(item => ({
        tenant_id: tenantId,
        transfer_order_id: order.id,
        product_id: item.productId || item.product_id,
        sku: item.sku,
        product_name: item.productName || item.product_name || item.name,
        quantity: item.quantity,
        batch_id: item.batchId || item.batch_id
      }));
      
      await trx('transfer_order_items').insert(orderItems);
    }
    
    await trx.commit();
    
    res.status(201).json({ data: order });
  } catch (err) {
    await trx.rollback();
    console.error('[API v1] Error creating transfer order:', err);
    res.status(500).json({ error: 'Failed to create transfer order' });
  }
});

// PUT /api/v1/transfer-orders/:id - Update transfer order
router.put('/transfer-orders/:id', requirePermission(Permission.INVENTORY_WRITE), async (req, res) => {
  const trx = await db.transaction();
  
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    const { items, ...orderData } = req.body;
    
    const updates = {
      from_location: orderData.from_location || orderData.fromLocation,
      to_location: orderData.to_location || orderData.toLocation,
      request_date: orderData.request_date || orderData.requestDate,
      ship_date: orderData.ship_date || orderData.shipDate,
      delivery_date: orderData.delivery_date || orderData.deliveryDate,
      tracking_number: orderData.tracking_number || orderData.trackingNumber,
      carrier: orderData.carrier,
      total_bottles: orderData.total_bottles || orderData.totalBottles,
      notes: orderData.notes,
      updated_at: new Date()
    };
    
    const [order] = await trx('transfer_orders')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .update(updates)
      .returning('*');
    
    if (!order) {
      await trx.rollback();
      return res.status(404).json({ error: 'Transfer order not found' });
    }
    
    if (items && items.length > 0) {
      await trx('transfer_order_items')
        .where({ transfer_order_id: id, tenant_id: tenantId })
        .delete();
      
      const orderItems = items.map(item => ({
        tenant_id: tenantId,
        transfer_order_id: id,
        product_id: item.productId || item.product_id,
        sku: item.sku,
        product_name: item.productName || item.product_name || item.name,
        quantity: item.quantity,
        batch_id: item.batchId || item.batch_id
      }));
      
      await trx('transfer_order_items').insert(orderItems);
    }
    
    await trx.commit();
    
    res.json({ data: order });
  } catch (err) {
    await trx.rollback();
    console.error('[API v1] Error updating transfer order:', err);
    res.status(500).json({ error: 'Failed to update transfer order' });
  }
});

// PATCH /api/v1/transfer-orders/:id/status - Update transfer order status
router.patch('/transfer-orders/:id/status', requirePermission(Permission.INVENTORY_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['draft', 'pending', 'approved', 'packed', 'shipped', 'in_transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const updates = { 
      status, 
      updated_at: new Date() 
    };
    
    if (status === 'delivered') {
      updates.delivered_at = new Date();
    } else if (status === 'shipped') {
      updates.shipped_at = new Date();
    }
    
    const [order] = await db('transfer_orders')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .update(updates)
      .returning('*');
    
    if (!order) {
      return res.status(404).json({ error: 'Transfer order not found' });
    }
    
    res.json({ data: order });
  } catch (err) {
    console.error('[API v1] Error updating transfer order status:', err);
    res.status(500).json({ error: 'Failed to update transfer order status' });
  }
});

// DELETE /api/v1/transfer-orders/:id - Soft delete transfer order
router.delete('/transfer-orders/:id', requirePermission(Permission.INVENTORY_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    
    const [order] = await db('transfer_orders')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .update({ deleted_at: new Date(), updated_at: new Date() })
      .returning('*');
    
    if (!order) {
      return res.status(404).json({ error: 'Transfer order not found' });
    }
    
    res.json({ data: order, message: 'Transfer order deleted' });
  } catch (err) {
    console.error('[API v1] Error deleting transfer order:', err);
    res.status(500).json({ error: 'Failed to delete transfer order' });
  }
});

// ===== SHIPMENTS =====

function bottlesPerCaseFromProductMetadata(metadata) {
  if (metadata == null) return 12;
  let m = metadata;
  if (typeof m === 'string') {
    try {
      m = JSON.parse(m);
    } catch {
      m = {};
    }
  }
  if (typeof m !== 'object' || m == null) return 12;
  const raw = m.caseSize ?? m.case_size ?? m.bottlesPerCase ?? m.bottles_per_case;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 12;
}

async function skuToBottlesPerCaseMap(tenantId, skus) {
  const clean = [...new Set((skus || []).map((s) => String(s || '').trim()).filter(Boolean))];
  if (clean.length === 0) return new Map();
  const products = await db('products').where({ tenant_id: tenantId }).whereIn('sku', clean).select('sku', 'metadata');
  return new Map(products.map((p) => [String(p.sku), bottlesPerCaseFromProductMetadata(p.metadata)]));
}

function enrichLineItemsWithCaseFields(orderType, lineRows, bppcBySku) {
  const ot = String(orderType || '');
  return (lineRows || []).map((li) => {
    const sku = String(li.sku || '');
    const bppc = bppcBySku.get(sku) || 12;
    const bt = li.quantity != null ? Number(li.quantity) : 0;
    const base = {
      sku,
      product_name: li.product_name,
      quantity: bt,
      case_size: bppc,
    };
    if (ot === 'sales_order' && bppc > 0) {
      base.cases = Math.round((bt / bppc) * 1000) / 1000;
    }
    return base;
  });
}

async function hydrateShipmentDestinationWarehouseNames(tenantId, rows) {
  if (!rows?.length) return rows;
  const ids = [...new Set(rows.map((r) => r.destination_warehouse_id).filter(Boolean).map(String))];
  if (ids.length === 0) return rows.map((r) => ({ ...r, destination_warehouse_name: null }));
  const wh = await db('warehouses').where({ tenant_id: tenantId }).whereIn('id', ids);
  const nameById = new Map(wh.map((w) => [String(w.id), String(w.name || '')]));
  return rows.map((r) => ({
    ...r,
    destination_warehouse_name: r.destination_warehouse_id
      ? nameById.get(String(r.destination_warehouse_id)) ?? null
      : null,
  }));
}

/** Batch-attach line items for shipment list/detail consistency (distributor "what is arriving"). */
async function hydrateShipmentLineItems(tenantId, rows) {
  if (!rows?.length) return rows;
  const ids = rows.map((r) => r.id).filter(Boolean);
  if (ids.length === 0) return rows.map((r) => ({ ...r, line_items: [] }));

  const items = await db('shipment_items').where({ tenant_id: tenantId }).whereIn('shipment_id', ids);
  const bppcBySku = await skuToBottlesPerCaseMap(
    tenantId,
    items.map((i) => i.sku),
  );
  const bySid = new Map();
  for (const it of items) {
    const sid = String(it.shipment_id);
    if (!bySid.has(sid)) bySid.set(sid, []);
    bySid.get(sid).push({
      sku: it.sku,
      product_name: it.product_name,
      quantity: it.quantity != null ? Number(it.quantity) : 0,
    });
  }
  return rows.map((r) => {
    const raw = bySid.get(String(r.id)) ?? [];
    return { ...r, line_items: enrichLineItemsWithCaseFields(r.order_type, raw, bppcBySku) };
  });
}

async function distributorReceivingWarehouseIdsForUser(tenantId, email) {
  const em = String(email ?? '')
    .toLowerCase()
    .trim();
  if (!em) return [];

  const member = await db('team_members').where({ tenant_id: tenantId, email: em, is_active: true }).first();
  if (!member) return [];

  const ids = new Set();
  if (member.primary_warehouse_id != null && String(member.primary_warehouse_id).trim() !== '') {
    ids.add(String(member.primary_warehouse_id).trim());
  }
  const linked = await db('warehouses')
    .where({ tenant_id: tenantId, linked_team_member_id: member.id })
    .select('id');
  for (const w of linked) {
    if (w.id != null) ids.add(String(w.id));
  }
  return [...ids];
}

function distributorHasShipmentAccess(shipmentRow, allowedWarehouseIds) {
  if (!shipmentRow || !allowedWarehouseIds?.length) return false;
  const dest = shipmentRow.destination_warehouse_id;
  if (dest == null || String(dest).trim() === '') return false;
  return allowedWarehouseIds.includes(String(dest).trim());
}

/**
 * Validates optional `destination_warehouse_id`; fills `to_location` from warehouse name when omitted.
 */
async function resolveShipmentWarehouseFields(tenantId, body) {
  const widRaw = body?.destination_warehouse_id ?? body?.destinationWarehouseId ?? null;
  const wid = widRaw != null && String(widRaw).trim() !== '' ? String(widRaw).trim() : null;
  let toLocation =
    body?.to_location != null
      ? String(body.to_location).trim()
      : body?.toLocation != null
        ? String(body.toLocation).trim()
        : '';
  let destinationWarehouseId = wid;
  if (destinationWarehouseId) {
    const wh = await db('warehouses').where({ id: destinationWarehouseId, tenant_id: tenantId }).first();
    if (!wh) {
      const e = new Error('destination_warehouse_id does not match a warehouse in this tenant');
      e.status = 400;
      throw e;
    }
    if (!toLocation) toLocation = String(wh.name || '').trim();
  }
  return { toLocation: toLocation || null, destinationWarehouseId };
}

function manufacturerShipmentScopeDenied(existingRow) {
  if (!existingRow || existingRow.order_type !== 'purchase_order') {
    return {
      status: 403,
      error:
        'Manufacturer portal users may only work with inbound shipments tied to purchase orders.',
    };
  }
  return null;
}

const shipmentWriteMiddleware = requireAnyPermission(Permission.INVENTORY_WRITE, Permission.SHIPMENTS_WRITE);

// GET /api/v1/shipments - List shipments
router.get('/shipments', requirePermission(Permission.INVENTORY_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { page = 1, limit = 50, status, carrier, order_id, order_type } = req.query;

    let baseQuery = db('shipments')
      .where({ tenant_id: tenantId })
      .whereNull('deleted_at');

    if (req.user.role === Role.MANUFACTURER) {
      baseQuery = baseQuery.where('order_type', 'purchase_order');
    }

    if (req.user.role === Role.DISTRIBUTOR) {
      const whIds = await distributorReceivingWarehouseIdsForUser(tenantId, req.user.email);
      if (whIds.length === 0) {
        baseQuery = baseQuery.whereRaw('1 = 0');
      } else {
        baseQuery = baseQuery.whereIn('destination_warehouse_id', whIds);
      }
    }

    if (status) baseQuery = baseQuery.where('status', status);
    if (carrier) baseQuery = baseQuery.where('carrier', carrier);
    if (order_id) baseQuery = baseQuery.where('order_id', order_id);
    if (order_type) baseQuery = baseQuery.where('order_type', order_type);

    const offset = (Number(page) - 1) * Number(limit);

    const countQuery = baseQuery.clone().count('id as count').first();

    const dataQuery = baseQuery
      .clone()
      .orderBy('created_at', 'desc')
      .limit(Number(limit))
      .offset(offset);

    const [countResult, shipmentsRaw] = await Promise.all([countQuery, dataQuery]);

    const named = await hydrateShipmentDestinationWarehouseNames(tenantId, shipmentsRaw);
    const shipments = await hydrateShipmentLineItems(tenantId, named);

    res.json({
      data: shipments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(countResult?.count || 0),
        totalPages: Math.ceil(Number(countResult?.count || 0) / Number(limit)),
      },
    });
  } catch (err) {
    console.error('[API v1] Error fetching shipments:', err);
    res.status(500).json({ error: 'Failed to fetch shipments' });
  }
});

// GET /api/v1/shipments/:id - Get single shipment with items
router.get('/shipments/:id', requirePermission(Permission.INVENTORY_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;

    const shipmentRow = await db('shipments')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .first();

    if (!shipmentRow) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    if (req.user.role === Role.MANUFACTURER) {
      const denied = manufacturerShipmentScopeDenied(shipmentRow);
      if (denied) return res.status(denied.status).json({ error: denied.error });
    }

    if (req.user.role === Role.DISTRIBUTOR) {
      const whIds = await distributorReceivingWarehouseIdsForUser(tenantId, req.user.email);
      if (!distributorHasShipmentAccess(shipmentRow, whIds)) {
        return res.status(403).json({ error: 'You can only view shipments routed to your receiving warehouse.' });
      }
    }

    const [shipmentHydrated] = await hydrateShipmentDestinationWarehouseNames(tenantId, [shipmentRow]);
    const itemsRaw = await db('shipment_items').where({ shipment_id: id, tenant_id: tenantId });
    const bppcBySku = await skuToBottlesPerCaseMap(
      tenantId,
      itemsRaw.map((i) => i.sku),
    );
    const items = enrichLineItemsWithCaseFields(
      shipmentHydrated.order_type,
      itemsRaw.map((it) => ({
        sku: it.sku,
        product_name: it.product_name,
        quantity: it.quantity != null ? Number(it.quantity) : 0,
      })),
      bppcBySku,
    );

    res.json({ data: { ...shipmentHydrated, items } });
  } catch (err) {
    console.error('[API v1] Error fetching shipment:', err);
    res.status(500).json({ error: 'Failed to fetch shipment' });
  }
});

// POST /api/v1/shipments - Create shipment
router.post('/shipments', shipmentWriteMiddleware, async (req, res) => {
  const trx = await db.transaction();

  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) {
      await trx.rollback();
      return;
    }

    const {
      shipment_number: shipmentNumberIn,
      order_id: orderIdIn,
      order_type,
      po_number,
      carrier,
      tracking_number,
      from_location,
      to_location,
      destination_warehouse_id,
      destinationWarehouseId,
      status,
      ship_date,
      estimated_delivery,
      total_bottles: totalBottlesIn,
      items,
      ...shipmentData
    } = req.body;

    const shipment_number =
      shipmentNumberIn != null && String(shipmentNumberIn).trim() !== ''
        ? String(shipmentNumberIn).trim()
        : `SHIP-${Date.now()}`;

    let order_id = orderIdIn != null && orderIdIn !== '' ? Number(orderIdIn) : NaN;
    if (!Number.isFinite(order_id) && po_number != null && String(po_number).trim() !== '') {
      const po = await db('purchase_orders')
        .where({ tenant_id: tenantId, po_number: String(po_number).trim() })
        .first();
      if (po) order_id = Number(po.id);
    }

    if (!Number.isFinite(order_id) || !order_type) {
      await trx.rollback();
      return res.status(400).json({
        error: 'order_type is required and order_id must be set or resolvable from po_number',
      });
    }

    const ot = String(order_type).trim();
    if (req.user.role === Role.MANUFACTURER && ot !== 'purchase_order') {
      await trx.rollback();
      return res.status(403).json({
        error:
          'Manufacturer portal users may only record shipments tied to purchase orders (inbound finished goods).',
      });
    }

    let warehouseFields;
    try {
      warehouseFields = await resolveShipmentWarehouseFields(tenantId, {
        destination_warehouse_id: destination_warehouse_id ?? destinationWarehouseId,
        to_location: to_location ?? req.body.toLocation,
      });
    } catch (we) {
      await trx.rollback();
      const st = we.status || 500;
      return res.status(st).json({ error: we.message });
    }

    const toLocFinal = warehouseFields.toLocation;
    const destWhIdFinal = warehouseFields.destinationWarehouseId;
    if (!toLocFinal) {
      await trx.rollback();
      return res.status(400).json({
        error:
          'Receiving location is required: set destination_warehouse_id (preferred) or to_location (free text).',
      });
    }

    if (ot === 'sales_order') {
      const so = await trx('sales_orders')
        .where({ id: order_id, tenant_id: tenantId })
        .whereNull('deleted_at')
        .first();
      if (!so) {
        await trx.rollback();
        return res.status(400).json({ error: 'Sales order not found for this tenant.' });
      }
      const acc =
        so.account_id != null
          ? await trx('accounts').where({ id: so.account_id, tenant_id: tenantId }).first()
          : null;
      const at = String(acc?.type ?? '').toLowerCase();
      if (at !== 'distributor' && at !== 'wholesaler') {
        await trx.rollback();
        return res.status(400).json({
          error:
            'Warehouse-to-distributor shipments require the sales order account type to be distributor or wholesaler.',
        });
      }
      if (destWhIdFinal) {
        const whRow = await trx('warehouses').where({ id: destWhIdFinal, tenant_id: tenantId }).first();
        if (whRow?.linked_account_id && String(whRow.linked_account_id).trim() !== String(so.account_id).trim()) {
          await trx.rollback();
          return res.status(400).json({
            error:
              'Receiving warehouse must be the distributor depot linked to this order account (Settings → Warehouses → linked distributor account).',
          });
        }
      }
    }

    const fl =
      from_location != null ? String(from_location).trim() : req.body.fromLocation != null ? String(req.body.fromLocation).trim() : null;

    const originPortIn = req.body.origin_port ?? req.body.originPort;
    const waybillIn = req.body.waybill_number ?? req.body.waybillNumber;

    let originPortFinal = originPortIn != null ? String(originPortIn).trim() : null;
    let waybillFinal = waybillIn != null ? String(waybillIn).trim() : null;

    const shipDateInput = ship_date ?? req.body.shipDate;
    let shipDateForInsert;
    if (ot === 'purchase_order') {
      const sd = shipDateInput != null ? new Date(shipDateInput) : null;
      if (!sd || Number.isNaN(sd.getTime())) {
        await trx.rollback();
        return res.status(400).json({
          error:
            'Purchase order shipments require a valid shipping timestamp (ship_date / shipDate), e.g. ISO-8601 or datetime.',
        });
      }
      const car = carrier != null ? String(carrier).trim() : '';
      if (!car || car === '—') {
        await trx.rollback();
        return res.status(400).json({ error: 'Purchase order shipments require carrier.' });
      }
      if (!originPortFinal) {
        await trx.rollback();
        return res.status(400).json({
          error: 'Purchase order shipments require origin_port (port as shown on the waybill).',
        });
      }
      if (!waybillFinal) {
        await trx.rollback();
        return res.status(400).json({ error: 'Purchase order shipments require waybill_number.' });
      }
      shipDateForInsert = sd;
    } else {
      shipDateForInsert =
        shipDateInput != null && String(shipDateInput).trim() !== ''
          ? new Date(shipDateInput)
          : new Date();
      if (Number.isNaN(shipDateForInsert.getTime())) shipDateForInsert = new Date();
    }

    const carrierFinal =
      ot === 'purchase_order'
        ? String(carrier ?? '').trim()
        : carrier != null && String(carrier).trim() !== '' && String(carrier).trim() !== '—'
          ? String(carrier).trim()
          : null;

    const fromItemsQty =
      Array.isArray(items) && items.length > 0
        ? items.reduce((acc, it) => acc + Number(it.quantity ?? 0), 0)
        : 0;
    const totalBottlesPayload =
      totalBottlesIn != null && String(totalBottlesIn).trim() !== ''
        ? Number(totalBottlesIn)
        : shipmentData.totalBottles != null && String(shipmentData.totalBottles).trim() !== ''
          ? Number(shipmentData.totalBottles)
          : fromItemsQty;

    const [shipment] = await trx('shipments')
      .insert({
        tenant_id: tenantId,
        shipment_number,
        order_id,
        order_type: ot,
        carrier: carrierFinal,
        tracking_number: tracking_number != null ? String(tracking_number).trim() : null,
        from_location: fl,
        to_location: toLocFinal,
        destination_warehouse_id: destWhIdFinal,
        origin_port: originPortFinal,
        waybill_number: waybillFinal,
        status: status || 'packed',
        ship_date: shipDateForInsert,
        estimated_delivery,
        delivered_at: shipmentData.deliveredAt,
        total_bottles: Number.isFinite(totalBottlesPayload) ? totalBottlesPayload : 0,
        notes: shipmentData.notes,
        created_by: req.user?.userId,
      })
      .returning('*');

    if (items && items.length > 0) {
      const shipmentItems = items.map((item) => ({
        tenant_id: tenantId,
        shipment_id: shipment.id,
        product_id: item.productId || item.product_id,
        sku: item.sku,
        product_name: item.productName || item.product_name || item.name,
        quantity: item.quantity,
        batch_id: item.batchId || item.batch_id,
      }));

      await trx('shipment_items').insert(shipmentItems);
    }

    await trx.commit();

    const [named] = await hydrateShipmentDestinationWarehouseNames(tenantId, [shipment]);
    const [out] = await hydrateShipmentLineItems(tenantId, named);
    res.status(201).json({ data: out });
  } catch (err) {
    await trx.rollback();
    console.error('[API v1] Error creating shipment:', err);
    res.status(500).json({ error: 'Failed to create shipment' });
  }
});

// PUT /api/v1/shipments/:id - Update shipment
router.put('/shipments/:id', shipmentWriteMiddleware, async (req, res) => {
  const trx = await db.transaction();

  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) {
      await trx.rollback();
      return;
    }
    const { id } = req.params;
    const { items, ...shipmentData } = req.body;

    const existing = await trx('shipments')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .first();

    if (!existing) {
      await trx.rollback();
      return res.status(404).json({ error: 'Shipment not found' });
    }

    if (req.user.role === Role.MANUFACTURER) {
      const denied = manufacturerShipmentScopeDenied(existing);
      if (denied) {
        await trx.rollback();
        return res.status(denied.status).json({ error: denied.error });
      }
    }

    if (req.user.role === Role.DISTRIBUTOR) {
      const whIds = await distributorReceivingWarehouseIdsForUser(tenantId, req.user.email);
      if (!distributorHasShipmentAccess(existing, whIds)) {
        await trx.rollback();
        return res.status(403).json({ error: 'You can only update shipments routed to your receiving warehouse.' });
      }
    }

    const updates = {
      carrier: shipmentData.carrier,
      tracking_number: shipmentData.tracking_number || shipmentData.trackingNumber,
      from_location: shipmentData.from_location || shipmentData.fromLocation,
      origin_port: shipmentData.origin_port ?? shipmentData.originPort,
      waybill_number: shipmentData.waybill_number ?? shipmentData.waybillNumber,
      ship_date: shipmentData.ship_date || shipmentData.shipDate,
      estimated_delivery: shipmentData.estimated_delivery || shipmentData.estimatedDelivery,
      delivered_at: shipmentData.delivered_at || shipmentData.deliveredAt,
      total_bottles: shipmentData.total_bottles || shipmentData.totalBottles,
      notes: shipmentData.notes,
      updated_at: new Date(),
    };

    const hasWarehousePatch =
      shipmentData.destination_warehouse_id ||
      shipmentData.destinationWarehouseId ||
      shipmentData.to_location ||
      shipmentData.toLocation;
    if (hasWarehousePatch) {
      try {
        const w = await resolveShipmentWarehouseFields(tenantId, {
          destination_warehouse_id:
            shipmentData.destination_warehouse_id ?? shipmentData.destinationWarehouseId,
          to_location: shipmentData.to_location ?? shipmentData.toLocation,
        });
        updates.to_location = w.toLocation;
        updates.destination_warehouse_id = w.destinationWarehouseId;
      } catch (we) {
        await trx.rollback();
        const st = we.status || 500;
        return res.status(st).json({ error: we.message });
      }
    }

    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

    const merged = { ...existing };
    for (const key of Object.keys(updates)) {
      if (updates[key] !== undefined) merged[key] = updates[key];
    }
    if (merged.order_type === 'purchase_order') {
      const sd = merged.ship_date != null ? new Date(merged.ship_date) : null;
      if (!sd || Number.isNaN(sd.getTime())) {
        await trx.rollback();
        return res.status(400).json({
          error:
            'Purchase order shipments must keep a valid shipping timestamp (ship_date).',
        });
      }
      const car = merged.carrier != null ? String(merged.carrier).trim() : '';
      if (!car || car === '—') {
        await trx.rollback();
        return res.status(400).json({ error: 'Purchase order shipments require carrier.' });
      }
      const op = merged.origin_port != null ? String(merged.origin_port).trim() : '';
      if (!op) {
        await trx.rollback();
        return res.status(400).json({
          error: 'Purchase order shipments require origin_port (port as on the waybill).',
        });
      }
      const wb = merged.waybill_number != null ? String(merged.waybill_number).trim() : '';
      if (!wb) {
        await trx.rollback();
        return res.status(400).json({ error: 'Purchase order shipments require waybill_number.' });
      }
    }

    const [shipment] = await trx('shipments')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .update(updates)
      .returning('*');

    if (!shipment) {
      await trx.rollback();
      return res.status(404).json({ error: 'Shipment not found' });
    }

    if (items && items.length > 0) {
      await trx('shipment_items').where({ shipment_id: id, tenant_id: tenantId }).delete();

      const shipmentItems = items.map((item) => ({
        tenant_id: tenantId,
        shipment_id: id,
        product_id: item.productId || item.product_id,
        sku: item.sku,
        product_name: item.productName || item.product_name || item.name,
        quantity: item.quantity,
        batch_id: item.batchId || item.batch_id,
      }));

      await trx('shipment_items').insert(shipmentItems);
    }

    await trx.commit();

    const [out] = await hydrateShipmentDestinationWarehouseNames(tenantId, [shipment]);
    res.json({ data: out });
  } catch (err) {
    await trx.rollback();
    console.error('[API v1] Error updating shipment:', err);
    res.status(500).json({ error: 'Failed to update shipment' });
  }
});

// PATCH /api/v1/shipments/:id/status - Update shipment status
router.patch('/shipments/:id/status', shipmentWriteMiddleware, async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    const { status } = req.body;

    const existing = await db('shipments')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .first();
    if (!existing) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    if (req.user.role === Role.MANUFACTURER) {
      const denied = manufacturerShipmentScopeDenied(existing);
      if (denied) return res.status(denied.status).json({ error: denied.error });
    }

    if (req.user.role === Role.DISTRIBUTOR) {
      const whIds = await distributorReceivingWarehouseIdsForUser(tenantId, req.user.email);
      if (!distributorHasShipmentAccess(existing, whIds)) {
        return res.status(403).json({ error: 'You can only update shipments routed to your receiving warehouse.' });
      }
    }

    const validStatuses = [
      'packed',
      'picked_up',
      'in_transit',
      'out_for_delivery',
      'delivered',
      'exception',
      'cancelled',
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updates = {
      status,
      updated_at: new Date(),
    };

    if (status === 'delivered') {
      updates.delivered_at = new Date();
    }

    const [shipment] = await db('shipments')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .update(updates)
      .returning('*');

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    const [out] = await hydrateShipmentDestinationWarehouseNames(tenantId, [shipment]);
    res.json({ data: out });
  } catch (err) {
    console.error('[API v1] Error updating shipment status:', err);
    res.status(500).json({ error: 'Failed to update shipment status' });
  }
});

// DELETE /api/v1/shipments/:id - Soft delete shipment
router.delete('/shipments/:id', shipmentWriteMiddleware, async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;

    const existing = await db('shipments')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .first();
    if (!existing) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    if (req.user.role === Role.MANUFACTURER) {
      const denied = manufacturerShipmentScopeDenied(existing);
      if (denied) return res.status(denied.status).json({ error: denied.error });
    }

    if (req.user.role === Role.DISTRIBUTOR) {
      const whIds = await distributorReceivingWarehouseIdsForUser(tenantId, req.user.email);
      if (!distributorHasShipmentAccess(existing, whIds)) {
        return res.status(403).json({ error: 'You can only delete shipments routed to your receiving warehouse.' });
      }
    }

    const [shipment] = await db('shipments')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .update({ deleted_at: new Date(), updated_at: new Date() })
      .returning('*');

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    res.json({ data: shipment, message: 'Shipment deleted' });
  } catch (err) {
    console.error('[API v1] Error deleting shipment:', err);
    res.status(500).json({ error: 'Failed to delete shipment' });
  }
});

// ===== INCENTIVES =====

// GET /api/v1/incentives - List incentives
router.get('/incentives', requirePermission(Permission.REPORTS_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { page = 1, limit = 50, type, status, account_id } = req.query;
    
    let baseQuery = db('incentives')
      .where({ tenant_id: tenantId })
      .whereNull('deleted_at');
    
    if (type) baseQuery = baseQuery.where('type', type);
    if (status) baseQuery = baseQuery.where('status', status);
    if (account_id) baseQuery = baseQuery.where('account_id', account_id);
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const countQuery = baseQuery.clone().count('id as count').first();
    
    const dataQuery = baseQuery
      .clone()
      .orderBy('created_at', 'desc')
      .limit(Number(limit))
      .offset(offset);
    
    const [countResult, incentives] = await Promise.all([countQuery, dataQuery]);
    
    res.json({
      data: incentives,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(countResult?.count || 0),
        totalPages: Math.ceil(Number(countResult?.count || 0) / Number(limit))
      }
    });
  } catch (err) {
    console.error('[API v1] Error fetching incentives:', err);
    res.status(500).json({ error: 'Failed to fetch incentives' });
  }
});

// GET /api/v1/incentives/:id - Get single incentive
router.get('/incentives/:id', requirePermission(Permission.REPORTS_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    
    const incentive = await db('incentives')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .first();
    
    if (!incentive) {
      return res.status(404).json({ error: 'Incentive not found' });
    }
    
    res.json({ data: incentive });
  } catch (err) {
    console.error('[API v1] Error fetching incentive:', err);
    res.status(500).json({ error: 'Failed to fetch incentive' });
  }
});

// POST /api/v1/incentives - Create incentive
router.post('/incentives', requirePermission(Permission.SETTINGS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { 
      name,
      type,
      target_sku,
      target_account_id,
      threshold_quantity,
      reward_type,
      reward_amount,
      start_date,
      end_date,
      notes
    } = req.body;
    
    if (!name || !type || !reward_type) {
      return res.status(400).json({ error: 'name, type, and reward_type are required' });
    }
    
    const [incentive] = await db('incentives')
      .insert({
        tenant_id: tenantId,
        name,
        type,
        target_sku,
        target_account_id,
        threshold_quantity,
        reward_type,
        reward_amount,
        start_date,
        end_date,
        status: 'draft',
        notes,
        created_by: req.user?.userId,
        created_at: new Date()
      })
      .returning('*');
    
    res.status(201).json({ data: incentive });
  } catch (err) {
    console.error('[API v1] Error creating incentive:', err);
    res.status(500).json({ error: 'Failed to create incentive' });
  }
});

// PUT /api/v1/incentives/:id - Update incentive
router.put('/incentives/:id', requirePermission(Permission.SETTINGS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    const updates = req.body;
    
    delete updates.id;
    delete updates.tenant_id;
    delete updates.created_at;
    
    updates.updated_at = new Date();
    updates.updated_by = req.user?.userId;
    
    const [incentive] = await db('incentives')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .update(updates)
      .returning('*');
    
    if (!incentive) {
      return res.status(404).json({ error: 'Incentive not found' });
    }
    
    res.json({ data: incentive });
  } catch (err) {
    console.error('[API v1] Error updating incentive:', err);
    res.status(500).json({ error: 'Failed to update incentive' });
  }
});

// PATCH /api/v1/incentives/:id/status - Update incentive status
router.patch('/incentives/:id/status', requirePermission(Permission.SETTINGS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['draft', 'active', 'paused', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const [incentive] = await db('incentives')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .update({ 
        status, 
        updated_at: new Date(),
        updated_by: req.user?.userId
      })
      .returning('*');
    
    if (!incentive) {
      return res.status(404).json({ error: 'Incentive not found' });
    }
    
    res.json({ data: incentive });
  } catch (err) {
    console.error('[API v1] Error updating incentive status:', err);
    res.status(500).json({ error: 'Failed to update incentive status' });
  }
});

// DELETE /api/v1/incentives/:id - Soft delete incentive
router.delete('/incentives/:id', requirePermission(Permission.SETTINGS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    
    const [incentive] = await db('incentives')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .update({ deleted_at: new Date(), updated_at: new Date() })
      .returning('*');
    
    if (!incentive) {
      return res.status(404).json({ error: 'Incentive not found' });
    }
    
    res.json({ data: incentive, message: 'Incentive deleted' });
  } catch (err) {
    console.error('[API v1] Error deleting incentive:', err);
    res.status(500).json({ error: 'Failed to delete incentive' });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// PHASE 2 — NEW TABLES (Migration 009)
// ═══════════════════════════════════════════════════════════════════════

// ===== TEAM MEMBERS =====

// GET /api/v1/team-members
router.get('/team-members', async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    const canSettings = hasPermission(req.user.role, Permission.SETTINGS_READ);
    const isDistributor = req.user.role === 'distributor';
    const isSalesRep = req.user.role === 'sales_rep';

    if (!canSettings && !isDistributor && !isSalesRep) {
      return res.status(403).json({ error: 'Insufficient permissions to list CRM contacts.' });
    }

    const includeInactive =
      req.query.include_inactive === 'true' ||
      req.query.include_inactive === '1';

    let query = db('team_members').where({ tenant_id: tenantId });

    if (isDistributor) {
      query = query.whereIn('role', ['sales_rep', 'retail']);
    } else if (isSalesRep) {
      query = query.where('role', 'retail').andWhere(function scopeRetailVisibility() {
        this.where(function notPendingOrLegacy() {
          this.where('pending_distributor_approval', false).orWhereNull('pending_distributor_approval');
        }).orWhere('crm_requested_by_user_id', req.user.userId);
      });
    }

    if (!includeInactive) {
      query = query.where(function activeOrPending() {
        this.where('is_active', true).orWhere(function pendingRetailRow() {
          this.where('pending_distributor_approval', true);
        });
      });
    }

    const members = await query.orderBy('created_at', 'desc');

    res.json({ data: members });
  } catch (err) {
    console.error('[API v1] Error fetching team members:', err);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

/**
 * GET /api/v1/purchase-order-manufacturer-options
 * CRM manufacturer contacts (team_members) merged with manufacturer_profiles by email.
 * Uses PO_READ so Operations can create POs without SETTINGS_READ (team-members list is HQ-only).
 */
router.get('/purchase-order-manufacturer-options', requirePermission(Permission.PO_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    const members = await db('team_members')
      .where({ tenant_id: tenantId, role: 'manufacturer' })
      .where('is_active', true)
      .orderBy('name', 'asc');

    const profiles = await db('manufacturer_profiles').where({ tenant_id: tenantId });

    const profileByEmail = new Map();
    for (const p of profiles) {
      const em = String(p.email ?? '').trim().toLowerCase();
      if (em) profileByEmail.set(em, p);
    }

    const options = [];

    for (const m of members) {
      const email = String(m.email ?? '').trim().toLowerCase();
      const prof = profileByEmail.get(email);
      let label = prof?.company_name ? String(prof.company_name).trim() : '';
      if (!label && prof?.contact_name) label = String(prof.contact_name).trim();
      if (!label) label = String(m.name ?? '').trim();
      if (!label) label = email;

      options.push({
        key: String(m.id),
        label,
        email,
        crmMemberId: String(m.id),
        hasProfile: Boolean(prof),
      });
    }

    const crmEmails = new Set(members.map((x) => String(x.email ?? '').trim().toLowerCase()));

    for (const p of profiles) {
      const em = String(p.email ?? '').trim().toLowerCase();
      if (!em || crmEmails.has(em)) continue;
      const label =
        String(p.company_name ?? '').trim() ||
        String(p.contact_name ?? '').trim();
      if (!label) continue;
      options.push({
        key: `prof:${em}`,
        label,
        email: em,
        crmMemberId: null,
        hasProfile: true,
      });
    }

    options.sort((a, b) => a.label.localeCompare(b.label));

    res.json({ data: options });
  } catch (err) {
    console.error('[API v1] Error listing purchase-order manufacturer options:', err);
    res.status(500).json({ error: 'Failed to load manufacturer options' });
  }
});

/** CRM retail row submitted by this sales rep (`team_members.crm_requested_by_user_id`). */
function salesRepOwnsRetailRow(member, userId) {
  if (member?.role !== 'retail') return false;
  const uid = userId != null && userId !== '' ? String(userId) : '';
  const owner =
    member.crm_requested_by_user_id != null && member.crm_requested_by_user_id !== ''
      ? String(member.crm_requested_by_user_id)
      : '';
  return uid !== '' && owner !== '' && uid === owner;
}

/**
 * Wholesaler/distributor may edit, deactivate, resend invites only for `sales_rep` CRM rows.
 */
function assertDistributorManagesSalesRepOnly(current, body) {
  if (current.role !== 'sales_rep') {
    return {
      ok: false,
      error: 'Distributors may only manage Sales rep CRM contacts on this action.',
    };
  }
  const nextRole = body?.role != null ? String(body.role).trim() : null;
  if (nextRole != null && nextRole !== 'sales_rep') {
    return {
      ok: false,
      error: 'Distributors cannot change a Sales rep into another CRM role.',
    };
  }
  return { ok: true };
}

function assertSalesRepOwnRetailOnly(current, body) {
  if (current.role !== 'retail') {
    return {
      ok: false,
      error: 'Sales reps may only manage Retail store CRM contacts they submitted.',
    };
  }
  const nextRole = body?.role != null ? String(body.role).trim() : null;
  if (nextRole != null && nextRole !== 'retail') {
    return {
      ok: false,
      error: 'Sales reps cannot change a Retail contact into another CRM role.',
    };
  }
  return { ok: true };
}

/**
 * Brand HQ: full access. Distributor: `sales_rep` rows only. Sales rep: own `retail` rows only (by crm_requested_by_user_id).
 */
function canMutateTeamMember(req, current, body) {
  if (hasPermission(req.user.role, Permission.SETTINGS_WRITE)) {
    return { ok: true };
  }
  const actor = req.user.role;
  if (actor === 'distributor') {
    const d = assertDistributorManagesSalesRepOnly(current, body || {});
    if (!d.ok) return { ok: false, status: 403, error: d.error };
    return { ok: true };
  }
  if (actor === 'sales_rep') {
    const s = assertSalesRepOwnRetailOnly(current, body || {});
    if (!s.ok) return { ok: false, status: 403, error: s.error };
    if (!salesRepOwnsRetailRow(current, req.user.userId)) {
      return {
        ok: false,
        status: 403,
        error: 'You can only manage retail CRM contacts you submitted.',
      };
    }
    return { ok: true };
  }
  return { ok: false, status: 403, error: 'Insufficient permissions.' };
}

// POST /api/v1/team-members
router.post('/team-members', async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { name, email, role, phone, department } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ error: 'name, email, and role are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const roleToCreate = String(role).trim();
    const hasSettingsWrite = hasPermission(req.user.role, Permission.SETTINGS_WRITE);
    const actor = req.user.role;

    if (!hasSettingsWrite) {
      if (actor === 'distributor') {
        if (roleToCreate !== 'sales_rep') {
          return res.status(403).json({
            error:
              'Distributors may only add Sales rep CRM contacts. Other roles are managed by Brand HQ.',
          });
        }
      } else if (actor === 'sales_rep') {
        if (roleToCreate !== 'retail') {
          return res.status(403).json({
            error:
              'Sales reps may only submit Retail store contacts for wholesaler / distributor approval.',
          });
        }
      } else {
        return res.status(403).json({ error: 'Insufficient permissions to create CRM contacts.' });
      }
    }

    const pendingRetail = !hasSettingsWrite && actor === 'sales_rep' && roleToCreate === 'retail';

    // If this email already exists for the tenant, return a clear 409 (or reactivate).
    const existing = await db('team_members')
      .where({ tenant_id: tenantId, email: normalizedEmail })
      .first();
    if (existing) {
      if (existing.is_active === false) {
        if (!hasSettingsWrite) {
          const salesRepReaddingOwnRetail =
            actor === 'sales_rep' &&
            roleToCreate === 'retail' &&
            existing.role === 'retail' &&
            salesRepOwnsRetailRow(existing, req.user.userId);
          if (!salesRepReaddingOwnRetail) {
            return res.status(403).json({
              error: 'Only Brand HQ can reactivate archived CRM contacts you do not own.',
            });
          }
          const [reactivated] = await db('team_members')
            .where({ tenant_id: tenantId, email: normalizedEmail })
            .update({
              name,
              role: 'retail',
              phone,
              department,
              is_active: true,
              updated_at: new Date(),
            })
            .returning('*');
          let member = reactivated;
          member = await db('team_members').where({ id: member.id, tenant_id: tenantId }).first();
          if (member.pending_distributor_approval) {
            return res.status(200).json({
              data: member,
              invite: {
                status: 'pending_distributor_approval',
                reason: 'Awaiting wholesaler / distributor approval before portal invite.',
              },
              message: 'Retail CRM contact restored — still awaiting distributor approval.',
            });
          }
          const payload = await buildCrmContactInvitePayload(req, tenantId, member, {
            email: normalizedEmail,
            name,
            role: 'retail',
          });
          return res.status(200).json({ ...payload, message: 'Retail CRM contact reactivated' });
        }
        const [reactivated] = await db('team_members')
          .where({ tenant_id: tenantId, email: normalizedEmail })
          .update({
            name,
            role,
            phone,
            department,
            is_active: true,
            updated_at: new Date(),
          })
          .returning('*');
        let member = reactivated;
        const pwOpt = parseOptionalPrimaryWarehouseId(req.body);
        if (role === 'distributor' && pwOpt != null && pwOpt !== '') {
          try {
            await db.transaction(async (trx) => {
              await setDistributorReceivingWarehouse(trx, tenantId, member.id, pwOpt);
            });
            member = await db('team_members').where({ id: member.id, tenant_id: tenantId }).first();
          } catch (e) {
            const st = e.status || 500;
            if (st === 404 || st === 400) {
              return res.status(st).json({ error: e.message });
            }
            throw e;
          }
        }
        const payload = await buildCrmContactInvitePayload(req, tenantId, member, {
          email: normalizedEmail,
          name,
          role,
        });
        return res.status(200).json({ ...payload, message: 'Team member reactivated' });
      }
      return res.status(409).json({ error: 'A CRM contact with this email already exists.' });
    }

    const id = `tm-${Date.now()}`;
    let [member] = await db('team_members')
      .insert({
        id,
        tenant_id: tenantId,
        name,
        email: normalizedEmail,
        role: roleToCreate,
        phone,
        department,
        is_active: pendingRetail ? false : true,
        pending_distributor_approval: pendingRetail,
        crm_requested_by_user_id: pendingRetail ? req.user.userId : null,
        created_by: req.user?.userId,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    if (pendingRetail) {
      member = await db('team_members').where({ id: member.id, tenant_id: tenantId }).first();
      return res.status(201).json({
        data: member,
        invite: {
          status: 'pending_distributor_approval',
          reason: 'Awaiting wholesaler / distributor approval before portal invite.',
        },
      });
    }

    const pwOpt = parseOptionalPrimaryWarehouseId(req.body);
    if (roleToCreate === 'distributor' && pwOpt != null && pwOpt !== '') {
      try {
        await db.transaction(async (trx) => {
          await setDistributorReceivingWarehouse(trx, tenantId, member.id, pwOpt);
        });
        member = await db('team_members').where({ id: member.id, tenant_id: tenantId }).first();
      } catch (e) {
        const st = e.status || 500;
        if (st === 404 || st === 400) {
          return res.status(st).json({ error: e.message });
        }
        throw e;
      }
    }

    const payload = await buildCrmContactInvitePayload(req, tenantId, member, {
      email: normalizedEmail,
      name,
      role: roleToCreate,
    });
    res.status(201).json(payload);
  } catch (err) {
    console.error('[API v1] Error creating team member:', err);
    res.status(500).json({ error: 'Failed to create team member' });
  }
});

// POST /api/v1/team-members/:id/approve-retail — distributor / HQ approves sales-rep-submitted retail CRM
router.post('/team-members/:id/approve-retail', async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;

    const actor = req.user.role;
    const canApprove =
      hasPermission(actor, Permission.SETTINGS_WRITE) || actor === 'distributor';
    if (!canApprove) {
      return res.status(403).json({
        error: 'Only a wholesaler/distributor or Brand HQ can approve retail CRM requests.',
      });
    }

    const row = await db('team_members').where({ id, tenant_id: tenantId }).first();
    if (!row) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    if (row.role !== 'retail' || !row.pending_distributor_approval) {
      return res.status(400).json({ error: 'Not a pending retail CRM request.' });
    }

    await db('team_members').where({ id, tenant_id: tenantId }).update({
      pending_distributor_approval: false,
      is_active: true,
      updated_at: new Date(),
    });

    const member = await db('team_members').where({ id, tenant_id: tenantId }).first();
    const payload = await buildCrmContactInvitePayload(req, tenantId, member, {
      email: member.email,
      name: member.name,
      role: member.role,
    });
    res.json({ ...payload, message: 'Retail CRM contact approved' });
  } catch (err) {
    console.error('[API v1] Error approving retail CRM:', err);
    res.status(500).json({ error: 'Failed to approve retail CRM contact' });
  }
});

// POST /api/v1/team-members/:id/resend-invite
router.post('/team-members/:id/resend-invite', async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;

    const member = await db('team_members')
      .where({ id, tenant_id: tenantId })
      .first();

    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    const gate = canMutateTeamMember(req, member, {});
    if (!gate.ok) {
      return res.status(gate.status).json({ error: gate.error });
    }

    if (member.pending_distributor_approval) {
      return res.status(400).json({
        error:
          'This retail contact is still awaiting wholesaler / distributor approval before a portal invite can be sent.',
      });
    }

    if (member.is_active === false) {
      return res.status(400).json({ error: 'Cannot resend invite for an inactive CRM contact' });
    }

    const payload = await buildCrmContactInvitePayload(req, tenantId, member, {
      email: member.email,
      name: member.name,
      role: member.role,
    });

    res.status(200).json(payload);
  } catch (err) {
    console.error('[API v1] Error resending CRM invite:', err);
    res.status(500).json({ error: 'Failed to resend invite' });
  }
});

// PATCH /api/v1/team-members/:id
router.patch('/team-members/:id', async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;

    const { name, email, role, phone, department, is_active } = req.body || {};
    const pwOpt = parseOptionalPrimaryWarehouseId(req.body);

    const current = await db('team_members')
      .where({ id, tenant_id: tenantId })
      .first();
    if (!current) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    const gate = canMutateTeamMember(req, current, req.body || {});
    if (!gate.ok) {
      return res.status(gate.status).json({ error: gate.error });
    }

    const updates = {};
    if (name != null) updates.name = String(name).trim();
    if (role != null) updates.role = String(role).trim();
    if (phone != null) updates.phone = phone;
    if (department != null) updates.department = department;
    if (is_active != null) updates.is_active = Boolean(is_active);

    if (email != null) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!normalizedEmail) {
        return res.status(400).json({ error: 'email must be non-empty' });
      }
      // Ensure uniqueness within tenant (excluding current record).
      const conflict = await db('team_members')
        .where({ tenant_id: tenantId, email: normalizedEmail })
        .whereNot({ id })
        .first();
      if (conflict) {
        return res.status(409).json({ error: 'A CRM contact with this email already exists.' });
      }
      updates.email = normalizedEmail;
    }

    const effectiveRole = updates.role !== undefined ? updates.role : current.role;
    const clearingByRole =
      updates.role != null && updates.role !== 'distributor' && current.role === 'distributor';

    if (pwOpt !== undefined) {
      if (effectiveRole !== 'distributor') {
        return res.status(400).json({
          error: 'primary_warehouse_id applies only to distributor contacts.',
        });
      }
      const wid = pwOpt === null || pwOpt === '' ? null : String(pwOpt).trim();
      try {
        await db.transaction(async (trx) => {
          if (Object.keys(updates).length > 0) {
            updates.updated_at = new Date();
            await trx('team_members').where({ id, tenant_id: tenantId }).update(updates);
          }
          await setDistributorReceivingWarehouse(trx, tenantId, id, wid);
        });
      } catch (e) {
        const st = e.status || 500;
        if (st === 404 || st === 400) {
          return res.status(st).json({ error: e.message });
        }
        throw e;
      }
      const member = await db('team_members').where({ id, tenant_id: tenantId }).first();
      return res.json({ data: member });
    }

    if (clearingByRole) {
      await db.transaction(async (trx) => {
        updates.updated_at = new Date();
        await trx('team_members').where({ id, tenant_id: tenantId }).update(updates);
        await setDistributorReceivingWarehouse(trx, tenantId, id, null);
      });
      const member = await db('team_members').where({ id, tenant_id: tenantId }).first();
      return res.json({ data: member });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields provided to update' });
    }

    updates.updated_at = new Date();

    const [member] = await db('team_members')
      .where({ id, tenant_id: tenantId })
      .update(updates)
      .returning('*');

    res.json({ data: member });
  } catch (err) {
    console.error('[API v1] Error updating team member:', err);
    res.status(500).json({ error: 'Failed to update team member' });
  }
});

// PATCH /api/v1/team-members/by-email/:email
router.patch('/team-members/by-email/:email', async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const emailParam = String(req.params.email || '').trim().toLowerCase();
    if (!emailParam) return res.status(400).json({ error: 'email is required' });

    const current = await db('team_members')
      .where({ tenant_id: tenantId, email: emailParam })
      .first();
    if (!current) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    const gate = canMutateTeamMember(req, current, req.body || {});
    if (!gate.ok) {
      return res.status(gate.status).json({ error: gate.error });
    }

    const { name, email, role, phone, department, is_active } = req.body || {};
    const pwOpt = parseOptionalPrimaryWarehouseId(req.body);
    const id = current.id;

    const updates = {};
    if (name != null) updates.name = String(name).trim();
    if (role != null) updates.role = String(role).trim();
    if (phone != null) updates.phone = phone;
    if (department != null) updates.department = department;
    if (is_active != null) updates.is_active = Boolean(is_active);

    if (email != null) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!normalizedEmail) {
        return res.status(400).json({ error: 'email must be non-empty' });
      }
      const conflict = await db('team_members')
        .where({ tenant_id: tenantId, email: normalizedEmail })
        .whereNot({ id: current.id })
        .first();
      if (conflict) {
        return res.status(409).json({ error: 'A CRM contact with this email already exists.' });
      }
      updates.email = normalizedEmail;
    }

    const effectiveRole = updates.role !== undefined ? updates.role : current.role;
    const clearingByRole =
      updates.role != null && updates.role !== 'distributor' && current.role === 'distributor';

    if (pwOpt !== undefined) {
      if (effectiveRole !== 'distributor') {
        return res.status(400).json({
          error: 'primary_warehouse_id applies only to distributor contacts.',
        });
      }
      const wid = pwOpt === null || pwOpt === '' ? null : String(pwOpt).trim();
      try {
        await db.transaction(async (trx) => {
          if (Object.keys(updates).length > 0) {
            updates.updated_at = new Date();
            await trx('team_members').where({ id, tenant_id: tenantId }).update(updates);
          }
          await setDistributorReceivingWarehouse(trx, tenantId, id, wid);
        });
      } catch (e) {
        const st = e.status || 500;
        if (st === 404 || st === 400) {
          return res.status(st).json({ error: e.message });
        }
        throw e;
      }
      const member = await db('team_members').where({ id, tenant_id: tenantId }).first();
      return res.json({ data: member });
    }

    if (clearingByRole) {
      await db.transaction(async (trx) => {
        updates.updated_at = new Date();
        await trx('team_members').where({ id, tenant_id: tenantId }).update(updates);
        await setDistributorReceivingWarehouse(trx, tenantId, id, null);
      });
      const member = await db('team_members').where({ id, tenant_id: tenantId }).first();
      return res.json({ data: member });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields provided to update' });
    }

    updates.updated_at = new Date();

    const [member] = await db('team_members')
      .where({ id: current.id, tenant_id: tenantId })
      .update(updates)
      .returning('*');

    res.json({ data: member });
  } catch (err) {
    console.error('[API v1] Error updating team member by email:', err);
    res.status(500).json({ error: 'Failed to update team member' });
  }
});

// POST /api/v1/team-members/by-email/:email/resend-invite
router.post('/team-members/by-email/:email/resend-invite', async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const emailParam = String(req.params.email || '').trim().toLowerCase();
    if (!emailParam) return res.status(400).json({ error: 'email is required' });

    const member = await db('team_members')
      .where({ tenant_id: tenantId, email: emailParam })
      .first();
    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    const gate = canMutateTeamMember(req, member, {});
    if (!gate.ok) {
      return res.status(gate.status).json({ error: gate.error });
    }

    if (member.pending_distributor_approval) {
      return res.status(400).json({
        error:
          'This retail contact is still awaiting wholesaler / distributor approval before a portal invite can be sent.',
      });
    }

    if (member.is_active === false) {
      return res.status(400).json({ error: 'Cannot resend invite for an inactive CRM contact' });
    }

    const payload = await buildCrmContactInvitePayload(req, tenantId, member, {
      email: member.email,
      name: member.name,
      role: member.role,
    });
    res.status(200).json(payload);
  } catch (err) {
    console.error('[API v1] Error resending CRM invite by email:', err);
    res.status(500).json({ error: 'Failed to resend invite' });
  }
});

// DELETE /api/v1/team-members/:id
router.delete('/team-members/:id', async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;

    const existing = await db('team_members').where({ id, tenant_id: tenantId }).first();
    if (!existing) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    const gate = canMutateTeamMember(req, existing, {});
    if (!gate.ok) {
      return res.status(gate.status).json({ error: gate.error });
    }

    const [member] = await db('team_members')
      .where({ id, tenant_id: tenantId })
      .update({ is_active: false, updated_at: new Date() })
      .returning('*');

    res.json({ data: member, message: 'Team member deactivated' });
  } catch (err) {
    console.error('[API v1] Error deleting team member:', err);
    res.status(500).json({ error: 'Failed to delete team member' });
  }
});

// DELETE /api/v1/team-members/by-email/:email
router.delete('/team-members/by-email/:email', async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const emailParam = String(req.params.email || '').trim().toLowerCase();
    if (!emailParam) return res.status(400).json({ error: 'email is required' });

    const existing = await db('team_members')
      .where({ tenant_id: tenantId, email: emailParam })
      .first();
    if (!existing) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    const gate = canMutateTeamMember(req, existing, {});
    if (!gate.ok) {
      return res.status(gate.status).json({ error: gate.error });
    }

    const [member] = await db('team_members')
      .where({ tenant_id: tenantId, email: emailParam })
      .update({ is_active: false, updated_at: new Date() })
      .returning('*');

    res.json({ data: member, message: 'Team member deactivated' });
  } catch (err) {
    console.error('[API v1] Error deleting team member by email:', err);
    res.status(500).json({ error: 'Failed to delete team member' });
  }
});

// ===== OPERATIONAL SETTINGS (singleton per tenant) =====

// GET /api/v1/operational-settings
router.get('/operational-settings', requirePermission(Permission.SETTINGS_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    
    let settings = await db('operational_settings')
      .where({ tenant_id: tenantId })
      .first();
    
    if (!settings) {
      // Auto-create defaults
      const [created] = await db('operational_settings')
        .insert({ tenant_id: tenantId, updated_at: new Date() })
        .returning('*');
      settings = created;
    }
    
    res.json({ data: settings });
  } catch (err) {
    console.error('[API v1] Error fetching operational settings:', err);
    res.status(500).json({ error: 'Failed to fetch operational settings' });
  }
});

// PUT /api/v1/operational-settings
router.put('/operational-settings', requirePermission(Permission.SETTINGS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const updates = req.body;
    
    delete updates.tenant_id;
    delete updates.created_at;
    updates.updated_at = new Date();
    
    const [settings] = await db('operational_settings')
      .where({ tenant_id: tenantId })
      .update(updates)
      .returning('*');
    
    if (!settings) {
      // Create if missing
      const [created] = await db('operational_settings')
        .insert({ ...updates, tenant_id: tenantId })
        .returning('*');
      return res.json({ data: created });
    }
    
    res.json({ data: settings });
  } catch (err) {
    console.error('[API v1] Error updating operational settings:', err);
    res.status(500).json({ error: 'Failed to update operational settings' });
  }
});

// ===== SUPPORT TICKETS =====

// GET /api/v1/support-tickets
router.get('/support-tickets', requirePermission(Permission.ORDERS_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { status, priority, account_id } = req.query;
    
    let query = db('support_tickets')
      .where({ tenant_id: tenantId })
      .orderBy('created_at', 'desc');
    
    if (status) query = query.where('status', status);
    if (priority) query = query.where('priority', priority);
    if (account_id) query = query.where('account_id', account_id);
    
    const tickets = await query;
    res.json({ data: tickets });
  } catch (err) {
    console.error('[API v1] Error fetching support tickets:', err);
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

// GET /api/v1/support-tickets/:id
router.get('/support-tickets/:id', requirePermission(Permission.ORDERS_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    
    const ticket = await db('support_tickets')
      .where({ id, tenant_id: tenantId })
      .first();
    
    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }
    
    const replies = await db('support_ticket_replies')
      .where({ ticket_id: id, tenant_id: tenantId })
      .orderBy('created_at', 'asc');
    
    res.json({ data: { ...ticket, replies } });
  } catch (err) {
    console.error('[API v1] Error fetching support ticket:', err);
    res.status(500).json({ error: 'Failed to fetch support ticket' });
  }
});

// POST /api/v1/support-tickets
router.post('/support-tickets', requirePermission(Permission.ORDERS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { title, description, priority, category, account_id } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: 'title and description are required' });
    }
    
    const id = `st-${Date.now()}`;
    const [ticket] = await db('support_tickets')
      .insert({
        id,
        tenant_id: tenantId,
        title,
        description,
        status: 'open',
        priority: priority || 'medium',
        category,
        account_id,
        created_by: req.user?.userId,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');
    
    res.status(201).json({ data: ticket });
  } catch (err) {
    console.error('[API v1] Error creating support ticket:', err);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

// POST /api/v1/support-tickets/:id/replies
router.post('/support-tickets/:id/replies', requirePermission(Permission.ORDERS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }
    
    const [reply] = await db('support_ticket_replies')
      .insert({
        tenant_id: tenantId,
        ticket_id: id,
        message,
        created_by: req.user?.userId,
        created_at: new Date()
      })
      .returning('*');
    
    // Update ticket status to in_progress if it was open
    await db('support_tickets')
      .where({ id, tenant_id: tenantId, status: 'open' })
      .update({ status: 'in_progress', updated_at: new Date() });
    
    res.status(201).json({ data: reply });
  } catch (err) {
    console.error('[API v1] Error creating ticket reply:', err);
    res.status(500).json({ error: 'Failed to create ticket reply' });
  }
});

// PATCH /api/v1/support-tickets/:id/status
router.patch('/support-tickets/:id/status', requirePermission(Permission.ORDERS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    const { status } = req.body;
    
    const valid = ['open', 'in_progress', 'resolved', 'closed'];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const updates = { status, updated_at: new Date() };
    if (status === 'resolved') updates.resolved_at = new Date();
    
    const [ticket] = await db('support_tickets')
      .where({ id, tenant_id: tenantId })
      .update(updates)
      .returning('*');
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json({ data: ticket });
  } catch (err) {
    console.error('[API v1] Error updating ticket status:', err);
    res.status(500).json({ error: 'Failed to update ticket status' });
  }
});

// ===== MANUFACTURER PROFILES =====

// GET /api/v1/manufacturer-profiles
router.get('/manufacturer-profiles', requirePermission(Permission.PRODUCTION_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    
    const profiles = await db('manufacturer_profiles')
      .where({ tenant_id: tenantId })
      .orderBy('created_at', 'desc');
    
    res.json({ data: profiles });
  } catch (err) {
    console.error('[API v1] Error fetching manufacturer profiles:', err);
    res.status(500).json({ error: 'Failed to fetch manufacturer profiles' });
  }
});

// GET /api/v1/manufacturer-profiles/:id
router.get('/manufacturer-profiles/:id', requirePermission(Permission.PRODUCTION_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    
    const profile = await db('manufacturer_profiles')
      .where({ id, tenant_id: tenantId })
      .first();
    
    if (!profile) {
      return res.status(404).json({ error: 'Manufacturer profile not found' });
    }
    
    res.json({ data: profile });
  } catch (err) {
    console.error('[API v1] Error fetching manufacturer profile:', err);
    res.status(500).json({ error: 'Failed to fetch manufacturer profile' });
  }
});

// POST /api/v1/manufacturer-profiles
router.post('/manufacturer-profiles', requirePermission(Permission.PRODUCTION_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const data = req.body;
    
    if (!data.manufacturer_id) {
      return res.status(400).json({ error: 'manufacturer_id is required' });
    }

    const existing = await db('manufacturer_profiles')
      .where({ tenant_id: tenantId, manufacturer_id: String(data.manufacturer_id) })
      .first();
    if (existing) {
      const updates = { ...data };
      delete updates.id;
      delete updates.tenant_id;
      delete updates.created_at;
      updates.updated_at = new Date();
      const [profile] = await db('manufacturer_profiles')
        .where({ id: existing.id, tenant_id: tenantId })
        .update(updates)
        .returning('*');
      return res.status(200).json({ data: profile });
    }
    
    const id = `mp-${Date.now()}`;
    const [profile] = await db('manufacturer_profiles')
      .insert({
        id,
        tenant_id: tenantId,
        manufacturer_id: data.manufacturer_id,
        company_name: data.company_name,
        contact_name: data.contact_name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        region: data.region,
        postal_code: data.postal_code,
        country: data.country,
        website: data.website,
        tax_id: data.tax_id,
        bank_name: data.bank_name,
        bank_account: data.bank_account,
        iban: data.iban,
        swift: data.swift,
        currency: data.currency || 'USD',
        capacity_bottles_per_month: data.capacity_bottles_per_month,
        min_order_bottles: data.min_order_bottles,
        lead_time_days: data.lead_time_days,
        payment_terms: data.payment_terms,
        certifications: data.certifications,
        notes: data.notes,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');
    
    res.status(201).json({ data: profile });
  } catch (err) {
    console.error('[API v1] Error creating manufacturer profile:', err);
    res.status(500).json({ error: 'Failed to create manufacturer profile' });
  }
});

// PUT /api/v1/manufacturer-profiles/:id
router.put('/manufacturer-profiles/:id', requirePermission(Permission.PRODUCTION_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    const updates = req.body;
    
    delete updates.id;
    delete updates.tenant_id;
    delete updates.created_at;
    updates.updated_at = new Date();
    
    const [profile] = await db('manufacturer_profiles')
      .where({ id, tenant_id: tenantId })
      .update(updates)
      .returning('*');
    
    if (!profile) {
      return res.status(404).json({ error: 'Manufacturer profile not found' });
    }
    
    res.json({ data: profile });
  } catch (err) {
    console.error('[API v1] Error updating manufacturer profile:', err);
    res.status(500).json({ error: 'Failed to update manufacturer profile' });
  }
});

// ===== TASKS =====

// GET /api/v1/tasks
router.get('/tasks', requirePermission(Permission.ACCOUNTS_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { status, assigned_to, account_id } = req.query;
    
    let query = db('tasks')
      .where({ tenant_id: tenantId })
      .orderBy('created_at', 'desc');
    
    if (status) query = query.where('status', status);
    if (assigned_to) query = query.where('assigned_to', assigned_to);
    if (account_id) query = query.where('account_id', account_id);
    
    const tasks = await query;
    res.json({ data: tasks });
  } catch (err) {
    console.error('[API v1] Error fetching tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/v1/tasks
router.post('/tasks', requirePermission(Permission.ACCOUNTS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { title, description, priority, assigned_to, account_id, due_date } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }
    
    const id = `tk-${Date.now()}`;
    const [task] = await db('tasks')
      .insert({
        id,
        tenant_id: tenantId,
        title,
        description,
        status: 'todo',
        priority: priority || 'medium',
        assigned_to,
        account_id,
        due_date,
        created_by: req.user?.userId,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');
    
    res.status(201).json({ data: task });
  } catch (err) {
    console.error('[API v1] Error creating task:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /api/v1/tasks/:id/status
router.patch('/tasks/:id/status', requirePermission(Permission.ACCOUNTS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    const { status } = req.body;
    
    const valid = ['todo', 'in_progress', 'done', 'cancelled'];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const updates = { status, updated_at: new Date() };
    if (status === 'done') updates.completed_at = new Date();
    
    const [task] = await db('tasks')
      .where({ id, tenant_id: tenantId })
      .update(updates)
      .returning('*');
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ data: task });
  } catch (err) {
    console.error('[API v1] Error updating task status:', err);
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

// PUT /api/v1/tasks/:id
router.put('/tasks/:id', requirePermission(Permission.ACCOUNTS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    const updates = req.body;
    
    delete updates.id;
    delete updates.tenant_id;
    delete updates.created_at;
    updates.updated_at = new Date();
    
    const [task] = await db('tasks')
      .where({ id, tenant_id: tenantId })
      .update(updates)
      .returning('*');
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ data: task });
  } catch (err) {
    console.error('[API v1] Error updating task:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// ===== OPPORTUNITIES =====

// GET /api/v1/opportunities
router.get('/opportunities', requirePermission(Permission.ACCOUNTS_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { status, assigned_to, account_id } = req.query;
    
    let query = db('opportunities')
      .where({ tenant_id: tenantId })
      .orderBy('created_at', 'desc');
    
    if (status) query = query.where('status', status);
    if (assigned_to) query = query.where('assigned_to', assigned_to);
    if (account_id) query = query.where('account_id', account_id);
    
    const opportunities = await query;
    res.json({ data: opportunities });
  } catch (err) {
    console.error('[API v1] Error fetching opportunities:', err);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
});

// POST /api/v1/opportunities
router.post('/opportunities', requirePermission(Permission.ACCOUNTS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { title, description, value, currency, account_id, expected_close_date, assigned_to } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }
    
    const id = `op-${Date.now()}`;
    const [opportunity] = await db('opportunities')
      .insert({
        id,
        tenant_id: tenantId,
        title,
        description,
        status: 'prospecting',
        value: value || 0,
        currency: currency || 'USD',
        account_id,
        expected_close_date,
        assigned_to,
        created_by: req.user?.userId,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');
    
    res.status(201).json({ data: opportunity });
  } catch (err) {
    console.error('[API v1] Error creating opportunity:', err);
    res.status(500).json({ error: 'Failed to create opportunity' });
  }
});

// PUT /api/v1/opportunities/:id
router.put('/opportunities/:id', requirePermission(Permission.ACCOUNTS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    const updates = req.body;
    
    delete updates.id;
    delete updates.tenant_id;
    delete updates.created_at;
    updates.updated_at = new Date();
    
    const [opportunity] = await db('opportunities')
      .where({ id, tenant_id: tenantId })
      .update(updates)
      .returning('*');
    
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }
    
    res.json({ data: opportunity });
  } catch (err) {
    console.error('[API v1] Error updating opportunity:', err);
    res.status(500).json({ error: 'Failed to update opportunity' });
  }
});

// PATCH /api/v1/opportunities/:id/status
router.patch('/opportunities/:id/status', requirePermission(Permission.ACCOUNTS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    const { status } = req.body;
    
    const valid = ['prospecting', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const [opportunity] = await db('opportunities')
      .where({ id, tenant_id: tenantId })
      .update({ status, updated_at: new Date() })
      .returning('*');
    
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }
    
    res.json({ data: opportunity });
  } catch (err) {
    console.error('[API v1] Error updating opportunity status:', err);
    res.status(500).json({ error: 'Failed to update opportunity status' });
  }
});

// ===== WAREHOUSES (Settings — inventory locations) =====

async function ensureDefaultWarehouses(tenantId) {
  const row = await db('warehouses').where({ tenant_id: tenantId }).count('* as c').first();
  const n = Number(row?.c ?? 0);
  if (n > 0) return;
  const now = new Date();
  const ts = Date.now();
  await db('warehouses').insert([
    {
      id: `wh-${ts}-toronto`,
      tenant_id: tenantId,
      name: 'Toronto Main Warehouse',
      is_active: true,
      sort_order: 0,
      created_at: now,
      updated_at: now,
    },
    {
      id: `wh-${ts}-milan`,
      tenant_id: tenantId,
      name: 'Milan Depot',
      is_active: true,
      sort_order: 1,
      created_at: now,
      updated_at: now,
    },
  ]);
}

// GET /api/v1/warehouses
router.get('/warehouses', requirePermission(Permission.SETTINGS_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    await ensureDefaultWarehouses(tenantId);

    const includeInactive =
      req.query.include_inactive === 'true' || req.query.include_inactive === '1';

    let q = db('warehouses').where({ tenant_id: tenantId });
    if (!includeInactive) {
      q = q.where('is_active', true);
    }

    const rows = await q.orderBy('sort_order', 'asc').orderBy('name', 'asc');
    res.json({ data: rows });
  } catch (err) {
    console.error('[API v1] Error fetching warehouses:', err);
    res.status(500).json({ error: 'Failed to fetch warehouses' });
  }
});

// POST /api/v1/warehouses
router.post('/warehouses', requirePermission(Permission.SETTINGS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    await ensureDefaultWarehouses(tenantId);

    const name = String(req.body?.name ?? '').trim();
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const existing = await db('warehouses')
      .where({ tenant_id: tenantId })
      .whereRaw('lower(trim(name)) = ?', [name.toLowerCase()])
      .first();
    if (existing) {
      return res.status(409).json({ error: 'A warehouse with this name already exists.' });
    }

    const maxSort = await db('warehouses').where({ tenant_id: tenantId }).max('sort_order as m').first();
    const sortOrder = Number(maxSort?.m ?? -1) + 1;

    const id = `wh-${Date.now()}`;
    const now = new Date();
    const [created] = await db('warehouses')
      .insert({
        id,
        tenant_id: tenantId,
        name,
        is_active: true,
        sort_order: sortOrder,
        created_at: now,
        updated_at: now,
      })
      .returning('*');

    res.status(201).json({ data: created });
  } catch (err) {
    console.error('[API v1] Error creating warehouse:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A warehouse with this name already exists.' });
    }
    res.status(500).json({ error: 'Failed to create warehouse' });
  }
});

// PATCH /api/v1/warehouses/:id
router.patch('/warehouses/:id', requirePermission(Permission.SETTINGS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    const updates = { ...req.body };

    delete updates.id;
    delete updates.tenant_id;
    delete updates.created_at;

    if (updates.name !== undefined) {
      updates.name = String(updates.name).trim();
      if (!updates.name) {
        return res.status(400).json({ error: 'name cannot be empty' });
      }
    }

    /** When HQ sets CRM link, reuse portal-side atomics (single depot / mirrored primary warehouse). Undefined = omit. */
    let linkedTeamMemberIdPatch;
    const hasLinkedTeamMemberPatch = Object.prototype.hasOwnProperty.call(
      updates,
      'linked_team_member_id',
    );
    if (hasLinkedTeamMemberPatch) {
      const v = updates.linked_team_member_id;
      linkedTeamMemberIdPatch =
        v === null || v === '' ? null : String(v).trim() || null;
    }

    const snake = {};
    if (updates.name !== undefined) snake.name = updates.name;
    if (updates.is_active !== undefined) snake.is_active = Boolean(updates.is_active);
    if (updates.sort_order !== undefined) snake.sort_order = Number(updates.sort_order);
    if (updates.linked_account_id !== undefined) {
      const v = updates.linked_account_id;
      snake.linked_account_id =
        v === null || v === '' ? null : String(v).trim() || null;
    }

    snake.updated_at = new Date();

    let row;

    if (hasLinkedTeamMemberPatch) {
      await db.transaction(async (trx) => {
        const existing = await trx('warehouses').where({ id, tenant_id: tenantId }).first();
        if (!existing) {
          const e = new Error('Warehouse not found');
          e.status = 404;
          throw e;
        }

        if (linkedTeamMemberIdPatch) {
          const member = await trx('team_members')
            .where({ id: linkedTeamMemberIdPatch, tenant_id: tenantId })
            .first();
          if (!member) {
            const e = new Error('CRM team member not found');
            e.status = 404;
            throw e;
          }
          if (String(member.role ?? '') !== 'distributor') {
            const e = new Error(
              'linked_team_member_id must reference a CRM contact with distributor role',
            );
            e.status = 400;
            throw e;
          }
          await setDistributorReceivingWarehouse(trx, tenantId, linkedTeamMemberIdPatch, id);
        } else {
          await trx('warehouses').where({ id, tenant_id: tenantId }).update({
            linked_team_member_id: null,
            updated_at: new Date(),
          });
        }

        const [upd] = await trx('warehouses')
          .where({ id, tenant_id: tenantId })
          .update(snake)
          .returning('*');
        row = upd;
      });
    } else {
      [row] = await db('warehouses')
        .where({ id, tenant_id: tenantId })
        .update(snake)
        .returning('*');
    }

    if (!row) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    res.json({ data: row });
  } catch (err) {
    console.error('[API v1] Error updating warehouse:', err);
    const st = typeof err.status === 'number' ? err.status : null;
    if (st === 400 || st === 404) {
      return res.status(st).json({ error: String(err.message || 'Request failed') });
    }
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A warehouse with this name already exists.' });
    }
    res.status(500).json({ error: 'Failed to update warehouse' });
  }
});

/**
 * GET /api/v1/me/warehouse-options
 * Active warehouses for tenants — distributors (and others with inventory read) can pick a receiving depot without SETTINGS_READ.
 */
router.get('/me/warehouse-options', requirePermission(Permission.INVENTORY_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    await ensureDefaultWarehouses(tenantId);

    const rows = await db('warehouses')
      .where({ tenant_id: tenantId, is_active: true })
      .orderBy('sort_order', 'asc')
      .orderBy('name', 'asc')
      .select('id', 'name', 'sort_order');
    res.json({ data: rows });
  } catch (err) {
    console.error('[API v1] Error listing warehouse options:', err);
    res.status(500).json({ error: 'Failed to load warehouses' });
  }
});

/**
 * PATCH /api/v1/me/primary-warehouse
 * Distributor sets which depot they operate from; syncs warehouses.linked_team_member_id.
 */
router.patch('/me/primary-warehouse', requirePermission(Permission.INVENTORY_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    if (req.user.role !== 'distributor') {
      return res.status(403).json({
        error: 'Only distributor portal users can set a primary receiving warehouse.',
      });
    }

    const email = String(req.user.email || '').trim().toLowerCase();
    const body = req.body || {};
    const warehouseIdRaw = body.warehouse_id ?? body.warehouseId;
    const wid =
      warehouseIdRaw === null || warehouseIdRaw === undefined || warehouseIdRaw === ''
        ? null
        : String(warehouseIdRaw).trim();

    const member = await db('team_members').where({ tenant_id: tenantId, email }).first();
    if (!member || member.role !== 'distributor') {
      return res.status(404).json({
        error: 'No distributor CRM contact matches this login email.',
      });
    }

    try {
      await db.transaction(async (trx) => {
        await setDistributorReceivingWarehouse(trx, tenantId, member.id, wid);
      });
    } catch (e) {
      const st = e.status || 500;
      if (st === 404 || st === 400) {
        return res.status(st).json({ error: e.message });
      }
      throw e;
    }

    const updated = await db('team_members').where({ id: member.id, tenant_id: tenantId }).first();
    const warehouseRows = await db('warehouses').where({ tenant_id: tenantId }).orderBy('sort_order', 'asc').orderBy('name', 'asc');

    res.json({
      data: {
        team_member: updated,
        warehouses: warehouseRows,
      },
    });
  } catch (err) {
    console.error('[API v1] Error setting primary warehouse:', err);
    res.status(500).json({ error: 'Failed to update primary warehouse' });
  }
});

export default router;
