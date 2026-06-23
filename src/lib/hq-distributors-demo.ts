import type { Account, InventoryItem } from "@/data/mockData";
import type { DistributorOrganizationRow } from "@/lib/api-v1-mutations";
import type { DistributorPartnerRow } from "@/lib/hq-distributors-metrics";
import type { DistributorPartnerDetail, DcInventoryRow, ReplenishmentRow } from "@/lib/hq-distributor-partner-detail";
import {
  buildHqDistributorNetworkInventory,
  HQ_DISTRIBUTOR_DEMO_ORGS,
  networkRetailCountForOrg,
  type HqDistributorDemoOrgId,
} from "@/lib/hq-distributor-network-demo";

export { HQ_DISTRIBUTOR_DEMO_ORGS, type HqDistributorDemoOrgId } from "@/lib/hq-distributor-network-demo";

export const HQ_DISTRIBUTORS_DEMO_ROWS: DistributorPartnerRow[] = [
  {
    id: "demo-empire",
    orgId: HQ_DISTRIBUTOR_DEMO_ORGS.EMPIRE,
    name: "Empire Wines & Spirits",
    marketLine: "NYC · Jordan Wei",
    tier: "Gold Partner",
    tierIsGold: true,
    fillRate: 97.8,
    onTime: 94.2,
    accountCount: networkRetailCountForOrg(HQ_DISTRIBUTOR_DEMO_ORGS.EMPIRE),
    statusTone: "green",
    statusLabel: "active",
    account: {
      id: "demo-empire",
      legalName: "Empire Wines & Spirits",
      tradingName: "Empire Wines & Spirits",
      city: "NYC",
      type: "distributor",
      country: "US",
      contactName: "Jordan Wei",
      contactRole: "Operations Lead",
      phone: "+1 (212) 555-0148",
      email: "jordan.wei@empirewines.com",
      salesOwner: "Jordan Wei",
      paymentTerms: "Net 30",
      status: "active",
      firstOrderDate: "2024-10-01",
      lastOrderDate: "2026-06-01",
      tags: ["gold"],
    } as DistributorPartnerRow["account"],
  },
  {
    id: "demo-midwest",
    orgId: HQ_DISTRIBUTOR_DEMO_ORGS.MIDWEST,
    name: "Midwest Spirits Co.",
    marketLine: "Chicago · Dana Brooks",
    tier: "Silver Partner",
    tierIsGold: false,
    fillRate: 96.1,
    onTime: 95.5,
    accountCount: networkRetailCountForOrg(HQ_DISTRIBUTOR_DEMO_ORGS.MIDWEST),
    statusTone: "amber",
    statusLabel: "stock low",
    account: {
      id: "demo-midwest",
      legalName: "Midwest Spirits Co.",
      tradingName: "Midwest Spirits Co.",
      city: "Chicago",
      type: "distributor",
      country: "US",
      contactName: "Dana Brooks",
      contactRole: "GM",
      phone: "+1 (312) 555-0210",
      email: "dana.brooks@midwestspirits.com",
      salesOwner: "Dana Brooks",
      paymentTerms: "Net 30",
      status: "active",
      firstOrderDate: "2025-02-01",
      lastOrderDate: "2026-06-01",
      tags: ["silver"],
    } as DistributorPartnerRow["account"],
  },
  {
    id: "demo-kanto",
    orgId: HQ_DISTRIBUTOR_DEMO_ORGS.KANTO,
    name: "Kanto Beverage",
    marketLine: "Tokyo · Yuki Tanaka",
    tier: "Gold Partner",
    tierIsGold: true,
    fillRate: 99.1,
    onTime: 98.4,
    accountCount: networkRetailCountForOrg(HQ_DISTRIBUTOR_DEMO_ORGS.KANTO),
    statusTone: "green",
    statusLabel: "active",
    account: {
      id: "demo-kanto",
      legalName: "Kanto Beverage",
      tradingName: "Kanto Beverage",
      city: "Tokyo",
      type: "distributor",
      country: "JP",
      contactName: "Yuki Tanaka",
      contactRole: "統括",
      phone: "+81 3-5555-0182",
      email: "tanaka@kanto-bev.jp",
      salesOwner: "Yuki Tanaka",
      paymentTerms: "Net 45",
      status: "active",
      firstOrderDate: "2024-01-01",
      lastOrderDate: "2026-06-01",
      tags: ["gold"],
    } as DistributorPartnerRow["account"],
  },
  {
    id: "demo-cave",
    orgId: HQ_DISTRIBUTOR_DEMO_ORGS.CAVE,
    name: "Cave Lumière",
    marketLine: "Paris · Élise Marchand",
    tier: "Silver Partner",
    tierIsGold: false,
    fillRate: 95.4,
    onTime: 92.0,
    accountCount: networkRetailCountForOrg(HQ_DISTRIBUTOR_DEMO_ORGS.CAVE),
    statusTone: "amber",
    statusLabel: "monitor",
    account: {
      id: "demo-cave",
      legalName: "Cave Lumière",
      tradingName: "Cave Lumière",
      city: "Paris",
      type: "distributor",
      country: "FR",
      contactName: "Élise Marchand",
      contactRole: "Directrice",
      phone: "+33 1 55 55 0190",
      email: "elise@cavelumiere.fr",
      salesOwner: "Élise Marchand",
      paymentTerms: "Net 30",
      status: "active",
      firstOrderDate: "2025-03-01",
      lastOrderDate: "2026-06-01",
      tags: ["silver"],
    } as DistributorPartnerRow["account"],
  },
];

