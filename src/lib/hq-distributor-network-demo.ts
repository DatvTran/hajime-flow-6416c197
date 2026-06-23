import type { Account, InventoryItem, SalesOrder } from "@/data/mockData";
import type { TeamMember } from "@/types/app-data";

export const HQ_DISTRIBUTOR_DEMO_ORGS = {
  EMPIRE: "empire-wines",
  MIDWEST: "midwest-spirits",
  KANTO: "kanto-beverage",
  CAVE: "cave-lumiere",
} as const;

export type HqDistributorDemoOrgId = (typeof HQ_DISTRIBUTOR_DEMO_ORGS)[keyof typeof HQ_DISTRIBUTOR_DEMO_ORGS];

const CASE = 12;

function bottles(cases: number): number {
  return cases * CASE;
}

function networkRetail(
  partial: Account & { distributorOrgId: string; distributorOrgName: string },
): Account {
  return {
    avgOrderSize: 24,
    tags: [],
    paymentTerms: "Net 30",
    firstOrderDate: "2025-01-01",
    lastOrderDate: "2026-06-01",
    status: "active",
    contactRole: "Manager",
    phone: "",
    email: "",
    ...partial,
  };
}

function networkOrder(
  partial: SalesOrder & { cases?: number; distributorOrgId: string; distributorOrgName: string },
): SalesOrder {
  const { cases, quantity, ...rest } = partial;
  return {
    paymentStatus: "paid",
    orderCreatedByRole: "sales_rep",
    orderRoutingTarget: "retail",
    repApprovalStatus: "approved",
    ...rest,
    quantity: quantity ?? bottles(cases ?? 0),
  };
}

/** Split total revenue across N delivered orders for a retail account. */
function ordersForAccount(
  baseId: string,
  account: string,
  orgId: string,
  orgName: string,
  salesRep: string,
  market: string,
  totalRevenue: number,
  orderCount: number,
  sku = "HJM-FP-750",
  status: SalesOrder["status"] = "delivered",
): SalesOrder[] {
  const perOrder = Math.round(totalRevenue / orderCount);
  const dates = ["2026-05-28", "2026-05-22", "2026-05-18", "2026-05-12", "2026-05-08", "2026-04-28", "2026-04-20", "2026-04-12", "2026-04-05"];
  return Array.from({ length: orderCount }, (_, i) =>
    networkOrder({
      id: `${baseId}-${i + 1}`,
      account,
      market,
      orderDate: dates[i % dates.length],
      requestedDelivery: dates[(i + 1) % dates.length],
      sku,
      cases: Math.max(6, Math.round(perOrder / 800)),
      price: i === orderCount - 1 ? totalRevenue - perOrder * (orderCount - 1) : perOrder,
      salesRep,
      status,
      distributorOrgId: orgId,
      distributorOrgName: orgName,
    }),
  );
}

function fillerRetail(
  orgId: string,
  orgName: string,
  city: string,
  country: string,
  salesOwner: string,
  count: number,
  idPrefix: string,
): Account[] {
  const types: Account["type"][] = ["bar", "restaurant", "retail", "hotel"];
  const labels = ["Room", "Cellar", "Lounge", "Bistro", "Tavern", "Club", "Kitchen", "Hall"];
  return Array.from({ length: count }, (_, i) =>
    networkRetail({
      id: `${idPrefix}-net-${i + 1}`,
      legalName: `${labels[i % labels.length]} ${city} ${i + 1}`,
      tradingName: `${labels[i % labels.length]} ${city} ${i + 1}`,
      city,
      country,
      type: types[i % types.length],
      contactName: "Manager",
      salesOwner,
      distributorOrgId: orgId,
      distributorOrgName: orgName,
      status: i % 11 === 0 ? "inactive" : "active",
    }),
  );
}

