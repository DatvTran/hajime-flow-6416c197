import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Check, Package } from "lucide-react";
import { DistributorPill } from "@/components/distributor/DistributorPill";
import { DistributorSkeleton } from "@/components/skeletons";
import { useAccounts, useAppData, useSalesOrders } from "@/contexts/AppDataContext";
import {
  buildPickLines,
  deliveryRowsFromOrder,
  formatCasesTotal,
  orderPoRef,
  parseDueDate,
  queuePill,
  readCheckedKeys,
  readPickingSessionActive,
  sortPickQueue,
  writeCheckedKeys,
  writePickingSessionActive,
} from "@/lib/distributor-pick-pack";
import { distributorFulfillmentEditPath } from "@/lib/distributor-fulfillment-links";
import { findSalesOrderByRef } from "@/lib/sales-order-api-id";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  formatActivePoMetaI18n,
  formatQueueDueI18n,
} from "@/lib/i18n-portal";
import { DistributorPage, DistributorPageHeader } from "@/components/distributor/DistributorUi";
export default function DistributorPickPackPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { loading, data, refreshSalesOrders } = useAppData();
  const { salesOrders, patchSalesOrder } = useSalesOrders();
  const { accounts } = useAccounts();
  const [searchParams, setSearchParams] = useSearchParams();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [pickingActive, setPickingActive] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const pickQueue = useMemo(
    () => sortPickQueue(salesOrders.filter((o) => o.status === "confirmed" || o.status === "packed")),
    [salesOrders],
  );

  useEffect(() => {
    if (loading) return;
    if (pickQueue.length > 0) return;
    void refreshSalesOrders();
  }, [loading, pickQueue.length, refreshSalesOrders]);

  const inTransitOrders = useMemo(
    () => salesOrders.filter((o) => o.status === "shipped"),
    [salesOrders],
  );

  const activeOrderId = searchParams.get("order");
  const activeOrder = useMemo(() => {
    if (pickQueue.length === 0) return null;
    if (activeOrderId) return findSalesOrderByRef(pickQueue, activeOrderId) ?? pickQueue[0];
    return pickQueue[0];
  }, [pickQueue, activeOrderId]);

  useEffect(() => {
    if (!activeOrder || activeOrderId) return;
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.set("order", activeOrder.id);
        return n;
      },
      { replace: true },
    );
  }, [activeOrder, activeOrderId, setSearchParams]);

  const activeAccount = useMemo(
    () =>
      accounts.find(
        (a) =>
          activeOrder &&
          (a.id === activeOrder.accountId ||
            a.tradingName === activeOrder.account ||
            a.legalName === activeOrder.account),
      ),
    [accounts, activeOrder],
  );

  const pickLines = useMemo(
    () => (activeOrder ? buildPickLines(activeOrder, data.inventory, data.products) : []),
    [activeOrder, data.inventory, data.products],
  );

  const totalCases = useMemo(() => pickLines.reduce((sum, pl) => sum + pl.cases, 0), [pickLines]);

  const activePill = useMemo(
    () => (activeOrder ? queuePill(activeOrder) : null),
    [activeOrder],
  );

  const isPackedOrder = activeOrder?.status === "packed";
  const sessionUnlocked = isPackedOrder || pickingActive;

  useEffect(() => {
    if (!activeOrder) {
      setChecked(new Set());
      setPickingActive(false);
      return;
    }
    const stored = readCheckedKeys(activeOrder.id);
    if (activeOrder.status === "packed" && pickLines.length > 0) {
      const all = new Set(pickLines.map((l) => l.key));
      writeCheckedKeys(activeOrder.id, all);
      setChecked(all);
      setPickingActive(true);
      return;
    }
    setChecked(stored);
    setPickingActive(readPickingSessionActive(activeOrder.id));
  }, [activeOrder?.id, activeOrder?.status, pickLines]);

  const startPacking = useCallback(() => {
    if (!activeOrder || isPackedOrder) return;
    writePickingSessionActive(activeOrder.id, true);
    setPickingActive(true);
  }, [activeOrder, isPackedOrder]);

  const toggleLine = useCallback(
    (key: string) => {
      if (!activeOrder || !sessionUnlocked) return;
      setChecked((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        writeCheckedKeys(activeOrder.id, next);
        return next;
      });
    },
    [activeOrder, sessionUnlocked],
  );

  const pickedCount = pickLines.filter((l) => checked.has(l.key)).length;
  const allPicked = pickLines.length > 0 && pickedCount === pickLines.length;

  const selectOrder = useCallback(
    (orderId: string) => {
      const target = findSalesOrderByRef(pickQueue, orderId);
      if (target) {
        if (target.status === "confirmed") {
          writePickingSessionActive(target.id, true);
          setPickingActive(true);
        } else if (target.status === "packed") {
          setPickingActive(true);
        }
      }
      setSearchParams(
        (prev) => {
          const n = new URLSearchParams(prev);
          n.set("order", target?.id ?? orderId);
          return n;
        },
        { replace: true },
      );
    },
    [pickQueue, setSearchParams],
  );

  const goToLogShipment = (orderId: string) => {
    navigate(`/distributor/log-shipment?order=${encodeURIComponent(orderId)}`, {
      state: { fromPickPack: true },
    });
  };

  const handleConfirmPacked = async () => {
    if (!activeOrder) return;
    if (activeOrder.status === "packed") {
      goToLogShipment(activeOrder.id);
      return;
    }
    if (!allPicked) {
      toast.error(t("Check off every line before confirming packed."));
      return;
    }
    setConfirming(true);
    try {
      const result = await patchSalesOrder(activeOrder.id, { status: "packed" }, { requireSync: true });
      if (!result?.success || result.synced !== true) {
        toast.error(t("Could not save packed status"), {
          description:
            result?.error ??
            "Order missing from server — refresh and try again, or ensure the order was created in the database.",
        });
        return;
      }
      await refreshSalesOrders();
      goToLogShipment(activeOrder.id);
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return <DistributorSkeleton />;

  return (
    <DistributorPage>
      <DistributorPageHeader
        title="Pick & pack"
        description="Start a pick session, then check off each item as you pull it from its aisle."
      />

      {activeOrder ? (
        <>
          <div
            className={cn(
              "dist-active-po print:border-border",
              sessionUnlocked && !isPackedOrder && "dist-active-po--live",
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[11px] text-muted-foreground">{t("ACTIVE PO")}</div>
              <div className="mt-0.5 text-base font-semibold">
                {orderPoRef(activeOrder)} · {activeOrder.account}
              </div>
              <div className="mt-0.5 text-[13px] text-muted-foreground">
                {formatActivePoMetaI18n(
                  activeOrder,
                  pickLines.length,
                  totalCases,
                  t,
                  parseDueDate,
                  formatCasesTotal,
                )}
              </div>
            </div>
            <div className="dist-active-po-actions print:hidden">
              {activePill ? <DistributorPill tone={activePill.tone} label={activePill.label} /> : null}
              <label className="dist-btn dist-btn-outline dist-btn-sm relative cursor-pointer">
                {t("Change PO")}
                <select
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label={t("Change active purchase order")}
                  value={activeOrder.id}
                  onChange={(e) => selectOrder(e.target.value)}
                >
                  {pickQueue.map((o) => (
                    <option key={o.id} value={o.id}>
                      {orderPoRef(o)} — {o.account}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className="dist-btn dist-btn-outline dist-btn-sm" onClick={() => window.print()}>
                {t("Print pick list")}
              </button>
              {isPackedOrder ? (
                <button
                  type="button"
                  className="dist-btn dist-btn-green dist-btn-sm"
                  onClick={() => goToLogShipment(activeOrder.id)}
                >
                  {t("Continue to ship →")}
                </button>
              ) : null}
            </div>
          </div>

          <div className="dist-pick-grid">
            <div>
              <div className="dist-card" id="pick-items">
                <div className="dist-card-head">
                  <div>
                    <div className="dist-card-title">{t("Items to pick")}</div>
                    <div className="dist-card-sub mt-0.5">
                      {sessionUnlocked
                        ? t("Tap to check off · auto-saves progress")
                        : t("Press Start packing to unlock items")}
                    </div>
                  </div>
                </div>
                <div className="px-5">
                  {pickLines.map((line) => {
                    const isChecked = checked.has(line.key);
                    const canToggle = sessionUnlocked;
                    return (
                      <div
                        key={line.key}
                        role={canToggle ? "button" : undefined}
                        tabIndex={canToggle ? 0 : undefined}
                        className={cn("pick-item", canToggle ? "cursor-pointer" : "pick-item--locked")}
                        onClick={canToggle ? () => toggleLine(line.key) : undefined}
                        onKeyDown={
                          canToggle
                            ? (e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  toggleLine(line.key);
                                }
                              }
                            : undefined
                        }
                      >
                        <div
                          className={cn(
                            "pick-check",
                            isChecked && "checked",
                            !canToggle && "locked",
                          )}
                          aria-hidden
                        >
                          <Check
                            className={cn("size-3", !isChecked && "pick-check-icon-muted")}
                            strokeWidth={isChecked ? 3 : 2}
                          />
                        </div>
                        <div className="pick-info min-w-0">
                          <div className="pick-name">{line.name}</div>
                          <div className="pick-detail">{line.detail}</div>
                        </div>
                        <div className="pick-count">{line.casesLabel}</div>
                      </div>
                    );
                  })}
                </div>
                {sessionUnlocked ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 px-5 py-4 print:hidden">
                    <div
                      id="pick-prog"
                      className={cn(
                        "text-[13px] font-semibold",
                        allPicked || isPackedOrder
                          ? "text-[hsl(158_56%_32%)]"
                          : "text-muted-foreground",
                      )}
                    >
                      {t("{{picked}} of {{total}} items picked", {
                        picked: pickedCount,
                        total: pickLines.length,
                      })}
                    </div>
                    <button
                      type="button"
                      className="dist-btn dist-btn-green disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={confirming || (!isPackedOrder && !allPicked)}
                      onClick={() => void handleConfirmPacked()}
                    >
                      {t("Confirm packed → log shipment")}
                    </button>
                  </div>
                ) : (
                  <div className="pick-start-panel print:hidden">
                    <div className="pick-start-panel-icon" aria-hidden>
                      <Package className="size-[22px]" strokeWidth={1.75} />
                    </div>
                    <p className="text-sm font-semibold">
                      {t("Ready to pick {{items}} items · {{cases}} cases", {
                        items: pickLines.length,
                        cases: totalCases,
                      })}
                    </p>
                    <p className="max-w-[340px] text-xs text-muted-foreground">
                      {t("Starting locks in this PO and unlocks the pick list so you can check off each line.")}
                    </p>
                    <button
                      type="button"
                      className="dist-btn dist-btn-accent mt-1 gap-2"
                      onClick={startPacking}
                    >
                      <Package className="size-3.5" strokeWidth={2} aria-hidden />
                      {t("Start packing")}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3.5 print:hidden">
              <div className="dist-side-panel">
                <div className="dist-side-panel-title">{t("Delivery details")}</div>
                {deliveryRowsFromOrder(activeOrder, activeAccount).map((row) => (
                  <div key={row.label} className="dist-kv-row">
                    <span className="text-muted-foreground">{t(row.label)}</span>
                    <span className="max-w-[58%] text-right font-medium">{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="dist-side-panel" id="pick-queue">
                <div className="dist-side-panel-title mb-1 border-b-0 pb-0">{t("Pick queue")}</div>
                <p className="pick-queue-hint">{t("Click an order to load it for picking")}</p>
                {pickQueue.map((o) => {
                  const pill = queuePill(o);
                  const isActive = o.id === activeOrder.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => selectOrder(o.id)}
                      className={cn("pick-queue-item", isActive && "pick-queue-item--active")}
                    >
                      <div className="min-w-0">
                        <div className="pick-queue-item__po">
                          {orderPoRef(o)}
                          {isActive ? (
                            <>
                              {" · "}
                              <span className="pick-queue-picking">{t(pill.label)}</span>
                            </>
                          ) : null}
                        </div>
                        <div className="mt-px truncate text-muted-foreground">
                          {o.account} · {formatQueueDueI18n(o.requestedDelivery, t, parseDueDate)}
                        </div>
                      </div>
                      {isActive ? (
                        <Check className="size-3.5 shrink-0 text-[hsl(40_88%_34%)]" strokeWidth={2.5} aria-hidden />
                      ) : (
                        <DistributorPill tone={pill.tone} label={pill.label} />
                      )}
                    </button>
                  );
                })}
              </div>

              {inTransitOrders.length > 0 ? (
                <div className="dist-side-panel">
                  <div className="dist-side-panel-title mb-1 border-b-0 pb-0">{t("In transit")}</div>
                  <p className="pick-queue-hint">{t("Shipped — tap to update tracking or delivery")}</p>
                  {inTransitOrders.slice(0, 8).map((o) => (
                    <Link
                      key={o.id}
                      to={distributorFulfillmentEditPath(o)}
                      className="pick-queue-item no-underline text-inherit"
                    >
                      <div className="min-w-0">
                        <div className="pick-queue-item__po font-mono">{orderPoRef(o)}</div>
                        <div className="mt-px truncate text-muted-foreground">{o.account}</div>
                      </div>
                      <DistributorPill tone="green" label="shipped" />
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </>
      ) : (
        <div className="dist-card px-6 py-12 text-center">
          <p className="font-display text-lg font-medium">{t("Pick queue is clear")}</p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            {t("No confirmed or packed orders right now. New retail orders appear here after approval and payment.")}
          </p>
          <Link to="/distributor/orders" className="dist-btn dist-btn-outline dist-btn-sm mt-6 inline-flex">
            {t("View all orders")}
          </Link>
        </div>
      )}
    </DistributorPage>
  );
}
