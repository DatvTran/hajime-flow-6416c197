import type { Account } from "@/data/mockData";
import type { HqManufacturerListRow } from "@/lib/hq-manufacturers-metrics";

export type HqManufacturerPartnerId = "kosapan" | "kuramoto" | "echigo";

export type HqManufacturerPartnerConfig = {
  id: HqManufacturerPartnerId;
  accountId: string;
  name: string;
  legalName: string;
  sub: string;
  tier: string;
  tierIsPreferred: boolean;
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  locationLine: string;
  partnerSince: string;
  premium: string;
  rice: string;
  capacity: string;
  quality: string;
  onTime: string;
  statusTone: HqManufacturerListRow["statusTone"];
  statusLabel: string;
  activeBatches: number;
  paymentTerms: string;
  tags: string[];
  skus: string[];
  internalNotes?: string;
  status: Account["status"];
};

const STORAGE_PREFIX = "hajime_hq_manufacturer_partner_";
const DELETED_KEY = "hajime_hq_manufacturer_partners_deleted";

export const HQ_MANUFACTURER_PARTNER_IDS: HqManufacturerPartnerId[] = ["kosapan", "kuramoto", "echigo"];

const BASE: Record<HqManufacturerPartnerId, HqManufacturerPartnerConfig> = {
  kosapan: {
    id: "kosapan",
    accountId: "demo-kosapan",
    name: "Kosapan Distillery",
    legalName: "Kosapan Distillery Co., Ltd.",
    sub: "Shizuoka, Japan · Tōji Ren Kosaka",
    tier: "Preferred Kura",
    tierIsPreferred: true,
    contactName: "Ren Kosaka",
    contactRole: "Tōji (Master Brewer)",
    email: "kosaka@kosapan.jp",
    phone: "+81 54-555-0199",
    city: "Shizuoka",
    country: "Japan",
    locationLine: "Shizuoka, Japan · est. 1956",
    partnerSince: "Mar 2024",
    premium: "¥2.5/btl quality",
    rice: "Omachi · estate contract",
    capacity: "3,120 cs/Q",
    quality: "98.2%",
    onTime: "95.8%",
    statusTone: "green",
    statusLabel: "on schedule",
    activeBatches: 3,
    paymentTerms: "Net 45",
    tags: ["preferred", "shizuoka", "kosapan"],
    skus: ["Hajime Original 750ml", "Hajime Yuzu 750ml", "Kosapan Reserve 720ml"],
    internalNotes: "Primary contract kura for Original and Yuzu lines. Single-tank precision batches.",
    status: "active",
  },
  kuramoto: {
    id: "kuramoto",
    accountId: "demo-kuramoto",
    name: "Kuramoto Brewing",
    legalName: "Kuramoto Brewing Co., Ltd.",
    sub: "Niigata, Japan · Tōji Haruki Sato",
    tier: "Preferred Kura",
    tierIsPreferred: true,
    contactName: "Haruki Sato",
    contactRole: "Tōji (Master Brewer)",
    email: "sato@kuramoto.jp",
    phone: "+81 25-555-0142",
    city: "Niigata",
    country: "Japan",
    locationLine: "Niigata, Japan · est. 1924",
    partnerSince: "Jan 2024",
    premium: "¥2/btl quality",
    rice: "Yamada Nishiki · contract",
    capacity: "2,640 cs/Q",
    quality: "98.6%",
    onTime: "96.2%",
    statusTone: "amber",
    statusLabel: "2 requests open",
    activeBatches: 4,
    paymentTerms: "Net 45",
    tags: ["preferred", "niigata", "gold"],
    skus: ["Florin Peaks 750ml", "Junmai Shiro 720ml", "Ryusui Reserve 500ml"],
    internalNotes: "Flagship kura for Florin Peaks and limited Reserve lots.",
    status: "active",
  },
  echigo: {
    id: "echigo",
    accountId: "demo-echigo",
    name: "Echigo Kura",
    legalName: "Echigo Kura Ltd.",
    sub: "Niigata, Japan · Tōji Ken Mori",
    tier: "Standard Kura",
    tierIsPreferred: false,
    contactName: "Ken Mori",
    contactRole: "Tōji",
    email: "mori@echigo-kura.jp",
    phone: "+81 25-555-0188",
    city: "Niigata",
    country: "Japan",
    locationLine: "Niigata, Japan · est. 1890",
    partnerSince: "Aug 2024",
    premium: "¥1.5/btl quality",
    rice: "Gohyakumangoku · contract",
    capacity: "1,800 cs/Q",
    quality: "97.1%",
    onTime: "94.0%",
    statusTone: "green",
    statusLabel: "on schedule",
    activeBatches: 2,
    paymentTerms: "Net 30",
    tags: ["standard", "niigata"],
    skus: ["First Press 750ml", "Shirogane Nigori 720ml"],
    status: "active",
  },
};

