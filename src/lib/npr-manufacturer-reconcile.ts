import type { Account, NewProductRequest } from "@/data/mockData";
import type { ManufacturerProfile } from "@/types/app-data";
import {
  HQ_MANUFACTURER_PARTNER_IDS,
  isManufacturerHidden,
  loadHqManufacturerPartner,
} from "@/lib/hq-manufacturer-partners";

function norm(value: string | undefined | null): string {
  return String(value ?? "").trim().toLowerCase();
}

function slugify(value: string | undefined | null): string {
  return norm(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Lookup of every manufacturer that currently exists (excludes hidden/deleted). */
export type ExistingManufacturerIndex = {
  emails: Set<string>;
  labels: Set<string>;
  ids: Set<string>;
};

export function buildExistingManufacturerIndex(
  accounts: Account[],
  profiles: ManufacturerProfile[] = [],
): ExistingManufacturerIndex {
  const emails = new Set<string>();
  const labels = new Set<string>();
  const ids = new Set<string>();

  const addLabel = (value: string | undefined | null) => {
    const n = norm(value);
    if (!n) return;
    labels.add(n);
    const slug = slugify(n);
    if (slug) labels.add(slug);
  };
  const addId = (value: string | undefined | null) => {
    const n = norm(value);
    if (n) ids.add(n);
  };
  const addEmail = (value: string | undefined | null) => {
    const n = norm(value);
    if (n) emails.add(n);
  };

  const hidden = (...values: (string | undefined | null)[]) =>
    values.some((v) => isManufacturerHidden(v ?? undefined));

  for (const acc of accounts) {
    if (acc.type !== "manufacturer" || acc.distributorOrgId) continue;
    if (hidden(acc.id, acc.tradingName, acc.legalName)) continue;
    addId(acc.id);
    addLabel(acc.tradingName);
    addLabel(acc.legalName);
    addEmail(acc.email);
    addEmail(acc.portalLoginEmail);
  }

  for (const p of profiles) {
    if (hidden(p.id, p.manufacturerId, p.companyName)) continue;
    addId(p.id);
    addId(p.manufacturerId);
    addLabel(p.companyName);
    addLabel(p.legalName);
    addEmail(p.primaryContact?.email);
  }

  for (const partnerId of HQ_MANUFACTURER_PARTNER_IDS) {
    if (isManufacturerHidden(partnerId)) continue;
    const partner = loadHqManufacturerPartner(partnerId);
    addId(partnerId);
    addId(partner.accountId);
    addLabel(partner.name);
    addLabel(partner.legalName);
    addEmail(partner.email);
    addEmail(partner.portalLoginEmail);
  }

  return { emails, labels, ids };
}

/** True when the NPR has been assigned to a manufacturer (i.e. sent for feasibility). */
export function nprHasManufacturerAssignment(npr: NewProductRequest): boolean {
  return Boolean(
    norm(npr.assignedManufacturer) ||
      norm(npr.assignedManufacturerEmail) ||
      norm(npr.assignedCrmMemberId),
  );
}

/** True when the NPR's assigned manufacturer still exists in the index. */
export function nprManufacturerExists(
  npr: NewProductRequest,
  index: ExistingManufacturerIndex,
): boolean {
  const email = norm(npr.assignedManufacturerEmail);
  if (email && index.emails.has(email)) return true;

  const id = norm(npr.assignedCrmMemberId);
  if (id && index.ids.has(id)) return true;

  const label = norm(npr.assignedManufacturer);
  if (label && (index.labels.has(label) || index.labels.has(slugify(label)))) return true;

  return false;
}

/**
 * NPRs whose assigned manufacturer no longer exists (orphaned).
 * Concepts that were never assigned to a manufacturer are kept.
 */
export function findOrphanedNprs(
  nprs: NewProductRequest[],
  index: ExistingManufacturerIndex,
): NewProductRequest[] {
  return nprs.filter(
    (npr) => nprHasManufacturerAssignment(npr) && !nprManufacturerExists(npr, index),
  );
}
