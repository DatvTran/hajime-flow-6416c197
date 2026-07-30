export type FinishedGoodsStatus = "ok" | "med";

export type FinishedGoodsRow = {
  sku: string;
  name: string;
  lot: string;
  cases: number;
  reserved: number;
  status: FinishedGoodsStatus;
  /** Production PO this lot was bottled from (when produced via the brew → bottling chain). */
  poId?: string;
};

/** Empty until bottling receipts / API hydrate inventory. */
export const FINISHED_GOODS: FinishedGoodsRow[] = [];

/** Low-stock threshold (available cases) used to tone a finished-goods lot. */
export function statusForCases(availableCases: number): FinishedGoodsStatus {
  return availableCases < 80 ? "med" : "ok";
}

/** Deterministic lot label for a production PO so repeat receipts merge into one lot. */
export function lotForPo(poId: string): string {
  const digits = poId.replace(/\D/g, "").slice(-4);
  return digits ? `Lot ${digits}` : "Lot 00";
}

export type FinishedGoodsReceipt = {
  sku: string;
  name: string;
  cases: number;
  lot: string;
  poId?: string;
};

/** Bottling output lands here: merge into an existing lot or prepend a new one. */
export function receiveFinishedGoodsRows(
  rows: FinishedGoodsRow[],
  receipt: FinishedGoodsReceipt,
): FinishedGoodsRow[] {
  const idx = rows.findIndex((r) => r.sku === receipt.sku && r.lot === receipt.lot);
  if (idx >= 0) {
    const next = [...rows];
    const cases = next[idx].cases + receipt.cases;
    next[idx] = { ...next[idx], cases, status: statusForCases(cases - next[idx].reserved) };
    return next;
  }
  return [
    {
      sku: receipt.sku,
      name: receipt.name,
      lot: receipt.lot,
      cases: receipt.cases,
      reserved: 0,
      status: statusForCases(receipt.cases),
      poId: receipt.poId,
    },
    ...rows,
  ];
}

/** Shipping deducts available cases from a SKU's lots (oldest rows first); emptied lots drop off. */
export function deductFinishedGoodsRows(
  rows: FinishedGoodsRow[],
  deduction: { sku: string; cases: number },
): FinishedGoodsRow[] {
  let remaining = deduction.cases;
  return rows
    .map((r) => {
      if (remaining <= 0 || r.sku !== deduction.sku) return r;
      const take = Math.min(r.cases - r.reserved, remaining);
      if (take <= 0) return r;
      remaining -= take;
      const cases = r.cases - take;
      return { ...r, cases, status: statusForCases(cases - r.reserved) };
    })
    .filter((r) => r.cases > 0);
}

export function availableCasesForSku(rows: FinishedGoodsRow[], sku: string): number {
  return rows
    .filter((r) => r.sku === sku)
    .reduce((sum, r) => sum + Math.max(0, r.cases - r.reserved), 0);
}

export type FinishedGoodsSummary = {
  totalCases: number;
  skuCount: number;
  reservedCases: number;
  availableCases: number;
};

export function summarizeFinishedGoods(rows: FinishedGoodsRow[] = FINISHED_GOODS): FinishedGoodsSummary {
  const totalCases = rows.reduce((sum, row) => sum + row.cases, 0);
  const reservedCases = rows.reduce((sum, row) => sum + row.reserved, 0);
  return {
    totalCases,
    skuCount: rows.length,
    reservedCases,
    availableCases: totalCases - reservedCases,
  };
}

export function availableCases(row: FinishedGoodsRow): number {
  return row.cases - row.reserved;
}

export function availableTextClass(available: number): string {
  return available < 50 ? "text-[hsl(38_90%_40%)]" : "text-[hsl(158_56%_32%)]";
}
