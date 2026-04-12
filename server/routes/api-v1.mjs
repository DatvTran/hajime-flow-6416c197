/**
 * Granular API Routes - v1
 * RESTful endpoints for products, orders, accounts, inventory
 * With full RBAC protection
 */
import { Router } from 'express';
import { db } from '../config/database.mjs';
import { authenticateToken, requirePermission, requireTenantAccess } from '../middleware/auth.mjs';
import { Permission } from '../rbac/permissions.mjs';

const router = Router();
const isDev = process.env.NODE_ENV === 'development';

// Apply auth to all routes
router.use(authenticateToken);
router.use(requireTenantAccess);

// Helper to get tenantId from authenticated user
function getTenantId(req) {
  return req.user?.tenantId || '00000000-0000-0000-0000-000000000000';
}

// ===== PRODUCTS =====

// GET /api/v1/products - List all products
router.get('/products', requirePermission(Permission.INVENTORY_READ), async (req, res) => {
  try {
    const tenantId = getTenantId(req);
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
    const tenantId = getTenantId(req);
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
    const tenantId = getTenantId(req);
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

// PUT /api/v1/products/:id - Update product
router.put('/products/:id', requirePermission(Permission.INVENTORY_WRITE), async (req, res) => {
  try {
    const tenantId = getTenantId(req);
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
    const tenantId = getTenantId(req);
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
    const tenantId = getTenantId(req);
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
    const tenantId = getTenantId(req);
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
    const tenantId = getTenantId(req);
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
    const tenantId = getTenantId(req);
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
    const tenantId = getTenantId(req);
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
    const tenantId = getTenantId(req);
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
    const tenantId = getTenantId(req);
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
    const tenantId = getTenantId(req);
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
    const tenantId = getTenantId(req);
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
    const tenantId = getTenantId(req);
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
    const tenantId = getTenantId(req);
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
    const tenantId = getTenantId(req);
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
    const tenantId = getTenantId(req);
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
    const tenantId = getTenantId(req);
    
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
    const tenantId = getTenantId(req);
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
    const tenantId = getTenantId(req);
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
    const tenantId = getTenantId(req);
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
    const tenantId = getTenantId(req);
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

export default router;
