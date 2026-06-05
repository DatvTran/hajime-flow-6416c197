import { useEffect, useId, useMemo, useState } from "react";
import { useAppData } from "@/contexts/AppDataContext";
import { useRetailAccountTradingName } from "@/contexts/AuthContext";
import { RetailPageHeader } from "@/components/retail/RetailPageHeader";
import { RetailSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMySupplyChainIncentiveProgress, type MyIncentiveProgressData } from "@/lib/api-v1-mutations";
import { SupplyChainProgramNetwork } from "@/components/incentives/SupplyChainProgramNetwork";
import { retailOrderDisplayId } from "@/lib/order-lines";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

const TIER_BENEFITS = [
  { benefit: "Annual spend threshold", participant: "—", bronze: "$15K", silver: "$30K", gold: "$50K", platinum: "$100K" },
  { benefit: "Quarterly rebate", participant: "—", bronze: "1%", silver: "2%", gold: "3%", platinum: "4%" },
  { benefit: "Priority allocation", participant: "—", bronze: "✓", silver: "✓", gold: "✓", platinum: "✓" },
  { benefit: "Dedicated rep", participant: "—", bronze: "—", silver: "✓", gold: "✓", platinum: "✓" },
  { benefit: "Early access to limited releases", participant: "—", bronze: "—", silver: "✓", gold: "✓", platinum: "✓" },
  { benefit: "Volume pricing (−5%)", participant: "—", bronze: "—", silver: "—", gold: "✓", platinum: "✓" },
  { benefit: "Co-op marketing fund", participant: "—", bronze: "—", silver: "$3,000/yr", gold: "$5,000/yr", platinum: "$8,000/yr" },
];

