import type { Account } from "@/data/mockData";

export type ManufacturerPick = { label: string; email?: string | null };

/**
 * Map a production-PO manufacturer pick (CRM + profile label) to an Accounts row when possible.
 * Prefers email match, then manufacturer/producer account name match.
 */
export function findAccountForManufacturerPick(
  accounts: Account[],
  pick: ManufacturerPick | undefined,
): Account | undefined {
  if (!pick) return undefined;
  const em = String(pick.email ?? "")
    .trim()
    .toLowerCase();
  if (em) {
    const byEmail = accounts.find(
      (a) =>
        (a.email && a.email.toLowerCase() === em) ||
        (a.portalLoginEmail && a.portalLoginEmail.toLowerCase() === em),
    );
    if (byEmail) return byEmail;
  }
  const norm = (s: string) => s.trim().toLowerCase();
  const label = norm(pick.label);
  if (!label) return undefined;
  return accounts.find((a) => {
    if (a.type !== "manufacturer" && a.type !== "producer") return false;
    const tn = norm(a.tradingName ?? "");
    const ln = norm(a.legalName ?? "");
    if (tn === label || ln === label) return true;
    if (tn && (tn.includes(label) || label.includes(tn))) return true;
    return false;
  });
}
