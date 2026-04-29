# Hajime Supply Chain OS — Production Implementation

This document describes the production-grade implementation of the Hajime B2B Supply Chain platform, covering the three priority areas: **Server-Side Auth/RBAC**, **PostgreSQL Database Migration**, and **CSV Import/Export**.

## 🚀 Quick Start

### Prerequisites
- PostgreSQL 14+
- Redis 7+ (optional, for session storage)
- Node.js 18+

### Setup

```bash
# 1. Install server dependencies
cd server
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 3. Create database
createdb hajime_dev

# 4. Run migrations
npm run migrate

# 5. Start server
npm start
```

## 📁 Project Structure

```
server/
├── config/
│   └── database.mjs          # Knex.js database configuration
├── middleware/
│   ├── auth.mjs              # JWT authentication & RBAC middleware
│   └── security.mjs          # Helmet, rate limiting, CORS
├── migrations/
│   ├── 001_core_auth_schema.mjs    # Users, auth tables
│   └── 002_business_entities.mjs   # Products, orders, inventory
├── rbac/
│   └── permissions.mjs       # Role definitions & permission matrix
├── routes/
│   ├── auth.mjs              # Auth endpoints (login, register, etc.)
│   └── csv.mjs               # CSV import/export endpoints
├── services/
│   ├── auth.mjs              # Auth service (Argon2, JWT)
│   ├── csv.mjs               # CSV import/export service
│   └── data-migration.mjs    # JSON → PostgreSQL migration service
├── index.mjs                 # Main server entry point
└── knexfile.mjs              # Knex configuration
```

## 🔐 Priority Area 1: Server-Side Auth/RBAC

### Features Implemented

✅ **Password Security**
- Argon2id hashing (OWASP recommended)
- Memory cost: 64MB, time cost: 3 iterations
- Secure password reset flow with token hashing

✅ **JWT Authentication**
- Access tokens: 15-minute expiry
- Refresh tokens: 7-day expiry, stored hashed in database
- Token revocation support

✅ **RBAC System**
- 9 roles: `founder_admin`, `brand_operator`, `sales`, `operations`, `manufacturer`, `finance`, `distributor`, `retail`, `sales_rep`
- 30+ granular permissions
- Wildcard support (`users:*` grants all user permissions)

✅ **Security Features**
- Account lockout after 5 failed attempts
- Rate limiting on auth endpoints (10 requests/15 min)
- Comprehensive audit logging
- IP address and user agent tracking

### API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Authenticate | No |
| POST | `/api/auth/refresh` | Refresh access token | No |
| POST | `/api/auth/logout` | Revoke refresh token | No |
| POST | `/api/auth/password-reset-request` | Request password reset | No |
| POST | `/api/auth/password-reset` | Complete password reset | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Middleware Usage

```javascript
import { authenticateToken, requirePermission } from './middleware/auth.mjs';
import { Permission } from './rbac/permissions.mjs';

// Protect route with authentication
app.get('/api/protected', authenticateToken, handler);

// Protect route with specific permission
app.post('/api/products', 
  authenticateToken, 
  requirePermission(Permission.INVENTORY_WRITE), 
  handler
);

// Protect route with any of multiple permissions
app.get('/api/reports',
  authenticateToken,
  requireAnyPermission(Permission.REPORTS_READ, Permission.FINANCIALS_READ),
  handler
);
```

## 🗄️ Priority Area 2: PostgreSQL Database Migration

### Migration Stages

The implementation uses a **6-stage incremental migration** approach. Stages 0-2 are legacy/local-only modes and must not be used in shared environments (staging/production):

| Stage | Reads From | Writes To | Duration |
|-------|------------|-----------|----------|
| 0 | JSON | JSON | Legacy/local-only baseline |
| 1 | JSON | JSON + PostgreSQL | Legacy/local-only shadow write |
| 2 | JSON (compared) | JSON + PostgreSQL | Legacy/local-only comparison |
| 3 | PostgreSQL | JSON + PostgreSQL | **Required minimum for shared environments** |
| 4 | PostgreSQL | PostgreSQL only | 2 weeks |
| 5 | PostgreSQL | PostgreSQL only (deprecated warning) | 2 weeks |
| 6 | PostgreSQL | PostgreSQL only (JSON removed) | Complete |

### Database Schema

#### Core Tables
- `tenants` — Multi-tenant isolation
- `users` — User accounts with role-based access
- `refresh_tokens` — Token storage for session management
- `auth_events` — Audit log for authentication

#### Business Tables
- `products` — SKU catalog
- `inventory` — Stock levels with reorder points
- `accounts` — Customer/retailer accounts
- `sales_orders` — Sales order headers
- `sales_order_items` — Line items
- `purchase_orders` — PO headers
- `purchase_order_items` — PO line items
- `shipments` — Shipment tracking
- `production_runs` — Manufacturing batches

### Running Migrations

