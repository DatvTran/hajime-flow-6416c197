import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Truck } from "lucide-react";
import type { Account, Shipment, SalesOrder } from "@/data/mockData";
import { DistributorPill } from "@/components/distributor/DistributorPill";
import {
  DistributorFilterBar,
  DistributorFilterButton,
  DistributorMiniSteps,
  DistributorPage,
  DistributorPageHeader,
  DistributorShipmentCard,
} from "@/components/distributor/DistributorUi";
import { resolveSalesOrderIdFromShipmentLink } from "@/lib/distributor-fulfillment-links";
import { orderPoRef } from "@/lib/distributor-pick-pack";
import { shipmentLineContentsLabel } from "@/lib/order-lines";
import { DistributorInboundReceiptDialog } from "@/components/distributor/DistributorInboundReceiptDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";
import { persistDistributorInboundReceipt } from "@/lib/distributor-inbound-receipt";
import { toast } from "@/components/ui/sonner";

type Direction = "inbound" | "outbound";

function pillForOutbound(status: Shipment["status"]): { tone: "green" | "blue" | "amber" | "red" | "neutral"; label: string } {
  if (status === "delivered") return { tone: "green", label: "delivered" };
  if (status === "in-transit") return { tone: "blue", label: "in-transit" };
  if (status === "delayed") return { tone: "red", label: "delayed" };
  return { tone: "amber", label: status.replace(/-/g, " ") };
}

function pillForInbound(status: Shipment["status"]): { tone: "green" | "blue" | "amber" | "red" | "neutral"; label: string } {
  if (status === "delivered") return { tone: "green", label: "received" };
  if (status === "in-transit") return { tone: "blue", label: "in-transit" };
  if (status === "delayed") return { tone: "red", label: "delayed" };
  return { tone: "amber", label: status.replace(/-/g, " ") };
}

function outboundMiniSteps(s: Shipment) {
  const delivered = s.status === "delivered";
  const inTransit = s.status === "in-transit" || s.status === "delayed";
  return [
    { label: "Packed", state: "done" as const },
    { label: "Picked up", state: delivered || inTransit ? ("done" as const) : ("pending" as const) },
    {
      label: "In transit",
      state: delivered ? ("done" as const) : inTransit ? ("current" as const) : ("pending" as const),
    },
    { label: "Delivered", state: delivered ? ("done" as const) : ("pending" as const) },
  ];
}

function inboundMiniSteps(s: Shipment) {
  const received = s.status === "delivered";
  const inTransit = s.status === "in-transit" || s.status === "delayed";
  return [
    { label: "Packed at source", state: "done" as const },
    { label: "Dispatched", state: received || inTransit ? ("done" as const) : ("pending" as const) },
    {
      label: "In transit",
      state: received ? ("done" as const) : inTransit ? ("current" as const) : ("pending" as const),
    },
    { label: "Received at DC", state: received ? ("done" as const) : ("pending" as const) },
  ];
}

function resolvePoRef(s: Shipment, salesOrders: SalesOrder[]): string {
  const orderId = resolveSalesOrderIdFromShipmentLink(s.linkedOrder, salesOrders, s.linkedOrderDbId);
  if (orderId) {
    const order = salesOrders.find((o) => o.id === orderId);
    if (order) return orderPoRef(order);
  }
  return s.linkedOrder?.trim() || "—";
}

function signedByLabel(s: Shipment): string | null {
  if (s.status !== "delivered") return null;
  const fromNotes = s.notes?.match(/signed by[:\s]+([^·\n]+)/i)?.[1]?.trim();
  if (fromNotes) return fromNotes;
  const fromDelivery = s.actualDelivery?.trim();
  if (fromDelivery && !/^\d{4}-\d{2}-\d{2}/.test(fromDelivery) && !fromDelivery.includes("May") && !fromDelivery.includes("Jun")) {
    return fromDelivery;
  }
  return null;
}

function inboundRouteLabel(s: Shipment): string {
  const dest = s.destinationWarehouseName?.trim() || s.destination?.trim();
  const origin = s.origin?.trim() || "Manufacturer";
  if (dest && origin !== dest) return `${origin} → ${dest}`;
  return dest || origin || "Inbound shipment";
}

