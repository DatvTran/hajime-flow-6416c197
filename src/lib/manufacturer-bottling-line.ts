import type { ProductionStatus, PurchaseOrder } from "@/data/mockData";
import { buildBrewBatchesFromOrders, type BrewBatchRow } from "@/lib/manufacturer-brew-batches";
import { packagingStockFromMaterials } from "@/lib/manufacturer-raw-materials";

export type BottlingCheckStep = {
  id: string;
  label: string;
  detail: string;
  done: boolean;
};

export type ActiveBottlingRun = {
  poId: string;
  sku: string;
  batchId: string;
  line: string;
  cases: number;
  steps: BottlingCheckStep[];
};

export type ScheduledBottlingRun = {
  time: string;
  sku: string;
  batchId: string;
  cases: number;
  line: string;
};

export type BottlingScheduleDay = {
  dayLabel: string;
  runs: ScheduledBottlingRun[];
};

export type BottlingLineStatus = {
  label: string;
  status: string;
  tone: "amber" | "neutral" | "green";
};

export type PackagingStockRow = {
  name: string;
  onHand: string;
  pct: number;
  tone: "low" | "med" | "ok";
};

export type BottlingLineModel = {
  activeRun: ActiveBottlingRun | null;
  upcoming: BottlingScheduleDay[];
  lineStatus: BottlingLineStatus[];
  packagingStock: PackagingStockRow[];
};

function casesFromBottles(bottles: number): number {
  return Math.max(1, Math.round(bottles / 12));
}

function lineForSku(sku: string): string {
  if (sku.includes("500") || sku.includes("375")) return "Line A · small format";
  return "Line B · standard";
}

function timeSlot(index: number): string {
  const slots = ["08:00–11:00", "13:00–17:00", "08:00–14:00", "09:00–12:00"];
  return slots[index % slots.length];
}

function formatScheduleDay(date: string): string {
  try {
    const d = new Date(date);
    const today = new Date();
    const dayPart = d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
    if (d.toDateString() === today.toDateString()) return `Today — ${dayPart}`;
    return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  } catch {
    return date;
  }
}

function defaultChecklist(cases: number, sku: string, line: string): BottlingCheckStep[] {
  const bottles = cases * 12;
  const shortSku = sku.length > 24 ? sku.split(" ")[0] : sku;
  return [
    { id: "sterilize", label: "Sterilize bottles & line", detail: line, done: true },
    { id: "pasteurize", label: "Filter & pasteurize batch", detail: "Single pasteurization · 63°C", done: true },
    { id: "fill", label: "Fill & cap", detail: `${cases} cases · ${bottles.toLocaleString()} bottles`, done: false },
    { id: "labels", label: "Apply labels", detail: `${shortSku} front + back`, done: false },
    { id: "pack", label: "Case pack & seal", detail: "12 bottles/case", done: false },
    { id: "qc", label: "QC final + move to finished goods", detail: "Lot assignment pending", done: false },
  ];
}

function batchFromPo(po: PurchaseOrder): { batchId: string; cases: number; sku: string; line: string } {
  const digits = po.id.replace(/\D/g, "");
  return {
    batchId: `B-${digits.slice(-4).padStart(4, "0")}`,
    cases: casesFromBottles(po.quantity),
    sku: po.sku,
    line: lineForSku(po.sku),
  };
}

function pickActiveBatch(batches: BrewBatchRow[], purchaseOrders: PurchaseOrder[]): BrewBatchRow | null {
  const bottling = batches.find((b) => b.filterCategory === "bottling");
  if (bottling) return bottling;
  const pressing = batches.find((b) => b.filterCategory === "pressing");
  if (pressing) return pressing;
  if (batches[0]) return batches[0];
  const po = purchaseOrders.find((p) => p.status === "in-production" || p.status === "delayed");
  if (!po) return null;
  const meta = batchFromPo(po);
  return {
    id: meta.batchId,
    poId: po.id,
    sku: meta.sku,
    tank: "Tank 2",
    volume: `${Math.round(po.quantity * 0.72).toLocaleString()} L`,
    stageIndex: 5,
    steps: ["done", "done", "done", "done", "done", "cur"],
    started: po.issueDate,
    expected: po.requiredDate,
    temp: "4.0°C",
    day: "Day 44",
    statusTone: "amber",
    statusLabel: "bottling",
    filterCategory: "bottling",
  };
}

export function buildBottlingLineModel(
  purchaseOrders: PurchaseOrder[],
  productionStatuses: ProductionStatus[],
): BottlingLineModel {
  const batches = buildBrewBatchesFromOrders(purchaseOrders, productionStatuses);
  const activeBatch = pickActiveBatch(batches, purchaseOrders);

  let activeRun: ActiveBottlingRun | null = null;
  if (activeBatch) {
    const po = purchaseOrders.find((p) => p.id === activeBatch.poId);
    const cases = po ? casesFromBottles(po.quantity) : 64;
    const line = lineForSku(activeBatch.sku);
    activeRun = {
      poId: activeBatch.poId,
      sku: activeBatch.sku,
      batchId: activeBatch.id,
      line,
      cases,
      steps: defaultChecklist(cases, activeBatch.sku, line),
    };
  }

  const upcomingItems: { date: string; run: ScheduledBottlingRun }[] = [];
  let slot = 0;

  for (const b of batches) {
    if (activeBatch && b.id === activeBatch.id) continue;
    const po = purchaseOrders.find((p) => p.id === b.poId);
    upcomingItems.push({
      date: po?.requiredDate ?? new Date().toISOString().slice(0, 10),
      run: {
        time: timeSlot(slot++),
        sku: b.sku,
        batchId: b.id,
        cases: po ? casesFromBottles(po.quantity) : 120,
        line: lineForSku(b.sku),
      },
    });
  }

  const batchPoIds = new Set(batches.map((b) => b.poId));
  const extraPos = purchaseOrders.filter(
    (p) =>
      p.poType !== "sales" &&
      p.status !== "delivered" &&
      p.status !== "cancelled" &&
      p.status !== "draft" &&
      p.status !== "approved" &&
      p.status !== "completed" &&
      p.status !== "shipped" &&
      !batchPoIds.has(p.id) &&
      (!activeBatch || p.id !== activeBatch.poId),
  );

  for (const po of extraPos) {
    const meta = batchFromPo(po);
    upcomingItems.push({
      date: po.requiredDate,
      run: {
        time: timeSlot(slot++),
        sku: meta.sku,
        batchId: meta.batchId,
        cases: meta.cases,
        line: meta.line,
      },
    });
  }

  const dayMap = new Map<string, ScheduledBottlingRun[]>();
  for (const item of upcomingItems) {
    const label = formatScheduleDay(item.date);
    const list = dayMap.get(label) ?? [];
    list.push(item.run);
    dayMap.set(label, list);
  }

  const upcoming: BottlingScheduleDay[] = [...dayMap.entries()].map(([dayLabel, runs]) => ({
    dayLabel,
    runs,
  }));

  const lineAActive = activeRun?.line.startsWith("Line A");
  const lineStatus: BottlingLineStatus[] = [
    {
      label: "Line A · small format",
      status: lineAActive ? "Running" : "Idle — next 13:00",
      tone: lineAActive ? "amber" : "neutral",
    },
    {
      label: "Line B · standard",
      status: !lineAActive && activeRun ? "Running" : "Idle — next 13:00",
      tone: !lineAActive && activeRun ? "amber" : "neutral",
    },
  ];

  const packagingStock: PackagingStockRow[] = packagingStockFromMaterials();

  return { activeRun, upcoming, lineStatus, packagingStock };
}
