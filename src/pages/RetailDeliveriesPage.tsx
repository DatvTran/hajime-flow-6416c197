import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppData, useShipments } from "@/contexts/AppDataContext";
import { useRetailAccountTradingName } from "@/contexts/AuthContext";
import { RetailPageHeader } from "@/components/retail/RetailPageHeader";
import { RetailFilterPills } from "@/components/retail/RetailFilterPills";
import { RetailShipmentCard } from "@/components/retail/RetailShipmentCard";
import { RetailSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import {
  buildRetailDeliveryRows,
  rowBucket,
  type DeliveryFilter,
} from "@/lib/retail-deliveries";

export default function RetailDeliveriesPage() {
  const { data, loading } = useAppData();
  const { shipments } = useShipments();
  const storeName = useRetailAccountTradingName();
  const [filter, setFilter] = useState<DeliveryFilter>("all");

  const rows = useMemo(
    () => buildRetailDeliveryRows(shipments, data.salesOrders, storeName),
    [shipments, data.salesOrders, storeName],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => rowBucket(r) === filter);
  }, [rows, filter]);

  const firstOpenIndex = useMemo(
    () => filtered.findIndex((r) => rowBucket(r) !== "delivered"),
    [filtered],
  );

  if (loading) return <RetailSkeleton />;

  return (
    <div className="space-y-6 pb-8">
      <RetailPageHeader
        title="Deliveries"
        description="Track all inbound shipments — expand any row for the full tracker."
      />

      <RetailFilterPills
        options={[
          { id: "all", label: "All" },
          { id: "in_transit", label: "In transit" },
          { id: "delivered", label: "Delivered" },
          { id: "pending", label: "Pending" },
        ]}
        value={filter}
        onChange={setFilter}
      />

      {filtered.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-border/80 px-5 py-10 text-center">
          <p className="text-[13px] text-muted-foreground">No deliveries in this view.</p>
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link to="/retail/orders">View my orders</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((row, i) => (
            <li key={row.kind === "shipment" ? row.shipment.id : `pending-${row.order.id}`}>
              <RetailShipmentCard
                row={row}
                products={data.products}
                defaultOpen={i === firstOpenIndex && firstOpenIndex >= 0}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
