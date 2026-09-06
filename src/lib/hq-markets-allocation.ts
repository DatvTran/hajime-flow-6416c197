import type { AppData } from "@/types/app-data";
import type { InventoryItem } from "@/data/mockData";
import type { MarketPanelRow } from "@/lib/brand-operator-metrics";
import type { MarketsHqMode } from "@/data/markets-hq-demo";
import { revenueInWindow } from "@/lib/hajime-metrics";
import { formatHqCompact } from "@/lib/hq-format";

export const HQ_ALLOCATION_HUBS = ["NYC", "Chicago", "Tokyo", "Paris", "Milan"] as const;
export type HqAllocationHub = (typeof HQ_ALLOCATION_HUBS)[number];

export type HqMarketCardRow = {
  id: string;
  name: string;
  sub: string;
  coverLabel: string;
  revenue: string;
  revenueSuffix: string;
  coverPct: number;
  coverTone: "low" | "med" | "ok";
  statusTone: "green" | "amber" | "red" | "neutral";
  statusLabel: string;
  skuCount: number;
  manageTo: string;
  daysCover: number | null;
};

export type SkuAllocationRow = {
  sku: string;
  name: string;
  total: number;
  byHub: Record<HqAllocationHub, number>;
  unallocated: number;
  lowHub?: HqAllocationHub;
};

function coverTone(days: number | null): "low" | "med" | "ok" {
  if (days == null || days <= 0) return "low";
  if (days < 21) return "low";
  if (days < 30) return "med";
  return "ok";
}

function healthMeta(h: MarketPanelRow["health"]): { tone: HqMarketCardRow["statusTone"]; label: string } {
  if (h === "healthy") return { tone: "green", label: "healthy" };
  if (h === "watch") return { tone: "amber", label: "monitor" };
  return { tone: "red", label: "low stock" };
}

const PANEL_TO_HUB: Record<string, HqAllocationHub | "London"> = {
  toronto: "NYC",
  ontario: "NYC",
  milan: "Milan",
  paris: "Paris",
  spain: "Paris",
};

const HUB_LABEL: Record<HqAllocationHub | "London", string> = {
  NYC: "NYC",
  Chicago: "Chicago",
  Tokyo: "Tokyo",
  Paris: "Paris",
  Milan: "Milan",
  London: "London",
};

function hubFromWarehouse(warehouse: string): HqAllocationHub | null {
  const w = warehouse.toLowerCase();
  if (w.includes("chicago")) return "Chicago";
  if (w.includes("tokyo") || w.includes("kanto")) return "Tokyo";
  if (w.includes("paris")) return "Paris";
  if (w.includes("milan")) return "Milan";
  if (w.includes("toronto") || w.includes("nyc") || w.includes("ontario")) return "NYC";
  return null;
}

function distributorSubForHub(data: AppData, hub: string): string {
  const distributors = data.accounts.filter((a) => a.type === "distributor");
  const match = distributors.find((d) => {
    const city = (d.city || "").toLowerCase();
    const name = (d.tradingName || d.legalName || "").toLowerCase();
    const hubKey = hub.toLowerCase();
    if (hubKey === "nyc" && (city.includes("toronto") || city.includes("new york") || name.includes("empire"))) return true;
    if (hubKey === "chicago" && (city.includes("chicago") || name.includes("midwest"))) return true;
    if (hubKey === "tokyo" && (city.includes("tokyo") || name.includes("kanto"))) return true;
    if (hubKey === "paris" && (city.includes("paris") || name.includes("cave"))) return true;
    if (hubKey === "milan" && (city.includes("milan") || name.includes("vino"))) return true;
    return city.includes(hubKey);
  });
  if (!match) return "Distribution partner";
  const label = match.tradingName || match.legalName || "Partner";
  const acctCount = data.accounts.filter(
    (a) => a.type !== "distributor" && (a.city === match.city || a.distributorOrgId === match.distributorOrgId),
  ).length;
  return acctCount > 0 ? `${label} · ${acctCount} accounts` : label;
}

