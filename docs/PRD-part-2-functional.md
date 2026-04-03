# Hajime B2B App PRD — Part 2: Functional requirements through MVP (§§8–16)

## 8. Functional requirements

### 8.1 Authentication and role management

The system must:

- support secure login
- support role-based access control
- support password reset or secure authentication provider
- log user actions for auditing

### 8.2 Dashboard

Live business KPIs: total on hand, available, reserved, in-transit, in-production inventory; open customer orders; open manufacturer POs; sales (week/month/quarter); top accounts; low-stock alerts; projected stockout date; delayed production/shipment alerts.

Admin filters: market, warehouse, time period, SKU, account.

### 8.3 Inventory management

Support: inventory by SKU, batch/lot, location/warehouse; statuses (available, reserved, damaged, in transit, in production); receiving finished goods; adjustments with reasons; transfers; batch traceability; movement history.

**Inventory fields:** SKU, product name, batch/lot, production date, quantity (bottles/cases), warehouse/location, status, label/packaging version, notes.

### 8.4 Product catalog / SKU management

Current Hajime SKUs; add future SKUs and limited editions; attributes: bottle size, case size, packaging type, market restrictions, product status.

### 8.5 Sales order management

Create/edit orders; reserve inventory; statuses: draft, confirmed, packed, shipped, delivered, cancelled; sales by account/market; export.

**Sales order fields:** order ID, account, market/country/city, order date, requested delivery date, quantity, SKU, price, discount, tax (later), assigned rep, fulfillment status, payment status (later).

### 8.6 CRM / account management

Account types: provincial retail buyers, bottle shops, bars, restaurants, hotels, salons/lifestyle, importers/distributors, international key accounts.

**Account fields:** legal/trading name, country, city, address, account type, main contact (name, role, phone, email), assigned sales owner, payment terms, first/last order dates, average order size, notes, tags, listing status.

**CRM functions:** notes/activities, next follow-up, order history, reorder flags, documents.

### 8.7 Purchase orders to manufacturer

Create/approve PO; required completion date; requested ship date; production notes and packaging specs; track fulfillment; partial completion; close when complete.

**PO fields:** PO number, supplier/manufacturer, issue date, required completion, requested delivery, SKU, quantity, packaging instructions, label version, market destination, status, notes/attachments.

### 8.8 Manufacturer portal

View approved POs; approved rolling demand forecast; update production status by PO/batch; upload documents; flag issues/delays; shipment readiness dates.

**Production statuses:** PO received → materials secured → scheduled → in production → bottled → labelled → packed → ready to ship → shipped → delivered → delayed/issue flagged.

### 8.9 Forecasting and replenishment (MVP rules-based)

Calculate: trailing average sales velocity; inventory cover (days/weeks); projected OOS date; suggested reorder quantity; recommended reorder date.

Inputs: sales history, open customer orders, reserved inventory, in-production supply, manufacturer lead time, safety stock, manual overrides.

### 8.10 Shipments and logistics

Outbound to customers; inbound from manufacturer; status tracking; tracking number; receipt discrepancies; proof of delivery (later).

**Shipment fields:** ID, origin, destination, carrier, ship date, ETA, actual delivery, linked SO or PO, status, notes.

### 8.11 Alerts and notifications

Triggers: inventory below threshold; projected stockout approaching; production delayed; shipment late; PO awaiting approval; account reorder cadence missed; manufacturer flags issue.

Channels: in-app; email; optional SMS later.

### 8.12 Reporting and exports

Exportable: inventory summary; sales by account/market/period; open customer orders; open POs; production status summary; stockout risk; forecast vs actual. **CSV minimum.**

---

## 9. Real-time expectations

Key actions reflected immediately or near-immediately: inventory received/reserved; order created/delivered; manufacturer status changed; low stock threshold crossed; shipment status changed.

**Audit:** who, timestamp, previous/new values, reason where relevant.

---

## 10. Data model overview

Entities: Users, Roles, Products, SKUs, Batches/Lots, Warehouses/Locations, Inventory records, Inventory transactions, Accounts, Contacts, Sales orders & line items, Purchase orders & line items, Production status updates, Shipments, Forecast records, Notes/activities, Documents, Alerts, Notifications.

**Examples:** one account → many sales orders; one SO → many line items; one product → many batches; batch across locations; PO may create batches; shipment links to SO or PO; user → one role, many accounts managed.

---

## 11. Business rules

- **Available inventory** = on hand − reserved − damaged − allocated for outbound shipment
- **Reservation:** inventory reserved when confirmed SO is approved
- **Reorder suggestions:** consider velocity, reserved, open demand, in-production supply, lead time, safety stock
- **Manufacturer visibility:** approved production-related info only; restrict pricing and unrelated accounts unless permitted
- **Batch traceability:** every received unit/case traceable to production batch
- **Adjustments:** manual stock adjustment requires a reason

---

## 12. UX and design requirements

**Direction:** clean, minimal, premium, refined, scannable, not cluttered.

**UX:** mobile responsive; desktop-first for ops/analytics; simple navigation; powerful intuitive filters; dashboards surface action.

**Navigation:** Dashboard, Inventory, Orders, Accounts, Purchase Orders, Manufacturer Portal, Shipments, Reports, Settings.

**Top bar:** global search, notifications, quick add, user/role menu, market filter where relevant.

---

## 13. Technical requirements

**Must:** secure cloud backend; RBAC; API-first; live updates; audit logging; file upload; CSV import/export; scalable multi-country/warehouse/SKU structure.

**Nice to have:** barcode/QR later; webhooks; analytics for forecasting.

---

## 14. Integrations

**MVP:** CSV import (inventory, accounts, orders); email notification provider.

**Future:** accounting; 3PL; POS/depletion imports; ecommerce intake; carrier APIs; document storage.

---

## 15. Security and permissions

Protect commercially sensitive data; RBAC; secure document storage; log critical changes; backup/recovery.

Sensitive: pricing, customer terms, internal forecasts, production planning, credentials.

---

## 16. MVP scope

**In scope:** secure login & RBAC; admin dashboard; inventory by SKU/batch/location; sales orders; account CRM; POs to manufacturer; manufacturer portal with production status; shipment tracking fields; low stock & delay alerts; CSV export/reporting.

**Out of scope:** advanced AI forecasting; native POS; automated invoicing/payment collection; public customer portal; complex distributor settlement.

---

*Continue in [PRD-part-3-wireframes-technical.md](./PRD-part-3-wireframes-technical.md) for Phase 2+, wireframes, routes, DB tables, API list, and sprint order.*
