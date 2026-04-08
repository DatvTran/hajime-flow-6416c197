import express from 'express';
import multer from 'multer';
import { z } from 'zod';
import { csvExportService, csvImportService } from '../services/csv.mjs';
import { authenticateToken, requirePermission } from '../middleware/auth.mjs';
import { Permission } from '../rbac/permissions.mjs';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
});

/**
 * GET /api/csv/export/inventory
 * Export inventory as CSV
 */
router.get(
  '/export/inventory',
  authenticateToken,
  requirePermission(Permission.CSV_EXPORT),
  async (req, res) => {
    try {
      const filters = {
        location: req.query.location,
        category: req.query.category,
        lowStock: req.query.lowStock === 'true',
      };

      await csvExportService.exportInventorySummary(req.user.tenantId, filters, res);
    } catch (err) {
      console.error('Inventory export error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Export failed' });
      }
    }
  }
);

/**
 * GET /api/csv/export/sales-by-account
 * Export sales by account report
 */
router.get(
  '/export/sales-by-account',
  authenticateToken,
  requirePermission(Permission.CSV_EXPORT),
  async (req, res) => {
    try {
      const filters = {
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        status: req.query.status?.split(','),
      };

      await csvExportService.exportSalesByAccount(req.user.tenantId, filters, res);
    } catch (err) {
      console.error('Sales export error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Export failed' });
      }
    }
  }
);

/**
 * GET /api/csv/export/orders
 * Export orders as CSV
 */
router.get(
  '/export/orders',
  authenticateToken,
  requirePermission(Permission.CSV_EXPORT),
  async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
      };

      await csvExportService.exportOrders(req.user.tenantId, filters, res);
    } catch (err) {
      console.error('Orders export error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Export failed' });
      }
    }
  }
);

/**
 * POST /api/csv/import/preview/:type
 * Preview CSV import without committing
 */
router.post(
  '/import/preview/:type',
  authenticateToken,
  requirePermission(Permission.CSV_IMPORT),
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const importType = req.params.type;
      const validTypes = ['inventory', 'products', 'accounts'];

      if (!validTypes.includes(importType)) {
        return res.status(400).json({
          error: 'Invalid import type',
          validTypes,
        });
      }

      const result = await csvImportService.previewImport(
        req.file.buffer,
        importType,
        req.user.tenantId
      );

      res.json({
        preview: result.preview,
        validation: result.validation,
        tempImportId: result.tempImportId,
      });
    } catch (err) {
      console.error('Import preview error:', err);
      res.status(500).json({ error: err.message || 'Import preview failed' });
    }
  }
);

/**
 * POST /api/csv/import/commit/:type
 * Commit CSV import after preview
 */
router.post(
  '/import/commit/:type',
  authenticateToken,
  requirePermission(Permission.CSV_IMPORT),
  async (req, res) => {
    try {
      const importType = req.params.type;
      const { allRows } = req.body;

      if (!allRows || !Array.isArray(allRows)) {
        return res.status(400).json({
          error: 'Invalid request: allRows array required',
        });
      }

      const result = await csvImportService.commitImport(
        allRows,
        importType,
        req.user.tenantId,
        req.user.userId
      );

      res.json({
        success: true,
        imported: result.imported,
        failed: result.failed,
        errors: result.errors.slice(0, 10), // Limit errors in response
      });
    } catch (err) {
      console.error('Import commit error:', err);
      res.status(500).json({ error: err.message || 'Import commit failed' });
    }
  }
);

/**
 * GET /api/csv/template/:type
 * Download CSV import template
 */
router.get(
  '/template/:type',
  authenticateToken,
  requirePermission(Permission.CSV_IMPORT),
  (req, res) => {
    try {
      const importType = req.params.type;
      const template = csvImportService.generateTemplate(importType);

      if (!template) {
        return res.status(400).json({
          error: 'Invalid template type',
          validTypes: ['inventory', 'products', 'accounts'],
        });
      }

      const filename = `${importType}-template.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(template);
    } catch (err) {
      console.error('Template download error:', err);
      res.status(500).json({ error: 'Failed to generate template' });
    }
  }
);

export default router;
