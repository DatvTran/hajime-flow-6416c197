import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Box,
  Factory,
  ShoppingCart,
  Star,
  Store,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { useAppData, usePurchaseOrders, useSalesOrders } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  computeInventorySummary,
  countActiveMarkets,
  revenueInWindow,
} from "@/lib/hajime-metrics";
import {
  computeMarketPanelRows,
  computeBrandOperatorTopAccounts,
} from "@/lib/brand-operator-metrics";
import { scopeAppDataForHqOperator, filterWholesaleOrdersForHq } from "@/lib/hq-order-scope";
import { portalTimeGreeting } from "@/lib/i18n-portal";
import {
  HqBtnLink,
  HqOperatorAlertBar,
  HqOperatorCard,
  HqOperatorCardHead,
  HqOperatorKpiCard,
  HqOperatorKpiGrid,
  HqOperatorMarketCard,
  HqOperatorPage,
  HqOperatorPageHeader,
  HqOperatorPill,
  HqOperatorSectionHead,
  HqOperatorSrcChip,
  HqOperatorTwoCol,
} from "@/components/hq/HqOperatorUi";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

function greetingName(displayName: string | undefined): string {
  const first = displayName?.trim().split(/\s+/)[0];
  return first || "there";
}

function coverTone(days: number | null): "low" | "med" | "ok" {
  if (days == null || days <= 0) return "low";
  if (days < 21) return "low";
  if (days < 30) return "med";
  return "ok";
}

function healthPill(h: "healthy" | "watch" | "low"): { tone: "green" | "amber" | "red"; label: string } {
  if (h === "healthy") return { tone: "green", label: "healthy" };
  if (h === "watch") return { tone: "amber", label: "monitor" };
  return { tone: "red", label: "low stock" };
}

