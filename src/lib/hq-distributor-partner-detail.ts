import type { Account, InventoryItem, Product, SalesOrder } from "@/data/mockData";
import { filterRowsForOrg, filterWholesaleOrdersForHq } from "@/lib/hq-order-scope";
import {
  buildHqDistributorDemoDetail,
  demoOrgIdForDistributorName,
  isHqDistributorDemoOrgId,
} from "@/lib/hq-distributors-demo";

const MS_DAY = 86400000;

export type DcInventoryRow = {
  sku: string;
  name: string;
  onHandCases: number;
  allocatedCases: number;
  coverDays: number;
  coverLabel: string;
  health: "low" | "med" | "ok";
  healthLabel: string;
};

export type ReplenishmentRow = {
  id: string;
  date: string;
  items: string;
  statusTone: "green" | "amber" | "red" | "blue" | "neutral";
  statusLabel: string;
};

export type DistributorPartnerDetail = {
  orgId: string;
  name: string;
  tier: string;
  tierIsGold: boolean;
  statusTone: "green" | "amber" | "red" | "neutral";
  statusLabel: string;
  marketLine: string;
  shipLine: string;
  contactLine: string;
  email: string;
  phone: string;
  fillRate: number;
  onTime: number;
  accountCount: number;
  partnerSince: string;
  terms: string;
  rebate: string;
  dcInventory: DcInventoryRow[];
  replenishments: ReplenishmentRow[];
};

function inferTier(account: Account): { tier: string; isGold: boolean } {
  const tags = (account.tags ?? []).map((t) => t.toLowerCase());
  if (tags.some((t) => t.includes("gold") || t.includes("platinum"))) {
    return { tier: "Gold Partner", isGold: true };
  }
  if (tags.some((t) => t.includes("silver"))) {
    return { tier: "Silver Partner", isGold: false };
  }
  if (account.pricingTier === "key" || account.pricingTier === "premium") {
    return { tier: "Gold Partner", isGold: true };
  }
  return { tier: "Silver Partner", isGold: false };
}

function coverHealth(days: number): { health: DcInventoryRow["health"]; label: string } {
  if (days < 14) return { health: "low", label: "below reorder" };
  if (days < 21) return { health: "med", label: "monitor" };
  return { health: "ok", label: "healthy" };
}

function formatCover(days: number): string {
  if (!Number.isFinite(days) || days <= 0) return "—";
  return `${Math.round(days)} days`;
}

function partnerSinceLabel(account: Account): string {
  const raw = account.applicationSubmittedAt || account.lastContactDate;
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en", { month: "short", year: "numeric" });
}

function rebateLabel(account: Account): string {
  const tag = account.tags?.find((t) => /rebate|volume/i.test(t));
  if (tag) return tag;
  const { isGold } = inferTier(account);
  return isGold ? "3% volume" : "2% volume";
}

function findPlatformAccount(orgId: string, orgName: string, accounts: Account[]): Account | undefined {
  const byOrg = accounts.find(
    (a) => a.type === "distributor" && String(a.distributorOrgId ?? "") === String(orgId),
  );
  if (byOrg) return byOrg;
  const label = orgName.trim().toLowerCase();
  return accounts.find(
    (a) =>
      a.type === "distributor" &&
      !a.distributorOrgId &&
      ((a.tradingName || "").trim().toLowerCase() === label ||
        (a.legalName || "").trim().toLowerCase() === label),
  );
}

function wholesaleOrdersForPartner(
  orgId: string,
  orgName: string,
  orders: SalesOrder[],
  accounts: Account[],
): SalesOrder[] {
  const platform = findPlatformAccount(orgId, orgName, accounts);
  const wholesale = filterWholesaleOrdersForHq(orders, accounts);
  if (!platform) {
    return wholesale.filter(
      (o) =>
        (o.account || "").trim().toLowerCase() === orgName.trim().toLowerCase() ||
        String(o.distributorOrgName ?? "").trim().toLowerCase() === orgName.trim().toLowerCase(),
    );
  }
  const label = (platform.tradingName || platform.legalName || "").trim().toLowerCase();
  return wholesale.filter((o) => (o.account || "").trim().toLowerCase() === label);
}

