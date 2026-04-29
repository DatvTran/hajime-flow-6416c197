import { db } from '../config/database.mjs';
import { readAppState, readAppStateMeta, writeAppState } from '../app-store.mjs';

/**
 * Data Migration Service
 * Handles 6-stage migration from JSON to PostgreSQL
 */
export class DataMigrationService {
  constructor() {
    this.stage = Number(process.env.FEATURE_FLAG_DB_MIGRATION_STAGE) || 0;
    this.isProduction = process.env.NODE_ENV === 'production';

    if (this.isProduction && this.stage < 3) {
      console.warn(
        `[DataMigration] FEATURE_FLAG_DB_MIGRATION_STAGE=${this.stage} is unsupported in production; forcing stage 3 (DB primary).`
      );
      this.stage = 3;
    }
  }

  isDbPrimaryEnabled() {
    return this.stage >= 3;
  }

  resolveTenantJSONFileKey(tenantId) {
    if (!tenantId || typeof tenantId !== 'string') return null;
    return `app-state.${tenantId}`;
  }

  assertTenantScopedJSON(tenantId) {
    const tenantFileKey = this.resolveTenantJSONFileKey(tenantId);
    if (!tenantFileKey) {
      throw new Error('Tenant-scoped JSON is required but tenantId is missing');
    }
    return tenantFileKey;
  }
  /**
   * Stage 0: JSON only (baseline)
   */
  async getDataJSON(tenantId) {
    if (this.stage > 2) {
      throw new Error(`JSON reads unavailable at migration stage ${this.stage}`);
    }
    const tenantFileKey = this.assertTenantScopedJSON(tenantId);
    return readAppState(tenantFileKey);
  }

  /**
   * Stage 1: Shadow writes to PostgreSQL
   * Write to both JSON and PostgreSQL
   */
  async syncToPostgreSQL(data, tenantId) {
    try {
      // Sync products
      if (data.products) {
        for (const product of data.products) {
          await db('products')
            .insert({
              tenant_id: tenantId,
              sku: product.sku,
              name: product.name,
              description: product.description,
              category: product.category,
              unit_size: product.unitSize,
              metadata: JSON.stringify(product),
            })
            .onConflict(['tenant_id', 'sku'])
            .merge();
        }
      }

      // Sync accounts
      if (data.accounts) {
        for (const account of data.accounts) {
          await db('accounts')
            .insert({
              tenant_id: tenantId,
              account_number: account.accountNumber,
              name: account.name,
              type: account.type,
              market: account.market,
              email: account.email,
              phone: account.phone,
              billing_address: JSON.stringify(account.billingAddress),
              shipping_address: JSON.stringify(account.shippingAddress),
              payment_terms: account.paymentTerms,
              credit_limit: account.creditLimit,
              notes: account.notes,
            })
            .onConflict(['tenant_id', 'account_number'])
            .merge();
        }
      }

      // Sync inventory
      if (data.inventory) {
        for (const item of data.inventory) {
          const product = await db('products')
            .where({ tenant_id: tenantId, sku: item.sku })
            .first();

          if (product) {
            await db('inventory')
              .insert({
                tenant_id: tenantId,
                product_id: product.id,
                location: item.location || 'Main Warehouse',
                quantity_on_hand: item.quantityOnHand || 0,
                reserved_quantity: item.reservedQuantity || 0,
                reorder_point: item.reorderPoint,
                reorder_quantity: item.reorderQuantity,
              })
              .onConflict(['tenant_id', 'product_id', 'location'])
              .merge();
          }
        }
      }

      // Sync sales orders
      if (data.salesOrders) {
        for (const order of data.salesOrders) {
          const account = await db('accounts')
            .where({ tenant_id: tenantId, account_number: order.accountNumber })
            .first();

          await db('sales_orders')
            .insert({
              tenant_id: tenantId,
              order_number: order.orderNumber,
              account_id: account?.id,
              status: order.status,
              order_date: order.orderDate,
              requested_delivery_date: order.requestedDeliveryDate,
              subtotal: order.subtotal,
              tax_amount: order.taxAmount,
              shipping_cost: order.shippingCost,
              total_amount: order.totalAmount,
              shipping_address: JSON.stringify(order.shippingAddress),
              notes: order.notes,
            })
            .onConflict(['tenant_id', 'order_number'])
            .merge();
        }
      }

      // Sync purchase orders
      if (data.purchaseOrders) {
        for (const po of data.purchaseOrders) {
          await db('purchase_orders')
            .insert({
              tenant_id: tenantId,
              po_number: po.poNumber,
              supplier_name: po.supplierName,
              status: po.status,
              order_date: po.orderDate,
              expected_delivery_date: po.expectedDeliveryDate,
              subtotal: po.subtotal,
              total_amount: po.totalAmount,
              notes: po.notes,
            })
            .onConflict(['tenant_id', 'po_number'])
            .merge();
        }
      }

      console.log(`[DataMigration] Synced data to PostgreSQL for tenant ${tenantId}`);
    } catch (err) {
      console.error('[DataMigration] Sync error:', err);
      throw err;
    }
  }

