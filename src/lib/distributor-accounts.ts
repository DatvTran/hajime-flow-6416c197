/**
 * Commercial account `type` values and CRM roster roles both use "distributor"
 * semantics; API payloads may vary casing or use "wholesaler".
 */
export function isDistributorAccountType(type: string | undefined): boolean {
  const t = (type || "").toLowerCase().trim();
  return t === "distributor" || t === "wholesaler";
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
