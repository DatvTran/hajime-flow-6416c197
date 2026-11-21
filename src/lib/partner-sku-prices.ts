import type { Product } from "@/data/mockData";
import type { PartnerPricingSettings, PartnerSkuPriceRow } from "@/lib/api-v1";
import { partnerSellInCasePrice, partnerSellOutCasePrice } from "@/lib/hq-product-catalog";

export type PriceDirection = "sell_in" | "sell_out";

export const SELL_OUT_CURRENCIES = ["CAD", "USD", "EUR", "GBP", "HKD", "JPY", "AUD", "SGD"] as const;
export type SellOutCurrency = (typeof SELL_OUT_CURRENCIES)[number];

export function partnerPriceBySku(
  rows: PartnerSkuPriceRow[] | null | undefined,
  sku: string,
): PartnerSkuPriceRow | undefined {
  const key = String(sku || "").trim();
  if (!key || !rows?.length) return undefined;
  return rows.find((r) => String(r.sku) === key);
}

/** Map market / country labels on route orders to ISO 4217 sell-out currency. */
export function currencyForMarket(market: string | null | undefined): SellOutCurrency | null {
  const m = String(market || "").trim().toLowerCase();
  if (!m) return null;
  if (/\bhong\s*kong\b|\bhk\b|香港|hkd\b/.test(m)) return "HKD";
  if (/\bjapan\b|東京|tokyo|osaka|jpy\b|¥/.test(m)) return "JPY";
  if (/\bsingapore\b|sgd\b/.test(m)) return "SGD";
  if (/\baustralia\b|\bsydney\b|\bmelbourne\b|aud\b/.test(m)) return "AUD";
  if (/\bunited\s*kingdom\b|\bbritain\b|\blondon\b|gbp\b|£/.test(m)) return "GBP";
  if (/\beurope\b|\beu\b|\bfrance\b|\bgermany\b|\bitaly\b|\bmilan\b|\bparis\b|eur\b|€/.test(m)) return "EUR";
  if (
    /\bcanada\b|\bontario\b|\bquebec\b|\bbritish columbia\b|\btoronto\b|\bvancouver\b|\bmontreal\b|cad\b/
      .test(m)
  ) {
    return "CAD";
  }
  if (/\bunited\s*states\b|\busa\b|\bu\.s\.\b|\bnew york\b|usd\b/.test(m)) return "USD";
  if (/\bthailand\b|\bbangkok\b|thb\b/.test(m)) return "USD"; // export sell-in stays USD; local THB not in partner sheet
  return null;
}

export function effectiveUsdToLocalRate(settings?: PartnerPricingSettings | null): number | null {
  const currency = String(settings?.sellOutCurrency || "CAD").toUpperCase();
  if (currency === "USD") return 1;
  const rate = Number(settings?.usdToLocalRate);
  return Number.isFinite(rate) && rate > 0 ? rate : null;
}

export function toLocal(usd: number | null | undefined, rate: number | null | undefined): number | null {
  const u = Number(usd);
  const r = Number(rate);
  if (!Number.isFinite(u) || !Number.isFinite(r) || u < 0 || r <= 0) return null;
  return Math.round(u * r * 100) / 100;
}

export function purchaseCostLocal(
  sellInUsd: number | null | undefined,
  settings?: PartnerPricingSettings | null,
): number | null {
  return toLocal(sellInUsd, effectiveUsdToLocalRate(settings));
}

/**
 * Resolve case price for New Order / replenishment.
 * Sell-in is always USD. Sell-out uses the partner/country currency; catalog USD
 * fallbacks convert via FX when a rate is set.
 */
export function resolvePartnerCasePrice(opts: {
  direction: PriceDirection;
  product: Product | null | undefined;
  partnerRow?: PartnerSkuPriceRow | null;
  settings?: PartnerPricingSettings | null;
  /** Optional market/region from the order form — fills currency when settings omit it. */
  market?: string | null;
}): { casePrice: number; source: string; currency: string } {
  const { direction, product, partnerRow, settings, market } = opts;
  if (direction === "sell_in") {
    const casePrice = partnerSellInCasePrice(
      product,
      partnerRow?.sellInCasePriceUsd ?? partnerRow?.sellInCasePrice,
    );
    const source =
      partnerRow?.sellInCasePrice != null && Number(partnerRow.sellInCasePrice) > 0
        ? "negotiated_sell_in"
        : casePrice > 0
          ? "catalog_list_sell_in"
          : "none";
    return { casePrice, source, currency: "USD" };
  }

  const marketCurrency = currencyForMarket(market);
  const localCurrency = String(
    marketCurrency || settings?.sellOutCurrency || partnerRow?.currency || "CAD",
  ).toUpperCase();
  const hasPartnerSellOut = partnerRow?.sellOutCasePrice != null && Number(partnerRow.sellOutCasePrice) > 0;
  const rawCase = partnerSellOutCasePrice(product, partnerRow?.sellOutCasePrice);
  const source = hasPartnerSellOut
    ? "partner_sell_out"
    : Number(product?.distributorSellOutCasePrice) > 0
      ? "catalog_suggested_sell_out"
      : rawCase > 0
        ? "catalog_list_sell_in"
        : "none";

  // Partner-entered sell-out is already in local currency.
  if (hasPartnerSellOut) {
    return { casePrice: rawCase, source, currency: localCurrency };
  }

  // Catalog fallbacks are USD — convert when FX is available for the local currency.
  if (localCurrency === "USD") {
    return { casePrice: rawCase, source, currency: "USD" };
  }
  const rate =
    String(settings?.sellOutCurrency || "").toUpperCase() === localCurrency
      ? effectiveUsdToLocalRate(settings)
      : null;
  const converted = toLocal(rawCase, rate);
  if (converted != null) {
    return { casePrice: converted, source, currency: localCurrency };
  }
  // Prefer showing the country currency even before FX is configured; amount stays catalog USD until rate exists.
  if (marketCurrency) {
    return { casePrice: rawCase, source, currency: marketCurrency };
  }
  return { casePrice: rawCase, source, currency: localCurrency };
}

export function priceSourceLabel(source: string, opts?: { forSalesRep?: boolean }): string {
  switch (source) {
    case "negotiated_sell_in":
      return "negotiated sell-in";
    case "partner_sell_out":
      return opts?.forSalesRep ? "distributor sell-out" : "your sell-out";
    case "catalog_suggested_sell_out":
      return "catalog suggested sell-out";
    case "catalog_list_sell_in":
      return "catalog list sell-in";
    default:
      return "catalog";
  }
}

/** Net order value after an optional percent discount (0–100). */
export function netFromListAndDiscountPct(listTotal: number, discountPct: number): number {
  const list = Number(listTotal);
  if (!Number.isFinite(list) || list < 0) return 0;
  const pct = Number(discountPct);
  const clamped = Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) : 0;
  return Math.round(list * (1 - clamped / 100) * 100) / 100;
}
