import { describe, expect, it } from "vitest";
import type { Product } from "@/data/mockData";
import type { PartnerSkuPriceRow } from "@/lib/api-v1";
import { partnerSellInCasePrice, partnerSellOutCasePrice } from "@/lib/hq-product-catalog";
import {
  currencyForMarket,
  netFromListAndDiscountPct,
  purchaseCostLocal,
  resolvePartnerCasePrice,
  toLocal,
} from "@/lib/partner-sku-prices";

const product = {
  sku: "EU-FP-750",
  name: "First Press",
  size: "750ml",
  caseSize: 12,
  status: "active",
  wholesaleCasePrice: 576,
  distributorSellOutCasePrice: 720,
} as Product;

const partnerRow = {
  sku: "EU-FP-750",
  name: "First Press",
  caseSize: 12,
  sellInCasePrice: 510,
  sellOutCasePrice: 800,
  listSellInCasePrice: 576,
  suggestedSellOutCasePrice: 720,
  currency: "CAD",
  sellInSource: "negotiated",
  sellOutSource: "partner",
  updatedAt: null,
} as PartnerSkuPriceRow;

describe("partner sell-out auto-price", () => {
  it("prefers partner sell-out over catalog in local currency", () => {
    expect(partnerSellOutCasePrice(product, 800)).toBe(800);
    const resolved = resolvePartnerCasePrice({
      direction: "sell_out",
      product,
      partnerRow,
      settings: { sellOutCurrency: "CAD", usdToLocalRate: 1.37, sellInCurrency: "USD" },
    });
    expect(resolved.casePrice).toBe(800);
    expect(resolved.source).toBe("partner_sell_out");
    expect(resolved.currency).toBe("CAD");
  });

  it("falls back to catalog suggested sell-out in the partner/country currency", () => {
    expect(partnerSellOutCasePrice(product, null)).toBe(720);
    const resolved = resolvePartnerCasePrice({
      direction: "sell_out",
      product,
      partnerRow: { ...partnerRow, sellOutCasePrice: null, sellOutSource: "catalog_suggestion" },
      settings: { sellOutCurrency: "CAD", usdToLocalRate: 1.37, sellInCurrency: "USD" },
    });
    expect(resolved.source).toBe("catalog_suggested_sell_out");
    expect(resolved.currency).toBe("CAD");
    expect(resolved.casePrice).toBe(986.4);
  });

  it("uses Hong Kong market currency for route sell-out", () => {
    expect(currencyForMarket("Hong Kong")).toBe("HKD");
    const resolved = resolvePartnerCasePrice({
      direction: "sell_out",
      product,
      partnerRow: { ...partnerRow, sellOutCasePrice: null, currency: "CAD", sellOutSource: "catalog_suggestion" },
      settings: { sellOutCurrency: "HKD", usdToLocalRate: 7.8, sellInCurrency: "USD" },
      market: "Hong Kong",
    });
    expect(resolved.currency).toBe("HKD");
    expect(resolved.casePrice).toBe(5616);
  });

  it("falls back to list sell-in when no suggested sell-out", () => {
    const bare = { ...product, distributorSellOutCasePrice: undefined } as Product;
    expect(partnerSellOutCasePrice(bare)).toBe(576);
  });
});

describe("partner sell-in", () => {
  it("prefers negotiated sell-in then catalog list in USD", () => {
    expect(partnerSellInCasePrice(product, 510)).toBe(510);
    expect(partnerSellInCasePrice(product, null)).toBe(576);
    const resolved = resolvePartnerCasePrice({ direction: "sell_in", product, partnerRow });
    expect(resolved.source).toBe("negotiated_sell_in");
    expect(resolved.currency).toBe("USD");
  });
});

describe("FX conversion", () => {
  it("converts USD purchase to local cost", () => {
    expect(toLocal(501, 1.37)).toBe(686.37);
    expect(
      purchaseCostLocal(501, { sellOutCurrency: "CAD", usdToLocalRate: 1.37, sellInCurrency: "USD" }),
    ).toBe(686.37);
    expect(
      purchaseCostLocal(501, { sellOutCurrency: "HKD", usdToLocalRate: 7.8, sellInCurrency: "USD" }),
    ).toBe(3907.8);
  });
});

describe("netFromListAndDiscountPct", () => {
  it("applies percent discount and clamps", () => {
    expect(netFromListAndDiscountPct(1000, 10)).toBe(900);
    expect(netFromListAndDiscountPct(800, 0)).toBe(800);
    expect(netFromListAndDiscountPct(500, 100)).toBe(0);
    expect(netFromListAndDiscountPct(500, -5)).toBe(500);
    expect(netFromListAndDiscountPct(500, 150)).toBe(0);
  });
});
