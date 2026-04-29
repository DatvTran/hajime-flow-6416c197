/**
 * Hajime API — Production Server
 * Features: Auth/RBAC, PostgreSQL, CSV Import/Export, Stripe
 */
import express from 'express';
import compression from 'compression';
import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Services
import { db } from './config/database.mjs';
import { dataMigrationService } from './services/data-migration.mjs';

// Middleware
import { setupSecurityMiddleware, rateLimiters } from './middleware/security.mjs';
import { authenticateToken } from './middleware/auth.mjs';

// Routes
import authRoutes from './routes/auth.mjs';
import csvRoutes from './routes/csv.mjs';
import apiV1Routes from './routes/api-v1.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

// ── Startup environment validation ─────────────────────────────────────────
// Fail fast: crash at boot rather than silently allowing unsigned JWTs
const REQUIRED_ENV = ['ACCESS_TOKEN_SECRET'];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(
    `FATAL: Missing required environment variables: ${missingEnv.join(', ')}\n` +
    `Set them in server/.env or as Fly.io secrets (fly secrets set ACCESS_TOKEN_SECRET=...)`
  );
  process.exit(1);
}

// Warn if the secret is too short (minimum 32 chars recommended)
if ((process.env.ACCESS_TOKEN_SECRET ?? '').length < 32) {
  console.warn('WARNING: ACCESS_TOKEN_SECRET is shorter than 32 characters — use a longer secret in production');
}
// ───────────────────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT) || 4242;
const DATA_DIR = path.join(__dirname, 'data');
const CUSTOMER_MAP_FILE = path.join(DATA_DIR, 'stripe-customers.json');

// Feature flags
const FEATURE_FLAG_AUTH_ENABLED = process.env.FEATURE_FLAG_AUTH_ENABLED === 'true';
const FEATURE_FLAG_CSV_ENABLED = process.env.FEATURE_FLAG_CSV_ENABLED === 'true';

// Stripe setup
const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
const stripe = secretKey ? new Stripe(secretKey) : null;

if (!stripe) {
  console.warn('[hajime-api] Missing STRIPE_SECRET_KEY — Stripe features disabled');
}

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readCustomerMap() {
  ensureDataDir();
  if (!fs.existsSync(CUSTOMER_MAP_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(CUSTOMER_MAP_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeCustomerMap(map) {
  ensureDataDir();
  fs.writeFileSync(CUSTOMER_MAP_FILE, JSON.stringify(map, null, 2), 'utf8');
}

function stripeErrorMessage(e) {
  if (typeof e === 'string') return e;
  const raw = e?.raw;
  if (raw && typeof raw === 'object') {
    if (typeof raw.message === 'string' && raw.message.length > 0) return raw.message;
    const nested = raw.error;
    if (nested && typeof nested === 'object' && typeof nested.message === 'string') return nested.message;
  }
  if (typeof e?.message === 'string' && e.message.length > 0) return e.message;
  return 'Stripe error';
}

function requireStripe(_req, res, next) {
  if (!stripe) {
    return res.status(503).json({
      error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to server/.env and restart.',
    });
  }
  next();
}

// Initialize Express
const app = express();
app.set('trust proxy', 1);
app.set('etag', 'strong');

app.use(
  compression({
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
  })
);

// Security middleware
setupSecurityMiddleware(app);

// Body parsing
app.use(express.json({ limit: '2mb' }));

// Allow conditional revalidation while avoiding stale cache.
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'private, no-cache, must-revalidate');
  next();
});

// Apply rate limiting
app.use('/api/auth', rateLimiters.auth);
app.use('/api/csv', rateLimiters.csvExport);
app.use('/api', rateLimiters.api);

// ===== AUTH ROUTES =====
if (FEATURE_FLAG_AUTH_ENABLED) {
  app.use('/api/auth', authRoutes);
  console.log('[hajime-api] Auth routes enabled');
}

// ===== CSV ROUTES =====
if (FEATURE_FLAG_CSV_ENABLED) {
  app.use('/api/csv', csvRoutes);
  console.log('[hajime-api] CSV routes enabled');
}

// ===== GRANULAR API v1 =====
app.use('/api/v1', apiV1Routes);
console.log('[hajime-api] Granular API v1 enabled');

// ===== APP DATA API (with migration stages) =====
app.get('/api/app', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      // Never fall back to a hardcoded UUID — reject to prevent cross-tenant data leakage
      return res.status(403).json({ error: 'Tenant identity missing from token' });
    }
    const tenantScopedMeta = dataMigrationService.getDataMetaIfJSON(tenantId);
    if (dataMigrationService.stage <= 2 && !tenantScopedMeta) {
      return res.status(503).json({ error: 'Tenant-scoped JSON unavailable for active migration stage' });
    }

    if (tenantScopedMeta) {
      const ifNoneMatch = req.headers['if-none-match'];
      res.set('ETag', tenantScopedMeta.etag);
      if (ifNoneMatch && ifNoneMatch === tenantScopedMeta.etag) {
        return res.status(304).end();
      }
      res.type('application/json').send(tenantScopedMeta.jsonString);
      return;
    }

    const data = await dataMigrationService.getData(tenantId);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e?.message ?? e) });
  }
});

