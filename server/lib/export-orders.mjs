import { orderTotals } from "./po-acceptance.mjs";

const STAGE_IDS = [
  "01_lead",
  "02_quotation",
  "03_buyer_po",
  "04_po_acceptance",
  "05_proforma",
  "06_deposit",
  "07_production_auth",
  "08_freight",
  "09_export_docs",
  "10_ready_to_ship",
  "11_balance",
  "12_shipment_release",
  "13_fob_handover",
  "14_closing",
  "15_closeout",
];

export const DEFAULT_EXPORT_CHECKLIST = [
  { key: "buyer_po", label: "Buyer PO", owner: "Hajime / Buyer", kind: "core" },
  { key: "quote_acceptance", label: "Quotation / PO acceptance", owner: "Hajime", kind: "core" },
  { key: "proforma", label: "Pro forma invoice", owner: "Hajime", kind: "core" },
  { key: "deposit", label: "Deposit", owner: "Hajime", kind: "core" },
  { key: "production_auth", label: "Production authorization", owner: "Hajime", kind: "core" },
  { key: "commercial_invoice", label: "Commercial invoice", owner: "Hajime / exporter", kind: "core" },
  { key: "packing_list", label: "Packing list", owner: "Manufacturer", kind: "core" },
  { key: "pallet_config", label: "Case & pallet configuration", owner: "Manufacturer", kind: "optional" },
  { key: "batch_lot", label: "Batch / lot", owner: "Manufacturer", kind: "optional" },
  { key: "forwarder_booking", label: "Forwarder booking", owner: "Buyer / Forwarder", kind: "optional" },
  { key: "transport_doc", label: "Bill of lading / AWB", owner: "Forwarder / Carrier", kind: "optional" },
  { key: "coo", label: "Certificate of origin", owner: "Exporter", kind: "optional" },
  { key: "abv_analysis", label: "ABV / product analysis", owner: "Manufacturer / lab", kind: "optional" },
  { key: "ingredient", label: "Ingredient / allergen statement", owner: "Manufacturer", kind: "optional" },
  { key: "health_cert", label: "Health / free-sale certificate", owner: "Issuing party", kind: "optional" },
  { key: "export_declaration", label: "Thai export declaration", owner: "Thailand exporter", kind: "optional" },
  { key: "import_permit", label: "Destination import permit", owner: "Buyer / importer", kind: "optional" },
  { key: "insurance", label: "Cargo insurance", owner: "Buyer / insurer", kind: "optional" },
  { key: "shipment_release", label: "Shipment release", owner: "Hajime", kind: "optional" },
];

const CORE_EXPORT_CHECKLIST = DEFAULT_EXPORT_CHECKLIST.filter((r) => r.kind === "core");

export function canManageExportOrders(role) {
  return role === "founder_admin" || role === "brand_operator" || role === "operations";
}

