import { Link, useNavigate } from "react-router-dom";
import {
  distributorFulfillmentEditPath,
  distributorShipmentEditPath,
} from "@/lib/distributor-fulfillment-links";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { DistributorPartnerHero } from "@/components/distributor/DistributorPartnerHero";
import {
  DistributorAlertBar,
  DistributorCard,
  DistributorCardHead,
  DistributorKpiCard,
  DistributorKpiGrid,
  DistributorPage,
  DistributorPageHeader,
  DistributorSectionHead,
  DistributorTwoCol,
} from "@/components/distributor/DistributorUi";
import { useAppData, usePurchaseOrders, useSalesOrders } from "@/contexts/AppDataContext";
import { useShipmentsAutoRefresh } from "@/hooks/useShipmentsAutoRefresh";
import { useAuth } from "@/contexts/AuthContext";
import { computeInventorySummary, deriveAlerts } from "@/lib/hajime-metrics";
import { shipmentLineContentsLabel } from "@/lib/order-lines";
import { getMyWarehouseOptions, updateMyPrimaryWarehouse } from "@/lib/api-v1-mutations";
import type { Warehouse } from "@/types/app-data";
import { toast } from "@/components/ui/sonner";
import { DistributorSkeleton } from "@/components/skeletons";
import {
  AlertTriangle,
  BarChart3,
  FileText,
  Package,
  Star,
  Truck,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { portalTimeGreeting } from "@/lib/i18n-portal";

function warehousesFromApiRows(rows: Record<string, unknown>[]): Warehouse[] {
  return rows.map((row) => {
    const lt = row.linked_team_member_id;
    const la = row.linked_account_id;
    return {
      id: String(row.id ?? ""),
      name: String(row.name ?? "").trim(),
      isActive: row.is_active !== false,
      sortOrder: Number(row.sort_order ?? 0),
      ...(lt ? { linkedTeamMemberId: String(lt) } : {}),
      ...(la ? { linkedAccountId: String(la) } : {}),
    };
  });
}

function greetingName(displayName: string): string {
  const first = displayName.trim().split(/\s+/)[0];
  return first || "there";
}

type StockRow = {
  sku: string;
  name: string;
  avail: number;
  threshold: number;
  tone: "low" | "med" | "ok";
};

const toneColor = {
  low: "text-[hsl(0_68%_44%)]",
  med: "text-[hsl(38_90%_40%)]",
  ok: "text-[hsl(158_56%_32%)]",
} as const;

const toneLabel = {
  low: "Below reorder point",
  med: "Monitor stock",
  ok: "Available",
} as const;

export default function DistributorHomePage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, updateData, refreshTeamMembers, refreshShipments } = useAppData();
  const { purchaseOrders } = usePurchaseOrders();
  const { salesOrders } = useSalesOrders();
  const [warehouseOptions, setWarehouseOptions] = useState<{ id: string; name: string }[]>([]);
  const [primarySaving, setPrimarySaving] = useState(false);
  const [urgentDismissed, setUrgentDismissed] = useState(false);

  const inv = useMemo(() => computeInventorySummary(data.inventory, data.purchaseOrders), [data.inventory, data.purchaseOrders]);
  const alerts = useMemo(() => deriveAlerts(data), [data]);

  const openPurchaseOrders = useMemo(
    () => purchaseOrders.filter((p) => p.status !== "delivered" && p.status !== "cancelled"),
    [purchaseOrders],
  );

  const awaitingFulfillment = useMemo(
    () => salesOrders.filter((o) => o.status === "confirmed" || o.status === "packed"),
    [salesOrders],
  );

  const inTransitOrders = useMemo(
    () => salesOrders.filter((o) => o.status === "shipped"),
    [salesOrders],
  );

  const activeShipments = useMemo(
    () => data.shipments.filter((s) => s.status !== "delivered"),
    [data.shipments],
  );

  const stockSnapshot = useMemo((): StockRow[] => {
    const safety = data.operationalSettings?.safetyStockBySku ?? {};
    const defaultSafety = 120;
    const bySku: Record<string, { avail: number; name: string }> = {};
    for (const row of data.inventory) {
      if (row.locationType !== "distributor_warehouse" || row.status !== "available") continue;
      const cur = bySku[row.sku] ?? { avail: 0, name: row.productName };
      cur.avail += row.quantityBottles;
      bySku[row.sku] = cur;
    }
    const rows: StockRow[] = Object.entries(bySku).map(([sku, v]) => {
      const threshold = safety[sku] ?? defaultSafety;
      const tone: StockRow["tone"] =
        v.avail < threshold * 0.5 ? "low" : v.avail < threshold ? "med" : "ok";
      return { sku, name: v.name, avail: v.avail, threshold, tone };
    });
    return rows
      .sort((a, b) => {
        const order = { low: 0, med: 1, ok: 2 };
        return order[a.tone] - order[b.tone] || a.avail - b.avail;
      })
      .slice(0, 5);
  }, [data.inventory, data.operationalSettings?.safetyStockBySku]);

  const urgentOrder = awaitingFulfillment[0];
  const urgentAlert = alerts.find((a) => a.severity === "high") ?? alerts[0];

  const myCrmRow = useMemo(() => {
    const em = user?.email?.trim().toLowerCase();
    if (!em) return undefined;
    return (data.teamMembers ?? []).find((m) => m.email?.toLowerCase() === em);
  }, [data.teamMembers, user?.email]);

  const selectedPrimaryWarehouseId = myCrmRow?.primaryWarehouseId ?? "";

  const stableRefreshShipments = useCallback(() => refreshShipments(), [refreshShipments]);
  useShipmentsAutoRefresh(stableRefreshShipments, !loading);

  useEffect(() => {
    if (user?.role !== "distributor") return;
    let cancelled = false;
    (async () => {
      try {
        const res = (await getMyWarehouseOptions()) as { data?: { id: string; name: string }[] };
        const rows = Array.isArray(res.data) ? res.data : [];
        if (!cancelled) setWarehouseOptions(rows);
      } catch {
        if (!cancelled) setWarehouseOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  useEffect(() => {
    const el = document.querySelector("[data-distributor-scroll]");
    if (!el || !window.location.hash) return;
    const id = window.location.hash.slice(1);
    const target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [loading]);

  const onPrimaryWarehouseChange = async (warehouseId: string) => {
    if (user?.role !== "distributor") return;
    const next = warehouseId === "__none__" ? null : warehouseId;
    setPrimarySaving(true);
    try {
      const res = (await updateMyPrimaryWarehouse(next)) as {
        data?: { team_member?: Record<string, unknown>; warehouses?: Record<string, unknown>[] };
      };
      const payload = res.data;
      if (payload?.warehouses?.length) {
        updateData((d) => ({
          ...d,
          warehouses: warehousesFromApiRows(payload.warehouses ?? []),
        }));
      }
      await refreshTeamMembers();
      await refreshShipments();
      toast.success(next ? "Receiving warehouse updated" : "Receiving warehouse cleared", {
        description: next
          ? "Your depot selection is saved and visible to Hajime HQ."
          : "You can pick a depot again anytime.",
      });
    } catch (e) {
      toast.error("Could not save warehouse", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setPrimarySaving(false);
    }
  };

  if (loading) {
    return <DistributorSkeleton />;
  }

  const lowSkuCount = stockSnapshot.filter((s) => s.tone === "low").length;
  const subtitleParts = [
    openPurchaseOrders.length > 0
      ? t("{{count}} open POs from HQ", { count: openPurchaseOrders.length })
      : null,
    awaitingFulfillment.length > 0
      ? t("{{count}} orders in pick & pack", { count: awaitingFulfillment.length })
      : null,
    lowSkuCount > 0 ? t("{{count}} SKUs below threshold", { count: lowSkuCount }) : null,
  ].filter(Boolean);

  return (
    <DistributorPage key={language} className="space-y-7">
      <DistributorPageHeader
        rawTitle
        rawDescription
        title={`${portalTimeGreeting(t)}, ${greetingName(user?.displayName ?? "there")}.`}
        description={
          subtitleParts.length > 0
            ? subtitleParts.join(" · ")
            : t("Floor is clear — inventory, fulfillment, and shipments are in good shape.")
        }
        actions={
          <>
            <Link to="/distributor/reports" className="dist-btn dist-btn-outline dist-btn-sm no-underline">
              {t("Q2 report")}
            </Link>
            <Link to="/distributor/inventory" className="dist-btn dist-btn-ink dist-btn-sm no-underline">
              {t("Inventory check")}
            </Link>
          </>
        }
      />

      {!urgentDismissed && (urgentOrder || urgentAlert) ? (
        <DistributorAlertBar
          variant="error"
          actions={
            <>
              <button type="button" className="dist-btn dist-btn-outline dist-btn-sm" onClick={() => setUrgentDismissed(true)}>
                {t("Dismiss")}
              </button>
              <Link to="/distributor/pick-pack" className="dist-btn dist-btn-accent dist-btn-sm no-underline">
                {t("Start pick")}
              </Link>
            </>
          }
        >
          <AlertTriangle className="mb-1 inline size-4 text-[hsl(0_68%_44%)]" strokeWidth={1.75} />
          {urgentOrder ? (
            t("Urgent — {{id}} for {{account}} requires pick while status is {{status}}.", {
              id: urgentOrder.id,
              account: urgentOrder.account,
              status: t(urgentOrder.status === "confirmed" ? "confirmed" : urgentOrder.status.replace(/-/g, " ")),
            })
          ) : (
            <>
              <strong className="text-[hsl(0_68%_36%)]">{t("Attention")}</strong> — {urgentAlert?.message}
            </>
          )}
        </DistributorAlertBar>
      ) : null}

      <DistributorKpiGrid>
        <DistributorKpiCard
          icon={FileText}
          tone="gold"
          label="Open POs"
          value={String(openPurchaseOrders.length)}
          sub={openPurchaseOrders.length ? "Inbound from Hajime HQ" : "No open production requests"}
          to="/distributor/purchase-orders"
        />
        <DistributorKpiCard
          icon={Truck}
          tone="green"
          label="In motion"
          value={String(activeShipments.length)}
          sub="Active shipments"
          to="/distributor/shipments"
        />
        <DistributorKpiCard
          icon={BarChart3}
          tone="blue"
          label="Available stock"
          value={inv.available.toLocaleString()}
          sub="bottles ready to allocate"
          to="/distributor/inventory"
        />
        <DistributorKpiCard
          icon={Star}
          tone="ink"
          label="Pick queue"
          value={String(awaitingFulfillment.length)}
          sub={awaitingFulfillment.length ? "Confirmed / packed orders" : "Nothing awaiting pick"}
          to="/distributor/pick-pack"
        />
      </DistributorKpiGrid>

      <div id="partner-program">
        <DistributorPartnerHero />
      </div>

      {user?.role === "distributor" ? (
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-[var(--shadow-soft)]">
          <div className="mb-3 flex items-center gap-2">
            <Warehouse className="size-5 text-accent" strokeWidth={1.5} />
            <h3 className="font-display text-base font-semibold">{t("Your receiving warehouse")}</h3>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">
            {t("Choose which Hajime depot you operate from — HQ uses this to route inbound stock and shipments.")}
          </p>
          <div className="max-w-md space-y-2">
            <Label htmlFor="dist-primary-wh">{t("Primary depot")}</Label>
            <Select
              value={selectedPrimaryWarehouseId || "__none__"}
              onValueChange={(v) => void onPrimaryWarehouseChange(v)}
              disabled={primarySaving || warehouseOptions.length === 0}
            >
              <SelectTrigger id="dist-primary-wh" className="touch-manipulation">
                <SelectValue placeholder={warehouseOptions.length === 0 ? t("Loading depots…") : t("Select depot")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t("None selected")}</SelectItem>
                {warehouseOptions.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : null}

      <DistributorTwoCol>
        <DistributorCard>
          <DistributorCardHead
            title="Open purchase orders"
            subtitle="Received from Hajime HQ"
            actions={
              <Link to="/distributor/purchase-orders" className="dist-btn dist-btn-outline dist-btn-sm no-underline">
                {t("All POs")}
              </Link>
            }
          />
          {openPurchaseOrders.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">{t("No open purchase orders")}</p>
          ) : (
            openPurchaseOrders.slice(0, 5).map((po) => (
              <Link
                key={po.id}
                to={`/distributor/purchase-orders?po=${encodeURIComponent(po.id)}`}
                className="flex items-center gap-3.5 border-b border-border/40 px-5 py-3.5 transition-colors last:border-b-0 hover:bg-muted/40 no-underline"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[11px] text-muted-foreground">{po.id}</p>
                  <p className="text-[13px] font-medium text-foreground">{po.marketDestination}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {po.sku} · {po.quantity.toLocaleString()} btl
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium text-muted-foreground">{po.requiredDate || po.requestedShipDate}</p>
                  <div className="mt-1">
                    <StatusBadge status={po.status} size="xs" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </DistributorCard>

        <DistributorCard>
          <DistributorCardHead
            title="Inventory snapshot"
            subtitle="Critical SKUs at your warehouse"
            actions={
              <Link to="/distributor/inventory" className="dist-btn dist-btn-outline dist-btn-sm no-underline">
                {t("Full inventory")}
              </Link>
            }
          />
          {stockSnapshot.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">{t("No distributor warehouse stock rows")}</p>
          ) : (
            stockSnapshot.map((row) => (
              <Link
                key={row.sku}
                to="/distributor/inventory"
                className="flex items-center gap-3 border-b border-border/40 px-5 py-3 transition-colors last:border-b-0 hover:bg-muted/40 no-underline"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-foreground">{row.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{row.sku}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={cn("font-mono text-[13px] font-semibold tabular-nums", toneColor[row.tone])}>
                    {row.avail.toLocaleString()} {t("avail")}
                  </p>
                  <p className={cn("text-[10px] font-semibold", toneColor[row.tone])}>{t(toneLabel[row.tone])}</p>
                </div>
              </Link>
            ))
          )}
        </DistributorCard>
      </DistributorTwoCol>

      <div id="delivery-schedule" className="scroll-mt-6 space-y-3.5">
        <DistributorSectionHead title="Active shipments" linkLabel="All shipments →" linkTo="/distributor/shipments" />
        <DistributorCard>
          <div className="overflow-x-auto">
            <table className="dist-data-table w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border/50 bg-muted/50">
                  {["Tracking", "Route", "Contents", "ETA", "Status"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
                    >
                      {t(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(activeShipments.length ? activeShipments : data.shipments).slice(0, 6).map((s) => (
                  <tr
                    key={s.id}
                    className="cursor-pointer border-b border-border/40 transition-colors last:border-b-0 hover:bg-muted/30"
                    onClick={() => navigate(distributorShipmentEditPath(s, salesOrders))}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-accent">{s.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{s.destination}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.origin} → {s.destination}
                      </p>
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-xs text-muted-foreground">
                      {shipmentLineContentsLabel(s) || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">{s.eta}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status} size="xs" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DistributorCard>

        <DistributorSectionHead title="Delivery schedule" linkLabel="Full tracker →" linkTo="/distributor/shipments" />
        <div className="space-y-2">
          {activeShipments.slice(0, 6).map((s) => (
            <Link
              key={`sched-${s.id}`}
              to={distributorShipmentEditPath(s, salesOrders)}
              className="flex flex-col gap-2 rounded-[10px] border border-border/60 bg-card px-4 py-3 shadow-[var(--shadow-soft)] no-underline text-inherit transition-shadow hover:shadow-[var(--shadow-lifted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:gap-3.5"
            >
              <p className="w-20 shrink-0 font-mono text-xs font-medium text-muted-foreground">{t("ETA")}</p>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium">{s.destination}</p>
                <p className="text-xs text-muted-foreground">{shipmentLineContentsLabel(s) || s.origin}</p>
              </div>
              <p className="font-mono text-[11px] text-muted-foreground">{s.id}</p>
              <StatusBadge status={s.status === "delivered" ? "delivered" : "confirmed"} size="xs" />
            </Link>
          ))}
          {activeShipments.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
              {t("No upcoming deliveries in motion")}
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-[var(--shadow-soft)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Package className="size-5 text-accent" strokeWidth={1.5} />
            <h3 className="font-display text-base font-semibold">{t("Orders awaiting fulfillment")}</h3>
          </div>
          <Button variant="secondary" size="sm" asChild>
            <Link to="/distributor/backorders">{t("Backorder desk")}</Link>
          </Button>
        </div>
        {awaitingFulfillment.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("No orders in pick/pack stage")}</p>
        ) : (
          <div className="space-y-2">
            {awaitingFulfillment.slice(0, 6).map((o) => (
              <Link
                key={o.id}
                to={distributorFulfillmentEditPath(o)}
                className="flex flex-col gap-1 rounded-lg border border-border/50 px-3 py-2 no-underline text-inherit transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="font-mono text-xs">{o.id}</span>
                  <p className="font-medium">{o.account}</p>
                  <p className="text-xs text-muted-foreground">{o.market}</p>
                </div>
                <StatusBadge status={o.status} />
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-[var(--shadow-soft)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Truck className="size-5 text-accent" strokeWidth={1.5} />
            <h3 className="font-display text-base font-semibold">{t("Orders in transit")}</h3>
          </div>
          <Button variant="secondary" size="sm" asChild>
            <Link to="/distributor/orders?tab=distributor">{t("All in transit")}</Link>
          </Button>
        </div>
        {inTransitOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("No shipped orders awaiting delivery confirmation")}</p>
        ) : (
          <div className="space-y-2">
            {inTransitOrders.slice(0, 6).map((o) => (
              <Link
                key={o.id}
                to={distributorFulfillmentEditPath(o)}
                className="flex flex-col gap-1 rounded-lg border border-border/50 px-3 py-2 no-underline text-inherit transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="font-mono text-xs">{o.id}</span>
                  <p className="font-medium">{o.account}</p>
                  <p className="text-xs text-muted-foreground">{o.market}</p>
                </div>
                <StatusBadge status={o.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </DistributorPage>
  );
}
