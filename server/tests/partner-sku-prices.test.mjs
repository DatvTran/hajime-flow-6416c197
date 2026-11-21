import test from "node:test";
import assert from "node:assert/strict";
import {
  catalogListSellIn,
  catalogSuggestedSellOut,
  purchaseCostLocal,
  resolveCasePrice,
  serializePartnerPriceRow,
  toLocal,
  upsertPartnerPricingSettings,
  upsertPartnerSkuPrices,
} from "../lib/partner-sku-prices.mjs";
import { memoryDb } from "./_memory-db.mjs";

const product = {
  sku: "EU-FP-750",
  name: "First Press",
  metadata: {
    caseSize: 12,
    wholesaleCasePrice: 576,
    distributorSellOutCasePrice: 720,
  },
};

test("catalog helpers read list sell-in and suggested sell-out", () => {
  assert.equal(catalogListSellIn(product), 576);
  assert.equal(catalogSuggestedSellOut(product), 720);
  assert.equal(catalogSuggestedSellOut({ metadata: { wholesaleCasePrice: 100 } }), 100);
});

test("sell-in prefers negotiated then catalog list (USD)", () => {
  assert.deepEqual(
    resolveCasePrice({
      direction: "sell_in",
      partnerRow: { sell_in_case_price: 500 },
      product,
    }),
    { casePrice: 500, source: "negotiated_sell_in", currency: "USD" },
  );
  assert.deepEqual(
    resolveCasePrice({ direction: "sell_in", partnerRow: null, product }),
    { casePrice: 576, source: "catalog_list_sell_in", currency: "USD" },
  );
});

test("sell-out prefers partner then catalog suggestion then list", () => {
  assert.deepEqual(
    resolveCasePrice({
      direction: "sell_out",
      partnerRow: { sell_out_case_price: 800, currency: "CAD" },
      product,
    }),
    { casePrice: 800, source: "partner_sell_out", currency: "CAD" },
  );
  assert.deepEqual(
    resolveCasePrice({ direction: "sell_out", partnerRow: {}, product }),
    { casePrice: 720, source: "catalog_suggested_sell_out", currency: "USD" },
  );
  assert.deepEqual(
    resolveCasePrice({
      direction: "sell_out",
      partnerRow: null,
      product: { metadata: { wholesaleCasePrice: 400 } },
    }),
    { casePrice: 400, source: "catalog_suggested_sell_out", currency: "USD" },
  );
});

test("FX converts purchase cost local = sell-in USD × rate", () => {
  assert.equal(toLocal(501, 1.37), 686.37);
  assert.equal(
    purchaseCostLocal(501, { sellOutCurrency: "CAD", usdToLocalRate: 1.37 }),
    686.37,
  );
  assert.equal(purchaseCostLocal(501, { sellOutCurrency: "USD", usdToLocalRate: null }), 501);
  assert.equal(purchaseCostLocal(501, { sellOutCurrency: "HKD", usdToLocalRate: null }), null);
});

test("serialize includes purchaseCostLocal with settings", () => {
  const unset = serializePartnerPriceRow(null, product, {
    sell_out_currency: "CAD",
    usd_to_local_rate: 1.37,
  });
  assert.equal(unset.sellInSource, "list_default");
  assert.equal(unset.listSellInCasePrice, 576);
  assert.equal(unset.sellInCurrency, "USD");
  assert.equal(unset.purchaseCostLocal, toLocal(576, 1.37));

  const set = serializePartnerPriceRow(
    { sku: "EU-FP-750", sell_in_case_price: 510, sell_out_case_price: 790, currency: "CAD" },
    product,
    { sellOutCurrency: "CAD", usdToLocalRate: 1.37 },
  );
  assert.equal(set.sellInSource, "negotiated");
  assert.equal(set.sellOutSource, "partner");
  assert.equal(set.sellInCasePriceUsd, 510);
  assert.equal(set.purchaseCostLocal, toLocal(510, 1.37));
});

test("upsert writes sell-in only when fields=sell_in (HQ)", async () => {
  const tables = { partner_sku_prices: [], partner_pricing_settings: [] };
  const db = memoryDb(tables);
  db.schema.createTable = async () => {};
  db.schema.hasTable = async () => true;

  await upsertPartnerSkuPrices(
    db,
    "tenant-1",
    "21",
    [{ sku: "EU-FP-750", sellInCasePrice: 510, sellOutCasePrice: 999 }],
    "sell_in",
  );
  assert.equal(tables.partner_sku_prices.length, 1);
  assert.equal(Number(tables.partner_sku_prices[0].sell_in_case_price), 510);
  assert.equal(tables.partner_sku_prices[0].sell_out_case_price, null);

  await upsertPartnerSkuPrices(
    db,
    "tenant-1",
    "21",
    [{ sku: "EU-FP-750", sellOutCasePrice: 790 }],
    "sell_out",
    "CAD",
  );
  assert.equal(tables.partner_sku_prices.length, 1);
  assert.equal(Number(tables.partner_sku_prices[0].sell_out_case_price), 790);
  assert.equal(Number(tables.partner_sku_prices[0].sell_in_case_price), 510);
  assert.equal(tables.partner_sku_prices[0].currency, "CAD");
});

test("two partners keep independent sell-in and FX settings", async () => {
  const tables = { partner_sku_prices: [], partner_pricing_settings: [] };
  const db = memoryDb(tables);
  db.schema.createTable = async () => {};
  db.schema.hasTable = async () => true;

  await upsertPartnerSkuPrices(db, "t", "21", [{ sku: "EU-FP-750", sellInCasePrice: 501 }], "sell_in");
  await upsertPartnerSkuPrices(db, "t", "24", [{ sku: "EU-FP-750", sellInCasePrice: 501 }], "sell_in");

  const s21 = await upsertPartnerPricingSettings(db, "t", "21", {
    sellOutCurrency: "CAD",
    usdToLocalRate: 1.37,
  });
  const s24 = await upsertPartnerPricingSettings(db, "t", "24", {
    sellOutCurrency: "HKD",
    usdToLocalRate: 7.8,
  });
  assert.equal(s21.sellOutCurrency, "CAD");
  assert.equal(s24.sellOutCurrency, "HKD");
  assert.equal(purchaseCostLocal(501, s21), toLocal(501, 1.37));
  assert.equal(purchaseCostLocal(501, s24), toLocal(501, 7.8));
  assert.notEqual(purchaseCostLocal(501, s21), purchaseCostLocal(501, s24));

  // Changing FX does not alter USD sell-in
  const a = tables.partner_sku_prices.find((r) => r.account_id === "21");
  assert.equal(Number(a.sell_in_case_price), 501);
});
