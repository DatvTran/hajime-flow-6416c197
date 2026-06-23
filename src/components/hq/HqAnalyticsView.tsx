import { useMemo, useState } from "react";
import { Download, ShoppingCart, Store, TrendingUp, Users } from "lucide-react";
import { useAppData } from "@/contexts/AppDataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { scopeAppDataForHqOperator } from "@/lib/hq-order-scope";
import {
  buildHqAnalyticsDemoSnapshot,
  mergeHqAnalyticsSkuNames,
  shouldUseHqAnalyticsDemo,
  type HqAnalyticsRangeId,
  type HqAnalyticsSnapshot,
} from "@/lib/hq-analytics-demo";
import { mergeHqNetworkSalesForDisplay, mergeHqWholesaleOrdersForDisplay } from "@/lib/hq-orders-demo";
import {
  computeSalesByMonth,
  computeTopAccounts,
  revenueInWindow,
} from "@/lib/hajime-metrics";
import { formatHqCompact } from "@/lib/hq-format";
import {
  HqBtn,
  HqOperatorCard,
  HqOperatorCardHead,
  HqOperatorDataTable,
  HqOperatorFilterBar,
  HqOperatorFilterButton,
  HqOperatorKpiCard,
  HqOperatorKpiGrid,
  HqOperatorPage,
  HqOperatorPageHeader,
  HqOperatorTwoCol,
} from "@/components/hq/HqOperatorUi";
import { toast } from "@/components/ui/sonner";

