import type { Account } from "@/data/mockData";
import { resolveSalesRepLabelForSession } from "@/data/team-roster";
import type { TeamMember } from "@/types/app-data";

export function normalizeRepLabel(label: string | undefined | null): string {
  return String(label ?? "")
    .trim()
    .toLowerCase();
}

/** Case-insensitive match for `accounts.sales_owner` vs session rep label. */
export function salesOwnerMatches(
  accountSalesOwner: string | undefined | null,
  repLabel: string,
): boolean {
  const owner = normalizeRepLabel(accountSalesOwner || "Unassigned");
  const rep = normalizeRepLabel(repLabel);
  if (!rep) return false;
  return owner === rep;
}

export function resolveSessionRepLabel(email: string | undefined, displayName: string): string {
  return resolveSalesRepLabelForSession(email, displayName);
}

/** Accounts owned by this rep or created via their store invitation (CRM link). */
export function accountBelongsToSalesRep(
  account: Account,
  user: { id: string; email: string; displayName: string },
  teamMembers: TeamMember[],
): boolean {
  const rep = resolveSessionRepLabel(user.email, user.displayName ?? "");
  if (salesOwnerMatches(account.salesOwner, rep)) return true;

  const trading = (account.tradingName || account.legalName || "").trim().toLowerCase();
  return teamMembers.some((tm) => {
    if (tm.role !== "retail") return false;
    if (String(tm.crmRequestedByUserId) !== String(user.id)) return false;
    if (tm.linkedAccountId && tm.linkedAccountId === account.id) return true;
    const tmName = (tm.retailTradingName || "").trim().toLowerCase();
    return Boolean(tmName && trading && tmName === trading);
  });
}

export function filterAccountsForSalesRep(
  accounts: Account[],
  user: { id: string; email: string; displayName: string },
  teamMembers: TeamMember[],
): Account[] {
  return accounts.filter((a) => accountBelongsToSalesRep(a, user, teamMembers));
}
