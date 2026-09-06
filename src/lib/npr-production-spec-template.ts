import type { NewProductProductionSpec, NewProductProductionTarget } from "@/data/mockData";

export const DEFAULT_PRODUCTION_TARGETS: NewProductProductionTarget[] = [
  { parameter: "Final ABV", target: "25.0%", tolerance: "±0.3%" },
  { parameter: "Total sugar", target: "120 g/L", tolerance: "±5 g/L" },
  { parameter: "Titratable acidity", target: "0.7 g/L (as citric)", tolerance: "±0.15" },
  { parameter: "Salt (NaCl)", target: "0.4 g/L", tolerance: "±0.05" },
  { parameter: "Gum arabic", target: "2.0 g/L", tolerance: "±0.5" },
  { parameter: "Turbidity (post-filter, 4°C)", target: "< 1.0 NTU", tolerance: "—" },
  { parameter: "Dissolved oxygen at fill", target: "< 0.5 mg/L", tolerance: "—" },
  { parameter: "Target shelf life", target: "12–18 months", tolerance: "—" },
];

/** Example coffee rhum bench-trial brief used to seed the New alcohol concept form. */
export function coffeeRhumProductionSpecTemplate(): NewProductProductionSpec {
  return {
    format: "Coffee rhum liqueur, cold-pour format",
    serveProfile: "Espresso martini, served chilled — over ice, or neat from freezer",
    revision: "1.1 — bench trial specification",
    statusNote: "For bench trial. Do not scale to full production until bench batch is approved.",
    criticalInstructions:
      "Every trial sample must be tasted at 4°C, chilled for a minimum of 4 hours. Room-temperature tasting will produce wrong decisions on sugar, acid, and aroma. Cold suppresses sweetness and aroma far more than it suppresses bitterness.",
    productTargets: DEFAULT_PRODUCTION_TARGETS.map((row) => ({ ...row })),
    rawMaterials: [
      "Coffee — Arabica Thai northern (Chiang Rai / Doi Chaang), Full City+ to Vienna. Robusta Thai southern, dark roast. Blend 70% arabica : 30% robusta. Whole bean for maceration; coarse ground for fresh concentrate. Roast date at use 7–14 days (not fresher than 7, not older than 21). Sealed, dark, < 25°C.",
      "Spirit — Base rhum from organic sugarcane, unaged or lightly aged. Charging strength for maceration: 65% ABV. Free of copper/iron pickup.",
      "Water — RO or equivalent. Iron < 0.05 mg/L, copper < 0.1 mg/L. Deaerated before use.",
      "Other — Organic cane sugar (caramelized + plain syrup), roasted cacao nibs, whole vanilla beans (no extract), non-iodized NaCl, malic or citric acid, beverage-grade gum arabic, food-grade nitrogen.",
    ].join("\n\n"),
    componentPreparation: [
      "Stream A — Depth macerate (30 days): rhum @ 65% ABV; whole bean 70/30 at 250 g/L; 20–25°C; N2 blanketed; gentle agitation every 3 days. Add cacao nibs 15 g/L on day 23 only. Beans stay whole. Record recovery (expect ~25–35% volume loss). Pre-filter 5 µm; hold cold/dark under N2.",
      "Stream B — Fresh lift concentrate: same blend, coarse ground; pressure extraction preferred; 1:2 coffee:water; TDS 8–12%; produce within 48h of blending; chill < 10°C within 30 min; hold under N2.",
      "Stream C — Vanilla tincture: rhum @ 65% ABV; split beans 20 g/L; 14 days; filter 5 µm.",
      "Stream D — Sugar: total 120 g/L finished — caramelized cane 28 g/L + plain cane syrup 92 g/L. Combine; record Brix.",
    ].join("\n\n"),
    blendFormula: [
      "1,000 L finished starting point:",
      "• Stream A macerate @ 65%: 300 L (195 LAA)",
      "• Stream C vanilla @ 65%: 10 L (6.5 LAA; dose 8–15 L to taste)",
      "• Additional base rhum @ 65%: 75 L (48.8 LAA)",
      "• Subtotal alcohol: 385 L → 250 LAA → 25.0% ABV in 1,000 L",
      "• Stream B fresh concentrate: 120 L",
      "• Stream D sugar syrup: ~135 L (120 kg sugar)",
      "• Gum arabic 2.0 kg · Salt 0.4 kg · Malic acid 0.7 kg",
      "• Deaerated water to 1,000 L (~360 L)",
      "",
      "Bench batch 20 L: divide by 50 (A 6.0 L, C 200 mL, extra rhum 1.50 L, B 2.4 L, syrup ~2.7 L / 2.4 kg sugar, gum 40 g, salt 8 g, malic 14 g, water to 20 L).",
      "Iterate tasting at 4°C: flat→↑B; thin→↑A; harsh cold→↑sugar then salt; flabby→↑acid; quiet aroma→↑B+vanilla; thin mouthfeel→↑gum to 3 g/L; hot/ethanol→↑sugar toward 140 g/L + ↑B (do not lower ABV).",
    ].join("\n"),
    processSequence: [
      "1. Start Stream A (30-day). Add cacao day 23.",
      "2. Prepare Stream C in parallel (14 days).",
      "3. Day 28: sugar syrups + hydrate gum arabic.",
      "4. Day 30: drain/pre-filter Stream A (5 µm).",
      "5. Day 30: produce Stream B; chill immediately.",
      "6. Blend under N2: alcohol streams → concentrate → syrup/additives → water to volume.",
      "7. Check ABV, sugar, acidity; adjust.",
      "8. Cold stabilize at 0°C for ≥48 hours (mandatory).",
      "9. Cold filter at 0°C: 5 µm then 1 µm.",
      "10. Hold cold, N2 blanketed, until packaging.",
      "11. Fill with N2 flush; minimal consistent headspace; seal.",
    ].join("\n"),
    shelfLifeControls: [
      "25% ABV is self-preserving — oxidation/aroma fade are the risks, not microbes.",
      "Oxygen: deaerated water; N2 on every hold/transfer/fill; consistent headspace; quality liner or synthetic stopper — no natural cork.",
      "Metals: stainless post-distillation; no copper/brass fittings downstream; test water iron.",
      "Light: amber/opaque glass, or full-wrap label/carton if clear glass.",
      "Retain samples; re-inspect at 30 days at 4°C. Haze at 30 days means filtration incomplete.",
    ].join("\n"),
    acceleratedShelfLife:
      "Hold sealed samples at 40°C vs frozen control. Taste at 2, 4, 8, and 12 weeks. ~4 weeks at 40°C ≈ 6 months ambient. Record haze, aroma intensity, cardboard/rancid notes, colour shift.",
    shippingNotes:
      "Thailand → Canada: dry containers can hit 50–60°C. Prefer reefer at 15°C, or ship only in cooler months. Decide before costing landed price.",
    qcRecordsRequired: [
      "Coffee: origin, lot, roast date, roast level, certificate",
      "Stream A: charge weight, spirit volume, volume recovered, daily temp log, cacao date",
      "Stream B: grind, method, ratio, measured TDS, time extraction→blend",
      "Blend: ABV, sugar g/L, titratable acidity, pH",
      "Cold stabilization: temp + duration",
      "Filtration: temp at filter, micron ratings",
      "Fill: dissolved oxygen, headspace",
      "Water: iron and copper results",
    ].join("\n"),
    samplesRequired: [
      "Stream A macerate alone — 250 mL",
      "Stream B concentrate alone — 250 mL",
      "Final blend — 3 × 500 mL",
      "Final blend, unfiltered — 250 mL",
      "Include full QC record. All approval tasting at 4°C. Ship chilled if possible.",
    ].join("\n"),
    futureProcessNotes:
      "Evaluate a recirculation column (packed bed of coarse-ground coffee) once flavour is locked — equivalent extraction in hours vs 30-day vessel tie-up.",
  };
}