/** Registry rows for API fallback when distributor-organizations is empty. */
export const HQ_DISTRIBUTOR_DEMO_ORGANIZATIONS: DistributorOrganizationRow[] = HQ_DISTRIBUTORS_DEMO_ROWS.map(
  (r) => ({
    id: r.orgId!,
    name: r.name,
    slug: r.orgId!.replace(/-/g, "_"),
    is_active: true,
  }),
);

/** Platform CRM distributor accounts for HQ layout previews. */
export const HQ_DISTRIBUTOR_PLATFORM_ACCOUNTS: Account[] = HQ_DISTRIBUTORS_DEMO_ROWS.map((r) => ({
  ...r.account,
  distributorOrgId: r.orgId,
  distributorOrgName: r.name,
  avgOrderSize: r.account.avgOrderSize ?? 420,
  tags: r.account.tags ?? [],
}));

function accountKey(a: Account): string {
  return (a.id || a.tradingName || a.legalName).trim().toLowerCase();
}

/** Ensures design-system distributor partners exist for HQ list / partner detail previews. */
export function mergeHqDistributorAccountsForDisplay(accounts: Account[]): Account[] {
  const platform = accounts.filter((a) => !a.distributorOrgId);
  const seen = new Set(platform.map(accountKey));
  const extras: Account[] = [];
  for (const acc of HQ_DISTRIBUTOR_PLATFORM_ACCOUNTS) {
    const key = accountKey(acc);
    if (seen.has(key)) continue;
    seen.add(key);
    extras.push(acc);
  }
  const liveDistributors = platform.filter((a) => a.type === "distributor").length;
  if (liveDistributors >= 4 && extras.length === 0) return accounts;
  if (extras.length === 0) return accounts;
  return [...accounts, ...extras];
}

