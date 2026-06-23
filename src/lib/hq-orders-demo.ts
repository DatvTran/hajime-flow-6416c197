import type { Account, SalesOrder } from "@/data/mockData";
import type { TeamMember } from "@/types/app-data";
import { filterWholesaleOrdersForHq } from "@/lib/hq-order-scope";
import { mergeHqDistributorAccountsForDisplay } from "@/lib/hq-distributors-demo";
import {
  HQ_DISTRIBUTOR_NETWORK_RETAIL_ACCOUNTS,
  HQ_DISTRIBUTOR_NETWORK_REPS,
  HQ_DISTRIBUTOR_NETWORK_SALES_ORDERS,
} from "@/lib/hq-distributor-network-demo";

const CASE = 12;

function bottles(cases: number): number {
  return cases * CASE;
}

function wholesaleOrder(
  partial: SalesOrder & { cases?: number },
): SalesOrder {
  const { cases, quantity, ...rest } = partial;
  return {
    paymentStatus: "pending",
    salesRep: "",
    orderCreatedByRole: "distributor",
    orderRoutingTarget: "wholesaler",
    ...rest,
    quantity: quantity ?? bottles(cases ?? 0),
  };
}

/** HQ sell-in pallet orders — matches `hq-operator-app.html` ORDERS + REPLEN tables. */
export const HQ_WHOLESALE_DEMO_ORDERS: SalesOrder[] = [
  wholesaleOrder({
    id: "demo-rpl-0062",
    orderNumber: "RPL-2026-0062",
    accountId: "demo-empire",
    account: "Empire Wines & Spirits",
    market: "NYC",
    orderDate: "2026-06-02",
    requestedDelivery: "—",
    sku: "HJM-FP-750",
    cases: 224,
    price: 102144,
    status: "confirmed",
  }),
  wholesaleOrder({
    id: "demo-rpl-0061",
    orderNumber: "RPL-2026-0061",
    accountId: "demo-midwest",
    account: "Midwest Spirits Co.",
    market: "Chicago",
    orderDate: "2026-06-01",
    requestedDelivery: "2026-06-04",
    sku: "Florin Peaks 750ml",
    cases: 480,
    price: 18240,
    status: "draft",
    orderNotes:
      "Chicago below 21-day cover floor. Requesting 8 pallets Florin Peaks to rebuild. Finished goods short 140cs — covered by Kuramoto PR-2026-0142 once approved.",
    lines: [{ sku: "Florin Peaks 750ml", quantityBottles: bottles(480), lineTotal: 18240 }],
  }),
  wholesaleOrder({
    id: "demo-rpl-0060",
    orderNumber: "RPL-2026-0060",
    accountId: "demo-empire",
    account: "Empire Wines & Spirits",
    market: "NYC",
    orderDate: "2026-06-01",
    requestedDelivery: "2026-06-01",
    sku: "Florin Peaks 750ml + Junmai Shiro 720ml",
    cases: 420,
    price: 17280,
    status: "confirmed",
    orderNotes: "Routine top-up ahead of summer. Both SKUs fully available in finished goods.",
    lines: [
      { sku: "Florin Peaks 750ml", quantityBottles: bottles(240), lineTotal: 10944 },
      { sku: "Junmai Shiro 720ml", quantityBottles: bottles(180), lineTotal: 6336 },
    ],
  }),
  wholesaleOrder({
    id: "demo-rpl-0059",
    orderNumber: "RPL-2026-0059",
    accountId: "demo-kanto",
    account: "Kanto Beverage",
    market: "Tokyo",
    orderDate: "2026-05-31",
    requestedDelivery: "—",
    sku: "Ryusui Reserve 500ml",
    cases: 96,
    price: 74880,
    status: "draft",
    orderNotes:
      "Ryusui Reserve from limited Lot 04. Requires allocation sign-off — confirm against other markets before releasing 2 pallets.",
    lines: [{ sku: "Ryusui Reserve 500ml", quantityBottles: bottles(96), lineTotal: 74880 }],
  }),
  wholesaleOrder({
    id: "demo-rpl-0060-ship",
    orderNumber: "RPL-2026-0060",
    accountId: "demo-empire",
    account: "Empire Wines & Spirits",
    market: "NYC",
    orderDate: "2026-05-28",
    requestedDelivery: "2026-06-01",
    sku: "HJM-FP-750 +1",
    cases: 420,
    price: 191520,
    status: "shipped",
  }),
  wholesaleOrder({
    id: "demo-rpl-0058",
    orderNumber: "RPL-2026-0058",
    accountId: "demo-empire",
    account: "Empire Wines & Spirits",
    market: "NYC",
    orderDate: "2026-05-18",
    requestedDelivery: "2026-05-24",
    sku: "HJM-JN-720",
    cases: 336,
    price: 104832,
    status: "delivered",
    paymentStatus: "paid",
  }),
  wholesaleOrder({
    id: "demo-rpl-0057",
    orderNumber: "RPL-2026-0057",
    accountId: "demo-cave",
    account: "Cave Lumière",
    market: "Paris",
    orderDate: "2026-05-15",
    requestedDelivery: "2026-05-21",
    sku: "HJM-FP-750",
    cases: 168,
    price: 76608,
    status: "delivered",
    paymentStatus: "paid",
  }),
  wholesaleOrder({
    id: "demo-rpl-0056",
    orderNumber: "RPL-2026-0056",
    accountId: "demo-vino-nord",
    account: "Vino Nord",
    market: "Milan",
    orderDate: "2026-05-12",
    requestedDelivery: "2026-05-19",
    sku: "EU-FP-750",
    cases: 140,
    price: 70560,
    status: "delivered",
    paymentStatus: "paid",
  }),
  wholesaleOrder({
    id: "demo-rpl-0055",
    orderNumber: "RPL-2026-0055",
    accountId: "demo-midwest",
    account: "Midwest Spirits Co.",
    market: "Chicago",
    orderDate: "2026-05-05",
    requestedDelivery: "2026-05-12",
    sku: "HJM-JN-720",
    cases: 280,
    price: 87360,
    status: "delivered",
    paymentStatus: "paid",
  }),
];