function formatMoney(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function RetailPartnerProgramPage() {
  const { t } = useLanguage();
  const { data, loading } = useAppData();
  const accountName = useRetailAccountTradingName();
  const ringGradId = useId().replace(/:/g, "");
  const [incentive, setIncentive] = useState<MyIncentiveProgressData | null>(null);

  const ytdSpend = useMemo(() => {
    const y = new Date().getFullYear();
    return data.salesOrders
      .filter((o) => o.account === accountName && new Date(o.orderDate).getFullYear() === y && o.status !== "cancelled")
      .reduce((s, o) => s + o.price, 0);
  }, [data.salesOrders, accountName]);

  const silverGoal = incentive?.program?.volumeBonusesUsd?.silver ?? 50_000;
  const progressPct = Math.min(100, Math.round((ytdSpend / Math.max(silverGoal, 1)) * 100));
  const toGo = Math.max(0, silverGoal - ytdSpend);
  const tierLabel =
    incentive?.scope === "retail" && incentive.partner?.quarterlyPerformanceTier
      ? incentive.partner.quarterlyPerformanceTier
      : incentive?.scope === "retail" && incentive.partner?.tier
        ? incentive.partner.tier
        : "Silver Partner";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getMySupplyChainIncentiveProgress(accountName ?? undefined);
        if (!cancelled) setIncentive(res.data);
      } catch {
        if (!cancelled) setIncentive(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accountName]);

  const activity = useMemo(() => {
    return data.salesOrders
      .filter((o) => o.account === accountName && o.status !== "cancelled")
      .slice(0, 5)
      .map((o) => ({
        date: o.orderDate,
        label: "Order placed",
        order: retailOrderDisplayId(o.id),
        amount: `+$${formatMoney(Math.round(o.price * 0.02))} rebate`,
      }));
  }, [data.salesOrders, accountName]);

  if (loading) return <RetailSkeleton />;

  return (
    <div className="space-y-6 pb-8">
      <RetailPageHeader
        title="Partner program"
        description={t("Hajime Partner Program · {{name}}", { name: accountName ?? "your venue" })}
        actions={
          <Button variant="outline" size="sm" className="h-[30px] text-xs">
            Download statement
          </Button>
        }
      />

      <div className="overflow-hidden rounded-[14px] border border-border/70 bg-card shadow-[var(--shadow-soft)]">
        <div className="relative grid gap-6 overflow-hidden bg-gradient-to-br from-[hsl(24_12%_9%)] to-[hsl(24_14%_13%)] p-7 md:grid-cols-[auto_1fr_auto] md:items-center">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_100%_at_100%_50%,hsl(40_88%_42%/0.1),transparent)]"
            aria-hidden
          />
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" className="relative z-[1] shrink-0" aria-hidden>
            <defs>
              <linearGradient id={ringGradId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(40,88%,42%)" />
                <stop offset="100%" stopColor="hsl(32,78%,56%)" />
              </linearGradient>
            </defs>
            <g transform="rotate(-90 50 50)">
              <circle cx="50" cy="50" r="42" stroke="hsl(35 12% 18%)" strokeWidth="7" fill="none" />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke={`url(#${ringGradId})`}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${(progressPct / 100) * 263.9} 263.9`}
                fill="none"
              />
            </g>
          </svg>
          <div className="relative z-[1] min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-[hsl(35_12%_40%)]">Hajime Partner Program</div>
            <div className="font-display text-[26px] font-semibold tracking-[-0.01em] text-[hsl(35_14%_90%)]">{tierLabel}</div>
            <p className="mt-1 text-[13px] text-[hsl(35_12%_48%)]">
              ${formatMoney(ytdSpend)} of ${formatMoney(silverGoal)} · {progressPct}% to Gold
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full border border-[hsl(40_88%_42%/0.28)] bg-[hsl(40_88%_42%/0.14)] px-2.5 py-1 text-[11px] font-medium text-[hsl(40_80%_60%)]">
                {tierLabel} · active
              </span>
              <span className="inline-flex rounded-full border border-emerald-600/24 bg-emerald-600/12 px-2.5 py-1 text-[11px] font-medium text-emerald-600">
                2% quarterly rebate
              </span>
            </div>
          </div>
          <div className="relative z-[1] flex gap-5 md:text-right">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-[hsl(35_12%_38%)]">YTD spend</div>
              <div className="font-display text-[22px] font-semibold text-[hsl(35_14%_90%)]">${formatMoney(ytdSpend)}</div>
            </div>
            <div className="hidden h-11 w-px bg-[hsl(35_12%_20%)] md:block" />
            <div>
              <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-[hsl(35_12%_38%)]">Rebate accrued</div>
              <div className="font-display text-[22px] font-semibold text-[hsl(35_14%_90%)]">
                {incentive?.totals ? `$${formatMoney(incentive.totals.payoutTotal)}` : "—"}
              </div>
            </div>
          </div>
        </div>
        <div className="px-8 py-6">
          <div className="mb-2 flex justify-between text-[13px]">
            <span className="font-medium">Progress to Gold · ${formatMoney(ytdSpend)} of ${formatMoney(silverGoal)}</span>
            <span className="font-semibold text-accent">${formatMoney(toGo)} to go</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[hsl(40_88%_42%)] to-[hsl(40_80%_54%)]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {incentive && incentive.scope === "retail" ? (
        <SupplyChainProgramNetwork data={incentive} className="rounded-xl border border-border/70 bg-card p-4" />
      ) : null}

      <section>
        <h2 className="mb-3.5 font-display text-[19px] font-medium tracking-[-0.01em]">Tier comparison</h2>
        <div className="overflow-x-auto rounded-[14px] border border-border/70 bg-card shadow-[var(--shadow-soft)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Benefit</TableHead>
                {["Participant", "Bronze", "Silver", "Gold", "Platinum"].map((t) => (
                  <TableHead key={t} className={cn("text-center", t === "Silver" && "bg-[hsl(40_88%_42%/0.06)]")}>
                    {t === "Silver" ? "Silver ← you" : t}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {TIER_BENEFITS.map((row) => (
                <TableRow key={row.benefit}>
                  <TableCell className="font-medium text-muted-foreground">{row.benefit}</TableCell>
                  {(["participant", "bronze", "silver", "gold", "platinum"] as const).map((col) => (
                    <TableCell key={col} className={cn("text-center", col === "silver" && "bg-[hsl(40_88%_42%/0.06)]")}>
                      {row[col]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <h2 className="mb-3.5 font-display text-[19px] font-medium tracking-[-0.01em]">Reward activity</h2>
        <div className="overflow-hidden rounded-[14px] border border-border/70 bg-card shadow-[var(--shadow-soft)]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {["Date", "Activity", "Order", "Amount"].map((h) => (
                  <TableHead key={h} className="bg-muted/50 text-[10px] font-semibold uppercase tracking-[0.1em]">
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {activity.map((a) => (
                <TableRow key={a.order + a.date}>
                  <TableCell className="font-mono text-[11px]">{a.date}</TableCell>
                  <TableCell>{a.label}</TableCell>
                  <TableCell className="font-mono text-xs">{a.order}</TableCell>
                  <TableCell className="font-mono text-[13px] font-medium text-accent">{a.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
