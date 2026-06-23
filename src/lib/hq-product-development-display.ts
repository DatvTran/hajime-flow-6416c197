import type { NewProductRequest } from "@/data/mockData";

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

export function hqNprDisplayStatus(status: NewProductRequest["status"]): {
  tone: "green" | "blue" | "amber" | "red" | "neutral" | "ink";
  label: string;
} {
  switch (status) {
    case "draft":
      return { tone: "neutral", label: "draft" };
    case "submitted":
      return { tone: "blue", label: "submitted" };
    case "under_review":
      return { tone: "amber", label: "under review" };
    case "proposed":
      return { tone: "ink", label: "proposal received" };
    case "approved":
      return { tone: "green", label: "approved" };
    case "rejected":
    case "declined":
      return { tone: "red", label: status === "declined" ? "declined" : "rejected" };
    default:
      return { tone: "neutral", label: status };
  }
}

export function filterNprByStatus(requests: NewProductRequest[], filter: HqNprFilterId): NewProductRequest[] {
  if (filter === "all") return requests;
  if (filter === "draft") return requests.filter((n) => n.status === "draft");
  if (filter === "active") {
    return requests.filter((n) => n.status === "submitted" || n.status === "under_review");
  }
  if (filter === "proposed") return requests.filter((n) => n.status === "proposed");
  if (filter === "approved") return requests.filter((n) => n.status === "approved");
  return requests.filter((n) => n.status === "rejected" || n.status === "declined");
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
    all: requests.length,
    draft: requests.filter((n) => n.status === "draft").length,
    active: requests.filter((n) => n.status === "submitted" || n.status === "under_review").length,
    proposed: requests.filter((n) => n.status === "proposed").length,
    approved: requests.filter((n) => n.status === "approved").length,
    closed: requests.filter((n) => n.status === "rejected" || n.status === "declined").length,
  };
}

export function formatNprPerBottle(npr: NewProductRequest): string {
  const cost = npr.manufacturerProposal?.costs.totalPerBottle;
  if (cost == null) return "—";
  return `$${cost.toFixed(2)}`;
}
