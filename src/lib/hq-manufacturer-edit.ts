import type { Account } from "@/data/mockData";
import type { ManufacturerProfile } from "@/types/app-data";
import {
  HQ_MANUFACTURER_PARTNER_IDS,
  isHqManufacturerPartnerId,
  isLegacyKirinAccount,
  loadHqManufacturerPartner,
  resolveHqManufacturerPartnerId,
  saveHqManufacturerPartner,
  type HqManufacturerPartnerConfig,
  type HqManufacturerPartnerId,
} from "@/lib/hq-manufacturer-partners";

export type HqManufacturerEditSource = "partner" | "account" | "profile";

/** Editable manufacturer form — partner config, CRM account, or API profile. */
export type HqManufacturerEditForm = Omit<HqManufacturerPartnerConfig, "id"> & {
  id: string;
  editSource: HqManufacturerEditSource;
  profileId?: string;
  /** Login email the manufacturer signs in with — connects their portal to this HQ record. */
  portalLoginEmail?: string;
};

function tierFromTags(tags: string[]): { tier: string; tierIsPreferred: boolean } {
  const preferred = tags.some((t) => /preferred|gold|primary-mfg/i.test(t));
  return {
    tier: preferred ? "Preferred manufacturer partner" : "Standard manufacturer partner",
    tierIsPreferred: preferred,
  };
}

export function editFormFromPartner(config: HqManufacturerPartnerConfig): HqManufacturerEditForm {
  return {
    ...config,
    editSource: "partner",
    portalLoginEmail: config.portalLoginEmail || config.email,
  };
}

export function editFormFromAccount(acc: Account): HqManufacturerEditForm {
  const name = (acc.tradingName || acc.legalName || "Manufacturer").trim();
  const tags = acc.tags ?? [];
  const { tier, tierIsPreferred } = tierFromTags(tags);
  return {
    editSource: "account",
    id: acc.id,
    accountId: acc.id,
    name,
    legalName: acc.legalName || name,
    sub: `${acc.city || "—"} · ${acc.contactName || "—"}`,
    tier,
    tierIsPreferred,
    contactName: acc.contactName || "",
    contactRole: acc.contactRole || "",
    email: acc.email || "",
    phone: acc.phone || "",
    city: acc.city || "",
    country: acc.country || "",
    locationLine: [acc.city, acc.country].filter(Boolean).join(", ") || "—",
    partnerSince: acc.firstOrderDate?.slice(0, 7) || "—",
    premium: "—",
    rawMaterialsContract: "—",
    capacity: "—",
    quality: "98.0%",
    onTime: "96.0%",
    statusTone: acc.status === "active" ? "green" : "neutral",
    statusLabel: acc.status === "active" ? "on schedule" : acc.status || "planned",
    activeBatches: 0,
    paymentTerms: acc.paymentTerms || "Net 45",
    tags: [...tags],
    skus: [],
    internalNotes: acc.internalNotes,
    status: acc.status ?? "active",
    portalLoginEmail: acc.portalLoginEmail || acc.email || "",
  };
}

export function editFormFromProfile(profile: ManufacturerProfile, routeId: string): HqManufacturerEditForm {
  const partnerId = resolveHqManufacturerPartnerId(profile.manufacturerId || routeId);
  if (partnerId) {
    const base = editFormFromPartner(loadHqManufacturerPartner(partnerId));
    const name = profile.companyName.trim() || base.name;
    return {
      ...base,
      editSource: "partner",
      id: partnerId,
      profileId: profile.id,
      name,
      legalName: profile.legalName || base.legalName || name,
      contactName: profile.primaryContact.name || base.contactName,
      contactRole: profile.primaryContact.role || base.contactRole,
      email: profile.primaryContact.email || base.email,
      phone: profile.primaryContact.phone || base.phone,
      city: profile.address.city || base.city,
      country: profile.address.country || base.country,
      internalNotes: profile.description || base.internalNotes,
      portalLoginEmail: profile.primaryContact.email || base.portalLoginEmail,
    };
  }

  const name = profile.companyName.trim() || "Manufacturer";
  const tags: string[] = [];
  const { tier, tierIsPreferred } = tierFromTags(tags);
  return {
    editSource: "profile",
    id: routeId,
    profileId: profile.id,
    accountId: profile.manufacturerId || routeId,
    name,
    legalName: profile.legalName || name,
    sub: [profile.address.city, profile.primaryContact.name].filter(Boolean).join(" · ") || "Manufacturer partner",
    tier,
    tierIsPreferred,
    contactName: profile.primaryContact.name || "",
    contactRole: profile.primaryContact.role || "",
    email: profile.primaryContact.email || "",
    phone: profile.primaryContact.phone || "",
    city: profile.address.city || "",
    country: profile.address.country || "",
    locationLine: [profile.address.city, profile.address.country].filter(Boolean).join(", ") || "—",
    partnerSince: "—",
    premium: "—",
    rawMaterialsContract: "—",
    capacity:
      profile.productionCapacity.monthlyCases > 0
        ? `${profile.productionCapacity.monthlyCases.toLocaleString()} cs/mo`
        : "—",
    quality: "98.0%",
    onTime: "96.0%",
    statusTone: "green",
    statusLabel: "on schedule",
    activeBatches: 0,
    paymentTerms: "Net 45",
    tags,
    skus: [],
    internalNotes: profile.description,
    status: "active",
    portalLoginEmail: profile.primaryContact.email || "",
  };
}

