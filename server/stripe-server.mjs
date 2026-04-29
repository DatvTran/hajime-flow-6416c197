/**
 * Hajime API — Stripe + persisted app data (inventory, orders, catalog, etc.).
 * - STRIPE_SECRET_KEY in server/.env (never in Vite).
 * - App state: GET/PUT /api/app → server/data/app-state.json (seeded from src/data/seed-app.json).
 * Legacy runtime (JSON persistence path).
 * Refuses startup by default; for local debugging only set ALLOW_LEGACY_JSON_RUNTIME=true.
 */
import express from "express";
import cors from "cors";
import Stripe from "stripe";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { readAppState, writeAppState } from "./app-store.mjs";

const legacyStartupAllowed = process.env.HAJIME_ALLOW_UNSAFE_LEGACY_SERVER === "true";
if (!legacyStartupAllowed) {
  console.error(
    "[DEPRECATED] stripe-server.mjs startup refused. This legacy entrypoint is dev-only and unsafe. Use `node index.mjs` instead. " +
      "If you explicitly need legacy debugging, set HAJIME_ALLOW_UNSAFE_LEGACY_SERVER=true and rerun.",
  );
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });


const allowLegacyRuntime = process.env.ALLOW_LEGACY_JSON_RUNTIME === "true";
const isProduction = process.env.NODE_ENV === "production";
if (!allowLegacyRuntime || isProduction) {
  console.error(
    "[stripe-server] Legacy JSON runtime is disabled. Use `node index.mjs` / `npm start`. " +
      "For local development only, set ALLOW_LEGACY_JSON_RUNTIME=true with NODE_ENV not set to production.",
  );
  process.exit(1);
}

const PORT = Number(process.env.PORT) || 4242;

/** Comma-separated list of browser origins allowed to call this API (e.g. https://drinkhajime.jp). Required for production; localhost is always allowed. */
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);
const DATA_DIR = path.join(__dirname, "data");
const CUSTOMER_MAP_FILE = path.join(DATA_DIR, "stripe-customers.json");

const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
if (!secretKey) {
  console.warn("[stripe-server] Missing STRIPE_SECRET_KEY in server/.env — API will return 503.");
}

const stripe = secretKey ? new Stripe(secretKey) : null;

/** Stripe SDK errors often put the API message on `raw.message` or `raw.error.message`. */
function stripeErrorMessage(e) {
  if (typeof e === "string") return e;
  const raw = e?.raw;
  if (raw && typeof raw === "object") {
    if (typeof raw.message === "string" && raw.message.length > 0) return raw.message;
    const nested = raw.error;
    if (nested && typeof nested === "object" && typeof nested.message === "string") return nested.message;
  }
  if (typeof e?.message === "string" && e.message.length > 0) return e.message;
  return "Stripe error";
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readCustomerMap() {
  ensureDataDir();
  if (!fs.existsSync(CUSTOMER_MAP_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(CUSTOMER_MAP_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeCustomerMap(map) {
  ensureDataDir();
  fs.writeFileSync(CUSTOMER_MAP_FILE, JSON.stringify(map, null, 2), "utf8");
}

const app = express();
app.set("trust proxy", 1);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      const o = origin.replace(/\/$/, "");
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o)) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(o)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "2mb" }));

/** Persisted application data (inventory, orders, catalog, etc.) — see GET/PUT /api/app */
app.get("/api/app", (_req, res) => {
  try {
    res.json(readAppState());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e?.message ?? e) });
  }
});

app.put("/api/app", (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== "object") {
      return res.status(400).json({ error: "Expected JSON object" });
    }
    const required = ["products", "inventory", "accounts", "salesOrders", "purchaseOrders", "shipments", "productionStatuses"];
    for (const k of required) {
      if (!Array.isArray(body[k])) {
        return res.status(400).json({ error: `Missing or invalid array: ${k}` });
      }
    }
    writeAppState(body);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e?.message ?? e) });
  }
});

function requireStripe(_req, res, next) {
  if (!stripe) {
    return res.status(503).json({
      error: "Stripe is not configured. Add STRIPE_SECRET_KEY to server/.env and restart the API.",
    });
  }
  next();
}

