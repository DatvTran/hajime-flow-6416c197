import type { AppData, TeamMember, Warehouse } from "@/types/app-data";
import { TEAM_ROSTER } from "@/data/team-roster";
import seedJson from "@/data/seed-app.json";
import type { Account, Product } from "@/data/mockData";
import { products as PRODUCT_DEFAULTS, newProductRequests as DEFAULT_NEW_PRODUCT_REQUESTS, transferOrders as DEFAULT_TRANSFER_ORDERS, depletionReports as DEFAULT_DEPLETION_REPORTS } from "@/data/mockData";
import { isDistributorAccountType } from "@/lib/distributor-accounts";

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

const DEFAULT_WAREHOUSES: Warehouse[] = [
  { id: "seed-wh-toronto", name: "Toronto Main Warehouse", isActive: true, sortOrder: 0 },
  { id: "seed-wh-milan", name: "Milan Depot", isActive: true, sortOrder: 1 },
];

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
 * Seed roster guarantees demo logins always appear. For any email that exists in both
 * the seed roster and the API payload, prefer the DB-backed row so HQ edits / CRM
 * duplicates are visible instead of being silently replaced by seed-only rows.
 */
function mergeTeamMembersWithRoster(fromPayload: TeamMember[]): TeamMember[] {
  const byEmail = new Map(
    fromPayload.map((m) => [m.email?.toLowerCase().trim() || "", m] as const),
  );
  const rosterEmails = new Set(
    TEAM_ROSTER.map((m) => m.email?.toLowerCase()).filter(Boolean) as string[],
  );

  const mergedRoster = TEAM_ROSTER.map((seed) => {
    const key = seed.email?.toLowerCase().trim() || "";
    const fromDb = key ? byEmail.get(key) : undefined;
    if (fromDb) return fromDb;
    return seed;
  });

  const extras = fromPayload.filter((m) => {
    const e = m.email?.toLowerCase().trim() || "";
    if (!e) return true;
    return !rosterEmails.has(e);
  });

  return [...mergedRoster, ...extras];
}

/**
 * When the API returns accounts but none are wholesalers, `pickOrSeed` keeps only
 * API rows — wholesale flows lose distributor options. Backfill distributor rows
 * from seed so DC selection and demos stay usable.
 */
function mergeSeedDistributorsWhenAbsent(accounts: Account[]): Account[] {
  if (!Array.isArray(accounts) || accounts.length === 0) return accounts;
  if (accounts.some((a) => isDistributorAccountType(a.type))) return accounts;
  const seedAccounts = SEED.accounts ?? [];
  const ids = new Set(accounts.map((a) => a.id));
  const extras = seedAccounts.filter(
    (a) => isDistributorAccountType(a.type) && !ids.has(a.id),
  );
  return extras.length ? [...accounts, ...extras] : accounts;
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
    companyName: op?.companyName,
    primaryMarkets: op?.primaryMarkets,
    manufacturerName: op?.manufacturerName,
  };

  const retailerShelfStock: NonNullable<AppData["retailerShelfStock"]> = {
    ...DEFAULT_RETAILER_SHELF,
    ...(typeof raw.retailerShelfStock === "object" && raw.retailerShelfStock ? raw.retailerShelfStock : {}),
  };

  const accountsMerged = mergeSeedDistributorsWhenAbsent(
    pickOrSeed(raw.accounts, SEED.accounts),
  );

  return {
    ...raw,
    products: mergeProducts(raw.products, SEED.products),
    salesOrders: pickOrSeed(raw.salesOrders, SEED.salesOrders),
    accounts: accountsMerged,
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
    warehouses: pickOrSeed(raw.warehouses, DEFAULT_WAREHOUSES),
  };
}
