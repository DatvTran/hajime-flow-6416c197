import type { Account } from "@/data/mockData";
import { EXPORT_SELLER } from "@/lib/export-commercial";

/**
 * Commercial account `type` values and CRM roster roles both use "distributor"
 * semantics; API payloads may vary casing or use "wholesaler".
 */
export function isDistributorAccountType(type: string | undefined): boolean {
  const t = (type || "").toLowerCase().trim();
  return t === "distributor" || t === "wholesaler";
}

function accountDisplayName(a: Account | undefined): string | null {
  if (!a) return null;
  const name = (a.tradingName || a.legalName || a.distributorOrgName || "").trim();
  return name || null;
}

/** Platform wholesaler row for the signed-in distributor portal user. */
export function findDistributorPortalAccount(
  accounts: Account[],
  user: { id?: string; email?: string } | null | undefined,
): Account | undefined {
  if (!user?.id && !user?.email) return undefined;
  const uid = user.id != null ? String(user.id) : "";
  const email = (user.email || "").trim().toLowerCase();

  const wholesalers = accounts.filter((a) => isDistributorAccountType(a.type));

  const byManager = uid
    ? wholesalers.find((a) => String(a.managedByDistributorUserId ?? "") === uid)
    : undefined;
  if (byManager) return byManager;

  if (email) {
    const byEmail = wholesalers.find((a) => {
      const login = (a.portalLoginEmail || a.email || "").trim().toLowerCase();
      return login === email;
    });
    if (byEmail) return byEmail;
  }

  // Org-scoped retail rows still carry the wholesaler trading name.
  if (uid) {
    const scoped = accounts.find(
      (a) =>
        String(a.managedByDistributorUserId ?? "") === uid &&
        (a.distributorOrgName || a.tradingName || a.legalName),
    );
    if (scoped?.distributorOrgName?.trim()) {
      return (
        wholesalers.find(
          (a) =>
            String(a.distributorOrgId ?? "") === String(scoped.distributorOrgId ?? "") ||
            (a.tradingName || a.legalName || "").trim().toLowerCase() ===
              scoped.distributorOrgName!.trim().toLowerCase(),
        ) ?? scoped
      );
    }
  }

  return undefined;
}

/** Wholesaler trading name for sidebar / partner chrome (never Hajime Ltd.). */
export function distributorPortalAccountLabel(
  accounts: Account[],
  user:
    | {
        id?: string;
        email?: string;
        displayName?: string;
        distributorOrgName?: string;
      }
    | null
    | undefined,
): string {
  const fromOrg = (user?.distributorOrgName || "").trim();
  if (fromOrg) return fromOrg;
  const fromAccount = accountDisplayName(findDistributorPortalAccount(accounts, user));
  if (fromAccount) return fromAccount;
  const fromDisplay = (user?.displayName || "").trim();
  if (fromDisplay) return fromDisplay;
  return "Distributor";
}

/**
 * Top-bar org crumb: International orders are Hajime Ltd. seller files;
 * every other distributor route uses the linked wholesaler account.
 */
export function distributorChromeOrgLabel(
  pathname: string,
  accounts: Account[],
  user:
    | {
        id?: string;
        email?: string;
        displayName?: string;
        distributorOrgName?: string;
      }
    | null
    | undefined,
): string {
  if (pathname.startsWith("/distributor/international-orders")) {
    return EXPORT_SELLER.legalName;
  }
  return distributorPortalAccountLabel(accounts, user);
}

/** Synthetic distributor row from Settings CRM (no `accounts` row yet). */
export const CRM_DISTRIBUTOR_ID_PREFIX = "crm-dist:";

export function isCrmOnlyDistributorId(id: string | undefined): boolean {
  return !!id && id.startsWith(CRM_DISTRIBUTOR_ID_PREFIX);
}

/** Synthetic retail customer row from Settings CRM (no `accounts` row yet). */
export const CRM_RETAIL_ID_PREFIX = "crm-retail:";

export function isCrmOnlyRetailId(id: string | undefined): boolean {
  return !!id && id.startsWith(CRM_RETAIL_ID_PREFIX);
}