function readDeleted(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeDeleted(ids: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DELETED_KEY, JSON.stringify([...ids]));
}

export function isHqManufacturerPartnerId(id: string): id is HqManufacturerPartnerId {
  return HQ_MANUFACTURER_PARTNER_IDS.includes(id as HqManufacturerPartnerId);
}

export function isHqManufacturerPartnerDeleted(id: string): boolean {
  return readDeleted().has(id);
}

export function loadHqManufacturerPartner(id: HqManufacturerPartnerId): HqManufacturerPartnerConfig {
  const base = BASE[id];
  const snapshot: HqManufacturerPartnerConfig = { ...base, tags: [...base.tags], skus: [...base.skus] };
  if (typeof window === "undefined") return snapshot;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
    if (!raw) return snapshot;
    const parsed = JSON.parse(raw) as Partial<HqManufacturerPartnerConfig>;
    return {
      ...snapshot,
      ...parsed,
      id,
      tags: parsed.tags ?? snapshot.tags,
      skus: parsed.skus ?? snapshot.skus,
    };
  } catch {
    return snapshot;
  }
}

export function saveHqManufacturerPartner(config: HqManufacturerPartnerConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_PREFIX}${config.id}`, JSON.stringify(config));
}

export function deleteHqManufacturerPartner(id: HqManufacturerPartnerId): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${STORAGE_PREFIX}${id}`);
  const deleted = readDeleted();
  deleted.add(id);
  writeDeleted(deleted);
}

export function listHqManufacturerPartners(): HqManufacturerPartnerConfig[] {
  const deleted = readDeleted();
  return HQ_MANUFACTURER_PARTNER_IDS.filter((id) => !deleted.has(id)).map((id) =>
    loadHqManufacturerPartner(id),
  );
}

export function manufacturerPartnerEditPath(id: string): string {
  return `/manufacturer/profiles/${encodeURIComponent(id)}/edit`;
}

export function configToListRow(c: HqManufacturerPartnerConfig): HqManufacturerListRow {
  return {
    id: c.id,
    name: c.name,
    sub: c.sub,
    tier: c.tier,
    quality: c.quality,
    onTime: c.onTime,
    cap: c.capacity,
    statusTone: c.statusTone,
    statusLabel: c.statusLabel,
    activeBatches: c.activeBatches,
  };
}

export function configToPlatformAccount(c: HqManufacturerPartnerConfig): Account {
  return {
    id: c.accountId,
    legalName: c.legalName,
    tradingName: c.name,
    city: c.city,
    country: c.country,
    type: "manufacturer",
    contactName: c.contactName,
    contactRole: c.contactRole,
    phone: c.phone,
    email: c.email,
    salesOwner: c.contactName,
    paymentTerms: c.paymentTerms,
    firstOrderDate: "2024-01-01",
    lastOrderDate: "2026-06-01",
    avgOrderSize: 800,
    status: c.status,
    tags: c.tags,
    internalNotes: c.internalNotes,
  };
}

export function partnerConfigFromAccount(acc: Account, id: HqManufacturerPartnerId): HqManufacturerPartnerConfig {
  const base = loadHqManufacturerPartner(id);
  const name = acc.tradingName || acc.legalName || base.name;
  return {
    ...base,
    name,
    legalName: acc.legalName || name,
    sub: `${acc.city || base.city} · ${acc.contactName || base.contactName}`,
    contactName: acc.contactName || base.contactName,
    email: acc.email || base.email,
    phone: acc.phone || base.phone,
    city: acc.city || base.city,
    country: acc.country || base.country,
    paymentTerms: acc.paymentTerms || base.paymentTerms,
    status: acc.status ?? base.status,
    internalNotes: acc.internalNotes ?? base.internalNotes,
    tags: acc.tags?.length ? acc.tags : base.tags,
  };
}
