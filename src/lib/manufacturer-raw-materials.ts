export type MaterialStockTone = "low" | "med" | "ok";

export type RawMaterialRow = {
  sku: string;
  name: string;
  type: string;
  onHand: string;
  reorderPt: string;
  tone: MaterialStockTone;
  pct: number;
};

/** Empty until materials inventory is wired to the API. */
export const RAW_MATERIALS: RawMaterialRow[] = [];

export function levelLabel(tone: MaterialStockTone): string {
  if (tone === "low") return "Below reorder point";
  if (tone === "med") return "Monitor";
  return "Stocked";
}

export function levelTextClass(tone: MaterialStockTone): string {
  if (tone === "low") return "text-[hsl(0_68%_44%)]";
  if (tone === "med") return "text-[hsl(38_90%_40%)]";
  return "text-[hsl(158_56%_32%)]";
}

export function availFillClass(tone: MaterialStockTone): string {
  if (tone === "low") return "mfg-avail-low";
  if (tone === "med") return "mfg-avail-med";
  return "mfg-avail-ok";
}

export function lowStockMaterials(materials: RawMaterialRow[] = RAW_MATERIALS): RawMaterialRow[] {
  return materials.filter((m) => m.tone === "low");
}

export function formatLowStockAlert(materials: RawMaterialRow[]): string {
  return materials.map((m) => `${m.name.split(" ").slice(0, 2).join(" ")} (${m.pct}%)`).join(" and ");
}

export function lastInventoryCountLabel(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(d);
  monday.setDate(d.getDate() - diff);
  const datePart = monday.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  return `${datePart} 06:00`;
}

export function packagingStockFromMaterials(materials: RawMaterialRow[] = RAW_MATERIALS) {
  return materials
    .filter((m) => m.type === "Packaging")
    .map((m) => ({
      name: m.name.split(" ").slice(0, 2).join(" "),
      onHand: m.onHand,
      pct: m.pct,
      tone: m.tone,
    }));
}
