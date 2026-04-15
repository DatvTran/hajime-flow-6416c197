# Database CRUD Audit - Hajime B2B API

**Date:** April 15, 2026  
**Status:** Partial Implementation - Action Required

---

## ✅ FULLY IMPLEMENTED (Database-backed CRUD)

### 1. Products
| Operation | Endpoint | Status |
|-----------|----------|--------|
| List | `GET /api/v1/products` | ✅ |
| Get Single | `GET /api/v1/products/:id` | ✅ |
| Create | `POST /api/v1/products` | ✅ |
| Update | `PUT /api/v1/products/:id` | ✅ |
| Delete | `DELETE /api/v1/products/:id` | ✅ Soft delete |

**Table:** `products`  
**Notes:** Full CRUD with tenant isolation, search, pagination

---

### 2. Accounts (Customers/Distributors)
| Operation | Endpoint | Status |
|-----------|----------|--------|
| List | `GET /api/v1/accounts` | ✅ |
| Get Single | `GET /api/v1/accounts/:id` | ✅ |
| Create | `POST /api/v1/accounts` | ✅ |
| Update | `PUT /api/v1/accounts/:id` | ✅ |
| Delete | `DELETE /api/v1/accounts/:id` | ✅ Soft delete |

**Table:** `accounts`  
**Notes:** Full CRUD with type filtering, market filtering

---

### 3. Sales Orders
| Operation | Endpoint | Status |
|-----------|----------|--------|
| List | `GET /api/v1/orders` | ✅ |
| Get Single | `GET /api/v1/orders/:id` | ✅ |
| Create | `POST /api/v1/orders` | ✅ |
| Update | `PUT /api/v1/orders/:id` | ✅ |
| Patch Status | `PATCH /api/v1/orders/:id/status` | ✅ |
| Delete | `DELETE /api/v1/orders/:id` | ✅ Soft delete |

**Tables:** `sales_orders`, `sales_order_items`  
**Notes:** Transaction-safe with items, status workflow

---

### 4. Depletion Reports
| Operation | Endpoint | Status |
|-----------|----------|--------|
| List | `GET /api/v1/depletion-reports` | ✅ |
| Get Single | `GET /api/v1/depletion-reports/:id` | ✅ |
| Create | `POST /api/v1/depletion-reports` | ✅ |
| Update | `PUT /api/v1/depletion-reports/:id` | ✅ |
| Delete | `DELETE /api/v1/depletion-reports/:id` | ✅ Soft delete |
| Velocity | `GET /api/v1/depletion-reports/sellthrough/velocity` | ✅ |
| Summary | `GET /api/v1/depletion-reports/sellthrough/summary` | ✅ |

**Table:** `depletion_reports`  
**Notes:** Full CRUD with analytics endpoints

---

### 5. New Product Requests
| Operation | Endpoint | Status |
|-----------|----------|--------|
| List | `GET /api/v1/new-product-requests` | ✅ |
| Get Single | `GET /api/v1/new-product-requests/:id` | ✅ |
| Create | `POST /api/v1/new-product-requests` | ✅ |
| Update | `PUT /api/v1/new-product-requests/:id` | ✅ |
| Delete | `DELETE /api/v1/new-product-requests/:id` | ⚠️ Hard delete |

**Table:** `new_product_requests`  
**Notes:** Uses JSONB for specs/proposals, **MISSING soft delete**

---

### 6. Inventory Adjustment Requests
| Operation | Endpoint | Status |
|-----------|----------|--------|
| List | `GET /api/v1/inventory-adjustment-requests` | ✅ |
| Create | `POST /api/v1/inventory-adjustment-requests` | ✅ |
| Approve/Reject | `PATCH /api/v1/inventory-adjustment-requests/:id/approve` | ✅ |

**Table:** `inventory_adjustment_requests`  
**Notes:** Workflow-based, no delete needed (audit trail)

---

## ⚠️ PARTIALLY IMPLEMENTED

### 7. Inventory
| Operation | Endpoint | Status |
|-----------|----------|--------|
| List | `GET /api/v1/inventory` | ✅ |
| Adjust | `POST /api/v1/inventory/adjust` | ✅ |
| **Get Single** | `GET /api/v1/inventory/:id` | ❌ MISSING |
| **Update Item** | `PUT /api/v1/inventory/:id` | ❌ MISSING |
| **Delete Item** | `DELETE /api/v1/inventory/:id` | ❌ MISSING |

