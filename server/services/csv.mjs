import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import { z } from 'zod';
import { db } from '../config/database.mjs';

/**
 * CSV Export Service
 * Handles streaming CSV exports for large datasets
 */
export class CSVExportService {
  /**
   * Export inventory summary
   */
  async exportInventorySummary(tenantId, filters = {}, res) {
    const filename = `inventory-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const stringifier = stringify({
      header: true,
      columns: [
        { key: 'sku', header: 'SKU' },
        { key: 'product_name', header: 'Product Name' },
        { key: 'category', header: 'Category' },
        { key: 'location', header: 'Location' },
        { key: 'quantity_on_hand', header: 'On Hand' },
        { key: 'reserved_quantity', header: 'Reserved' },
        { key: 'available_quantity', header: 'Available' },
        { key: 'reorder_point', header: 'Reorder Point' },
        { key: 'reorder_quantity', header: 'Reorder Qty' },
      ],
      escape_formulas: true, // SECURITY: Prevent CSV injection
    });

    stringifier.pipe(res);

    // Build query
    let query = db('inventory')
      .join('products', 'inventory.product_id', 'products.id')
      .select(
        'products.sku',
        'products.name as product_name',
        'products.category',
        'inventory.location',
        'inventory.quantity_on_hand',
        'inventory.reserved_quantity',
        'inventory.available_quantity',
        'inventory.reorder_point',
        'inventory.reorder_quantity'
      )
      .where('inventory.tenant_id', tenantId);

    // Apply filters
    if (filters.location) {
      query = query.where('inventory.location', filters.location);
    }
    if (filters.category) {
      query = query.where('products.category', filters.category);
    }
    if (filters.lowStock) {
      query = query.whereRaw('inventory.available_quantity <= inventory.reorder_point');
    }

    const stream = query.stream();

    stream.on('data', (row) => {
      stringifier.write(this.sanitizeRow(row));
    });

    stream.on('end', () => {
      stringifier.end();
    });

    stream.on('error', (err) => {
      console.error('CSV export error:', err);
      stringifier.end();
      res.status(500).json({ error: 'Export failed' });
    });
  }

  /**
   * Export sales by account report
   */
  async exportSalesByAccount(tenantId, filters = {}, res) {
    const dateFrom = filters.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateTo = filters.dateTo || new Date().toISOString().split('T')[0];
    const filename = `sales-by-account-${dateFrom}-to-${dateTo}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const stringifier = stringify({
      header: true,
      columns: [
        { key: 'account_name', header: 'Account' },
        { key: 'market', header: 'Market' },
        { key: 'order_count', header: 'Orders' },
        { key: 'total_revenue', header: 'Revenue' },
        { key: 'avg_order_value', header: 'Avg Order' },
        { key: 'total_units', header: 'Units' },
      ],
      cast: {
        number: (v) => Number(v).toFixed(2),
      },
    });

    stringifier.pipe(res);

    const stream = db('sales_orders')
      .join('accounts', 'sales_orders.account_id', 'accounts.id')
      .select(
        'accounts.name as account_name',
        'accounts.market',
        db.raw('COUNT(*) as order_count'),
        db.raw('SUM(total_amount) as total_revenue'),
        db.raw('AVG(total_amount) as avg_order_value'),
        db.raw('SUM((SELECT SUM(quantity_ordered) FROM sales_order_items WHERE sales_order_id = sales_orders.id)) as total_units')
      )
      .where('sales_orders.tenant_id', tenantId)
      .whereBetween('order_date', [dateFrom, dateTo])
      .whereIn('status', filters.status || ['confirmed', 'fulfilled', 'delivered'])
      .groupBy('accounts.id', 'accounts.name', 'accounts.market')
      .stream();

    stream.on('data', (row) => {
      stringifier.write(this.sanitizeRow(row));
    });

    stream.on('end', () => {
      stringifier.end();
    });
  }

