# Hajime B2B — developer brief (implementation map)

This document mirrors the stakeholder **Hajime B2B App Brief** and records how the current codebase implements it. For the full PRD, see [PRD.md](./PRD.md).

## Implemented in this repo

| Brief area | Implementation |
|------------|----------------|
| **Purpose** — single view of inventory, production, allocations, sell-in, accounts, POs, shipments | Modules: Dashboard, Inventory, Orders, Accounts, Purchase Orders, Manufacturer Portal, Shipments, Reports, Settings. |
| **Roles** (5-way: Manufacturer, Brand Operator HQ, Distributor, Retail, Sales Rep) | `AuthContext` + `/login` (demo). **Brand Operator**: full app + Settings + production updates. **Manufacturer**: Manufacturer Portal only. **Distributor** & **Sales Rep**: operations without Settings or Manufacturer portal. **Retail**: Dashboard, Orders, Shipments only. Legacy sessions (`founder`→Brand Operator, `sales`→Sales Rep, `operations`→Distributor) migrate on load. |
| **Dashboard KPIs** | Live metrics from persisted data: available / reserved / in-production / in-transit bottles, open orders, sell-in revenue (month/quarter from order dates), active accounts, pending POs, delayed shipments, alerts, reorder suggestions, top accounts, monthly revenue chart. |
| **Inventory** | SKU, batch, location, status buckets, receive flow, FIFO deduct on PO ship (existing). Traceability fields: production date, label version, cases/bottles. |
| **Sell-in vs sell-through** | **Sell-in:** order lines and wholesale `price`. **Sell-through:** optional `sellThroughUnits` on orders; optional `sellThroughLastPeriod` + CRM fields on accounts (listing, last/next contact). |
| **Manufacturer portal** | Pipeline aligned with brief (PO received → … → delivered + delayed). Context KPIs: total available bottles, on-track / draft / delayed PO counts. **Brand Operator + manufacturer** can post production updates (persisted + **audit log**). |
| **PO & replenishment** | PO CRUD/approve flows (existing). **Rules-based reorder** on Dashboard + configurable **lead time** and **default safety stock per SKU** in Settings (drives alerts + reorder list). |
| **CRM / accounts** | Account types, contacts, tags, Stripe card hints; extended fields for listing, sell-through estimate, follow-up dates. |
| **Alerts** | Derived: low stock vs safety targets, delayed POs, delayed / past-ETA shipments, overdue payment flag on orders, high-urgency reorder hints. |
| **Reports** | Charts and tables from **live** `AppData` (not static mock charts). |
| **Audit** | `auditLogs` on app state; entries appended on manufacturer production updates (pattern for expanding to inventory/order mutations). |
| **Mobile-friendly** | Responsive layout, touch targets on nav and forms (continued pattern). |
| **Technical** | API-first persistence via `GET/PUT /api/app` + optional `VITE_API_BASE_URL`; structured for future REST split and WebSockets (not yet connected). |

## Not yet implemented (Phase 2+ per brief)

- Real SSO / password reset, server-side auth and row-level RBAC enforcement.  
- Email/SMS notifications (in-app alerts only).  
- CSV import/export actions (button placeholders may remain).  
- POS / accounting integrations, barcode scanning, AI forecasting.  
- Dedicated customer / retailer portal.  
- WebSocket or push **real-time** sync (data updates on save/debounce today).  

## Supply chain model (roles)

**Intended flow:** Manufacturer → **Brand Operator (HQ)** → Distributor → Retail — implemented as **one connected system** (shared `AppData`, not isolated layers).

- **Brand Operator** is the control center: sees retail demand, inventory, and POs; allocates or triggers reorder; manufacturer visibility stays tied to that demand.
- **Example:** Retail (e.g. Milan) orders → HQ sees the spike → checks stock → allocates or raises a PO → manufacturer adjusts production against the same picture.

## One-line summary

Build a real-time B2B operating system for Hajime that connects sales, inventory, production, and manufacturer visibility in one premium app — **this codebase implements the MVP surface with live metrics, role-gated navigation, replenishment logic, and an auditable manufacturer workflow on top of persisted JSON state.**
