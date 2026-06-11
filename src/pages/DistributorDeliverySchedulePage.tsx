import { useAppData, useSalesOrders } from "@/contexts/AppDataContext";
import { DistributorDeliveryScheduleView } from "@/components/distributor/DistributorDeliveryScheduleView";
import { DistributorSkeleton } from "@/components/skeletons";

export default function DistributorDeliverySchedulePage() {
  const { data, loading } = useAppData();
  const { salesOrders } = useSalesOrders();

  if (loading || !data) {
    return <DistributorSkeleton />;
  }

  return (
    <DistributorDeliveryScheduleView shipments={data.shipments} salesOrders={salesOrders} />
  );
}
