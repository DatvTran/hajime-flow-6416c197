import type { AppData, TeamMember, Warehouse } from "@/types/app-data";
import type { Product, SalesOrder, Shipment } from "@/data/mockData";
import { products as PRODUCT_DEFAULTS } from "@/data/mockData";

const SEED_ACCOUNT_NUMBERS = new Set(["ACC-001", "ACC-002", "ACC-003"]);
const SEED_ACCOUNT_NAMES = new Set([
  "the drake hotel",
  "bar isabel",
  "paradise grapevine",
  "album hair",
  "metro logistics",
  "empire wines & spirits",
  "empire wines",
  "midwest spirits co.",
  "midwest spirits co",
  "kanto beverage",
  "cave lumière",
  "cave lumiere",
  "vino nord",
]);
const DEMO_DISTRIBUTOR_ORG_IDS = new Set([
  "empire-wines",
  "midwest-spirits",
  "kanto-beverage",
  "cave-lumiere",
  "metro_logistics",
  "metro-logistics",
]);
const DEMO_DISTRIBUTOR_NAME_NEEDLES = [
  "metro logistics",
  "empire wines",
  "midwest spirits",
  "kanto beverage",
  "cave lumiere",
  "vino nord",
];
const SEED_ACCOUNT_EMAILS = new Set([
  "orders@drakehotel.ca",
  "orders@barisabel.com",
  "orders@paradisegrapevine.com",
  "info@albumhair.com",
  "fulfillment@metrologistics.example",
  "jordan.wei@empirewines.com",
  "dana.brooks@midwestspirits.com",
  "yuki.sato@kanto-bev.jp",
  "tanaka@kanto-bev.jp",
  "elise@cavelumiere.fr",
  "luca@vino-nord.it",
]);
const SEED_ORDER_NUMBERS = new Set(["SO-2025-001"]);

function normName(value: string | undefined): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Postgres / seed-app demo venues that should not appear in live HQ. */
export function isSeedDemoAccount(account: {
  id?: string;
  accountNumber?: string;
  email?: string;
  name?: string;
  legalName?: string;
  tradingName?: string;
  distributorOrgId?: string;
  distributorOrgName?: string;
}): boolean {
  const id = String(account.id ?? "");
  if (id.startsWith("demo-") || id.startsWith("acc-")) return true;
  const number = String(account.accountNumber ?? "").toUpperCase();
  if (SEED_ACCOUNT_NUMBERS.has(number)) return true;
  const email = String(account.email ?? "").toLowerCase().trim();
  if (SEED_ACCOUNT_EMAILS.has(email)) return true;
  const name =
    normName(account.name) ||
    normName(account.tradingName) ||
    normName(account.legalName);
  if (SEED_ACCOUNT_NAMES.has(name) || matchesDemoDistributorName(name)) return true;
  return isSeedDemoDistributorOrg({
    id: account.distributorOrgId,
    name: account.distributorOrgName,
  });
}

function matchesDemoDistributorName(value: string | undefined | null): boolean {
  const n = normName(value ?? "");
  if (!n) return false;
  if (SEED_ACCOUNT_NAMES.has(n)) return true;
  return DEMO_DISTRIBUTOR_NAME_NEEDLES.some((needle) => n.includes(needle));
}

export function isSeedDemoPartnerName(value: string | undefined | null): boolean {
  return matchesDemoDistributorName(value);
}

export function isSeedDemoDistributorOrg(org: {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
}): boolean {
  const id = String(org.id ?? "").trim().toLowerCase();
  const slug = String(org.slug ?? "").trim().toLowerCase();
  const idKey = id.replace(/-/g, "_");
  const slugKey = slug.replace(/-/g, "_");
  if (DEMO_DISTRIBUTOR_ORG_IDS.has(id) || DEMO_DISTRIBUTOR_ORG_IDS.has(slug)) return true;
  if (DEMO_DISTRIBUTOR_ORG_IDS.has(idKey) || DEMO_DISTRIBUTOR_ORG_IDS.has(slugKey)) return true;
  if (id.includes("metro_logistics") || slugKey === "metro_logistics") return true;
  return matchesDemoDistributorName(org.name);
}

function isSeedDemoSalesOrder(order: SalesOrder, seedAccountIds: Set<string>): boolean {
  if (SEED_ORDER_NUMBERS.has(String(order.orderNumber ?? "").toUpperCase())) return true;
  if (order.accountId && seedAccountIds.has(String(order.accountId))) return true;
  if (
    isSeedDemoDistributorOrg({
      id: order.distributorOrgId,
      name: order.distributorOrgName || order.account,
    })
  ) {
    return true;
  }
  return matchesDemoDistributorName(order.account);
}

function isSeedDemoShipment(shipment: Shipment, seedOrderNumbers: Set<string>): boolean {
  const dest = normName(shipment.destination);
  if ([...SEED_ACCOUNT_NAMES].some((name) => dest.includes(name))) return true;
  const linked = String(shipment.linkedOrder ?? "").toUpperCase();
  return seedOrderNumbers.has(linked) || SEED_ORDER_NUMBERS.has(linked);
}

