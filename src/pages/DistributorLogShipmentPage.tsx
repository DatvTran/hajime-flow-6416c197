import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Check, Truck } from "lucide-react";
import { DistributorPill } from "@/components/distributor/DistributorPill";
import { DistributorSkeleton } from "@/components/skeletons";
import { useAuth } from "@/contexts/AuthContext";
import { useAccounts, useAppData, useSalesOrders } from "@/contexts/AppDataContext";
import {
  buildPickLines,
  defaultTrackingNumber,
  findOrderAccount,
  formatCasesTotal,
  formatDeliveryWindowInput,
  formatPoTotal,
  orderPoRef,
} from "@/lib/distributor-pick-pack";
import { persistDistributorRetailOutboundShipment } from "@/lib/distributor-retail-shipment";
import { mapRowToShipment } from "@/lib/data-service";
import { findSalesOrderByRef } from "@/lib/sales-order-api-id";
import { toast } from "@/components/ui/sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const CARRIERS = ["Kentoku Logistics", "Nippon Freight", "Local courier", "Distributor fleet"] as const;
const SERVICE_LEVELS = ["Standard ground", "Refrigerated", "Expedited"] as const;

function packedByLabel(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Ops";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase() + ". " + parts[0];
  return `${parts[0][0]}. ${parts[parts.length - 1]}`;
}

