import type { Account, PurchaseOrder } from "@/data/mockData";
import type { ManufacturerProfile } from "@/types/app-data";
import { mergeHqManufacturerAccountsForDisplay } from "@/lib/hq-manufacturers-demo";
import {
  configToListRow,
  hydratePartnerConfigsFromProfiles,
  isHqManufacturerPartnerId,
  isLegacyKirinAccount,
  isLegacyKirinProfilesListRow,
  isManufacturerHidden,
  listHqManufacturerPartnersForProfilesList,
  loadHqManufacturerPartner,
  resolveHqManufacturerPartnerId,
  type HqManufacturerPartnerId,
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
    ? "Preferred manufacturer partner"
    : "Standard manufacturer partner";

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

function partnerIdForListRow(row: HqManufacturerListRow): HqManufacturerPartnerId | null {
  return resolveHqManufacturerPartnerId(row.id) ?? resolveHqManufacturerPartnerId(row.name);
}

function overlayPartnerConfigOnRows(rows: HqManufacturerListRow[]): HqManufacturerListRow[] {
  return rows.map((row) => {
    const partnerId = partnerIdForListRow(row);
    if (!partnerId) return row;
    const partnerRow = configToListRow(loadHqManufacturerPartner(partnerId));
    return { ...partnerRow, id: row.id };
  });
}

function rowFromPoManufacturer(manufacturerName: string, pos: PurchaseOrder[]): HqManufacturerListRow {
  const norm = manufacturerName.trim().toLowerCase();
  const mPos = pos.filter((po) => po.manufacturer.trim().toLowerCase() === norm);
  const onTimePct =
    mPos.length > 0
      ? Math.round((mPos.filter((po) => po.status !== "delayed").length / mPos.length) * 1000) / 10
      : 96.2;
  const openReq = mPos.filter((po) => po.status === "draft" || po.status === "delayed").length;
  const active = mPos.filter((po) => po.status === "in-production" || po.status === "approved").length;
  const slug = norm.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "manufacturer";

  return {
    id: slug,
    name: manufacturerName.trim(),
    sub: "Production partner",
    tier: "Preferred manufacturer partner",
    quality: "98.0%",
    onTime: `${onTimePct}%`,
    cap: `${Math.max(active, 1) * 800} cs/Q`,
    statusTone: openReq > 0 ? "amber" : "green",
    statusLabel: openReq > 0 ? `${openReq} requests open` : "on schedule",
    activeBatches: active,
  };
}

function rowMatchesManufacturer(row: HqManufacturerListRow, manufacturerName: string): boolean {
  const norm = manufacturerName.trim().toLowerCase();
  if (!norm) return true;
  const rowName = row.name.trim().toLowerCase();
  const rowId = row.id.trim().toLowerCase();
  if (rowName === norm || rowId === norm) return true;
  if (rowName.includes(norm.slice(0, 6)) || norm.includes(rowName.slice(0, 6))) return true;
  for (const partnerId of HQ_MANUFACTURER_PARTNER_IDS) {
    const partner = loadHqManufacturerPartner(partnerId);
    if (partner.accountId.toLowerCase() === rowId && norm.includes(partner.name.toLowerCase().slice(0, 6))) {
      return true;
    }
  }
  return false;
}

function rowsFromPoManufacturers(pos: PurchaseOrder[], existing: HqManufacturerListRow[]): HqManufacturerListRow[] {
  // HQ partner configs are the source of truth — skip PO-only synthetic rows when partners exist.
  if (listHqManufacturerPartnersForProfilesList().length > 0) return [];

  const names = [...new Set(pos.map((po) => po.manufacturer.trim()).filter(Boolean))].filter(
    (name) => !/kirin/i.test(name),
  );
  return names
    .filter((name) => !existing.some((row) => rowMatchesManufacturer(row, name)))
    .map((name) => rowFromPoManufacturer(name, pos));
}

function shouldHideLegacyPoManufacturerRow(row: HqManufacturerListRow): boolean {
  if (isHqManufacturerPartnerId(row.id)) return false;
  if (isLegacyKirinProfilesListRow(row)) return true;
  if (listHqManufacturerPartnersForProfilesList().length === 0) return false;
  return /kirin/i.test(row.name);
}

function filterHiddenManufacturerRows(rows: HqManufacturerListRow[]): HqManufacturerListRow[] {
  return rows.filter((row) => {
    if (isHqManufacturerPartnerId(row.id)) {
      return !shouldHideLegacyPoManufacturerRow(row);
    }
    return (
      !shouldHideLegacyPoManufacturerRow(row) &&
      !isManufacturerHidden(row.id) &&
      !isManufacturerHidden(row.name) &&
      !isManufacturerHidden(row.name.toLowerCase().replace(/\s+/g, "-"))
    );
  });
}

function rowFromProfile(p: ManufacturerProfile, pos: PurchaseOrder[]): HqManufacturerListRow {
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
    id:
      resolveHqManufacturerPartnerId(p.manufacturerId || p.id || name) ||
      p.manufacturerId ||
      p.id ||
      name.toLowerCase().replace(/\s+/g, "-"),
    name,
    sub: [p.address.city, p.address.country].filter(Boolean).join(" · ") || "Manufacturer partner",
    tier: "Preferred manufacturer partner",
    quality: "98.6%",
    onTime: `${onTimePct}%`,
    cap: `${Math.max(inProd, 1) * 660} cs/Q`,
    statusTone: openReq > 0 ? ("amber" as const) : onTimePct >= 94 ? ("green" as const) : ("amber" as const),
    statusLabel: openReq > 0 ? `${openReq} requests open` : onTimePct >= 94 ? "on schedule" : "monitor",
    activeBatches: inProd || mPos.filter((po) => po.status === "approved").length,
  };
}

