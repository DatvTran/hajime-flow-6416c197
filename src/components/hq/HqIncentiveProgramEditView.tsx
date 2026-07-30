import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ClipboardList, Pause, Receipt, Save, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  type HqIncentiveProgramConfig,
  type HqIncentiveProgramId,
  loadHqIncentiveProgram,
  saveHqIncentiveProgram,
} from "@/lib/hq-incentive-programs";
import {
  HqBtn,
  HqOperatorCard,
  HqOperatorCardHead,
  HqOperatorDataTable,
  HqOperatorKpiCard,
  HqOperatorKpiGrid,
  HqOperatorPage,
  HqOperatorPill,
  HqOperatorTwoCol,
} from "@/components/hq/HqOperatorUi";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

type Props = {
  programId: HqIncentiveProgramId;
};

const PERIOD_OPTIONS = [
  "per-event",
  "monthly",
  "quarterly",
  "per-order",
  "per-invoice",
  "rolling-12mo",
  "annual",
] as const;

function claimTone(status: HqIncentiveProgramConfig["claims"][0]["status"]) {
  if (status === "approved") return "green" as const;
  if (status === "pending") return "amber" as const;
  return "red" as const;
}

export function HqIncentiveProgramEditView({ programId }: Props) {
  const { t } = useLanguage();
  const seed = useMemo(() => loadHqIncentiveProgram(programId), [programId]);
  const [config, setConfig] = useState<HqIncentiveProgramConfig>(seed);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setConfig(loadHqIncentiveProgram(programId));
  }, [programId]);

  const Icon = seed.icon;
  const pendingClaims = config.claims.filter((c) => c.status === "pending").length;
  const activeRules = config.rules.filter((r) => r.active).length;

  const save = async () => {
    setSaving(true);
    try {
      saveHqIncentiveProgram(config);
      await new Promise((r) => setTimeout(r, 280));
      toast.success(t("Program saved"), { description: config.title });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = () => {
    setConfig((c) => ({ ...c, active: !c.active }));
    toast.message(config.active ? t("Program paused") : t("Program activated"));
  };

  const updateTier = (tierId: string, field: "threshold" | "reward", value: string) => {
    setConfig((c) => ({
      ...c,
      tiers: c.tiers.map((row) => (row.id === tierId ? { ...row, [field]: value } : row)),
    }));
  };

  const toggleRule = (ruleId: string) => {
    setConfig((c) => ({
      ...c,
      rules: c.rules.map((r) => (r.id === ruleId ? { ...r, active: !r.active } : r)),
    }));
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
        <span className="text-xs text-muted-foreground">/ {config.title}</span>
      </div>

      <div className="hq-ph-row flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3.5">
          <div
            className={cn("hq-prog-icon shrink-0", seed.iconClass)}
            style={seed.iconStyle}
          >
            <Icon className="size-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-[26px] font-semibold tracking-[-0.02em]">{config.title}</h1>
              <HqOperatorPill tone={config.active ? "green" : "neutral"}>
                {config.active ? t("active") : t("paused")}
              </HqOperatorPill>
            </div>
            <p className="mt-1 max-w-[60ch] text-[13px] text-muted-foreground">{config.subtitle}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <HqBtn variant="outline" size="sm" onClick={toggleActive}>
            <Pause className="size-3.5" strokeWidth={1.75} />
            {config.active ? t("Pause program") : t("Activate")}
          </HqBtn>
          <HqBtn variant="accent" size="sm" onClick={() => void save()} disabled={saving}>
            <Save className="size-3.5" strokeWidth={1.75} />
            {saving ? t("Saving…") : t("Save changes")}
          </HqBtn>
        </div>
      </div>

      <HqOperatorKpiGrid className="mb-0">
        <HqOperatorKpiCard icon={Users} tone="gold" label="Members enrolled" value={config.membersLabel.split(" ")[0] ?? "—"} sub={config.membersLabel} />
        <HqOperatorKpiCard icon={Receipt} tone="green" label="Q2 payout to date" value={config.q2Payout} sub={config.rewardStructure} />
        <HqOperatorKpiCard icon={ClipboardList} tone="blue" label="Active rules" value={String(activeRules)} sub={`${config.rules.length} total rules`} />
        <HqOperatorKpiCard icon={Save} tone="ink" label="Pending claims" value={String(pendingClaims)} sub={t("awaiting approval")} />
      </HqOperatorKpiGrid>

      <HqOperatorTwoCol className="mb-0 items-start gap-5">
        <div className="flex min-w-0 flex-col gap-4">
          <HqOperatorCard className="p-5 sm:p-[22px]">
            <div className="hq-settings-title">{t("Program overview")}</div>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="hq-form-group sm:col-span-2">
                <label htmlFor="prog-title">{t("Program name")}</label>
                <input
                  id="prog-title"
                  value={config.title}
                  onChange={(e) => setConfig((c) => ({ ...c, title: e.target.value }))}
                />
              </div>
              <div className="hq-form-group sm:col-span-2">
                <label htmlFor="prog-sub">{t("Short description")}</label>
                <input
                  id="prog-sub"
                  value={config.subtitle}
                  onChange={(e) => setConfig((c) => ({ ...c, subtitle: e.target.value }))}
                />
              </div>
              <div className="hq-form-group">
                <label htmlFor="prog-period">{t("Payout period")}</label>
                <select
                  id="prog-period"
                  className="hq-form-select"
                  value={config.period}
                  onChange={(e) => setConfig((c) => ({ ...c, period: e.target.value }))}
                >
                  {PERIOD_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hq-form-group">
                <label htmlFor="prog-budget">{t("Budget cap")}</label>
                <input
                  id="prog-budget"
                  value={config.budgetCap}
                  onChange={(e) => setConfig((c) => ({ ...c, budgetCap: e.target.value }))}
                />
              </div>
              <div className="hq-form-group sm:col-span-2">
                <label htmlFor="prog-trigger">{t("Trigger — what earns this")}</label>
                <textarea
                  id="prog-trigger"
                  rows={3}
                  className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-[13px] focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/15"
                  value={config.trigger}
                  onChange={(e) => setConfig((c) => ({ ...c, trigger: e.target.value }))}
                />
              </div>
              <div className="hq-form-group sm:col-span-2">
                <label htmlFor="prog-conditions">{t("Conditions & exclusions")}</label>
                <textarea
                  id="prog-conditions"
                  rows={3}
                  className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-[13px] focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/15"
                  value={config.conditions}
                  onChange={(e) => setConfig((c) => ({ ...c, conditions: e.target.value }))}
                />
              </div>
            </div>
          </HqOperatorCard>

          <HqOperatorCard className="overflow-hidden p-0">
            <HqOperatorCardHead title="Tier thresholds" subtitle="Member counts reflect current enrollment" />
            <HqOperatorDataTable>
              <thead>
                <tr>
                  <th>{t("Tier")}</th>
                  <th>{t("Threshold")}</th>
                  <th>{t("Reward")}</th>
                  <th>{t("Members")}</th>
                </tr>
              </thead>
              <tbody>
                {config.tiers.map((tier) => (
                  <tr key={tier.id}>
                    <td>
                      <span className="inline-flex items-center gap-2 font-medium">
                        <span className="size-2 rounded-sm" style={{ background: tier.color }} />
                        {tier.name}
                      </span>
                    </td>
                    <td>
                      <input
                        className="w-full min-w-[100px] rounded-md border border-border bg-background px-2 py-1 font-mono text-xs"
                        value={tier.threshold}
                        onChange={(e) => updateTier(tier.id, "threshold", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="w-full min-w-[120px] rounded-md border border-border bg-background px-2 py-1 text-xs"
                        value={tier.reward}
                        onChange={(e) => updateTier(tier.id, "reward", e.target.value)}
                      />
                    </td>
                    <td className="font-mono text-muted-foreground">{tier.memberCount}</td>
                  </tr>
                ))}
              </tbody>
            </HqOperatorDataTable>
            <div className="border-t border-border/50 px-5 py-3">
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {t("Tier distribution")}
              </div>
              <div className="hq-tierdist">
                {config.tiers
                  .filter((tier) => tier.memberCount > 0)
                  .map((tier) => (
                    <div
                      key={tier.id}
                      className="hq-tierseg"
                      style={{ background: tier.color, flex: tier.memberCount }}
                      title={`${tier.name}: ${tier.memberCount}`}
                    >
                      {tier.memberCount}
                    </div>
                  ))}
              </div>
            </div>
          </HqOperatorCard>

          <HqOperatorCard className="overflow-hidden p-0">
            <HqOperatorCardHead title="Active rules" subtitle="Individual incentives within this program" />
            <HqOperatorDataTable>
              <thead>
                <tr>
                  <th>{t("Rule")}</th>
                  <th>{t("Type")}</th>
                  <th>{t("Rate")}</th>
                  <th>{t("Period")}</th>
                  <th>{t("Status")}</th>
                </tr>
              </thead>
              <tbody>
                {config.rules.map((rule) => (
                  <tr key={rule.id}>
                    <td>
                      <div className="font-medium">{rule.name}</div>
                      <div className="mt-0.5 max-w-[280px] text-[11px] text-muted-foreground">{rule.trigger}</div>
                    </td>
                    <td className="text-xs text-muted-foreground">{rule.type}</td>
                    <td className="font-mono text-xs font-semibold">{rule.rateLabel}</td>
                    <td className="font-mono text-xs text-muted-foreground">{rule.period}</td>
                    <td>
                      <button type="button" className="cursor-pointer" onClick={() => toggleRule(rule.id)}>
                        <HqOperatorPill tone={rule.active ? "green" : "neutral"}>
                          {rule.active ? t("active") : t("paused")}
                        </HqOperatorPill>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </HqOperatorDataTable>
          </HqOperatorCard>

          <HqOperatorCard className="overflow-hidden p-0">
            <HqOperatorCardHead title="Recent claims" subtitle="Pending items need HQ approval before payout" />
            <HqOperatorDataTable>
              <thead>
                <tr>
                  <th>{t("Claim")}</th>
                  <th>{t("Rule")}</th>
                  <th>{t("Amount")}</th>
                  <th>{t("Status")}</th>
                </tr>
              </thead>
              <tbody>
                {config.claims.map((claim) => (
                  <tr key={claim.id}>
                    <td>
                      <div className="font-mono text-xs font-medium">{claim.id}</div>
                      <div className="text-xs font-medium">{claim.by}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {claim.account} · {claim.date}
                      </div>
                    </td>
                    <td className="text-xs text-muted-foreground">{claim.ruleName}</td>
                    <td className="font-mono text-sm font-semibold">{claim.amount}</td>
                    <td>
                      <HqOperatorPill tone={claimTone(claim.status)}>{claim.status}</HqOperatorPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </HqOperatorDataTable>
          </HqOperatorCard>
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-5">
          <HqOperatorCard className="p-5">
            <div className="hq-settings-title">{t("Summary")}</div>
            <div className="space-y-0">
              {[
                [t("Reward structure"), config.rewardStructure],
                [t("Payout period"), config.period],
                [t("Budget cap"), config.budgetCap],
                [t("Spent this period"), config.spentLabel],
                [t("Q2 payout"), config.q2Payout],
                [t("Members"), config.membersLabel],
              ].map(([label, value], i, arr) => (
                <div
                  key={String(label)}
                  className={cn(
                    "flex justify-between gap-3 py-2 text-[13px]",
                    i < arr.length - 1 && "border-b border-border/30",
                  )}
                >
                  <span className="text-muted-foreground">{label}</span>
                  <span className="max-w-[55%] text-right font-medium">{value}</span>
                </div>
              ))}
            </div>
            <HqBtn variant="accent" size="sm" className="mt-4 w-full" onClick={() => void save()} disabled={saving}>
              {saving ? t("Saving…") : t("Save changes")}
            </HqBtn>
            <HqBtn variant="outline" size="sm" className="mt-2 w-full" onClick={toggleActive}>
              {config.active ? t("Pause program") : t("Activate program")}
            </HqBtn>
          </HqOperatorCard>

          <div className="rounded-[14px] border border-[hsl(280_40%_50%/0.2)] bg-[hsl(280_40%_50%/0.06)] p-4 text-xs leading-relaxed text-[hsl(280_30%_42%)]">
            <strong className="text-[hsl(280_40%_44%)]">{t("Portal sync:")}</strong>{" "}
            {t("Saved rules propagate to distributor, sales rep, retail, and manufacturer partner portals on next login.")}
          </div>
        </div>
      </HqOperatorTwoCol>
    </HqOperatorPage>
  );
}