function findManufacturerAccount(accounts: Account[], manufacturerId: string): Account | undefined {
  const norm = manufacturerId.trim().toLowerCase();
  if (!norm) return undefined;

  const direct = accounts.find((a) => a.type === "manufacturer" && a.id.toLowerCase() === norm);
  if (direct) return direct;

  const byPartnerAccount = accounts.find((a) => {
    if (a.type !== "manufacturer") return false;
    return HQ_MANUFACTURER_PARTNER_IDS.some((pid) => {
      const partner = loadHqManufacturerPartner(pid);
      return partner.accountId === a.id && pid === norm;
    });
  });
  if (byPartnerAccount) return byPartnerAccount;

  return accounts.find((a) => {
    if (a.type !== "manufacturer" || a.distributorOrgId) return false;
    if (isLegacyKirinAccount(a)) return false;
    const name = (a.tradingName || a.legalName || "").toLowerCase();
    const slug = name.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return (
      name.includes(norm) ||
      norm.includes(name.slice(0, 6)) ||
      slug === norm
    );
  });
}

export function resolveManufacturerEditForm(
  manufacturerId: string,
  accounts: Account[],
  profile: ManufacturerProfile | null,
): HqManufacturerEditForm | null {
  const id = manufacturerId.trim();
  if (!id) return null;

  if (isHqManufacturerPartnerId(id)) {
    return editFormFromPartner(loadHqManufacturerPartner(id));
  }

  const resolvedPartner = resolveHqManufacturerPartnerId(id);
  if (resolvedPartner) {
    return editFormFromPartner(loadHqManufacturerPartner(resolvedPartner));
  }

  const partnerByAccount = HQ_MANUFACTURER_PARTNER_IDS.find((pid) => {
    const partner = loadHqManufacturerPartner(pid);
    return partner.accountId === id;
  });
  if (partnerByAccount) {
    return editFormFromPartner(loadHqManufacturerPartner(partnerByAccount));
  }

  if (profile) {
    const fromProfile = editFormFromProfile(profile, id);
    if (fromProfile.editSource === "partner" || fromProfile.name !== "Manufacturer") {
      return fromProfile;
    }
  }

  const account = findManufacturerAccount(accounts, id);
  if (account) return editFormFromAccount(account);

  if (profile) return editFormFromProfile(profile, id);

  return null;
}

export function editFormToAccountPatch(form: HqManufacturerEditForm): Partial<Account> {
  const name = form.name.trim();
  return {
    legalName: form.legalName.trim() || name,
    tradingName: name,
    city: form.city.trim() || "—",
    country: form.country.trim() || "Japan",
    contactName: form.contactName.trim() || "—",
    contactRole: form.contactRole.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    paymentTerms: form.paymentTerms,
    status: form.status,
    tags: form.tierIsPreferred ? ["preferred", ...form.tags.filter((t) => t !== "preferred")] : ["standard"],
    internalNotes: form.internalNotes,
    portalLoginEmail: form.portalLoginEmail?.trim() || form.email.trim() || undefined,
  };
}

export function editFormToPartnerConfig(
  form: HqManufacturerEditForm,
  partnerId?: HqManufacturerPartnerId,
): HqManufacturerPartnerConfig {
  const id = (partnerId ?? form.id) as HqManufacturerPartnerId;
  const portalLoginEmail = form.portalLoginEmail?.trim() || form.email.trim();
  return {
    ...form,
    id,
    portalLoginEmail,
    sub: `${form.city || "—"} · ${form.contactName || "—"}${form.contactRole ? ` · ${form.contactRole}` : ""}`,
    tierIsPreferred: form.tier.includes("Preferred"),
  };
}

export function persistPartnerEditForm(
  form: HqManufacturerEditForm,
  partnerId?: HqManufacturerPartnerId,
): void {
  const id = partnerId ?? (isHqManufacturerPartnerId(form.id) ? form.id : null);
  if (!id) return;
  saveHqManufacturerPartner(editFormToPartnerConfig(form, id));
}

/** Resolve HQ partner id for any manufacturer route / form id. */
export function resolvePartnerIdForSave(
  form: HqManufacturerEditForm,
  routeManufacturerId: string,
): HqManufacturerPartnerId | null {
  if (isHqManufacturerPartnerId(form.id)) return form.id;
  return (
    resolveHqManufacturerPartnerId(form.id) ??
    resolveHqManufacturerPartnerId(routeManufacturerId) ??
    resolveHqManufacturerPartnerId(form.name) ??
    null
  );
}
