import type { Account } from "@/data/mockData";
import type { NewProductRequest } from "@/data/mockData";
import type { TeamMember } from "@/types/app-data";
import { HQ_MANUFACTURER_PARTNER_IDS, loadHqManufacturerPartner } from "@/lib/hq-manufacturer-partners";

export type ManufacturerAssignmentIdentity = {
  email: string;
  emails: Set<string>;
  labels: Set<string>;
  crmMemberIds: Set<string>;
};

function normEmail(value: string | undefined | null): string {
  return String(value ?? "").trim().toLowerCase();
}

function normLabel(value: string | undefined | null): string {
  return String(value ?? "").trim().toLowerCase();
}

function emailDomain(email: string): string {
  const at = email.lastIndexOf("@");
  return at >= 0 ? email.slice(at + 1) : "";
}

function addLabel(set: Set<string>, value: string | undefined | null) {
  const trimmed = String(value ?? "").trim();
  if (trimmed) set.add(trimmed);
}

/** Client-side mirror of server manufacturer inbox matching (bootstrap / demo data). */
export function resolveManufacturerAssignmentIdentity(
  userEmail: string | undefined,
  teamMembers: TeamMember[] = [],
  accounts: Account[] = [],
): ManufacturerAssignmentIdentity {
  const email = normEmail(userEmail);
  const emails = new Set<string>();
  const labels = new Set<string>();
  const crmMemberIds = new Set<string>();

  if (email) emails.add(email);

  const mfgTeam = teamMembers.filter((tm) => tm.role === "manufacturer");

  for (const tm of mfgTeam) {
    const tmEmail = normEmail(tm.email);
    if (tmEmail && tmEmail === email) {
      addLabel(labels, tm.displayName);
      if (tm.id) crmMemberIds.add(tm.id);
    }
  }

  for (const partnerId of HQ_MANUFACTURER_PARTNER_IDS) {
    const partner = loadHqManufacturerPartner(partnerId);
    const partnerEmail = normEmail(partner.email);
    const partnerPortalEmail = normEmail(partner.portalLoginEmail);
    const emailMatchesPartner =
      (partnerEmail && partnerEmail === email) ||
      (partnerPortalEmail && partnerPortalEmail === email) ||
      (email && (email.includes(partnerId) || emailDomain(email).includes(partnerId)));
    if (emailMatchesPartner) {
      addLabel(labels, partner.name);
      addLabel(labels, partner.legalName);
      if (partnerEmail) emails.add(partnerEmail);
      if (partnerPortalEmail) emails.add(partnerPortalEmail);
      if (partner.accountId) crmMemberIds.add(partner.accountId);
      crmMemberIds.add(partnerId);
    }
  }

  const mfgAccounts = accounts.filter((a) => a.type === "manufacturer" && !a.distributorOrgId);
  const userDomain = emailDomain(email);
  const userIsMfgContact = mfgTeam.some((tm) => normEmail(tm.email) === email);

  for (const acc of mfgAccounts) {
    const accEmail = normEmail(acc.email);
    const accPortalEmail = normEmail(acc.portalLoginEmail);
    const accDomain = emailDomain(accEmail);
    const directAccountEmail =
      (accEmail && accEmail === email) || (accPortalEmail && accPortalEmail === email);
    const sharedOrgDomain =
      userIsMfgContact && Boolean(userDomain && accDomain && userDomain === accDomain);
    const accountLinkedViaTeam = mfgTeam.some((tm) => {
      const tmEmail = normEmail(tm.email);
      return tmEmail === accEmail || (userIsMfgContact && tmEmail && emailDomain(tmEmail) === userDomain);
    });

    if (directAccountEmail || sharedOrgDomain || accountLinkedViaTeam) {
      addLabel(labels, acc.tradingName);
      addLabel(labels, acc.legalName);
      if (accEmail) emails.add(accEmail);
      if (accPortalEmail) emails.add(accPortalEmail);
      for (const tm of mfgTeam) {
        const tmEmail = normEmail(tm.email);
        if (tmEmail && (tmEmail === accEmail || (userDomain && emailDomain(tmEmail) === userDomain))) {
          emails.add(tmEmail);
          addLabel(labels, tm.displayName);
          if (tm.id) crmMemberIds.add(tm.id);
        }
      }
    }
  }

  return { email, emails, labels, crmMemberIds };
}

export function nprMatchesManufacturerIdentity(
  row: Pick<
    NewProductRequest,
    "assignedManufacturer" | "assignedManufacturerEmail" | "assignedCrmMemberId"
  >,
  identity: ManufacturerAssignmentIdentity,
): boolean {
  const assignedEmail = normEmail(row.assignedManufacturerEmail);
  if (assignedEmail && identity.emails.has(assignedEmail)) return true;

  const crmId = row.assignedCrmMemberId?.trim() ?? "";
  if (crmId && identity.crmMemberIds.has(crmId)) return true;

  const assignedLabel = normLabel(row.assignedManufacturer);
  if (assignedLabel) {
    for (const label of identity.labels) {
      const nl = normLabel(label);
      if (!nl) continue;
      if (nl === assignedLabel || assignedLabel.includes(nl) || nl.includes(assignedLabel)) {
        return true;
      }
    }
  }

  return false;
}

export function filterNprsForManufacturerUser(
  rows: NewProductRequest[],
  identity: ManufacturerAssignmentIdentity,
): NewProductRequest[] {
  return rows.filter(
    (row) => row.status !== "draft" && nprMatchesManufacturerIdentity(row, identity),
  );
}

/** Best label for manufacturer-initiated NPR assignment (matches HQ brief assignment). */
export function resolveManufacturerAssignmentLabel(
  identity: ManufacturerAssignmentIdentity,
  accounts: Account[] = [],
): string {
  for (const acc of accounts) {
    if (acc.type !== "manufacturer" || acc.distributorOrgId) continue;
    const accEmail = normEmail(acc.email);
    if (accEmail && identity.emails.has(accEmail)) {
      return acc.tradingName?.trim() || acc.legalName?.trim() || "Manufacturer";
    }
  }
  const labels = [...identity.labels];
  const accountStyle = labels.find((l) => /brewery|distillery|brewing|kura/i.test(l));
  return accountStyle ?? labels[0] ?? "Manufacturer";
}
