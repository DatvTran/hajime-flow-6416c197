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
  { key: "buyer_po", label: "Accepted buyer Purchase Order", owner: "Hajime / Buyer" },
  { key: "quote_acceptance", label: "Hajime quotation / PO acceptance", owner: "Hajime" },
  { key: "proforma", label: "Pro forma invoice", owner: "Hajime" },
  { key: "deposit", label: "Deposit confirmation", owner: "Hajime" },
  { key: "production_auth", label: "Production authorization", owner: "Hajime" },
  { key: "commercial_invoice", label: "Final commercial invoice", owner: "Hajime / exporter as legally required" },
  { key: "packing_list", label: "Packing list", owner: "Manufacturer / exporter" },
  { key: "pallet_config", label: "Final case & pallet configuration", owner: "Manufacturer" },
  { key: "batch_lot", label: "Batch / lot information", owner: "Manufacturer" },
  { key: "forwarder_booking", label: "Forwarder booking / shipping instructions", owner: "Buyer / Forwarder" },
  { key: "transport_doc", label: "Transport document (as applicable)", owner: "Forwarder / Carrier" },
  { key: "coo", label: "Certificate of origin (if required)", owner: "Exporter / authorized issuer" },
  { key: "abv_analysis", label: "Product / ABV analysis (if required)", owner: "Manufacturer / laboratory" },
  { key: "ingredient", label: "Ingredient / allergen statement (if required)", owner: "Manufacturer / Hajime" },
  { key: "health_cert", label: "Health / sanitary or free-sale certificate (if required)", owner: "Responsible issuing party" },
  { key: "export_declaration", label: "Export declaration / export permit (as required)", owner: "Thailand exporter / agent" },
  { key: "import_permit", label: "Destination import permit / product registration (if required)", owner: "Distributor / Importer" },
  { key: "insurance", label: "Insurance certificate (if buyer elects / requires)", owner: "Buyer / insurer" },
  { key: "shipment_release", label: "Shipment release authorization", owner: "Hajime" },
];

export function canManageExportOrders(role) {
  return role === "founder_admin" || role === "brand_operator" || role === "operations";
}

export function isManufacturer(role) {
  return role === "manufacturer";
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

const SKUS = {
  first_press_750: { product: "Hajime First Press Coffee Rhum Liqueur", size: "750 ml", bottlesPerCase: 12, floorFobUsd: 28, listFobUsd: 32 },
  yuzu_mint_750: { product: "Hajime Yuzu Mint Rhum Liqueur", size: "750 ml", bottlesPerCase: 12, floorFobUsd: 28, listFobUsd: 32 },
  first_press_200: { product: "Hajime First Press Coffee Rhum Liqueur", size: "200 ml", bottlesPerCase: 20, floorFobUsd: 16, listFobUsd: 18 },
  yuzu_mint_200: { product: "Hajime Yuzu Mint Rhum Liqueur", size: "200 ml", bottlesPerCase: 20, floorFobUsd: 16, listFobUsd: 18 },
};

function cases750Total(lines) {
  return lines.reduce((n, l) => {
    const m = SKUS[l.sku];
    if (!m || m.size !== "750 ml") return n;
    return n + Math.max(0, Number(l.cases) || 0);
  }, 0);
}

function suggestFob750(cases750) {
  if (cases750 >= 250) return 30;
  if (cases750 >= 100) return 31;
  return 32;
}

export function priceExportLines(rawLines) {
  const lines = Array.isArray(rawLines) ? rawLines : [];
  const normalized = [];
  for (const l of lines) {
    const sku = String(l.sku || "");
    if (!SKUS[sku]) continue;
    const cases = Math.max(0, Math.floor(Number(l.cases) || 0));
    if (cases <= 0) continue;
    normalized.push({
      sku,
      cases,
      unitFobUsd: l.unitFobUsd != null ? Number(l.unitFobUsd) : undefined,
    });
  }
  const c750 = cases750Total(normalized);
  const priced = [];
  for (const l of normalized) {
    const m = SKUS[l.sku];
    const unit =
      l.unitFobUsd != null && Number.isFinite(l.unitFobUsd)
        ? l.unitFobUsd
        : m.size === "750 ml"
          ? suggestFob750(c750)
          : m.listFobUsd;
    const caseUsd = round2(unit * m.bottlesPerCase);
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
    o[row.key] = { status: "required", notes: "" };
  }
  return o;
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

export function serializeExportOrder(row, { includeInternalEconomics = false, buyerFacing = false } = {}) {
  if (!row) return null;
  const priced = priceExportLines(parseJsonLines(row.lines));
  const lines = includeInternalEconomics
    ? priced.lines
    : priced.lines.map(({ floorFobUsd, belowFloor, ...rest }) => rest);
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
    subtotalUsd: Number(row.subtotal_usd),
    depositDueUsd: Number(row.deposit_due_usd),
    balanceDueUsd: Number(row.balance_due_usd),
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
    exclusivity: buyerFacing ? false : Boolean(row.exclusivity),
    notes: buyerFacing ? undefined : row.notes,
    quoteValidUntil: row.quote_valid_until,
    issuedDocs: buyerFacing ? undefined : asJsonObject(row.issued_docs),
    buyerDocStatus: buyerDocStatus(row),
    belowFloor: includeInternalEconomics ? priced.belowFloor : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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
  for (const doc of ["quotation", "po_acceptance", "proforma", "deposit", "shipment_release"]) {
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

export function requiredChecklistReady(checklist) {
  const state = asJsonObject(checklist);
  return DEFAULT_EXPORT_CHECKLIST.every((row) => {
    const st = String(state[row.key]?.status || "required");
    return st === "complete" || st === "issued" || st === "na";
  });
}

export function isBuyerExportDoc(doc) {
  return ["quotation", "po_acceptance", "proforma", "deposit", "shipment_release"].includes(String(doc));
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