export function isManufacturer(role) {
  return role === "manufacturer";
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

/** Keep in sync with EXPORT_SKUS in src/lib/export-commercial.ts. List FOB stored per bottle; orders priced per case. */
export const SKUS = {
  first_press_750: { product: "Hajime First Press Coffee Rhum Liqueur", size: "750 ml", bottlesPerCase: 12, floorFobUsd: 34, listFobUsd: 34.1 },
  yuzu_mint_750: { product: "Hajime Yuzu Mint Rhum Liqueur", size: "750 ml", bottlesPerCase: 12, floorFobUsd: 28, listFobUsd: 32 },
  first_press_200: { product: "Hajime First Press Coffee Rhum Liqueur", size: "200 ml", bottlesPerCase: 24, floorFobUsd: 16, listFobUsd: 16 },
  yuzu_mint_200: { product: "Hajime Yuzu Mint Rhum Liqueur", size: "200 ml", bottlesPerCase: 24, floorFobUsd: 16, listFobUsd: 18 },
};

function cases750Total(lines) {
  return lines.reduce((n, l) => {
    const m = SKUS[l.sku];
    if (!m || m.size !== "750 ml") return n;
    return n + Math.max(0, Number(l.cases) || 0);
  }, 0);
}

export function priceExportLines(rawLines) {
  const lines = Array.isArray(rawLines) ? rawLines : [];
  const normalized = [];
  for (const l of lines) {
    const sku = String(l.sku || "");
    if (!SKUS[sku]) continue;
    const cases = Math.max(0, Math.floor(Number(l.cases) || 0));
    if (cases <= 0) continue;
    const caseOverride = l.caseUsd != null ? Number(l.caseUsd) : NaN;
    normalized.push({
      sku,
      cases,
      unitFobUsd: l.unitFobUsd != null ? Number(l.unitFobUsd) : undefined,
      caseUsd: Number.isFinite(caseOverride) && caseOverride > 0 ? caseOverride : undefined,
    });
  }
  const c750 = cases750Total(normalized);
  const priced = [];
  for (const l of normalized) {
    const m = SKUS[l.sku];
    // Prefer explicit case USD (negotiated sell-in) so 20/case stays 20 — not 19.92 from rounded unit.
    let caseUsd;
    let unit;
    if (l.caseUsd != null && Number.isFinite(l.caseUsd) && l.caseUsd > 0) {
      caseUsd = round2(l.caseUsd);
      unit = caseUsd / m.bottlesPerCase;
    } else {
      unit = l.unitFobUsd != null && Number.isFinite(l.unitFobUsd) ? l.unitFobUsd : m.listFobUsd;
      caseUsd = round2(unit * m.bottlesPerCase);
    }
    priced.push({
      sku: l.sku,
      product: m.product,
      size: m.size,
      cases: l.cases,
      bottlesPerCase: m.bottlesPerCase,
      totalBottles: l.cases * m.bottlesPerCase,
      unitFobUsd: round2(unit),
      caseUsd,
      lineTotalUsd: round2(caseUsd * l.cases),
      floorFobUsd: m.floorFobUsd,
      belowFloor: unit + 1e-9 < m.floorFobUsd,
    });
  }
  const subtotalUsd = round2(priced.reduce((s, x) => s + x.lineTotalUsd, 0));
  const depositDueUsd = round2(subtotalUsd * 0.5);
  return {
    lines: priced,
    subtotalUsd,
    depositDueUsd,
    balanceDueUsd: round2(subtotalUsd - depositDueUsd),
    cases750: c750,
    belowFloor: priced.some((x) => x.belowFloor),
  };
}

function stageIndex(id) {
  const i = STAGE_IDS.indexOf(id);
  return i < 0 ? 0 : i;
}

export function gateAdvance({ from, to, depositStatus, balanceStatus, checklistCleared, fobNamedPoint }) {
  const fromI = stageIndex(from);
  const toI = stageIndex(to);
  if (toI < fromI) return { ok: true };
  if (toI >= stageIndex("07_production_auth") && depositStatus !== "cleared" && depositStatus !== "exception") {
    return {
      ok: false,
      error: "Production may be authorized only after the deposit has cleared (or a written exception).",
    };
  }
  if (toI >= stageIndex("12_shipment_release")) {
    const money = balanceStatus === "cleared" || balanceStatus === "exception";
    const point = String(fobNamedPoint || "").trim();
    if (!money || !checklistCleared || !point) {
      return {
        ok: false,
        error:
          "Shipment release requires cleared final balance, export checklist cleared, and a confirmed FOB named port/terminal.",
      };
    }
  }
  return { ok: true };
}

export function defaultChecklistState() {
  const o = {};
  for (const row of DEFAULT_EXPORT_CHECKLIST) {
    o[row.key] = { status: row.kind === "optional" ? "na" : "required", notes: "" };
  }
  return o;
}

export function applyOrderStateToChecklist(checklist, order = {}) {
  const raw = asJsonObject(checklist);
  const next = { ...defaultChecklistState() };
  for (const row of DEFAULT_EXPORT_CHECKLIST) {
    const prev = raw[row.key] || {};
    let status = String(prev.status || (row.kind === "optional" ? "na" : "required"));
    if (row.kind === "optional" && status === "required") status = "na";
    next[row.key] = { notes: prev.notes || "", status };
  }
  const bump = (key, cond) => {
    if (!cond) return;
    if (String(next[key]?.status || "required") === "required") {
      next[key] = { ...next[key], status: "issued" };
    }
  };
  const si = stageIndex(String(order.stage || "01_lead"));
  bump("buyer_po", Boolean(String(order.buyer_po_no || order.buyerPoNo || "").trim()) || si >= stageIndex("03_buyer_po"));
  bump("quote_acceptance", si >= stageIndex("02_quotation"));
  bump("proforma", si >= stageIndex("05_proforma"));
  bump("deposit", order.deposit_status === "cleared" || order.depositStatus === "cleared" || order.deposit_status === "exception" || order.depositStatus === "exception");
  bump("production_auth", si >= stageIndex("07_production_auth"));
  bump("commercial_invoice", si >= stageIndex("11_balance"));
  bump("packing_list", si >= stageIndex("10_ready_to_ship"));
  bump("shipment_release", si >= stageIndex("12_shipment_release"));
  return next;
}

export function asJsonObject(v, fallback = {}) {
  if (v && typeof v === "object" && !Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      return p && typeof p === "object" && !Array.isArray(p) ? p : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function parseJsonLines(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Apply case USD (per export SKU). Missing SKUs keep list FOB.
 * Line total = caseUsd × cases = FOB/bottle × bottles/case × cases.
 */
export function applyNegotiatedCaseUsdToLines(rawLines, caseUsdByExportSku) {
  const map = caseUsdByExportSku instanceof Map ? caseUsdByExportSku : new Map(Object.entries(caseUsdByExportSku || {}));
  return (Array.isArray(rawLines) ? rawLines : [])
    .map((l) => {
      const sku = String(l?.sku || "");
      const m = SKUS[sku];
      if (!m) return null;
      const cases = Math.max(0, Math.floor(Number(l?.cases) || 0));
      if (cases <= 0) return null;
      const caseUsd = Number(map.get(sku));
      if (Number.isFinite(caseUsd) && caseUsd > 0) {
        const rounded = round2(caseUsd);
        return {
          sku,
          cases,
          caseUsd: rounded,
          unitFobUsd: rounded / m.bottlesPerCase,
        };
      }
      return { sku, cases };
    })
    .filter(Boolean);
}

/**
 * Partner negotiated field for export SKUs is FOB USD per bottle.
 * Case USD = FOB × bottles/case; order line = Case × cases.
 */
export function exportCaseUsdFromNegotiatedFobPerBottle(fobPerBottle, bottlesPerCase) {
  const unit = Number(fobPerBottle);
  const bpc = Math.max(1, Math.floor(Number(bottlesPerCase) || 0));
  if (!Number.isFinite(unit) || unit <= 0) return null;
  return round2(unit * bpc);
}

export function serializeExportOrder(
  row,
  { includeInternalEconomics = false, buyerFacing = false, manufacturerFacing = false } = {},
) {
  if (!row) return null;
  const rawLines = parseJsonLines(row.lines);
  // Prefer stored caseUsd / unitFobUsd (negotiated sell-in when set on portal create).
  const priced = priceExportLines(rawLines);
  let lines = includeInternalEconomics
    ? priced.lines
    : priced.lines.map(({ floorFobUsd, belowFloor, ...rest }) => rest);
  if (manufacturerFacing) {
    lines = lines.map(({ unitFobUsd, caseUsd, lineTotalUsd, floorFobUsd, belowFloor, ...rest }) => rest);
  }
  const totals = orderTotals(row.deposit_amount_frozen ? row.subtotal_usd : priced.subtotalUsd, row.other_charges_usd);
  const base = {
    id: String(row.id),
    displayId: row.display_id,
    seq: row.seq,
    quoteNo: row.quote_no,
    piNo: row.pi_no,
    depositNo: row.deposit_no,
    paNo: buyerFacing ? undefined : row.pa_no,
    releaseNo: row.release_no,
    expoLeadId: row.expo_lead_id != null ? String(row.expo_lead_id) : null,
    accountId: buyerFacing ? undefined : row.account_id != null ? String(row.account_id) : null,
    distributorOrgId: row.distributor_org_id != null ? String(row.distributor_org_id) : null,
    origin: row.origin === "portal" ? "portal" : "hq",
    buyerName: row.buyer_name,
    buyerCompany: row.buyer_company,
    buyerAddress: row.buyer_address,
    buyerEmail: row.buyer_email,
    territory: row.territory,
    destinationCountry: row.destination_country,
    buyerPoNo: row.buyer_po_no,
    stage: row.stage,
    lines,
    subtotalUsd: totals.subtotalUsd,
    otherChargesUsd: totals.otherChargesUsd,
    otherChargesNote: row.other_charges_note || null,
    totalOrderUsd: totals.totalOrderUsd,
    depositDueUsd: row.deposit_amount_frozen ? Number(row.deposit_due_usd) : totals.depositDueUsd,
    balanceDueUsd: row.deposit_amount_frozen ? Number(row.balance_due_usd) : totals.balanceDueUsd,
    depositFrozen: buyerFacing ? undefined : Boolean(row.deposit_amount_frozen),
    buyerLegalName: row.buyer_legal_name || null,
    buyerRegistrationNo: row.buyer_registration_no || null,
    buyerRegisteredAddress: row.buyer_registered_address || null,
    buyerNoticeEmail: row.buyer_notice_email || null,
    consignee: row.consignee || null,
    incotermRule: row.incoterm_rule || null,
    deliveryWindow: row.delivery_window || null,
    requestedMonth: row.requested_month || null,
    capacityReservedAt: buyerFacing ? undefined : row.capacity_reserved_at || null,
    specLabelRef: row.spec_label_ref || null,
    specialConditions: row.special_conditions || null,
    depositStatus: row.deposit_status,
    depositReceivedUsd: row.deposit_received_usd != null ? Number(row.deposit_received_usd) : null,
    wireFeesUsd: row.wire_fees_usd != null ? Number(row.wire_fees_usd) : null,
    depositRef: row.deposit_ref,
    depositValueDate: row.deposit_value_date,
    depositNotes: buyerFacing ? undefined : row.deposit_notes,
    balanceStatus: row.balance_status,
    balanceReceivedUsd: row.balance_received_usd != null ? Number(row.balance_received_usd) : null,
    balanceRef: row.balance_ref,
    manufacturerName: buyerFacing ? undefined : row.manufacturer_name,
    manufacturerId: buyerFacing ? undefined : row.manufacturer_id != null ? String(row.manufacturer_id) : null,
    requestedCompletion: buyerFacing ? undefined : row.requested_completion,
    productionSlot: buyerFacing ? undefined : row.production_slot,
    expectedCompletion: buyerFacing ? undefined : row.expected_completion,
    batchPlan: buyerFacing ? undefined : row.batch_plan,
    casesPerPallet: buyerFacing ? undefined : row.cases_per_pallet,
    estimatedPallets: buyerFacing ? undefined : row.estimated_pallets,
    estimatedGrossWeight: buyerFacing ? undefined : row.estimated_gross_weight,
    factoryContact: buyerFacing ? undefined : row.factory_contact,
    readyToShipOn: buyerFacing ? undefined : row.ready_to_ship_on,
    forwarderName: row.forwarder_name,
    forwarderInstructions: row.forwarder_instructions,
    fobNamedPoint: row.fob_named_point,
    plannedDeparture: row.planned_departure,
    checklist: buyerFacing ? undefined : asJsonObject(row.checklist),
    checklistCleared: buyerFacing ? undefined : Boolean(row.checklist_cleared),
    checklistOpenItems: buyerFacing ? undefined : row.checklist_open_items,
    exclusivity: false,
    productionPoId: row.production_po_id != null ? String(row.production_po_id) : null,
    shipmentId: row.shipment_id != null ? String(row.shipment_id) : null,
    nextAction: row.next_action || null,
    holdReason: row.hold_reason || null,
    notes: buyerFacing || manufacturerFacing ? undefined : row.notes,
    quoteValidUntil: row.quote_valid_until,
    issuedDocs: buyerFacing || manufacturerFacing ? undefined : asJsonObject(row.issued_docs),
    buyerDocStatus: buyerDocStatus(row),
    belowFloor: includeInternalEconomics && !manufacturerFacing ? priced.belowFloor : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (manufacturerFacing) {
    delete base.subtotalUsd;
    delete base.otherChargesUsd;
    delete base.otherChargesNote;
    delete base.totalOrderUsd;
    delete base.depositDueUsd;
    delete base.balanceDueUsd;
    delete base.depositReceivedUsd;
    delete base.wireFeesUsd;
    delete base.depositRef;
    delete base.balanceReceivedUsd;
    delete base.balanceRef;
    delete base.buyerEmail;
  }
  return base;
}

export const ISSUE_DOC_TO_CHECKLIST = {
  quotation: "quote_acceptance",
  po_acceptance: "quote_acceptance",
  proforma: "proforma",
  deposit: "deposit",
  production_auth: "production_auth",
  shipment_release: "shipment_release",
};

export function buyerDocStatus(row) {
  const issued = asJsonObject(row.issued_docs);
  const out = {};
  for (const doc of ["quotation", "buyer_po", "po_acceptance", "proforma", "deposit", "shipment_release"]) {
    out[doc] = issued[doc] ? { issuedAt: issued[doc].issuedAt || issued[doc].issued_at || null } : { issuedAt: null };
  }
  return out;
}

export function applyIssueToChecklist(checklist, docType) {
  const next = { ...defaultChecklistState(), ...asJsonObject(checklist) };
  const key = ISSUE_DOC_TO_CHECKLIST[docType];
  if (key) {
    next[key] = { ...(next[key] || {}), status: "issued", notes: next[key]?.notes || "" };
  }
  if (docType === "po_acceptance") {
    next.buyer_po = { ...(next.buyer_po || {}), status: "issued", notes: next.buyer_po?.notes || "" };
  }
  return next;
}

export function requiredChecklistReady(checklist, order = {}) {
  const state = applyOrderStateToChecklist(checklist, order);
  return CORE_EXPORT_CHECKLIST.every((row) => {
    const st = String(state[row.key]?.status || "required");
    return st === "complete" || st === "issued" || st === "na";
  });
}

export function isBuyerExportDoc(doc) {
  return ["quotation", "buyer_po", "po_acceptance", "proforma", "deposit", "shipment_release"].includes(String(doc));
}

export function distributorCanViewStage(stage) {
  return STAGE_IDS.indexOf(stage) >= STAGE_IDS.indexOf("02_quotation");
}

export function toBuyerFacingOrder(serialized) {
  if (!serialized) return null;
  const {
    paNo: _pa,
    accountId: _a,
    depositNotes: _dn,
    manufacturerName: _mn,
    manufacturerId: _mid,
    requestedCompletion: _rc,
    productionSlot: _ps,
    expectedCompletion: _ec,
    batchPlan: _bp,
    casesPerPallet: _cpp,
    estimatedPallets: _ep,
    estimatedGrossWeight: _eg,
    factoryContact: _fc,
    readyToShipOn: _rts,
    checklist: _c,
    checklistCleared: _cc,
    checklistOpenItems: _co,
    notes: _n,
    belowFloor: _bf,
    issuedDocs: _id,
    ...rest
  } = serialized;
  return { ...rest, exclusivity: false };
}

export async function ensureExportOrdersTable(db) {
  const has = await db.schema.hasTable("export_orders");
  if (!has) {
    try {
      const { up } = await import("../migrations/047_export_orders.mjs");
      await up(db);
    } catch (e) {
      console.error("[export-orders] ensure table failed:", e);
      return false;
    }
  }
  try {
    const m048 = await import("../migrations/048_export_orders_distributor_org.mjs");
    await m048.up(db);
  } catch (e) {
    console.error("[export-orders] ensure org/issued columns failed:", e);
  }
  try {
    const m049 = await import("../migrations/049_export_orders_origin.mjs");
    await m049.up(db);
  } catch (e) {
    console.error("[export-orders] ensure origin column failed:", e);
  }
  try {
    const m050 = await import("../migrations/050_export_order_spine.mjs");
    await m050.up(db);
  } catch (e) {
    console.error("[export-orders] ensure spine tables failed:", e);
  }
  try {
    const m051 = await import("../migrations/051_export_payments_pricing_rls.mjs");
    await m051.up(db);
  } catch (e) {
    console.error("[export-orders] ensure payments/pricing failed:", e);
  }
  try {
    const m053 = await import("../migrations/053_export_orders_manufacturer_id.mjs");
    await m053.up(db);
  } catch (e) {
    console.error("[export-orders] ensure manufacturer_id failed:", e);
  }
  try {
    const m057 = await import("../migrations/057_po_acceptance_esign.mjs");
    await m057.up(db);
  } catch (e) {
    console.error("[export-orders] ensure PO acceptance columns failed:", e);
  }
  try {
    const m058 = await import("../migrations/058_export_capacity_month.mjs");
    await m058.up(db);
  } catch (e) {
    console.error("[export-orders] ensure capacity month columns failed:", e);
  }
  return true;
}

export async function findExportOrder(db, tenantId, idOrDisplay) {
  const id = String(idOrDisplay || "").trim();
  if (!id) return null;
  return db("export_orders")
    .where({ tenant_id: tenantId })
    .andWhere((qb) => {
      qb.where("display_id", id);
      if (/^\d+$/.test(id)) qb.orWhere("id", Number(id));
    })
    .first();
}

/** Find by display id / numeric id without tenant scope (HQ recovery + portal org scope). */
export async function findExportOrderAnyTenant(db, idOrDisplay) {
  const id = String(idOrDisplay || "").trim();
  if (!id) return null;
  return db("export_orders")
    .andWhere((qb) => {
      qb.where("display_id", id);
      if (/^\d+$/.test(id)) qb.orWhere("id", Number(id));
    })
    .first();
}

/**
 * Hajime Ltd. export files always live on the Brand HQ platform tenant.
 * Distributor org DBs use a different tenant_id for CRM/inventory — never use that for export_orders.
 */
export async function resolveExportBrandTenantId(db, reqUser) {
  const envId = String(process.env.EXPORT_BRAND_TENANT_ID || process.env.PLATFORM_TENANT_ID || "").trim();
  if (envId) return envId;

  if (reqUser?.role && canManageExportOrders(reqUser.role) && reqUser.tenantId) {
    return String(reqUser.tenantId);
  }

  try {
    const { platformDb } = await import("../config/database.mjs");
    const hqUser = await platformDb("users")
      .whereIn("role", ["brand_operator", "founder_admin", "founder", "operations"])
      .where({ is_active: true })
      .whereNull("deleted_at")
      .orderBy("id", "asc")
      .first("tenant_id");
    if (hqUser?.tenant_id) return String(hqUser.tenant_id);
  } catch (err) {
    console.warn("[export-orders] brand tenant HQ user lookup failed:", err?.message || err);
  }

  const popular = await db("export_orders")
    .select("tenant_id")
    .count("* as c")
    .groupBy("tenant_id")
    .orderBy("c", "desc")
    .first();
  if (popular?.tenant_id) return String(popular.tenant_id);

  if (reqUser?.tenantId) return String(reqUser.tenantId);
  return null;
}

/** Move portal-origin rows onto the brand tenant so HQ list/detail can see them. */
export async function reconcilePortalExportOrdersToBrandTenant(db, brandTenantId) {
  if (!brandTenantId) return 0;
  const n = await db("export_orders")
    .where({ origin: "portal" })
    .whereNot("tenant_id", brandTenantId)
    .update({ tenant_id: brandTenantId, updated_at: db.fn.now() });
  return Number(n) || 0;
}

/**
 * Negotiated FOB case USD keyed by export SKU.
 * partner_sku_prices.sell_in_case_price for export SKUs = FOB USD per bottle;
 * case = FOB × bottles/case (not Canada catalog wholesale).
 */
export async function negotiatedSellInCaseByExportSku(db, tenantId, accountId) {
  if (!tenantId || !accountId) return new Map();
  const { catalogSkuToExportCode, INTERNATIONAL_ORDER_SKUS } = await import("./export-catalog-map.mjs");
  const { listPartnerSkuPrices, ensurePartnerPricingTables } = await import("./partner-sku-prices.mjs");
  await ensurePartnerPricingTables(db);
  const offered = new Set(INTERNATIONAL_ORDER_SKUS);
  const priceRows = await listPartnerSkuPrices(db, tenantId, accountId);
  const products = await db("products")
    .where({ tenant_id: tenantId })
    .whereNull("deleted_at")
    .select("sku", "name", "unit_size", "metadata");
  const bySku = new Map(priceRows.map((r) => [String(r.sku), r]));
  const out = new Map();
  const putFobBottle = (exportSku, fobPerBottle) => {
    const m = SKUS[exportSku];
    if (!m || out.has(exportSku)) return;
    const caseUsd = exportCaseUsdFromNegotiatedFobPerBottle(fobPerBottle, m.bottlesPerCase);
    if (caseUsd != null) out.set(exportSku, caseUsd);
  };
  for (const p of products) {
    const catalogSku = String(p.sku || "").trim();
    if (!catalogSku) continue;
    const exportSku = catalogSkuToExportCode(catalogSku, {
      name: p.name,
      size: p.unit_size || p.metadata?.size,
    });
    if (!exportSku || !offered.has(exportSku) || !SKUS[exportSku]) continue;
    const row = bySku.get(catalogSku);
    const negotiated = Number(row?.sell_in_case_price);
    if (!Number.isFinite(negotiated) || negotiated <= 0) continue;
    putFobBottle(exportSku, negotiated);
  }
  for (const r of priceRows) {
    const sku = String(r.sku || "").trim();
    if (!SKUS[sku] || !offered.has(sku)) continue;
    const negotiated = Number(r.sell_in_case_price);
    if (!Number.isFinite(negotiated) || negotiated <= 0) continue;
    putFobBottle(sku, negotiated);
  }
  return out;
}

/** Resolve brand-tenant wholesale account id for a portal distributor user / org. */
export async function resolvePortalWholesaleAccountId(db, brandTenantId, { user, distributorOrgId } = {}) {
  const { resolveWholesaleAccountIdForUser } = await import("./partner-sku-prices.mjs");
  if (user) {
    const fromUser = await resolveWholesaleAccountIdForUser(db, brandTenantId, user);
    if (fromUser) return fromUser;
    if (user.tenantId && String(user.tenantId) !== String(brandTenantId)) {
      const fromCrm = await resolveWholesaleAccountIdForUser(db, user.tenantId, user);
      if (fromCrm) return fromCrm;
    }
  }
  if (!distributorOrgId) return null;
  try {
    const { platformDb } = await import("../config/database.mjs");
    const org = await platformDb("distributor_organizations").where({ id: distributorOrgId }).first();
    if (!org?.owner_user_id) return null;
    const owner = await platformDb("users").where({ id: org.owner_user_id }).whereNull("deleted_at").first();
    if (!owner) return null;
    const ownerUser = {
      email: owner.email,
      role: "distributor",
      userId: owner.id,
      tenantId: owner.tenant_id || brandTenantId,
    };
    return (
      (await resolveWholesaleAccountIdForUser(db, brandTenantId, ownerUser)) ||
      (owner.tenant_id ? await resolveWholesaleAccountIdForUser(db, owner.tenant_id, ownerUser) : null)
    );
  } catch (err) {
    console.warn("[export-orders] wholesale account from org failed:", err?.message || err);
    return null;
  }
}

/**
 * Reprice portal quotations from that distributor's negotiated sell-in (case × cases).
 * Falls back to list FOB when unset. Drops Yuzu / zero-case. Safe while unfrozen quotation.
 */
export async function repricePortalQuotationsToListFob(db, brandTenantId = null) {
  const { INTERNATIONAL_ORDER_SKUS } = await import("./export-catalog-map.mjs");
  const offered = new Set(INTERNATIONAL_ORDER_SKUS);
  const rows = await db("export_orders")
    .where({ origin: "portal", stage: "02_quotation", deposit_status: "pending" })
    .where((qb) => {
      qb.whereNull("deposit_amount_frozen").orWhere("deposit_amount_frozen", false);
    })
    .select(
      "id",
      "tenant_id",
      "distributor_org_id",
      "lines",
      "subtotal_usd",
      "deposit_due_usd",
      "balance_due_usd",
    );
  let fixed = 0;
  const caseCache = new Map();
  for (const row of rows) {
    let raw = row.lines;
    if (typeof raw === "string") {
      try {
        raw = JSON.parse(raw);
      } catch {
        continue;
      }
    }
    if (!Array.isArray(raw) || !raw.length) continue;
    const cleaned = raw
      .map((l) => ({
        sku: String(l?.sku || ""),
        cases: Math.max(0, Math.floor(Number(l?.cases) || 0)),
      }))
      .filter((l) => offered.has(l.sku) && SKUS[l.sku] && l.cases > 0);
    if (!cleaned.length) continue;

    const tenantId = brandTenantId || row.tenant_id;
    const orgId = row.distributor_org_id != null ? String(row.distributor_org_id) : "";
    const cacheKey = `${tenantId}:${orgId}`;
    let caseMap = caseCache.get(cacheKey);
    if (!caseMap) {
      const accountId = await resolvePortalWholesaleAccountId(db, tenantId, {
        distributorOrgId: orgId || null,
      });
      caseMap = accountId ? await negotiatedSellInCaseByExportSku(db, tenantId, accountId) : new Map();
      if (caseMap.size === 0 && accountId && orgId) {
        try {
          const { platformDb } = await import("../config/database.mjs");
          const org = await platformDb("distributor_organizations").where({ id: orgId }).first();
          const owner = org?.owner_user_id
            ? await platformDb("users").where({ id: org.owner_user_id }).first()
            : null;
          if (owner?.tenant_id && String(owner.tenant_id) !== String(tenantId)) {
            caseMap = await negotiatedSellInCaseByExportSku(db, owner.tenant_id, accountId);
          }
        } catch {
          /* ignore */
        }
      }
      caseCache.set(cacheKey, caseMap || new Map());
      caseMap = caseCache.get(cacheKey);
    }

    const priced = priceExportLines(applyNegotiatedCaseUsdToLines(cleaned, caseMap));
    if (!priced.lines.length) continue;
    const subtotalOk = Math.abs(Number(row.subtotal_usd) - priced.subtotalUsd) < 0.02;
    const depositOk = Math.abs(Number(row.deposit_due_usd) - priced.depositDueUsd) < 0.02;
    const balanceOk = Math.abs(Number(row.balance_due_usd) - priced.balanceDueUsd) < 0.02;
    const casesOk = priced.lines.every((l) => {
      const expected = caseMap.get(l.sku);
      if (expected != null && expected > 0) return Math.abs(l.caseUsd - expected) < 0.02;
      const m = SKUS[l.sku];
      return m && Math.abs(l.caseUsd - round2(m.listFobUsd * m.bottlesPerCase)) < 0.02;
    });
    if (subtotalOk && depositOk && balanceOk && casesOk) continue;
    await db("export_orders")
      .where({ id: row.id })
      .update({
        lines: JSON.stringify(
          priced.lines.map((l) => ({
            sku: l.sku,
            cases: l.cases,
            unitFobUsd: l.unitFobUsd,
            caseUsd: l.caseUsd,
          })),
        ),
        subtotal_usd: priced.subtotalUsd,
        deposit_due_usd: priced.depositDueUsd,
        balance_due_usd: priced.balanceDueUsd,
        updated_at: db.fn.now(),
      });
    fixed += 1;
  }
  return fixed;
}

export async function nextSeq(db, tenantId) {
  const row = await db("export_orders").where({ tenant_id: tenantId }).max("seq as m").first();
  return Number(row?.m || 0) + 1;
}

export function padDoc(prefix, seq) {
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

export function isExportStageId(v) {
  return STAGE_IDS.includes(v);
}

export function isExportSku(v) {
  return Boolean(SKUS[v]);
}

/** Keep in sync with EXPORT_ORDER_SIZES[0] (trial) in src/lib/export-commercial.ts. */
export const TRIAL_ORDER_CASES = 40;

/** Keep in sync with isExportLead in src/lib/expo-leads.ts. */
export const EXPORT_LEAD_TYPES = ["importer", "importer_distributor", "wholesale", "duty_free"];

export function isExportLeadType(businessType) {
  return EXPORT_LEAD_TYPES.includes(String(businessType || ""));
}

/** SKUs offered at the expo (booth quotes and lead transfers). Second Bloom is off until its cost is confirmed. Keep in sync with ROWS in src/pages/HqExpoBoothPage.tsx. */
export const EXPO_SKUS = ["first_press_750", "first_press_200"];

/** Starting lines for a lead's export file: the expo SKUs in the sizes they picked, one trial order split evenly. */
export function leadStarterLines(lead) {
  const format = String(lead?.bottle_format ?? lead?.bottleFormat ?? "");
  const sizes = format === "both" ? ["750", "200"] : format === "200ml" ? ["200"] : ["750"];
  const skus = sizes.map((s) => `first_press_${s}`).filter((sku) => EXPO_SKUS.includes(sku));
  const base = Math.floor(TRIAL_ORDER_CASES / skus.length);
  const extra = TRIAL_ORDER_CASES - base * skus.length;
  return skus.map((sku, i) => ({ sku, cases: base + (i < extra ? 1 : 0) }));
}

export async function findLiveOrderForLead(db, tenantId, leadId) {
  return db("export_orders")
    .where({ tenant_id: tenantId, expo_lead_id: leadId })
    .whereNot("stage", "cancelled")
    .orderBy("created_at", "desc")
    .first();
}
