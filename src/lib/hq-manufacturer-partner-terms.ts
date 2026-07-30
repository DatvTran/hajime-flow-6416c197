/** Partner-term dropdown options for HQ manufacturer edit. */

export const HQ_QUALITY_PREMIUM_OPTIONS = [
  "—",
  "No premium",
  "¥1/btl quality",
  "¥1.5/btl quality",
  "¥2/btl quality",
  "¥2.5/btl quality",
  "¥3/btl quality",
] as const;

export const HQ_RAW_MATERIALS_CONTRACT_OPTIONS = [
  "—",
  "Grain & botanicals · contract",
  "Regional grain · contract",
  "Malt & hops · contract",
  "Cane spirit base · estate contract",
  "Grapes · estate contract",
  "Botanicals & neutral spirit · contract",
  "Mixed base inputs · contract",
  "Supplier TBD",
] as const;

/** Include the current value when it is not in the preset list (legacy/custom saves). */
export function selectOptionsWithCurrent(options: readonly string[], current: string): string[] {
  const trimmed = current.trim();
  if (!trimmed || (options as readonly string[]).includes(trimmed)) {
    return [...options];
  }
  return [...options, trimmed];
}
