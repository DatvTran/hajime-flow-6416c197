import { AlertTriangle, Box, FlaskConical, Shield, Star, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DistributorAlertBar,
  DistributorCard,
  DistributorCardHead,
  DistributorDataTable,
  DistributorKpiCard,
  DistributorKpiGrid,
  DistributorPage,
  DistributorPageHeader,
  DistributorSectionHead,
} from "@/components/distributor/DistributorUi";
import { BREW_STAGES, type BrewBatchRow } from "@/lib/manufacturer-brew-batches";
import type { DashboardRequestRow, DashboardRequestTone } from "@/lib/manufacturer-dashboard";
import type { ManufacturerShipmentRow } from "@/lib/manufacturer-shipments";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const requestToneClasses: Record<DashboardRequestTone, string> = {
  red: "border-[hsl(0_68%_48%/0.2)] bg-[hsl(0_68%_48%/0.08)] text-[hsl(0_68%_38%)]",
  amber: "border-[hsl(38_90%_50%/0.25)] bg-[hsl(38_90%_50%/0.1)] text-[hsl(30_80%_30%)]",
  neutral: "border-border bg-muted text-muted-foreground",
};

const requestDotClasses: Record<DashboardRequestTone, string> = {
  red: "bg-[hsl(0_68%_48%)]",
  amber: "bg-[hsl(38_90%_50%)]",
  neutral: "bg-muted-foreground",
};

const requestDueClasses: Record<DashboardRequestTone, string> = {
  red: "text-[hsl(0_68%_40%)]",
  amber: "text-[hsl(30_80%_32%)]",
  neutral: "text-muted-foreground",
};

