export type HqIncentivePayoutStatus = "scheduled" | "pending close" | "paid";

export type HqIncentivePayoutRow = {
  date: string;
  program: string;
  detail: string;
  amount: string;
  status: HqIncentivePayoutStatus;
  statusTone: "amber" | "neutral" | "green";
};

export type HqIncentivePayoutSchedule = {
  upcoming: HqIncentivePayoutRow[];
  history: HqIncentivePayoutRow[];
  upcomingTotalLabel: string;
  historyTotalLabel: string;
  kpis: {
    nextPayoutDate: string;
    nextPayoutSub: string;
    scheduledQ2: string;
    scheduledQ2Sub: string;
    paidYtd: string;
    paidYtdSub: string;
    programs: string;
    programsSub: string;
  };
};

export const INCENTIVE_PAYOUT_SCHEDULE_PATH = "/incentives/payouts";

export function buildHqIncentivePayoutSchedule(counts: {
  retail: number;
  reps: number;
  distributors: number;
  kura: number;
}): HqIncentivePayoutSchedule {
  const retail = Math.max(counts.retail, 1);
  const reps = Math.max(counts.reps, 1);
  const distributors = Math.max(counts.distributors, 1);
  const kura = Math.max(counts.kura, 1);

  const upcoming: HqIncentivePayoutRow[] = [
    {
      date: "30 Jun 2026",
      program: "Retail Partner Program",
      detail: `Q2 quarterly rebate · ${retail} stores`,
      amount: "$18,600",
      status: "scheduled",
      statusTone: "amber",
    },
    {
      date: "30 Jun 2026",
      program: "Sales Rep Incentive",
      detail: `Q2 commission + bonuses · ${reps} reps`,
      amount: "$38,400",
      status: "scheduled",
      statusTone: "amber",
    },
    {
      date: "30 Jun 2026",
      program: "Distributor Partner Program",
      detail: `Q2 volume rebate · ${distributors} distributors`,
      amount: "$11,800",
      status: "scheduled",
      statusTone: "amber",
    },
    {
      date: "15 Jul 2026",
      program: "Manufacturer Partner Program",
      detail: `Q2 quality premium · ${kura} manufacturer partners`,
      amount: "¥3,200,000",
      status: "pending close",
      statusTone: "neutral",
    },
  ];

  const history: HqIncentivePayoutRow[] = [
    {
      date: "31 Mar 2026",
      program: "Retail Partner Program",
      detail: `Q1 quarterly rebate · ${Math.max(retail - 2, 1)} stores`,
      amount: "$16,200",
      status: "paid",
      statusTone: "green",
    },
    {
      date: "31 Mar 2026",
      program: "Sales Rep Incentive",
      detail: `Q1 commission + bonuses · ${reps} reps`,
      amount: "$34,100",
      status: "paid",
      statusTone: "green",
    },
    {
      date: "31 Mar 2026",
      program: "Distributor Partner Program",
      detail: `Q1 volume rebate · ${distributors} distributors`,
      amount: "$10,400",
      status: "paid",
      statusTone: "green",
    },
    {
      date: "15 Apr 2026",
      program: "Manufacturer Partner Program",
      detail: `Q1 quality premium · ${kura} manufacturer partners`,
      amount: "¥2,900,000",
      status: "paid",
      statusTone: "green",
    },
  ];

  return {
    upcoming,
    history,
    upcomingTotalLabel: "$68.8K + ¥3.2M",
    historyTotalLabel: "$60.7K + ¥2.9M paid",
    kpis: {
      nextPayoutDate: "30 Jun",
      nextPayoutSub: "$68.8K across 3 programs",
      scheduledQ2: "$92.2K",
      scheduledQ2Sub: "+ ¥3.2M Manufacturer premium",
      paidYtd: "$60.7K",
      paidYtdSub: "+ ¥2.9M · Q1 settled",
      programs: "4",
      programsSub: "retail · rep · distributor · manufacturer",
    },
  };
}