function dedupeManufacturerRows(rows: HqManufacturerListRow[]): HqManufacturerListRow[] {
  const seen = new Set<string>();
  const out: HqManufacturerListRow[] = [];
  for (const row of rows) {
    const keys = [row.id.toLowerCase(), row.name.trim().toLowerCase()];
    if (keys.some((k) => seen.has(k))) continue;
    for (const k of keys) seen.add(k);
    out.push(row);
  }
  return out;
}

export function buildHqManufacturerListRows(
  accounts: Account[],
  purchaseOrders: PurchaseOrder[],
  profiles: ManufacturerProfile[],
): { rows: HqManufacturerListRow[]; useDesignDemo: boolean } {
  const mergedAccounts = mergeHqManufacturerAccountsForDisplay(accounts);
  const pos = productionPos(purchaseOrders);

  const partnerRows = listHqManufacturerPartnersForProfilesList(profiles).map(configToListRow);

  const profileRows = profiles
    .filter(
      (p) =>
        !isManufacturerHidden(p.id) &&
        !isManufacturerHidden(p.manufacturerId) &&
        !isManufacturerHidden((p.companyName || "").toLowerCase().replace(/\s+/g, "-")),
    )
    .map((p) => rowFromProfile(p, pos))
    .filter((row) => !partnerRows.some((partner) => rowMatchesManufacturer(partner, row.name)));

  const linkedIds = new Set(
    profiles.flatMap((p) => [p.manufacturerId, p.id].filter(Boolean).map((s) => s.toLowerCase())),
  );
  const linkedNames = new Set(
    profiles.map((p) => (p.companyName || "").trim().toLowerCase()).filter(Boolean),
  );

  const accountRows = manufacturerAccounts(mergedAccounts)
    .filter((acc) => !isManufacturerHidden(acc.id))
    .filter((acc) => !isLegacyKirinAccount(acc))
    .filter((acc) => {
      const id = acc.id.toLowerCase();
      const name = (acc.tradingName || acc.legalName || "").trim().toLowerCase();
      if (linkedIds.has(id)) return false;
      if (name && linkedNames.has(name)) return false;
      return true;
    })
    .map((acc) => rowFromAccount(acc, pos))
    .filter(
      (row) =>
        !partnerRows.some((partner) => rowMatchesManufacturer(partner, row.name)) &&
        !partnerRows.some((partner) => partner.id.toLowerCase() === row.id.toLowerCase()),
    );

  const combined = dedupeManufacturerRows([
    ...overlayPartnerConfigOnRows(partnerRows),
    ...profileRows,
    ...accountRows,
  ]);
  const poRows = rowsFromPoManufacturers(pos, combined);
  const merged = overlayPartnerConfigOnRows(dedupeManufacturerRows([...combined, ...poRows]));
  const mfrAccountCount = manufacturerAccounts(mergedAccounts).length;
  const useDemo = merged.some((r) => isHqManufacturerPartnerId(r.id));

  return {
    rows: filterHiddenManufacturerRows(merged),
    useDesignDemo: useDemo && mfrAccountCount < 3 && profileRows.length === 0,
  };
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
