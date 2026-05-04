/** Stored on `NewProductRequest.specs.baseSpirit` — keep in sync with product request dialogs */
export const BASE_SPIRIT_OPTIONS: { value: string; label: string }[] = [
  { value: "rhum", label: "Rhum" },
  { value: "vodka", label: "Vodka" },
  { value: "gin", label: "Gin" },
  { value: "tequila", label: "Tequila" },
  { value: "whiskey", label: "Whiskey" },
];

export function formatBaseSpiritLabel(stored: string): string {
  const hit = BASE_SPIRIT_OPTIONS.find((o) => o.value === stored);
  if (hit) return hit.label;
  return stored
    .replace(/_/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
