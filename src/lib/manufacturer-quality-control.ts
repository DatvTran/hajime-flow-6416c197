export type QcSpecRow = {
  label: string;
  value: string;
  pct: number;
  target: number;
};

export type QcBatchRow = {
  id: string;
  sku: string;
  testedDate: string;
  result: "pass";
  score: string;
  specs: QcSpecRow[];
};

export type QcSummary = {
  passRate: string;
  batchesTested: number;
  batchesPassed: number;
  batchesReblend: number;
  aPlusBatches: number;
  aPlusPct: string;
  avgPolishRatio: string;
};

/** Empty until QC results are recorded from the brew floor. */
export const QC_BATCHES: QcBatchRow[] = [];

export const QC_SUMMARY: QcSummary = {
  passRate: "—",
  batchesTested: 0,
  batchesPassed: 0,
  batchesReblend: 0,
  aPlusBatches: 0,
  aPlusPct: "—",
  avgPolishRatio: "—",
};