const EMPIRE = HQ_DISTRIBUTOR_DEMO_ORGS.EMPIRE;
const MIDWEST = HQ_DISTRIBUTOR_DEMO_ORGS.MIDWEST;
const KANTO = HQ_DISTRIBUTOR_DEMO_ORGS.KANTO;
const CAVE = HQ_DISTRIBUTOR_DEMO_ORGS.CAVE;

/** Retail / on-premise accounts inside each wholesaler's isolated network. */
export const HQ_DISTRIBUTOR_NETWORK_RETAIL_ACCOUNTS: Account[] = [
  // Empire — NYC (24 accounts in design)
  networkRetail({
    id: "demo-ret-drake",
    legalName: "The Drake Hotel",
    tradingName: "The Drake Hotel",
    city: "NYC",
    country: "US",
    type: "hotel",
    contactName: "Events team",
    salesOwner: "Mike Tan",
    distributorOrgId: EMPIRE,
    distributorOrgName: "Empire Wines & Spirits",
  }),
  networkRetail({
    id: "demo-ret-aviary",
    legalName: "The Aviary",
    tradingName: "The Aviary",
    city: "NYC",
    country: "US",
    type: "bar",
    contactName: "Bar director",
    salesOwner: "Mike Tan",
    distributorOrgId: EMPIRE,
    distributorOrgName: "Empire Wines & Spirits",
  }),
  networkRetail({
    id: "demo-ret-dante",
    legalName: "Dante",
    tradingName: "Dante",
    city: "NYC",
    country: "US",
    type: "restaurant",
    contactName: "GM",
    salesOwner: "Sofia Lim",
    distributorOrgId: EMPIRE,
    distributorOrgName: "Empire Wines & Spirits",
    status: "active",
  }),
  networkRetail({
    id: "demo-ret-katana",
    legalName: "Katana Kitten",
    tradingName: "Katana Kitten",
    city: "NYC",
    country: "US",
    type: "bar",
    contactName: "Owner",
    salesOwner: "Sofia Lim",
    distributorOrgId: EMPIRE,
    distributorOrgName: "Empire Wines & Spirits",
  }),
  networkRetail({
    id: "demo-ret-gramercy",
    legalName: "Gramercy Tavern",
    tradingName: "Gramercy Tavern",
    city: "NYC",
    country: "US",
    type: "restaurant",
    contactName: "Beverage director",
    salesOwner: "Mike Tan",
    distributorOrgId: EMPIRE,
    distributorOrgName: "Empire Wines & Spirits",
  }),
  ...fillerRetail(EMPIRE, "Empire Wines & Spirits", "NYC", "US", "Mike Tan", 19, "demo-ret-emp"),

  // Midwest — Chicago (12)
  networkRetail({
    id: "demo-ret-gage",
    legalName: "The Gage",
    tradingName: "The Gage",
    city: "Chicago",
    country: "US",
    type: "restaurant",
    contactName: "Chef",
    salesOwner: "Carlos Reyes",
    distributorOrgId: MIDWEST,
    distributorOrgName: "Midwest Spirits Co.",
  }),
  networkRetail({
    id: "demo-ret-dots",
    legalName: "Three Dots",
    tradingName: "Three Dots",
    city: "Chicago",
    country: "US",
    type: "bar",
    contactName: "Bar lead",
    salesOwner: "Carlos Reyes",
    distributorOrgId: MIDWEST,
    distributorOrgName: "Midwest Spirits Co.",
  }),
  networkRetail({
    id: "demo-ret-kumiko",
    legalName: "Kumiko",
    tradingName: "Kumiko",
    city: "Chicago",
    country: "US",
    type: "bar",
    contactName: "Owner",
    salesOwner: "Carlos Reyes",
    distributorOrgId: MIDWEST,
    distributorOrgName: "Midwest Spirits Co.",
  }),
  ...fillerRetail(MIDWEST, "Midwest Spirits Co.", "Chicago", "US", "Carlos Reyes", 9, "demo-ret-mw"),

  // Kanto — Tokyo (31)
  networkRetail({
    id: "demo-ret-kioi",
    legalName: "Kioi Sakaba",
    tradingName: "Kioi Sakaba",
    city: "Tokyo",
    country: "JP",
    type: "restaurant",
    contactName: "Tencho",
    salesOwner: "Yuki Tanaka",
    distributorOrgId: KANTO,
    distributorOrgName: "Kanto Beverage",
  }),
  networkRetail({
    id: "demo-ret-gen",
    legalName: "Gen Yamamoto",
    tradingName: "Gen Yamamoto",
    city: "Tokyo",
    country: "JP",
    type: "bar",
    contactName: "Owner",
    salesOwner: "Yuki Tanaka",
    distributorOrgId: KANTO,
    distributorOrgName: "Kanto Beverage",
  }),
  ...fillerRetail(KANTO, "Kanto Beverage", "Tokyo", "JP", "Yuki Tanaka", 29, "demo-ret-kn"),

  // Cave — Paris (9)
  networkRetail({
    id: "demo-ret-hemingway",
    legalName: "Bar Hemingway",
    tradingName: "Bar Hemingway",
    city: "Paris",
    country: "FR",
    type: "bar",
    contactName: "Head bartender",
    salesOwner: "Élise Marchand",
    distributorOrgId: CAVE,
    distributorOrgName: "Cave Lumière",
  }),
  networkRetail({
    id: "demo-ret-syndicat",
    legalName: "Le Syndicat",
    tradingName: "Le Syndicat",
    city: "Paris",
    country: "FR",
    type: "bar",
    contactName: "Owner",
    salesOwner: "Élise Marchand",
    distributorOrgId: CAVE,
    distributorOrgName: "Cave Lumière",
  }),
  ...fillerRetail(CAVE, "Cave Lumière", "Paris", "FR", "Élise Marchand", 7, "demo-ret-cv"),
];

