import type { Account, NewProductRequest, PurchaseOrder } from "@/data/mockData";
import type { AppData } from "@/types/app-data";
import type { HqManufacturerEditForm } from "@/lib/hq-manufacturer-edit";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Every identifier / label / email connected to a manufacturer being deleted. */
export type ManufacturerDeletionTargets = {
  /** ids to hide + attempt profile/account deletion (partner id, account id, profile id, route id). */
  ids: string[];
  /** portal-user emails to remove (contact email, account email). */
  emails: string[];
  /** normalized names + slugs used to match NPRs / portal users by label. */
  nameKeys: string[];
};

/** Collect all connected identifiers for a manufacturer from its edit form + linked account. */
export function computeManufacturerDeletionTargets(
  manufacturerId: string,
  form: HqManufacturerEditForm,
  linkedAccount: Account | null | undefined,
): ManufacturerDeletionTargets {
  const ids = [manufacturerId, form.id, form.accountId, form.profileId, linkedAccount?.id]
    .map((value) => (value ?? "").trim())
    .filter(Boolean);

  const emails = [form.email, linkedAccount?.email]
    .map((value) => (value ?? "").trim().toLowerCase())
    .filter(Boolean);

  const names = [form.name, form.legalName, linkedAccount?.tradingName, linkedAccount?.legalName]
    .map((value) => (value ?? "").trim())
    .filter(Boolean);

  const nameKeys = [...new Set(names.flatMap((name) => [name.toLowerCase(), slugify(name)]))].filter(
    Boolean,
  );

  return {
    ids: [...new Set(ids)],
    emails: [...new Set(emails)],
    nameKeys,
  };
}

function buildMatchers(targets: ManufacturerDeletionTargets) {
  const idSet = new Set(targets.ids.map((id) => id.toLowerCase()));
  const emailSet = new Set(targets.emails);
  const nameSet = new Set(targets.nameKeys);

  const matchesName = (value: string | undefined | null): boolean => {
    const v = (value ?? "").trim();
    if (!v) return false;
    return nameSet.has(v.toLowerCase()) || nameSet.has(slugify(v));
  };
  const matchesId = (value: string | undefined | null): boolean => {
    const v = (value ?? "").trim().toLowerCase();
    return v ? idSet.has(v) : false;
  };
  const matchesEmail = (value: string | undefined | null): boolean => {
    const v = (value ?? "").trim().toLowerCase();
    return v ? emailSet.has(v) : false;
  };
  return { matchesName, matchesId, matchesEmail };
}

/** A production PO is connected when its manufacturer id or name matches the deleted manufacturer. */
export function isPurchaseOrderConnected(
  po: PurchaseOrder,
  targets: ManufacturerDeletionTargets,
): boolean {
  if (po.poType === "sales") return false;
  const { matchesName, matchesId } = buildMatchers(targets);
  return matchesId(po.manufacturerId) || matchesName(po.manufacturer);
}

/** Client ids of production POs connected to the deleted manufacturer. */
export function connectedPurchaseOrderIds(
  data: AppData,
  targets: ManufacturerDeletionTargets,
): string[] {
  return (data.purchaseOrders ?? [])
    .filter((po) => isPurchaseOrderConnected(po, targets))
    .map((po) => po.id);
}

/** An NPR is connected when its assigned manufacturer matches the deleted manufacturer. */
export function isNprConnected(
  npr: NewProductRequest,
  targets: ManufacturerDeletionTargets,
): boolean {
  const { matchesName, matchesId, matchesEmail } = buildMatchers(targets);
  return (
    matchesEmail(npr.assignedManufacturerEmail) ||
    matchesId(npr.assignedCrmMemberId) ||
    matchesName(npr.assignedManufacturer)
  );
}

/**
 * Remove everything connected to a deleted manufacturer from local app data:
 * its production POs, NPR assignments, portal users, and profile snapshot.
 */
export function applyManufacturerDeletionToAppData(
  data: AppData,
  targets: ManufacturerDeletionTargets,
): AppData {
  const { matchesName, matchesId, matchesEmail } = buildMatchers(targets);

  const purchaseOrders = (data.purchaseOrders ?? []).filter(
    (po) => !isPurchaseOrderConnected(po, targets),
  );

  const newProductRequests = (data.newProductRequests ?? []).filter(
    (npr) =>
      !(
        matchesEmail(npr.assignedManufacturerEmail) ||
        matchesId(npr.assignedCrmMemberId) ||
        matchesName(npr.assignedManufacturer)
      ),
  );

  const teamMembers = (data.teamMembers ?? []).filter((tm) => {
    if (tm.role !== "manufacturer") return true;
    const connected =
      matchesEmail(tm.email) ||
      matchesId(tm.id) ||
      matchesName(tm.displayName) ||
      matchesName(tm.retailTradingName);
    return !connected;
  });

  let manufacturerProfile = data.manufacturerProfile;
  if (
    manufacturerProfile &&
    (matchesId(manufacturerProfile.id) ||
      matchesId(manufacturerProfile.manufacturerId) ||
      matchesName(manufacturerProfile.companyName))
  ) {
    manufacturerProfile = undefined;
  }

  return {
    ...data,
    purchaseOrders,
    newProductRequests,
    teamMembers,
    manufacturerProfile,
  };
}