function inboundReceivedLabel(s: Shipment): string | null {
  if (s.status !== "delivered") return null;
  const verifier = s.notes?.match(/Verified by\s+([^·\n]+)/i)?.[1]?.trim();
  const csVerified = s.notes?.match(/(\d+\s*cs verified)/i)?.[1];
  if (verifier && csVerified) return `${verifier} · ${csVerified}`;
  const fromNotes = s.notes?.match(/verified[^·\n]*/i)?.[0]?.trim();
  if (fromNotes) return fromNotes;
  return s.actualDelivery?.trim() || null;
}

function formatEtaDisplay(s: Shipment, inbound: boolean): string {
  const raw = s.eta?.trim() || "";
  if (inbound && s.status === "delivered") {
    return raw.replace(/^Received\s+/i, "") || raw || "—";
  }
  if (!inbound && s.status === "delivered") {
    return raw.startsWith("Delivered") ? raw : raw ? `Delivered ${raw}` : "—";
  }
  return raw || "—";
}

function accountLabels(a: Account): string[] {
  const extra = (a as Account & { name?: string }).name;
  return [a.tradingName, a.legalName, extra]
    .map((v) => v?.trim())
    .filter((v): v is string => Boolean(v));
}

function accountHrefForDestination(destination: string | undefined, accounts: Account[]): string | undefined {
  const dest = destination?.trim();
  if (!dest || dest === "—") return undefined;
  const needle = dest.toLowerCase();
  const match = accounts.find((a) =>
    accountLabels(a).some((label) => {
      const lower = label.toLowerCase();
      return lower === needle || needle.startsWith(lower) || lower.startsWith(needle);
    }),
  );
  return match ? `/distributor/accounts?account=${encodeURIComponent(match.id)}` : undefined;
}

function outboundDestinationLabel(s: Shipment, salesOrders: SalesOrder[]): string {
  const dest = s.destination?.trim();
  if (dest && dest !== "—") return dest;
  const orderId = resolveSalesOrderIdFromShipmentLink(s.linkedOrder, salesOrders, s.linkedOrderDbId);
  const order = orderId ? salesOrders.find((o) => o.id === orderId) : undefined;
  return order?.account?.trim() || dest || "—";
}