function buildDcInventory(
  orgId: string,
  inventory: InventoryItem[],
  products: Product[],
  networkOrders: SalesOrder[],
): DcInventoryRow[] {
  const scoped = filterRowsForOrg(inventory, orgId).filter(
    (i) => i.locationType === "distributor_warehouse" && i.status !== "damaged",
  );

  const bySku = new Map<string, { onHand: number; allocated: number; name: string }>();

  for (const row of scoped) {
    const cur = bySku.get(row.sku) ?? { onHand: 0, allocated: 0, name: row.productName };
    if (row.status === "reserved") cur.allocated += row.quantityCases || Math.ceil(row.quantityBottles / 12);
    else cur.onHand += row.quantityCases || Math.ceil(row.quantityBottles / 12);
    bySku.set(row.sku, cur);
  }

  if (bySku.size === 0) {
    const skuVelocity = new Map<string, number>();
    const windowMs = 30 * MS_DAY;
    const now = Date.now();
    for (const o of networkOrders) {
      const t = Date.parse(o.orderDate);
      if (Number.isNaN(t) || now - t > windowMs) continue;
      const cases = o.lines?.length
        ? o.lines.reduce((s, l) => s + Math.ceil(l.quantityBottles / 12), 0)
        : Math.ceil(o.quantity / 12);
      skuVelocity.set(o.sku, (skuVelocity.get(o.sku) ?? 0) + cases);
    }
    const topSkus = [...skuVelocity.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    if (topSkus.length > 0) {
      return topSkus.map(([sku, monthlyCases]) => {
        const product = products.find((p) => p.sku === sku);
        const onHand = Math.max(24, Math.round(monthlyCases * 1.4));
        const allocated = Math.round(monthlyCases * 0.2);
        const daily = monthlyCases / 30;
        const coverDays = daily > 0 ? onHand / daily : 45;
        const { health, label } = coverHealth(coverDays);
        return {
          sku,
          name: product?.name ?? sku,
          onHandCases: onHand,
          allocatedCases: allocated,
          coverDays,
          coverLabel: formatCover(coverDays),
          health,
          healthLabel: label,
        };
      });
    }
  }

  return [...bySku.entries()].map(([sku, v]) => {
    const monthlyCases =
      networkOrders.filter((o) => o.sku === sku).reduce((s, o) => s + Math.ceil(o.quantity / 12), 0) / 3;
    const daily = monthlyCases / 30;
    const coverDays = daily > 0 ? v.onHand / daily : 45;
    const { health, label } = coverHealth(coverDays);
    return {
      sku,
      name: v.name,
      onHandCases: v.onHand,
      allocatedCases: v.allocated,
      coverDays,
      coverLabel: formatCover(coverDays),
      health,
      healthLabel: label,
    };
  });
}

function replenishmentLabel(order: SalesOrder): string {
  const cases = Math.ceil(order.quantity / 12);
  const pallets = Math.max(1, Math.ceil(cases / 48));
  const skuShort = order.sku.replace(/^HJM-/, "").split("-")[0] || order.sku;
  return `${pallets} pallet${pallets !== 1 ? "s" : ""} · ${skuShort}`;
}

function replenStatus(order: SalesOrder): { tone: ReplenishmentRow["statusTone"]; label: string } {
  if (order.status === "draft") return { tone: "red", label: "urgent · pending" };
  if (order.status === "confirmed") return { tone: "amber", label: "pending" };
  if (order.status === "shipped" || order.status === "packed") return { tone: "blue", label: "in transit" };
  if (order.status === "delivered") return { tone: "green", label: "delivered" };
  return { tone: "neutral", label: order.status };
}

export function buildDistributorPartnerDetail(
  orgId: string,
  orgName: string,
  accounts: Account[],
  orders: SalesOrder[],
  inventory: InventoryItem[],
  products: Product[],
  metrics: { fillRate: number; onTime: number; accountCount: number },
): DistributorPartnerDetail {
  const demoId = isHqDistributorDemoOrgId(orgId) ? orgId : demoOrgIdForDistributorName(orgName);
  if (demoId) {
    const demo = buildHqDistributorDemoDetail(demoId);
    if (demo) return demo;
  }

  const platform = findPlatformAccount(orgId, orgName, accounts);
  const account =
    platform ??
    ({
      tradingName: orgName,
      legalName: orgName,
      city: "—",
      type: "distributor",
      status: "active",
    } as Account);

  const { tier, isGold } = inferTier(account);
  const contact = account.salesOwner || account.contactName || "—";
  const city = account.city || "—";

  const scopedInv = filterRowsForOrg(inventory, orgId);
  const warehouses = new Set(
    scopedInv.filter((i) => i.locationType === "distributor_warehouse").map((i) => i.warehouse),
  );
  const dcCount = warehouses.size || 1;

  const networkOrders = filterRowsForOrg(orders, orgId);
  const wholesaleOrders = wholesaleOrdersForPartner(orgId, orgName, orders, accounts);
  const dcInventory = buildDcInventory(orgId, inventory, products, networkOrders);
  const replenishments: ReplenishmentRow[] = wholesaleOrders
    .filter((o) => o.status !== "cancelled")
    .sort((a, b) => Date.parse(b.orderDate) - Date.parse(a.orderDate))
    .slice(0, 6)
    .map((o) => {
      const st = replenStatus(o);
      return {
        id: o.orderNumber ?? o.id,
        date: o.orderDate
          ? new Date(o.orderDate).toLocaleDateString("en", { day: "numeric", month: "short" })
          : "—",
        items: replenishmentLabel(o),
        statusTone: st.tone,
        statusLabel: st.label,
      };
    });

  const fill = metrics.fillRate;
  const onTime = metrics.onTime;
  let statusTone: DistributorPartnerDetail["statusTone"] = "green";
  let statusLabel = "active";
  if (account.status === "inactive") {
    statusTone = "neutral";
    statusLabel = "inactive";
  } else if (fill < 94 || onTime < 92) {
    statusTone = "amber";
    statusLabel = "monitor";
  }

  if (dcInventory.length === 0 && replenishments.length === 0) {
    const fallbackId = demoOrgIdForDistributorName(account.tradingName || account.legalName || orgName);
    if (fallbackId) {
      const demo = buildHqDistributorDemoDetail(fallbackId);
      if (demo) return demo;
    }
  }

  return {
    orgId,
    name: account.tradingName || account.legalName || orgName,
    tier,
    tierIsGold: isGold,
    statusTone,
    statusLabel,
    marketLine: `${city} · ${contact}`,
    shipLine: `${city} · ${dcCount} DC${dcCount !== 1 ? "s" : ""}`,
    contactLine: contact,
    email: account.email || "—",
    phone: account.phone || "—",
    fillRate: fill,
    onTime,
    accountCount: metrics.accountCount,
    partnerSince: partnerSinceLabel(account),
    terms: account.paymentTerms || "Net 30",
    rebate: rebateLabel(account),
    dcInventory,
    replenishments,
  };
}

export function partnerInitials(name: string): string {
  const parts = name.split(/\s+/).filter((w) => /[A-Z0-9]/.test(w[0] ?? ""));
  if (parts.length >= 2) {
    return parts
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return "?";
}
