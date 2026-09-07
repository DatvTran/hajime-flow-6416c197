/** Hajime Ltd. HK — international distributor commercial doctrine (Expo 2026 pack). */

export const EXPORT_SELLER = {
  legalName: "Hajime Ltd.",
  legalNameFull: "Hajime Limited",
  jurisdiction: "Hong Kong",
  productionBase: "Thailand",
  workingIncoterm: "FOB Bangkok, Thailand",
  incotermNote:
    "Working basis only. Exact named port/terminal must be confirmed before binding shipment documents.",
  currency: "USD",
  paymentSummary: "50% deposit upon order confirmation; 50% before shipment",
  wireFees: "Buyer pays bank/wire fees so Hajime Ltd. receives the full invoiced amount",
  bank: {
    accountName: "Hajime Limited",
    accountNumber: "7949937138",
    bankCode: "016",
    branchCode: "478",
    swift: "DHBKHKHH",
    bankName: "DBS Bank (Hong Kong) Limited",
    location: "Hong Kong SAR",
  },
} as const;

export const EXPORT_STAGES = [
  { id: "01_lead", n: 1, label: "Lead qualified", owner: "Hajime" },
  { id: "02_quotation", n: 2, label: "Quotation", owner: "Hajime" },
  { id: "03_buyer_po", n: 3, label: "Buyer acceptance / PO", owner: "Buyer + Hajime" },
  { id: "04_po_acceptance", n: 4, label: "PO Acceptance", owner: "Hajime" },
  { id: "05_proforma", n: 5, label: "Pro forma invoice", owner: "Hajime" },
  { id: "06_deposit", n: 6, label: "Deposit clearance", owner: "Hajime" },
  { id: "07_production_auth", n: 7, label: "Production authorization", owner: "Hajime + Manufacturer" },
  { id: "08_freight", n: 8, label: "Freight planning", owner: "Buyer + Hajime" },
  { id: "09_export_docs", n: 9, label: "Export document preparation", owner: "Manufacturer + Hajime" },
  { id: "10_ready_to_ship", n: 10, label: "Ready-to-ship confirmation", owner: "Manufacturer + Hajime" },
  { id: "11_balance", n: 11, label: "Final balance request", owner: "Hajime" },
  { id: "12_shipment_release", n: 12, label: "Shipment release", owner: "Hajime" },
  { id: "13_fob_handover", n: 13, label: "FOB handover", owner: "Forwarder / Buyer" },
  { id: "14_closing", n: 14, label: "Closing documents", owner: "Hajime" },
  { id: "15_closeout", n: 15, label: "Post-order closeout", owner: "Hajime" },
] as const;

export type ExportStageId = (typeof EXPORT_STAGES)[number]["id"];

export const EXPORT_DOC_TYPES = [
  "quotation",
  "po_acceptance",
  "proforma",
  "deposit",
  "production_auth",
  "export_checklist",
  "shipment_release",
] as const;

export type ExportDocType = (typeof EXPORT_DOC_TYPES)[number];

/** Quote / PI / PO / deposit / shipment — never production auth or HQ checklist. */
export const BUYER_EXPORT_DOC_TYPES = [
  "quotation",
  "po_acceptance",
  "proforma",
  "deposit",
  "shipment_release",
] as const;

export type BuyerExportDocType = (typeof BUYER_EXPORT_DOC_TYPES)[number];

export function isBuyerExportDoc(doc: string): doc is BuyerExportDocType {
  return (BUYER_EXPORT_DOC_TYPES as readonly string[]).includes(doc);
}

export function exportDocTitle(doc: ExportDocType): string {
  switch (doc) {
    case "quotation":
      return "International distributor quotation";
    case "po_acceptance":
      return "Purchase order acceptance";
    case "proforma":
      return "Pro forma invoice";
    case "deposit":
      return "Deposit confirmation";
    case "production_auth":
      return "Production authorization";
    case "export_checklist":
      return "Export document checklist";
    case "shipment_release":
      return "Final payment & shipment release";
    default:
      return doc;
  }
}

export const EXPORT_SKUS = [
  {
    sku: "first_press_750",
    product: "Hajime First Press Coffee Rhum Liqueur",
    size: "750 ml",
    bottlesPerCase: 12,
    workingCostUsd: 20,
    floorFobUsd: 28,
    listFobUsd: 32,
  },
  {
    sku: "yuzu_mint_750",
    product: "Hajime Yuzu Mint Rhum Liqueur",
    size: "750 ml",
    bottlesPerCase: 12,
    workingCostUsd: 20,
    floorFobUsd: 28,
    listFobUsd: 32,
  },
  {
    sku: "first_press_200",
    product: "Hajime First Press Coffee Rhum Liqueur",
    size: "200 ml",
    bottlesPerCase: 20,
    workingCostUsd: 12,
    floorFobUsd: 16,
    listFobUsd: 18,
  },
  {
    sku: "yuzu_mint_200",
    product: "Hajime Yuzu Mint Rhum Liqueur",
    size: "200 ml",
    bottlesPerCase: 20,
    workingCostUsd: 12,
    floorFobUsd: 16,
    listFobUsd: 18,
  },
] as const;

