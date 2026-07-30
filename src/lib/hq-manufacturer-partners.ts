import type { Account } from "@/data/mockData";
import type { Account } from "@/data/mockData";
import type { ManufacturerProfile } from "@/types/app-data";
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
  /** Contracted base inputs (grain, cane, botanicals, etc.) — not sake-specific. */
  rawMaterialsContract: string;
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
  /** Login email the manufacturer signs in with — connects their portal to this HQ partner. */
  portalLoginEmail?: string;
};

export const HQ_MANUFACTURER_PARTNER_IDS: HqManufacturerPartnerId[] = ["kosapan", "kuramoto", "echigo"];

const BASE: Record<HqManufacturerPartnerId, HqManufacturerPartnerConfig> = {
  kosapan: {
    id: "kosapan",
    accountId: "demo-kosapan",
    name: "Kosapan Distillery",
    legalName: "Kosapan Distillery Co., Ltd.",
    sub: "Shizuoka, Japan · Tōji Ren Kosaka",
    tier: "Preferred manufacturer partner",
    tierIsPreferred: true,
    contactName: "Ren Kosaka",
    contactRole: "Master distiller",
    email: "kosaka@kosapan.jp",
    phone: "+81 54-555-0199",
    city: "Shizuoka",
    country: "Japan",
    locationLine: "Shizuoka, Japan · est. 1956",
    partnerSince: "Mar 2024",
    premium: "¥2.5/btl quality",
    rawMaterialsContract: "Cane spirit base · estate contract",
    capacity: "3,120 cs/Q",
    quality: "98.2%",
    onTime: "95.8%",
    statusTone: "green",
    statusLabel: "on schedule",
    activeBatches: 3,
    paymentTerms: "Net 45",
    tags: ["preferred", "shizuoka", "kosapan"],
    skus: ["Hajime Original 750ml", "Hajime Yuzu 750ml", "Kosapan Reserve 720ml"],
    internalNotes: "Primary contract partner for Original and Yuzu lines. Single-tank precision batches.",
    status: "active",
  },
  kuramoto: {
    id: "kuramoto",
    accountId: "demo-kuramoto",
    name: "Kuramoto Brewing",
    legalName: "Kuramoto Brewing Co., Ltd.",
    sub: "Niigata, Japan · Tōji Haruki Sato",
    tier: "Preferred manufacturer partner",
    tierIsPreferred: true,
    contactName: "Haruki Sato",
    contactRole: "Master distiller",
    email: "sato@kuramoto.jp",
    phone: "+81 25-555-0142",
    city: "Niigata",
    country: "Japan",
    locationLine: "Niigata, Japan · est. 1924",
    partnerSince: "Jan 2024",
    premium: "¥2/btl quality",
    rawMaterialsContract: "Grain & botanicals · contract",
    capacity: "2,640 cs/Q",
    quality: "98.6%",
    onTime: "96.2%",
    statusTone: "amber",
    statusLabel: "2 requests open",
    activeBatches: 4,
    paymentTerms: "Net 45",
    tags: ["preferred", "niigata", "gold"],
    skus: ["Florin Peaks 750ml", "Junmai Shiro 720ml", "Ryusui Reserve 500ml"],
    internalNotes: "Flagship partner for Florin Peaks and limited Reserve lots.",
    status: "active",
  },
  echigo: {
    id: "echigo",
    accountId: "demo-echigo",
    name: "Echigo Kura",
    legalName: "Echigo Kura Ltd.",
    sub: "Niigata, Japan · Tōji Ken Mori",
    tier: "Standard manufacturer partner",
    tierIsPreferred: false,
    contactName: "Ken Mori",
    contactRole: "Head brewer",
    email: "mori@echigo-kura.jp",
    phone: "+81 25-555-0188",
    city: "Niigata",
    country: "Japan",
    locationLine: "Niigata, Japan · est. 1890",
    partnerSince: "Aug 2024",
    premium: "¥1.5/btl quality",
    rawMaterialsContract: "Regional grain · contract",
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

const STORAGE_PREFIX = "hajime_hq_manufacturer_partner_";
const DELETED_KEY = "hajime_hq_manufacturer_partners_deleted";
const HIDDEN_STORAGE_KEY = "hajime_hq_hidden_manufacturer_ids";

/** Server-synced partner overrides (set on app bootstrap from operational_settings). */
let serverPartnerOverrides: Partial<Record<HqManufacturerPartnerId, Partial<HqManufacturerPartnerConfig>>> | null =
  null;

const partnerConfigListeners = new Set<() => void>();

function notifyPartnerConfigsChanged(): void {
  partnerConfigListeners.forEach((listener) => listener());
}

/** React external store — re-render lists when partner configs change. */
export function subscribePartnerConfigs(listener: () => void): () => void {
  partnerConfigListeners.add(listener);
  return () => partnerConfigListeners.delete(listener);
}

export function getPartnerConfigsSnapshot(): string {
  return JSON.stringify(serverPartnerOverrides ?? {});
}

function parsePartnerConfigsRaw(
  raw: unknown,
): Partial<Record<HqManufacturerPartnerId, Partial<HqManufacturerPartnerConfig>>> {
  if (typeof raw === "string" && raw.trim()) {
    try {
      return parsePartnerConfigsRaw(JSON.parse(raw) as unknown);
    } catch {
      return {};
    }
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Partial<Record<HqManufacturerPartnerId, Partial<HqManufacturerPartnerConfig>>> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!isHqManufacturerPartnerId(key) || !value || typeof value !== "object" || Array.isArray(value)) continue;
    out[key] = value as Partial<HqManufacturerPartnerConfig>;
  }
  return out;
}

function mergePartnerPartial(
  id: HqManufacturerPartnerId,
  base: HqManufacturerPartnerConfig,
  partial?: Partial<HqManufacturerPartnerConfig> & { rice?: string },
): HqManufacturerPartnerConfig {
  if (!partial) return base;
  const { rice: legacyRice, ...rest } = partial;
  return {
    ...base,
    ...rest,
    rawMaterialsContract:
      rest.rawMaterialsContract ?? legacyRice ?? base.rawMaterialsContract,
    id,
    tags: rest.tags ?? base.tags,
    skus: rest.skus ?? base.skus,
  };
}

/** Apply partner overrides from operational settings (called on app bootstrap). */
export function syncPartnerConfigsFromSettings(raw: unknown): void {
  const parsed = parsePartnerConfigsRaw(raw);
  serverPartnerOverrides = parsed;
  if (typeof window !== "undefined") {
    for (const partnerId of HQ_MANUFACTURER_PARTNER_IDS) {
      const override = parsed[partnerId];
      if (override) {
        try {
          localStorage.setItem(`${STORAGE_PREFIX}${partnerId}`, JSON.stringify(override));
        } catch {
          // ignore quota errors
        }
      }
    }
  }
  notifyPartnerConfigsChanged();
}

/** Persist one partner config to operational_settings (server source of truth). */
export async function persistHqManufacturerPartnerToServer(config: HqManufacturerPartnerConfig): Promise<void> {
  if (!isHqManufacturerPartnerId(config.id)) return;
  const current = { ...(serverPartnerOverrides ?? {}) };
  current[config.id] = config;
  const { updateOperationalSettings } = await import("@/lib/api-v1-mutations");
  await updateOperationalSettings({
    hq_manufacturer_partner_configs: JSON.stringify(current),
  });
  syncPartnerConfigsFromSettings(current);
}

/** Server-synced hidden ids (set on app bootstrap from operational_settings). */
let serverHiddenIds: string[] | null = null;

function parseHiddenIdsRaw(raw: unknown): string[] {
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
      }
    } catch {
      return raw
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
    }
  }
  if (Array.isArray(raw)) {
    return raw.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
  }
  return [];
}

