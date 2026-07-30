import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown } from "lucide-react";
import {
  DistributorFilterBar,
  DistributorFilterButton,
  DistributorPage,
  DistributorPageHeader,
} from "@/components/distributor/DistributorUi";
import {
  BREW_STAGES,
  filterBrewBatches,
  type BrewBatchFilter,
  type BrewBatchRow,
  type BrewStepState,
} from "@/lib/manufacturer-brew-batches";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

function BatchStatusPill({ tone, label }: { tone: BrewBatchRow["statusTone"]; label: string }) {
  const { t } = useLanguage();
  const styles = {
    blue: "border-[hsl(215_72%_50%/0.2)] bg-[hsl(215_72%_50%/0.08)] text-[hsl(215_72%_38%)]",
    green: "border-[hsl(158_56%_36%/0.2)] bg-[hsl(158_56%_36%/0.08)] text-[hsl(158_56%_26%)]",
    amber: "border-[hsl(38_90%_50%/0.25)] bg-[hsl(38_90%_50%/0.1)] text-[hsl(30_80%_30%)]",
  } as const;
  const dots = {
    blue: "bg-[hsl(215_72%_50%)]",
    green: "bg-[hsl(158_56%_36%)]",
    amber: "bg-[hsl(38_90%_50%)]",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
        styles[tone],
      )}
    >
      <span className={cn("size-1.5 rounded-full", dots[tone])} />
      {t(label)}
    </span>
  );
}

function BrewStepTracker({ steps }: { steps: BrewStepState[] }) {
  return (
    <div className="mfg-brew-steps">
      {BREW_STAGES.map((label, j) => {
        const state = steps[j] ?? "";
        return (
          <div key={label} className={cn("mfg-bstep", state)}>
            <div className="mfg-bstep-dot">
              {state === "done" ? <Check className="size-3.5" strokeWidth={2.5} /> : state === "cur" ? "●" : j + 1}
            </div>
            <div className="mfg-bstep-lbl">{label}</div>
          </div>
        );
      })}
    </div>
  );
}

function TankViz({ fillPct }: { fillPct: number }) {
  return (
    <div className="mfg-tank" aria-hidden>
      <div className="mfg-tank-fill" style={{ height: `${Math.min(100, Math.max(8, fillPct))}%` }} />
    </div>
  );
}

export type ManufacturerBrewBatchesViewProps = {
  batches: BrewBatchRow[];
  onLogMeasurement: (batch: BrewBatchRow) => void;
  onAdvanceStage: (batch: BrewBatchRow) => void;
};

export function ManufacturerBrewBatchesView({
  batches,
  onLogMeasurement,
  onAdvanceStage,
}: ManufacturerBrewBatchesViewProps) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<BrewBatchFilter>("all");
  const [openId, setOpenId] = useState<string | null>(batches[0]?.id ?? null);

  const filtered = useMemo(() => filterBrewBatches(batches, filter), [batches, filter]);

  const counts = useMemo(
    () => ({
      all: batches.length,
      fermenting: batches.filter((b) => b.filterCategory === "fermenting").length,
      pressing: batches.filter((b) => b.filterCategory === "pressing").length,
      bottling: batches.filter((b) => b.filterCategory === "bottling").length,
    }),
    [batches],
  );

  return (
    <DistributorPage className="space-y-5">
      <DistributorPageHeader
        title="Brew batches"
        description="Active production runs across the brew floor · tap any batch to see the full process tracker"
        actions={
          <Link to="/manufacturer/purchase-orders" className="dist-btn dist-btn-accent dist-btn-sm no-underline">
            {t("+ Start new batch")}
          </Link>
        }
      />

      <DistributorFilterBar>
        {(
          [
            ["all", t("All tanks ({{n}})", { n: counts.all })],
            ["fermenting", t("Fermenting")],
            ["pressing", t("Pressing")],
            ["bottling", t("Bottling")],
          ] as const
        ).map(([id, label]) => (
          <DistributorFilterButton key={id} active={filter === id} onClick={() => setFilter(id)}>
            {label}
          </DistributorFilterButton>
        ))}
      </DistributorFilterBar>

      {filtered.length === 0 ? (
        <div className="mfg-batch-card px-5 py-12 text-center text-sm text-muted-foreground">
          {t("No active batches in this view")}
          <div className="mt-3">
            <Link to="/manufacturer/purchase-orders" className="dist-btn dist-btn-outline dist-btn-sm no-underline">
              {t("Open production requests")}
            </Link>
          </div>
        </div>
      ) : (
        filtered.map((batch) => {
          const expanded = openId === batch.id;
          const fillPct = ((batch.stageIndex + 1) / BREW_STAGES.length) * 100;
          const currentStage = BREW_STAGES[batch.stageIndex] ?? "—";

          return (
            <div key={batch.id} className="mfg-batch-card">
              <button
                type="button"
                className="mfg-batch-head w-full text-left"
                onClick={() => setOpenId(expanded ? null : batch.id)}
              >
                <TankViz fillPct={fillPct} />
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[11px] text-muted-foreground">
                    {batch.id} · {batch.tank} · {batch.volume}
                  </div>
                  <div className="mt-0.5 font-display text-lg font-medium tracking-[-0.01em]">{batch.sku}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {currentStage} · {batch.day} · {batch.temp}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs text-muted-foreground">{t("Est. complete")}</div>
                  <div className="mt-0.5 text-[13px] font-medium">{batch.expected}</div>
                </div>
                <BatchStatusPill tone={batch.statusTone} label={batch.statusLabel} />
                <ChevronDown
                  className={cn("size-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")}
                  strokeWidth={1.75}
                />
              </button>

              {expanded ? (
                <div className="mfg-batch-detail open">
                  <BrewStepTracker steps={batch.steps} />
                  <div className="mt-4 grid gap-3.5 border-t border-border/50 pt-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: t("Started"), value: batch.started },
                      { label: t("Tank temp"), value: batch.temp },
                      { label: t("Volume"), value: batch.volume },
                      { label: t("Current stage"), value: currentStage },
                    ].map((stat) => (
                      <div key={stat.label}>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                          {stat.label}
                        </div>
                        <div className="mt-1 font-display text-base font-semibold">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="dist-btn dist-btn-ink dist-btn-sm"
                      onClick={() => onLogMeasurement(batch)}
                    >
                      {t("Log measurement")}
                    </button>
                    <Link to="/manufacturer/quality" className="dist-btn dist-btn-outline dist-btn-sm no-underline">
                      {t("QC sample")}
                    </Link>
                    <button
                      type="button"
                      className="dist-btn dist-btn-outline dist-btn-sm"
                      onClick={() => onAdvanceStage(batch)}
                    >
                      {t("Advance stage")}
                    </button>
                    <Link
                      to={`/manufacturer/purchase-orders?po=${encodeURIComponent(batch.poId)}`}
                      className="dist-btn dist-btn-outline dist-btn-sm no-underline"
                    >
                      {t("View PO")}
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </DistributorPage>
  );
}
