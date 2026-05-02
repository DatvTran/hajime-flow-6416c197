/**
 * Granular API Routes - v1
 * RESTful endpoints for products, orders, accounts, inventory
 * With full RBAC protection
 */
import { Router } from 'express';
import { db } from '../config/database.mjs';
import { authenticateToken, requirePermission, requireTenantAccess } from '../middleware/auth.mjs';
import { Permission } from '../rbac/permissions.mjs';
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

// GET /api/v1/shipments - List shipments
router.get('/shipments', requirePermission(Permission.INVENTORY_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { page = 1, limit = 50, status, carrier, order_id, order_type } = req.query;
    
    let baseQuery = db('shipments')
      .where({ tenant_id: tenantId })
      .whereNull('deleted_at');
    
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
    
    const [countResult, shipments] = await Promise.all([countQuery, dataQuery]);
    
    res.json({
      data: shipments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(countResult?.count || 0),
        totalPages: Math.ceil(Number(countResult?.count || 0) / Number(limit))
      }
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
    
    const shipment = await db('shipments')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .first();
    
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    const items = await db('shipment_items')
      .where({ shipment_id: id, tenant_id: tenantId });
    
    res.json({ data: { ...shipment, items } });
  } catch (err) {
    console.error('[API v1] Error fetching shipment:', err);
    res.status(500).json({ error: 'Failed to fetch shipment' });
  }
});

// POST /api/v1/shipments - Create shipment
router.post('/shipments', requirePermission(Permission.INVENTORY_WRITE), async (req, res) => {
  const trx = await db.transaction();
  
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { 
      shipment_number, 
      order_id, 
      order_type,
      carrier, 
      tracking_number,
      from_location,
      to_location,
      status,
      ship_date,
      estimated_delivery,
      items,
      ...shipmentData 
    } = req.body;
    
    if (!shipment_number || !order_id || !order_type) {
      await trx.rollback();
      return res.status(400).json({ error: 'shipment_number, order_id, and order_type are required' });
    }
    
    const [shipment] = await trx('shipments')
      .insert({
        tenant_id: tenantId,
        shipment_number,
        order_id,
        order_type,
        carrier,
        tracking_number,
        from_location,
        to_location,
        status: status || 'packed',
        ship_date: ship_date || new Date(),
        estimated_delivery,
        delivered_at: shipmentData.deliveredAt,
        total_bottles: shipmentData.totalBottles || 0,
        notes: shipmentData.notes,
        created_by: req.user?.userId
      })
      .returning('*');
    
    if (items && items.length > 0) {
      const shipmentItems = items.map(item => ({
        tenant_id: tenantId,
        shipment_id: shipment.id,
        product_id: item.productId || item.product_id,
        sku: item.sku,
        product_name: item.productName || item.product_name || item.name,
        quantity: item.quantity,
        batch_id: item.batchId || item.batch_id
      }));
      
      await trx('shipment_items').insert(shipmentItems);
    }
    
    await trx.commit();
    
    res.status(201).json({ data: shipment });
  } catch (err) {
    await trx.rollback();
    console.error('[API v1] Error creating shipment:', err);
    res.status(500).json({ error: 'Failed to create shipment' });
  }
});

// PUT /api/v1/shipments/:id - Update shipment
router.put('/shipments/:id', requirePermission(Permission.INVENTORY_WRITE), async (req, res) => {
  const trx = await db.transaction();
  
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    const { items, ...shipmentData } = req.body;
    
    const updates = {
      carrier: shipmentData.carrier,
      tracking_number: shipmentData.tracking_number || shipmentData.trackingNumber,
      from_location: shipmentData.from_location || shipmentData.fromLocation,
      to_location: shipmentData.to_location || shipmentData.toLocation,
      ship_date: shipmentData.ship_date || shipmentData.shipDate,
      estimated_delivery: shipmentData.estimated_delivery || shipmentData.estimatedDelivery,
      delivered_at: shipmentData.delivered_at || shipmentData.deliveredAt,
      total_bottles: shipmentData.total_bottles || shipmentData.totalBottles,
      notes: shipmentData.notes,
      updated_at: new Date()
    };
    
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
      await trx('shipment_items')
        .where({ shipment_id: id, tenant_id: tenantId })
        .delete();
      
      const shipmentItems = items.map(item => ({
        tenant_id: tenantId,
        shipment_id: id,
        product_id: item.productId || item.product_id,
        sku: item.sku,
        product_name: item.productName || item.product_name || item.name,
        quantity: item.quantity,
        batch_id: item.batchId || item.batch_id
      }));
      
      await trx('shipment_items').insert(shipmentItems);
    }
    
    await trx.commit();
    
    res.json({ data: shipment });
  } catch (err) {
    await trx.rollback();
    console.error('[API v1] Error updating shipment:', err);
    res.status(500).json({ error: 'Failed to update shipment' });
  }
});

