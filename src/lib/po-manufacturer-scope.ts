import type { PurchaseOrder } from "@/data/mockData";
import type { ManufacturerAssignmentIdentity } from "@/lib/npr-manufacturer-scope";

function normLabel(value: string | undefined | null): string {
  return String(value ?? "").trim().toLowerCase();
}

export function poMatchesManufacturerIdentity(
  row: Pick<PurchaseOrder, "manufacturer" | "manufacturerId" | "status">,
  identity: ManufacturerAssignmentIdentity,
): boolean {
  const mfgId = row.manufacturerId?.trim() ?? "";
  if (mfgId) {
    if (identity.crmMemberIds.has(mfgId)) return true;
    // Partner ids are stored lower-case; tolerate case drift from older rows.
    const lower = mfgId.toLowerCase();
    if ([...identity.crmMemberIds].some((id) => id.toLowerCase() === lower)) return true;
  }

  const supplier = normLabel(row.manufacturer);
  if (!supplier) return false;
  for (const label of identity.labels) {
    const nl = normLabel(label);
    if (!nl) continue;
    if (nl === supplier) return true;
    // Fuzzy: "Kosapan Distillery Co., Ltd." ↔ "Kosapan Distillery"
    if (supplier.includes(nl) || nl.includes(supplier)) return true;
  }
  return false;
}

/** Manufacturer inbox — issued POs assigned to this kura (drafts stay with HQ). */
export function filterPosForManufacturerUser(
  rows: PurchaseOrder[],
  identity: ManufacturerAssignmentIdentity,
): PurchaseOrder[] {
  return rows.filter(
    (row) => row.status !== "draft" && poMatchesManufacturerIdentity(row, identity),
  );
}
