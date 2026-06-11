import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Gift,
  Lock,
  Star,
  Truck,
} from "lucide-react";
import type { SalesOrder, Shipment } from "@/data/mockData";
import { PartnerRingCluster, type PartnerRingStat } from "@/components/distributor/DistributorPartnerRings";
import { DistributorPage, DistributorPageHeader } from "@/components/distributor/DistributorUi";
import { getMySupplyChainIncentiveProgress, type MyIncentiveProgressData } from "@/lib/api-v1-mutations";
import {
  computeDistributorPartnerMetrics,
  currentQuarterLabel,
  formatMoney,
} from "@/lib/distributor-partner-metrics";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

const COOP_BUDGET = 5000;

function tierRebatePct(tier: string): number {
  const t = tier.toLowerCase();
  if (t.includes("platinum")) return 4;
  if (t.includes("gold")) return 3;
  if (t.includes("silver")) return 2;
  return 1;
}

function nextTierName(tier: string): string {
  const t = tier.toLowerCase();
  if (t.includes("gold")) return "Platinum";
  if (t.includes("silver")) return "Gold";
  if (t.includes("bronze")) return "Silver";
  return "Gold";
}

type BenefitRow = {
  title: string;
  sub: string;
  value: string;
  valueClass: string;
  rowClass: string;
  iconClass: string;
  icon: "check" | "gift" | "lock";
  coopBar?: { used: number; remaining: number; pct: number };
};

type ActivityRow = {
  label: string;
  sub: string;
  value: string;
  valueClass: string;
  iconClass: string;
  icon: "truck" | "check" | "alert" | "gift";
};

function BenefitIcon({ kind }: { kind: BenefitRow["icon"] }) {
  const props = { strokeWidth: 1.75 };
  if (kind === "gift") return <Gift {...props} />;
  if (kind === "lock") return <Lock {...props} />;
  return <Check {...props} />;
}

function ActivityIcon({ kind }: { kind: ActivityRow["icon"] }) {
  const props = { strokeWidth: 1.75 };
  if (kind === "truck") return <Truck {...props} />;
  if (kind === "alert") return <AlertTriangle {...props} />;
  if (kind === "gift") return <Gift {...props} />;
  return <Check {...props} />;
}

type Props = {
  accountName: string;
  shipments: Shipment[];
  salesOrders: SalesOrder[];
};

