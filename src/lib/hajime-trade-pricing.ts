import type { Product } from "@/data/mockData";

/** Canada trade policy currency (internal). Not Hong Kong export FOB USD. */
export const TRADE_PRICING_CURRENCY = "CAD";

/** Standard bottle ladder — First Press Coffee Rhum and comparable Hajime trade accounts. */
export const TRADE_STANDARD = {
  landedPerBottle: 30,
  sellInPerBottle: 48,
  brokerPerBottle: 3,
  brokerRecurringMin: 1.5,
  brokerRecurringMax: 2,
  wholesalerToRetailPerBottle: 60,
  srpPerBottle: 93,
} as const;

export const TRADE_GUARDRAILS = {
  hajimeNetAfterBrokerMin: 44,
  hajimeNetAfterBrokerWarn: 45,
  wholesalerMarginMinPct: 15,
  wholesalerMarginTargetPct: 20,
  retailerMarginMinPct: 30,
} as const;

export type TradeVolumeTierId = "none" | "up_to_1" | "up_to_2" | "custom";

export const TRADE_VOLUME_TIERS: {
  id: TradeVolumeTierId;
  minBottles: number;
  maxBottles: number | null;
  suggestedDiscount: string;
  whoPaysFirst: string;
  condition: string;
}[] = [
  {
    id: "none",
    minBottles: 1,
    maxBottles: 499,
    suggestedDiscount: "No standard discount",
    whoPaysFirst: "None",
    condition: "Base pricing applies",
  },
  {
    id: "up_to_1",
    minBottles: 500,
    maxBottles: 999,
    suggestedDiscount: "Up to $1.00 / bottle",
    whoPaysFirst: "Wholesaler",
    condition: "Case volume or faster payment",
  },
  {
    id: "up_to_2",
    minBottles: 1000,
    maxBottles: 1999,
    suggestedDiscount: "Up to $2.00 / bottle",
    whoPaysFirst: "Wholesaler, then broker if needed",
    condition: "Larger confirmed order",
  },
  {
    id: "custom",
    minBottles: 2000,
    maxBottles: null,
    suggestedDiscount: "Custom approval only",
    whoPaysFirst: "Shared by approved parties",
    condition: "Pallet, chain, or strategic regional account",
  },
];

export const TRADE_WATERFALL_STEPS = [
  "Retailer requests better price from wholesaler.",
  "Wholesaler first uses its own margin before requesting support.",
  "Broker contribution is optional and only with prior approval.",
  "Hajime contributes only for strategic accounts, meaningful volume, faster payment, or regional expansion.",
  "No discount is approved if it breaks the minimum guardrails.",
] as const;

export const TRADE_APPROVAL_MATRIX: {
  discount: string;
  approval: string;
  typicalUse: string;
}[] = [
  { discount: "Up to $1.00 / bottle", approval: "Wholesaler level", typicalUse: "Case volume, local store deal" },
  {
    discount: "$1.01 to $2.00 / bottle",
    approval: "Wholesaler plus broker discussion",
    typicalUse: "Bigger recurring order",
  },
  {
    discount: "Over $2.00 / bottle",
    approval: "Hajime written approval required",
    typicalUse: "Chain placement, launch account, regional expansion",
  },
  {
    discount: "Custom market program",
    approval: "Hajime management approval",
    typicalUse: "Prestige account, strategic launch, multi-store rollout",
  },
];

export const TRADE_COMMERCIAL_TERMS = [
  "Discounts must be tied to confirmed bottle quantity, payment timing, or strategic account value.",
  "Discounts do not apply retroactively unless approved in writing by Hajime.",
  "Broker may not independently discount Hajime pricing without prior written approval.",
  "For matured recurring accounts, broker commission may step down from $3.00 toward $1.50 to $2.00 per bottle.",
  "All pricing, programs, and trade support should be reviewed quarterly.",
] as const;

export function netAfterBroker(sellInPerBottle: number, brokerPerBottle: number): number {
  return Math.round((sellInPerBottle - brokerPerBottle) * 100) / 100;
}

export function wholesalerMarginPct(sellOutPerBottle: number, sellInPerBottle: number): number | null {
  if (!(sellOutPerBottle > 0)) return null;
  return Math.round(((sellOutPerBottle - sellInPerBottle) / sellOutPerBottle) * 1000) / 10;
}

export function retailerMarginPct(srpPerBottle: number, sellOutPerBottle: number): number | null {
  if (!(srpPerBottle > 0)) return null;
  return Math.round(((srpPerBottle - sellOutPerBottle) / srpPerBottle) * 1000) / 10;
}

/** Any requested discount over $2.00 / bottle needs Hajime written approval. */
export function discountNeedsHajimeApproval(discountPerBottle: number): boolean {
  return discountPerBottle > 2;
}

export function volumeTierForBottles(bottles: number): (typeof TRADE_VOLUME_TIERS)[number] {
  const n = Math.max(0, Math.floor(bottles));
  if (n >= 2000) return TRADE_VOLUME_TIERS[3];
  if (n >= 1000) return TRADE_VOLUME_TIERS[2];
  if (n >= 500) return TRADE_VOLUME_TIERS[1];
  return TRADE_VOLUME_TIERS[0];
}

export function hajimeNetBreaksGuardrail(sellIn: number, broker: number): boolean {
  return netAfterBroker(sellIn, broker) < TRADE_GUARDRAILS.hajimeNetAfterBrokerMin;
}

export function hajimeNetNeedsWarn(sellIn: number, broker: number): boolean {
  const net = netAfterBroker(sellIn, broker);
  return net < TRADE_GUARDRAILS.hajimeNetAfterBrokerWarn && net >= TRADE_GUARDRAILS.hajimeNetAfterBrokerMin;
}

export function applyTradeStandardToProduct(product: Pick<Product, "caseSize"> & Partial<Product>): Partial<Product> {
  const cs = Math.max(1, product.caseSize || 12);
  const roundCase = (perBottle: number) => Math.round(perBottle * cs);
  return {
    manufacturerCasePrice: roundCase(TRADE_STANDARD.landedPerBottle),
    wholesaleCasePrice: roundCase(TRADE_STANDARD.sellInPerBottle),
    distributorSellOutCasePrice: roundCase(TRADE_STANDARD.wholesalerToRetailPerBottle),
    msrpCasePrice: roundCase(TRADE_STANDARD.srpPerBottle),
    brokerCommissionPerBottle: TRADE_STANDARD.brokerPerBottle,
  };
}

export function looksLikeFirstPressSku(product: Pick<Product, "sku" | "name" | "shortDescription">): boolean {
  const blob = `${product.sku} ${product.name} ${product.shortDescription ?? ""}`.toLowerCase();
  return blob.includes("first press") || blob.includes("hjm-fp") || blob.includes("eu-fp") || blob.includes("coffee rhum");
}
