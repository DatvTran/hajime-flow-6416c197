import type { Account, PurchaseOrder } from "@/data/mockData";
import type { ManufacturerProfile } from "@/types/app-data";
import { mergeHqManufacturerAccountsForDisplay } from "@/lib/hq-manufacturers-demo";
import {
  configToListRow,
  isHqManufacturerPartnerDeleted,
  isHqManufacturerPartnerId,
  listHqManufacturerPartners,
} from "@/lib/hq-manufacturer-partners";

export type HqManufacturerListRow = {
  id: string;
  name: string;
  sub: string;
  tier: string;
  quality: string;
  onTime: string;
  cap: string;
  statusTone: "green" | "amber" | "red" | "neutral";
  statusLabel: string;
  activeBatches: number;
};

export type HqManufacturersKpi = {
  activeBatches: number;
  casesInProduction: number;
  qualityGrade: string;
  openRequests: number;
  kuraCount: number;
  useDesignDemo: boolean;
};

export const HQ_MANUFACTURERS_DEMO_KPI: HqManufacturersKpi = {
  activeBatches: 9,
  casesInProduction: 7560,
  qualityGrade: "A",
  openRequests: 4,
  kuraCount: 3,
  useDesignDemo: true,
};

function manufacturerAccounts(accounts: Account[]): Account[] {
  return accounts.filter((a) => a.type === "manufacturer" && !a.distributorOrgId);
}

function productionPos(purchaseOrders: PurchaseOrder[]): PurchaseOrder[] {
  return purchaseOrders.filter((p) => p.poType !== "sales");
}

export function computeHqManufacturersKpi(
  purchaseOrders: PurchaseOrder[],
  rowCount: number,
  useDesignDemo: boolean,
): HqManufacturersKpi {
  if (useDesignDemo) return { ...HQ_MANUFACTURERS_DEMO_KPI, kuraCount: rowCount };

  const pos = productionPos(purchaseOrders);
  const activeBatches = pos.filter((p) => p.status === "in-production" || p.status === "approved").length;
  const casesInProduction = pos
    .filter((p) => p.status === "in-production" || p.status === "approved")
    .reduce((s, p) => s + Math.ceil(p.quantity / 12), 0);
  const openRequests = pos.filter((p) => p.status === "draft" || p.status === "delayed").length;

  return {
    activeBatches,
    casesInProduction,
    qualityGrade: "A",
    openRequests,
    kuraCount: Math.max(1, rowCount),
    useDesignDemo: false,
  };
}

function rowFromAccount(acc: Account, pos: PurchaseOrder[]): HqManufacturerListRow {
  const name = acc.tradingName || acc.legalName;
  const mPos = pos.filter((po) => po.manufacturer.toLowerCase().includes(name.toLowerCase().slice(0, 6)));
  const onTimePct =
    mPos.length > 0
      ? Math.round((mPos.filter((po) => po.status !== "delayed").length / mPos.length) * 1000) / 10
      : 96.2;
  const openReq = mPos.filter((po) => po.status === "draft" || po.status === "delayed").length;
  const inProd = mPos.filter((po) => po.status === "in-production" || po.status === "approved").length;
  const tags = (acc.tags ?? []).map((t) => t.toLowerCase());
  const tier = tags.some((t) => t.includes("preferred") || t.includes("gold"))
    ? "Preferred Kura"
    : "Standard Kura";

  return {
    id: acc.id,
    name,
    sub: `${acc.city || "—"} · ${acc.contactName || acc.salesOwner || "—"}`,
    tier,
    quality: tags.includes("preferred") ? "98.2%" : "97.5%",
    onTime: `${onTimePct}%`,
    cap: inProd > 0 ? `${inProd * 660} cs/Q` : "—",
    statusTone: openReq > 0 ? "amber" : acc.status === "active" ? "green" : "neutral",
    statusLabel: openReq > 0 ? `${openReq} requests open` : acc.status === "active" ? "on schedule" : "planned",
    activeBatches: inProd,
  };
}

