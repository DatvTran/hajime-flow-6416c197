import type { NewProductRequest } from "@/data/mockData";
import { formatBaseSpiritLabel } from "@/lib/base-spirit-options";
import { nprConceptBrief, nprConceptSummary } from "@/lib/hq-product-development-display";

function BriefCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-[13px] font-medium text-foreground">{value}</div>
    </div>
  );
}

type Props = {
  request: NewProductRequest;
  title?: string;
};

/** Product brief panel — mirrors HQ Product Development / detail brief fields. */
export function NprProductBriefPanel({ request, title = "Product brief from Hajime HQ" }: Props) {
  const conceptBrief = nprConceptBrief(request);

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <div>
        <h4 className="font-display text-sm font-medium">{title}</h4>
        <p className="mt-0.5 text-xs text-muted-foreground">{nprConceptSummary(request)}</p>
      </div>
      {conceptBrief !== "—" ? (
        <p className="text-[13px] leading-relaxed text-foreground">{conceptBrief}</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <BriefCell label="Base spirit" value={formatBaseSpiritLabel(request.specs.baseSpirit)} />
        <BriefCell label="Target ABV" value={`${request.specs.targetAbv}%`} />
        <BriefCell
          label="Flavor profile"
          value={request.specs.flavorProfile.join(", ") || "—"}
        />
        <BriefCell
          label="Sweetener"
          value={request.specs.sweetener?.replace(/_/g, " ") ?? "—"}
        />
        <BriefCell
          label="Price point"
          value={request.specs.targetPricePoint.replace(/_/g, " ")}
        />
        <BriefCell label="Target launch" value={request.specs.targetLaunchDate} />
        <div className="sm:col-span-2">
          <BriefCell
            label="Regulatory markets"
            value={request.specs.regulatoryMarkets.join(", ") || "—"}
          />
        </div>
        <div className="sm:col-span-2">
          <BriefCell
            label="Packaging"
            value={`${request.specs.packaging.bottleSize} · ${request.specs.packaging.caseConfiguration}-bottle case · ${request.specs.packaging.labelStyle || "—"}`}
          />
        </div>
        <BriefCell
          label="Minimum order"
          value={`${request.specs.minimumOrderQuantity.toLocaleString()} bottles`}
        />
        {request.notes ? (
          <div className="sm:col-span-2">
            <BriefCell label="Notes" value={request.notes} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
