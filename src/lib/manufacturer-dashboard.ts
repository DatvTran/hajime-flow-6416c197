import type { PurchaseOrder } from "@/data/mockData";

export type DashboardRequestTone = "red" | "amber" | "neutral";

export type DashboardRequestRow = {
  id: string;
  sku: string;
  cases: number;
  polish: string;
  due: string;
  tone: DashboardRequestTone;
  statusLabel: string;
};

function casesEstimate(bottles: number): number {
  return Math.max(1, Math.round(bottles / 12));
}

function requestTone(po: PurchaseOrder): DashboardRequestTone {
  if (po.status === "draft" || po.status === "delayed") return "red";
  if (po.status === "in-production" || po.status === "completed" || po.status === "shipped") return "amber";
  return "neutral";
}

function statusLabel(po: PurchaseOrder): string {
  if (po.status === "draft" || po.status === "delayed") return "action needed";
  if (po.status === "in-production" || po.status === "completed") return "scheduled";
  if (po.status === "approved") return "queued";
  return po.status.replace(/-/g, " ");
}

function polishLine(po: PurchaseOrder): string {
  const parts = [po.labelVersion, po.packagingInstructions].filter(Boolean);
  return parts.join(" · ") || "—";
}

function formatStartBy(date: string): string {
  try {
    return `Start by ${new Date(date).toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
    })}`;
  } catch {
    return date;
  }
}

export function buildDashboardRequests(purchaseOrders: PurchaseOrder[], limit = 4): DashboardRequestRow[] {
  return purchaseOrders
    .filter((p) => p.poType !== "sales" && p.status !== "delivered" && p.status !== "cancelled")
    .slice(0, limit)
    .map((po) => ({
      id: po.id,
      sku: po.sku,
      cases: casesEstimate(po.quantity),
      polish: polishLine(po),
      due: formatStartBy(po.requiredDate),
      tone: requestTone(po),
      statusLabel: statusLabel(po),
    }));
}