function readHiddenIdsFromLocalStorage(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(HIDDEN_STORAGE_KEY);
    if (raw) return new Set(parseHiddenIdsRaw(raw));
  } catch {
    // ignore
  }
  try {
    const legacy = localStorage.getItem(DELETED_KEY);
    if (legacy) return new Set(parseHiddenIdsRaw(legacy));
  } catch {
    // ignore
  }
  return new Set();
}

function writeHiddenIdsToLocalStorage(ids: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(HIDDEN_STORAGE_KEY, JSON.stringify(ids));
  const partnerOnly = ids.filter((id) => HQ_MANUFACTURER_PARTNER_IDS.includes(id as HqManufacturerPartnerId));
  localStorage.setItem(DELETED_KEY, JSON.stringify(partnerOnly));
}

const hiddenListeners = new Set<() => void>();

function notifyHiddenManufacturersChanged(): void {
  hiddenListeners.forEach((listener) => listener());
}

/** React external store — re-render lists when hidden manufacturers change. */
export function subscribeHiddenManufacturers(listener: () => void): () => void {
  hiddenListeners.add(listener);
  return () => hiddenListeners.delete(listener);
}

export function getHiddenManufacturersSnapshot(): string {
  return getHiddenManufacturerIds().sort().join("\0");
}

