import type { LucideIcon } from "lucide-react";
import { FlaskConical, Store, Truck, Users } from "lucide-react";

export type HqIncentiveProgramId = "retail" | "sales-rep" | "distributor" | "kura";

export type HqIncentiveTierRow = {
  id: string;
  name: string;
  threshold: string;
  reward: string;
  memberCount: number;
  color: string;
};

export type HqIncentiveRuleRow = {
  id: string;
  name: string;
  type: string;
  rateLabel: string;
  period: string;
  active: boolean;
  trigger: string;
};

export type HqIncentiveClaimRow = {
  id: string;
  by: string;
  account: string;
  date: string;
  amount: string;
  status: "approved" | "pending" | "rejected";
  ruleName: string;
};

export type HqIncentiveProgramConfig = {
  id: HqIncentiveProgramId;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconClass: string;
  iconStyle?: { background: string; color: string };
  membersLabel: string;
  q2Payout: string;
  rewardStructure: string;
  period: string;
  budgetCap: string;
  spentLabel: string;
  trigger: string;
  conditions: string;
  active: boolean;
  tiers: HqIncentiveTierRow[];
  rules: HqIncentiveRuleRow[];
  claims: HqIncentiveClaimRow[];
};

const STORAGE_PREFIX = "hajime_hq_incentive_program_";

export const HQ_INCENTIVE_PROGRAM_IDS: HqIncentiveProgramId[] = [
  "retail",
  "sales-rep",
  "distributor",
  "kura",
];