const DEMO_DC: Record<HqDistributorDemoOrgId, DcInventoryRow[]> = {
  [HQ_DISTRIBUTOR_DEMO_ORGS.EMPIRE]: [
    { sku: "HJM-FP-750", name: "Florin Peaks 750ml", onHandCases: 142, allocatedCases: 100, coverDays: 14, coverLabel: "14 days", health: "low", healthLabel: "below reorder" },
    { sku: "HJM-JN-720", name: "Junmai Shiro 720ml", onHandCases: 218, allocatedCases: 36, coverDays: 48, coverLabel: "48 days", health: "ok", healthLabel: "healthy" },
    { sku: "HJM-RY-500", name: "Ryusui Reserve 500ml", onHandCases: 38, allocatedCases: 6, coverDays: 31, coverLabel: "31 days", health: "ok", healthLabel: "healthy" },
    { sku: "EU-FP-750", name: "First Press 750ml", onHandCases: 96, allocatedCases: 0, coverDays: 40, coverLabel: "40 days", health: "ok", healthLabel: "healthy" },
  ],
  [HQ_DISTRIBUTOR_DEMO_ORGS.MIDWEST]: [
    { sku: "HJM-FP-750", name: "Florin Peaks 750ml", onHandCases: 64, allocatedCases: 40, coverDays: 9, coverLabel: "9 days", health: "low", healthLabel: "below reorder" },
    { sku: "HJM-JN-720", name: "Junmai Shiro 720ml", onHandCases: 120, allocatedCases: 24, coverDays: 28, coverLabel: "28 days", health: "ok", healthLabel: "healthy" },
    { sku: "EU-FP-750", name: "First Press 750ml", onHandCases: 48, allocatedCases: 12, coverDays: 22, coverLabel: "22 days", health: "med", healthLabel: "monitor" },
  ],
  [HQ_DISTRIBUTOR_DEMO_ORGS.KANTO]: [
    { sku: "HJM-JN-720", name: "Junmai Shiro 720ml", onHandCases: 340, allocatedCases: 120, coverDays: 52, coverLabel: "52 days", health: "ok", healthLabel: "healthy" },
    { sku: "HJM-RY-500", name: "Ryusui Reserve 500ml", onHandCases: 96, allocatedCases: 24, coverDays: 45, coverLabel: "45 days", health: "ok", healthLabel: "healthy" },
    { sku: "HJM-FP-750", name: "Florin Peaks 750ml", onHandCases: 280, allocatedCases: 60, coverDays: 60, coverLabel: "60 days", health: "ok", healthLabel: "healthy" },
  ],
  [HQ_DISTRIBUTOR_DEMO_ORGS.CAVE]: [
    { sku: "HJM-FP-750", name: "Florin Peaks 750ml", onHandCases: 52, allocatedCases: 18, coverDays: 18, coverLabel: "18 days", health: "med", healthLabel: "monitor" },
    { sku: "HJM-RY-500", name: "Ryusui Reserve 500ml", onHandCases: 24, allocatedCases: 6, coverDays: 21, coverLabel: "21 days", health: "med", healthLabel: "monitor" },
  ],
};

const DEMO_REPLENS: Record<HqDistributorDemoOrgId, ReplenishmentRow[]> = {
  [HQ_DISTRIBUTOR_DEMO_ORGS.EMPIRE]: [
    { id: "RPL-2026-0062", date: "1 Jun", items: "4 pallets · Florin Peaks", statusTone: "amber", statusLabel: "pending" },
    { id: "RPL-2026-0058", date: "12 May", items: "6 pallets · mixed", statusTone: "green", statusLabel: "delivered" },
  ],
  [HQ_DISTRIBUTOR_DEMO_ORGS.MIDWEST]: [
    { id: "RPL-2026-0061", date: "1 Jun", items: "8 pallets · Florin Peaks", statusTone: "red", statusLabel: "urgent · pending" },
    { id: "RPL-2026-0049", date: "28 Apr", items: "5 pallets · mixed", statusTone: "green", statusLabel: "delivered" },
  ],
  [HQ_DISTRIBUTOR_DEMO_ORGS.KANTO]: [
    { id: "RPL-2026-0057", date: "8 May", items: "10 pallets · mixed", statusTone: "green", statusLabel: "delivered" },
  ],
  [HQ_DISTRIBUTOR_DEMO_ORGS.CAVE]: [
    { id: "RPL-2026-0055", date: "2 May", items: "4 pallets · Florin Peaks", statusTone: "green", statusLabel: "delivered" },
  ],
};

const DEMO_META: Record<
  HqDistributorDemoOrgId,
  {
    shipLine: string;
    contactLine: string;
    email: string;
    phone: string;
    partnerSince: string;
    terms: string;
    rebate: string;
    coop: string;
  }
