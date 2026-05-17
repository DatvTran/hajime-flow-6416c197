import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, TrendingUp } from "lucide-react";
import {
  getMySupplyChainIncentiveProgress,
  type MyIncentiveProgressData,
} from "@/lib/api-v1-mutations";

function formatMoney(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const SPIF_TYPE_LABEL: Record<string, string> = {
  new_on_premise: "On-prem new",
  new_off_premise: "Off-prem new",
  reorder: "Reorder",
  tasting: "Tasting",
};

type Props = {
  /** Retail: pass `Account.tradingName` so SPIF notes can match your venue. */
  retailTradingName?: string | null;
  /** Optional line below the card (e.g. retail order volume from local data). */
  activityHint?: string | null;
};

export function IncentiveProgressDashboardCard({ retailTradingName, activityHint }: Props) {
  const [data, setData] = useState<MyIncentiveProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getMySupplyChainIncentiveProgress(retailTradingName ?? undefined);
        if (!cancelled) {
          setData(res.data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setData(null);
          setError(e instanceof Error ? e.message : "Could not load incentive progress");
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [retailTradingName]);

  if (!loaded) {
    return (
      <Card className="border-border/80">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base font-semibold">Supply chain incentives</CardTitle>
          <p className="text-sm text-muted-foreground">Loading your program progress…</p>
        </CardHeader>
      </Card>
    );
  }

  if (error || !data || data.scope === "unsupported") {
    return (
      <Card className="border-border/80">
        <CardHeader className="pb-2">
          <CardTitle className="font-display flex items-center gap-2 text-base font-semibold">
            <Gift className="h-4 w-4 shrink-0 text-muted-foreground" />
            Supply chain incentives
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {error ?? "Incentive progress is not available for your account type."}
          </p>
        </CardHeader>
      </Card>
    );
  }

  const { program, totals, spifs, partner, matched } = data;
  const rates = program.spifRates;

  return (
    <Card className="border-border/80">
      <CardHeader className="pb-2">
        <CardTitle className="font-display flex items-center gap-2 text-base font-semibold">
          <Gift className="h-4 w-4 shrink-0 text-muted-foreground" />
          Supply chain incentives
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {data.scope === "distributor" &&
            (matched
              ? "Your distributor program snapshot from Hajime HQ (read-only)."
              : "We could not match your login to a partner row yet. Ask HQ to align your CRM name or partner name in the Incentive Manager.")}
          {data.scope === "sales_rep" &&
            (matched
              ? "SPIF payouts logged under your name for this quarter."
              : "No SPIF lines matched your name yet — totals below stay at zero until HQ logs activity for you.")}
          {data.scope === "retail" &&
            "SPIFs are paid to distributor reps; below is your venue-linked activity (if noted) and current program rates."}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.scope === "distributor" && partner ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-muted/25 px-3 py-2 text-sm">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">{partner.name}</span>
            <span className="text-muted-foreground">· {partner.market}</span>
            {partner.quarterlyPerformanceTier ? (
              <Badge variant="secondary" className="tabular-nums">
                {partner.quarterlyPerformanceTier} tier
              </Badge>
            ) : null}
            <span className="text-muted-foreground">
              · {partner.quarterlyCasesSold.toLocaleString()} cases · {partner.accountsOpened} new accounts ·{" "}
              {partner.reorders} reorders
            </span>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border/70 bg-card/80 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">SPIF payouts (you)</p>
            <p className="font-display text-xl font-semibold tabular-nums text-foreground">
              ${formatMoney(totals.payoutTotal)}
            </p>
            <p className="text-xs text-muted-foreground">{totals.spifCount} logged line{totals.spifCount === 1 ? "" : "s"}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-card/80 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Program rates (read-only)</p>
            <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
              <li className="tabular-nums">On-prem ${rates.new_on_premise ?? "—"}</li>
              <li className="tabular-nums">Off-prem ${rates.new_off_premise ?? "—"}</li>
              <li className="tabular-nums">Reorder ${rates.reorder ?? "—"}</li>
              <li className="tabular-nums">Tasting ${rates.tasting ?? "—"}</li>
            </ul>
          </div>
        </div>

        {activityHint ? (
          <p className="text-xs text-muted-foreground">{activityHint}</p>
        ) : null}

        {spifs.length > 0 ? (
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Recent activity</p>
            <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1 text-sm">
              {spifs.slice(0, 8).map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-border/60 px-2 py-1.5"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-foreground">
                      {SPIF_TYPE_LABEL[s.type] ?? s.type.replace(/_/g, " ")}
                    </span>
                    <span className="text-muted-foreground"> · {s.date}</span>
                    {s.partnerName ? (
                      <p className="truncate text-xs text-muted-foreground">{s.partnerName}</p>
                    ) : null}
                    {s.notes ? (
                      <p className="line-clamp-1 text-xs text-muted-foreground">{s.notes}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 font-display font-semibold tabular-nums text-foreground">
                    ${formatMoney(Number(s.payout) || 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : matched ? (
          <p className="text-xs text-muted-foreground">No SPIF lines in the recent window — check back after HQ logs payouts.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