const BASE_PROGRAMS: Record<HqIncentiveProgramId, HqIncentiveProgramConfig> = {
  retail: {
    id: "retail",
    title: "Retail Partner Program",
    subtitle: "Spend-based tiers · quarterly rebate",
    icon: Store,
    iconClass: "hq-kpi-ic-gold",
    membersLabel: "42 stores",
    q2Payout: "$18.6K",
    rewardStructure: "2–4% rebate",
    period: "rolling-12mo",
    budgetCap: "Unlimited",
    spentLabel: "$18,600",
    trigger:
      "Net spend on Hajime SKUs over a rolling 12-month window determines tier. Rebates credit on the next invoice within 15 days of quarter close.",
    conditions:
      "Tier discounts apply to future orders only. Not stackable with one-time launch promos on the same SKU line. Accounts must remain in good standing.",
    active: true,
    tiers: [
      { id: "t1", name: "Participant", threshold: "$0", reward: "0% rebate", memberCount: 12, color: "hsl(var(--muted-foreground))" },
      { id: "t2", name: "Bronze", threshold: "$10K", reward: "2% rebate", memberCount: 14, color: "hsl(30 50% 50%)" },
      { id: "t3", name: "Silver", threshold: "$25K", reward: "3% rebate", memberCount: 11, color: "hsl(220 8% 60%)" },
      { id: "t4", name: "Gold", threshold: "$40K", reward: "4% rebate", memberCount: 4, color: "hsl(40 88% 42%)" },
      { id: "t5", name: "Platinum", threshold: "$50K", reward: "4% + menu support", memberCount: 1, color: "hsl(215 72% 50%)" },
    ],
    rules: [
      { id: "INC-T01", name: "Loyalty tier rewards", type: "Loyalty", rateLabel: "Tiered %", period: "rolling-12mo", active: true, trigger: "Spend-based tier with compounding discount" },
      { id: "INC-T02", name: "Volume case discount", type: "Volume", rateLabel: "3–8%", period: "per-order", active: true, trigger: "3% on 10+ cases; 5% on 25+; 8% on 50+" },
      { id: "INC-T03", name: "Featured cocktail promotion", type: "Menu", rateLabel: "$200", period: "quarterly", active: true, trigger: "Feature a Hajime cocktail on menu for full quarter" },
      { id: "INC-T04", name: "Early adopter — new SKU", type: "Launch", rateLabel: "10%", period: "per-sku", active: true, trigger: "First order of new SKU within 60 days of release" },
    ],
    claims: [
      { id: "CLM-010", by: "The Drake Hotel", account: "The Drake Hotel", date: "28 May", amount: "$654", status: "approved", ruleName: "Q1 tier rebate" },
      { id: "CLM-011", by: "Gramercy Tavern", account: "Gramercy Tavern", date: "15 May", amount: "$420", status: "approved", ruleName: "Volume case discount" },
      { id: "CLM-012", by: "Dante", account: "Dante", date: "8 May", amount: "$200", status: "pending", ruleName: "Featured cocktail promotion" },
    ],
  },
  "sales-rep": {
    id: "sales-rep",
    title: "Sales Rep Incentive",
    subtitle: "Quota attainment · commission + bonuses",
    icon: Users,
    iconClass: "hq-kpi-ic-blue",
    membersLabel: "12 reps",
    q2Payout: "$38.4K",
    rewardStructure: "6–12% commission",
    period: "quarterly",
    budgetCap: "$48,000",
    spentLabel: "$38,400",
    trigger:
      "SPIFs pay on verified placement events. Monthly attainment bonus pays on net shipped revenue above target. New account and reorder bonuses auto-detect from order data where possible.",
    conditions:
      "One SPIF claim per SKU per account per quarter. Photo evidence required for menu placements. Attainment calculated 30 days after month close.",
    active: true,
    tiers: [
      { id: "t1", name: "Standard", threshold: "< 80% quota", reward: "6% commission", memberCount: 3, color: "hsl(var(--muted-foreground))" },
      { id: "t2", name: "Silver", threshold: "80–99% quota", reward: "8% commission", memberCount: 4, color: "hsl(220 8% 60%)" },
      { id: "t3", name: "Gold", threshold: "100–119% quota", reward: "10% + $5K bonus", memberCount: 4, color: "hsl(40 88% 42%)" },
      { id: "t4", name: "Platinum", threshold: "120%+ quota", reward: "12% + President's Club", memberCount: 1, color: "hsl(215 72% 50%)" },
    ],
    rules: [
      { id: "INC-R01", name: "SPIF — On-premise", type: "SPIF", rateLabel: "$150", period: "per-event", active: true, trigger: "New menu/backbar placement at restaurant, bar or hotel" },
      { id: "INC-R02", name: "SPIF — Off-premise", type: "SPIF", rateLabel: "$100", period: "per-event", active: true, trigger: "New shelf placement at retail or specialty" },
      { id: "INC-R03", name: "Monthly target attainment", type: "Attainment", rateLabel: "5–12%", period: "monthly", active: true, trigger: "Bonus on revenue above monthly target when target is hit" },
      { id: "INC-R04", name: "New account bonus", type: "Expansion", rateLabel: "$400", period: "per-event", active: true, trigger: "New account opened with first fulfilled order" },
      { id: "INC-R05", name: "Reorder incentive", type: "Reorder", rateLabel: "$5/case", period: "per-event", active: true, trigger: "Reorder within 30 days of prior delivery (min 6 cases)" },
      { id: "INC-R06", name: "Tasting event bonus", type: "Event", rateLabel: "$25", period: "per-event", active: true, trigger: "Facilitated tasting with 4+ guests" },
    ],
    claims: [
      { id: "CLM-001", by: "Mike Tan", account: "Dante", date: "25 Apr", amount: "$150", status: "approved", ruleName: "SPIF — On-premise" },
      { id: "CLM-002", by: "Mike Tan", account: "Katana Kitten", date: "25 Apr", amount: "$150", status: "pending", ruleName: "SPIF — On-premise" },
      { id: "CLM-004", by: "Elena Murphy", account: "The Drake Hotel", date: "20 Apr", amount: "$150", status: "approved", ruleName: "SPIF — On-premise" },
      { id: "CLM-005", by: "Mike Tan", account: "Bar Suntory", date: "24 Apr", amount: "$5", status: "pending", ruleName: "Reorder incentive" },
    ],
  },
  distributor: {
    id: "distributor",
    title: "Distributor Partner Program",
    subtitle: "Fill rate, on-time & volume",
    icon: Truck,
    iconClass: "hq-kpi-ic-green",
    membersLabel: "4 distributors",
    q2Payout: "$11.8K",
    rewardStructure: "3–4% volume rebate",
    period: "quarterly",
    budgetCap: "$24,000",
    spentLabel: "$11,800",
    trigger:
      "Volume rebates accrue on wholesale sell-in cases. Fill rate and on-time delivery bonuses use shipment and depletion data. Fast-pay discount credits next invoice.",
    conditions:
      "Volume bonus stacks across SKUs. Depletion accuracy requires submission by last business day of month. New retail door bonus confirms on second order within 60 days.",
    active: true,
    tiers: [
      { id: "t1", name: "Standard", threshold: "New partner", reward: "2% volume", memberCount: 0, color: "hsl(var(--muted-foreground))" },
      { id: "t2", name: "Silver", threshold: "94%+ fill", reward: "3% volume", memberCount: 2, color: "hsl(220 8% 60%)" },
      { id: "t3", name: "Gold", threshold: "97%+ fill · 94% OT", reward: "4% volume", memberCount: 2, color: "hsl(40 88% 42%)" },
      { id: "t4", name: "Platinum", threshold: "99%+ · strategic", reward: "4% + co-op", memberCount: 0, color: "hsl(215 72% 50%)" },
    ],
    rules: [
      { id: "INC-D01", name: "Volume purchase bonus", type: "Volume", rateLabel: "Tiered $", period: "monthly", active: true, trigger: "Per every 200 cases purchased in a calendar month" },
      { id: "INC-D02", name: "Depletion accuracy bonus", type: "Reporting", rateLabel: "$250", period: "monthly", active: true, trigger: "Depletion filed on time with <5% variance" },
      { id: "INC-D03", name: "Fast-pay discount", type: "Finance", rateLabel: "2%", period: "per-invoice", active: true, trigger: "Paid within 10 days of receipt" },
      { id: "INC-D04", name: "New retail door bonus", type: "Expansion", rateLabel: "$300", period: "per-event", active: true, trigger: "New retail account with first fulfilled order" },
    ],
    claims: [
      { id: "CLM-020", by: "Empire Wines", account: "Empire Wines & Spirits", date: "30 Apr", amount: "$750", status: "approved", ruleName: "Volume purchase bonus" },
      { id: "CLM-021", by: "Midwest Spirits", account: "Midwest Spirits Co.", date: "28 Apr", amount: "$500", status: "approved", ruleName: "Volume purchase bonus" },
      { id: "CLM-022", by: "Kanto Beverage", account: "Kanto Beverage", date: "15 Apr", amount: "$250", status: "pending", ruleName: "Depletion accuracy bonus" },
    ],
  },
  kura: {
    id: "kura",
    title: "Manufacturer Partner Program",
    subtitle: "Quality, yield & on-time production",
    icon: FlaskConical,
    iconClass: "",
    iconStyle: { background: "hsl(280 40% 50% / 0.1)", color: "hsl(280 40% 48%)" },
    membersLabel: "2 manufacturer partners",
    q2Payout: "¥3.2M",
    rewardStructure: "¥2–3/bottle premium",
    period: "quarterly",
    budgetCap: "¥5M",
    spentLabel: "¥3.2M",
    trigger:
      "Quality premium pays on batches meeting spec at bottling. Preferred tier unlocks priority rice allocation. Master tier requires 99% quality, 95% yield, and 97% on-time over trailing 4 quarters.",
    conditions:
      "Premiums paid quarterly on approved batches only. Rice subsidy drawdown tracked against annual cap. Co-branded label program requires Master tier approval.",
    active: true,
    tiers: [
      { id: "t1", name: "Standard", threshold: "Onboarded manufacturer partner", reward: "¥1.5/btl", memberCount: 1, color: "hsl(var(--muted-foreground))" },
      { id: "t2", name: "Preferred", threshold: "97% quality · 94% OT", reward: "¥2/btl + rice priority", memberCount: 1, color: "hsl(40 88% 42%)" },
      { id: "t3", name: "Master", threshold: "99% · 95% yield · 97% OT", reward: "¥3/btl + co-brand", memberCount: 0, color: "hsl(215 72% 50%)" },
    ],
    rules: [
      { id: "INC-K01", name: "Quality premium", type: "Quality", rateLabel: "¥2/btl", period: "quarterly", active: true, trigger: "Batch passes QC at bottling with no holds" },
      { id: "INC-K02", name: "On-time production bonus", type: "Attainment", rateLabel: "¥400K", period: "quarterly", active: true, trigger: "95%+ batches delivered within agreed window" },
      { id: "INC-K03", name: "Rice subsidy fund", type: "Co-op", rateLabel: "¥600K/yr", period: "annual", active: true, trigger: "Drawdown against contracted Yamada Nishiki supply" },
      { id: "INC-K04", name: "Yield excellence", type: "Quality", rateLabel: "+¥0.5/btl", period: "per-batch", active: false, trigger: "Yield above 72% on daiginjo spec" },
    ],
    claims: [
      { id: "CLM-030", by: "Kuramoto Brewing", account: "Kuramoto Brewing", date: "1 Apr", amount: "¥1.84M", status: "approved", ruleName: "Quality premium Q2" },
      { id: "CLM-031", by: "Echigo Kura", account: "Echigo Kura", date: "1 Apr", amount: "¥620K", status: "approved", ruleName: "Quality premium Q2" },
      { id: "CLM-032", by: "Kuramoto Brewing", account: "Kuramoto Brewing", date: "12 May", amount: "¥180K", status: "pending", ruleName: "Rice subsidy draw" },
    ],
  },
};

