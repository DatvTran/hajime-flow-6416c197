import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Award, Box, FlaskConical, Plus } from "lucide-react";
import type { Account, PurchaseOrder } from "@/data/mockData";
import { useLanguage } from "@/contexts/LanguageContext";
import { getManufacturerProfiles } from "@/lib/api-v1-mutations";
import { mapApiRowToProfile } from "@/lib/manufacturer-profile-map";
import type { ManufacturerProfile } from "@/types/app-data";
import {
  buildHqManufacturerListRows,
  computeHqManufacturersKpi,
  manufacturerPartnerPath,
} from "@/lib/hq-manufacturers-metrics";
import {
  HqBtn,
  HqBtnLink,
  HqOperatorCard,
  HqOperatorKpiCard,
  HqOperatorKpiGrid,
  HqOperatorPage,
  HqOperatorPageHeader,
  HqOperatorPill,
} from "@/components/hq/HqOperatorUi";
import { cn } from "@/lib/utils";

type Props = {
  accounts: Account[];
  purchaseOrders: PurchaseOrder[];
  onAddManufacturer: () => void;
};

export function HqManufacturersView({ accounts, purchaseOrders, onAddManufacturer }: Props) {
  const { t } = useLanguage();
  const [profiles, setProfiles] = useState<ManufacturerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await getManufacturerProfiles()) as { data?: Record<string, unknown>[] };
      const rows = Array.isArray(res.data) ? res.data : [];
      setProfiles(rows.map((r) => mapApiRowToProfile(r)));
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const { rows, useDesignDemo } = useMemo(
    () => buildHqManufacturerListRows(accounts, purchaseOrders, profiles),
    [accounts, purchaseOrders, profiles],
  );

  const kpi = useMemo(
    () => computeHqManufacturersKpi(purchaseOrders, rows.length, useDesignDemo),
    [purchaseOrders, rows.length, useDesignDemo],
  );

  return (
    <HqOperatorPage className="space-y-6">
      <HqOperatorPageHeader
        title="Manufacturers"
        description="Kura partners producing Hajime SKUs · send production requests and track batches"
        actions={
            <HqBtnLink to="/purchase-orders/new" variant="accent" size="sm">
              <Plus className="size-3.5" strokeWidth={1.75} /> {t("New production request")}
            </HqBtnLink>
        }
      />

      <HqOperatorKpiGrid>
        <HqOperatorKpiCard
          icon={FlaskConical}
          tone="gold"
          label="Active batches"
          value={String(kpi.activeBatches)}
          sub={`${t("across")} ${kpi.kuraCount} ${t("kura")}`}
        />
        <HqOperatorKpiCard
          icon={Box}
          tone="green"
          label="Cases in production"
          value={kpi.casesInProduction.toLocaleString()}
          sub={t("est. 28-day completion")}
        />
        <HqOperatorKpiCard
          icon={Award}
          tone="blue"
          label="Avg quality grade"
          value={kpi.qualityGrade}
          sub={t("98.0% network pass rate")}
        />
        <HqOperatorKpiCard
          icon={AlertCircle}
          tone="red"
          label="Open requests"
          value={String(kpi.openRequests)}
          sub={t("awaiting kura scheduling")}
        />
      </HqOperatorKpiGrid>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("Loading manufacturers…")}</p>
      ) : (
        rows.map((row) => (
          <HqOperatorCard key={row.id} className="hq-mfr-card overflow-hidden">
            <div className="hq-mfr-row flex-wrap">
              <div className="hq-mfr-icon">
                <FlaskConical className="size-[22px]" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-lg font-semibold tracking-[-0.01em]">{row.name}</div>
                <div className="text-xs text-muted-foreground">{row.sub}</div>
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <Stat label={t("Tier")} value={row.tier} valueClass="text-[hsl(40_88%_34%)]" />
                <Stat label={t("Quality")} value={row.quality} valueClass="font-mono text-[hsl(158_56%_32%)]" />
                <Stat label={t("On-time")} value={row.onTime} valueClass="font-mono" />
                <Stat label={t("Capacity")} value={row.cap} valueClass="font-mono" />
                <HqOperatorPill tone={row.statusTone}>{row.statusLabel}</HqOperatorPill>
                <HqBtnLink to={manufacturerPartnerPath(row.id)} variant="outline" size="sm">
                  {t("Manage")}
                </HqBtnLink>
              </div>
            </div>
          </HqOperatorCard>
        ))
      )}

      <div className="rounded-[14px] border border-dashed border-border px-6 py-6 text-center text-muted-foreground">
        <FlaskConical className="mx-auto size-7" strokeWidth={1.5} />
        <p className="mt-3 text-[13px]">{t("Onboard a new kura partner to expand production capacity")}</p>
        <HqBtn variant="outline" className="mt-3" onClick={onAddManufacturer}>
          <Plus className="size-3.5" strokeWidth={1.75} /> {t("Add manufacturer")}
        </HqBtn>
      </div>
    </HqOperatorPage>
  );
}

function Stat({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="text-right">
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 text-[13px] font-semibold", valueClass)}>{value}</div>
    </div>
  );
}
