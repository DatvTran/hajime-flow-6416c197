import type { Account } from "@/data/mockData";
import {
  HQ_MANUFACTURER_PARTNER_IDS,
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
      email: p.email,
      sub: p.sub,
      crmMemberId: null,
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
      email: a.email,
      sub: [a.city, a.country].filter(Boolean).join(", ") || undefined,
      crmMemberId: null,
      hasProfile: false,
    }))
    .filter((row) => row.label.length > 0);
}

/** CRM/API rows + platform manufacturer accounts + all HQ kura partners. */
export function buildHqManufacturerPickerOptions(
  apiRows: HqManufacturerPickerOption[],
  accounts: Account[] = [],
): HqManufacturerPickerOption[] {
  const seeds = [
    ...apiRows,
    ...accountsToManufacturerPickerOptions(accounts),
    ...guaranteedHqPartnerPickerOptions(),
  ];

  const seen = new Set<string>();
  const merged: HqManufacturerPickerOption[] = [];

  for (const row of seeds) {
    const norm = row.label.trim().toLowerCase();
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
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
