import type { NewProductRequest } from "@/data/mockData";
import { formatBaseSpiritLabel } from "@/lib/base-spirit-options";

export type HqNprFilterId =
  | "all"
  | "draft"
  | "active"
  | "proposed"
  | "approved"
  | "closed";

export function kuraShortName(manufacturer: string | undefined): string {
  if (!manufacturer?.trim()) return "—";
  return manufacturer.split(" ")[0] || manufacturer;
}

/**
 * The HQ-facing product development pipeline is presented as four stages.
 * The underlying `status` enum is richer (it also drives the manufacturer
 * handshake and the API/DB), so we collapse it onto these stages here.
 */
export const HQ_NPR_STAGES = [
  "Concept",
  "Feasibility review",
  "Proposal",
  "Approved for production",
] as const;

export type HqNprStage = (typeof HQ_NPR_STAGES)[number];

/** Stage accent colors — hq-operator-app.html pipeline tracker */
export const NPR_STAGE_COLORS = [
  "hsl(var(--muted-foreground))",
  "hsl(38 90% 50%)",
  "hsl(215 72% 50%)",
  "hsl(158 56% 36%)",
] as const;

const NPR_STAGE_OWNERS = ["HQ", "Manufacturer", "HQ", "Both"] as const;

export function nprStageOwner(stageIndex: number): (typeof NPR_STAGE_OWNERS)[number] {
  return NPR_STAGE_OWNERS[Math.min(Math.max(stageIndex, 0), NPR_STAGE_OWNERS.length - 1)];
}

export function nprWaitingOnManufacturer(status: NewProductRequest["status"]): boolean {
  return status === "submitted" || status === "under_review";
}

export function nprHqMovePending(status: NewProductRequest["status"]): boolean {
  if (status === "rejected" || status === "declined") return false;
  if (status === "approved") return true;
  const { index } = nprStageProgress(status);
  return nprStageOwner(index) === "HQ";
}

export function nprIsUrgent(npr: NewProductRequest): boolean {
  return npr.status === "proposed";
}

export function nprConceptSummary(npr: NewProductRequest): string {
  const spirit = formatBaseSpiritLabel(npr.specs.baseSpirit);
  return `${spirit} · ${npr.specs.packaging.bottleSize} · ${npr.specs.targetAbv}%`;
}

