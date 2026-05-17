import type { Account } from "@/data/mockData";
import type { TeamMember } from "@/types/app-data";

/** Client-side filter when app data includes distributor ownership fields. */
export function filterAccountsForDistributor(
  accounts: Account[],
  distributorUserId: string,
  teamMembers: TeamMember[],
): Account[] {
  const distId = String(distributorUserId);
  const linkedIds = new Set(
    teamMembers
      .filter((tm) => tm.managedByUserId === distId && tm.linkedAccountId)
      .map((tm) => String(tm.linkedAccountId)),
  );

  return accounts.filter((a) => {
    if (a.managedByDistributorUserId === distId) return true;
    if (linkedIds.has(String(a.id))) return true;
    return false;
  });
}

export function filterTeamMembersForDistributor(
  members: TeamMember[],
  distributorUserId: string,
): TeamMember[] {
  const distId = String(distributorUserId);
  const repUserIds = new Set(
    members
      .filter((m) => m.role === "sales_rep" && m.managedByUserId === distId)
      .map((m) => m.id),
  );
  return members.filter((m) => {
    if (m.managedByUserId === distId) return true;
    if (
      m.role === "retail" &&
      m.pendingDistributorApproval &&
      m.crmRequestedByUserId &&
      repUserIds.has(String(m.crmRequestedByUserId))
    ) {
      return true;
    }
    return false;
  });
}
