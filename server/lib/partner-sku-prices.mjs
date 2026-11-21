import { asJsonObject } from "./export-orders.mjs";
import { platformDb } from "../config/database.mjs";
import { resolveDistributorUserIdForSalesRep } from "./distributor-scope.mjs";

export const SELL_OUT_CURRENCIES = ["CAD", "USD", "EUR", "GBP", "HKD", "JPY", "AUD", "SGD"];

let tableReady = null;
let settingsReady = null;

export function ensurePartnerSkuPricesTable(db) {
  if (!tableReady) {
    tableReady = import("../migrations/059_partner_sku_prices.mjs")
      .then((m) => m.up(db))
      .catch((err) => {
        tableReady = null;
        console.error("[partner-sku-prices] ensure table failed:", err);
        throw err;
      });
  }
  return tableReady;
}

export function ensurePartnerPricingSettingsTable(db) {
  if (!settingsReady) {
    settingsReady = import("../migrations/060_partner_pricing_currency.mjs")
      .then((m) => m.up(db))
      .catch((err) => {
        settingsReady = null;
        console.error("[partner-pricing-settings] ensure table failed:", err);
        throw err;
      });
  }
  return settingsReady;
}

export async function ensurePartnerPricingTables(db) {
  await ensurePartnerSkuPricesTable(db);
  await ensurePartnerPricingSettingsTable(db);
}

function money(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

function rateMoney(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 1e6) / 1e6 : null;
}

export function normalizeSellOutCurrency(raw) {
  const c = String(raw || "CAD").trim().toUpperCase();
  return SELL_OUT_CURRENCIES.includes(c) ? c : "CAD";
}

/** Effective FX: local units per 1 USD. USD → 1; missing rate with non-USD → null. */
export function effectiveUsdToLocalRate(settings) {
  const currency = normalizeSellOutCurrency(settings?.sellOutCurrency ?? settings?.sell_out_currency);
  if (currency === "USD") return 1;
  const rate = rateMoney(settings?.usdToLocalRate ?? settings?.usd_to_local_rate);
  return rate;
}

export function toLocal(usd, rate) {
  const u = money(usd);
  const r = rateMoney(rate);
  if (u == null || r == null) return null;
  return Math.round(u * r * 100) / 100;
}

export function purchaseCostLocal(sellInUsd, settings) {
  const rate = effectiveUsdToLocalRate(settings);
  if (rate == null) return null;
  return toLocal(sellInUsd, rate);
}

export function serializePricingSettings(row) {
  const sellOutCurrency = normalizeSellOutCurrency(row?.sell_out_currency ?? row?.sellOutCurrency);
  const usdToLocalRate =
    sellOutCurrency === "USD" ? 1 : rateMoney(row?.usd_to_local_rate ?? row?.usdToLocalRate);
  return {
    sellOutCurrency,
    usdToLocalRate,
    sellInCurrency: "USD",
  };
}

