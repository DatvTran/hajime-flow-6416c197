import { useEffect, useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PartnerRingCluster, type PartnerRingStat } from "@/components/distributor/DistributorPartnerRings";
import { getMySupplyChainIncentiveProgress, type MyIncentiveProgressData } from "@/lib/api-v1-mutations";
import {
  computeDistributorPartnerMetrics,
  currentQuarterLabel,
  formatMoney,
} from "@/lib/distributor-partner-metrics";
import { cn } from "@/lib/utils";
import { useAppData } from "@/contexts/AppDataContext";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  className?: string;
};

export function DistributorPartnerHero({ className }: Props) {
  const { t, language } = useLanguage();
  const { data } = useAppData();
  const [incentive, setIncentive] = useState<MyIncentiveProgressData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getMySupplyChainIncentiveProgress();
        if (!cancelled) setIncentive(res.data);
      } catch {
        if (!cancelled) setIncentive(null);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const partner = incentive?.scope === "distributor" ? incentive.partner : null;
  const tier = partner?.quarterlyPerformanceTier ?? partner?.tier ?? "Partner";
  const quarter = currentQuarterLabel();
  const rebate = incentive?.totals?.payoutTotal ?? 0;
  const repCount = incentive?.network?.repCount ?? 0;
  const retailCount = incentive?.network?.retailAccountCount ?? 0;

  const metrics = useMemo(
    () =>
      computeDistributorPartnerMetrics(
        data.shipments,
        data.salesOrders,
        partner?.quarterlyCasesSold ?? 0,
      ),
    [data.shipments, data.salesOrders, partner?.quarterlyCasesSold],
  );

  const casesPct = Math.min(100, (metrics.casesQ / metrics.platinumCasesTarget) * 100);

  const rings: PartnerRingStat[] = [
    {
      value: `${metrics.fillRate}%`,
      label: t("fill rate"),
      pct: metrics.fillRate,
      stroke: "hsl(158 56% 36%)",
    },
    {
      value: `${metrics.onTime}%`,
      label: t("on-time"),
      pct: metrics.onTime,
      stroke: "hsl(38 90% 50%)",
    },
    {
      value: metrics.casesQ > 0 ? metrics.casesQ.toLocaleString() : "—",
      label: t("cases {{q}}", { q: quarter.split(" ")[0] }),
      pct: casesPct,
      stroke: "hsl(40 88% 42%)",
    },
  ];

  const subtitle =
    loaded && incentive?.matched && partner
      ? t("{{market}} · {{reps}} reps · {{retail}} retail accounts in HQ SPIFs", {
          market: partner.market,
          reps: repCount,
          retail: retailCount,
        })
      : loaded && incentive?.matchHint
        ? incentive.matchHint
        : t("Loading program from Hajime HQ…");

  return (
    <section key={language} className={cn("animate-enter-delay-2", className)}>
      <div className="mb-3.5 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-[19px] font-medium tracking-[-0.01em] text-foreground">{t("Partner program")}</h2>
        <Link to="/distributor/partner-program" className="text-xs font-medium text-accent hover:underline">
          {t("Full program →")}
        </Link>
      </div>

      <Link
        to="/distributor/partner-program"
        className="mb-7 block overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-lifted)] no-underline"
      >
        <div className="relative flex flex-wrap items-center gap-5 bg-gradient-to-br from-[hsl(24_12%_9%)] to-[hsl(24_14%_13%)] px-6 py-5 md:flex-nowrap md:gap-8">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_100%_at_100%_50%,hsl(40_88%_42%/0.09),transparent)]"
            aria-hidden
          />
          <div className="relative z-[1]">
            <PartnerRingCluster rings={rings} size={64} />
          </div>
          <div className="relative z-[1] min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[hsl(35_12%_40%)]">
              {t("Hajime Distribution Partners · HQ synced")}
            </p>
            <p className="font-display text-[22px] font-semibold tracking-[-0.01em] text-[hsl(35_14%_90%)]">
              {t("{{tier}} Distribution Partner", { tier })}
            </p>
            <p className="mt-1 text-xs text-[hsl(35_12%_48%)]">{subtitle}</p>
          </div>
          <div className="relative z-[1] ml-auto flex shrink-0 flex-wrap gap-5 sm:gap-[18px]">
            <div className="text-right">
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[hsl(35_12%_38%)]">{t("SPIF total")}</p>
              <p className="font-display text-xl font-semibold tabular-nums text-[hsl(35_14%_90%)]">
                ${formatMoney(rebate)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[hsl(35_12%_38%)]">{t("ADF spend")}</p>
              <p className="font-display text-xl font-semibold tabular-nums text-[hsl(35_14%_90%)]">
                ${formatMoney(partner?.adfSpend ?? 0)}
              </p>
            </div>
          </div>
        </div>
        <p className="px-6 py-3 text-right text-xs font-medium text-accent">{t("View full program →")}</p>
      </Link>
    </section>
  );
}
