import type { Product, ProductionStatus, PurchaseOrder } from "@/data/mockData";

export type SpecSheetTone = "red" | "amber" | "neutral" | "green" | "blue";

export type SpecStat = {
  label: string;
  value: string;
};

export type SpecTimelineEntry = {
  stage: string;
  date: string;
  notes: string;
};

export type SpecSheetModel = {
  id: string;
  sku: string;
  productName: string;
  cases: number;
  bottles: number;
  tone: SpecSheetTone;
  statusLabel: string;
  due: string;
  received: string;
  requestedShip: string;
  marketDestination: string;
  labelVersion: string;
  packagingInstructions: string;
  abv: string;
  caseSize: string;
  size: string;
  production: SpecStat[];
  hqNotes: string;
  timeline: SpecTimelineEntry[];
};

function casesEstimate(bottles: number): number {
  return Math.max(1, Math.round(bottles / 12));
}

function toneForStatus(po: PurchaseOrder): SpecSheetTone {
  if (po.status === "draft" || po.status === "delayed") return "red";
  if (po.status === "in-production" || po.status === "completed" || po.status === "shipped") return "amber";
  if (po.status === "delivered") return "green";
  if (po.status === "approved") return "neutral";
  return "neutral";
}

function statusLabel(po: PurchaseOrder): string {
  if (po.status === "draft" || po.status === "delayed") return "action needed";
  if (po.status === "in-production" || po.status === "completed") return "scheduled";
  if (po.status === "approved") return "queued";
  return po.status.replace(/-/g, " ");
}

function formatLongDate(date: string): string {
  try {
    return new Date(date).toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return date || "—";
  }
}

/** Strip auto-appended manufacturer/HQ status note blocks from the visible HQ note. */
function cleanNotes(notes: string): string {
  const trimmed = (notes ?? "").trim();
  if (!trimmed) return "";
  return trimmed
    .split("\n")
    .filter((line) => !line.trim().startsWith("["))
    .join("\n")
    .trim();
}

export function buildSpecSheetModel(
  po: PurchaseOrder,
  product: Product | undefined,
  productionStatuses: ProductionStatus[],
): SpecSheetModel {
  const cases = casesEstimate(po.quantity);
  const volumeLiters = Math.round(cases * 9);
  const riceTonnes = (cases * 0.012).toFixed(1);

  const timeline = productionStatuses
    .filter((s) => s.poId === po.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((s) => ({ stage: s.stage, date: s.updatedAt, notes: s.notes }));

  return {
    id: po.id,
    sku: po.sku,
    productName: product?.name ?? po.sku,
    cases,
    bottles: po.quantity,
    tone: toneForStatus(po),
    statusLabel: statusLabel(po),
    due: formatLongDate(po.requiredDate),
    received: formatLongDate(po.issueDate),
    requestedShip: formatLongDate(po.requestedShipDate),
    marketDestination: po.marketDestination || "—",
    labelVersion: po.labelVersion || "—",
    packagingInstructions: po.packagingInstructions || "—",
    abv: product?.abv ?? "—",
    caseSize: product?.caseSize ? `${product.caseSize} bottles/case` : "—",
    size: product?.size ?? "—",
    production: [
      { label: "Volume", value: `${volumeLiters.toLocaleString()} L est.` },
      { label: "Rice needed", value: `${riceTonnes} t` },
      { label: "Brew time", value: "~30 days" },
      { label: "Tank", value: "To assign" },
    ],
    hqNotes: cleanNotes(po.notes),
    timeline,
  };
}