/** Partner ids also hide linked demo account ids and name slugs. */
const PARTNER_HIDE_ALIASES: Record<HqManufacturerPartnerId, string[]> = {
  kosapan: ["kosapan", "demo-kosapan", "kosapan-distillery"],
  kuramoto: ["kuramoto", "demo-kuramoto", "kuramoto-brewing"],
  echigo: ["echigo", "demo-echigo", "echigo-kura"],
};

function partnerIdForHiddenAlias(id: string): string | null {
  const norm = id.trim().toLowerCase();
  for (const partnerId of HQ_MANUFACTURER_PARTNER_IDS) {
    const aliases = PARTNER_HIDE_ALIASES[partnerId];
    if (aliases.some((alias) => alias.toLowerCase() === norm)) return partnerId;
  }
  return null;
}

function readHiddenIds(): Set<string> {
  if (serverHiddenIds !== null) {
    return new Set(serverHiddenIds);
  }
  return readHiddenIdsFromLocalStorage();
}

/** Apply hidden manufacturer ids from operational settings (called on app bootstrap). */
export function syncHiddenManufacturerIdsFromSettings(ids: string[] | undefined): void {
  if (ids === undefined) return;
  const normalized = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  serverHiddenIds = normalized;
  writeHiddenIdsToLocalStorage(normalized);
  notifyHiddenManufacturersChanged();
}

export function getHiddenManufacturerIds(): string[] {
  return [...readHiddenIds()];
}

export function isManufacturerHidden(id: string | undefined | null): boolean {
  const norm = id?.trim();
  if (!norm) return false;
  const hidden = readHiddenIds();
  const lower = norm.toLowerCase();
  if ([...hidden].some((entry) => entry.toLowerCase() === lower)) return true;

  const partnerId = partnerIdForHiddenAlias(norm);
  if (partnerId) {
    const aliases = PARTNER_HIDE_ALIASES[partnerId];
    if (aliases.some((alias) => [...hidden].some((entry) => entry.toLowerCase() === alias.toLowerCase()))) {
      return true;
    }
  }

  const slug = lower.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (slug && [...hidden].some((entry) => entry.toLowerCase() === slug)) return true;

  return false;
}

/** Persist hidden ids to local cache + operational_settings API. */
/** Persist hidden ids to local cache + operational_settings API. */
export async function persistHiddenManufacturerIds(ids: string[]): Promise<void> {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  syncHiddenManufacturerIdsFromSettings(unique);
  const { updateOperationalSettings } = await import("@/lib/api-v1-mutations");
  await updateOperationalSettings({
    hq_hidden_manufacturer_ids: JSON.stringify(unique),
  });
}