/** Downstream sell-through orders — matches hq-operator-app.html DIST_SALES. */
export const HQ_DISTRIBUTOR_NETWORK_SALES_ORDERS: SalesOrder[] = [
  // Empire — Mike Tan + Sofia Lim ($182K Q2)
  ...ordersForAccount("demo-net-drake", "The Drake Hotel", EMPIRE, "Empire Wines & Spirits", "Mike Tan", "NYC", 38400, 9),
  ...ordersForAccount("demo-net-aviary", "The Aviary", EMPIRE, "Empire Wines & Spirits", "Mike Tan", "NYC", 14200, 6),
  ...ordersForAccount("demo-net-dante", "Dante", EMPIRE, "Empire Wines & Spirits", "Sofia Lim", "NYC", 11500, 5),
  ...ordersForAccount("demo-net-katana", "Katana Kitten", EMPIRE, "Empire Wines & Spirits", "Sofia Lim", "NYC", 8600, 4),
  ...ordersForAccount("demo-net-gramercy", "Gramercy Tavern", EMPIRE, "Empire Wines & Spirits", "Mike Tan", "NYC", 21600, 7),
  ...ordersForAccount("demo-net-emp-mike", "Room NYC 1", EMPIRE, "Empire Wines & Spirits", "Mike Tan", "NYC", 42000, 8, "HJM-JN-720"),
  ...ordersForAccount("demo-net-emp-sofia", "Lounge NYC 2", EMPIRE, "Empire Wines & Spirits", "Sofia Lim", "Queens", 34700, 6, "HJM-FP-750"),

  // Midwest — Carlos Reyes ($94K Q2)
  ...ordersForAccount("demo-net-gage", "The Gage", MIDWEST, "Midwest Spirits Co.", "Carlos Reyes", "Chicago", 18200, 6),
  ...ordersForAccount("demo-net-dots", "Three Dots", MIDWEST, "Midwest Spirits Co.", "Carlos Reyes", "Chicago", 9400, 4, "HJM-JN-720"),
  ...ordersForAccount("demo-net-kumiko", "Kumiko", MIDWEST, "Midwest Spirits Co.", "Carlos Reyes", "Chicago", 15800, 5),
  ...ordersForAccount("demo-net-mw-fill", "Cellar Chicago 1", MIDWEST, "Midwest Spirits Co.", "Carlos Reyes", "Chicago", 50600, 10),

  // Kanto — Yuki Tanaka (¥4.8M Q2)
  ...ordersForAccount("demo-net-kioi", "Kioi Sakaba", KANTO, "Kanto Beverage", "Yuki Tanaka", "Tokyo", 1200000, 11, "HJM-JN-720"),
  ...ordersForAccount("demo-net-gen", "Gen Yamamoto", KANTO, "Kanto Beverage", "Yuki Tanaka", "Tokyo", 900000, 8, "HJM-RY-500"),
  ...ordersForAccount("demo-net-kn-fill", "Lounge Tokyo 3", KANTO, "Kanto Beverage", "Yuki Tanaka", "Tokyo", 2700000, 14, "HJM-JN-720"),

  // Cave — Élise Marchand (€19.6K Q2)
  ...ordersForAccount("demo-net-hem", "Bar Hemingway", CAVE, "Cave Lumière", "Élise Marchand", "Paris", 8400, 5),
  ...ordersForAccount("demo-net-syn", "Le Syndicat", CAVE, "Cave Lumière", "Élise Marchand", "Paris", 6200, 4),
  ...ordersForAccount("demo-net-cv-fill", "Bistro Paris 1", CAVE, "Cave Lumière", "Élise Marchand", "Paris", 5000, 3),
];