  /**
   * Export orders
   */
  async exportOrders(tenantId, filters = {}, res) {
    const filename = `orders-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const stringifier = stringify({
      header: true,
      columns: [
        { key: 'order_number', header: 'Order #' },
        { key: 'account_name', header: 'Account' },
        { key: 'status', header: 'Status' },
        { key: 'order_date', header: 'Order Date' },
        { key: 'requested_delivery_date', header: 'Requested Delivery' },
        { key: 'total_amount', header: 'Total' },
        { key: 'created_by', header: 'Created By' },
      ],
      cast: {
        number: (v) => Number(v).toFixed(2),
      },
    });

    stringifier.pipe(res);

    let query = db('sales_orders')
      .join('accounts', 'sales_orders.account_id', 'accounts.id')
      .leftJoin('users', 'sales_orders.created_by', 'users.id')
      .select(
        'sales_orders.order_number',
        'accounts.name as account_name',
        'sales_orders.status',
        'sales_orders.order_date',
        'sales_orders.requested_delivery_date',
        'sales_orders.total_amount',
        db.raw("COALESCE(users.display_name, users.email, 'System') as created_by")
      )
      .where('sales_orders.tenant_id', tenantId);

    if (filters.status) {
      query = query.where('sales_orders.status', filters.status);
    }
    if (filters.dateFrom) {
      query = query.where('sales_orders.order_date', '>=', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.where('sales_orders.order_date', '<=', filters.dateTo);
    }

    const stream = query.stream();

    stream.on('data', (row) => {
      stringifier.write(this.sanitizeRow(row));
    });

    stream.on('end', () => {
      stringifier.end();
    });
  }

  /**
   * Sanitize row data for CSV export
   * Prevents CSV injection attacks
   */
  sanitizeRow(row) {
    const sanitized = {};
    for (const [key, value] of Object.entries(row)) {
      sanitized[key] = this.sanitizeCSVValue(value);
    }
    return sanitized;
  }

  /**
   * Sanitize individual CSV value
   */
  sanitizeCSVValue(value) {
    if (value === null || value === undefined) return '';
    if (typeof value !== 'string') return value;

    // Remove control characters
    value = value.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    // Block dangerous Excel formula patterns
    if (/^\s*[=+\-@\t\r\n]/.test(value)) {
      // Prefix with single quote to neutralize formula
      return `'${value}`;
    }

    return value;
  }
}

/**
 * CSV Import Service
 * Handles validation and import with preview functionality
 */
export class CSVImportService {
  // Validation schemas for different import types
  schemas = {
    inventory: z.object({
      sku: z.string().min(1, 'SKU is required'),
      quantity: z.coerce.number().int().min(0, 'Quantity must be 0 or greater'),
      location: z.string().default('Main Warehouse'),
      reorderPoint: z.coerce.number().int().min(0).optional(),
    }),

    products: z.object({
      sku: z.string().min(1, 'SKU is required'),
      name: z.string().min(1, 'Name is required'),
      description: z.string().optional(),
      category: z.string().optional(),
      unitSize: z.string().optional(),
    }),

    accounts: z.object({
      accountNumber: z.string().optional(),
      name: z.string().min(1, 'Name is required'),
      type: z.string().optional(),
      market: z.string().optional(),
      email: z.string().email().optional().or(z.literal('')),
      phone: z.string().optional(),
    }),
  };

  /**
   * Preview CSV import (validation without committing)
   */
  async previewImport(fileBuffer, importType, tenantId) {
    const schema = this.schemas[importType];
    if (!schema) {
      throw new Error(`Unknown import type: ${importType}`);
    }

    const preview = {
      headers: [],
      sampleRows: [],
      rowCount: 0,
    };

    const validation = {
      valid: 0,
      invalid: 0,
      errors: [],
    };

    const allRows = [];

    return new Promise((resolve, reject) => {
      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      let rowNum = 0;

      parser.on('readable', () => {
        let row;
        while ((row = parser.read()) !== null) {
          rowNum++;

          if (rowNum === 1) {
            preview.headers = Object.keys(row);
          }
          if (rowNum <= 5) {
            preview.sampleRows.push(row);
          }

          // Normalize keys to camelCase for validation
          const normalizedRow = this.normalizeKeys(row);

          const result = schema.safeParse(normalizedRow);
          if (result.success) {
            validation.valid++;
            allRows.push({
              row: rowNum,
              data: result.data,
              original: row,
              valid: true,
            });
          } else {
            validation.invalid++;
            const errors = result.error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            }));

            if (validation.errors.length < 50) {
              validation.errors.push({ row: rowNum, errors, original: row });
            }

            allRows.push({
              row: rowNum,
              data: normalizedRow,
              original: row,
              valid: false,
              errors,
            });
          }
        }
      });

      parser.on('end', async () => {
        preview.rowCount = rowNum;

        // Store preview in temporary cache (would use Redis in production)
        const tempId = `import:${tenantId}:${Date.now()}:${importType}`;

        resolve({
          preview,
          validation,
          tempImportId: tempId,
          allRows,
        });
      });

      parser.on('error', reject);

