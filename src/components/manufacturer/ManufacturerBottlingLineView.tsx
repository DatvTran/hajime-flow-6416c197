import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import {
  DistributorCard,
  DistributorCardHead,
  DistributorPage,
  DistributorPageHeader,
} from "@/components/distributor/DistributorUi";
import type {
  ActiveBottlingRun,
  BottlingCheckStep,
  BottlingLineModel,
  BottlingLineStatus,
  PackagingStockRow,
} from "@/lib/manufacturer-bottling-line";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

function StatusPill({ tone, label }: { tone: BottlingLineStatus["tone"] | "neutral"; label: string }) {
  const styles = {
    amber: "border-[hsl(38_90%_50%/0.25)] bg-[hsl(38_90%_50%/0.1)] text-[hsl(30_80%_30%)]",
    green: "border-[hsl(158_56%_36%/0.2)] bg-[hsl(158_56%_36%/0.08)] text-[hsl(158_56%_26%)]",
    neutral: "border-border bg-muted text-muted-foreground",
  } as const;
  const dots = {
    amber: "bg-[hsl(38_90%_50%)]",
    green: "bg-[hsl(158_56%_36%)]",
    neutral: "bg-muted-foreground",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
        styles[tone],
      )}
    >
      <span className={cn("size-1.5 rounded-full", dots[tone])} />
      {label}
    </span>
  );
}

function ChecklistRow({
  step,
  onToggle,
}: {
  step: BottlingCheckStep;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="mfg-check-item">
      <button
        type="button"
        className={cn("mfg-checkbox", step.done && "checked")}
        onClick={() => onToggle(step.id)}
        aria-label={step.label}
      >
        {step.done ? <Check className="size-3" strokeWidth={2.5} /> : null}
      </button>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium">{step.label}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{step.detail}</div>
      </div>
    </div>
  );
}

function PackagingRow({ row }: { row: PackagingStockRow }) {
  const fillClass =
    row.tone === "low" ? "mfg-avail-low" : row.tone === "med" ? "mfg-avail-med" : "mfg-avail-ok";
  const textColor =
    row.tone === "low"
      ? "text-[hsl(0_68%_44%)]"
      : row.tone === "med"
        ? "text-[hsl(38_90%_40%)]"
        : "text-[hsl(158_56%_32%)]";
  return (
    <div className="border-b border-border/30 py-2 last:border-b-0">
      <div className="mb-1 flex justify-between text-xs">
        <span>{row.name}</span>
        <span className={cn("font-mono font-semibold", textColor)}>{row.onHand}</span>
      </div>
      <div className="mfg-avail-bar">
        <div className={cn("mfg-avail-fill", fillClass)} style={{ width: `${row.pct}%` }} />
      </div>
    </div>
  );
}

export type ManufacturerBottlingLineViewProps = {
  model: BottlingLineModel;
  steps: BottlingCheckStep[];
  onToggleStep: (id: string) => void;
  onMarkComplete: () => void;
  onScheduleRun: () => void;
  onPrepRun: (batchId: string) => void;
};

export function ManufacturerBottlingLineView({
  model,
  steps,
  onToggleStep,
  onMarkComplete,
  onScheduleRun,
  onPrepRun,
}: ManufacturerBottlingLineViewProps) {
  const { t } = useLanguage();
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <DistributorPage className="space-y-5">
      <DistributorPageHeader
        title="Bottling line"
        description="Bottling & packaging schedule · 2 lines · checklist tracks each run to completion"
        actions={
          <button type="button" className="dist-btn dist-btn-accent dist-btn-sm" onClick={onScheduleRun}>
            {t("+ Schedule run")}
          </button>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
        <div>
          {model.activeRun ? (
            <DistributorCard className="mb-5">
              <DistributorCardHead
                title={`Active run — ${model.activeRun.sku}`}
                subtitle={`Batch ${model.activeRun.batchId} · ${model.activeRun.line} · ${model.activeRun.cases} cases`}
                actions={<StatusPill tone="amber" label={t("in progress")} />}
              />
              <div className="px-5">
                {steps.map((step) => (
                  <ChecklistRow key={step.id} step={step} onToggle={onToggleStep} />
                ))}
              </div>
              <div className="flex flex-col gap-3 border-t border-border/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-[13px] text-muted-foreground">
                  {t("{{done}} of {{total}} steps complete", { done: doneCount, total: steps.length })}
                </div>
                <button
                  type="button"
                  className="dist-btn dist-btn-green dist-btn-sm"
                  onClick={onMarkComplete}
                  disabled={doneCount < steps.length}
                >
                  {t("Mark run complete →")}
                </button>
              </div>
            </DistributorCard>
          ) : (
            <DistributorCard className="mb-5 px-5 py-10 text-center text-sm text-muted-foreground">
              {t("No active bottling run — schedule a run from production requests.")}
            </DistributorCard>
          )}

          <h2 className="mb-3.5 font-display text-[19px] font-medium tracking-[-0.01em]">{t("Upcoming runs")}</h2>
          <div className="dist-delivery-schedule">
            {model.upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("No upcoming bottling runs scheduled")}</p>
            ) : (
              model.upcoming.map((day) => (
                <div key={day.dayLabel} className="schedule-day mb-6">
                  <div className="sched-day-label">{day.dayLabel}</div>
                  {day.runs.map((run) => (
                    <div key={`${day.dayLabel}-${run.batchId}`} className="sched-row">
                      <div className="sched-time">{run.time}</div>
                      <div className="sched-body">
                        <div className="sched-acct">{run.sku}</div>
                        <div className="sched-items">
                          {run.batchId} · {run.cases} {t("cases")} · {run.line}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="dist-btn dist-btn-outline dist-btn-sm"
                        onClick={() => onPrepRun(run.batchId)}
                      >
                        {t("Prep")}
                      </button>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="dist-card p-[18px]">
            <div className="mb-3.5 text-sm font-semibold">{t("Line status")}</div>
            {model.lineStatus.map((line) => (
              <div
                key={line.label}
                className="flex items-center justify-between border-b border-border/30 py-2.5 last:border-b-0"
              >
                <div className="text-[13px] font-medium">{line.label}</div>
                <StatusPill tone={line.tone} label={line.status} />
              </div>
            ))}
          </div>
          <div className="dist-card p-[18px]">
            <div className="mb-3 text-sm font-semibold">{t("Packaging stock")}</div>
            {model.packagingStock.map((row) => (
              <PackagingRow key={row.name} row={row} />
            ))}
          </div>
        </div>
      </div>
    </DistributorPage>
  );
}
