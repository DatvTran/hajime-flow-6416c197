import { Award, Check, FlaskConical, Shield } from "lucide-react";
import {
  DistributorCard,
  DistributorCardHead,
  DistributorKpiCard,
  DistributorKpiGrid,
  DistributorPage,
  DistributorPageHeader,
  DistributorSectionHead,
} from "@/components/distributor/DistributorUi";
import type { QcBatchRow, QcSpecRow, QcSummary } from "@/lib/manufacturer-quality-control";
import { useLanguage } from "@/contexts/LanguageContext";

function PassedPill() {
  const { t } = useLanguage();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(158_56%_36%/0.2)] bg-[hsl(158_56%_36%/0.08)] px-2.5 py-0.5 text-[11px] font-medium text-[hsl(158_56%_26%)] whitespace-nowrap">
      <span className="size-1.5 rounded-full bg-[hsl(158_56%_36%)]" />
      {t("passed")}
    </span>
  );
}

function QcSpecRowView({ spec }: { spec: QcSpecRow }) {
  return (
    <div className="mfg-qc-spec">
      <div className="mfg-qc-spec-label">{spec.label}</div>
      <div className="mfg-qc-spec-bar">
        <div className="mfg-qc-spec-target" style={{ left: `${spec.target}%` }} />
        <div className="mfg-qc-spec-fill" style={{ width: `${spec.pct}%` }} />
      </div>
      <div className="mfg-qc-spec-val">{spec.value}</div>
    </div>
  );
}

function QcBatchCard({ batch }: { batch: QcBatchRow }) {
  const { t } = useLanguage();
  return (
    <DistributorCard className="mb-3.5">
      <DistributorCardHead
        title={`${batch.id} · ${batch.sku}`}
        rawTitle
        subtitle={`Tested ${batch.testedDate} · graded by lab`}
        rawSubtitle
        actions={
          <div className="flex items-center gap-2.5">
            <span className="font-display text-[22px] font-semibold text-[hsl(158_56%_32%)]">{batch.score}</span>
            <PassedPill />
          </div>
        }
      />
      <div className="px-5 pb-4 pt-1">
        {batch.specs.map((spec) => (
          <QcSpecRowView key={spec.label} spec={spec} />
        ))}
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="inline-block h-3 w-0.5 bg-[hsl(24_10%_10%/.3)]" />
          {t("Vertical marker = HQ target spec · fill = measured value")}
        </div>
      </div>
    </DistributorCard>
  );
}

export type ManufacturerQualityControlViewProps = {
  summary: QcSummary;
  batches: QcBatchRow[];
  onLogSample: () => void;
  onOpenFullLog: () => void;
};

export function ManufacturerQualityControlView({
  summary,
  batches,
  onLogSample,
  onOpenFullLog,
}: ManufacturerQualityControlViewProps) {
  const { t } = useLanguage();

  return (
    <DistributorPage className="space-y-5">
      <DistributorPageHeader
        title="Quality control"
        description="Lab analysis per batch · results feed directly into your manufacturer partner quality score"
        actions={
          <button type="button" className="dist-btn dist-btn-accent dist-btn-sm" onClick={onLogSample}>
            {t("+ Log QC sample")}
          </button>
        }
      />

      <DistributorKpiGrid>
        <DistributorKpiCard
          icon={Shield}
          tone="green"
          label="Quality pass rate"
          value={summary.passRate}
          sub="rolling 90 days"
        />
        <DistributorKpiCard
          icon={Check}
          tone="blue"
          label="Batches tested Q2"
          value={String(summary.batchesTested)}
          sub={`${summary.batchesPassed} passed · ${summary.batchesReblend} reblend`}
          rawSub
        />
        <DistributorKpiCard
          icon={Award}
          tone="gold"
          label="A+ grade batches"
          value={String(summary.aPlusBatches)}
          sub={`${summary.aPlusPct} of all batches`}
          rawSub
        />
        <DistributorKpiCard
          icon={FlaskConical}
          tone="ink"
          label="Avg polish ratio"
          value={summary.avgPolishRatio}
          sub="across all SKUs"
        />
      </DistributorKpiGrid>

      <DistributorSectionHead title="Recent batch analysis" linkLabel="Full QC log →" onLinkClick={onOpenFullLog} />

      <div>
        {batches.map((batch) => (
          <QcBatchCard key={batch.id} batch={batch} />
        ))}
      </div>
    </DistributorPage>
  );
}
