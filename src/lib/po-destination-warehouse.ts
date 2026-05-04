import type { Warehouse } from "@/types/app-data";

/** Active warehouses from Settings, ordered for dropdowns. */
export function activeDestinationWarehouses(warehouses: Warehouse[] | undefined): Warehouse[] {
  return [...(warehouses ?? [])]
    .filter((w) => w.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));
}

/**
 * Inventory adjustments use location strings that may differ slightly from Settings labels
 * (e.g. legacy rows say "Toronto Main" while Settings defaults use "Toronto Main Warehouse").
 */
const SETTINGS_NAME_TO_INVENTORY_LOCATION: Record<string, string> = {
  "toronto main warehouse": "Toronto Main",
};

export function inventoryReceivingLocationForWarehouseDisplayName(displayName: string): string {
  const key = displayName.trim().toLowerCase();
  return SETTINGS_NAME_TO_INVENTORY_LOCATION[key] ?? displayName.trim();
}

/** Legacy POs stored region labels instead of warehouse directory names. */
const LEGACY_MARKET_TO_STOCK_LOCATION: Record<string, string> = {
  Ontario: "Toronto Main",
  Toronto: "Toronto Main",
  Milan: "Milan Depot",
  "Milan DC": "Milan Depot",
  Paris: "Paris Hub",
  NYC: "NYC Warehouse",
};

/**
 * Resolves `PurchaseOrder.marketDestination` (warehouse name from Settings or legacy region label)
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

    const legacy = LEGACY_MARKET_TO_STOCK_LOCATION[raw];
    if (legacy) return legacy;

    return inventoryReceivingLocationForWarehouseDisplayName(raw);
  }

  const first = list[0];
  if (first) return inventoryReceivingLocationForWarehouseDisplayName(first.name);
  return "Toronto Main";
}
