import type { NewProductProductionSpec } from "@/data/mockData";

function SpecBlock({ label, value }: { label: string; value?: string }) {
  const text = value?.trim();
  if (!text) return null;
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </div>
      <pre className="mt-1 whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-foreground">
        {text}
      </pre>
    </div>
  );
}

type Props = {
  productionSpec?: NewProductProductionSpec | null;
  className?: string;
};

/** Renders the coffee-rhum-style production / bench-trial specification. */
export function NprProductionSpecPanel({ productionSpec, className }: Props) {
  if (!productionSpec) return null;

  const targets = Array.isArray(productionSpec.productTargets)
    ? productionSpec.productTargets.filter((row) => row.parameter?.trim())
    : [];

  const hasHeader =
    Boolean(productionSpec.format?.trim()) ||
    Boolean(productionSpec.serveProfile?.trim()) ||
    Boolean(productionSpec.revision?.trim()) ||
    Boolean(productionSpec.statusNote?.trim());

  const hasBody =
    targets.length > 0 ||
    Boolean(productionSpec.criticalInstructions?.trim()) ||
    Boolean(productionSpec.rawMaterials?.trim()) ||
    Boolean(productionSpec.componentPreparation?.trim()) ||
    Boolean(productionSpec.blendFormula?.trim()) ||
    Boolean(productionSpec.processSequence?.trim()) ||
    Boolean(productionSpec.shelfLifeControls?.trim()) ||
    Boolean(productionSpec.acceleratedShelfLife?.trim()) ||
    Boolean(productionSpec.shippingNotes?.trim()) ||
    Boolean(productionSpec.qcRecordsRequired?.trim()) ||
    Boolean(productionSpec.samplesRequired?.trim()) ||
    Boolean(productionSpec.futureProcessNotes?.trim());

  if (!hasHeader && !hasBody) return null;

  return (
    <div className={className ?? "space-y-4"}>
      {hasHeader ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {productionSpec.format?.trim() ? (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Product / format
              </div>
              <div className="mt-0.5 text-[13px] font-medium">{productionSpec.format}</div>
            </div>
          ) : null}
          {productionSpec.serveProfile?.trim() ? (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Target profile
              </div>
              <div className="mt-0.5 text-[13px] font-medium">{productionSpec.serveProfile}</div>
            </div>
          ) : null}
          {productionSpec.revision?.trim() ? (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Revision
              </div>
              <div className="mt-0.5 text-[13px] font-medium">{productionSpec.revision}</div>
            </div>
          ) : null}
          {productionSpec.statusNote?.trim() ? (
            <div className="sm:col-span-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Status
              </div>
              <div className="mt-0.5 text-[13px] font-medium">{productionSpec.statusNote}</div>
            </div>
          ) : null}
        </div>
      ) : null}

      {targets.length > 0 ? (
        <div>
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Product targets
          </div>
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full min-w-[320px] text-left text-[12px]">
              <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-semibold">Parameter</th>
                  <th className="px-3 py-2 font-semibold">Target</th>
                  <th className="px-3 py-2 font-semibold">Tolerance</th>
                </tr>
              </thead>
              <tbody>
                {targets.map((row, i) => (
                  <tr key={`${row.parameter}-${i}`} className="border-t border-border/40">
                    <td className="px-3 py-2 font-medium">{row.parameter}</td>
                    <td className="px-3 py-2">{row.target || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.tolerance || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <SpecBlock label="Critical instructions" value={productionSpec.criticalInstructions} />
      <SpecBlock label="Raw materials" value={productionSpec.rawMaterials} />
      <SpecBlock label="Component preparation" value={productionSpec.componentPreparation} />
      <SpecBlock label="Blend formula" value={productionSpec.blendFormula} />
      <SpecBlock label="Process sequence" value={productionSpec.processSequence} />
      <SpecBlock label="Shelf life controls" value={productionSpec.shelfLifeControls} />
      <SpecBlock label="Accelerated shelf life testing" value={productionSpec.acceleratedShelfLife} />
      <SpecBlock label="Shipping" value={productionSpec.shippingNotes} />
      <SpecBlock label="QC records required" value={productionSpec.qcRecordsRequired} />
      <SpecBlock label="Samples required for approval" value={productionSpec.samplesRequired} />
      <SpecBlock label="Process notes for future batches" value={productionSpec.futureProcessNotes} />
    </div>
  );
}

export function hasProductionSpecContent(productionSpec?: NewProductProductionSpec | null): boolean {
  if (!productionSpec) return false;
  const targets = Array.isArray(productionSpec.productTargets)
    ? productionSpec.productTargets.filter((row) => row.parameter?.trim())
    : [];
  return Boolean(
    productionSpec.format?.trim() ||
      productionSpec.serveProfile?.trim() ||
      productionSpec.revision?.trim() ||
      productionSpec.statusNote?.trim() ||
      productionSpec.criticalInstructions?.trim() ||
      targets.length ||
      productionSpec.rawMaterials?.trim() ||
      productionSpec.componentPreparation?.trim() ||
      productionSpec.blendFormula?.trim() ||
      productionSpec.processSequence?.trim() ||
      productionSpec.shelfLifeControls?.trim() ||
      productionSpec.acceleratedShelfLife?.trim() ||
      productionSpec.shippingNotes?.trim() ||
      productionSpec.qcRecordsRequired?.trim() ||
      productionSpec.samplesRequired?.trim() ||
      productionSpec.futureProcessNotes?.trim(),
  );
}
