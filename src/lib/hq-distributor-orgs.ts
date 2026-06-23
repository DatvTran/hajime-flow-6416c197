import type { Account } from "@/data/mockData";
import type { DistributorOrganizationRow } from "@/lib/api-v1-mutations";

export function partnerPathForOrg(orgId: string): string {
  return `/partners/distributor/${encodeURIComponent(orgId)}`;
}

/** Resolve wholesaler registry id for a platform distributor account (name match). */
export function resolveDistributorOrgId(
  account: Account,
  orgs: DistributorOrganizationRow[],
): string | undefined {
  if (account.distributorOrgId) return account.distributorOrgId;
  if (account.type !== "distributor") return undefined;
  const label = (account.tradingName || account.legalName || account.name || "")
    .trim()
    .toLowerCase();
  if (!label) return undefined;
  const exact = orgs.find((o) => o.name.trim().toLowerCase() === label);
  if (exact) return exact.id;
  const partial = orgs.find(
    (o) => label.includes(o.name.trim().toLowerCase()) || o.name.trim().toLowerCase().includes(label),
  );
  return partial?.id;
}