app.put('/api/app', authenticateToken, async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Expected JSON object' });
    }

    const required = ['products', 'inventory', 'accounts', 'salesOrders', 'purchaseOrders', 'shipments', 'productionStatuses'];
    for (const k of required) {
      if (!Array.isArray(body[k])) {
        return res.status(400).json({ error: `Missing or invalid array: ${k}` });
      }
    }

    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant identity missing from token' });
    }

    if (dataMigrationService.stage <= 4 && !dataMigrationService.resolveTenantJSONFileKey(tenantId)) {
      return res.status(503).json({ error: 'Tenant-scoped JSON unavailable for active migration stage' });
    }

    await dataMigrationService.saveData(body, tenantId);

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e?.message ?? e) });
  }
});

// ===== HEALTH CHECK =====
app.get('/api/health', async (_req, res) => {
  let dbStatus = 'unknown';
  try {
    await db.raw('SELECT 1');
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'disconnected';
  }

  res.json({
    ok: true,
    stripe: Boolean(stripe),
    database: dbStatus,
    features: {
      auth: FEATURE_FLAG_AUTH_ENABLED,
      csv: FEATURE_FLAG_CSV_ENABLED,
    },
    migrationStage: dataMigrationService.stage,
  });
});

// ===== STRIPE ROUTES (existing) =====
app.post('/api/stripe/customer', requireStripe, async (req, res) => {
  try {
    const { accountKey, email, name } = req.body;
    if (!accountKey || !email) {
      return res.status(400).json({ error: 'accountKey and email are required' });
    }
    const map = readCustomerMap();
    let customerId = map[accountKey];
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
        return res.json({ customerId });
      } catch {
        delete map[accountKey];
        writeCustomerMap(map);
      }
    }
    const customer = await stripe.customers.create({
      email,
      name: name || accountKey,
      metadata: { hajime_account_key: String(accountKey) },
    });
    map[accountKey] = customer.id;
    writeCustomerMap(map);
    res.json({ customerId: customer.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: stripeErrorMessage(e) });
  }
});

app.post('/api/stripe/checkout-setup-session', requireStripe, async (req, res) => {
  try {
    const { customerId, accountKey, origin } = req.body;
    if (!customerId || !accountKey || !origin) {
      return res.status(400).json({ error: 'customerId, accountKey, and origin are required' });
    }
    const base = String(origin).replace(/\/$/, '');
    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      customer: customerId,
      payment_method_types: ['card'],
      metadata: { hajime_account_key: String(accountKey) },
      success_url: `${base}/orders?stripe_setup=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/orders?stripe_setup=cancel`,
    });
    if (!session.url) {
      return res.status(500).json({ error: 'Stripe did not return a Checkout URL.' });
    }
    res.json({ url: session.url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: stripeErrorMessage(e) });
  }
});

app.get('/api/stripe/checkout-session-status', requireStripe, async (req, res) => {
  try {
    const sessionId = req.query.session_id;
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'session_id query parameter is required' });
    }
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['setup_intent'],
    });
    const setupIntentId = session.setup_intent;
    let setupStatus = null;
    if (typeof setupIntentId === 'string') {
      const si = await stripe.setupIntents.retrieve(setupIntentId);
      setupStatus = si.status;
    } else if (setupIntentId && typeof setupIntentId === 'object') {
      setupStatus = setupIntentId.status;
    }
    const ok = session.status === 'complete' && setupStatus === 'succeeded';
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
    const accountKey = session.metadata?.hajime_account_key ?? '';
    res.json({ ok, customerId: customerId || '', accountKey, setupStatus: setupStatus || '' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: stripeErrorMessage(e) });
  }
});