**Table:** `inventory`  
**Notes:** Only list and adjust available. Missing individual item CRUD.

---

### 8. Visit Notes
| Operation | Endpoint | Status |
|-----------|----------|--------|
| List | `GET /api/v1/visit-notes` | ✅ |
| Create | `POST /api/v1/visit-notes` | ✅ |
| **Get Single** | `GET /api/v1/visit-notes/:id` | ❌ MISSING |
| **Update** | `PUT /api/v1/visit-notes/:id` | ❌ MISSING |
| **Delete** | `DELETE /api/v1/visit-notes/:id` | ❌ MISSING |

**Table:** `visit_notes`  
**Notes:** Only list and create. Missing individual CRUD.

---

### 9. Sales Targets
| Operation | Endpoint | Status |
|-----------|----------|--------|
| List | `GET /api/v1/sales-targets` | ✅ |
| Create | `POST /api/v1/sales-targets` | ✅ |
| **Update** | `PUT /api/v1/sales-targets/:id` | ❌ MISSING |
| **Delete** | `DELETE /api/v1/sales-targets/:id` | ❌ MISSING |

**Table:** `sales_targets`  
**Notes:** Missing update and delete

---

## ❌ NOT IMPLEMENTED (JSON File / AppData Only)

### 10. Purchase Orders (Production Orders)
| Operation | Endpoint | Status |
|-----------|----------|--------|
| List | Database API | ❌ Uses `/api/app` |
| Create | Database API | ❌ Uses `/api/app` |
| Update | Database API | ❌ Uses `/api/app` |
| Delete | Database API | ❌ Uses `/api/app` |

**Current:** Saved to `app-state.json` via `writeAppState`  
**Needed:** Full database CRUD

---

### 11. Transfer Orders
| Operation | Endpoint | Status |
|-----------|----------|--------|
| List | Database API | ❌ Uses `/api/app` |
| Create | Database API | ❌ Uses `/api/app` |
| Update | Database API | ❌ Uses `/api/app` |
| Delete | Database API | ❌ Uses `/api/app` |

**Current:** Saved to `app-state.json`  
**Needed:** Full database CRUD

---

### 12. Shipments
| Operation | Endpoint | Status |
|-----------|----------|--------|
| List | Database API | ❌ Uses `/api/app` |
| Create | Database API | ❌ Uses `/api/app` |
| Update | Database API | ❌ Uses `/api/app` |
| Delete | Database API | ❌ Uses `/api/app` |

**Current:** Saved to `app-state.json`  
**Needed:** Full database CRUD

---

### 13. Incentives
| Operation | Endpoint | Status |
|-----------|----------|--------|
| List | Database API | ❌ Uses client storage |
| Create | Database API | ❌ Uses client storage |
| Update | Database API | ❌ Uses client storage |
| Delete | Database API | ❌ Uses client storage |

**Current:** React state only  
**Needed:** Full database CRUD

---

## Summary

| Entity | Database Table | Full CRUD | Notes |
|--------|---------------|-----------|-------|
| Products | ✅ | ✅ | Complete |
| Accounts | ✅ | ✅ | Complete |
| Sales Orders | ✅ | ✅ | Complete |
| Depletion Reports | ✅ | ✅ | Complete |
| New Product Requests | ✅ | ⚠️ | Missing soft delete |
| Inventory | ✅ | ⚠️ | Missing individual item CRUD |
| Visit Notes | ✅ | ⚠️ | Missing update/delete |
| Sales Targets | ✅ | ⚠️ | Missing update/delete |
| **Purchase Orders** | ❌ | ❌ | **JSON only - CRITICAL** |
| **Transfer Orders** | ❌ | ❌ | **JSON only - CRITICAL** |
| **Shipments** | ❌ | ❌ | **JSON only - CRITICAL** |
| **Incentives** | ❌ | ❌ | **React state only** |

---

## Recommendations

### Priority 1: Critical (Blocking production)
1. **Purchase Orders** - Move from JSON to database with full CRUD
2. **Transfer Orders** - Move from JSON to database with full CRUD
3. **Shipments** - Move from JSON to database with full CRUD

### Priority 2: High (Data integrity)
4. Add soft delete to `new_product_requests`
5. Complete Inventory individual item CRUD

### Priority 3: Medium (Completeness)
6. Complete Visit Notes CRUD
7. Complete Sales Targets CRUD
8. Add Incentives database table and CRUD
