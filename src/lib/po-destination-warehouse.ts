import type { TeamMember, Warehouse } from "@/types/app-data";

/** Active warehouses from Settings, ordered for dropdowns. */
export function activeDestinationWarehouses(warehouses: Warehouse[] | undefined): Warehouse[] {
  return [...(warehouses ?? [])]
    .filter((w) => w.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));
}

/**
 * Distributor-visible depots only: primary + CRM/account-linked (never peer DCs or HQ brand pool).
 * Mirrors server `filterWarehouseOptionsForDistributor`.
 */
export function warehousesForDistributorMember(
  warehouses: Warehouse[] | undefined,
  member: Pick<TeamMember, "id" | "primaryWarehouseId" | "linkedAccountId"> | undefined,
): Warehouse[] {
  const list = activeDestinationWarehouses(warehouses);
  if (!member?.id) return [];
  const mid = String(member.id).trim();
  const primary =
    member.primaryWarehouseId != null && String(member.primaryWarehouseId).trim() !== ""
      ? String(member.primaryWarehouseId).trim()
      : null;
  const accountId =
    member.linkedAccountId != null && String(member.linkedAccountId).trim() !== ""
      ? String(member.linkedAccountId).trim()
      : null;

  return list.filter((w) => {
    const wid = String(w.id ?? "").trim();
    if (!wid) return false;
    if (primary && primary === wid) return true;
    if (w.linkedTeamMemberId != null && String(w.linkedTeamMemberId).trim() === mid) return true;
    if (
      accountId &&
      w.linkedAccountId != null &&
      String(w.linkedAccountId).trim() === accountId
    ) {
      return true;
    }
    return false;
  });
}

export function inventoryReceivingLocationForWarehouseDisplayName(displayName: string): string {
  return displayName.trim();
}

/**
 * Resolves `PurchaseOrder.marketDestination` (warehouse name from Settings)
 * to the inventory `warehouse` / adjustment location string.
 */
export function resolveReceivingLocationForPo(
  marketDestination: string | undefined,
  warehouses: Warehouse[] | undefined,
): string {
  const raw = (marketDestination ?? "").trim();
  const list = activeDestinationWarehouses(warehouses);

  if (raw) {
    const matchDir = list.find((w) => w.name.toLowerCase() === raw.toLowerCase());
    if (matchDir) return inventoryReceivingLocationForWarehouseDisplayName(matchDir.name);
    return inventoryReceivingLocationForWarehouseDisplayName(raw);
  }

  const first = list[0];
  if (first) return inventoryReceivingLocationForWarehouseDisplayName(first.name);
  return "";
}