export type ExportSkuCode = (typeof EXPORT_SKUS)[number]["sku"];

export const VOLUME_TIERS = [
  { id: "trial", label: "Trial", minCases750: 25, fob750: 32 },
  { id: "standard", label: "Standard", minCases750: 100, fob750: 31 },
  { id: "strategic", label: "Strategic", minCases750: 250, fob750: 30 },
] as const;

export type DepositStatus = "pending" | "cleared" | "short" | "exception";
export type BalanceStatus = "pending" | "cleared" | "exception";

export type ExportLineInput = { sku: ExportSkuCode; cases: number; unitFobUsd?: number };

export type PricedExportLine = {
  sku: ExportSkuCode;
  product: string;
  size: string;
  cases: number;
  bottlesPerCase: number;
  totalBottles: number;
  unitFobUsd: number;
  caseUsd: number;
  lineTotalUsd: number;
  floorFobUsd: number;
  belowFloor: boolean;
};

export function skuMeta(sku: string) {
  return EXPORT_SKUS.find((s) => s.sku === sku) ?? null;
}

export function cases750Total(lines: ExportLineInput[]): number {
  return round2(
    lines.reduce((n, l) => {
      const m = skuMeta(l.sku);
      if (!m || m.size !== "750 ml") return n;
      return n + Math.max(0, Number(l.cases) || 0);
    }, 0),
  );
}

export function suggestTier(cases750: number): (typeof VOLUME_TIERS)[number] {
  if (cases750 >= 250) return VOLUME_TIERS[2];
  if (cases750 >= 100) return VOLUME_TIERS[1];
  return VOLUME_TIERS[0];
}

export function defaultUnitFob(sku: ExportSkuCode, cases750: number): number {
  const m = skuMeta(sku);
  if (!m) return 0;
  if (m.size === "750 ml") return suggestTier(cases750).fob750;
  return m.listFobUsd;
}

export function priceLines(lines: ExportLineInput[]): {
  lines: PricedExportLine[];
  subtotalUsd: number;
  cases750: number;
  tier: (typeof VOLUME_TIERS)[number];
  depositDueUsd: number;
  balanceDueUsd: number;
} {
  const cases750 = cases750Total(lines);
  const tier = suggestTier(cases750);
  const priced: PricedExportLine[] = [];
  for (const l of lines) {
    const m = skuMeta(l.sku);
    if (!m) continue;
    const cases = Math.max(0, Math.floor(Number(l.cases) || 0));
    if (cases <= 0) continue;
    const unit = l.unitFobUsd != null && Number.isFinite(Number(l.unitFobUsd))
      ? Number(l.unitFobUsd)
      : defaultUnitFob(l.sku, cases750);
    const bottles = cases * m.bottlesPerCase;
    const caseUsd = round2(unit * m.bottlesPerCase);
    const lineTotalUsd = round2(caseUsd * cases);
    priced.push({
      sku: l.sku,
      product: m.product,
      size: m.size,
      cases,
      bottlesPerCase: m.bottlesPerCase,
      totalBottles: bottles,
      unitFobUsd: round2(unit),
      caseUsd,
      lineTotalUsd,
      floorFobUsd: m.floorFobUsd,
      belowFloor: unit + 1e-9 < m.floorFobUsd,
    });
  }
  const subtotalUsd = round2(priced.reduce((s, l) => s + l.lineTotalUsd, 0));
  const depositDueUsd = round2(subtotalUsd * 0.5);
  return {
    lines: priced,
    subtotalUsd,
    cases750,
    tier,
    depositDueUsd,
    balanceDueUsd: round2(subtotalUsd - depositDueUsd),
  };
}

export function stageIndex(id: string): number {
  const i = EXPORT_STAGES.findIndex((s) => s.id === id);
  return i < 0 ? 0 : i;
}

export function distributorCanViewStage(stage: string): boolean {
  return stageIndex(stage) >= stageIndex("02_quotation");
}

export function canAuthorizeProduction(depositStatus: DepositStatus): boolean {
  return depositStatus === "cleared" || depositStatus === "exception";
}

export function canReleaseShipment(opts: {
  balanceStatus: BalanceStatus;
  checklistCleared: boolean;
  fobNamedPoint?: string | null;
}): boolean {
  if (!(opts.balanceStatus === "cleared" || opts.balanceStatus === "exception")) return false;
  if (!opts.checklistCleared) return false;
  return Boolean(String(opts.fobNamedPoint ?? "").trim());
}

