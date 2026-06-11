import { DistributorPartnerProgramView } from "@/components/distributor/DistributorPartnerProgramView";
import { DistributorSkeleton } from "@/components/skeletons";
import { useAppData } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";

export default function DistributorPartnerProgramPage() {
  const { loading, data } = useAppData();
  const { user } = useAuth();

  const distAccount = data.accounts.find(
    (a) => a.type === "distributor" && String(a.managedByDistributorUserId ?? "") === String(user?.id ?? ""),
  );
  const accountName = distAccount?.tradingName || distAccount?.legalName || "Empire Wines";

  if (loading) return <DistributorSkeleton />;

  return (
    <DistributorPartnerProgramView
      accountName={accountName}
      shipments={data.shipments}
      salesOrders={data.salesOrders}
    />
  );
}