export function DistributorPartnerProgramView({ accountName, shipments, salesOrders }: Props) {
  const { t } = useLanguage();
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
  const tier = partner?.quarterlyPerformanceTier ?? partner?.tier ?? "Gold";
  const quarter = currentQuarterLabel();
  const rebatePct = tierRebatePct(tier);
  const nextTier = nextTierName(tier);

  const metrics = useMemo(
    () => computeDistributorPartnerMetrics(shipments, salesOrders, partner?.quarterlyCasesSold ?? 0),
    [shipments, salesOrders, partner?.quarterlyCasesSold],
  );

  const volumeRebate = data?.totals?.payoutTotal ?? Math.round(metrics.casesQ * rebatePct * 1.52);
  const coopUsed = partner?.adfSpend ?? 0;
  const coopRemaining = Math.max(0, COOP_BUDGET - coopUsed);
  const coopPct = Math.min(100, Math.round((coopUsed / COOP_BUDGET) * 100));
  const platinumUplift = Math.round(volumeRebate * (1 / Math.max(rebatePct, 1)));

  const fillGap = Math.max(0, metrics.platinumFillTarget - metrics.fillRate);
  const onTimeGap = Math.max(0, metrics.platinumOnTimeTarget - metrics.onTime);
  const casesGap = Math.max(0, metrics.platinumCasesTarget - metrics.casesQ);
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
      valueClass: "hsl(40 80% 60%)",
    },
    {
      value: metrics.casesQ.toLocaleString(),
      label: t("cases {{q}}", { q: quarter.split(" ")[0] }),
      pct: casesPct,
      stroke: "hsl(40 88% 42%)",
    },
  ];

  const subtitle =
    casesGap > 0 && onTimeGap > 0
      ? t("{{cases}} cases from {{tier}} · on-time rate is the critical gap at {{onTime}}% vs {{target}}% required", {
          cases: casesGap,
          tier: nextTier,
          onTime: metrics.onTime,
          target: metrics.platinumOnTimeTarget,
        })
      : t("Performance synced from shipments and HQ incentive program");

  const benefits: BenefitRow[] = [
    {
      title: t("{{pct}}% volume rebate on all cases", { pct: rebatePct }),
      sub: t("Applied quarterly · ${{amount}} earned {{q}}", { amount: formatMoney(volumeRebate), q: quarter }),
      value: `$${formatMoney(volumeRebate)}`,
      valueClass: "bv-gold",
      rowClass: "br-active",
      iconClass: "bi-green",
      icon: "check",
    },
    {
      title: t("Priority allocation — core SKUs"),
      sub: t("Guaranteed fill on core SKUs during peaks"),
      value: t("Active"),
      valueClass: "bv-green",
      rowClass: "br-active",
      iconClass: "bi-green",
      icon: "check",
    },
    {
      title: t("Co-op marketing fund — ${{budget}}/yr", { budget: formatMoney(COOP_BUDGET) }),
      sub: t("${{used}} used · ${{remaining}} remaining", {
        used: formatMoney(coopUsed),
        remaining: formatMoney(coopRemaining),
      }),
      value: `$${formatMoney(coopRemaining)}`,
      valueClass: "bv-gold",
      rowClass: "br-coop",
      iconClass: "bi-gold",
      icon: "gift",
      coopBar: { used: coopUsed, remaining: coopRemaining, pct: coopPct },
    },
    {
      title: t("Dedicated Hajime liaison"),
      sub: partner?.market ? t("{{market}} market · HQ support", { market: partner.market }) : t("HQ partner support"),
      value: t("Active"),
      valueClass: "bv-green",
      rowClass: "br-active",
      iconClass: "bi-green",
      icon: "check",
    },
    {
      title: t("4% volume rebate rate · Platinum"),
      sub: t("Needs 99% fill, 98% on-time, 2,000+ cases/qtr"),
      value: `+$${formatMoney(platinumUplift)}`,
      valueClass: "bv-lock",
      rowClass: "br-locked",
      iconClass: "bi-lock",
      icon: "lock",
    },
    {
      title: t("First access to limited releases · Platinum"),
      sub: t("Seasonal lots pre-allocation"),
      value: t("Locked"),
      valueClass: "bv-lock",
      rowClass: "br-locked",
      iconClass: "bi-lock",
      icon: "lock",
    },
  ];

  const activity = useMemo((): ActivityRow[] => {
    const rows: ActivityRow[] = [];

    for (const spif of (data?.spifs ?? []).slice(0, 6)) {
      const isRebate = spif.type.toLowerCase().includes("rebate");
      const isCoop = spif.type.toLowerCase().includes("adf") || spif.type.toLowerCase().includes("co-op");
      rows.push({
        label: spif.notes || spif.type,
        sub: `${spif.date}${spif.retailAccountName ? ` · ${spif.retailAccountName}` : ""}`,
        value:
          isRebate && spif.payout > 0
            ? t("Paid")
            : spif.payout >= 0
              ? `+$${formatMoney(spif.payout)}`
              : `−$${formatMoney(Math.abs(spif.payout))}`,
        valueClass: isRebate ? "av-paid" : spif.payout >= 0 ? "av-pos" : "av-neg",
        iconClass: isRebate ? "ai-gr" : isCoop ? "ai-b" : "ai-g",
        icon: isRebate ? "check" : isCoop ? "gift" : "truck",
      });
    }

    const recentShipments = shipments
      .filter((s) => s.type === "outbound" || s.orderType === "sales_order")
      .slice(0, 4);

    for (const s of recentShipments) {
      if (rows.length >= 6) break;
      const isLate = s.status === "delayed";
      const cases = (s.lineItems ?? []).reduce(
        (sum, li) => sum + (li.cases ?? Math.ceil(li.quantity / (li.caseSize || 12))),
        0,
      );
      rows.push({
        label: isLate
          ? t("Late delivery flag · {{id}}", { id: s.id })
          : t("Shipment fulfilled · {{id}}", { id: s.id }),
        sub: `${cases}cs → ${s.destination} · ${s.actualDelivery || s.eta || s.shipDate}`,
        value: isLate ? t("−1 late") : `+$${formatMoney(Math.round(cases * rebatePct * 1.52))}`,
        valueClass: isLate ? "av-neg" : "av-pos",
        iconClass: isLate ? "ai-r" : "ai-g",
        icon: isLate ? "alert" : "truck",
      });
    }

    if (rows.length === 0) {
      rows.push({
        label: t("No recent reward activity"),
        sub: loaded ? t("SPIFs and shipments will appear here") : t("Loading…"),
        value: "—",
        valueClass: "",
        iconClass: "ai-b",
        icon: "gift",
      });
    }

    return rows.slice(0, 6);
  }, [data?.spifs, shipments, rebatePct, loaded, t]);

  const headerDesc = `Hajime Distribution Partners · ${accountName} · ${tier} tier · ${quarter}`;

  return (
    <DistributorPage className="dist-partner-program space-y-6 pb-8">
      <DistributorPageHeader
        title="Partner program"
        description={headerDesc}
        rawDescription
        actions={
          <button type="button" className="dist-btn dist-btn-outline dist-btn-sm">
            {t("Download statement")}
          </button>
        }
      />

      <div className="dist-card dist-card-partner">
        <div className="inc-header">
          <PartnerRingCluster rings={rings} size={80} />
          <div className="inc-meta">
            <div className="ey">{t("Hajime Distribution Partners · {{quarter}}", { quarter })}</div>
            <div className="tname">{t("{{tier}} Distribution Partner", { tier })}</div>
            <div className="tsub">{subtitle}</div>
            <div className="rank-pills">
              <span className="rp rp-gold">
                <Star className="size-2.5" strokeWidth={2} />
                {t("{{tier}} Partner · active", { tier })}
              </span>
              <span className="rp rp-green">{t("{{pct}}% volume rebate · active", { pct: rebatePct })}</span>
              {partner?.market ? (
                <span className="rp rp-blue">{t("Priority {{market}} allocation", { market: partner.market })}</span>
              ) : null}
            </div>
          </div>
          <div className="inc-stats">
            <div className="inc-stat">
              <div className="is-lab">{t("Volume rebate {{q}}", { q: quarter.split(" ")[0] })}</div>
              <div className="is-val">${formatMoney(volumeRebate)}</div>
              <div className="is-sub">
                {t("{{pct}}% on {{cases}} cases", { pct: rebatePct, cases: metrics.casesQ.toLocaleString() })}
              </div>
            </div>
            <div className="vdiv" aria-hidden />
            <div className="inc-stat">
              <div className="is-lab">{t("Co-op fund")}</div>
              <div className="is-val">${formatMoney(coopRemaining)}</div>
              <div className="is-sub">{t("remaining of ${{budget}}", { budget: formatMoney(COOP_BUDGET) })}</div>
            </div>
            <div className="vdiv" aria-hidden />
            <div className="inc-stat">
              <div className="is-lab">{t("Platinum uplift")}</div>
              <div className="is-val">+${formatMoney(platinumUplift)}</div>
              <div className="is-sub">{t("projected at 4% rate")}</div>
            </div>
          </div>
        </div>

        <div className="inc-body">
          <div className="metrics-grid">
            <MetricCard
              label={t("Fill rate")}
              sub={t("Cases fully delivered / ordered")}
              value={`${metrics.fillRate}%`}
              need={`${metrics.platinumFillTarget}%`}
              pct={metrics.fillRate}
              fillClass="gr"
              statusLabel={
                fillGap <= 0 ? t("Platinum threshold met") : t("{{gap}}% to Platinum", { gap: fillGap.toFixed(1) })
              }
              statusClass={fillGap <= 1.5 ? "mbs-close" : "mbs-need"}
            />
            <MetricCard
              label={t("On-time delivery")}
              sub={t("Deliveries within confirmed window")}
              value={`${metrics.onTime}%`}
              valueTone="amber"
              need={`${metrics.platinumOnTimeTarget}%`}
              pct={metrics.onTime}
              fillClass="am"
              statusLabel={
                onTimeGap <= 0
                  ? t("Platinum threshold met")
                  : t("{{gap}}% gap — critical", { gap: onTimeGap.toFixed(1) })
              }
              statusClass={onTimeGap > 2 ? "mbs-need" : "mbs-close"}
            />
            <MetricCard
              label={t("Cases shipped {{q}}", { q: quarter.split(" ")[0] })}
              sub={t("Rolling quarter volume")}
              value={metrics.casesQ.toLocaleString()}
              need={String(metrics.platinumCasesTarget)}
              pct={casesPct}
              fillClass="gd"
              statusLabel={
                casesGap <= 0 ? t("Platinum threshold met") : t("{{cases}} cases to go", { cases: casesGap })
              }
              statusClass="mbs-close"
            />
          </div>

          <div className="inc-grid">
            <div>
              <div className="panel-title">{t("Active benefits & locked perks")}</div>
              {benefits.map((b) => (
                <div key={b.title} className={cn("benefit-row", b.rowClass)}>
                  <div className={cn("b-icon", b.iconClass)}>
                    <BenefitIcon kind={b.icon} />
                  </div>
                  <div className="b-text">
                    <div className="bt">{b.title}</div>
                    <div className="bs">{b.sub}</div>
                    {b.coopBar ? (
                      <div className="coop-bar-wrap">
                        <div className="coop-bar-meta">
                          <span>{t("Used ${{used}}", { used: formatMoney(b.coopBar.used) })}</span>
                          <span className="font-semibold text-accent">
                            {t("${{left}} left", { left: formatMoney(b.coopBar.remaining) })}
                          </span>
                        </div>
                        <div className="coop-bar-track">
                          <div className="coop-bar-fill" style={{ width: `${b.coopBar.pct}%` }} />
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className={cn("b-value", b.valueClass)}>{b.value}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="panel-title">{t("Recent reward activity")}</div>
              {activity.map((a, i) => (
                <div key={`${a.label}-${i}`} className="act-row">
                  <div className={cn("act-ic", a.iconClass)}>
                    <ActivityIcon kind={a.icon} />
                  </div>
                  <div className="act-body">
                    <div className="act-label">{a.label}</div>
                    <div className="act-sub">{a.sub}</div>
                  </div>
                  <div className={cn("act-val", a.valueClass)}>{a.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DistributorPage>
  );
}

function MetricCard({
  label,
  sub,
  value,
  valueTone,
  need,
  pct,
  fillClass,
  statusLabel,
  statusClass,
}: {
  label: string;
  sub: string;
  value: string;
  valueTone?: "amber";
  need: string;
  pct: number;
  fillClass: string;
  statusLabel: string;
  statusClass: string;
}) {
  return (
    <div className="metric-card">
      <div className="mb-top">
        <div>
          <div className="mb-label">{label}</div>
          <div className="mb-sub">{sub}</div>
        </div>
        <div className="mb-value">
          <div className={cn("mv", valueTone === "amber" && "text-[hsl(38_90%_40%)]")}>{value}</div>
          <div className="mg">{`Platinum needs ${need}`}</div>
        </div>
      </div>
      <div className="mb-track">
        <div className={cn("mb-fill", fillClass)} style={{ width: `${pct}%` }} />
      </div>
      <div className="mb-footer">
        <span>0</span>
        <span className={cn("mb-status", statusClass)}>{statusLabel}</span>
      </div>
    </div>
  );
}