export const HQ_DISTRIBUTOR_NETWORK_REPS: TeamMember[] = [
  {
    id: "demo-rep-mike",
    displayName: "Mike Tan",
    email: "mike.tan@empirewines.com",
    role: "sales_rep",
    createdAt: "2024-06-01",
    distributorOrgId: EMPIRE,
    distributorOrgName: "Empire Wines & Spirits",
  },
  {
    id: "demo-rep-sofia",
    displayName: "Sofia Lim",
    email: "sofia.lim@empirewines.com",
    role: "sales_rep",
    createdAt: "2024-08-01",
    distributorOrgId: EMPIRE,
    distributorOrgName: "Empire Wines & Spirits",
  },
  {
    id: "demo-rep-carlos",
    displayName: "Carlos Reyes",
    email: "carlos.reyes@midwestspirits.com",
    role: "sales_rep",
    createdAt: "2025-01-01",
    distributorOrgId: MIDWEST,
    distributorOrgName: "Midwest Spirits Co.",
  },
  {
    id: "demo-rep-yuki",
    displayName: "Yuki Tanaka",
    email: "tanaka@kanto-bev.jp",
    role: "sales_rep",
    createdAt: "2024-01-01",
    distributorOrgId: KANTO,
    distributorOrgName: "Kanto Beverage",
  },
  {
    id: "demo-rep-elise",
    displayName: "Élise Marchand",
    email: "elise@cavelumiere.fr",
    role: "sales_rep",
    createdAt: "2025-03-01",
    distributorOrgId: CAVE,
    distributorOrgName: "Cave Lumière",
  },
];

type DcSkuSeed = {
  sku: string;
  name: string;
  onHandCases: number;
  allocatedCases: number;
  coverDays: number;
  health: "low" | "med" | "ok";
};

