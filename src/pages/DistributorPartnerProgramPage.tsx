import { DistributorPartnerProgramView } from "@/components/distributor/DistributorPartnerProgramView";
import { DistributorSkeleton } from "@/components/skeletons";
import { useAppData } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { distributorPortalAccountLabel } from "@/lib/distributor-accounts";

export default function DistributorPartnerProgramPage() {
  const { loading, data } = useAppData();
  const { user } = useAuth();

  const accountName = distributorPortalAccountLabel(data.accounts, user);

  if (loading) return <DistributorSkeleton />;

  return (
    <DistributorPartnerProgramView
      accountName={accountName}
      shipments={data.shipments}
      salesOrders={data.salesOrders}
    />
  );
}
