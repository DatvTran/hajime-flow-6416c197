import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { getMySupplyChainIncentiveProgress, type MyIncentiveProgressData } from "@/lib/api-v1-mutations";
import { cn } from "@/lib/utils";

function formatMoney(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

type Props = {
  retailTradingName?: string | null;
  /** Approximate YTD or rolling spend for progress ring when API has no tier math */
  spendApproxUsd: number;
};

export function RetailPartnerHero({ retailTradingName, spendApproxUsd }: Props) {
  const ringGradId = useId().replace(/:/g, "");
  const [data, setData] = useState<MyIncentiveProgressData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getMySupplyChainIncentiveProgress(retailTradingName ?? undefined);
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
  }, [retailTradingName]);

  const silverGoal = data?.program?.volumeBonusesUsd?.silver ?? 50_000;
  const progressPct = Math.min(100, Math.round((spendApproxUsd / Math.max(silverGoal, 1)) * 100));
  const toGo = Math.max(0, silverGoal - spendApproxUsd);
  const title =
    data?.scope === "retail" && data.partner?.quarterlyPerformanceTier
      ? data.partner.quarterlyPerformanceTier
      : data?.scope === "retail" && data.partner?.tier
        ? data.partner.tier
        : "Partner program";
  const subtitle =
    loaded && data?.scope === "retail"
      ? `$${formatMoney(spendApproxUsd)} toward tier milestones · ${progressPct}% of illustrative goal`
      : `Track rebates and co-op via Hajime HQ · $${formatMoney(spendApproxUsd)} recent volume`;

  const rebateDisplay = data?.totals ? `$${formatMoney(data.totals.payoutTotal)}` : "—";
  const bonusGateDisplay =
    data?.program?.volumeBonusesUsd?.silver != null
      ? `$${formatMoney(data.program.volumeBonusesUsd.silver)}`
      : "—";

  return (
    <>
      <div className="mb-3.5 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-[19px] font-medium tracking-[-0.01em] text-foreground">Partner program</h2>
        <Link to="/incentives" className="text-xs font-medium text-accent hover:underline">
          Full program →
        </Link>
      </div>

      <Link
        to="/incentives"
        className={cn(
          "mb-7 block overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-lifted)] no-underline",
        )}
      >
        <div className="relative flex flex-wrap items-center gap-5 bg-gradient-to-br from-[hsl(24_12%_9%)] to-[hsl(24_14%_13%)] px-6 py-5 md:flex-nowrap md:gap-8">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_100%_at_100%_50%,hsl(40_88%_42%/0.1),transparent)]"
            aria-hidden
          />
          <div className="relative shrink-0">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden>
              <defs>
                <linearGradient id={ringGradId} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(40,88%,42%)" />
                  <stop offset="100%" stopColor="hsl(32,78%,58%)" />
                </linearGradient>
              </defs>
              <g transform="rotate(-90 28 28)">
                <circle cx="28" cy="28" r="24" stroke="hsl(35 12% 20%)" strokeWidth="5" fill="none" />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke={`url(#${ringGradId})`}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${(progressPct / 100) * 150.8} 150.8`}
                  fill="none"
                />
              </g>
            </svg>
          </div>
          <div className="relative min-w-0 flex-1">
            <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[hsl(35_12%_40%)]">
              Hajime Partner Program
            </p>
            <p className="font-display text-xl font-semibold tracking-[-0.01em] text-[hsl(35_14%_90%)]">{title}</p>
            <p className="mt-1 text-xs text-[hsl(35_12%_48%)]">{subtitle}</p>
          </div>
          <div className="relative ml-auto flex flex-wrap gap-6 text-right md:gap-8">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[hsl(35_12%_38%)]">Rebate accrued</p>
              <p className="font-display text-[22px] font-semibold text-[hsl(35_14%_90%)]">{rebateDisplay}</p>
              <p className="text-[11px] text-[hsl(35_12%_44%)]">From HQ incentive ledger</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[hsl(35_12%_38%)]">Silver bonus gate</p>
              <p className="font-display text-[22px] font-semibold text-[hsl(35_14%_90%)]">{bonusGateDisplay}</p>
              <p className="text-[11px] text-[hsl(35_12%_44%)]">HQ volume tiers · details below</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-border/50 px-6 py-4">
          <div className="h-2 min-w-[120px] flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[hsl(40_88%_42%)] to-[hsl(40_80%_54%)]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            ${formatMoney(toGo)} to next band · <strong className="text-foreground">Gold</strong>
          </p>
          <span className="text-xs font-medium text-accent">View full program →</span>
        </div>
      </Link>
    </>
  );
}
