export const EXPO_BUSINESS_TYPES = [
  { value: "importer_distributor", label: "Importer / Distributor" },
  { value: "retailer", label: "Retailer" },
  { value: "hospitality", label: "Hotel / Restaurant / Bar" },
  { value: "duty_free", label: "Duty Free / Travel Retail" },
  { value: "media", label: "Media / Press" },
  { value: "other", label: "Other" },
] as const;

export const EXPO_EXPRESSIONS = [
  { value: "first_press", label: "First Press Coffee Rhum" },
  { value: "yuzu_mint", label: "Yuzu Mint Rhum" },
  { value: "both", label: "Both" },
] as const;

export const EXPO_INTERESTS = [
  { value: "distribution", label: "Distribution" },
  { value: "importing", label: "Importing" },
  { value: "retail_placement", label: "Retail placement" },
  { value: "hospitality_placement", label: "Hospitality placement" },
  { value: "duty_free", label: "Duty-free" },
  { value: "samples", label: "Samples" },
  { value: "pricing", label: "Pricing" },
  { value: "media_pr", label: "Media/PR" },
  { value: "other", label: "Other" },
] as const;

export const EXPO_BOTTLE_FORMATS = [
  { value: "750ml", label: "750 ml" },
  { value: "200ml", label: "200 ml" },
  { value: "both", label: "Both" },
] as const;

export const EXPO_VOLUMES = [
  { value: "exploring", label: "Exploring" },
  { value: "under_25", label: "Under 25 cases" },
  { value: "25_99", label: "25–99 cases" },
  { value: "100_249", label: "100–249 cases" },
  { value: "250_plus", label: "250+ cases" },
  { value: "na", label: "Not applicable" },
] as const;

export const EXPO_TERRITORIES = [
  { value: "yes", label: "Yes" },
  { value: "possibly", label: "Possibly" },
  { value: "no", label: "No" },
] as const;

export const EXPO_TIMINGS = [
  { value: "immediately", label: "Immediately" },
  { value: "1_3_months", label: "1–3 months" },
  { value: "3_6_months", label: "3–6 months" },
  { value: "6_plus", label: "6+ months" },
  { value: "exploring", label: "Exploring" },
] as const;

export const EXPO_SCORES = [
  { value: "A", label: "A — Priority" },
  { value: "B", label: "B — Qualified" },
  { value: "C", label: "C — Nurture" },
  { value: "D", label: "D — General" },
] as const;

export const EXPO_STATUSES = [
  { value: "new", label: "New" },
  { value: "met", label: "Met" },
  { value: "follow_up", label: "Follow-up" },
  { value: "converted", label: "Converted" },
  { value: "closed", label: "Closed" },
] as const;

export type ExpoLead = {
  id: string;
  eventCode: string;
  seq: number;
  displayId: string;
  fullName: string;
  companyName: string;
  jobTitle: string;
  businessEmail: string;
  mobile: string | null;
  countryMarket: string;
  companyWebsite: string | null;
  businessType: string;
  expression: string;
  interests: string[];
  bottleFormat: string | null;
  volume: string | null;
  territory: string | null;
  timing: string | null;
  message: string | null;
  consentAt: string;
  submittedAt: string;
  metAt: string | null;
  score: "A" | "B" | "C" | "D" | null;
  staffUserId: string | null;
  staffName: string | null;
  tastingCompleted: boolean;
  sampleRequested: boolean;
  pricingRequested: boolean;
  distributorDeckSent: boolean;
  nextAction: string | null;
  followUpOn: string | null;
  status: string;
  accountId: string | null;
};

export type ExpoLeadPublicSubmit = {
  displayId: string;
  submittedAt: string;
};

function labelOf<T extends { value: string; label: string }>(opts: readonly T[], value: string | null | undefined): string {
  if (!value) return "—";
  return opts.find((o) => o.value === value)?.label ?? value;
}

export function slaForScore(score: ExpoLead["score"]): string {
  if (score === "A") return "Follow up within 24 hours";
  if (score === "B") return "Follow up within 3 days";
  if (score === "C") return "Nurture within 14 days";
  if (score === "D") return "General — no rush";
  return "Score after the conversation";
}

export function expressionHeadline(expression: string | null | undefined): string {
  if (expression === "both") return "Both SKUs";
  if (expression === "first_press") return "First Press";
  if (expression === "yuzu_mint") return "Yuzu Mint";
  return "—";
}

export function businessHeadline(businessType: string | null | undefined): string {
  if (businessType === "importer_distributor") return "Distributor";
  return labelOf(EXPO_BUSINESS_TYPES, businessType);
}

export function volumeHeadline(volume: string | null | undefined): string {
  if (volume === "100_249") return "100–249 cases";
  if (volume === "250_plus") return "250+ cases";
  if (volume === "25_99") return "25–99 cases";
  if (volume === "under_25") return "Under 25 cases";
  if (volume === "exploring") return "Exploring";
  if (volume === "na") return "N/A volume";
  return "—";
}

export function formatExpoLeadHeadline(lead: Pick<ExpoLead, "score" | "countryMarket" | "businessType" | "expression" | "volume">): string {
  const scoreBit =
    lead.score === "A"
      ? "A PRIORITY"
      : lead.score === "B"
        ? "B QUALIFIED"
        : lead.score === "C"
          ? "C NURTURE"
          : lead.score === "D"
            ? "D GENERAL"
            : "UNSCORED";
  return [
    scoreBit,
    lead.countryMarket,
    businessHeadline(lead.businessType),
    expressionHeadline(lead.expression),
    volumeHeadline(lead.volume),
    slaForScore(lead.score),
  ].join(" — ");
}

export function optionLabel(
  kind: "business" | "expression" | "volume" | "format" | "timing" | "territory" | "status" | "score" | "interest",
  value: string | null | undefined,
): string {
  if (kind === "business") return labelOf(EXPO_BUSINESS_TYPES, value);
  if (kind === "expression") return labelOf(EXPO_EXPRESSIONS, value);
  if (kind === "volume") return labelOf(EXPO_VOLUMES, value);
  if (kind === "format") return labelOf(EXPO_BOTTLE_FORMATS, value);
  if (kind === "timing") return labelOf(EXPO_TIMINGS, value);
  if (kind === "territory") return labelOf(EXPO_TERRITORIES, value);
  if (kind === "status") return labelOf(EXPO_STATUSES, value);
  if (kind === "score") return labelOf(EXPO_SCORES, value);
  return labelOf(EXPO_INTERESTS, value);
}