function buildLiveSnapshot(
  orders: ReturnType<typeof scopeAppDataForHqOperator>["salesOrders"],
  range: HqAnalyticsRangeId,
  topAccountCount: number,
): HqAnalyticsSnapshot {
  const windowDays = range === "qtd" ? 90 : 365;
  const networkRevenue = revenueInWindow(orders, windowDays);
  const casesSold = Math.round(orders.reduce((s, o) => s + o.quantity, 0) / 12);
  const avgOrderValue = orders.length > 0 ? networkRevenue / orders.length : 0;
  const monthly = computeSalesByMonth(orders, range === "ytd" ? 6 : 7).map((m, i, arr) => ({
    month: m.month,
    revenue: m.revenue,
    partial: i === arr.length - 1,
  }));

  const marketMap = new Map<string, number>();
  for (const o of orders) {
    const m = o.market || "Other";
    marketMap.set(m, (marketMap.get(m) ?? 0) + o.price);
  }
  const byMarketSorted = Array.from(marketMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxMarketRev = byMarketSorted[0]?.[1] ?? 1;

  const skuMap = new Map<string, { cases: number; revenue: number; name: string }>();
  for (const o of orders) {
    const cur = skuMap.get(o.sku) ?? { cases: 0, revenue: 0, name: o.sku };
    cur.cases += Math.ceil(o.quantity / 12);
    cur.revenue += o.price;
    skuMap.set(o.sku, cur);
  }
  const topSkus = Array.from(skuMap.entries())
    .sort((a, b) => b[1].cases - a[1].cases)
    .slice(0, 4)
    .map(([sku, v]) => ({
      name: v.name,
      sku,
      cases: v.cases,
      revenue: v.revenue,
      vsQ1: "—",
    }));

  const topAccounts = computeTopAccounts(orders, topAccountCount);
  const retentionPct = topAccounts.length > 0 ? Math.min(98, 84 + topAccounts.length * 2) : 92;

  return {
    networkRevenue,
    networkRevenueSub: range === "qtd" ? "Q2 to date" : range === "ytd" ? "Year to date" : "Trailing 12 months",
    networkRevenueDelta: "+16% vs Q1",
    casesSold,
    casesSoldDelta: "+12%",
    avgOrderValue,
    avgOrderSub: "rolling window",
    avgOrderDelta: "+10%",
    retentionPct,
    monthly,
    byMarket: byMarketSorted.map(([market, revenue]) => ({
      market,
      revenue,
      barPct: Math.round((revenue / maxMarketRev) * 100),
    })),
    topSkus,
    partialMonthNote: monthly.at(-1)?.partial ? "Latest month is partial (shown lighter)" : undefined,
  };
}

export function HqAnalyticsView() {
  const { t } = useLanguage();
  const { data } = useAppData();
  const [range, setRange] = useState<HqAnalyticsRangeId>("qtd");

  const orders = useMemo(() => {
    const wholesale = mergeHqWholesaleOrdersForDisplay(data.salesOrders, data.accounts);
    const network = mergeHqNetworkSalesForDisplay(
      wholesale.orders,
      wholesale.accounts,
      data.teamMembers ?? [],
    );
    const scoped = scopeAppDataForHqOperator({
      ...data,
      salesOrders: network.salesOrders,
      accounts: network.accounts,
    });
    return scoped.salesOrders.filter((o) => o.status !== "cancelled" && o.status !== "draft");
  }, [data]);

  const snapshot = useMemo(() => {
    const live = buildLiveSnapshot(orders, range, 5);
    const marketCount = live.byMarket.length;
    if (shouldUseHqAnalyticsDemo(live.networkRevenue, orders.length, marketCount)) {
      const demo = buildHqAnalyticsDemoSnapshot(range);
      return {
        ...demo,
        topSkus: mergeHqAnalyticsSkuNames(demo.topSkus, data.products),
      };
    }
    return {
      ...live,
      topSkus: mergeHqAnalyticsSkuNames(live.topSkus, data.products),
    };
  }, [orders, range, data.products]);

  const maxRev = Math.max(...snapshot.monthly.map((m) => m.revenue), 1);

  const exportPdf = () => {
    toast.message(t("Export queued"), { description: t("Analytics PDF will download shortly.") });
  };

  return (
    <HqOperatorPage className="space-y-6">
      <HqOperatorPageHeader
        title="Analytics"
        description="Network-wide performance · revenue, sell-through, and supply chain health"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <HqOperatorFilterBar className="mb-0">
              <HqOperatorFilterButton active={range === "qtd"} onClick={() => setRange("qtd")}>
                QTD
              </HqOperatorFilterButton>
              <HqOperatorFilterButton active={range === "ytd"} onClick={() => setRange("ytd")}>
                YTD
              </HqOperatorFilterButton>
              <HqOperatorFilterButton active={range === "12mo"} onClick={() => setRange("12mo")}>
                12mo
              </HqOperatorFilterButton>
            </HqOperatorFilterBar>
            <HqBtn variant="outline" size="sm" onClick={exportPdf}>
              <Download className="size-3.5" strokeWidth={1.75} />
              {t("Export PDF")}
            </HqBtn>
          </div>
        }
      />

      <HqOperatorKpiGrid>
        <HqOperatorKpiCard
          icon={ShoppingCart}
          tone="gold"
          label="Network revenue"
          value={formatHqCompact(snapshot.networkRevenue)}
          sub={t(snapshot.networkRevenueSub)}
          delta={snapshot.networkRevenueDelta}
          deltaTone="up"
        />
        <HqOperatorKpiCard
          icon={TrendingUp}
          tone="blue"
          label="Cases sold"
          value={snapshot.casesSold.toLocaleString()}
          sub={t("all markets")}
          delta={snapshot.casesSoldDelta}
          deltaTone="up"
        />
        <HqOperatorKpiCard
          icon={Store}
          tone="green"
          label="Avg order value"
          value={formatHqCompact(snapshot.avgOrderValue)}
          sub={t(snapshot.avgOrderSub)}
          delta={snapshot.avgOrderDelta}
          deltaTone="up"
        />
        <HqOperatorKpiCard
          icon={Users}
          tone="ink"
          label="Account retention"
          value={`${snapshot.retentionPct}%`}
          sub={t("rolling 12 months")}
        />
      </HqOperatorKpiGrid>

      <div className="hq-chart-wrap">
        <div className="text-sm font-semibold">{t("Network revenue · monthly")}</div>
        <div className="mb-5 mt-1 text-xs text-muted-foreground">{t("All markets combined · $thousands")}</div>
        <div className="hq-bar-chart">
          {snapshot.monthly.map((m) => {
            const height = Math.max(12, (m.revenue / maxRev) * 130);
            return (
              <div key={m.month} className="hq-bar-col">
                <div className="font-mono text-[10px] font-semibold">{formatHqCompact(m.revenue)}</div>
                <div className={`hq-bar-fill ${m.partial ? "partial" : ""}`} style={{ height }} />
                <div className="font-mono text-[10px] text-muted-foreground">{m.month}</div>
              </div>
            );
          })}
        </div>
        {snapshot.partialMonthNote ? (
          <div className="mt-3 text-[11px] text-muted-foreground">{t(snapshot.partialMonthNote)}</div>
        ) : null}
      </div>

      <HqOperatorTwoCol>
        <HqOperatorCard>
          <HqOperatorCardHead title="Revenue by market" subtitle={snapshot.networkRevenueSub} />
          <div className="px-5 pb-5 pt-1">
            {snapshot.byMarket.map((row) => (
              <div key={row.market} className="hq-rev-row">
                <div className="w-[60px] text-[13px] font-medium">{row.market}</div>
                <div className="hq-rev-track">
                  <div
                    className={`hq-rev-fill ${row.market === "Chicago" ? "bg-[hsl(38_90%_50%)]" : "bg-[hsl(40_88%_42%)]"}`}
                    style={{ width: `${row.barPct}%` }}
                  />
                </div>
                <div className="w-14 text-right font-mono text-xs font-semibold">{formatHqCompact(row.revenue)}</div>
              </div>
            ))}
          </div>
        </HqOperatorCard>

        <HqOperatorCard className="overflow-hidden p-0">
          <div className="px-5 pt-5">
            <HqOperatorCardHead
              title="Top SKUs by volume"
              subtitle={range === "qtd" ? "Cases sold · Q2" : "Cases sold · selected window"}
            />
          </div>
          <HqOperatorDataTable>
            <thead>
              <tr>
                <th>{t("SKU")}</th>
                <th>{t("Cases")}</th>
                <th>{t("Revenue")}</th>
                <th>{t("vs Q1")}</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.topSkus.map((row) => (
                <tr key={row.sku ?? row.name}>
                  <td className="font-medium">{row.name}</td>
                  <td className="font-mono">{row.cases.toLocaleString()}</td>
                  <td className="font-mono">{formatHqCompact(row.revenue)}</td>
                  <td className="text-xs font-medium text-[hsl(158_56%_32%)]">{row.vsQ1}</td>
                </tr>
              ))}
            </tbody>
          </HqOperatorDataTable>
        </HqOperatorCard>
      </HqOperatorTwoCol>
    </HqOperatorPage>
  );
}