/** Saved/active HQ partners must stay visible on the Manufacturers list. */
export async function ensureManufacturerPartnerVisible(id: HqManufacturerPartnerId): Promise<void> {
  // Local state may be stale or empty (fresh browser before settings sync) while the
  // server still hides this partner — pull the authoritative list first.
  if (serverHiddenIds === null) {
    try {
      const { getOperationalSettings } = await import("@/lib/api-v1-mutations");
      const res = (await getOperationalSettings()) as { data?: { hq_hidden_manufacturer_ids?: unknown } };
      syncHiddenManufacturerIdsFromSettings(parseHiddenIdsRaw(res.data?.hq_hidden_manufacturer_ids));
    } catch {
      // offline — fall back to local state below
    }
  }

  const hidden = readHiddenIds();
  if (hidden.size === 0) return;

  const drop = new Set<string>([id, ...PARTNER_HIDE_ALIASES[id]].map((entry) => entry.toLowerCase()));
  const next = [...hidden].filter((entry) => {
    const lower = entry.toLowerCase();
    if (drop.has(lower)) return false;
    return partnerIdForHiddenAlias(entry) !== id;
  });

  if (next.length !== hidden.size) {
    await persistHiddenManufacturerIds(next);
  }
}

export async function hideManufacturers(ids: string[]): Promise<void> {
  const expanded = new Set<string>();
  for (const raw of ids) {
    const id = raw.trim();
    if (!id) continue;
    expanded.add(id);
    if (isHqManufacturerPartnerId(id)) {
      for (const alias of PARTNER_HIDE_ALIASES[id]) expanded.add(alias);
    }
    const partnerId = partnerIdForHiddenAlias(id);
    if (partnerId) {
      expanded.add(partnerId);
      for (const alias of PARTNER_HIDE_ALIASES[partnerId as HqManufacturerPartnerId]) expanded.add(alias);
    }
  }
  const next = new Set([...readHiddenIds(), ...expanded]);
  await persistHiddenManufacturerIds([...next]);
}

function readDeleted(): Set<string> {
  return readHiddenIds();
}

function writeDeleted(ids: Set<string>) {
  writeHiddenIdsToLocalStorage([...ids]);
}

export function isHqManufacturerPartnerId(id: string): id is HqManufacturerPartnerId {
  return HQ_MANUFACTURER_PARTNER_IDS.includes(id as HqManufacturerPartnerId);
}

function partnerIdFromNameLike(name: string): HqManufacturerPartnerId | null {
  const n = name.trim().toLowerCase();
  if (!n) return null;
  if (n.includes("kosapan")) return "kosapan";
  if (n.includes("kuramoto")) return "kuramoto";
  if (n.includes("echigo")) return "echigo";
  return null;
}

/** Map route id, CRM account id, or slug to a canonical HQ partner id (kosapan, kuramoto, echigo). */
export function resolveHqManufacturerPartnerId(manufacturerId: string): HqManufacturerPartnerId | null {
  const norm = manufacturerId.trim().toLowerCase();
  if (!norm) return null;
  if (isHqManufacturerPartnerId(norm)) return norm;

  for (const partnerId of HQ_MANUFACTURER_PARTNER_IDS) {
    const aliases = PARTNER_HIDE_ALIASES[partnerId];
    if (aliases.some((alias) => alias.toLowerCase() === norm)) return partnerId;
    const partner = loadHqManufacturerPartner(partnerId);
    if (partner.accountId.toLowerCase() === norm) return partnerId;
    const nameSlug = partner.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (nameSlug === norm) return partnerId;
  }

  return partnerIdFromNameLike(norm);
}

export function canonicalManufacturerPartnerId(manufacturerId: string): string {
  return resolveHqManufacturerPartnerId(manufacturerId) ?? manufacturerId;
}

/** Legacy PO/CRM seed — not an HQ partner profile card. */
export function isLegacyKirinProfilesListRow(row: { id: string; name: string }): boolean {
  const id = row.id.trim().toLowerCase();
  const name = row.name.trim().toLowerCase();
  if (name.includes("kirin")) return true;
  return id === "kirin" || id.startsWith("kirin-") || id === "acc-mfg-kirin";
}

