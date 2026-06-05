import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { getMySupplyChainIncentiveProgress, type MyIncentiveProgressData } from "@/lib/api-v1-mutations";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

function formatMoney(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

type RingStat = { value: string; label: string; pct: number; stroke: string };

function ProgressRing({ stat, size = 64 }: { stat: RingStat; size?: number }) {
  const r = size * 0.40625;
  const c = 2 * Math.PI * r;
  const dash = (stat.pct / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(35 12% 18%)" strokeWidth={5} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={stat.stroke}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[11px] font-semibold leading-none text-[hsl(40_80%_66%)]">{stat.value}</span>
        <span className="mt-0.5 text-[7px] font-medium uppercase tracking-[0.06em] text-[hsl(35_12%_42%)]">
          {stat.label}
        </span>
      </div>
    </div>
  );
}

type Props = {
  className?: string;
};

export function DistributorPartnerHero({ className }: Props) {
  const { t, language } = useLanguage();
  const [data, setData] = useState<MyIncentiveProgressData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getMySupplyChainIncentiveProgress();
        if (!cancelled) setData(res.data);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const partner = data?.scope === "distributor" ? data.partner : null;
  const tier = partner?.quarterlyPerformanceTier ?? partner?.tier ?? "Partner";
  const cases = partner?.quarterlyCasesSold ?? 0;
  const rebate = data?.totals?.payoutTotal ?? 0;
  const goldGoal = data?.program?.volumeBonusesUsd?.gold ?? 2500;
  const casesPct = Math.min(100, Math.round((cases / Math.max(goldGoal, 1)) * 100));
  const repCount = data?.network?.repCount ?? 0;
  const retailCount = data?.network?.retailAccountCount ?? 0;

  const rings: RingStat[] = [
    {
      value: partner ? String(partner.accountsOpened) : "—",
      label: t("new doors"),
      pct: Math.min(100, (partner?.accountsOpened ?? 0) * 8),
      stroke: "hsl(158 56% 36%)",
    },
    {
      value: partner ? String(partner.reorders) : "—",
      label: t("reorders"),
      pct: Math.min(100, (partner?.reorders ?? 0) * 2),
      stroke: "hsl(38 90% 50%)",
    },
    {
      value: cases > 0 ? cases.toLocaleString() : "—",
      label: t("cases Q"),
      pct: casesPct,
      stroke: "hsl(40 88% 42%)",
    },
  ];

  const subtitle =
    loaded && data?.matched && partner
      ? t("{{market}} · {{reps}} reps · {{retail}} retail accounts in HQ SPIFs", {
          market: partner.market,
          reps: repCount,
          retail: retailCount,
        })
      : loaded && data?.matchHint
        ? data.matchHint
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
          <div className="relative z-[1] flex items-center gap-2.5">
            {rings.map((ring, i) => (
              <span key={ring.label} className="flex items-center gap-2.5">
                {i > 0 ? (
                  <span className="flex flex-col justify-center gap-1 px-0.5" aria-hidden>
                    {[0, 1, 2].map((d) => (
                      <span key={d} className="size-[3px] rounded-full bg-[hsl(35_12%_28%)]" />
                    ))}
                  </span>
                ) : null}
                <ProgressRing stat={ring} />
              </span>
            ))}
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