/** Create or reuse Stripe Customer per B2B account key (e.g. trading name). */
app.post("/api/stripe/customer", requireStripe, async (req, res) => {
  try {
    const { accountKey, email, name } = req.body;
    if (!accountKey || !email) {
      return res.status(400).json({ error: "accountKey and email are required" });
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

/** Hosted Checkout (setup mode) — send link to customer; they save card on Stripe and return to your app. */
app.post("/api/stripe/checkout-setup-session", requireStripe, async (req, res) => {
  try {
    const { customerId, accountKey, origin } = req.body;
    if (!customerId || !accountKey || !origin) {
      return res.status(400).json({ error: "customerId, accountKey, and origin are required (origin = window.location.origin)" });
    }
    const base = String(origin).replace(/\/$/, "");
    const session = await stripe.checkout.sessions.create({
      mode: "setup",
      customer: customerId,
      payment_method_types: ["card"],
      metadata: { hajime_account_key: String(accountKey) },
      success_url: `${base}/orders?stripe_setup=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/orders?stripe_setup=cancel`,
    });
    if (!session.url) {
      return res.status(500).json({ error: "Stripe did not return a Checkout URL." });
    }
    res.json({ url: session.url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: stripeErrorMessage(e) });
  }
});

/** After redirect from Checkout setup — confirm session and map back to Hajime account. */
app.get("/api/stripe/checkout-session-status", requireStripe, async (req, res) => {
  try {
    const sessionId = req.query.session_id;
    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ error: "session_id query parameter is required" });
    }
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["setup_intent"],
    });
    const setupIntentId = session.setup_intent;
    let setupStatus = null;
    if (typeof setupIntentId === "string") {
      const si = await stripe.setupIntents.retrieve(setupIntentId);
      setupStatus = si.status;
    } else if (setupIntentId && typeof setupIntentId === "object") {
      setupStatus = setupIntentId.status;
    }
    const ok = session.status === "complete" && setupStatus === "succeeded";
    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
    const accountKey = session.metadata?.hajime_account_key ?? "";
    res.json({
      ok,
      customerId: customerId || "",
      accountKey,
      setupStatus: setupStatus || "",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: stripeErrorMessage(e) });
  }
});

/** Save a card on the customer (Stripe Elements SetupIntent). */
app.post("/api/stripe/setup-intent", requireStripe, async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId) return res.status(400).json({ error: "customerId required" });
    // Payment Element expects automatic_payment_methods; do not mix with payment_method_types.
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      usage: "off_session",
    });
    const clientSecret = setupIntent.client_secret;
    if (!clientSecret) {
      return res.status(500).json({ error: "Stripe did not return a client secret for this setup intent." });
    }
    res.json({ clientSecret });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: stripeErrorMessage(e) });
  }
});

/** Pay an order with Stripe Elements (customer can complete authentication if needed). */
app.post("/api/stripe/payment-intent", requireStripe, async (req, res) => {
  try {
    const { customerId, amountCents, orderId, currency = "cad" } = req.body;
    if (!customerId || amountCents == null || !orderId) {
      return res.status(400).json({ error: "customerId, amountCents, and orderId are required" });
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
      return res.status(500).json({ error: "Stripe did not return a client secret for this payment intent." });
    }
    res.json({ clientSecret: cs });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: stripeErrorMessage(e) });
  }
});

/** Charge the customer's first saved card off-session (may require customer action — see error). */
app.post("/api/stripe/charge-saved-card", requireStripe, async (req, res) => {
  try {
    const { customerId, amountCents, orderId, currency = "cad" } = req.body;
    if (!customerId || amountCents == null || !orderId) {
      return res.status(400).json({ error: "customerId, amountCents, and orderId are required" });
    }
    const amount = Math.max(50, Math.round(Number(amountCents)));
    const list = await stripe.paymentMethods.list({ customer: customerId, type: "card" });
    if (!list.data.length) {
      return res.status(400).json({ error: "No saved card on this customer. Use Save card or Pay with card first." });
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
    if (paymentIntent.status === "succeeded") {
      return res.json({ status: "succeeded", paymentIntentId: paymentIntent.id });
    }
    if (paymentIntent.status === "requires_action") {
      return res.status(402).json({
        error: "requires_action",
        clientSecret: paymentIntent.client_secret,
        message: "Customer must authenticate. Use Pay with card (embedded) instead.",
      });
    }
    res.status(400).json({ status: paymentIntent.status, error: "Payment not completed" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: stripeErrorMessage(e) });
  }
});

/** Last4 for each saved card (for UI sync). */
app.get("/api/stripe/payment-methods/:customerId", requireStripe, async (req, res) => {
  try {
    const { customerId } = req.params;
    const list = await stripe.paymentMethods.list({ customer: customerId, type: "card" });
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

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, stripe: Boolean(stripe), appData: true });
});

/** Production: Vite build at ../dist (Docker / same host as API). Local dev has no dist → API only. */
const DIST_DIR = path.join(__dirname, "..", "dist");
if (fs.existsSync(path.join(DIST_DIR, "index.html"))) {
  app.use(express.static(DIST_DIR));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(DIST_DIR, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  const mode = fs.existsSync(path.join(DIST_DIR, "index.html")) ? "api+static" : "api";
  console.log(`[hajime-api] http://0.0.0.0:${PORT} (${mode}) — Stripe (${stripe ? "ready" : "disabled"})`);
});