const VINO_NORD_ACCOUNT: Account = {
  id: "demo-vino-nord",
  legalName: "Vino Nord",
  tradingName: "Vino Nord",
  city: "Milan",
  country: "IT",
  type: "distributor",
  contactName: "Luca Moretti",
  contactRole: "Import manager",
  phone: "+39 02 5555 0100",
  email: "luca@vino-nord.it",
  salesOwner: "Luca Moretti",
  paymentTerms: "Net 30",
  firstOrderDate: "2025-04-01",
  lastOrderDate: "2026-05-19",
  avgOrderSize: 140,
  status: "active",
  tags: ["silver"],
};

function accountKey(a: Account): string {
  return (a.id || a.tradingName || a.legalName).trim().toLowerCase();
}

function mergeUniqueAccounts(existing: Account[], extras: Account[]): Account[] {
  const seen = new Set(existing.map(accountKey));
  const out = [...existing];
  for (const acc of extras) {
    const key = accountKey(acc);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(acc);
  }
  return out;
}

function mergeUniqueOrders(existing: SalesOrder[], extras: SalesOrder[]): SalesOrder[] {
  const seen = new Set(existing.map((o) => o.id));
  const out = [...existing];
  for (const order of extras) {
    if (seen.has(order.id)) continue;
    seen.add(order.id);
    out.push(order);
  }
  return out;
}

function mergeUniqueTeam(existing: TeamMember[], extras: TeamMember[]): TeamMember[] {
  const seen = new Set(existing.map((m) => m.id));
  const out = [...existing];
  for (const member of extras) {
    if (seen.has(member.id)) continue;
    seen.add(member.id);
    out.push(member);
  }
  return out;
}

/** Platform distributor accounts + wholesale sell-in orders for HQ order views. */
export function mergeHqWholesaleOrdersForDisplay(
  orders: SalesOrder[],
  accounts: Account[],
): { orders: SalesOrder[]; accounts: Account[] } {
  const mergedAccounts = mergeUniqueAccounts(
    mergeHqDistributorAccountsForDisplay(accounts),
    [VINO_NORD_ACCOUNT],
  );
  const wholesale = filterWholesaleOrdersForHq(orders, mergedAccounts);
  if (wholesale.length >= 5) {
    return { orders, accounts: mergedAccounts };
  }
  return {
    orders: mergeUniqueOrders(orders, HQ_WHOLESALE_DEMO_ORDERS),
    accounts: mergedAccounts,
  };
}

/** Network retail sell-through for Distributor sales visibility. */
export function mergeHqNetworkSalesForDisplay(
  salesOrders: SalesOrder[],
  accounts: Account[],
  teamMembers: TeamMember[],
): { salesOrders: SalesOrder[]; accounts: Account[]; teamMembers: TeamMember[] } {
  return {
    salesOrders: mergeUniqueOrders(salesOrders, HQ_DISTRIBUTOR_NETWORK_SALES_ORDERS),
    accounts: mergeUniqueAccounts(
      mergeHqDistributorAccountsForDisplay(accounts),
      HQ_DISTRIBUTOR_NETWORK_RETAIL_ACCOUNTS,
    ),
    teamMembers: mergeUniqueTeam(teamMembers, HQ_DISTRIBUTOR_NETWORK_REPS),
  };
}
