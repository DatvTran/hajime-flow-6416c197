/**
 * FOB USD price resolution. CAD domestic waterfall stays in client hajime-trade-pricing.
 */
import { priceExportLines } from "../lib/export-orders.mjs";

export function assertAboveFloor(resolved, offeredCasePrice, exception) {
  if (resolved.internalFloorCase == null) return { ok: true };
  if (offeredCasePrice + 1e-9 >= resolved.internalFloorCase) return { ok: true };
  if (exception?.kind === "below_floor_approved") {
    return { ok: true, basis: "exception", exception };
  }
  return {
    ok: false,
    code: "BELOW_INTERNAL_FLOOR",
    shortfall: Number((resolved.internalFloorCase - offeredCasePrice).toFixed(2)),
  };
}

export async function resolvePrice({ tenantId, sku, unitSize, cases, at = new Date(), trx }) {
  if (!(await trx.schema.hasTable("price_lists"))) {
    return fallbackPrice(sku, cases);
  }
  const list = await trx("price_lists")
    .where({ tenant_id: tenantId, status: "active" })
    .where("effective_from", "<=", at)
    .where((q) => q.whereNull("effective_to").orWhere("effective_to", ">=", at))
    .orderByRaw("CASE WHEN market IS NULL THEN 1 ELSE 0 END, effective_from DESC")
    .first();
  if (!list) return fallbackPrice(sku, cases);

  const tiers = await trx("pricing_tiers")
    .where({ tenant_id: tenantId, price_list_id: list.id })
    .orderBy("min_cases", "asc");
  const byVolume = [...tiers].reverse().find((t) => cases >= t.min_cases) ?? tiers[0];
  if (!byVolume) return fallbackPrice(sku, cases);

  const size = unitSize || inferSize(sku);
  const entry = await trx("price_list_entries")
    .where({
      tenant_id: tenantId,
      price_list_id: list.id,
      sku,
      unit_size: size,
      tier_code: byVolume.code,
    })
    .first();
  if (!entry) return fallbackPrice(sku, cases);

  return {
    ok: true,
    currency: list.currency,
    priceListId: list.id,
    tier: { code: byVolume.code, label: byVolume.label },
    casePrice: Number(entry.case_price),
    unitPrice: Number(entry.unit_price),
    internalFloorCase: entry.internal_floor_case == null ? null : Number(entry.internal_floor_case),
  };
}

function inferSize(sku) {
  return String(sku).includes("200") ? "200 ml" : "750 ml";
}

function fallbackPrice(sku, cases) {
  const priced = priceExportLines([{ sku, cases }]);
  const line = priced.lines[0];
  if (!line) return { ok: false, code: "NO_PRICE_FOR_SKU", sku };
  return {
    ok: true,
    currency: "USD",
    priceListId: null,
    tier: { code: cases >= 250 ? "strategic" : cases >= 100 ? "standard" : "trial" },
    casePrice: line.caseUsd,
    unitPrice: line.unitFobUsd,
    internalFloorCase: line.floorFobUsd * line.bottlesPerCase,
  };
}

export async function assertLinesAboveFloor(trx, tenantId, lines, exception) {
  const priced = priceExportLines(lines);
  for (const line of priced.lines) {
    const resolved = await resolvePrice({
      tenantId,
      sku: line.sku,
      unitSize: line.size,
      cases: line.cases,
      trx,
    });
    if (!resolved.ok) return resolved;
    const check = assertAboveFloor(resolved, line.caseUsd, exception);
    if (!check.ok) return { ...check, sku: line.sku };
  }
  return { ok: true, priced };
}