export function DistributorShipmentsView({
  shipments,
  salesOrders,
  accounts,
}: {
  shipments: Shipment[];
  salesOrders: SalesOrder[];
  accounts: Account[];
}) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { refreshShipments, refreshInventory } = useAppData();
  const [direction, setDirection] = useState<Direction>("inbound");
  const [receivingId, setReceivingId] = useState<string | null>(null);
  const [receiptRef, setReceiptRef] = useState<Pick<Shipment, "id" | "databaseId"> | null>(null);

  const inbound = useMemo(
    () => shipments.filter((s) => s.type === "inbound" || s.orderType === "purchase_order"),
    [shipments],
  );
  const outbound = useMemo(
    () => shipments.filter((s) => s.type === "outbound" || s.orderType === "sales_order"),
    [shipments],
  );

  const inboundActive = inbound.filter((s) => s.status !== "delivered").length;
  const outboundActive = outbound.filter((s) => s.status !== "delivered").length;

  const handleReceiveInbound = async (s: Shipment) => {
    if (s.status === "delivered" || receivingId) return;
    setReceivingId(s.id);
    try {
      const verifier = user?.displayName?.trim() || "Ops";
      const totalCases =
        s.lineItems?.reduce(
          (sum, li) => sum + (li.cases ?? Math.ceil(li.quantity / (li.caseSize || 12))),
          0,
        ) ?? 0;

      await persistDistributorInboundReceipt(s, {
        verifiedBy: verifier,
        totalCases,
      });

      await Promise.all([refreshShipments(), refreshInventory()]);
      toast.success(t("Stock received"), {
        description: t("Receipt and inventory saved to the server."),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : t("Could not receive shipment");
      toast.error(t("Receive failed"), { description: message });
    } finally {
      setReceivingId(null);
    }
  };

  const list = direction === "inbound" ? inbound : outbound;

  return (
    <DistributorPage className="space-y-5">
      <DistributorPageHeader
        title="Shipments"
        description="Track inbound stock from manufacturers and outbound deliveries to accounts"
        actions={
          <Link to="/distributor/pick-pack" className="dist-btn dist-btn-accent dist-btn-sm no-underline">
            + {t("Log new shipment")}
          </Link>
        }
      />

      <DistributorFilterBar className="mb-[18px]">
        <DistributorFilterButton active={direction === "inbound"} onClick={() => setDirection("inbound")}>
          ↓ {t("Inbound to warehouse")}{" "}
          <span className="font-mono opacity-60">({inboundActive})</span>
        </DistributorFilterButton>
        <DistributorFilterButton active={direction === "outbound"} onClick={() => setDirection("outbound")}>
          ↑ {t("Outbound to accounts")}{" "}
          <span className="font-mono opacity-60">({outboundActive})</span>
        </DistributorFilterButton>
      </DistributorFilterBar>

      {direction === "inbound" ? (
        <p className="mb-3 text-xs text-muted-foreground">
          {t("Pallets en route from manufacturers & HQ to your depot — from approved replenishment requests.")}
        </p>
      ) : (
        <p className="mb-3 text-xs text-muted-foreground">
          {t("Deliveries from your depot out to retail accounts.")}
        </p>
      )}

      {list.length === 0 ? (
        <div className="dist-card px-6 py-12 text-center text-sm text-muted-foreground">
          {direction === "inbound"
            ? t("No inbound shipments in transit")
            : t("No outbound shipments match this view")}
        </div>
      ) : (
        list.map((s, i) => {
          const tracking = s.waybillNumber?.trim() || s.id;
          const poRef = resolvePoRef(s, salesOrders);
          const items = shipmentLineContentsLabel(s) || s.notes?.trim() || undefined;
          const isInbound = direction === "inbound";
          const pill = isInbound ? pillForInbound(s.status) : pillForOutbound(s.status);
          const received = inboundReceivedLabel(s);
          const signed = signedByLabel(s);
          const outboundDest = isInbound ? "" : outboundDestinationLabel(s, salesOrders);

          return (
            <DistributorShipmentCard
              key={s.id}
              tracking={tracking}
              poRef={poRef}
              title={isInbound ? inboundRouteLabel(s) : outboundDest}
              accountHref={isInbound ? undefined : accountHrefForDestination(outboundDest, accounts)}
              items={items}
              eta={formatEtaDisplay(s, isInbound)}
              etaLabel={isInbound && s.status === "delivered" ? "Arrived" : "ETA"}
              pill={<DistributorPill tone={pill.tone} label={pill.label} />}
              defaultOpen={isInbound ? i === 0 : i < 2}
              leadIcon={isInbound ? <Truck className="size-[18px]" strokeWidth={1.75} /> : undefined}
            >
              <DistributorMiniSteps steps={isInbound ? inboundMiniSteps(s) : outboundMiniSteps(s)} />
              <div className="mt-4 flex flex-wrap gap-5 border-t border-border/50 pt-3.5 text-[13px]">
                <div>
                  {t("Carrier")} <strong>{s.carrier || "Kentoku Logistics"}</strong>
                </div>
                <div>
                  {t("Tracking")}{" "}
                  <strong className="font-mono">{tracking}</strong>
                </div>
                {isInbound ? (
                  <div>
                    {t("Source order")}{" "}
                    <strong className="font-mono">{poRef}</strong>
                  </div>
                ) : null}
                {received ? (
                  <div>
                    {t("Received")} <strong>{received}</strong>
                  </div>
                ) : null}
                {signed ? (
                  <div>
                    {t("Signed by")} <strong>{signed}</strong>
                  </div>
                ) : null}
                <div className="ml-auto flex flex-wrap gap-2">
                  {isInbound ? (
                    s.status === "delivered" ? (
                      <button
                        type="button"
                        className="dist-btn dist-btn-outline dist-btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReceiptRef({ id: s.id, databaseId: s.databaseId });
                        }}
                      >
                        {t("View receipt")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="dist-btn dist-btn-sm bg-[hsl(158_56%_36%)] text-white hover:bg-[hsl(158_56%_30%)]"
                        disabled={receivingId === s.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleReceiveInbound(s);
                        }}
                      >
                        {receivingId === s.id ? t("Receiving…") : t("Receive & add to inventory")}
                      </button>
                    )
                  ) : (
                    <button type="button" className="dist-btn dist-btn-outline dist-btn-sm">
                      {t("Track externally")}
                    </button>
                  )}
                </div>
              </div>
            </DistributorShipmentCard>
          );
        })
      )}

      <DistributorInboundReceiptDialog
        shipmentRef={receiptRef}
        open={receiptRef != null}
        onOpenChange={(open) => {
          if (!open) setReceiptRef(null);
        }}
        salesOrders={salesOrders}
      />
    </DistributorPage>
  );
}
