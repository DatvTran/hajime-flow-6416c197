import type { Account } from "@/data/mockData";
import {
  HQ_MANUFACTURER_PARTNER_IDS,
  isHqManufacturerPartnerId,
  loadHqManufacturerPartner,
} from "@/lib/hq-manufacturer-partners";

export type HqManufacturerPickerOption = {
  key: string;
  label: string;
  email?: string;
  sub?: string;
  crmMemberId?: string | null;
  hasProfile?: boolean;
};

/** All onboarded HQ kura partners — always available for brief assignment. */
export function guaranteedHqPartnerPickerOptions(): HqManufacturerPickerOption[] {
  return HQ_MANUFACTURER_PARTNER_IDS.map((id) => {
    const p = loadHqManufacturerPartner(id);
    return {
      key: `partner:${id}`,
      label: p.name,
      email: (p.portalLoginEmail || p.email)?.trim() || undefined,
      sub: p.sub,
      // Partner id is the stable link for manufacturer portal scoping (POs + NPRs).
      crmMemberId: id,
      hasProfile: true,
    };
  });
}

export function accountsToManufacturerPickerOptions(accounts: Account[]): HqManufacturerPickerOption[] {
  return accounts
    .filter((a) => a.type === "manufacturer" && !a.distributorOrgId)
    .map((a) => ({
      key: `account:${a.id}`,
      label: (a.tradingName || a.legalName || a.id).trim(),
      email: (a.portalLoginEmail || a.email)?.trim() || undefined,
      sub: [a.city, a.country].filter(Boolean).join(", ") || undefined,
      crmMemberId: null,
      hasProfile: false,
    }))
    .filter((row) => row.label.length > 0);
}

/** Manufacturer profiles only — CRM contacts without a Manufacturers profile are excluded. */
export function buildHqManufacturerPickerOptions(
  apiRows: HqManufacturerPickerOption[],
  _accounts: Account[] = [],
): HqManufacturerPickerOption[] {
  // API is profile-first; ignore CRM-only rows if any older clients still send them.
  const profileRows = apiRows.filter((row) => row.hasProfile !== false && Boolean(row.label?.trim()));

  const seeds = [...profileRows, ...guaranteedHqPartnerPickerOptions()];

  const seenLabels = new Set<string>();
  const seenEmails = new Set<string>();
  const merged: HqManufacturerPickerOption[] = [];

  for (const row of seeds) {
    const norm = row.label.trim().toLowerCase();
    const email = row.email?.trim().toLowerCase() ?? "";
    if (!norm) continue;
    if (seenLabels.has(norm)) continue;
    if (email && seenEmails.has(email)) continue;
    seenLabels.add(norm);
    if (email) seenEmails.add(email);
    merged.push(row);
  }

  return merged.sort((a, b) => a.label.localeCompare(b.label));
}

/** @deprecated use buildHqManufacturerPickerOptions */
export function defaultHqManufacturerPickerOptions(): HqManufacturerPickerOption[] {
  return guaranteedHqPartnerPickerOptions();
}

/** @deprecated use buildHqManufacturerPickerOptions */
export function mergeManufacturerPickerOptions(
  apiRows: HqManufacturerPickerOption[],
): HqManufacturerPickerOption[] {
  return buildHqManufacturerPickerOptions(apiRows);
}

export type ManufacturerPickerHint = {
  id?: string;
  label?: string;
};

/** Resolve a picker key from a manufacturer profile id and/or display label. */
export function resolveManufacturerPickerKey(
  choices: HqManufacturerPickerOption[],
  hint?: ManufacturerPickerHint | null,
): string | null {
  if (!hint || choices.length === 0) return null;

  const id = hint.id?.trim();
  const labelNorm = hint.label?.trim().toLowerCase();

  if (id) {
    const partnerKey = id.startsWith("partner:") ? id : `partner:${id}`;
    if (choices.some((c) => c.key === partnerKey)) return partnerKey;

    if (isHqManufacturerPartnerId(id)) {
      const partner = loadHqManufacturerPartner(id);
      const accountKey = `account:${partner.accountId}`;
      if (choices.some((c) => c.key === accountKey)) return accountKey;
      const byPartnerName = choices.find(
        (c) => c.label.trim().toLowerCase() === partner.name.trim().toLowerCase(),
      );
      if (byPartnerName) return byPartnerName.key;
    }

    const accountKey = id.startsWith("account:") ? id : `account:${id}`;
    if (choices.some((c) => c.key === accountKey)) return accountKey;

    const byCrm = choices.find((c) => c.crmMemberId === id);
    if (byCrm) return byCrm.key;

    const byKey = choices.find((c) => c.key === id);
    if (byKey) return byKey.key;
  }

  if (labelNorm) {
    const exact = choices.find((c) => c.label.trim().toLowerCase() === labelNorm);
    if (exact) return exact.key;

    const fuzzy = choices.find((c) => {
      const l = c.label.trim().toLowerCase();
      return l.includes(labelNorm) || labelNorm.includes(l);
    });
    if (fuzzy) return fuzzy.key;
  }

  return null;
}

/** Link from a manufacturer profile to a pre-assigned new production request. */
export function newProductionRequestPath(manufacturerId: string, manufacturerLabel?: string): string {
  const params = new URLSearchParams();
  params.set("manufacturer", manufacturerId);
  if (manufacturerLabel?.trim()) params.set("manufacturerLabel", manufacturerLabel.trim());
  return `/production-requests/new?${params.toString()}`;
}