export function catalogListSellIn(product) {
  const meta = asJsonObject(product?.metadata) || {};
  const n = Number(meta.wholesaleCasePrice ?? meta.wholesalePriceCase ?? product?.wholesale_case_price ?? 0);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function catalogSuggestedSellOut(product) {
  const meta = asJsonObject(product?.metadata) || {};
  const n = Number(meta.distributorSellOutCasePrice ?? 0);
  if (Number.isFinite(n) && n > 0) return n;
  return catalogListSellIn(product);
}

export async function getPartnerPricingSettings(db, tenantId, accountId) {
  await ensurePartnerPricingTables(db);
  const row = await db("partner_pricing_settings")
    .where({ tenant_id: tenantId, account_id: String(accountId) })
    .first();
  return serializePricingSettings(row || { sell_out_currency: "CAD", usd_to_local_rate: null });
}

/**
 * Upsert FX settings. Throws Error with status-like message for invalid rate.
 */
export async function upsertPartnerPricingSettings(db, tenantId, accountId, patch) {
  await ensurePartnerPricingTables(db);
  const aid = String(accountId);
  const sellOutCurrency = normalizeSellOutCurrency(
    patch?.sellOutCurrency ?? patch?.sell_out_currency ?? "CAD",
  );
  let usdToLocalRate = rateMoney(patch?.usdToLocalRate ?? patch?.usd_to_local_rate);
  if (sellOutCurrency === "USD") {
    usdToLocalRate = 1;
  } else if (usdToLocalRate == null) {
    const err = new Error("usdToLocalRate must be a number greater than 0 when sell-out currency is not USD.");
    err.status = 400;
    throw err;
  }

  const existing = await db("partner_pricing_settings")
    .where({ tenant_id: tenantId, account_id: aid })
    .first();
  if (existing) {
    const [updated] = await db("partner_pricing_settings")
      .where({ id: existing.id })
      .update({
        sell_out_currency: sellOutCurrency,
        usd_to_local_rate: usdToLocalRate,
        updated_at: db.fn.now(),
      })
      .returning("*");
    return serializePricingSettings(updated);
  }
  const [inserted] = await db("partner_pricing_settings")
    .insert({
      tenant_id: tenantId,
      account_id: aid,
      sell_out_currency: sellOutCurrency,
      usd_to_local_rate: usdToLocalRate,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning("*");
  return serializePricingSettings(inserted);
}

export async function listPartnerSkuPrices(db, tenantId, accountId) {
  await ensurePartnerPricingTables(db);
  return db("partner_sku_prices")
    .where({ tenant_id: tenantId, account_id: String(accountId) })
    .select(
      "sku",
      "sell_in_case_price",
      "sell_out_case_price",
      "currency",
      "updated_at",
    );
}

/**
 * Upsert rows. HQ may set sell_in (USD); partner may set sell_out (local).
 * `fields` is "sell_in" | "sell_out" | "both".
 * Optional `sellOutCurrency` stamps row.currency on sell_out writes.
 */
export async function upsertPartnerSkuPrices(db, tenantId, accountId, rows, fields = "both", sellOutCurrency = null) {
  await ensurePartnerPricingTables(db);
  const aid = String(accountId);
  const currency =
    sellOutCurrency != null ? normalizeSellOutCurrency(sellOutCurrency) : null;
  const out = [];
  for (const row of rows || []) {
    const sku = String(row?.sku || "").trim();
    if (!sku) continue;
    const patch = { updated_at: db.fn.now() };
    if (fields === "sell_in" || fields === "both") {
      if ("sellInCasePrice" in (row || {}) || "sell_in_case_price" in (row || {})) {
        patch.sell_in_case_price = money(row.sellInCasePrice ?? row.sell_in_case_price);
      }
    }
    if (fields === "sell_out" || fields === "both") {
      if ("sellOutCasePrice" in (row || {}) || "sell_out_case_price" in (row || {})) {
        patch.sell_out_case_price = money(row.sellOutCasePrice ?? row.sell_out_case_price);
      }
      if (currency) patch.currency = currency;
    }
    if (Object.keys(patch).length <= 1) continue;

    const existing = await db("partner_sku_prices")
      .where({ tenant_id: tenantId, account_id: aid, sku })
      .first();
    if (existing) {
      const [updated] = await db("partner_sku_prices")
        .where({ id: existing.id })
        .update(patch)
        .returning("*");
      out.push(updated);
    } else {
      const [inserted] = await db("partner_sku_prices")
        .insert({
          tenant_id: tenantId,
          account_id: aid,
          sku,
          currency: currency || "CAD",
          sell_in_case_price: patch.sell_in_case_price ?? null,
          sell_out_case_price: patch.sell_out_case_price ?? null,
          created_at: db.fn.now(),
          updated_at: db.fn.now(),
        })
        .returning("*");
      out.push(inserted);
    }
  }
  return out;
}

export function resolveCasePrice({ direction, partnerRow, product }) {
  if (direction === "sell_in") {
    const negotiated = money(partnerRow?.sell_in_case_price ?? partnerRow?.sellInCasePrice ?? partnerRow?.sellInCasePriceUsd);
    if (negotiated != null && negotiated > 0) return { casePrice: negotiated, source: "negotiated_sell_in", currency: "USD" };
    const list = catalogListSellIn(product);
    if (list != null) return { casePrice: list, source: "catalog_list_sell_in", currency: "USD" };
    return { casePrice: 0, source: "none", currency: "USD" };
  }
  const own = money(partnerRow?.sell_out_case_price ?? partnerRow?.sellOutCasePrice);
  const sellOutCurrency = normalizeSellOutCurrency(partnerRow?.currency);
  if (own != null && own > 0) {
    return { casePrice: own, source: "partner_sell_out", currency: sellOutCurrency };
  }
  const suggested = catalogSuggestedSellOut(product);
  if (suggested != null) {
    return { casePrice: suggested, source: "catalog_suggested_sell_out", currency: "USD" };
  }
  return { casePrice: 0, source: "none", currency: sellOutCurrency };
}

/** Map user → wholesale account id they may price as a distributor (or sales rep under one). */
export async function resolveWholesaleAccountIdForUser(db, tenantId, user) {
  const email = String(user?.email || "").trim().toLowerCase();
  const role = String(user?.role || "").trim();

  if (email) {
    const tm = await db("team_members")
      .where({ tenant_id: tenantId, role: "distributor" })
      .whereRaw("lower(email) = ?", [email])
      .whereNotNull("linked_account_id")
      .first();
    if (tm?.linked_account_id) return String(tm.linked_account_id);

    const account = await db("accounts")
      .where({ tenant_id: tenantId, type: "distributor" })
      .whereNull("deleted_at")
      .where(function () {
        this.whereRaw("lower(email) = ?", [email]).orWhereRaw("lower(portal_login_email) = ?", [email]);
      })
      .first();
    if (account?.id != null) return String(account.id);
  }

  if (role === "sales_rep" || role === "sales") {
    try {
      const distUserId = await resolveDistributorUserIdForSalesRep(db, tenantId, user);
      if (distUserId != null) {
        const distUser = await platformDb("users")
          .where({ id: distUserId, tenant_id: tenantId })
          .whereNull("deleted_at")
          .first();
        const distEmail = String(distUser?.email || "").trim().toLowerCase();
        if (distEmail) {
          const parentTm = await db("team_members")
            .where({ tenant_id: tenantId, role: "distributor" })
            .whereRaw("lower(email) = ?", [distEmail])
            .whereNotNull("linked_account_id")
            .first();
          if (parentTm?.linked_account_id) return String(parentTm.linked_account_id);

          const parentAcc = await db("accounts")
            .where({ tenant_id: tenantId, type: "distributor" })
            .whereNull("deleted_at")
            .where(function () {
              this.whereRaw("lower(email) = ?", [distEmail]).orWhereRaw(
                "lower(portal_login_email) = ?",
                [distEmail],
              );
            })
            .first();
          if (parentAcc?.id != null) return String(parentAcc.id);
        }

        // Fallback: single distributor-type account in tenant when email link is missing
        // but the rep is clearly managed by this wholesaler user.
        const distAccounts = await db("accounts")
          .where({ tenant_id: tenantId, type: "distributor" })
          .whereNull("deleted_at")
          .select("id");
        if (distAccounts.length === 1 && distAccounts[0]?.id != null) {
          return String(distAccounts[0].id);
        }
      }
    } catch (err) {
      console.warn("[partner-sku-prices] sales_rep wholesale resolve failed:", err?.message || err);
    }
  }

  return null;
}

export function serializePartnerPriceRow(row, product, settings = null) {
  const list = catalogListSellIn(product);
  const suggested = catalogSuggestedSellOut(product);
  const sellIn = money(row?.sell_in_case_price);
  const sellOut = money(row?.sell_out_case_price);
  const settingsSer = serializePricingSettings(settings || {
    sell_out_currency: row?.currency || "CAD",
    usd_to_local_rate: null,
  });
  const sellOutCurrency = settingsSer.sellOutCurrency;
  const rate = effectiveUsdToLocalRate(settingsSer);
  const effectiveSellIn = sellIn != null && sellIn > 0 ? sellIn : list;
  return {
    sku: String(row?.sku || product?.sku || ""),
    name: product?.name || null,
    caseSize: Number(asJsonObject(product?.metadata)?.caseSize ?? 12) || 12,
    sellInCasePrice: sellIn,
    sellInCasePriceUsd: sellIn,
    sellOutCasePrice: sellOut,
    listSellInCasePrice: list,
    suggestedSellOutCasePrice: suggested,
    purchaseCostLocal: purchaseCostLocal(effectiveSellIn, settingsSer),
    currency: sellOutCurrency,
    sellInCurrency: "USD",
    sellInSource: sellIn != null && sellIn > 0 ? "negotiated" : "list_default",
    sellOutSource: sellOut != null && sellOut > 0 ? "partner" : "catalog_suggestion",
    usdToLocalRate: rate,
    updatedAt: row?.updated_at ?? null,
  };
}

export async function buildPartnerSkuPriceSheet(db, tenantId, accountId) {
  await ensurePartnerPricingTables(db);
  const settings = await getPartnerPricingSettings(db, tenantId, accountId);
  const products = await db("products")
    .where({ tenant_id: tenantId })
    .whereNull("deleted_at")
    .select("id", "sku", "name", "unit_size", "metadata");
  const rows = await listPartnerSkuPrices(db, tenantId, accountId);
  const bySku = new Map(rows.map((r) => [String(r.sku), r]));
  const data = products
    .filter((p) => String(p.sku || "").trim())
    .map((p) => serializePartnerPriceRow(bySku.get(String(p.sku)), p, settings))
    .sort((a, b) => a.sku.localeCompare(b.sku));
  return { data, settings, accountId: String(accountId) };
}