export function isHqIncentiveProgramId(id: string): id is HqIncentiveProgramId {
  return HQ_INCENTIVE_PROGRAM_IDS.includes(id as HqIncentiveProgramId);
}

export function incentiveProgramEditPath(id: HqIncentiveProgramId): string {
  return `/incentives/${id}/edit`;
}

export function loadHqIncentiveProgram(id: HqIncentiveProgramId): HqIncentiveProgramConfig {
  const base = BASE_PROGRAMS[id];
  const snapshot: HqIncentiveProgramConfig = {
    ...base,
    tiers: base.tiers.map((t) => ({ ...t })),
    rules: base.rules.map((r) => ({ ...r })),
    claims: base.claims.map((c) => ({ ...c })),
  };
  if (typeof window === "undefined") return snapshot;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
    if (!raw) return snapshot;
    const parsed = JSON.parse(raw) as Partial<Omit<HqIncentiveProgramConfig, "icon" | "iconClass" | "iconStyle">>;
    return {
      ...snapshot,
      ...parsed,
      id,
      icon: base.icon,
      iconClass: base.iconClass,
      iconStyle: base.iconStyle,
      tiers: parsed.tiers ?? snapshot.tiers,
      rules: parsed.rules ?? snapshot.rules,
      claims: parsed.claims ?? snapshot.claims,
    };
  } catch {
    return snapshot;
  }
}

export function saveHqIncentiveProgram(config: HqIncentiveProgramConfig): void {
  if (typeof window === "undefined") return;
  const payload = {
    id: config.id,
    title: config.title,
    subtitle: config.subtitle,
    membersLabel: config.membersLabel,
    q2Payout: config.q2Payout,
    rewardStructure: config.rewardStructure,
    period: config.period,
    budgetCap: config.budgetCap,
    spentLabel: config.spentLabel,
    trigger: config.trigger,
    conditions: config.conditions,
    active: config.active,
    tiers: config.tiers,
    rules: config.rules,
    claims: config.claims,
  };
  localStorage.setItem(`${STORAGE_PREFIX}${config.id}`, JSON.stringify(payload));
}