export default function HqOperatorDashboard() {
  const { data } = useAppData();
  const { purchaseOrders } = usePurchaseOrders();
  const { salesOrders } = useSalesOrders();
  const { user } = useAuth();
  const { t } = useLanguage();

  const commandData = useMemo(() => scopeAppDataForHqOperator(data), [data]);

  const openProduction = useMemo(
    () =>
      purchaseOrders.filter(
        (p) =>
          p.poType !== "sales" &&
          p.status !== "delivered" &&
          p.status !== "completed" &&
          p.status !== "shipped",
      ),
    [purchaseOrders],
  );

  const wholesaleOrders = useMemo(
    () => filterWholesaleOrdersForHq(salesOrders, commandData.accounts),
    [salesOrders, commandData.accounts],
  );

  const pendingReplen = useMemo(
    () => wholesaleOrders.filter((o) => o.status === "draft").length,
    [wholesaleOrders],
  );

  const inventorySummary = useMemo(
    () => computeInventorySummary(commandData.inventory, commandData.purchaseOrders),
    [commandData.inventory, commandData.purchaseOrders],
  );

  const marketRows = useMemo(() => computeMarketPanelRows(commandData, 30), [commandData]);
  const activeAccounts = useMemo(
    () => commandData.accounts.filter((a) => a.status === "active" && (a.type === "retail" || a.type === "distributor")).length,
    [commandData.accounts],
  );

  const revQ = useMemo(() => revenueInWindow(commandData.salesOrders, 90), [commandData.salesOrders]);
  const revPriorQ = useMemo(() => {
    const now = Date.now();
    const mid = now - 90 * 86400000;
    const start = mid - 90 * 86400000;
    return commandData.salesOrders
      .filter((o) => {
        const ts = Date.parse(o.orderDate);
        return !Number.isNaN(ts) && ts >= start && ts < mid && o.status !== "cancelled" && o.status !== "draft";
      })
      .reduce((s, o) => s + o.price, 0);
  }, [commandData.salesOrders]);

  const revDelta = revPriorQ > 0 ? Math.round(((revQ - revPriorQ) / revPriorQ) * 100) : 0;

  const lowCoverMarket = marketRows.find((m) => m.health === "low") ?? marketRows.find((m) => m.health === "watch");

  const topMarkets = marketRows.slice(0, 3);

  const distributorCount = useMemo(
    () => commandData.accounts.filter((a) => a.type === "distributor").length,
    [commandData.accounts],
  );

  const pipelineValue = useMemo(() => {
    return wholesaleOrders
      .filter((o) => o.status !== "cancelled" && o.status !== "delivered")
      .reduce((s, o) => s + o.price, 0);
  }, [wholesaleOrders]);

  const topAccounts = useMemo(
    () => computeBrandOperatorTopAccounts(commandData.salesOrders, commandData.accounts).slice(0, 3),
    [commandData.salesOrders, commandData.accounts],
  );

  const greeting = portalTimeGreeting(t);

  return (
    <HqOperatorPage className="space-y-7">
      <HqOperatorPageHeader
        rawTitle
        title={`${greeting}, ${greetingName(user?.displayName)}.`}
        rawDescription
        description={
          pendingReplen > 0 || openProduction.length > 0
            ? `${openProduction.length} production request${openProduction.length !== 1 ? "s" : ""} waiting on your sign-off.${lowCoverMarket ? ` ${lowCoverMarket.label} is at ${lowCoverMarket.daysCover ?? "—"} days cover and needs a production decision.` : ""} Order fulfillment runs at the distributor level — everything else across the network is healthy.`
            : "Network overview — production, replenishment, markets, and downstream sell-through in one command view."
        }
        actions={
          <>
            <HqBtnLink to="/reports" variant="outline">
              {t("Full analytics")}
            </HqBtnLink>
            <HqBtnLink to="/purchase-orders" variant="ink">
              {t("Review production")}
            </HqBtnLink>
          </>
        }
      />

      {lowCoverMarket ? (
        <HqOperatorAlertBar
          variant="error"
          actions={
            <>
              <HqBtnLink to="/markets" variant="outline" size="sm">
                {t("View market")}
              </HqBtnLink>
              <HqBtnLink to="/purchase-orders" variant="accent" size="sm">
                {t("Approve production")}
              </HqBtnLink>
            </>
          }
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[hsl(0_68%_44%)]" strokeWidth={1.75} />
            <span>
              <strong className="text-[hsl(0_68%_36%)]">{lowCoverMarket.label} at {lowCoverMarket.daysCover ?? "—"} days cover</strong>
              <span className="text-[hsl(30_70%_35%)]"> — below the 21-day floor. Review open production requests to rebuild allocation.</span>
            </span>
          </div>
        </HqOperatorAlertBar>
      ) : null}

      <HqOperatorKpiGrid>
        <HqOperatorKpiCard
          icon={ShoppingCart}
          tone="gold"
          label="Network revenue Q2"
          value={`$${Math.round(revQ / 1000)}K`}
          sub={`across ${countActiveMarkets(commandData.salesOrders, 90)} live markets`}
          delta={
            <>
              <TrendingUp className="size-2.5" strokeWidth={2} /> {revDelta >= 0 ? "+" : ""}
              {revDelta}% vs prior quarter
            </>
          }
          deltaTone={revDelta >= 0 ? "up" : "down"}
        />
        <HqOperatorKpiCard
          icon={Factory}
          tone="red"
          label="Production requests"
          value={String(openProduction.length)}
          sub={`${openProduction.filter((p) => p.status === "delayed").length} urgent · rebuilds allocation`}
          to="/purchase-orders"
        />
        <HqOperatorKpiCard
          icon={Box}
          tone="blue"
          label="Network inventory"
          value={`${Math.round(inventorySummary.totalOnHand / 12).toLocaleString()} cs`}
          sub={`across ${distributorCount} distributor DCs`}
          to="/inventory"
        />
        <HqOperatorKpiCard
          icon={Users}
          tone="green"
          label="Active accounts"
          value={String(activeAccounts)}
          sub="onboarded across network"
          delta={
            <>
              <TrendingUp className="size-2.5" strokeWidth={2} /> 92% retention
            </>
          }
          deltaTone="up"
          to="/accounts"
        />
      </HqOperatorKpiGrid>

      <HqOperatorSectionHead title="Supply chain — live" hint="Click any node to manage that portal" />

      <div className="hq-flow-card">
        <div className="hq-flow-row flex flex-wrap items-stretch justify-between gap-y-6 lg:flex-nowrap">
          {[
            {
              to: "/manufacturer/profiles",
              icon: Factory,
              color: "text-[hsl(280_40%_48%)]",
              name: "Manufacturers",
              meta: `${commandData.accounts.filter((a) => a.type === "manufacturer").length} kura · batches brewing`,
              count: `${openProduction.length} requests open`,
              countStyle: "bg-[hsl(280_40%_50%/0.1)] text-[hsl(280_40%_48%)]",
            },
            {
              to: "/",
              icon: Star,
              color: "text-[hsl(40_88%_38%)]",
              iconBg: "bg-[hsl(40_88%_42%/0.06)] border-[hsl(40_88%_42%/0.3)]",
              name: "Hajime HQ",
              meta: `You · ${openProduction.length} production sign-offs`,
              count: "command center",
              countStyle: "bg-[hsl(40_88%_42%/0.12)] text-[hsl(40_88%_34%)]",
            },
            {
              to: "/accounts",
              icon: Truck,
              color: "text-[hsl(158_56%_30%)]",
              name: "Distributors",
              meta: `${distributorCount} partners · approve orders`,
              count: `${Math.round(inventorySummary.totalOnHand / 12).toLocaleString()} cs stock`,
              countStyle: "bg-[hsl(158_56%_36%/0.1)] text-[hsl(158_56%_30%)]",
            },
            {
              to: "/accounts?view=sales",
              icon: Users,
              color: "text-[hsl(215_72%_42%)]",
              name: "Sales reps",
              meta: "via distributors · read-only",
              count: `$${Math.round(pipelineValue / 1000)}K pipeline`,
              countStyle: "bg-[hsl(215_72%_50%/0.1)] text-[hsl(215_72%_42%)]",
            },
            {
              to: "/accounts?view=sales",
              icon: Store,
              color: "text-[hsl(40_88%_36%)]",
              name: "Retail accounts",
              meta: "via distributors · read-only",
              count: `$${Math.round(revQ / 1000)}K Q2`,
              countStyle: "bg-[hsl(40_88%_42%/0.1)] text-[hsl(40_88%_34%)]",
            },
          ].map((node, i, arr) => (
            <div key={node.name} className="flex flex-1 items-center gap-0 min-w-[120px]">
              <Link to={node.to} className="hq-flow-node flex flex-1 flex-col items-center px-2 text-center no-underline">
                <div
                  className={cn(
                    "hq-flow-icon flex size-[54px] items-center justify-center rounded-[14px] border border-border/60 bg-card",
                    node.color,
                    node.iconBg,
                  )}
                >
                  <node.icon className="size-6" strokeWidth={1.75} />
                </div>
                <div className="mt-2.5 text-[13px] font-semibold text-foreground">{t(node.name)}</div>
                <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{t(node.meta)}</div>
                <div className={cn("mt-1.5 rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold", node.countStyle)}>
                  {node.count}
                </div>
              </Link>
              {i < arr.length - 1 ? (
                <ArrowRight className="hidden size-[22px] shrink-0 text-border lg:block" strokeWidth={1.75} />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <HqOperatorTwoCol>
        <HqOperatorCard>
          <HqOperatorCardHead
            title="Production requests"
            subtitle="From kura partners — your sign-off"
            actions={
              <HqBtnLink to="/purchase-orders" variant="outline" size="sm">
                {t("View all")} ({openProduction.length})
              </HqBtnLink>
            }
          />
          {openProduction.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">{t("No open production requests")}</div>
          ) : (
            openProduction.slice(0, 4).map((po) => (
              <Link
                key={po.id}
                to={`/purchase-orders?po=${po.id}`}
                className="flex items-center gap-3 border-b border-border/40 px-5 py-3.5 transition-colors last:border-b-0 hover:bg-muted/40 no-underline"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <HqOperatorSrcChip variant="kura">{t("Kura")}</HqOperatorSrcChip>
                    {po.status === "delayed" ? <HqOperatorPill tone="red">{t("urgent")}</HqOperatorPill> : null}
                  </div>
                  <div className="mt-1 text-[13px] font-medium text-foreground">
                    {po.quantity}× {po.sku}
                  </div>
                  <div className="mt-px text-[11px] text-muted-foreground">
                    {po.id} · {po.manufacturer} · {po.marketDestination ?? "—"}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[13px] font-semibold">{po.quantity} cs</div>
                </div>
              </Link>
            ))
          )}
        </HqOperatorCard>

        <HqOperatorCard>
          <HqOperatorCardHead title="Network activity" subtitle="Real-time across all portals" />
          <div className="px-5 py-2">
            {topAccounts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t("No recent activity")}</p>
            ) : (
              topAccounts.map((acct, i) => (
                <div key={acct.name} className="hq-feed-row">
                  <div className={cn("hq-feed-ic", i === 0 ? "fi-gold" : i === 1 ? "fi-blue" : "fi-green")}>
                    <Store className="size-3.5" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium">{acct.name}</div>
                    <div className="mt-px text-[11px] text-muted-foreground">
                      {acct.city} · ${Math.round(acct.monthlyValue / 1000)}K 30d
                    </div>
                  </div>
                  <div className="shrink-0 font-mono text-[11px] text-muted-foreground">{acct.lastOrderDate}</div>
                </div>
              ))
            )}
          </div>
        </HqOperatorCard>
      </HqOperatorTwoCol>

      <HqOperatorSectionHead title="Markets" linkLabel="Manage allocation →" linkTo="/markets" />

      <div className="hq-markets-grid grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {topMarkets.map((m) => {
          const pill = healthPill(m.health);
          const tone = coverTone(m.daysCover);
          return (
            <HqOperatorMarketCard
              key={m.label}
              name={m.label}
              sub={`${m.sold30dCases} cs sold · ${m.stockCases} cs on hand`}
              coverLabel={m.daysCover != null ? `${m.daysCover} days cover` : t("Not yet live")}
              revenue={`${m.sold30dCases} cs`}
              coverPct={m.daysCover != null ? Math.min(100, (m.daysCover / 50) * 100) : 0}
              coverTone={tone}
              statusTone={pill.tone}
              statusLabel={pill.label}
              to="/markets"
            />
          );
        })}
      </div>
    </HqOperatorPage>
  );
}
