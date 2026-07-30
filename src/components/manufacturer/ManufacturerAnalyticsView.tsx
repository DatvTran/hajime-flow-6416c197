import { BarChart3 } from "lucide-react";
import {
  DistributorCard,
  DistributorCardHead,
  DistributorDataTable,
  DistributorKpiCard,
  DistributorKpiGrid,
  DistributorPage,
  DistributorPageHeader,
} from "@/components/distributor/DistributorUi";
import type {
  AnalyticsSummary,
  MonthlyProductionPoint,
  MonthlyTrendPoint,
  SkuProductionRow,
} from "@/lib/manufacturer-analytics";
import { maxProductionCases, yieldTextClass } from "@/lib/manufacturer-analytics";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

function ProductionBarChart({ points }: { points: MonthlyProductionPoint[] }) {
  const max = maxProductionCases(points);
  return (
    <div className="mfg-bar-chart">
      {points.map((point) => {
        const height = Math.max(8, (point.cases / max) * 110);
        return (
          <div key={point.month} className="mfg-bar-col">
            <div className="font-mono text-[9px] font-semibold text-foreground">{point.cases}</div>
            <div
              className={cn("mfg-bar-fill", point.partial && "partial")}
              style={{ height }}
            />
            <div className="font-mono text-[9px] text-muted-foreground">{point.month}</div>
          </div>
        );
      })}
    </div>
  );
}

function QualityYieldTrend({ points }: { points: MonthlyTrendPoint[] }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-2">
      {points.map((point) => (
        <div key={point.month} className="mfg-trend-row">
          <div className="w-7 font-mono text-[10px] text-muted-foreground">{point.month}</div>
          <div className="mfg-trend-track">
            <div className="mfg-trend-fill-quality" style={{ width: `${point.quality}%` }} />
          </div>
          <div className="w-9 text-right font-mono text-[10px] text-[hsl(158_56%_32%)]">{point.quality}%</div>
          <div className="mfg-trend-track">
            <div className="mfg-trend-fill-yield" style={{ width: `${point.yield}%` }} />
          </div>
          <div className="w-9 text-right font-mono text-[10px] text-[hsl(38_90%_40%)]">{point.yield}%</div>
        </div>
      ))}
      <div className="mt-2 flex gap-4 text-[11px]">
        <div className="flex items-center gap-1.5">
          <div className="h-1 w-3 rounded-full bg-[hsl(158_56%_36%)]" />
          {t("Quality")}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1 w-3 rounded-full bg-[hsl(38_90%_50%)]" />
          {t("Yield")}
        </div>
      </div>
    </div>
  );
}

export type ManufacturerAnalyticsViewProps = {
  summary: AnalyticsSummary;
  production: MonthlyProductionPoint[];
  trends: MonthlyTrendPoint[];
  skuRows: SkuProductionRow[];
  orgLabel: string;
  onExportPdf: () => void;
};

export function ManufacturerAnalyticsView({
  summary,
  production,
  trends,
  skuRows,
  orgLabel,
  onExportPdf,
}: ManufacturerAnalyticsViewProps) {
  const { t } = useLanguage();

  return (
    <DistributorPage className="space-y-5">
      <DistributorPageHeader
        title="Analytics & reports"
        description={`Production metrics · ${orgLabel} · 7-month view`}
        rawDescription
        actions={
          <button type="button" className="dist-btn dist-btn-outline dist-btn-sm" onClick={onExportPdf}>
            {t("Export PDF")}
          </button>
        }
      />

      <DistributorKpiGrid>
        <DistributorKpiCard
          icon={BarChart3}
          tone="gold"
          label="Cases produced Q2"
          value={summary.casesProducedQ2}
          sub={summary.casesProducedSub}
          rawSub
        />
        <DistributorKpiCard
          icon={BarChart3}
          tone="green"
          label="Quality pass rate"
          value={summary.qualityPassRate}
          sub={summary.qualitySub}
        />
        <DistributorKpiCard
          icon={BarChart3}
          tone="blue"
          label="Yield efficiency"
          value={summary.yieldEfficiency}
          sub={summary.yieldSub}
        />
        <DistributorKpiCard
          icon={BarChart3}
          tone="ink"
          label="Production premium"
          value={summary.productionPremium}
          sub={summary.premiumSub}
          rawSub
        />
      </DistributorKpiGrid>

      <div className="mb-5 grid gap-[18px] lg:grid-cols-2">
        <div className="dist-card p-5">
          <div className="text-sm font-semibold">{t("Cases produced · monthly")}</div>
          <div className="mb-5 mt-1 text-xs text-muted-foreground">{t("7-month trend")}</div>
          <ProductionBarChart points={production} />
        </div>
        <div className="dist-card p-5">
          <div className="text-sm font-semibold">{t("Quality & yield · trend")}</div>
          <div className="mb-5 mt-1 text-xs text-muted-foreground">{t("7-month progression")}</div>
          <QualityYieldTrend points={trends} />
        </div>
      </div>

      <DistributorCard>
        <DistributorCardHead title="Production by SKU · Q2 to date" />
        <DistributorDataTable>
          <thead>
            <tr>
              <th>{t("SKU")}</th>
              <th>{t("Cases produced")}</th>
              <th>{t("Quality grade")}</th>
              <th>{t("Yield")}</th>
              <th>{t("Premium earned")}</th>
            </tr>
          </thead>
          <tbody>
            {skuRows.map((row) => (
              <tr key={row.name}>
                <td className="font-medium">{row.name}</td>
                <td className="font-mono font-medium">{row.cases.toLocaleString()} cs</td>
                <td className="font-mono font-semibold text-[hsl(158_56%_32%)]">{row.grade}</td>
                <td className={cn("font-mono font-medium", yieldTextClass(row.yield))}>{row.yield}</td>
                <td className="font-mono font-medium text-accent">{row.premium}</td>
              </tr>
            ))}
          </tbody>
        </DistributorDataTable>
      </DistributorCard>
    </DistributorPage>
  );
}