export function assertAdvanceStage(opts: {
  from: ExportStageId;
  to: ExportStageId;
  depositStatus: DepositStatus;
  balanceStatus: BalanceStatus;
  checklistCleared: boolean;
  fobNamedPoint?: string | null;
}): { ok: true } | { ok: false; error: string } {
  const fromI = stageIndex(opts.from);
  const toI = stageIndex(opts.to);
  if (toI < fromI) return { ok: true };
  const needsPa = toI >= stageIndex("07_production_auth");
  if (needsPa && !canAuthorizeProduction(opts.depositStatus)) {
    return {
      ok: false,
      error: "Production may be authorized only after the deposit has cleared (or a written exception).",
    };
  }
  const needsRelease = toI >= stageIndex("12_shipment_release");
  if (
    needsRelease &&
    !canReleaseShipment({
      balanceStatus: opts.balanceStatus,
      checklistCleared: opts.checklistCleared,
      fobNamedPoint: opts.fobNamedPoint,
    })
  ) {
    return {
      ok: false,
      error:
        "Shipment release requires cleared final balance, export checklist cleared, and a confirmed FOB named port/terminal.",
    };
  }
  return { ok: true };
}

export type ExportChecklistKind = "core" | "optional";
export type ExportChecklistStatus = "required" | "issued" | "na" | "complete";
export type ExportChecklistRow = {
  key: string;
  label: string;
  owner: string;
  kind: ExportChecklistKind;
};
export type ExportChecklistState = Record<string, { status?: string; notes?: string }>;

export const DEFAULT_EXPORT_CHECKLIST: ExportChecklistRow[] = [
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

export const CORE_EXPORT_CHECKLIST = DEFAULT_EXPORT_CHECKLIST.filter((r) => r.kind === "core");
export const OPTIONAL_EXPORT_CHECKLIST = DEFAULT_EXPORT_CHECKLIST.filter((r) => r.kind === "optional");

function checklistDone(status: string | undefined): boolean {
  const st = String(status || "required");
  return st === "complete" || st === "issued" || st === "na";
}

export function defaultChecklistState(): ExportChecklistState {
  const o: ExportChecklistState = {};
  for (const row of DEFAULT_EXPORT_CHECKLIST) {
    o[row.key] = { status: row.kind === "optional" ? "na" : "required", notes: "" };
  }
  return o;
}

/** Optional rows that were never touched stay N/A so they do not block release. */
export function applyOrderStateToChecklist(
  checklist: ExportChecklistState | unknown,
  order: {
    stage?: string;
    buyerPoNo?: string | null;
    depositStatus?: string | null;
  },
): ExportChecklistState {
  const raw = checklist && typeof checklist === "object" ? (checklist as ExportChecklistState) : {};
  const next: ExportChecklistState = { ...defaultChecklistState() };
  for (const row of DEFAULT_EXPORT_CHECKLIST) {
    const prev = raw[row.key] || {};
    let status = String(prev.status || (row.kind === "optional" ? "na" : "required"));
    if (row.kind === "optional" && status === "required") status = "na";
    next[row.key] = { notes: prev.notes || "", status };
  }
  const bump = (key: string, cond: boolean) => {
    if (!cond) return;
    if (String(next[key]?.status || "required") === "required") {
      next[key] = { ...next[key], status: "issued" };
    }
  };
  const si = stageIndex(String(order.stage || "01_lead"));
  bump("buyer_po", Boolean(String(order.buyerPoNo || "").trim()) || si >= stageIndex("03_buyer_po"));
  bump("quote_acceptance", si >= stageIndex("02_quotation"));
  bump("proforma", si >= stageIndex("05_proforma"));
  bump("deposit", order.depositStatus === "cleared" || order.depositStatus === "exception");
  bump("production_auth", si >= stageIndex("07_production_auth"));
  bump("commercial_invoice", si >= stageIndex("11_balance"));
  bump("packing_list", si >= stageIndex("10_ready_to_ship"));
  bump("shipment_release", si >= stageIndex("12_shipment_release"));
  return next;
}

export function requiredChecklistReady(
  checklist: ExportChecklistState | unknown,
  order?: { stage?: string; buyerPoNo?: string | null; depositStatus?: string | null },
): boolean {
  const state = applyOrderStateToChecklist(checklist, order ?? {});
  return CORE_EXPORT_CHECKLIST.every((row) => checklistDone(state[row.key]?.status));
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function isExportStageId(v: string): v is ExportStageId {
  return EXPORT_STAGES.some((s) => s.id === v);
}

export function isExportSku(v: string): v is ExportSkuCode {
  return EXPORT_SKUS.some((s) => s.sku === v);
}
