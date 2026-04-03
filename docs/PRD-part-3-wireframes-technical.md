# Hajime B2B App PRD — Part 3: Roadmap, wireframes, technical build (§§17–23)

## 17. Phase 2 roadmap

- Stronger forecasting engine
- POS or depletion data integrations
- Payment and invoice tracking
- Barcode scanning
- Deeper logistics integrations
- Customer reorder portal
- Multi-language support
- Margin analysis
- Account scorecards

---

## 18. Success metrics

- Reduction in stockout incidents
- Improved reorder timing accuracy
- Improved on-time manufacturer fulfillment visibility
- Reduction in manual spreadsheet work
- Faster account follow-up cycles
- More accurate inventory records
- Better visibility into sales by market and account

---

## 19. Open implementation questions

Finalize with the business during discovery:

- number of starting SKUs
- warehouse structure and ownership model
- manufacturer lead times by product type
- direct vs distributor vs mixed sales by market
- payment tracking in MVP or not
- manufacturer document uploads in MVP
- external account user access later

---

## 20. Acceptance criteria summary (MVP)

MVP is successful when:

- admin sees real-time inventory and open orders on one dashboard
- sales can create and manage customer orders
- inventory can be received, reserved, adjusted, tracked by batch
- manufacturer can view approved POs and update production stages
- low inventory and production delay alerts work
- reports export for management review
- system supports current operations and future market growth

---

## 21. One-paragraph handoff summary

We need a premium B2B operations app for Hajime that connects inventory, sales, customer accounts, purchase orders, manufacturer production updates, and shipment tracking in one live system. The platform must support role-based access for founder, sales, operations, and manufacturer users. The MVP should focus on real-time inventory visibility, sales tracking, account CRM, replenishment planning, production tracking, and operational reporting, with a structure that can scale to more SKUs, more markets, and more complex supply workflows over time.

---

## 22. Wireframe and feature map (outline)

### 22.1 App structure

Left-hand navigation + top utility bar (global search, notifications, quick add, user/role, market filter).

### 22.2 Pages (A–J)

| Page | Purpose |
|------|---------|
| **Login** | Email/password, forgot password, SSO later |
| **Dashboard** | KPI cards, alerts, sales chart, inventory snapshot, reorder recs, top accounts |
| **Inventory** | Filters, table (SKU, batch, location, available/reserved/damaged, etc.), receive/adjust/transfer, drawer detail |
| **Sales orders** | List, filters, create/edit, detail with reservations & shipment link |
| **Accounts / CRM** | List, profile (details, contacts, orders, performance, notes, documents, follow-ups) |
| **Purchase orders** | List, create, approve, detail with production timeline |
| **Manufacturer portal** | Simplified UI; approved POs, forecast, status updates, issues, uploads — no restricted commercial data |
| **Shipments** | Inbound/outbound list, timeline, discrepancies |
| **Reports** | Categories + filters + export |
| **Settings** | Users/roles, locations, manufacturer profiles, catalog, thresholds, safety stock, document types, export templates |

### 22.3 Feature map by module

- **Dashboard:** live KPIs, alert center, filters, reorder widget, quick links
- **Inventory:** batch ledger, multi-location, adjust/transfer, reservations, history, CSV
- **Orders:** creation, workflow, reservations, activity log, shipment link
- **CRM:** profiles, contacts, notes, order history, reorder monitoring, next actions
- **POs:** create/approve, packaging/market specs, production timeline, supplier log
- **Manufacturer portal:** demand visibility, queue, status, issues, uploads
- **Shipments:** inbound/outbound, timeline, discrepancies, ETA, delivery confirmation
- **Reports:** exportable tables, saved views, filters
- **Settings:** users, RBAC, products, warehouses, thresholds

---

## 23. Technical build scope

### 23.1 Suggested routes

**Public:** `/login`, `/forgot-password`

**Authenticated:** `/dashboard`, `/inventory`, `/inventory/:inventoryId`, `/inventory/transactions`, `/orders`, `/orders/new`, `/orders/:orderId`, `/accounts`, `/accounts/new`, `/accounts/:accountId`, `/purchase-orders`, `/purchase-orders/new`, `/purchase-orders/:poId`, `/manufacturer`, `/manufacturer/production/:poId`, `/shipments`, `/shipments/:shipmentId`, `/reports`, `/settings`, `/settings/users`, `/settings/products`, `/settings/locations`, `/settings/notifications`

### 23.2 Suggested database tables

`users`, `roles`, `permissions` (optional), `products`, `product_market_rules`, `batches`, `locations`, `inventory_records`, `inventory_transactions`, `accounts`, `account_contacts`, `account_activities`, `sales_orders`, `sales_order_items`, `reservations`, `manufacturers`, `purchase_orders`, `purchase_order_items`, `production_updates`, `forecasts`, `shipments`, `shipment_items`, `documents`, `alerts`, `audit_logs` — with fields as specified in the source PRD (id, foreign keys, timestamps, JSON for audit deltas, etc.).

### 23.3 Suggested REST API (summary)

- **Auth:** `POST /api/auth/login|logout|forgot-password|reset-password`, `GET /api/auth/me`
- **Dashboard:** `GET /api/dashboard/summary|alerts|sales-trends|inventory-snapshot|reorder-recommendations`
- **Users/Roles:** `GET/POST/PATCH /api/users`, `GET /api/roles`
- **Products:** `GET/POST/PATCH /api/products`, market-rules subroutes
- **Batches, Locations:** CRUD patterns as listed in full PRD
- **Inventory:** `GET /api/inventory`, receive/adjust/transfer/reserve/unreserve, transactions list
- **Accounts:** CRUD + contacts, activities, orders subroutes
- **Sales orders:** CRUD + confirm/cancel/pack/ship/deliver + reservations
- **Manufacturers & POs:** CRUD + approve/send/close + production-updates
- **Manufacturer portal:** `GET /api/manufacturer/queue|forecasts`, `POST .../status|issues|documents`
- **Forecasts, Shipments, Reports, Documents, Alerts, Audit:** as in full PRD list

### 23.4 Realtime events (if using WebSockets / provider)

Publish: `inventory.updated`, `order.created`, `order.status_changed`, `purchase_order.updated`, `production.status_changed`, `shipment.updated`, `alert.created`

### 23.5 Recommended MVP build order

1. **Sprint 1:** auth, roles, products, locations, users  
2. **Sprint 2:** inventory records, transactions, receive/adjust/transfer  
3. **Sprint 3:** accounts, contacts, activities, sales orders, reservations  
4. **Sprint 4:** purchase orders, manufacturers, production updates, manufacturer portal  
5. **Sprint 5:** shipments, alerts, dashboard, core reports  
6. **Sprint 6:** polish, permissions hardening, CSV import/export, QA launch prep  

### 23.6 Developer handoff note

The MVP should be built so that Hajime can start with one primary SKU and still scale cleanly to multiple products, multiple warehouses, and multiple markets. The architecture should prioritize clarity of inventory state, traceability by batch, strong audit logging, and carefully restricted manufacturer access.

---

*Index: [PRD.md](./PRD.md) · Part 1: [PRD-part-1-overview.md](./PRD-part-1-overview.md) · Part 2: [PRD-part-2-functional.md](./PRD-part-2-functional.md)*