> = {
  [HQ_DISTRIBUTOR_DEMO_ORGS.EMPIRE]: {
    shipLine: "Brooklyn, NY · 3 DCs",
    contactLine: "Jordan Wei · Operations Lead",
    email: "jordan.wei@empirewines.com",
    phone: "+1 (212) 555-0148",
    partnerSince: "Oct 2024",
    terms: "Net 30",
    rebate: "3% volume",
    coop: "$5,000 / yr",
  },
  [HQ_DISTRIBUTOR_DEMO_ORGS.MIDWEST]: {
    shipLine: "Chicago, IL · 1 DC",
    contactLine: "Dana Brooks · GM",
    email: "dana.brooks@midwestspirits.com",
    phone: "+1 (312) 555-0210",
    partnerSince: "Feb 2025",
    terms: "Net 30",
    rebate: "2% volume",
    coop: "$3,000 / yr",
  },
  [HQ_DISTRIBUTOR_DEMO_ORGS.KANTO]: {
    shipLine: "Tokyo, JP · 2 DCs",
    contactLine: "Yuki Tanaka · 統括",
    email: "tanaka@kanto-bev.jp",
    phone: "+81 3-5555-0182",
    partnerSince: "Jan 2024",
    terms: "Net 45",
    rebate: "3% volume",
    coop: "¥600K / yr",
  },
  [HQ_DISTRIBUTOR_DEMO_ORGS.CAVE]: {
    shipLine: "Paris, FR · 1 DC",
    contactLine: "Élise Marchand · Directrice",
    email: "elise@cavelumiere.fr",
    phone: "+33 1 55 55 0190",
    partnerSince: "Mar 2025",
    terms: "Net 30",
    rebate: "2% volume",
    coop: "€4,000 / yr",
  },
};

export function isHqDistributorDemoOrgId(orgId: string): orgId is HqDistributorDemoOrgId {
  return Object.values(HQ_DISTRIBUTOR_DEMO_ORGS).includes(orgId as HqDistributorDemoOrgId);
}

export function demoOrgIdForDistributorName(name: string): HqDistributorDemoOrgId | undefined {
  const n = name.toLowerCase();
  if (n.includes("empire")) return HQ_DISTRIBUTOR_DEMO_ORGS.EMPIRE;
  if (n.includes("midwest")) return HQ_DISTRIBUTOR_DEMO_ORGS.MIDWEST;
  if (n.includes("kanto")) return HQ_DISTRIBUTOR_DEMO_ORGS.KANTO;
  if (n.includes("cave") || n.includes("lumière") || n.includes("lumiere")) return HQ_DISTRIBUTOR_DEMO_ORGS.CAVE;
  return undefined;
}

export function buildHqDistributorDemoDetail(orgId: HqDistributorDemoOrgId): DistributorPartnerDetail | null {
  const row = HQ_DISTRIBUTORS_DEMO_ROWS.find((r) => r.orgId === orgId);
  const meta = DEMO_META[orgId];
  if (!row || !meta) return null;

  return {
    orgId,
    name: row.name,
    tier: row.tier,
    tierIsGold: row.tierIsGold,
    statusTone: row.statusTone,
    statusLabel: row.statusLabel,
    marketLine: row.marketLine,
    shipLine: meta.shipLine,
    contactLine: meta.contactLine,
    email: meta.email,
    phone: meta.phone,
    fillRate: row.fillRate,
    onTime: row.onTime,
    accountCount: row.accountCount,
    partnerSince: meta.partnerSince,
    terms: meta.terms,
    rebate: meta.rebate,
    dcInventory: DEMO_DC[orgId],
    replenishments: DEMO_REPLENS[orgId],
  };
}

export function manageOrgIdForRow(row: DistributorPartnerRow): string {
  if (row.orgId) return row.orgId;
  return demoOrgIdForDistributorName(row.name) ?? row.id;
}

function inventoryKey(item: InventoryItem): string {
  return `${item.distributorOrgId ?? ""}:${item.id}`;
}

/** Partner-scoped DC stock for wholesaler detail pages. */
export function mergeHqDistributorInventoryForDisplay(inventory: InventoryItem[]): InventoryItem[] {
  const demo = buildHqDistributorNetworkInventory();
  const seen = new Set(inventory.map(inventoryKey));
  const extras: InventoryItem[] = [];
  for (const row of demo) {
    const key = inventoryKey(row);
    if (seen.has(key)) continue;
    seen.add(key);
    extras.push(row);
  }
  const orgScoped = inventory.filter((i) => i.distributorOrgId).length;
  if (orgScoped >= 8 && extras.length === 0) return inventory;
  return extras.length > 0 ? [...inventory, ...extras] : inventory;
}
