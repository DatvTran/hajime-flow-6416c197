import type { AppData, TeamMember } from "@/types/app-data";
import { TEAM_ROSTER } from "@/data/team-roster";

const ROSTER_EMAILS = new Set(TEAM_ROSTER.map((m) => m.email.toLowerCase()));

/**
 * Canonical roster rows always win for those emails, then any HQ-added members
 * (emails not on the seed roster). Prevents partial persisted data from hiding
 * sales reps / retail / etc. that match login personas and mock orders.
 */
function mergeTeamMembersWithRoster(fromPayload: TeamMember[]): TeamMember[] {
  const extras = fromPayload.filter((m) => !ROSTER_EMAILS.has(m.email.toLowerCase()));
  return [...TEAM_ROSTER, ...extras];
}

export function normalizeAppData(raw: AppData): AppData {
  const teamFromPayload = Array.isArray(raw.teamMembers) ? raw.teamMembers : [];
  const teamMembers =
    teamFromPayload.length > 0 ? mergeTeamMembersWithRoster(teamFromPayload) : [...TEAM_ROSTER];

  return {
    ...raw,
    version: raw.version ?? 1,
    operationalSettings: raw.operationalSettings ?? {
      manufacturerLeadTimeDays: 45,
      safetyStockBySku: {
        "HJM-OG-750": 400,
        "HJM-YZ-750": 200,
        "HJM-OG-375": 300,
        "HJM-SP-750": 150,
        "HJM-FP-750": 180,
      },
    },
    auditLogs: Array.isArray(raw.auditLogs) ? raw.auditLogs : [],
    teamMembers,
  };
}
