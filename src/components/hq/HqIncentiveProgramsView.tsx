import { useMemo } from "react";
import { BarChart3, FlaskConical, Star, Store, TrendingUp, Truck, Users } from "lucide-react";
import { useAppData } from "@/contexts/AppDataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { filterPlatformAccountsForHq } from "@/lib/hq-order-scope";
import { formatHqCompact } from "@/lib/hq-format";
import { incentiveProgramEditPath, type HqIncentiveProgramId } from "@/lib/hq-incentive-programs";
import { INCENTIVE_PAYOUT_SCHEDULE_PATH } from "@/lib/hq-incentive-payouts";
import {
  HqBtnLink,
  HqOperatorKpiCard,
  HqOperatorKpiGrid,
  HqOperatorPage,
  HqOperatorPageHeader,
} from "@/components/hq/HqOperatorUi";

type ProgramDef = {
  id: HqIncentiveProgramId;
  icon: typeof Store;
  iconClass: string;
  title: string;
  sub: string;
  members: string;
  payout: string;
  metric: string;
  tiers: [string, number, string][];
};

export function HqIncentiveProgramsView() {
  const { t } = useLanguage();
  const { data } = useAppData();

  const accounts = useMemo(() => filterPlatformAccountsForHq(data.accounts), [data.accounts]);
  const retailCount = accounts.filter((a) => ["retail", "bar", "restaurant", "hotel"].includes(String(a.type))).length;
  const distCount = accounts.filter((a) => a.type === "distributor").length;
  const mfrCount = accounts.filter((a) => a.type === "manufacturer").length;
  const repCount = (data.teamMembers ?? []).filter((m) => m.role === "sales_rep").length;

  const programs: ProgramDef[] = useMemo(
    () => [
      {
        id: "retail",
        icon: Store,
        iconClass: "hq-kpi-ic-gold",
        title: "Retail Partner Program",
        sub: "Spend-based tiers · quarterly rebate",
        members: `${retailCount} stores`,
        payout: formatHqCompact(retailCount * 443),
        metric: "2–4% rebate",
        tiers: [
          ["Participant", Math.max(1, Math.round(retailCount * 0.28)), "hsl(var(--muted-foreground))"],
          ["Bronze", Math.max(1, Math.round(retailCount * 0.33)), "hsl(30 50% 50%)"],
          ["Silver", Math.max(1, Math.round(retailCount * 0.26)), "hsl(220 8% 60%)"],
          ["Gold", Math.max(1, Math.round(retailCount * 0.1)), "hsl(40 88% 42%)"],
          ["Platinum", Math.max(0, Math.round(retailCount * 0.03)), "hsl(215 72% 50%)"],
        ],
      },
      {
        id: "sales-rep",
        icon: Users,
        iconClass: "hq-kpi-ic-blue",
        title: "Sales Rep Incentive",
        sub: "Quota attainment · commission + bonuses",
        members: `${repCount} reps`,
        payout: formatHqCompact(repCount * 3200),
        metric: "6–12% commission",
        tiers: [
          ["Standard", Math.max(1, Math.round(repCount * 0.25)), "hsl(var(--muted-foreground))"],
          ["Silver", Math.max(1, Math.round(repCount * 0.33)), "hsl(220 8% 60%)"],
          ["Gold", Math.max(1, Math.round(repCount * 0.33)), "hsl(40 88% 42%)"],
          ["Platinum", Math.max(0, Math.round(repCount * 0.09)), "hsl(215 72% 50%)"],
        ],
      },
      {
        id: "distributor",
        icon: Truck,
        iconClass: "hq-kpi-ic-green",
        title: "Distributor Partner Program",
        sub: "Fill rate, on-time & volume",
        members: `${distCount} distributors`,
        payout: formatHqCompact(distCount * 2950),
        metric: "3–4% volume rebate",
        tiers: [
          ["Standard", 0, "hsl(var(--muted-foreground))"],
          ["Silver", Math.max(1, Math.round(distCount * 0.5)), "hsl(220 8% 60%)"],
          ["Gold", Math.max(1, Math.round(distCount * 0.5)), "hsl(40 88% 42%)"],
          ["Platinum", 0, "hsl(215 72% 50%)"],
        ],
      },
      {
        id: "kura",
        icon: FlaskConical,
        iconClass: "",
        title: "Manufacturer Partner Program",
        sub: "Quality, yield & on-time production",
        members: `${mfrCount} manufacturer partners`,
        payout: mfrCount > 0 ? "¥3.2M" : "—",
        metric: "¥2–3/bottle premium",
        tiers: [
          ["Standard", Math.max(1, mfrCount), "hsl(var(--muted-foreground))"],
          ["Preferred", Math.max(0, mfrCount - 1), "hsl(40 88% 42%)"],
          ["Master", 0, "hsl(215 72% 50%)"],
        ],
      },
    ],
    [retailCount, repCount, distCount, mfrCount],
  );

  const totalPayout = retailCount * 443 + repCount * 3200 + distCount * 2950;
  const enrolled = retailCount + repCount + distCount + mfrCount;

  return (
    <HqOperatorPage className="space-y-6">
      <HqOperatorPageHeader
        title="Incentive programs"
        description="Administer the reward program for every role — tiers, thresholds, and payouts in one place"
        actions={
          <HqBtnLink to={INCENTIVE_PAYOUT_SCHEDULE_PATH} variant="outline" size="sm">
            {t("Payout schedule")}
          </HqBtnLink>
        }
      />

      <HqOperatorKpiGrid>
        <HqOperatorKpiCard icon={Star} tone="gold" label="Total payouts Q2" value={formatHqCompact(totalPayout)} sub={t("across 4 programs")} />
        <HqOperatorKpiCard icon={Users} tone="blue" label="Members enrolled" value={String(enrolled)} sub={t("reps, distributors, manufacturer partners, retail")} />
        <HqOperatorKpiCard icon={TrendingUp} tone="green" label="Tier upgrades Q2" value="7" sub={t("members advanced a tier")} />
        <HqOperatorKpiCard icon={BarChart3} tone="ink" label="Program ROI" value="3.4×" sub={t("incremental revenue vs cost")} />
      </HqOperatorKpiGrid>

      <div className="hq-prog-grid">
        {programs.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.id} className="hq-prog-card">
              <div className="hq-prog-header">
                <div
                  className={`hq-prog-icon ${p.iconClass}`}
                  style={
                    p.title.includes("Manufacturer Partner")
                      ? { background: "hsl(280 40% 50% / 0.1)", color: "hsl(280 40% 48%)" }
                      : undefined
                  }
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{p.title}</div>
                  <div className="text-xs text-muted-foreground">{p.sub}</div>
                </div>
                <HqBtnLink to={incentiveProgramEditPath(p.id)} variant="outline" size="sm">
                  {t("Edit")}
                </HqBtnLink>
              </div>
              <div className="hq-prog-body">
                <div className="hq-prog-stat-row">
                  <span className="hq-prog-stat-lab">{t("Members enrolled")}</span>
                  <span className="hq-prog-stat-val">{p.members}</span>
                </div>
                <div className="hq-prog-stat-row">
                  <span className="hq-prog-stat-lab">{t("Reward structure")}</span>
                  <span className="hq-prog-stat-val">{p.metric}</span>
                </div>
                <div className="hq-prog-stat-row">
                  <span className="hq-prog-stat-lab">{t("Q2 payout to date")}</span>
                  <span className="hq-prog-stat-val text-accent">{p.payout}</span>
                </div>
                <div className="mb-0.5 mt-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {t("Tier distribution")}
                </div>
                <div className="hq-tierdist">
                  {p.tiers
                    .filter((tier) => tier[1] > 0)
                    .map((tier) => (
                      <div
                        key={tier[0]}
                        className="hq-tierseg"
                        style={{ background: tier[2], flex: tier[1] }}
                        title={`${tier[0]}: ${tier[1]}`}
                      >
                        {tier[1]}
                      </div>
                    ))}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-3.5 gap-y-2">
                  {p.tiers.map((tier) => (
                    <span key={tier[0]} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="size-2 rounded-sm" style={{ background: tier[2] }} />
                      {tier[0]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </HqOperatorPage>
  );
}