app.post('/api/stripe/setup-intent', requireStripe, async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId) return res.status(400).json({ error: 'customerId required' });
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      usage: 'off_session',
    });
    const clientSecret = setupIntent.client_secret;
    if (!clientSecret) {
      return res.status(500).json({ error: 'Stripe did not return a client secret.' });
    }
    res.json({ clientSecret });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: stripeErrorMessage(e) });
  }
});

app.post('/api/stripe/payment-intent', requireStripe, async (req, res) => {
  try {
    const { customerId, amountCents, orderId, currency = 'cad' } = req.body;
    if (!customerId || amountCents == null || !orderId) {
      return res.status(400).json({ error: 'customerId, amountCents, and orderId are required' });
    }
    const amount = Math.max(50, Math.round(Number(amountCents)));
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      metadata: { hajime_order_id: String(orderId) },
    });
    const cs = paymentIntent.client_secret;
    if (!cs) {
      return res.status(500).json({ error: 'Stripe did not return a client secret.' });
    }
    res.json({ clientSecret: cs });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: stripeErrorMessage(e) });
  }
});

app.post('/api/stripe/charge-saved-card', requireStripe, async (req, res) => {
  try {
    const { customerId, amountCents, orderId, currency = 'cad' } = req.body;
    if (!customerId || amountCents == null || !orderId) {
      return res.status(400).json({ error: 'customerId, amountCents, and orderId are required' });
    }
    const amount = Math.max(50, Math.round(Number(amountCents)));
    const list = await stripe.paymentMethods.list({ customer: customerId, type: 'card' });
    if (!list.data.length) {
      return res.status(400).json({ error: 'No saved card on this customer.' });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      payment_method: list.data[0].id,
      off_session: true,
      confirm: true,
      metadata: { hajime_order_id: String(orderId) },
    });
    if (paymentIntent.status === 'succeeded') {
      return res.json({ status: 'succeeded', paymentIntentId: paymentIntent.id });
    }
    if (paymentIntent.status === 'requires_action') {
      return res.status(402).json({
        error: 'requires_action',
        clientSecret: paymentIntent.client_secret,
        message: 'Customer must authenticate. Use Pay with card instead.',
      });
    }
    res.status(400).json({ status: paymentIntent.status, error: 'Payment not completed' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: stripeErrorMessage(e) });
  }
});

app.get('/api/stripe/payment-methods/:customerId', requireStripe, async (req, res) => {
  try {
    const { customerId } = req.params;
    const list = await stripe.paymentMethods.list({ customer: customerId, type: 'card' });
    const cards = list.data.map((pm) => ({
      id: pm.id,
      last4: pm.card?.last4,
      brand: pm.card?.brand,
    }));
    res.json({ cards });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: stripeErrorMessage(e) });
  }
});

// ===== PRODUCTION STATIC FILES =====
const DIST_DIR = path.join(__dirname, '..', 'dist');
const ONE_YEAR = '365d';
if (fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  app.use(
    '/assets',
    express.static(path.join(DIST_DIR, 'assets'), {
      immutable: true,
      maxAge: ONE_YEAR,
      etag: false,
      lastModified: false,
    })
  );
  app.use(
    express.static(DIST_DIR, {
      etag: true,
      lastModified: true,
      setHeaders(res, filePath) {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, must-revalidate');
        }
      },
    })
  );
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/api')) return next();
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

// ===== ERROR HANDLER =====
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ===== START SERVER =====
app.listen(PORT, '0.0.0.0', () => {
  const mode = fs.existsSync(path.join(DIST_DIR, 'index.html')) ? 'api+static' : 'api';
  console.log(`[hajime-api] http://0.0.0.0:${PORT} (${mode})`);
  console.log(`[hajime-api] Stripe: ${stripe ? 'ready' : 'disabled'}`);
  console.log(`[hajime-api] Features: Auth=${FEATURE_FLAG_AUTH_ENABLED}, CSV=${FEATURE_FLAG_CSV_ENABLED}`);
  console.log(`[hajime-api] Migration Stage: ${dataMigrationService.stage}`);
});
