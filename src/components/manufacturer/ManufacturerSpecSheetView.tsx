import { ArrowLeft, Beaker, Calendar, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DistributorCard,
  DistributorCardHead,
  DistributorPage,
  DistributorPageHeader,
} from "@/components/distributor/DistributorUi";
import type { SpecSheetModel, SpecSheetTone } from "@/lib/manufacturer-spec-sheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const toneStyles: Record<SpecSheetTone, string> = {
  red: "border-[hsl(0_68%_48%/0.2)] bg-[hsl(0_68%_48%/0.08)] text-[hsl(0_68%_38%)]",
  amber: "border-[hsl(38_90%_50%/0.25)] bg-[hsl(38_90%_50%/0.1)] text-[hsl(30_80%_30%)]",
  neutral: "border-border bg-muted text-muted-foreground",
  green: "border-[hsl(158_56%_36%/0.2)] bg-[hsl(158_56%_36%/0.08)] text-[hsl(158_56%_26%)]",
  blue: "border-[hsl(215_72%_50%/0.2)] bg-[hsl(215_72%_50%/0.08)] text-[hsl(215_72%_38%)]",
};

const toneDots: Record<SpecSheetTone, string> = {
  red: "bg-[hsl(0_68%_48%)]",
  amber: "bg-[hsl(38_90%_50%)]",
  neutral: "bg-muted-foreground",
  green: "bg-[hsl(158_56%_36%)]",
  blue: "bg-[hsl(215_72%_50%)]",
};

function StatusPill({ tone, label }: { tone: SpecSheetTone; label: string }) {
  const { t } = useLanguage();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
        toneStyles[tone],
      )}
    >
      <span className={cn("size-1.5 rounded-full", toneDots[tone])} />
      {t(label)}
    </span>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  const { t } = useLanguage();
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{t(label)}</div>
      <div className="mt-0.5 font-display text-base font-semibold">{value}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const { t } = useLanguage();
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/40 py-2.5 last:border-b-0">
      <span className="text-[13px] text-muted-foreground">{t(label)}</span>
      <span className="text-right text-[13px] font-medium">{value}</span>
    </div>
  );
}

export type ManufacturerSpecSheetViewProps = {
  model: SpecSheetModel;
  onAcceptSchedule: () => void;
  onRequestChange: () => void;
};

export function ManufacturerSpecSheetView({
  model,
  onAcceptSchedule,
  onRequestChange,
}: ManufacturerSpecSheetViewProps) {
  const { t } = useLanguage();

  return (
    <DistributorPage className="space-y-5">
      <Link
        to="/manufacturer/purchase-orders"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground no-underline transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} />
        {t("Back to production requests")}
      </Link>

      <DistributorPageHeader
        title="Production spec sheet"
        description={`${model.id} · ${model.cases} cases · ${model.bottles.toLocaleString()} bottles`}
        rawDescription
        actions={
          <>
            <button type="button" className="dist-btn dist-btn-outline dist-btn-sm" onClick={onRequestChange}>
              {t("Request change")}
            </button>
            <button type="button" className="dist-btn dist-btn-accent dist-btn-sm" onClick={onAcceptSchedule}>
              {t("Accept & schedule batch")}
            </button>
          </>
        }
      />

      <DistributorCard className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="font-mono text-[11px] text-muted-foreground">{model.sku}</div>
            <div className="mt-0.5 font-display text-xl font-semibold tracking-[-0.01em]">{model.productName}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {t("Requested")} {model.received} · {t("HQ target")} {model.due}
            </div>
          </div>
          <StatusPill tone={model.tone} label={model.statusLabel} />
        </div>
      </DistributorCard>

      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Beaker className="size-4 text-accent" strokeWidth={1.75} />
          {t("Production estimate")}
        </div>
        <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          {model.production.map((stat) => (
            <StatTile key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </div>
      </div>

      <div className="grid gap-[18px] lg:grid-cols-2">
        <DistributorCard className="overflow-hidden p-0">
          <div className="px-5 pt-5">
            <DistributorCardHead title="Product & packaging" />
          </div>
          <div className="px-5 pb-4">
            <DetailRow label="SKU" value={model.sku} />
            <DetailRow label="Bottle size" value={model.size} />
            <DetailRow label="ABV" value={model.abv} />
            <DetailRow label="Case size" value={model.caseSize} />
            <DetailRow label="Packaging" value={model.packagingInstructions} />
            <DetailRow label="Label version" value={model.labelVersion} />
          </div>
        </DistributorCard>

        <DistributorCard className="overflow-hidden p-0">
          <div className="px-5 pt-5">
            <DistributorCardHead title="Schedule & destination" />
          </div>
          <div className="px-5 pb-4">
            <DetailRow label="Market destination" value={model.marketDestination} />
            <DetailRow label="Request received" value={model.received} />
            <DetailRow label="HQ target date" value={model.due} />
            <DetailRow label="Requested ship date" value={model.requestedShip} />
            <DetailRow label="Quantity" value={`${model.cases} cases · ${model.bottles.toLocaleString()} bottles`} />
          </div>
        </DistributorCard>
      </div>

      <DistributorCard className="p-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <FileText className="size-4 text-accent" strokeWidth={1.75} />
          {t("HQ notes")}
        </div>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {model.hqNotes || t("No additional notes from Hajime HQ for this request.")}
        </p>
      </DistributorCard>

      <DistributorCard className="overflow-hidden p-0">
        <div className="px-5 pt-5">
          <DistributorCardHead title="Production status log" subtitle="Updates recorded on the brew floor" />
        </div>
        <div className="px-5 pb-5">
          {model.timeline.length === 0 ? (
            <div className="flex items-center gap-2 py-4 text-[13px] text-muted-foreground">
              <Calendar className="size-4" strokeWidth={1.75} />
              {t("No production updates logged yet — accept the request to start the batch.")}
            </div>
          ) : (
            <ol className="relative ml-2 border-l border-border/60">
              {model.timeline.map((entry, index) => (
                <li key={`${entry.date}-${index}`} className="ml-4 py-2.5">
                  <span
                    className={cn(
                      "absolute -left-[5px] mt-1 size-2.5 rounded-full border-2 border-background",
                      index === 0 ? "bg-accent" : "bg-border",
                    )}
                  />
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <span className="text-[13px] font-semibold">{entry.stage}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{entry.date}</span>
                  </div>
                  {entry.notes ? (
                    <p className="mt-0.5 text-[13px] text-muted-foreground">{entry.notes}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </div>
      </DistributorCard>
    </DistributorPage>
  );
}