function skuCountForHub(inventory: InventoryItem[], hub: HqAllocationHub): number {
  const skus = new Set<string>();
  for (const row of inventory) {
    if (row.status !== "available") continue;
    const h = hubFromWarehouse(row.warehouse);
    if (h === hub) skus.add(row.sku);
  }
  return skus.size;
}

export function buildHqMarketCards(
  data: AppData,
  panelRows: MarketPanelRow[],
  mode: MarketsHqMode,
  asOf: Date,
): HqMarketCardRow[] {
  if (mode !== "live") return [];

  const cards: HqMarketCardRow[] = [];
  const seen = new Set<string>();

  for (const row of panelRows) {
    const hub = PANEL_TO_HUB[row.id];
    if (!hub || seen.has(hub)) continue;
    seen.add(hub);
    const hubLabel = HUB_LABEL[hub];
    const rev = revenueInWindow(
      data.salesOrders.filter((o) => {
        const m = (o.market || "").toLowerCase();
        if (hub === "NYC") return m.includes("toronto") || m.includes("ontario") || m.includes("nyc");
        return m.includes(hubLabel.toLowerCase());
      }),
      90,
      asOf,
    );
    const pill = healthMeta(row.health);
    cards.push({
      id: row.id,
      name: hubLabel,
      sub: distributorSubForHub(data, hubLabel),
      coverLabel: row.daysCover != null ? `${row.daysCover} days cover` : "Not yet live",
      revenue: rev > 0 ? formatHqCompact(rev) : "—",
      revenueSuffix: rev > 0 ? " Q2" : "",
      coverPct: row.daysCover != null ? Math.min(100, (row.daysCover / 50) * 100) : 0,
      coverTone: coverTone(row.daysCover),
      statusTone: pill.tone,
      statusLabel: pill.label,
      skuCount: skuCountForHub(data.inventory, hub),
      manageTo: "/accounts",
      daysCover: row.daysCover,
    });
  }

  return cards;
}

export function buildSkuAllocationRows(data: AppData, mode: MarketsHqMode): SkuAllocationRow[] {
  if (mode !== "live") return [];

  const bySku = new Map<
    string,
    { name: string; total: number; byHub: Record<HqAllocationHub, number> }
  >();

  for (const row of data.inventory) {
    if (row.status !== "available") continue;
    const hub = hubFromWarehouse(row.warehouse);
    const cases = row.quantityCases || Math.round(row.quantityBottles / 12);
    let entry = bySku.get(row.sku);
    if (!entry) {
      entry = {
        name: row.productName.replace(/\s+\d+ml$/i, "").replace(/^Hajime\s+/i, ""),
        total: 0,
        byHub: { NYC: 0, Chicago: 0, Tokyo: 0, Paris: 0, Milan: 0 },
      };
      bySku.set(row.sku, entry);
    }
    entry.total += cases;
    if (hub) entry.byHub[hub] += cases;
  }

  const rows = [...bySku.entries()]
    .map(([sku, v]) => {
      const allocated = HQ_ALLOCATION_HUBS.reduce((s, h) => s + v.byHub[h], 0);
      const lowHub = HQ_ALLOCATION_HUBS.find((h) => v.byHub[h] > 0 && v.byHub[h] < 50);
      return {
        sku,
        name: v.name,
        total: v.total,
        byHub: v.byHub,
        unallocated: Math.max(0, v.total - allocated),
        lowHub,
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  return rows;
}

export function hqMarketsLowCoverAlert(
  cards: HqMarketCardRow[],
  _mode: MarketsHqMode,
): { market: string; message: string } | null {
  const low = cards.find((c) => c.daysCover != null && c.daysCover < 21 && c.daysCover > 0);
  if (!low) return null;
  return {
    market: low.name,
    message: `${low.daysCover} days remaining vs 21-day floor. Review stock and reallocate surplus.`,
  };
}
