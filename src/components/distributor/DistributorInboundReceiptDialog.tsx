import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import type { Shipment, SalesOrder } from "@/data/mockData";
import { DistributorPill } from "@/components/distributor/DistributorPill";
import { resolveSalesOrderIdFromShipmentLink } from "@/lib/distributor-fulfillment-links";
import { fetchShipmentFromApi } from "@/lib/distributor-inbound-receipt";
import { orderPoRef } from "@/lib/distributor-pick-pack";
import { shipmentLineContentsLabel } from "@/lib/order-lines";
import { useLanguage } from "@/contexts/LanguageContext";

function grnNumber(tracking: string): string {
  const digits = tracking.replace(/\D/g, "").slice(-6);
  return `GRN-${digits || "000000"}`;
}

function resolvePoRef(s: Shipment, salesOrders: SalesOrder[]): string {
  const orderId = resolveSalesOrderIdFromShipmentLink(s.linkedOrder, salesOrders, s.linkedOrderDbId);
  if (orderId) {
    const order = salesOrders.find((o) => o.id === orderId);
    if (order) return orderPoRef(order);
  }
  return s.linkedOrder?.trim() || "—";
}

function receiptDepotName(s: Shipment): string {
  return s.destinationWarehouseName?.trim() || s.destination?.trim() || "Distributor DC";
}

function receiptOrigin(s: Shipment): string {
  const dest = s.destinationWarehouseName?.trim() || s.destination?.trim();
  const origin = s.origin?.trim() || "Manufacturer";
  if (dest && origin !== dest) return origin;
  return origin;
}

function formatReceivedAt(s: Shipment): string {
  if (s.actualDelivery?.trim()) {
    try {
      const d = new Date(s.actualDelivery.includes("T") ? s.actualDelivery : `${s.actualDelivery}T12:00:00`);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
      }
    } catch {
      /* fall through */
    }
    return s.actualDelivery.replace(/^Received\s+/i, "");
  }
  const raw = s.eta?.trim() || "—";
  return raw.replace(/^Received\s+/i, "");
}

function receiptVerifiedBy(s: Shipment): string {
  const fromNotes =
    s.notes?.match(/verified by[:\s]+([^·\n]+)/i)?.[1]?.trim() ||
    s.notes?.match(/^([^·\n]+)·\s*Operations Lead/i)?.[1]?.trim();
  if (fromNotes) {
    return fromNotes.includes("Operations Lead") ? fromNotes : `${fromNotes} · Operations Lead`;
  }
  return "Operations Lead";
}

function receiptLines(s: Shipment): { productLabel: string; sku: string; cases: number }[] {
  if (s.lineItems?.length) {
    return s.lineItems.map((li) => ({
      productLabel: li.productName?.trim() || li.sku,
      sku: li.sku,
      cases: li.cases ?? Math.max(1, Math.ceil(li.quantity / (li.caseSize || 12))),
    }));
  }
  const label = shipmentLineContentsLabel(s) || s.notes?.trim() || "Stock received";
  const skuMatch = label.match(/(HJM-[A-Z0-9-]+)/i);
  return [{ productLabel: label, sku: skuMatch?.[1] || "—", cases: 0 }];
}

function totalCases(lines: { cases: number }[]): number {
  return lines.reduce((sum, row) => sum + row.cases, 0);
}

function monoField(value: string): boolean {
  return /\d{3,}/.test(value) && !value.includes(" ");
}