const DC_BY_ORG: Record<string, { warehouse: string; skus: DcSkuSeed[] }> = {
  [EMPIRE]: {
    warehouse: "Empire Brooklyn DC",
    skus: [
      { sku: "HJM-FP-750", name: "Florin Peaks 750ml", onHandCases: 142, allocatedCases: 100, coverDays: 14, health: "low" },
      { sku: "HJM-JN-720", name: "Junmai Shiro 720ml", onHandCases: 218, allocatedCases: 36, coverDays: 48, health: "ok" },
      { sku: "HJM-RY-500", name: "Ryusui Reserve 500ml", onHandCases: 38, allocatedCases: 6, coverDays: 31, health: "ok" },
      { sku: "EU-FP-750", name: "First Press 750ml", onHandCases: 96, allocatedCases: 0, coverDays: 40, health: "ok" },
    ],
  },
  [MIDWEST]: {
    warehouse: "Midwest Chicago DC",
    skus: [
      { sku: "HJM-FP-750", name: "Florin Peaks 750ml", onHandCases: 64, allocatedCases: 40, coverDays: 9, health: "low" },
      { sku: "HJM-JN-720", name: "Junmai Shiro 720ml", onHandCases: 120, allocatedCases: 24, coverDays: 28, health: "ok" },
      { sku: "EU-FP-750", name: "First Press 750ml", onHandCases: 48, allocatedCases: 12, coverDays: 22, health: "med" },
    ],
  },
  [KANTO]: {
    warehouse: "Kanto Tokyo DC",
    skus: [
      { sku: "HJM-JN-720", name: "Junmai Shiro 720ml", onHandCases: 340, allocatedCases: 120, coverDays: 52, health: "ok" },
      { sku: "HJM-RY-500", name: "Ryusui Reserve 500ml", onHandCases: 96, allocatedCases: 24, coverDays: 45, health: "ok" },
      { sku: "HJM-FP-750", name: "Florin Peaks 750ml", onHandCases: 280, allocatedCases: 60, coverDays: 60, health: "ok" },
    ],
  },
  [CAVE]: {
    warehouse: "Cave Lumière Paris DC",
    skus: [
      { sku: "HJM-FP-750", name: "Florin Peaks 750ml", onHandCases: 52, allocatedCases: 18, coverDays: 18, health: "med" },
      { sku: "HJM-RY-500", name: "Ryusui Reserve 500ml", onHandCases: 24, allocatedCases: 6, coverDays: 21, health: "med" },
    ],
  },
};

/** DC inventory rows scoped to each wholesaler org (partner detail). */
export function buildHqDistributorNetworkInventory(): InventoryItem[] {
  const rows: InventoryItem[] = [];
  let seq = 1;
  for (const [orgId, dc] of Object.entries(DC_BY_ORG)) {
    const orgName =
      orgId === EMPIRE
        ? "Empire Wines & Spirits"
        : orgId === MIDWEST
          ? "Midwest Spirits Co."
          : orgId === KANTO
            ? "Kanto Beverage"
            : "Cave Lumière";
    for (const sku of dc.skus) {
      rows.push({
        id: `demo-inv-${orgId}-${seq++}`,
        sku: sku.sku,
        productName: sku.name,
        batchLot: `B2026-${String(seq).padStart(3, "0")}`,
        productionDate: "2026-03-01",
        quantityBottles: sku.onHandCases * CASE,
        quantityCases: sku.onHandCases,
        warehouse: dc.warehouse,
        locationType: "distributor_warehouse",
        status: sku.allocatedCases > 0 ? "available" : "available",
        labelVersion: "v3.1",
        notes: "",
        distributorOrgId: orgId,
        distributorOrgName: orgName,
      });
      if (sku.allocatedCases > 0) {
        rows.push({
          id: `demo-inv-${orgId}-${seq++}`,
          sku: sku.sku,
          productName: sku.name,
          batchLot: `B2026-${String(seq).padStart(3, "0")}`,
          productionDate: "2026-03-01",
          quantityBottles: sku.allocatedCases * CASE,
          quantityCases: sku.allocatedCases,
          warehouse: dc.warehouse,
          locationType: "distributor_warehouse",
          status: "reserved",
          labelVersion: "v3.1",
          notes: "Allocated to open orders",
          distributorOrgId: orgId,
          distributorOrgName: orgName,
        });
      }
    }
  }
  return rows;
}

export function networkRetailCountForOrg(orgId: string): number {
  return HQ_DISTRIBUTOR_NETWORK_RETAIL_ACCOUNTS.filter(
    (a) => a.distributorOrgId === orgId && ["retail", "bar", "restaurant", "hotel", "lifestyle"].includes(String(a.type)),
  ).length;
}