      parser.write(fileBuffer);
      parser.end();
    });
  }

  /**
   * Commit import after preview validation
   */
  async commitImport(allRows, importType, tenantId, userId) {
    const result = {
      imported: 0,
      failed: 0,
      errors: [],
    };

    const trx = await db.transaction();

    try {
      for (const rowData of allRows) {
        if (!rowData.valid) {
          result.failed++;
          result.errors.push(rowData);
          continue;
        }

        try {
          await this.importRow(trx, importType, tenantId, rowData.data, userId);
          result.imported++;
        } catch (err) {
          result.failed++;
          result.errors.push({
            ...rowData,
            errors: [{ message: err.message }],
          });
        }
      }

      await trx.commit();
      return result;
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }

  /**
   * Import a single row based on import type
   */
  async importRow(trx, importType, tenantId, data, userId) {
    switch (importType) {
      case 'inventory':
        return this.importInventoryRow(trx, tenantId, data, userId);
      case 'products':
        return this.importProductRow(trx, tenantId, data, userId);
      case 'accounts':
        return this.importAccountRow(trx, tenantId, data, userId);
      default:
        throw new Error(`Unknown import type: ${importType}`);
    }
  }

  /**
   * Import inventory row
   */
  async importInventoryRow(trx, tenantId, data, userId) {
    // Find product by SKU
    const product = await trx('products')
      .where({ tenant_id: tenantId, sku: data.sku })
      .first();

    if (!product) {
      throw new Error(`Product with SKU "${data.sku}" not found`);
    }

    // Get current inventory
    const currentInventory = await trx('inventory')
      .where({
        tenant_id: tenantId,
        product_id: product.id,
        location: data.location,
      })
      .first();

    const quantityBefore = currentInventory?.quantity_on_hand || 0;

    // Upsert inventory
    await trx('inventory')
      .insert({
        tenant_id: tenantId,
        product_id: product.id,
        location: data.location,
        quantity_on_hand: data.quantity,
        reorder_point: data.reorderPoint,
      })
      .onConflict(['tenant_id', 'product_id', 'location'])
      .merge({
        quantity_on_hand: data.quantity,
        reorder_point: data.reorderPoint,
        updated_at: trx.fn.now(),
      });

    // Log adjustment
    await trx('inventory_adjustments').insert({
      tenant_id: tenantId,
      product_id: product.id,
      location: data.location,
      adjustment_type: 'import',
      quantity_before: quantityBefore,
      quantity_after: data.quantity,
      quantity_changed: data.quantity - quantityBefore,
      reference_type: 'csv_import',
      notes: `Imported via CSV by user ${userId}`,
      created_by: userId,
    });
  }

  /**
   * Import product row
   */
  async importProductRow(trx, tenantId, data, userId) {
    await trx('products')
      .insert({
        tenant_id: tenantId,
        sku: data.sku,
        name: data.name,
        description: data.description,
        category: data.category,
        unit_size: data.unitSize,
      })
      .onConflict(['tenant_id', 'sku'])
      .merge({
        name: data.name,
        description: data.description,
        category: data.category,
        unit_size: data.unitSize,
        updated_at: trx.fn.now(),
      });
  }

  /**
   * Import account row
   */
  async importAccountRow(trx, tenantId, data, userId) {
    await trx('accounts')
      .insert({
        tenant_id: tenantId,
        account_number: data.accountNumber,
        name: data.name,
        type: data.type,
        market: data.market,
        email: data.email,
        phone: data.phone,
      })
      .onConflict(['tenant_id', 'account_number'])
      .merge({
        name: data.name,
        type: data.type,
        market: data.market,
        email: data.email,
        phone: data.phone,
        updated_at: trx.fn.now(),
      });
  }

  /**
   * Normalize object keys to camelCase
   */
  normalizeKeys(obj) {
    const normalized = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key
        .replace(/[_\s](.)/g, (_, char) => char.toUpperCase())
        .replace(/^(.)/, (_, char) => char.toLowerCase());
      normalized[camelKey] = value;
    }
    return normalized;
  }

  /**
   * Generate import template
   */
  generateTemplate(importType) {
    const templates = {
      inventory: 'sku,quantity,location,reorderPoint\nSKU001,100,Main Warehouse,50\nSKU002,50,Warehouse B,25',
      products: 'sku,name,description,category,unitSize\nSKU001,Product A,Description here,Beverages,750ml\nSKU002,Product B,Another description,Accessories,Each',
      accounts: 'accountNumber,name,type,market,email,phone\nACC001,Account A,Retail,Toronto,account@example.com,555-0100\nACC002,Account B,Restaurant,Montreal,account2@example.com,555-0101',
    };

    return templates[importType] || '';
  }
}

export const csvExportService = new CSVExportService();
export const csvImportService = new CSVImportService();