export function isLegacyKirinManufacturerRoute(manufacturerId: string): boolean {
  const norm = manufacturerId.trim().toLowerCase();
  return norm === "kirin" || norm.includes("kirin-brewery") || norm === "acc-mfg-kirin";
}

export function isLegacyKirinAccount(acc: Account): boolean {
  const id = acc.id.trim().toLowerCase();
  const name = (acc.tradingName || acc.legalName || "").toLowerCase();
  return id === "acc-mfg-kirin" || name.includes("kirin");
}

const HQ_PARTNER_META_MARKER = "__hq_partner_meta__";

function encodePartnerMeta(config: HqManufacturerPartnerConfig): string {
  return JSON.stringify({
    premium: config.premium,
    rawMaterialsContract: config.rawMaterialsContract,
    partnerSince: config.partnerSince,
    tier: config.tier,
    locationLine: config.locationLine,
    portalLoginEmail: config.portalLoginEmail,
  });
}

function notesWithPartnerMeta(config: HqManufacturerPartnerConfig): string | undefined {
  const metaBlock = `${HQ_PARTNER_META_MARKER}\n${encodePartnerMeta(config)}`;
  const notes = config.internalNotes?.trim();
  return notes ? `${notes}\n\n${metaBlock}` : metaBlock;
}

function internalNotesFromStoredNotes(notes: string | undefined): string | undefined {
  if (!notes) return undefined;
  const idx = notes.indexOf(HQ_PARTNER_META_MARKER);
  if (idx === -1) return notes.trim() || undefined;
  return notes.slice(0, idx).trim() || undefined;
}

function parsePartnerMetaFromStoredNotes(notes: string | undefined): Partial<HqManufacturerPartnerConfig> {
  if (!notes) return {};
  const idx = notes.indexOf(HQ_PARTNER_META_MARKER);
  const raw =
    idx === -1
      ? notes.trim().startsWith("{")
        ? notes.trim()
        : ""
      : notes.slice(idx + HQ_PARTNER_META_MARKER.length).trim();
  if (!raw.startsWith("{")) return {};
  try {
    return JSON.parse(raw) as Partial<HqManufacturerPartnerConfig>;
  } catch {
    return {};
  }
}

/** Persist partner config to manufacturer_profiles (API) and operational_settings. */
export async function syncHqManufacturerPartnerToApi(config: HqManufacturerPartnerConfig): Promise<void> {
  if (!isHqManufacturerPartnerId(config.id)) return;
  const { createManufacturerProfile } = await import("@/lib/api-v1-mutations");
  await createManufacturerProfile({
    manufacturer_id: config.id,
    company_name: config.name,
    contact_name: config.contactName,
    email: (config.portalLoginEmail || config.email).trim(),
    phone: config.phone,
    city: config.city,
    country: config.country,
    payment_terms: config.paymentTerms,
    notes: notesWithPartnerMeta(config),
  });
  let settingsError: unknown = null;
  try {
    await persistHqManufacturerPartnerToServer(config);
  } catch (err) {
    settingsError = err;
  }
  await ensureManufacturerPartnerVisible(config.id);
  if (settingsError) {
    console.error("[HQ] Partner config settings persist failed:", settingsError);
    throw settingsError instanceof Error
      ? settingsError
      : new Error("Failed to persist partner settings to server");
  }
}

function parsePartnerMetaFromProfile(profile: ManufacturerProfile): Partial<HqManufacturerPartnerConfig> {
  const fromNotes = parsePartnerMetaFromStoredNotes(profile.description);
  if (Object.keys(fromNotes).length > 0) return fromNotes;
  const legacy = profile.certifications?.[0]?.name ?? "";
  if (!legacy.trim().startsWith("{")) return {};
  try {
    return JSON.parse(legacy) as Partial<HqManufacturerPartnerConfig>;
  } catch {
    return {};
  }
}

