# Hajime B2B App PRD — Part 1: Overview through workflows (§§1–7)

## 1. Product overview

### Product name

Hajime B2B Operations App

### Purpose

Create a premium, real-time B2B operations platform for Hajime that unifies inventory, sales, account management, production planning, manufacturer coordination, and shipment visibility in one system.

The product should help Hajime operate with better control across multiple markets, avoid stockouts, forecast demand more accurately, and give the manufacturer a clear view of approved production needs.

### Core outcome

A single source of truth for Hajime’s B2B business.

---

## 2. Background and business context

Hajime is a premium beverage brand. The business needs a system that can support current and future B2B growth across markets such as Ontario, Toronto, Milan, and additional export markets.

Today, key business information typically lives across spreadsheets, messages, emails, invoices, account notes, and manufacturer conversations. This creates risk in several areas:

- inventory is hard to see in real time
- sales momentum is difficult to measure consistently
- the manufacturer may not have enough visibility into projected demand
- reordering can happen too late
- account performance is not tracked in one place
- production, shipments, and sales are not fully aligned

The app should solve these problems by connecting the commercial and supply sides of the business.

---

## 3. Product goals

### Primary goals

- Track finished goods inventory in real time
- Track sales orders and account performance
- Give the manufacturer controlled visibility into production needs and timelines
- Reduce stockout risk through better replenishment planning
- Improve communication between founder, sales, operations, and manufacturer
- Support batch traceability and structured reporting

### Secondary goals

- Build a foundation for multi-market expansion
- Support future Hajime SKUs and brand extensions
- Create management reporting for growth and decision-making
- Improve speed and professionalism of B2B operations

---

## 4. Non-goals for MVP

The first version does not need to include all of the following:

- direct consumer ecommerce
- advanced accounting ERP replacement
- complex distributor settlement workflows
- route optimization
- full AI forecasting engine
- native POS integrations with every retail partner
- public retailer portal

These can be considered later phases.

---

## 5. Users and roles

### 5.1 Founder / Admin

**Needs:** full visibility; approve POs and production plans; monitor low-stock and delays; view account/market performance; review forecasting and expansion readiness.

**Permissions:** full read/write; user/permissions management; reporting; configuration.

### 5.2 Sales Team

**Needs:** track accounts; place/record orders; view stock; reorder cycles; log visits, notes, next actions; monitor account sales performance.

**Permissions:** read accounts, orders, assigned dashboards; create/update notes and sales orders; limited inventory visibility; no global admin settings.

### 5.3 Operations / Warehouse

**Needs:** receive inventory; adjust stock; transfers; prepare shipments; reconcile counts; update damaged/missing inventory.

**Permissions:** read/write inventory; update shipment status; limited account information.

### 5.4 Manufacturer

**Needs:** view approved production forecasts; open POs; update production/packaging status; communicate delivery timing; upload production documentation.

**Permissions:** view only approved manufacturing/planning data; update production status; no confidential customer pricing or unrelated account details unless granted.

### 5.5 Finance / Advisor (optional)

**Needs:** view revenue/order summaries; payment/invoice status if enabled later.

**Permissions:** read-only financial dashboards and export.

---

## 6. User stories

### Founder

- As the founder, I want to see how much inventory is available, reserved, in production, and in transit so I can make timely decisions.
- As the founder, I want to know which accounts and markets are performing best so I can prioritize growth.
- As the founder, I want to know when the next production order must be placed so I can avoid stockouts.
- As the founder, I want the manufacturer to see approved demand projections so production can be planned correctly.

### Sales rep

- As a sales rep, I want to see account history and average reorder timing so I can follow up at the right moment.
- As a sales rep, I want to log orders and visit notes from mobile so account activity is always current.
- As a sales rep, I want to know whether stock is available before committing product to an account.

### Operations

- As an operations user, I want to receive inventory by batch so I can maintain traceability.
- As an operations user, I want to reserve stock to customer orders so availability is accurate.
- As an operations user, I want to mark damaged or missing units so inventory reflects reality.

### Manufacturer

- As the manufacturer, I want to see open purchase orders and required dates so I can schedule production.
- As the manufacturer, I want to update the status of each production order so Hajime has real-time visibility.
- As the manufacturer, I want a clear forecast of upcoming demand so I can plan materials and lead times.

---

## 7. Core workflows

### 7.1 Sales to fulfillment workflow

1. Sales rep creates or records a customer order
2. System checks available inventory
3. Inventory is reserved against the order
4. Operations prepares shipment
5. Shipment status is updated
6. Order is marked delivered
7. Sales and inventory dashboards update in real time

### 7.2 Replenishment workflow

1. System monitors available inventory, committed stock, and sales velocity
2. System projects future stockout date
3. System recommends reorder timing and quantity
4. Founder or admin approves purchase order
5. Purchase order is sent to manufacturer
6. Manufacturer updates production stages
7. Production completion and shipment updates feed back into supply dashboard

### 7.3 Manufacturer communication workflow

1. Admin creates approved production order or purchase order
2. Manufacturer receives access to the relevant order and demand details
3. Manufacturer updates status through defined production stages
4. Any delays, packaging issues, or changes are logged in the system
5. Stakeholders receive alerts as needed

### 7.4 Account management workflow

1. New account is created
2. Sales owner is assigned
3. Account type, location, and contact data are stored
4. Orders, notes, and activity history accumulate over time
5. Reorder cadence and account performance become visible on the account profile

---

*Continue in [PRD-part-2-functional.md](./PRD-part-2-functional.md).*