export function nprUpdatedLabel(npr: NewProductRequest): string {
  const raw =
    npr.decidedAt ??
    npr.proposalReceivedAt ??
    npr.reviewStartedAt ??
    npr.submittedAt ??
    npr.requestedAt;
  return new Date(raw).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function nprFeasibilitySummary(npr: NewProductRequest): string {
  if (npr.status === "draft") return "";
  const proposal = npr.manufacturerProposal;
  if (!proposal && nprWaitingOnManufacturer(npr.status)) {
    return "Feasibility review in progress — awaiting manufacturer response.";
  }
  if (!proposal) return "Not yet sent for feasibility review.";
  const parts: string[] = [];
  parts.push(proposal.feasible ? "Feasible" : "Not feasible");
  if (proposal.proposedAbv != null) parts.push(`${proposal.proposedAbv}% ABV proposed`);
  if (proposal.costs?.totalPerBottle != null) {
    parts.push(`$${proposal.costs.totalPerBottle.toFixed(2)}/btl cost`);
  }
  if (proposal.production.fermentationTime) {
    parts.push(`${proposal.production.fermentationTime} fermentation`);
  }
  if (proposal.technicalNotes?.trim()) parts.push(proposal.technicalNotes.trim());
  if (npr.brandDecision?.requestedChanges?.trim()) {
    parts.push(npr.brandDecision.requestedChanges.trim());
  }
  return parts.join(" — ");
}

export function nprConceptBrief(npr: NewProductRequest): string {
  const flavor = npr.specs.flavorProfile.length
    ? `Flavors: ${npr.specs.flavorProfile.join(", ")}. `
    : "";
  const markets = npr.specs.regulatoryMarkets.length
    ? `Markets: ${npr.specs.regulatoryMarkets.join(", ")}. `
    : "";
  const notes = npr.notes?.trim() ?? "";
  return `${flavor}${markets}${notes}`.trim() || "—";
}

export function hqNprDisplayStatus(status: NewProductRequest["status"]): {
  tone: "green" | "blue" | "amber" | "red" | "neutral" | "ink";
  label: string;
} {
  switch (status) {
    case "draft":
      return { tone: "neutral", label: "Concept" };
    case "submitted":
      return { tone: "blue", label: "Feasibility review" };
    case "under_review":
      return { tone: "amber", label: "Feasibility review" };
    case "proposed":
      return { tone: "ink", label: "Proposal" };
    case "approved":
      return { tone: "green", label: "Approved for production" };
    case "rejected":
      return { tone: "red", label: "Rejected" };
    case "declined":
      // HQ Archive and manufacturer feasibility decline both use this status.
      return { tone: "red", label: "Archived" };
    default:
      return { tone: "neutral", label: status };
  }
}

/**
 * Maps a status onto its position in the 4-stage pipeline for the progress
 * stepper. `failed` marks terminal off-track states (rejected / declined).
 */
export function nprStageProgress(status: NewProductRequest["status"]): {
  index: number;
  failed: boolean;
} {
  switch (status) {
    case "draft":
      return { index: 0, failed: false };
    case "submitted":
    case "under_review":
      return { index: 1, failed: false };
    case "proposed":
      return { index: 2, failed: false };
    case "approved":
      return { index: 3, failed: false };
    case "rejected":
      return { index: 2, failed: true };
    case "declined":
      return { index: 1, failed: true };
    default:
      return { index: 0, failed: false };
  }
}

export function nprIsClosed(status: NewProductRequest["status"]): boolean {
  return status === "rejected" || status === "declined";
}

export function filterNprByStatus(requests: NewProductRequest[], filter: HqNprFilterId): NewProductRequest[] {
  // "All" = active pipeline. Archived/closed concepts live under Closed only —
  // matches the design Archive action that removes the card from the main list.
  if (filter === "all") return requests.filter((n) => !nprIsClosed(n.status));
  if (filter === "draft") return requests.filter((n) => n.status === "draft");
  if (filter === "active") {
    return requests.filter((n) => n.status === "submitted" || n.status === "under_review");
  }
  if (filter === "proposed") return requests.filter((n) => n.status === "proposed");
  if (filter === "approved") return requests.filter((n) => n.status === "approved");
  return requests.filter((n) => nprIsClosed(n.status));
}

export function nprSearchMatch(npr: NewProductRequest, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    npr.id.toLowerCase().includes(q) ||
    npr.title.toLowerCase().includes(q) ||
    (npr.assignedManufacturer ?? "").toLowerCase().includes(q) ||
    npr.specs.baseSpirit.toLowerCase().includes(q)
  );
}

export function nprCounts(requests: NewProductRequest[]): Record<HqNprFilterId, number> {
  return {
    all: requests.filter((n) => !nprIsClosed(n.status)).length,
    draft: requests.filter((n) => n.status === "draft").length,
    active: requests.filter((n) => n.status === "submitted" || n.status === "under_review").length,
    proposed: requests.filter((n) => n.status === "proposed").length,
    approved: requests.filter((n) => n.status === "approved").length,
    closed: requests.filter((n) => nprIsClosed(n.status)).length,
  };
}

export function formatNprPerBottle(npr: NewProductRequest): string {
  const cost = npr.manufacturerProposal?.costs.totalPerBottle;
  if (cost == null) return "—";
  return `$${cost.toFixed(2)}`;
}

/** Manufacturer-facing stage label — aligned with HQ pipeline wording. */
export function manufacturerNprStageLabel(status: NewProductRequest["status"]): string {
  switch (status) {
    case "submitted":
    case "under_review":
      return "Feasibility review";
    case "proposed":
      return "Proposal sent";
    case "approved":
      return "Approved for production";
    case "rejected":
      return "Rejected by brand";
    case "declined":
      return "Declined";
    default:
      return hqNprDisplayStatus(status).label;
  }
}

export function manufacturerNprNeedsResponse(status: NewProductRequest["status"]): boolean {
  return status === "submitted" || status === "under_review";
}