/** Merge API manufacturer_profiles into local partner configs (cross-session hydration). */
export function hydratePartnerConfigsFromProfiles(profiles: ManufacturerProfile[]): void {
  let changed = false;
  const nextOverrides = { ...(serverPartnerOverrides ?? {}) };

  for (const profile of profiles) {
    const partnerId = resolveHqManufacturerPartnerId(
      profile.manufacturerId || profile.id || profile.companyName,
    );
    if (!partnerId || !profile.companyName.trim()) continue;

    const meta = parsePartnerMetaFromProfile(profile);
    const partial: Partial<HqManufacturerPartnerConfig> = {
      ...meta,
      name: profile.companyName,
      contactName: profile.primaryContact.name || undefined,
      email: profile.primaryContact.email || undefined,
      phone: profile.primaryContact.phone || undefined,
      city: profile.address.city || undefined,
      country: profile.address.country || undefined,
      internalNotes: internalNotesFromStoredNotes(profile.description),
      portalLoginEmail: profile.primaryContact.email || meta.portalLoginEmail,
    };

    nextOverrides[partnerId] = { ...(nextOverrides[partnerId] ?? {}), ...partial };
    if (typeof window !== "undefined") {
      const base = BASE[partnerId];
      const merged = mergePartnerPartial(
        partnerId,
        { ...base, tags: [...base.tags], skus: [...base.skus] },
        { ...nextOverrides[partnerId], ...partial },
      );
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${partnerId}`, JSON.stringify(merged));
      } catch {
        // ignore
      }
    }
    changed = true;
  }

  if (changed) {
    serverPartnerOverrides = nextOverrides;
    notifyPartnerConfigsChanged();
    for (const partnerId of HQ_MANUFACTURER_PARTNER_IDS) {
      if (nextOverrides[partnerId]) {
        void ensureManufacturerPartnerVisible(partnerId);
      }
    }
  }
}

export function isHqManufacturerPartnerDeleted(id: string): boolean {
  return isManufacturerHidden(id);
}

export function loadHqManufacturerPartner(id: HqManufacturerPartnerId): HqManufacturerPartnerConfig {
  const base = BASE[id];
  let merged: HqManufacturerPartnerConfig = { ...base, tags: [...base.tags], skus: [...base.skus] };
  const server = serverPartnerOverrides?.[id];
  if (server) merged = mergePartnerPartial(id, merged, server);
  if (typeof window === "undefined") return merged;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<HqManufacturerPartnerConfig> & { rice?: string };
      merged = mergePartnerPartial(id, merged, parsed);
    }
  } catch {
    // ignore corrupt local cache
  }
  return merged;
}

export function saveHqManufacturerPartner(config: HqManufacturerPartnerConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_PREFIX}${config.id}`, JSON.stringify(config));
  notifyPartnerConfigsChanged();
}

export function deleteHqManufacturerPartner(id: HqManufacturerPartnerId): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${STORAGE_PREFIX}${id}`);
  const deleted = readDeleted();
  deleted.add(id);
  writeDeleted(deleted);
}

export function listHqManufacturerPartners(): HqManufacturerPartnerConfig[] {
  return HQ_MANUFACTURER_PARTNER_IDS.filter((id) => !isManufacturerHidden(id)).map((id) =>
    loadHqManufacturerPartner(id),
  );
}

/** HQ partners for the profiles list — include saved API profiles even if mistakenly hidden. */
export function listHqManufacturerPartnersForProfilesList(
  profiles: ManufacturerProfile[] = [],
): HqManufacturerPartnerConfig[] {
  const visible = HQ_MANUFACTURER_PARTNER_IDS.filter((id) => {
    if (!isManufacturerHidden(id)) return true;
    return profiles.some(
      (p) => resolveHqManufacturerPartnerId(p.manufacturerId || p.id || p.companyName) === id,
    );
  });
  const ids = visible.length > 0 ? visible : HQ_MANUFACTURER_PARTNER_IDS;
  return ids.map((id) => loadHqManufacturerPartner(id));
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
    portalLoginEmail: c.portalLoginEmail || c.email,
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
    portalLoginEmail: acc.portalLoginEmail || acc.email || base.portalLoginEmail,
  };
}
