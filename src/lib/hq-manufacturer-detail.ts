import type { PurchaseOrder } from "@/data/mockData";
import type { ManufacturerProfile } from "@/types/app-data";
import { demoManufacturerIdForName } from "@/lib/hq-manufacturers-demo";
import {
  isHqManufacturerPartnerId,
  loadHqManufacturerPartner,
  type HqManufacturerPartnerConfig,
} from "@/lib/hq-manufacturer-partners";

export type ManufacturerBatchRow = {
  id: string;
  sku: string;
  stage: string;
  eta: string;
  statusTone: "green" | "amber" | "red" | "blue" | "neutral";
  statusLabel: string;
};

export type ManufacturerRequestRow = {
  id: string;
  date: string;
  items: string;
  statusTone: "green" | "amber" | "red" | "blue" | "neutral";
  statusLabel: string;
};

export type ManufacturerPartnerDetail = {
  id: string;
  name: string;
  sub: string;
  tier: string;
  tierIsPreferred: boolean;
  statusTone: "green" | "amber" | "red" | "neutral";
  statusLabel: string;
  locationLine: string;
  contactLine: string;
  email: string;
  phone: string;
  quality: string;
  onTime: string;
  capacity: string;
  activeBatches: number;
  partnerSince: string;
  premium: string;
  rice: string;
  skus: string[];
  batches: ManufacturerBatchRow[];
  requests: ManufacturerRequestRow[];
};

const DEMO_BATCHES: Record<string, ManufacturerBatchRow[]> = {
  kosapan: [
    { id: "K-0312", sku: "Hajime Original 750ml", stage: "Fermenting · Day 14", eta: "22 Jun", statusTone: "blue", statusLabel: "fermenting" },
    { id: "K-0311", sku: "Hajime Yuzu 750ml", stage: "Pressing · Day 28", eta: "8 Jun", statusTone: "blue", statusLabel: "pressing" },
    { id: "K-0310", sku: "Kosapan Reserve 720ml", stage: "Kōji · Day 6", eta: "2 Jul", statusTone: "green", statusLabel: "kōji" },
  ],
  kuramoto: [
    { id: "B-0418", sku: "Florin Peaks 750ml", stage: "Fermenting · Day 18", eta: "12 Jun", statusTone: "blue", statusLabel: "fermenting" },
    { id: "B-0417", sku: "Junmai Shiro 720ml", stage: "Pressing soon · Day 30", eta: "4 Jun", statusTone: "blue", statusLabel: "pressing" },
    { id: "B-0416", sku: "Ryusui Reserve 500ml", stage: "Bottling · Day 44", eta: "28 May", statusTone: "amber", statusLabel: "bottling" },
    { id: "B-0415", sku: "Florin Peaks 750ml", stage: "Kōji · Day 5", eta: "25 Jun", statusTone: "green", statusLabel: "kōji" },
  ],
  echigo: [
    { id: "E-0204", sku: "First Press 750ml", stage: "Fermenting · Day 12", eta: "18 Jun", statusTone: "blue", statusLabel: "fermenting" },
    { id: "E-0203", sku: "Shirogane Nigori 720ml", stage: "Pressing · Day 26", eta: "2 Jun", statusTone: "blue", statusLabel: "pressing" },
  ],
};

const DEMO_REQUESTS: Record<string, ManufacturerRequestRow[]> = {
  kosapan: [
    { id: "PR-2026-0145", date: "30 May", items: "360× Hajime Original", statusTone: "green", statusLabel: "in production" },
    { id: "PR-2026-0144", date: "28 May", items: "240× Hajime Yuzu", statusTone: "green", statusLabel: "approved" },
    { id: "PR-2026-0139", date: "26 May", items: "120× Kosapan Reserve", statusTone: "amber", statusLabel: "scheduling" },
  ],
  kuramoto: [
    { id: "PR-2026-0142", date: "28 May", items: "400× Florin Peaks", statusTone: "amber", statusLabel: "scheduling" },
    { id: "PR-2026-0141", date: "26 May", items: "120× Ryusui Reserve", statusTone: "amber", statusLabel: "quality hold" },
    { id: "PR-2026-0138", date: "2 May", items: "300× Junmai Shiro", statusTone: "green", statusLabel: "delivered" },
  ],
  echigo: [
    { id: "PR-2026-0140", date: "20 May", items: "200× First Press", statusTone: "green", statusLabel: "in production" },
    { id: "PR-2026-0133", date: "28 Apr", items: "150× Shirogane Nigori", statusTone: "green", statusLabel: "delivered" },
  ],
};

function poStatusTone(status: string): ManufacturerRequestRow["statusTone"] {
  if (status === "in-production" || status === "approved") return "green";
  if (status === "delayed") return "red";
  if (status === "draft") return "amber";
  return "neutral";
}

function poStatusLabel(status: string): string {
  if (status === "in-production") return "in production";
  if (status === "approved") return "approved";
  if (status === "delayed") return "delayed";
  if (status === "draft") return "scheduling";
  if (status === "delivered") return "delivered";
  return status;
}

function formatPoDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en", { day: "numeric", month: "short" });
}

function detailFromPartnerConfig(c: HqManufacturerPartnerConfig): ManufacturerPartnerDetail {
  return {
    id: c.id,
    name: c.name,
    sub: c.sub,
    tier: c.tier,
    tierIsPreferred: c.tierIsPreferred,
    statusTone: c.statusTone,
    statusLabel: c.statusLabel,
    locationLine: c.locationLine,
    contactLine: `${c.contactName} · ${c.contactRole}`,
    email: c.email,
    phone: c.phone,
    quality: c.quality,
    onTime: c.onTime,
    capacity: c.capacity,
    activeBatches: c.activeBatches,
    partnerSince: c.partnerSince,
    premium: c.premium,
    rice: c.rice,
    skus: c.skus,
    batches: DEMO_BATCHES[c.id] ?? [],
    requests: DEMO_REQUESTS[c.id] ?? [],
  };
}

function buildFromPurchaseOrders(
  manufacturerId: string,
  name: string,
  sub: string,
  purchaseOrders: PurchaseOrder[],
  seed?: ManufacturerPartnerDetail,
): ManufacturerPartnerDetail {
  const pos = purchaseOrders.filter(
    (p) =>
      p.poType !== "sales" &&
      (p.manufacturerId === manufacturerId ||
        p.manufacturer.toLowerCase().includes(name.toLowerCase().slice(0, 6))),
  );
  const active = pos.filter((p) => p.status === "in-production" || p.status === "approved");
  const openReq = pos.filter((p) => p.status === "draft" || p.status === "delayed").length;
  const onTimePct =
    pos.length > 0
      ? Math.round((pos.filter((p) => p.status !== "delayed").length / pos.length) * 1000) / 10
      : parseFloat(seed?.onTime ?? "96.2");

  const batches: ManufacturerBatchRow[] =
    active.length > 0
      ? active.slice(0, 6).map((po) => ({
          id: po.id,
          sku: po.sku,
          stage: po.status === "in-production" ? "In production" : "Approved · awaiting start",
          eta: po.requiredDate || po.requestedShipDate || "—",
          statusTone: po.status === "in-production" ? "blue" : "green",
          statusLabel: po.status === "in-production" ? "brewing" : "approved",
        }))
      : (seed?.batches ?? []);

  const requests: ManufacturerRequestRow[] =
    pos.length > 0
      ? pos.slice(0, 8).map((po) => ({
          id: po.id,
          date: formatPoDate(po.issueDate),
          items: `${Math.ceil(po.quantity / 12)}× ${po.sku}`,
          statusTone: poStatusTone(po.status),
          statusLabel: poStatusLabel(po.status),
        }))
      : (seed?.requests ?? []);

  const skus = [...new Set([...(seed?.skus ?? []), ...pos.map((p) => p.sku)])];

  return {
    id: manufacturerId,
    name,
    sub,
    tier: seed?.tier ?? "Preferred Kura",
    tierIsPreferred: seed?.tierIsPreferred ?? true,
    statusTone: openReq > 0 ? "amber" : (seed?.statusTone ?? "green"),
    statusLabel: openReq > 0 ? `${openReq} requests open` : (seed?.statusLabel ?? "on schedule"),
    locationLine: seed?.locationLine ?? sub,
    contactLine: seed?.contactLine ?? "Production partner",
    email: seed?.email ?? "—",
    phone: seed?.phone ?? "—",
    quality: seed?.quality ?? "98.0%",
    onTime: `${onTimePct}%`,
    capacity: seed?.capacity ?? `${Math.max(active.length, 1) * 800} cs/Q`,
    activeBatches: active.length || (seed?.activeBatches ?? 0),
    partnerSince: seed?.partnerSince ?? "—",
    premium: seed?.premium ?? "—",
    rice: seed?.rice ?? "—",
    skus: skus.length > 0 ? skus : ["—"],
    batches,
    requests,
  };
}

export function buildManufacturerPartnerDetail(
  manufacturerId: string,
  purchaseOrders: PurchaseOrder[],
  profile: ManufacturerProfile | null,
): ManufacturerPartnerDetail {
  const demoId =
    isHqManufacturerPartnerId(manufacturerId) ? manufacturerId : demoManufacturerIdForName(manufacturerId);

  if (demoId) {
    const config = loadHqManufacturerPartner(demoId);
    const seed = detailFromPartnerConfig(config);
    const mergedPos = buildFromPurchaseOrders(demoId, config.name, config.sub, purchaseOrders, seed);
    return { ...seed, ...mergedPos, skus: seed.skus, batches: mergedPos.batches.length ? mergedPos.batches : seed.batches };
  }

  if (profile) {
    const name = profile.companyName || "Manufacturer";
    const sub = [profile.address.city, profile.address.country].filter(Boolean).join(" · ") || "Kura partner";
    return buildFromPurchaseOrders(manufacturerId, name, sub, purchaseOrders);
  }

  return buildFromPurchaseOrders(manufacturerId, "Manufacturer", "Kura partner", purchaseOrders);
}
