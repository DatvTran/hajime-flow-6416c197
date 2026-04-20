import type { AppData, TeamMember } from "@/types/app-data";
import { TEAM_ROSTER } from "@/data/team-roster";
import seedJson from "@/data/seed-app.json";
import type { Product } from "@/data/mockData";
import { products as PRODUCT_DEFAULTS, newProductRequests as DEFAULT_NEW_PRODUCT_REQUESTS, transferOrders as DEFAULT_TRANSFER_ORDERS, depletionReports as DEFAULT_DEPLETION_REPORTS } from "@/data/mockData";

const ROSTER_EMAILS = new Set(TEAM_ROSTER.map((m) => m.email?.toLowerCase()).filter(Boolean));

const SEED = seedJson as AppData;

const DEFAULT_SAFETY_STOCK: Record<string, number> = {
  "HJM-OG-750": 400,
  "HJM-YZ-750": 200,
  "HJM-OG-375": 300,
  "HJM-SP-750": 150,
  "HJM-FP-750": 180,
};

/** Demo shelf stock for retail low-stock alerts (The Drake — ACC-005). */
const DEFAULT_RETAILER_SHELF: NonNullable<AppData["retailerShelfStock"]> = {
  "ACC-005": { "HJM-OG-750": 36, "HJM-YZ-750": 24 },
};

function mergeProducts(fromPayload: Product[] | undefined, seed: Product[]): Product[] {
  const base = pickOrSeed(fromPayload, seed);
  const defaultsBySku = Object.fromEntries(PRODUCT_DEFAULTS.map((p) => [p.sku, p]));
  return base.map((p) => {
    const d = defaultsBySku[p.sku];
    if (!d) return p;
    return { ...d, ...p, sku: p.sku };
  });
}

/** Persisted API payloads can be wiped; keep demos (Analytics, Orders) usable. */
function pickOrSeed<T>(fromPayload: T[] | undefined, seed: T[]): T[] {
  return Array.isArray(fromPayload) && fromPayload.length > 0 ? fromPayload : seed;
}

/**
 * Canonical roster rows always win for those emails, then any HQ-added members
 * (emails not on the seed roster). Prevents partial persisted data from hiding
 * sales reps / retail / etc. that match login personas and mock orders.
 */
function mergeTeamMembersWithRoster(fromPayload: TeamMember[]): TeamMember[] {
  const extras = fromPayload.filter((m) => {
    if (!m.email) return true; // Keep members without email (they're not in roster)
    return !ROSTER_EMAILS.has(m.email?.toLowerCase() || "");
  });
  return [...TEAM_ROSTER, ...extras];
}

export function normalizeAppData(raw: AppData): AppData {
  const teamFromPayload = Array.isArray(raw.teamMembers) ? raw.teamMembers : [];
  const teamMembers =
    teamFromPayload.length > 0 ? mergeTeamMembersWithRoster(teamFromPayload) : [...TEAM_ROSTER];

  const op = raw.operationalSettings ?? SEED.operationalSettings;
  const operationalSettings = {
    manufacturerLeadTimeDays: op?.manufacturerLeadTimeDays ?? 45,
    safetyStockBySku: { ...DEFAULT_SAFETY_STOCK, ...op?.safetyStockBySku },
    retailerStockThresholdBottles: op?.retailerStockThresholdBottles ?? 48,
  };

  const retailerShelfStock: NonNullable<AppData["retailerShelfStock"]> = {
    ...DEFAULT_RETAILER_SHELF,
    ...(typeof raw.retailerShelfStock === "object" && raw.retailerShelfStock ? raw.retailerShelfStock : {}),
  };

  return {
    ...raw,
    products: mergeProducts(raw.products, SEED.products),
    salesOrders: pickOrSeed(raw.salesOrders, SEED.salesOrders),
    accounts: pickOrSeed(raw.accounts, SEED.accounts),
    inventory: pickOrSeed(raw.inventory, SEED.inventory),
    version: raw.version ?? 1,
    operationalSettings,
    auditLogs: Array.isArray(raw.auditLogs) ? raw.auditLogs : [],
    teamMembers,
    financingLedger: Array.isArray(raw.financingLedger) ? raw.financingLedger : [],
    retailerShelfStock,
    visitNotes: Array.isArray(raw.visitNotes) ? raw.visitNotes : [],
    newProductRequests: pickOrSeed(raw.newProductRequests, DEFAULT_NEW_PRODUCT_REQUESTS),
    transferOrders: pickOrSeed(raw.transferOrders, DEFAULT_TRANSFER_ORDERS),
    depletionReports: pickOrSeed(raw.depletionReports, DEFAULT_DEPLETION_REPORTS),
    purchaseOrders: pickOrSeed(raw.purchaseOrders, SEED.purchaseOrders),
    shipments: pickOrSeed(raw.shipments, SEED.shipments),
    productionStatuses: pickOrSeed(raw.productionStatuses, SEED.productionStatuses),
  };
}