function asArray<T>(v: T[] | undefined): T[] {
  return Array.isArray(v) ? v : [];
}

function mergeProducts(fromPayload: Product[] | undefined): Product[] {
  const base = asArray(fromPayload);
  const defaultsBySku = Object.fromEntries(PRODUCT_DEFAULTS.map((p) => [p.sku, p]));
  return base.map((p) => {
    const d = defaultsBySku[p.sku];
    if (!d) return p;
    return { ...d, ...p, sku: p.sku };
  });
}

/** Empty operational snapshot — no seed-app / roster fill. */
export function emptyAppData(): AppData {
  return {
    version: 1,
    products: [],
    inventory: [],
    accounts: [],
    salesOrders: [],
    purchaseOrders: [],
    transferOrders: [],
    shipments: [],
    productionStatuses: [],
    operationalSettings: {
      manufacturerLeadTimeDays: 45,
      safetyStockBySku: {},
      retailerStockThresholdBottles: 48,
    },
    auditLogs: [],
    teamMembers: [],
    financingLedger: [],
    retailerShelfStock: {},
    visitNotes: [],
    newProductRequests: [],
    depletionReports: [],
    warehouses: [],
    manufacturerFinishedGoods: [],
  };
}

export function normalizeAppData(raw: AppData): AppData {
  const teamMembers: TeamMember[] = asArray(raw.teamMembers).filter((tm) => {
    const email = String(tm.email ?? "").toLowerCase().trim();
    if (SEED_ACCOUNT_EMAILS.has(email)) return false;
    const name = normName(tm.displayName);
    if (name === "metro logistics ops" || matchesDemoDistributorName(name)) return false;
    if (isSeedDemoDistributorOrg({ id: tm.distributorOrgId, name: tm.distributorOrgName })) return false;
    return true;
  });
  const op = raw.operationalSettings;
  const operationalSettings = {
    manufacturerLeadTimeDays: op?.manufacturerLeadTimeDays ?? 45,
    safetyStockBySku: { ...(op?.safetyStockBySku ?? {}) },
    retailerStockThresholdBottles: op?.retailerStockThresholdBottles ?? 48,
    companyName: op?.companyName,
    primaryMarkets: op?.primaryMarkets,
    manufacturerName: op?.manufacturerName,
    supportEmail: op?.supportEmail,
    hqHiddenManufacturerIds: op?.hqHiddenManufacturerIds,
    hqManufacturerPartnerConfigs: op?.hqManufacturerPartnerConfigs,
    hqUiPreferences: op?.hqUiPreferences,
  };

  const retailerShelfStock: NonNullable<AppData["retailerShelfStock"]> =
    typeof raw.retailerShelfStock === "object" && raw.retailerShelfStock ? raw.retailerShelfStock : {};

  const warehouses: Warehouse[] = asArray(raw.warehouses);

  const accounts = asArray(raw.accounts).filter((account) => !isSeedDemoAccount(account));
  const seedAccountIds = new Set(
    asArray(raw.accounts)
      .filter((account) => isSeedDemoAccount(account))
      .map((account) => String(account.id)),
  );
  const salesOrders = asArray(raw.salesOrders)
    .filter((order) => !isSeedDemoSalesOrder(order, seedAccountIds))
    .map((o) => ({
      ...o,
      salesRep: o.salesRep != null && String(o.salesRep).trim() !== "" ? String(o.salesRep) : "—",
    }));
  const seedOrderNumbers = new Set(
    asArray(raw.salesOrders)
      .filter((order) => isSeedDemoSalesOrder(order, seedAccountIds))
      .flatMap((order) => [String(order.orderNumber ?? ""), String(order.id)].filter(Boolean)),
  );

  return {
    ...raw,
    products: mergeProducts(raw.products),
    salesOrders,
    accounts,
    inventory: asArray(raw.inventory),
    version: raw.version ?? 1,
    operationalSettings,
    auditLogs: asArray(raw.auditLogs),
    teamMembers,
    financingLedger: asArray(raw.financingLedger),
    retailerShelfStock,
    visitNotes: asArray(raw.visitNotes).map((n) => ({
      ...n,
      authorRep: n.authorRep != null && String(n.authorRep).trim() !== "" ? String(n.authorRep) : "",
    })),
    newProductRequests: asArray(raw.newProductRequests),
    transferOrders: asArray(raw.transferOrders),
    depletionReports: asArray(raw.depletionReports),
    purchaseOrders: asArray(raw.purchaseOrders),
    shipments: asArray(raw.shipments).filter((shipment) => !isSeedDemoShipment(shipment, seedOrderNumbers)),
    productionStatuses: asArray(raw.productionStatuses),
    warehouses,
    manufacturerFinishedGoods: asArray(raw.manufacturerFinishedGoods),
  };
}
