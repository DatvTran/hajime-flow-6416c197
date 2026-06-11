import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { SalesOrder, Shipment } from "@/data/mockData";
import { DistributorPill } from "@/components/distributor/DistributorPill";
import {
  DistributorPage,
  DistributorPageHeader,
  DistributorScheduleDay,
  DistributorScheduleRow,
} from "@/components/distributor/DistributorUi";
import {
  distributorFulfillmentEditPath,
  distributorShipmentEditPath,
} from "@/lib/distributor-fulfillment-links";
import { buildDistributorDeliverySchedule } from "@/lib/distributor-delivery-schedule";
import { useLanguage } from "@/contexts/LanguageContext";

function detailsPath(
  delivery: ReturnType<typeof buildDistributorDeliverySchedule>[number]["deliveries"][number],
  salesOrders: SalesOrder[],
): string {
  if (delivery.shipment) return distributorShipmentEditPath(delivery.shipment, salesOrders);
  if (delivery.order) return distributorFulfillmentEditPath(delivery.order);
  return "/distributor/shipments";
}

export function DistributorDeliveryScheduleView({
  shipments,
  salesOrders,
  compact,
}: {
  shipments: Shipment[];
  salesOrders: SalesOrder[];
  /** Dashboard embed — fewer days, no page chrome. */
  compact?: boolean;
}) {
  const { t } = useLanguage();

  const days = useMemo(
    () => buildDistributorDeliverySchedule(shipments, salesOrders),
    [shipments, salesOrders],
  );

  const visibleDays = compact ? days.slice(0, 2) : days;
  const deliveryCount = visibleDays.reduce((n, d) => n + d.deliveries.length, 0);

  const scheduleBody =
    visibleDays.length === 0 ? (
      <div className="dist-card px-6 py-12 text-center text-sm text-muted-foreground">
        {t("No upcoming deliveries in the next 7 days")}
      </div>
    ) : (
      visibleDays.map((day) => (
        <DistributorScheduleDay key={day.sortKey} label={day.label}>
          {(compact ? day.deliveries.slice(0, 4) : day.deliveries).map((d) => (
            <DistributorScheduleRow
              key={d.id}
              time={d.time}
              account={d.account}
              items={d.items}
              tracking={d.tracking}
              pill={<DistributorPill tone={d.pill.tone} label={d.pill.label} />}
              action={
                <Link
                  to={detailsPath(d, salesOrders)}
                  className="dist-btn dist-btn-outline dist-btn-sm shrink-0 no-underline"
                >
                  {t("Details")}
                </Link>
              }
            />
          ))}
        </DistributorScheduleDay>
      ))
    );

  if (compact) {
    return <div className="space-y-3">{scheduleBody}</div>;
  }

  return (
    <DistributorPage className="dist-delivery-schedule space-y-6 pb-8">
      <DistributorPageHeader
        title="Delivery schedule"
        description="Upcoming confirmed deliveries · next 7 days"
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" className="dist-btn dist-btn-outline dist-btn-sm">
              {t("Week view")}
            </button>
            <Link to="/distributor/pick-pack" className="dist-btn dist-btn-accent dist-btn-sm no-underline">
              + {t("Schedule delivery")}
            </Link>
          </div>
        }
      />

      {deliveryCount > 0 ? (
        <p className="text-[13px] text-muted-foreground">
          {t("{{count}} deliveries across the next {{days}} days", {
            count: deliveryCount,
            days: visibleDays.length,
          })}
        </p>
      ) : null}

      {scheduleBody}
    </DistributorPage>
  );
}