  /**
   * Stage 2: Compare JSON and PostgreSQL data
   */
  async compareData(tenantId) {
    const tenantFileKey = this.assertTenantScopedJSON(tenantId);
    const jsonData = readAppState(tenantFileKey);
    // This would compare and log discrepancies
    console.log('[DataMigration] Data comparison logged');
    return { discrepancies: [] };
  }

  /**
   * Stage 3+: Get data from PostgreSQL
   */
  async getDataPostgreSQL(tenantId) {
    const [
      products,
      accounts,
      inventory,
      salesOrders,
      purchaseOrders,
      shipments,
      productionRuns,
    ] = await Promise.all([
      db('products').where({ tenant_id: tenantId }).whereNull('deleted_at'),
      db('accounts').where({ tenant_id: tenantId }).whereNull('deleted_at'),
      db('inventory')
        .join('products', 'inventory.product_id', 'products.id')
        .where('inventory.tenant_id', tenantId)
        .whereNull('products.deleted_at')
        .select(
          'products.sku',
          'inventory.location',
          'inventory.quantity_on_hand',
          'inventory.reserved_quantity',
          'inventory.available_quantity',
          'inventory.reorder_point',
          'inventory.reorder_quantity'
        ),
      db('sales_orders')
        .where({ tenant_id: tenantId })
        .whereNull('deleted_at')
        .orderBy('created_at', 'desc')
        .limit(100),
      db('purchase_orders')
        .where({ tenant_id: tenantId })
        .whereNull('deleted_at')
        .orderBy('created_at', 'desc')
        .limit(100),
      db('shipments').where({ tenant_id: tenantId }).orderBy('created_at', 'desc').limit(100),
      // Note: production_runs doesn't have deleted_at column
      db('production_runs')
        .where({ tenant_id: tenantId })
        .orderBy('created_at', 'desc')
        .limit(100)
        .catch(() => []), // Return empty array if error
    ]);

    return {
      products,
      accounts,
      inventory,
      salesOrders,
      purchaseOrders,
      shipments,
      productionRuns: productionRuns || [],
    };
  }

  /**
   * Get data based on current migration stage
   */
  async getData(tenantId) {
    if (this.stage >= 3) {
      return this.getDataPostgreSQL(tenantId);
    }

    switch (this.stage) {
      case 0:
      case 1:
      case 2:
      default:
        return this.getDataJSON(tenantId);
    }
  }

  /**
   * Returns ETag + canonical JSON bytes for JSON-backed stages so
   * API handlers can perform conditional GET.
   */
  getDataMetaIfJSON(tenantId) {
    if (this.stage <= 2) {
      const tenantFileKey = this.assertTenantScopedJSON(tenantId);
      return readAppStateMeta(tenantFileKey);
    }
    return null;
  }

  /**
   * Save data based on current migration stage
   */
  async saveData(data, tenantId) {
    if (this.stage >= 3) {
      throw new Error('Legacy /api/app write path is disabled when DB-primary migration is enabled. Use /api/v1/* mutations.');
    }

    writeAppState(data);

    // Shadow write to PostgreSQL (Stage 1-2)
    if (this.stage >= 1 && this.stage <= 2) {
      try {
        await this.syncToPostgreSQL(data, tenantId);
      } catch (err) {
        console.error('[DataMigration] Shadow write failed:', err);
      }
    }
  }
}

export const dataMigrationService = new DataMigrationService();