```bash
# Run all pending migrations
npm run migrate

# Rollback last migration
npm run migrate:rollback

# Create new migration
npm run migrate:make migration_name

# Reset database (rollback + migrate + seed)
npm run db:reset
```

### Feature Flag Control

Set `FEATURE_FLAG_DB_MIGRATION_STAGE` in `.env`:

```bash
# Stage 0-2: legacy/local-only modes (do not use in shared envs)

# Stage 3+: PostgreSQL as primary (required for staging/production)
FEATURE_FLAG_DB_MIGRATION_STAGE=3
```

## 📊 Priority Area 3: CSV Import/Export

### Features Implemented

✅ **Export Capabilities**
- Streaming exports for large datasets
- CSV injection prevention (formula escaping)
- Multiple export formats: inventory, sales-by-account, orders

✅ **Import Capabilities**
- Preview/validation before commit
- Zod schema validation
- Transactional commits (all-or-nothing)
- Template downloads

✅ **Security**
- Formula injection prevention
- File size limits (10MB)
- MIME type validation
- Rate limiting on exports

### API Endpoints

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/api/csv/export/inventory` | Export inventory | `csv:export` |
| GET | `/api/csv/export/sales-by-account` | Export sales report | `csv:export` |
| GET | `/api/csv/export/orders` | Export orders | `csv:export` |
| POST | `/api/csv/import/preview/:type` | Preview import | `csv:import` |
| POST | `/api/csv/import/commit/:type` | Commit import | `csv:import` |
| GET | `/api/csv/template/:type` | Download template | `csv:import` |

### Import Types

- `inventory` — Update stock levels
- `products` — Create/update products
- `accounts` — Create/update accounts

### Example: Export Inventory

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4242/api/csv/export/inventory?lowStock=true" \
  --output inventory.csv
```

### Example: Import Products

```bash
# 1. Preview import
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@products.csv" \
  http://localhost:4242/api/csv/import/preview/products

# 2. Commit import (use tempImportId from preview response)
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"allRows": [...]}' \
  http://localhost:4242/api/csv/import/commit/products
```

## 🔒 Security Configuration

### Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hajime_dev
DB_USER=postgres
DB_PASSWORD=secure_password

# Authentication (generate with: openssl rand -base64 64)
ACCESS_TOKEN_SECRET=...
REFRESH_TOKEN_SECRET=...
SESSION_SECRET=...

# Feature Flags
FEATURE_FLAG_AUTH_ENABLED=true
FEATURE_FLAG_CSV_ENABLED=true
FEATURE_FLAG_DB_MIGRATION_STAGE=1

# Rate Limiting (optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Security Headers

Helmet.js configured with:
- Content Security Policy
- Strict Transport Security
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff

### Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/*` | 10 requests | 15 min |
| `/api/csv/*` | 5 requests | 5 min |
| All other API | 100 requests | 15 min |

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Load Tests
```bash
k6 run loadtest/api-load-test.js
```

## 📈 Monitoring

Health check endpoint:
```bash
curl http://localhost:4242/api/health
```

Response:
```json
{
  "ok": true,
  "stripe": true,
  "database": "connected",
  "features": {
    "auth": true,
    "csv": true
  },
  "migrationStage": 1
}
```

## 🚀 Deployment

### Fly.io Deployment

```bash
# Deploy with database migrations
fly deploy

# Run migrations on production
fly ssh console
npm run migrate

# Set secrets
fly secrets set \
  DB_HOST=... \
  DB_PASSWORD=... \
  ACCESS_TOKEN_SECRET=... \
  REFRESH_TOKEN_SECRET=...
```

### Docker Build

```bash
docker build -t hajime-api .
docker run -p 4242:4242 --env-file .env hajime-api
```

## 📋 Migration Checklist

Before enabling in production:

- [ ] Database migrations tested on staging
- [ ] Auth flow verified (register, login, password reset)
- [ ] RBAC permissions tested for each role
- [ ] CSV export/import tested with sample data
- [ ] Rate limiting verified
- [ ] Security headers confirmed
- [ ] Health check endpoint responding
- [ ] Feature flags configured for gradual rollout

## 🆘 Rollback Procedures

### Revert Auth Changes
```bash
# Disable auth feature flag
fly secrets set FEATURE_FLAG_AUTH_ENABLED=false
```

### Revert Database Migration
```bash
# Stage 3 → Stage 2 (revert reads to JSON)
fly secrets set FEATURE_FLAG_DB_MIGRATION_STAGE=2

# Emergency: Full rollback to JSON
fly secrets set FEATURE_FLAG_DB_MIGRATION_STAGE=0
```

### Database Rollback
```bash
# Rollback specific migration
npm run migrate:rollback
```

## 📚 Additional Resources

- [Knex.js Documentation](http://knexjs.org/)
- [Argon2 Password Hashing](https://github.com/ranisalt/node-argon2)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-jwt-bcp)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)

---

**Implementation Status**: Production Ready  
**Last Updated**: April 8, 2026
