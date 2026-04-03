import type { TeamMember } from "@/types/app-data";

/**
 * Canonical portal roster — matches:
 * - `accounts` contact emails / salesOwner names (mockData + hajime-accounts.json)
 * - `salesOrders.salesRep` (Sarah Kim, Marcus Chen, Luca Moretti)
 * - Sign-in personas (Auth) — use exact `displayName` for sales rep so rep home filters work
 */
export const TEAM_ROSTER: TeamMember[] = [
  { id: "tm-seed-1", displayName: "Sarah Kim", email: "sarah.kim@hajime.jp", role: "sales_rep", createdAt: "2026-01-08" },
  { id: "tm-seed-2", displayName: "Marcus Chen", email: "marcus.chen@hajime.jp", role: "sales_rep", createdAt: "2026-01-08" },
  { id: "tm-seed-3", displayName: "Luca Moretti", email: "luca.moretti@hajime.jp", role: "sales_rep", createdAt: "2026-01-10" },
  {
    id: "tm-seed-4",
    displayName: "Jeff Guignard",
    email: "jeff@thedrake.ca",
    role: "retail",
    createdAt: "2026-01-12",
  },
  {
    id: "tm-seed-5",
    displayName: "Maria Rossi",
    email: "mrossi@eataly.com",
    role: "retail",
    createdAt: "2026-01-14",
  },
  {
    id: "tm-seed-6",
    displayName: "James Park",
    email: "jpark@lcbo.com",
    role: "retail",
    createdAt: "2026-01-16",
  },
  {
    id: "tm-seed-7",
    displayName: "Metro Logistics Ops",
    email: "fulfillment@metrologistics.example",
    role: "distributor",
    createdAt: "2026-01-10",
  },
  {
    id: "tm-seed-8",
    displayName: "Priya Nandakumar",
    email: "pnandakumar@convoysupply.example",
    role: "distributor",
    createdAt: "2026-01-11",
  },
  {
    id: "tm-seed-9",
    displayName: "Kirin Production Liaison",
    email: "export@kirin.example",
    role: "manufacturer",
    createdAt: "2026-01-12",
  },
  {
    id: "tm-seed-10",
    displayName: "Kirin Export Scheduling",
    email: "scheduling@kirin.example",
    role: "manufacturer",
    createdAt: "2026-01-15",
  },
];

/** Retail portal login — must match `Account.tradingName` in mockData for order visibility. */
export const RETAIL_ACCOUNT_TRADING_NAME_BY_EMAIL: Record<string, string> = {
  "jeff@thedrake.ca": "The Drake Hotel",
  "mrossi@eataly.com": "Eataly Toronto",
  "jpark@lcbo.com": "LCBO Ontario",
};

export function findTeamMemberByEmail(email: string | undefined): TeamMember | undefined {
  if (!email?.trim()) return undefined;
  const e = email.trim().toLowerCase();
  return TEAM_ROSTER.find((m) => m.email.toLowerCase() === e);
}

/** Sales rep / HQ name used on accounts & orders — prefer roster when email matches. */
export function resolveSalesRepLabelForSession(email: string | undefined, displayName: string): string {
  const tm = findTeamMemberByEmail(email);
  if (tm?.role === "sales_rep") return tm.displayName;
  return displayName;
}
