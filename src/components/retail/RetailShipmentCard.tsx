import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { RetailStatusPill } from "@/components/retail/RetailStatusPill";
import { RetailShipmentTracker } from "@/components/retail/RetailShipmentTracker";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  deliveryCarrier,
  deliveryDescription,
  deliveryDetailHref,
  deliveryEtaLabel,
  deliveryHeaderMeta,
  deliveryPill,
  deliveryTotal,
  deliveryTrackerDates,
  deliveryTrackerStatus,
  deliveryTracking,
  type DeliveryRow,
} from "@/lib/retail-deliveries";

function formatMoney(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type Props = {
  row: DeliveryRow;
  products: { sku: string; name: string }[];
  defaultOpen?: boolean;
};

/** Expandable shipment row — retail-store-app `.shipment-row` */
export function RetailShipmentCard({ row, products, defaultOpen = false }: Props) {
  const pill = deliveryPill(row);
  const total = deliveryTotal(row);
  const tracking = deliveryTracking(row);
  const detailHref = deliveryDetailHref(row);
  const desc = deliveryDescription(row, products);
  const eta = deliveryEtaLabel(row);

  return (
    <article className="shipment-row overflow-hidden rounded-[14px] border border-border/70 bg-card shadow-[var(--shadow-soft)]">
      <Collapsible defaultOpen={defaultOpen}>
        <CollapsibleTrigger className="ship-header group flex w-full cursor-pointer items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/30">
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[11px] text-muted-foreground">{deliveryHeaderMeta(row)}</div>
            <div className="mt-0.5 font-display text-[17px] font-medium tracking-[-0.01em] text-foreground">
              {desc || "Shipment"}
            </div>
            <div className="mt-1 text-[12px] leading-snug text-muted-foreground">
              ETA <strong className="font-medium text-foreground">{eta}</strong>
              {row.kind === "shipment" && row.shipment.carrier ? (
                <span className="text-muted-foreground"> · {row.shipment.carrier}</span>
              ) : null}
            </div>
          </div>
          <RetailStatusPill status={pill.status} label={pill.label} />
          <ChevronDown
            className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
            aria-hidden
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="ship-detail border-t border-border/50">
          <div className="px-5 pb-5 pt-4">
            <RetailShipmentTracker status={deliveryTrackerStatus(row)} dates={deliveryTrackerDates(row)} />
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 border-t border-border/50 pt-3.5 text-[13px] text-foreground">
              {total != null ? (
                <div>
                  Total <strong className="font-mono font-medium tabular-nums">${formatMoney(total)}</strong>
                </div>
              ) : null}
              <div>
                Carrier <strong>{deliveryCarrier(row)}</strong>
              </div>
              {tracking ? (
                <div>
                  Tracking <strong className="font-mono font-medium">{tracking}</strong>
                </div>
              ) : null}
              {detailHref ? (
                <div className="ml-auto w-full sm:ml-auto sm:w-auto">
                  <Button variant="outline" size="sm" className="h-[30px] w-full text-xs sm:w-auto" asChild>
                    <Link to={detailHref}>View details</Link>
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </article>
  );
}