export default function DistributorLogShipmentPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPickPack = Boolean((location.state as { fromPickPack?: boolean } | null)?.fromPickPack);
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order");
  const { loading, data, updateData, refreshShipments, refreshSalesOrders } = useAppData();
  const { salesOrders, patchSalesOrder } = useSalesOrders();
  const { accounts } = useAccounts();

  const order = useMemo(
    () => findSalesOrderByRef(salesOrders, orderId),
    [orderId, salesOrders],
  );

  const account = useMemo(
    () => (order ? findOrderAccount(order, accounts) : undefined),
    [order, accounts],
  );

  const pickLines = useMemo(
    () => (order ? buildPickLines(order, data.inventory, data.products) : []),
    [order, data.inventory, data.products],
  );

  const totalCases = useMemo(() => pickLines.reduce((s, l) => s + l.cases, 0), [pickLines]);

  const [carrier, setCarrier] = useState<string>(CARRIERS[0]);
  const [serviceLevel, setServiceLevel] = useState<string>(SERVICE_LEVELS[0]);
  const [tracking, setTracking] = useState("");
  const [caseCount, setCaseCount] = useState(String(totalCases || 1));
  const [dispatchDate, setDispatchDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [deliveryWindow, setDeliveryWindow] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [ensuringPacked, setEnsuringPacked] = useState(false);
  const [success, setSuccess] = useState<{ tracking: string; poRef: string; account: string } | null>(null);

  useEffect(() => {
    if (!order || !fromPickPack || order.status !== "confirmed") return;
    let cancelled = false;
    setEnsuringPacked(true);
    void (async () => {
      const result = await patchSalesOrder(order.id, { status: "packed" }, { requireSync: true });
      if (cancelled) return;
      setEnsuringPacked(false);
      if (!result?.success || result.synced !== true) {
        toast.error("Could not save packed status to server", {
          description: result?.error ?? "Return to pick & pack and try again.",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [order?.id, order?.status, fromPickPack, patchSalesOrder]);

  useEffect(() => {
    if (!order) return;
    setTracking(defaultTrackingNumber(order));
    setDeliveryWindow(formatDeliveryWindowInput(order));
    const cases = pickLines.reduce((s, l) => s + l.cases, 0);
    setCaseCount(String(cases > 0 ? cases : 1));
    const addr = order.shippingAddress?.trim() || order.deliveryAddress?.trim();
    const contact = account?.contactName?.trim();
    if (contact || addr) {
      const bits = [
        contact ? `Signature required — ${contact} or front desk.` : "",
        addr ? `Deliver to: ${addr}` : "",
      ].filter(Boolean);
      if (bits.length) setNotes(bits.join(" "));
    }
  }, [order?.id, account?.contactName]);

  if (loading || ensuringPacked) return <DistributorSkeleton />;

  if (!orderId || !order) {
    return <Navigate to="/distributor/pick-pack" replace />;
  }

  if (order.status === "confirmed" && !fromPickPack) {
    return <Navigate to={`/distributor/pick-pack?order=${encodeURIComponent(order.id)}`} replace />;
  }

  const fulfillmentStatus = fromPickPack && order.status === "confirmed" ? "packed" : order.status;

  if (fulfillmentStatus !== "packed" && fulfillmentStatus !== "shipped") {
    return <Navigate to="/distributor/pick-pack" replace />;
  }

  const poRef = orderPoRef(order);
  const packedDate = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const packedBy = packedByLabel(user?.displayName ?? "Operator");

  const dispatch = async () => {
    const trk = tracking.trim();
    if (!trk) {
      toast.error("Tracking number is required");
      return;
    }
    if (!dispatchDate.trim()) {
      toast.error("Dispatch date is required");
      return;
    }

    setBusy(true);
    const noteParts = [
      notes.trim(),
      serviceLevel ? `Service: ${serviceLevel}` : "",
      caseCount ? `Cases: ${caseCount}` : "",
      deliveryWindow.trim() ? `Window: ${deliveryWindow.trim()}` : "",
    ].filter(Boolean);
    const combinedNotes = noteParts.join(" · ");
    const carrierName = carrier.trim() || CARRIERS[0];

    const noteBlob = [`Tracking ${trk}`, combinedNotes].filter(Boolean).join(" · ");
    const etaYmd = order.requestedDelivery?.trim() || dispatchDate;

    try {
      if (order.status === "confirmed") {
        const packedResult = await patchSalesOrder(order.id, { status: "packed" }, { requireSync: true });
        if (!packedResult?.success || packedResult.synced !== true) {
          toast.error("Could not save packed status", {
            description: packedResult?.error ?? "Complete pick & pack before dispatching.",
          });
          return;
        }
      }

      const apiRow = await persistDistributorRetailOutboundShipment({
        order,
        account,
        products: data.products,
        userEmail: user?.email,
        teamMembers: data.teamMembers,
        warehouses: data.warehouses,
        trackingNumber: trk,
        carrier: carrierName,
        dispatchDateYmd: dispatchDate,
        etaYmd,
        notes: noteBlob,
      });

      const shippedResult = await patchSalesOrder(order.id, { status: "shipped" }, { requireSync: true });
      if (!shippedResult?.success || shippedResult.synced !== true) {
        toast.error("Shipment saved but order status did not update", {
          description: shippedResult?.error ?? "Refresh orders — tracking may already exist on the server.",
        });
        return;
      }

      const mappedFromApi = mapRowToShipment(apiRow);
      mappedFromApi.linkedOrder = order.id;
      mappedFromApi.carrier = carrierName;
      mappedFromApi.notes = noteBlob;

      flushSync(() => {
        updateData((d) => {
          const exists = d.shipments.some(
            (s) => s.id === mappedFromApi.id || (s.linkedOrder === order.id && s.type === "outbound"),
          );
          return {
            ...d,
            shipments: exists ? d.shipments : [mappedFromApi, ...d.shipments],
          };
        });
      });

      await Promise.all([refreshShipments(), refreshSalesOrders()]);

      setSuccess({ tracking: trk, poRef, account: order.account });
    } catch (e) {
      toast.error("Could not dispatch shipment", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="animate-enter relative">
      <div className="dist-ph-row flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="mb-1 font-display text-[26px] font-semibold tracking-[-0.02em]">{t("Log shipment")}</h1>
          <p className="text-[13px] text-muted-foreground">
            {t("Confirm {{poRef}} is packed and create the outbound shipment to {{account}}.", {
              poRef,
              account: order.account,
            })}
          </p>
        </div>
        <Link
          to={`/distributor/pick-pack?order=${encodeURIComponent(order.id)}`}
          className="dist-btn dist-btn-outline dist-btn-sm shrink-0 self-start"
        >
          {t("← Back to pick & pack")}
        </Link>
      </div>

      <div className="dist-packed-banner mb-6">
        <div className="dist-packed-banner-icon">
          <Check className="size-4" strokeWidth={2.5} />
        </div>
        <p className="text-[13px]">
          <strong className="text-[hsl(158_56%_30%)]">{t("All items picked & packed.")}</strong>{" "}
          <span className="text-muted-foreground">
            {pickLines.length} of {pickLines.length} line{pickLines.length === 1 ? "" : "s"} complete ·{" "}
            {formatCasesTotal(totalCases)} · packed by {packedBy} · {packedDate}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 min-[960px]:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4">
          <div className="dist-card">
            <div className="dist-card-head">
              <div>
                <div className="dist-card-title">{t("Packed contents")}</div>
                <div className="dist-card-sub mt-0.5 text-left">
                  {poRef} · {order.account}
                </div>
              </div>
              <DistributorPill tone="green" label="packed" />
            </div>
            <div className="px-5">
              {pickLines.map((line) => (
                <div
                  key={line.key}
                  className="flex items-center gap-3.5 border-b border-border/40 py-3.5 last:border-0"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-[7px] bg-[hsl(158_56%_36%/0.1)] text-[hsl(158_56%_30%)]">
                    <Check className="size-[15px]" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium">{line.name}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{line.detailShort}</div>
                  </div>
                  <div className="font-mono text-sm font-semibold">{line.casesLabel}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-between border-t border-border/50 px-5 py-3.5 text-[13px]">
              <span className="text-muted-foreground">{t("Total packed")}</span>
              <span className="font-mono font-semibold">
                {formatCasesTotal(Number(caseCount) || totalCases)}
              </span>
            </div>
          </div>

          <div className="dist-card">
            <div className="dist-card-head">
              <div className="dist-card-title">{t("Shipment details")}</div>
            </div>
            <div className="px-5 py-[18px]">
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div className="dist-form-group">
                  <label>{t("Carrier")}</label>
                  <select value={carrier} onChange={(e) => setCarrier(e.target.value)}>
                    {CARRIERS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="dist-form-group">
                  <label>{t("Service level")}</label>
                  <select value={serviceLevel} onChange={(e) => setServiceLevel(e.target.value)}>
                    {SERVICE_LEVELS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="dist-form-group">
                  <label>{t("Tracking number")}</label>
                  <input type="text" value={tracking} onChange={(e) => setTracking(e.target.value)} />
                </div>
                <div className="dist-form-group">
                  <label>{t("Cases")}</label>
                  <input
                    type="number"
                    min={1}
                    value={caseCount}
                    onChange={(e) => setCaseCount(e.target.value)}
                  />
                </div>
                <div className="dist-form-group">
                  <label>{t("Dispatch date")}</label>
                  <input type="date" value={dispatchDate} onChange={(e) => setDispatchDate(e.target.value)} />
                </div>
                <div className="dist-form-group">
                  <label>{t("Delivery window")}</label>
                  <input type="text" value={deliveryWindow} onChange={(e) => setDeliveryWindow(e.target.value)} />
                </div>
              </div>
              <div className="dist-form-group mb-0">
                <label>{t("Notes for carrier / account")}</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("Loading dock access, signature requirements…")}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="dist-side-panel sticky top-5 shadow-[var(--shadow-soft)]">
            <div className="mb-3.5 border-b border-border/50 pb-3 font-display text-base font-medium">
              {t("Ship to")}
            </div>
            {[
              { label: "Account", value: order.account },
              {
                label: "Address",
                value:
                  order.shippingAddress?.trim() ||
                  order.deliveryAddress?.trim() ||
                  (account ? `${account.city}, ${account.country}` : "—"),
              },
              { label: "Contact", value: account?.contactName?.trim() || order.salesRep || "—" },
              { label: "PO total", value: formatPoTotal(order) },
              { label: "Payment", value: account?.paymentTerms?.trim() || "Net 30" },
            ].map((row) => (
              <div key={row.label} className="dist-kv-row">
                <span className="text-muted-foreground">{t(row.label)}</span>
                <span className="max-w-[58%] text-right font-medium">{row.value}</span>
              </div>
            ))}
            <button
              type="button"
              className="dist-btn dist-btn-green mt-4 flex h-[42px] w-full items-center justify-center gap-2 disabled:opacity-50"
              disabled={busy}
              onClick={() => void dispatch()}
            >
              <Truck className="size-[15px]" strokeWidth={1.75} />
              {t("Dispatch shipment")}
            </button>
            <p className="mt-2 text-center font-mono text-[11px] text-muted-foreground">
              {t("CREATES TRACKED SHIPMENT · NOTIFIES ACCOUNT")}
            </p>
          </div>
          <div className="rounded-[14px] border border-[hsl(40_88%_42%/0.2)] bg-[hsl(40_88%_42%/0.06)] p-4 text-xs leading-relaxed text-[hsl(40_72%_38%)]">
            <strong className="text-[hsl(40_80%_34%)]">{t("After dispatch:")}</strong>{" "}
            {t("the shipment appears in Active shipments with live tracking, and {{account}} sees it in their delivery tracker.", {
              account: order.account,
            })}
          </div>
        </div>
      </div>

      {success ? (
        <div className="dist-ls-overlay" role="dialog" aria-modal="true" aria-labelledby="ls-success-title">
          <div className="dist-ls-modal">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[hsl(158_56%_36%/0.12)] text-[hsl(158_56%_32%)]">
              <Truck className="size-[26px]" strokeWidth={1.75} />
            </div>
            <h2 id="ls-success-title" className="mb-1.5 font-display text-xl font-semibold tracking-[-0.01em]">
              {t("Shipment dispatched")}
            </h2>
            <p className="mb-5 text-[13px] leading-relaxed text-muted-foreground">
              {t("{{tracking}} created for {{poRef}}. {{account}} has been notified and can track delivery in their portal.", {
                tracking: success.tracking,
                poRef: success.poRef,
                account: success.account,
              })}
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                className="dist-btn dist-btn-outline dist-btn-sm"
                onClick={() => navigate("/distributor/purchase-orders")}
              >
                {t("Back to POs")}
              </button>
              <button
                type="button"
                className="dist-btn dist-btn-accent dist-btn-sm"
                onClick={() => navigate(`/distributor/shipments?q=${encodeURIComponent(success.tracking)}`)}
              >
                {t("Track shipment")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
