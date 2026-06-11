import type { Account } from "@/data/mockData";
import type { SalesRepOpportunity } from "@/lib/sales-rep-opportunities";

export const PIPELINE_STAGES = [
  { id: "Prospect", color: "text-muted-foreground" },
  { id: "Contacted", color: "text-[hsl(215_72%_42%)]" },
  { id: "Tasting", color: "text-[hsl(30_80%_30%)]" },
  { id: "Proposal", color: "text-[hsl(40_88%_36%)]" },
  { id: "Closing", color: "text-[hsl(158_56%_30%)]" },
] as const;

export type PipelineStageId = (typeof PIPELINE_STAGES)[number]["id"];

export type PipelineAgeVariant = "ok" | "warn" | "late";

export interface PipelineCardView extends SalesRepOpportunity {
  stage: PipelineStageId;
  opportunityTitle: string;
  nextAction: string;
  ageLabel: string;
  ageVariant: PipelineAgeVariant;
  displayValue: number;
}

function opportunityTitle(opp: SalesRepOpportunity): string {
  switch (opp.type) {
    case "prospect":
      return "New listing";
    case "reorder":
      return "Reorder cycle";
    case "velocity_drop":
      return "Sell-in recovery";
    case "dormant":
      return "Reactivation";
    default:
      return "Territory opportunity";
  }
}

function stageForOpportunity(opp: SalesRepOpportunity): PipelineStageId {
  switch (opp.type) {
    case "prospect":
      return "Prospect";
    case "reorder":
      return opp.priority === "high" ? "Closing" : "Proposal";
    case "velocity_drop":
      return "Tasting";
    case "dormant":
      return opp.priority === "high" ? "Proposal" : "Contacted";
    default:
      return "Contacted";
  }
}

function ageMeta(days: number): { label: string; variant: PipelineAgeVariant } {
  if (days >= 999) return { label: "New", variant: "ok" };
  if (days === 0) return { label: "Today", variant: "warn" };
  if (days > 10) return { label: `${days}d`, variant: "late" };
  if (days >= 6) return { label: `${days}d`, variant: "warn" };
  return { label: `${days}d`, variant: "ok" };
}

function displayValueFor(opp: SalesRepOpportunity): number {
  if (opp.value > 0) return opp.value;
  if (opp.type === "prospect") return 2400;
  return 1800;
}

/** Map computed rep signals into CRM-style pipeline cards (sales-rep-app.html). */
export function toPipelineCards(opportunities: SalesRepOpportunity[]): PipelineCardView[] {
  return opportunities.map((opp) => {
    const { label, variant } = ageMeta(opp.lastOrderDays);
    return {
      ...opp,
      stage: stageForOpportunity(opp),
      opportunityTitle: opportunityTitle(opp),
      nextAction: opp.suggestedAction,
      ageLabel: label,
      ageVariant: variant,
      displayValue: displayValueFor(opp),
    };
  });
}

export function groupPipelineByStage(cards: PipelineCardView[]): Record<PipelineStageId, PipelineCardView[]> {
  const grouped = Object.fromEntries(PIPELINE_STAGES.map((s) => [s.id, [] as PipelineCardView[]])) as Record<
    PipelineStageId,
    PipelineCardView[]
  >;
  for (const card of cards) {
    grouped[card.stage].push(card);
  }
  return grouped;
}

export function pipelineStageTotals(cards: PipelineCardView[]): Record<PipelineStageId, { value: number; count: number }> {
  const grouped = groupPipelineByStage(cards);
  return Object.fromEntries(
    PIPELINE_STAGES.map((s) => {
      const col = grouped[s.id];
      return [
        s.id,
        {
          value: col.reduce((sum, c) => sum + c.displayValue, 0),
          count: col.length,
        },
      ];
    }),
  ) as Record<PipelineStageId, { value: number; count: number }>;
}

/** Subtitle territory line — e.g. "NYC territory" from assigned account cities. */
export function salesRepTerritoryLabel(accounts: Account[] | undefined): string {
  const list = accounts ?? [];
  const cities = list.map((a) => a.city?.trim()).filter((c): c is string => Boolean(c));
  if (cities.length === 0) return "Your territory";
  const freq = new Map<string, number>();
  for (const city of cities) freq.set(city, (freq.get(city) ?? 0) + 1);
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
  return `${top} territory`;
}

export function stagePillClass(stage: PipelineStageId): string {
  switch (stage) {
    case "Prospect":
      return "border-border bg-muted text-muted-foreground";
    case "Contacted":
      return "border-[hsl(215_72%_50%/0.2)] bg-[hsl(215_72%_50%/0.08)] text-[hsl(215_72%_38%)]";
    case "Tasting":
      return "border-[hsl(38_90%_50%/0.25)] bg-[hsl(38_90%_50%/0.1)] text-[hsl(30_80%_30%)]";
    case "Proposal":
      return "border-[hsl(215_72%_50%/0.2)] bg-[hsl(215_72%_50%/0.08)] text-[hsl(215_72%_38%)]";
    case "Closing":
      return "border-[hsl(158_56%_36%/0.2)] bg-[hsl(158_56%_36%/0.08)] text-[hsl(158_56%_26%)]";
  }
}

export function ageBadgeClass(variant: PipelineAgeVariant): string {
  switch (variant) {
    case "ok":
      return "bg-[hsl(158_56%_36%/0.1)] text-[hsl(158_56%_28%)]";
    case "warn":
      return "bg-[hsl(38_90%_50%/0.1)] text-[hsl(30_80%_30%)]";
    case "late":
      return "bg-[hsl(0_68%_48%/0.1)] text-[hsl(0_68%_38%)]";
  }
}
