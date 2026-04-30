export function isManufacturerAccountType(type: string | undefined): boolean {
  const t = (type || "").toLowerCase().trim();
  return t === "manufacturer" || t === "producer";
}

/** Fallback heuristic when legacy data lacks a proper `type`. */
export function looksLikeManufacturerAccount(a: { tradingName?: string; legalName?: string }): boolean {
  const hay = `${a.tradingName || ""} ${a.legalName || ""}`.toLowerCase();
  return /kirin|brew|brewery|distill|distillery|facility|production|bottl|co\\.|ltd|inc\\./i.test(hay);
}

