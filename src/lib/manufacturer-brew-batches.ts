import type { ProductionStatus, PurchaseOrder } from "@/data/mockData";

export const BREW_STAGES = ["Milling", "Steaming", "Kōji", "Moromi", "Pressing", "Bottling"] as const;

export type BrewStepState = "done" | "cur" | "";

export type BrewBatchRow = {
  id: string;
  poId: string;
  sku: string;
  tank: string;
  volume: string;
  stageIndex: number;
  steps: BrewStepState[];
  started: string;
  expected: string;
  temp: string;
  day: string;
  statusTone: "blue" | "green" | "amber";
  statusLabel: string;
  filterCategory: "fermenting" | "pressing" | "bottling" | "other";
};

export type BrewBatchFilter = "all" | "fermenting" | "pressing" | "bottling";

export function brewStepsForStage(stageIndex: number): BrewStepState[] {
  return BREW_STAGES.map((_, j) => {
    if (j < stageIndex) return "done";
    if (j === stageIndex) return "cur";
    return "";
  });
}

function batchIdForPo(po: PurchaseOrder): string {
  const digits = po.id.replace(/\D/g, "");
  const tail = digits.slice(-4).padStart(4, "0");
  return `B-${tail}`;
}

function tankForPo(po: PurchaseOrder): string {
  const n = parseInt(po.id.replace(/\D/g, "").slice(-1) || "1", 10);
  return `Tank ${((n % 9) + 1)}`;
}

function volumeLabel(bottles: number): string {
  const liters = Math.round(bottles * 0.72);
  return `${liters.toLocaleString()} L`;
}

function daysSince(date: string): string {
  try {
    const start = new Date(date);
    const now = new Date();
    const days = Math.max(1, Math.round((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    return `Day ${days}`;
  } catch {
    return "Day —";
  }
}

function brewStageFromPo(po: PurchaseOrder, statuses: ProductionStatus[]): number {
  const latest = statuses
    .filter((s) => s.poId === po.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const stage = latest?.stage?.toLowerCase() ?? "";
  if (stage.includes("bottl") || stage.includes("label") || stage.includes("pack")) return 5;
  if (stage.includes("delayed")) return 4;
  if (stage.includes("production")) return 3;
  if (stage.includes("scheduled")) return 2;
  if (stage.includes("material")) return 1;
  if (po.status === "in-production") return 3;
  if (po.status === "delayed") return 4;
  if (po.status === "approved") return 2;
  return 1;
}

function statusMeta(stageIndex: number): {
  tone: BrewBatchRow["statusTone"];
  label: string;
  filter: BrewBatchRow["filterCategory"];
} {
  if (stageIndex >= 5) return { tone: "amber", label: "bottling", filter: "bottling" };
  if (stageIndex === 4) return { tone: "blue", label: "pressing soon", filter: "pressing" };
  if (stageIndex >= 2) return { tone: "blue", label: "fermenting", filter: "fermenting" };
  if (stageIndex === 1) return { tone: "green", label: "kōji", filter: "other" };
  return { tone: "green", label: "milling", filter: "other" };
}

function formatShortDate(date: string): string {
  try {
    return new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  } catch {
    return date;
  }
}

/**
 * Active brew-floor rows from accepted production POs + latest status notes.
 *
 * A request only reaches the brew floor once the kura has accepted it (status
 * moves to `in-production`). `draft` (HQ drafting) and `approved` (issued to the
 * kura but not yet accepted) are excluded so acceptance is the gate; `completed`
 * is excluded so a bottled batch leaves the floor (received into finished goods).
 */
export function buildBrewBatchesFromOrders(
  purchaseOrders: PurchaseOrder[],
  productionStatuses: ProductionStatus[],
): BrewBatchRow[] {
  const open = purchaseOrders.filter(
    (p) =>
      p.poType !== "sales" &&
      p.status !== "delivered" &&
      p.status !== "cancelled" &&
      p.status !== "draft" &&
      p.status !== "approved" &&
      p.status !== "completed" &&
      p.status !== "shipped",
  );

  return open.map((po) => {
    const stageIndex = brewStageFromPo(po, productionStatuses);
    const meta = statusMeta(stageIndex);
    const temps = ["12.4°C", "10.1°C", "4.0°C", "15.2°C"];
    const temp = temps[parseInt(po.id.replace(/\D/g, "").slice(-1) || "0", 10) % temps.length];

    return {
      id: batchIdForPo(po),
      poId: po.id,
      sku: po.sku,
      tank: tankForPo(po),
      volume: volumeLabel(po.quantity),
      stageIndex,
      steps: brewStepsForStage(stageIndex),
      started: formatShortDate(po.issueDate),
      expected: formatShortDate(po.requiredDate),
      temp,
      day: daysSince(po.issueDate),
      statusTone: meta.tone,
      statusLabel: meta.label,
      filterCategory: meta.filter,
    };
  });
}

export function filterBrewBatches(rows: BrewBatchRow[], filter: BrewBatchFilter): BrewBatchRow[] {
  if (filter === "all") return rows;
  if (filter === "fermenting") return rows.filter((r) => r.filterCategory === "fermenting");
  if (filter === "pressing") return rows.filter((r) => r.filterCategory === "pressing");
  return rows.filter((r) => r.filterCategory === "bottling");
}