function mergePartnerRows(live: HqManufacturerListRow[]): HqManufacturerListRow[] {
  const seen = new Set(live.map((r) => r.id.toLowerCase()));
  const extras = listHqManufacturerPartners()
    .map(configToListRow)
    .filter((r) => !seen.has(r.id.toLowerCase()) && !isHqManufacturerPartnerDeleted(r.id));
  if (live.length >= 3 && extras.length === 0) return live;
  return extras.length > 0 ? [...live, ...extras] : live;
}

export function buildHqManufacturerListRows(
  accounts: Account[],
  purchaseOrders: PurchaseOrder[],
  profiles: ManufacturerProfile[],
): { rows: HqManufacturerListRow[]; useDesignDemo: boolean } {
  const mergedAccounts = mergeHqManufacturerAccountsForDisplay(accounts);
  const pos = productionPos(purchaseOrders);

  if (profiles.length > 0) {
    const rows = profiles.map((p) => {
      const name = p.companyName || "—";
      const mPos = pos.filter((po) =>
        po.manufacturer.toLowerCase().includes((name || "").toLowerCase().slice(0, 6)),
      );
      const onTimePct =
        mPos.length > 0
          ? Math.round((mPos.filter((po) => po.status !== "delayed").length / mPos.length) * 1000) / 10
          : 96.2;
      const inProd = mPos.filter((po) => po.status === "in-production").length;
      const openReq = mPos.filter((po) => po.status === "draft" || po.status === "delayed").length;
      return {
        id: p.id || p.manufacturerId || name.toLowerCase().replace(/\s+/g, "-"),
        name,
        sub: [p.address.city, p.address.country].filter(Boolean).join(" · ") || "Kura partner",
        tier: "Preferred Kura",
        quality: "98.6%",
        onTime: `${onTimePct}%`,
        cap: `${Math.max(inProd, 1) * 660} cs/Q`,
        statusTone: openReq > 0 ? ("amber" as const) : onTimePct >= 94 ? ("green" as const) : ("amber" as const),
        statusLabel: openReq > 0 ? `${openReq} requests open` : onTimePct >= 94 ? "on schedule" : "monitor",
        activeBatches: inProd || mPos.filter((po) => po.status === "approved").length,
      };
    });
    return { rows: mergePartnerRows(rows), useDesignDemo: false };
  }

  const mfrAccounts = manufacturerAccounts(mergedAccounts);
  if (mfrAccounts.length > 0) {
    const rows = mfrAccounts.map((acc) => rowFromAccount(acc, pos));
    const merged = mergePartnerRows(rows);
    const useDemo = merged.some((r) => isHqManufacturerPartnerId(r.id));
    return { rows: merged, useDesignDemo: useDemo && mfrAccounts.length < 3 };
  }

  const kirinPos = pos.filter((po) => po.manufacturer.toLowerCase().includes("kirin"));
  if (kirinPos.length > 0) {
    const onTimePct =
      Math.round((kirinPos.filter((po) => po.status !== "delayed").length / kirinPos.length) * 1000) / 10;
    const openReq = kirinPos.filter((po) => po.status === "draft" || po.status === "delayed").length;
    const active = kirinPos.filter((po) => po.status === "in-production" || po.status === "approved").length;
    return {
      rows: mergePartnerRows([
        {
          id: "kirin",
          name: "Kirin Brewery Co.",
          sub: "Niigata, Japan · Production partner",
          tier: "Preferred Kura",
          quality: "98.0%",
          onTime: `${onTimePct}%`,
          cap: `${Math.max(active, 1) * 800} cs/Q`,
          statusTone: openReq > 0 ? "amber" : "green",
          statusLabel: openReq > 0 ? `${openReq} requests open` : "on schedule",
          activeBatches: active,
        },
      ]),
      useDesignDemo: false,
    };
  }

  const demoRows = listHqManufacturerPartners().map(configToListRow);
  return { rows: demoRows, useDesignDemo: true };
}

export function manufacturerPartnerPath(manufacturerId: string): string {
  return `/manufacturer/profiles/${encodeURIComponent(manufacturerId)}`;
}

export function manufacturerInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter((w) => /[A-Z]/.test(w[0] ?? ""))
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || name.slice(0, 2).toUpperCase()
  );
}