// PATCH /api/v1/shipments/:id/status - Update shipment status
router.patch('/shipments/:id/status', requirePermission(Permission.INVENTORY_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['packed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'cancelled'];
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
    
    const [shipment] = await db('shipments')
      .where({ id, tenant_id: tenantId })
      .whereNull('deleted_at')
      .update(updates)
      .returning('*');
    
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    res.json({ data: shipment });
  } catch (err) {
    console.error('[API v1] Error updating shipment status:', err);
    res.status(500).json({ error: 'Failed to update shipment status' });
  }
});

// DELETE /api/v1/shipments/:id - Soft delete shipment
router.delete('/shipments/:id', requirePermission(Permission.INVENTORY_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    
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
router.get('/team-members', requirePermission(Permission.SETTINGS_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    const includeInactive =
      req.query.include_inactive === 'true' ||
      req.query.include_inactive === '1';

    let query = db('team_members').where({ tenant_id: tenantId });
    if (!includeInactive) {
      query = query.where('is_active', true);
    }

    const members = await query.orderBy('created_at', 'desc');

    res.json({ data: members });
  } catch (err) {
    console.error('[API v1] Error fetching team members:', err);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

// POST /api/v1/team-members
router.post('/team-members', requirePermission(Permission.SETTINGS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { name, email, role, phone, department } = req.body;
    
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'name, email, and role are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // If this email already exists for the tenant, return a clear 409 (or reactivate).
    const existing = await db('team_members')
      .where({ tenant_id: tenantId, email: normalizedEmail })
      .first();
    if (existing) {
      if (existing.is_active === false) {
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
        const payload = await buildCrmContactInvitePayload(req, tenantId, reactivated, {
          email: normalizedEmail,
          name,
          role,
        });
        return res.status(200).json({ ...payload, message: 'Team member reactivated' });
      }
      return res.status(409).json({ error: 'A CRM contact with this email already exists.' });
    }
    
    const id = `tm-${Date.now()}`;
    const [member] = await db('team_members')
      .insert({
        id,
        tenant_id: tenantId,
        name,
        email: normalizedEmail,
        role,
        phone,
        department,
        is_active: true,
        created_by: req.user?.userId,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    const payload = await buildCrmContactInvitePayload(req, tenantId, member, {
      email: normalizedEmail,
      name,
      role,
    });
    res.status(201).json(payload);
  } catch (err) {
    console.error('[API v1] Error creating team member:', err);
    res.status(500).json({ error: 'Failed to create team member' });
  }
});

// POST /api/v1/team-members/:id/resend-invite
router.post('/team-members/:id/resend-invite', requirePermission(Permission.SETTINGS_WRITE), async (req, res) => {
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
router.patch('/team-members/:id', requirePermission(Permission.SETTINGS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;

    const { name, email, role, phone, department, is_active } = req.body || {};

    const current = await db('team_members')
      .where({ id, tenant_id: tenantId })
      .first();
    if (!current) {
      return res.status(404).json({ error: 'Team member not found' });
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
router.patch('/team-members/by-email/:email', requirePermission(Permission.SETTINGS_WRITE), async (req, res) => {
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

    const { name, email, role, phone, department, is_active } = req.body || {};
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
router.post('/team-members/by-email/:email/resend-invite', requirePermission(Permission.SETTINGS_WRITE), async (req, res) => {
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
router.delete('/team-members/:id', requirePermission(Permission.SETTINGS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const { id } = req.params;
    
    const [member] = await db('team_members')
      .where({ id, tenant_id: tenantId })
      .update({ is_active: false, updated_at: new Date() })
      .returning('*');
    
    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    
    res.json({ data: member, message: 'Team member deactivated' });
  } catch (err) {
    console.error('[API v1] Error deleting team member:', err);
    res.status(500).json({ error: 'Failed to delete team member' });
  }
});

// DELETE /api/v1/team-members/by-email/:email
router.delete('/team-members/by-email/:email', requirePermission(Permission.SETTINGS_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;
    const emailParam = String(req.params.email || '').trim().toLowerCase();
    if (!emailParam) return res.status(400).json({ error: 'email is required' });

    const [member] = await db('team_members')
      .where({ tenant_id: tenantId, email: emailParam })
      .update({ is_active: false, updated_at: new Date() })
      .returning('*');

    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }

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

    const snake = {};
    if (updates.name !== undefined) snake.name = updates.name;
    if (updates.is_active !== undefined) snake.is_active = Boolean(updates.is_active);
    if (updates.sort_order !== undefined) snake.sort_order = Number(updates.sort_order);

    snake.updated_at = new Date();

    const [row] = await db('warehouses')
      .where({ id, tenant_id: tenantId })
      .update(snake)
      .returning('*');

    if (!row) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    res.json({ data: row });
  } catch (err) {
    console.error('[API v1] Error updating warehouse:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A warehouse with this name already exists.' });
    }
    res.status(500).json({ error: 'Failed to update warehouse' });
  }
});

export default router;
