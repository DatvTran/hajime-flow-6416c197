import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, ShoppingCart, Star, BarChart3 } from "lucide-react";
import { useAppData } from "@/contexts/AppDataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { filterPlatformAccountsForHq } from "@/lib/hq-order-scope";
import { buildHqIncentivePayoutSchedule } from "@/lib/hq-incentive-payouts";
import {
  HqBtn,
  HqOperatorCard,
  HqOperatorCardHead,
  HqOperatorDataTable,
  HqOperatorKpiCard,
  HqOperatorKpiGrid,
  HqOperatorPage,
  HqOperatorPageHeader,
  HqOperatorPill,
} from "@/components/hq/HqOperatorUi";
import { toast } from "@/components/ui/sonner";

function PayoutTable({
  rows,
}: {
  rows: ReturnType<typeof buildHqIncentivePayoutSchedule>["upcoming"];
}) {
  const { t } = useLanguage();

  return (
    <HqOperatorDataTable>
      <thead>
        <tr>
          <th>{t("Date")}</th>
          <th>{t("Program")}</th>
          <th>{t("Detail")}</th>
          <th>{t("Amount")}</th>
          <th>{t("Status")}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={`${row.date}-${row.program}`}>
            <td className="font-mono text-xs font-medium">{row.date}</td>
            <td className="text-[13px] font-medium">{row.program}</td>
            <td className="text-xs text-muted-foreground">{row.detail}</td>
            <td className="font-mono text-sm font-semibold">{row.amount}</td>
            <td>
              <HqOperatorPill tone={row.statusTone}>{row.status}</HqOperatorPill>
            </td>
          </tr>
        ))}
      </tbody>
    </HqOperatorDataTable>
  );
}

export function HqIncentivePayoutScheduleView() {
  const { t } = useLanguage();
  const { data } = useAppData();

  const schedule = useMemo(() => {
    const accounts = filterPlatformAccountsForHq(data.accounts);
    const retail = accounts.filter((a) => ["retail", "bar", "restaurant", "hotel"].includes(String(a.type))).length;
    const distributors = accounts.filter((a) => a.type === "distributor").length;
    const kura = accounts.filter((a) => a.type === "manufacturer").length;
    const reps = (data.teamMembers ?? []).filter((m) => m.role === "sales_rep").length;
    return buildHqIncentivePayoutSchedule({ retail, reps, distributors, kura });
  }, [data.accounts, data.teamMembers]);

  const exportSchedule = () => {
    toast.message(t("Export scheduled"), {
      description: t("Payout schedule CSV will download when finance integration is connected."),
    });
  };

  return (
    <HqOperatorPage className="space-y-6">
      <div className="flex flex-wrap items-center gap-2.5">
        <Link
          to="/incentives"
          className="hq-btn hq-btn-outline hq-btn-sm inline-flex items-center gap-1.5 no-underline"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.75} />
          {t("Incentive programs")}
        </Link>
        <span className="text-xs text-muted-foreground">/ {t("Payout schedule")}</span>
      </div>

      <HqOperatorPageHeader
        title="Payout schedule"
        description="Upcoming and historical incentive payouts across all four programs"
        actions={
          <HqBtn variant="outline" size="sm" onClick={exportSchedule}>
            {t("Export schedule")}
          </HqBtn>
        }
      />

      <HqOperatorKpiGrid>
        <HqOperatorKpiCard
          icon={Star}
          tone="gold"
          label="Next payout"
          value={schedule.kpis.nextPayoutDate}
          sub={schedule.kpis.nextPayoutSub}
        />
        <HqOperatorKpiCard
          icon={ShoppingCart}
          tone="gold"
          label="Scheduled Q2"
          value={schedule.kpis.scheduledQ2}
          sub={schedule.kpis.scheduledQ2Sub}
        />
        <HqOperatorKpiCard
          icon={Check}
          tone="green"
          label="Paid YTD"
          value={schedule.kpis.paidYtd}
          sub={schedule.kpis.paidYtdSub}
        />
        <HqOperatorKpiCard
          icon={BarChart3}
          tone="ink"
          label="Programs"
          value={schedule.kpis.programs}
          sub={schedule.kpis.programsSub}
        />
      </HqOperatorKpiGrid>

      <HqOperatorCard className="overflow-hidden p-0">
        <HqOperatorCardHead
          title="Upcoming payouts"
          subtitle="Scheduled for the current cycle"
          actions={
            <span className="font-mono text-[13px] font-semibold text-accent">{schedule.upcomingTotalLabel}</span>
          }
        />
        <PayoutTable rows={schedule.upcoming} />
      </HqOperatorCard>

      <HqOperatorCard className="overflow-hidden p-0">
        <HqOperatorCardHead
          title="Payout history"
          subtitle="Settled in prior cycles"
          actions={
            <span className="font-mono text-[13px] font-semibold text-[hsl(158_56%_32%)]">
              {schedule.historyTotalLabel}
            </span>
          }
        />
        <PayoutTable rows={schedule.history} />
      </HqOperatorCard>
    </HqOperatorPage>
  );
}
