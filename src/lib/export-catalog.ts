/**
 * Map HQ product-catalog SKUs ↔ export commercial codes for international orders.
 * Keep in sync with server/lib/export-catalog-map.mjs.
 */

import type { Product } from "@/data/mockData";
import {
  EXPORT_SKUS,
  listFobCaseUsd,
  type ExportSkuCode,
} from "@/lib/export-commercial";

/**
 * SKUs distributors can order internationally right now.
 * Second Bloom / Yuzu is off until cost is confirmed (same rule as expo booth).
 */
export const INTERNATIONAL_ORDER_SKUS = ["first_press_750", "first_press_200"] as const satisfies readonly ExportSkuCode[];

const OFFERED = new Set<string>(INTERNATIONAL_ORDER_SKUS);

/** Explicit catalog SKU → export code (First Press only for portal order entry). */
export const CATALOG_TO_EXPORT_SKU: Record<string, ExportSkuCode> = {
  "HJM-FCR-750": "first_press_750",
  "HJM-FP-750": "first_press_750",
  "EU-FP-750": "first_press_750",
  "HAJIME-750": "first_press_750",
  "HJM-FCR-200": "first_press_200",
  "HJM-FP-200": "first_press_200",
  "EU-FP-200": "first_press_200",
};

const EXPORT_CODES = new Set(EXPORT_SKUS.map((s) => s.sku));

function sizeToken(raw: string | undefined): string {
  const s = String(raw ?? "")
    .toLowerCase()
    .replace(/\s+/g, "");
  if (s.includes("200")) return "200";
  if (s.includes("750")) return "750";
  const m = String(raw ?? "").match(/(\d{3})\s*ml/i);
  if (m) return m[1];
  return "";
}

export function catalogSkuToExportCode(
  sku: string,
  hint?: { name?: string; size?: string },
): ExportSkuCode | null {
  const raw = String(sku ?? "").trim();
  if (!raw) return null;
  // Legacy export codes (incl. Yuzu) still resolve for existing files / HQ edits.
  if (EXPORT_CODES.has(raw as ExportSkuCode)) return raw as ExportSkuCode;

  const upper = raw.toUpperCase();
  if (CATALOG_TO_EXPORT_SKU[upper]) return CATALOG_TO_EXPORT_SKU[upper];
  if (CATALOG_TO_EXPORT_SKU[raw]) return CATALOG_TO_EXPORT_SKU[raw];

  const blob = `${raw} ${hint?.name ?? ""} ${hint?.size ?? ""}`.toLowerCase();
  // Do not map Yuzu catalog SKUs into new portal offers.
  if (/yuzu|second\s*bloom|hjm-yz|hjm-yuzu/.test(blob)) return null;

  const size =
    sizeToken(hint?.size || raw) ||
    (blob.includes("200") ? "200" : blob.includes("750") ? "750" : "");
  const isFirst = /first\s*press|coffee\s*rhum|hjm-fcr|hjm-fp|eu-fp|hajime-750|fcr/.test(blob);

  if (isFirst && size === "200") return "first_press_200";
  if (isFirst && (size === "750" || !size)) return "first_press_750";
  return null;
}

export type InternationalOrderSkuRow = {
  /** Catalog SKU when from HQ catalog; otherwise export code. */
  catalogSku: string;
  /** Export commercial code used on create. */
  exportSku: ExportSkuCode;
  label: string;
  size: string;
  bottlesPerCase: number;
  /** USD case price = FOB/bottle × bottles (negotiated FOB when set, else list FOB). */
  caseListUsd: number;
  /** FOB USD per bottle used to derive caseListUsd. */
  fobPerBottle?: number;
  /** True when FOB came from HQ negotiated partner sell-in. */
  negotiated?: boolean;
};

export type NegotiatedCaseByCatalogOrExport = Record<string, number>;

/**
 * Effective case USD for an international order line.
 * Negotiated partner field = FOB USD / bottle → case = FOB × bottles/case.
 * Line total on the order = case × cases = FOB × bottles × cases.
 */
export function caseUsdForInternationalSku(
  exportSku: ExportSkuCode,
  catalogSku: string,
  negotiatedBySku?: NegotiatedCaseByCatalogOrExport | null,
): { caseUsd: number; negotiated: boolean; fobPerBottle: number } {
  const map = negotiatedBySku || {};
  const meta = EXPORT_SKUS.find((s) => s.sku === exportSku);
  const bottles = Math.max(1, meta?.bottlesPerCase ?? 12);
  const fromNeg =
    Number(map[catalogSku]) > 0
      ? Number(map[catalogSku])
      : Number(map[exportSku]) > 0
        ? Number(map[exportSku])
        : null;
  if (fromNeg != null && fromNeg > 0) {
    const caseUsd = Math.round(fromNeg * bottles * 100) / 100;
    return { caseUsd, negotiated: true, fobPerBottle: fromNeg };
  }
  const fobPerBottle = meta?.listFobUsd ?? 0;
  return { caseUsd: listFobCaseUsd(exportSku), negotiated: false, fobPerBottle };
}

/**
 * Active catalog products that map to an export commercial SKU.
 * Case price = distributor negotiated sell-in USD when provided, else list FOB.
 */
export function internationalOrderRowsFromCatalog(
  products: Product[],
  negotiatedBySku?: NegotiatedCaseByCatalogOrExport | null,
): InternationalOrderSkuRow[] {
  const rows: InternationalOrderSkuRow[] = [];
  const seenExport = new Set<string>();

  for (const p of products) {
    if (p.status && p.status !== "active") continue;
    const exportSku = catalogSkuToExportCode(p.sku, { name: p.name, size: p.size });
    if (!exportSku || !OFFERED.has(exportSku)) continue;
    if (seenExport.has(exportSku)) continue;
    seenExport.add(exportSku);

    const meta = EXPORT_SKUS.find((s) => s.sku === exportSku)!;
    const bottlesPerCase = Math.max(1, meta.bottlesPerCase);
    const { caseUsd, negotiated, fobPerBottle } = caseUsdForInternationalSku(
      exportSku,
      p.sku,
      negotiatedBySku,
    );

    rows.push({
      catalogSku: p.sku,
      exportSku,
      label: p.name?.replace(/^Hajime\s+/i, "") || meta.product.replace(/^Hajime\s+/i, ""),
      size: meta.size,
      bottlesPerCase,
      caseListUsd: caseUsd,
      negotiated,
      fobPerBottle,
    });
  }

  return rows.sort((a, b) => a.exportSku.localeCompare(b.exportSku));
}

/** Fallback when catalog is empty — First Press only (matches expo offer). */
export function internationalOrderRowsFallback(
  negotiatedBySku?: NegotiatedCaseByCatalogOrExport | null,
): InternationalOrderSkuRow[] {
  return EXPORT_SKUS.filter((s) => OFFERED.has(s.sku)).map((s) => {
    const { caseUsd, negotiated, fobPerBottle } = caseUsdForInternationalSku(
      s.sku,
      s.sku,
      negotiatedBySku,
    );
    return {
      catalogSku: s.sku,
      exportSku: s.sku,
      label: s.product.replace(/^Hajime\s+/i, ""),
      size: s.size,
      bottlesPerCase: s.bottlesPerCase,
      caseListUsd: caseUsd,
      negotiated,
      fobPerBottle,
    };
  });
}