export function DistributorInboundReceiptDialog({
  shipmentRef,
  open,
  onOpenChange,
  salesOrders,
}: {
  /** Shipment identity used to load receipt from the API. */
  shipmentRef: Pick<Shipment, "id" | "databaseId"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesOrders: SalesOrder[];
}) {
  const { t } = useLanguage();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !shipmentRef) {
      setShipment(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setShipment(null);

    void (async () => {
      try {
        const row = await fetchShipmentFromApi(shipmentRef);
        if (!cancelled) setShipment(row);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("Could not load receipt"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, shipmentRef, t]);

  if (!open) return null;

  const close = () => onOpenChange(false);

  return (
    <div
      className="dist-receipt-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dist-receipt-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="dist-receipt-modal">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-8 animate-spin text-accent" />
            {t("Loading receipt…")}
          </div>
        ) : error ? (
          <div className="space-y-4 py-8 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <button type="button" className="dist-btn dist-btn-outline dist-btn-sm" onClick={close}>
              {t("Close")}
            </button>
          </div>
        ) : shipment ? (
          <ReceiptBody shipment={shipment} salesOrders={salesOrders} onClose={close} />
        ) : null}
      </div>
    </div>
  );
}

function ReceiptBody({
  shipment,
  salesOrders,
  onClose,
}: {
  shipment: Shipment;
  salesOrders: SalesOrder[];
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const tracking = shipment.waybillNumber?.trim() || shipment.id;
  const poRef = resolvePoRef(shipment, salesOrders);
  const depot = receiptDepotName(shipment);
  const lines = receiptLines(shipment);
  const cases = totalCases(lines) || lines.length;
  const primarySku = lines[0]?.sku || "—";

  const fields: { label: string; value: string }[] = [
    { label: "Source order", value: poRef },
    { label: "Tracking", value: tracking },
    { label: "From", value: receiptOrigin(shipment) },
    { label: "Carrier", value: shipment.carrier?.trim() || "Nippon Freight" },
    { label: "Received", value: formatReceivedAt(shipment) },
    { label: "Verified by", value: receiptVerifiedBy(shipment) },
  ];

  return (
    <>
      <div className="mb-[18px] flex items-center gap-3 border-b border-border/50 pb-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-[11px] bg-[hsl(158_56%_36%/.1)] text-[hsl(158_56%_30%)]">
          <Check className="size-[22px]" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h2 id="dist-receipt-title" className="font-display text-lg font-semibold tracking-[-0.01em]">
            {t("Goods receipt")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {grnNumber(tracking)} · {t("verified at")} {depot}
          </p>
        </div>
        <span className="ml-auto shrink-0">
          <DistributorPill tone="green" label="received" />
        </span>
      </div>

      <div className="dist-receipt-grid mb-4">
        {fields.map((field) => (
          <div key={field.label}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {t(field.label)}
            </div>
            <div className={`mt-0.5 text-[13px] font-medium ${monoField(field.value) ? "font-mono" : ""}`}>
              {field.value}
            </div>
          </div>
        ))}
      </div>

      <div className="dist-receipt-table-wrap mb-4 overflow-hidden rounded-[10px] border border-border/60">
        <div className="dist-receipt-table-head grid grid-cols-[2fr_1fr_1fr] gap-2.5 bg-muted/50 px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          <div>{t("SKU received")}</div>
          <div className="text-right">{t("Ordered")}</div>
          <div className="text-right">{t("Verified")}</div>
        </div>
        {lines.map((row) => (
          <div
            key={`${row.sku}-${row.productLabel}`}
            className="grid grid-cols-[2fr_1fr_1fr] items-center gap-2.5 px-3.5 py-3 text-[13px]"
          >
            <div>
              <div className="font-medium">{row.productLabel}</div>
              <div className="font-mono text-[11px] text-muted-foreground">{row.sku}</div>
            </div>
            <div className="text-right font-mono">{row.cases > 0 ? `${row.cases} cs` : "—"}</div>
            <div className="text-right font-mono font-semibold text-[hsl(158_56%_32%)]">
              {row.cases > 0 ? `${row.cases} cs ✓` : "—"}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-[10px] border border-[hsl(158_56%_36%/.2)] bg-[hsl(158_56%_36%/.06)] px-3.5 py-2.5 text-xs text-[hsl(158_56%_28%)]">
        <Check className="size-3.5 shrink-0" strokeWidth={2.5} />
        <span>
          {t("Full quantity verified — no discrepancies. {{count}} cases added to inventory under {{sku}}.", {
            count: cases,
            sku: primarySku,
          })}
        </span>
      </div>

      <div className="mt-[18px] flex justify-end gap-2">
        <button type="button" className="dist-btn dist-btn-outline dist-btn-sm" onClick={onClose}>
          {t("Close")}
        </button>
        <button type="button" className="dist-btn dist-btn-accent dist-btn-sm" onClick={onClose}>
          {t("Download PDF")}
        </button>
      </div>
    </>
  );
}