function Pill({ tone, label }: { tone: DashboardRequestTone | "blue" | "green"; label: string }) {
  const { t } = useLanguage();
  const styles: Record<string, string> = {
    ...requestToneClasses,
    blue: "border-[hsl(215_72%_50%/0.2)] bg-[hsl(215_72%_50%/0.08)] text-[hsl(215_72%_38%)]",
    green: "border-[hsl(158_56%_36%/0.2)] bg-[hsl(158_56%_36%/0.08)] text-[hsl(158_56%_26%)]",
  };
  const dots: Record<string, string> = {
    ...requestDotClasses,
    blue: "bg-[hsl(215_72%_50%)]",
    green: "bg-[hsl(158_56%_36%)]",
  };
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

function TankViz({ fillPct }: { fillPct: number }) {
  return (
    <div className="mfg-tank h-9 w-6 shrink-0" aria-hidden>
      <div className="mfg-tank-fill" style={{ height: `${Math.min(100, Math.max(8, fillPct))}%` }} />
    </div>
  );
}

export type ManufacturerDashboardViewProps = {
  greeting: string;
  summaryLine: string;
  shortageLabel?: string;
  shortageDetail?: string;
  activeBatches: number;
  casesProducedQ2: string;
  casesDelta: string;
  qualityPassRate: string;
  qualitySub: string;
  productionPremium: string;
  premiumSub: string;
  requests: DashboardRequestRow[];
  batches: BrewBatchRow[];
  shipments: ManufacturerShipmentRow[];
  onReorder: () => void;
};

export function ManufacturerDashboardView({
  greeting,
  summaryLine,
  shortageLabel,
  shortageDetail,
  activeBatches,
  casesProducedQ2,
  casesDelta,
  qualityPassRate,
  qualitySub,
  productionPremium,
  premiumSub,
  requests,
  batches,
  shipments,
  onReorder,
}: ManufacturerDashboardViewProps) {
  const { t } = useLanguage();

  return (
    <DistributorPage className="space-y-5">
      <DistributorPageHeader
        title={greeting}
        rawTitle
        description={summaryLine}
        rawDescription
        actions={
          <>
            <Link to="/manufacturer/analytics" className="dist-btn dist-btn-outline no-underline">
              {t("Production report")}
            </Link>
            <Link to="/manufacturer/materials" className="dist-btn dist-btn-ink no-underline">
              {t("Materials check")}
            </Link>
          </>
        }
      />

      {shortageLabel ? (
        <DistributorAlertBar
          variant="error"
          actions={
            <Link to="/manufacturer/materials" className="dist-btn dist-btn-accent dist-btn-sm no-underline" onClick={onReorder}>
              {t("Reorder")}
            </Link>
          }
        >
          <AlertTriangle className="mb-1 inline size-4 text-[hsl(0_68%_44%)]" strokeWidth={1.75} />{" "}
          <strong className="text-[hsl(0_68%_36%)]">{shortageLabel}</strong>{" "}
          <span className="text-[hsl(30_70%_35%)]">{shortageDetail}</span>
        </DistributorAlertBar>
      ) : null}

      <DistributorKpiGrid>
        <DistributorKpiCard
          icon={FlaskConical}
          tone="gold"
          label="Active batches"
          value={String(activeBatches)}
          sub="across the brew floor"
        />
        <DistributorKpiCard
          icon={Box}
          tone="green"
          label="Cases produced Q2"
          value={casesProducedQ2}
          delta={
            <span className="inline-flex items-center gap-1 text-[hsl(158_56%_32%)]">
              <TrendingUp className="size-3" strokeWidth={2} /> {casesDelta}
            </span>
          }
        />
        <DistributorKpiCard
          icon={Shield}
          tone="blue"
          label="Quality pass rate"
          value={qualityPassRate}
          sub={qualitySub}
        />
        <DistributorKpiCard
          icon={Star}
          tone="ink"
          label="Production premium Q2"
          value={productionPremium}
          sub={premiumSub}
          rawSub
        />
      </DistributorKpiGrid>

      <div className="grid gap-[18px] lg:grid-cols-2">
        <DistributorCard className="overflow-hidden p-0">
          <div className="px-5 pt-5">
            <DistributorCardHead
              title="Production requests from HQ"
              subtitle="Awaiting scheduling"
              actions={
                <Link to="/manufacturer/purchase-orders" className="dist-btn dist-btn-outline dist-btn-sm no-underline">
                  {t("All requests")}
                </Link>
              }
            />
          </div>
          <div>
            {requests.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">{t("No open production requests")}</p>
            ) : (
              requests.map((r) => (
                <Link
                  key={r.id}
                  to="/manufacturer/purchase-orders"
                  className="flex items-center gap-3.5 border-b border-border/40 px-5 py-3 no-underline transition-colors last:border-b-0 hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[11px] text-muted-foreground">{r.id}</div>
                    <div className="mt-px text-[13px] font-medium text-foreground">
                      {r.cases} {t("cs")} · {r.sku}
                    </div>
                    <div className="mt-px text-[11px] text-muted-foreground">{r.polish}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={cn("text-xs font-semibold", requestDueClasses[r.tone])}>{r.due}</div>
                    <div className="mt-1 flex justify-end">
                      <Pill tone={r.tone} label={r.statusLabel} />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </DistributorCard>

        <DistributorCard className="overflow-hidden p-0">
          <div className="px-5 pt-5">
            <DistributorCardHead
              title="Brew floor — live"
              subtitle={`${batches.length} active tanks`}
              rawSubtitle
              actions={
                <Link to="/manufacturer/brew-batches" className="dist-btn dist-btn-outline dist-btn-sm no-underline">
                  {t("All batches")}
                </Link>
              }
            />
          </div>
          <div>
            {batches.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">{t("No active batches on the brew floor")}</p>
            ) : (
              batches.map((b) => (
                <Link
                  key={b.id}
                  to="/manufacturer/brew-batches"
                  className="flex items-center gap-3 border-b border-border/40 px-5 py-3 no-underline transition-colors last:border-b-0 hover:bg-muted/40"
                >
                  <TankViz fillPct={((b.stageIndex + 1) / BREW_STAGES.length) * 100} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-foreground">
                      {b.id} · {b.sku.split(" ").slice(0, 2).join(" ")}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {b.tank} · {t(BREW_STAGES[b.stageIndex])} · {b.day}
                    </div>
                  </div>
                  <Pill tone={b.statusTone} label={b.statusLabel} />
                </Link>
              ))
            )}
          </div>
        </DistributorCard>
      </div>

      <DistributorSectionHead title="Shipments to HQ" linkLabel="All shipments →" linkTo="/manufacturer/shipments" />
      <DistributorCard>
        <DistributorDataTable>
          <thead>
            <tr>
              <th>{t("Shipment")}</th>
              <th>{t("Destination")}</th>
              <th>{t("Contents")}</th>
              <th>{t("ETA")}</th>
              <th>{t("Status")}</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((s) => (
              <tr key={s.id}>
                <td className="font-mono text-xs">{s.id}</td>
                <td className="font-medium">{s.destination}</td>
                <td className="text-xs text-muted-foreground">{s.items}</td>
                <td className="text-xs">{s.eta}</td>
                <td>
                  <Pill tone={s.statusTone} label={s.statusLabel} />
                </td>
              </tr>
            ))}
          </tbody>
        </DistributorDataTable>
      </DistributorCard>
    </DistributorPage>
  );
}
