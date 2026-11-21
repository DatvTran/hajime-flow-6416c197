/**
 * Map HQ product-catalog SKUs ↔ export commercial codes (first_press_750, …).
 * International orders store export codes so capacity / docs stay consistent.
 */

/** Portal / expo offer — Second Bloom off until cost confirmed. */
export const INTERNATIONAL_ORDER_SKUS = Object.freeze(["first_press_750", "first_press_200"]);

/** Explicit catalog SKU → export code (First Press only for new portal orders). */
export const CATALOG_TO_EXPORT_SKU = Object.freeze({
  "HJM-FCR-750": "first_press_750",
  "HJM-FP-750": "first_press_750",
  "EU-FP-750": "first_press_750",
  "HAJIME-750": "first_press_750",
  "HJM-FCR-200": "first_press_200",
  "HJM-FP-200": "first_press_200",
  "EU-FP-200": "first_press_200",
});

const EXPORT_CODES = new Set([
  "first_press_750",
  "yuzu_mint_750",
  "first_press_200",
  "yuzu_mint_200",
]);

const OFFERED = new Set(INTERNATIONAL_ORDER_SKUS);

function sizeToken(raw) {
  const s = String(raw ?? "").toLowerCase().replace(/\s+/g, "");
  if (s.includes("200")) return "200";
  if (s.includes("750")) return "750";
  const m = String(raw ?? "").match(/(\d{3})\s*ml/i);
  if (m) return m[1];
  return "";
}

/**
 * @param {string} sku
 * @param {{ name?: string, size?: string, unit_size?: string, unitSize?: string }} [hint]
 * @returns {string|null} export code or null
 */
export function catalogSkuToExportCode(sku, hint = {}) {
  const raw = String(sku ?? "").trim();
  if (!raw) return null;
  // Legacy export codes (incl. Yuzu) still resolve for existing files / HQ edits.
  if (EXPORT_CODES.has(raw)) return raw;

  const upper = raw.toUpperCase();
  if (CATALOG_TO_EXPORT_SKU[upper]) return CATALOG_TO_EXPORT_SKU[upper];
  if (CATALOG_TO_EXPORT_SKU[raw]) return CATALOG_TO_EXPORT_SKU[raw];

  const blob = `${raw} ${hint.name ?? ""} ${hint.size ?? ""} ${hint.unit_size ?? ""} ${hint.unitSize ?? ""}`.toLowerCase();
  if (/yuzu|second\s*bloom|hjm-yz|hjm-yuzu/.test(blob)) return null;

  const size = sizeToken(hint.size || hint.unit_size || hint.unitSize || raw) || (blob.includes("200") ? "200" : blob.includes("750") ? "750" : "");
  const isFirst =
    /first\s*press|coffee\s*rhum|hjm-fcr|hjm-fp|eu-fp|hajime-750|fcr/.test(blob);

  if (isFirst && size === "200") return "first_press_200";
  if (isFirst && (size === "750" || !size)) return "first_press_750";
  return null;
}

/**
 * Normalize a raw order line sku to an export code when possible.
 * @param {string} sku
 * @param {object} [hint]
 * @param {{ portalOfferOnly?: boolean }} [opts]
 * @returns {string|null}
 */
export function normalizeExportLineSku(sku, hint, opts = {}) {
  const mapped = catalogSkuToExportCode(sku, hint);
  const raw = mapped || String(sku ?? "").trim();
  if (!raw) return null;
  if (opts.portalOfferOnly && !OFFERED.has(raw)) return null;
  return EXPORT_CODES.has(raw) ? raw : mapped;
}
