import { Link } from "react-router-dom";
import { IncentiveProgressDashboardCard } from "@/components/incentives/IncentiveProgressDashboardCard";
import { DistributorPage, DistributorPageHeader } from "@/components/distributor/DistributorUi";
import { DistributorSkeleton } from "@/components/skeletons";
import { useAppData } from "@/contexts/AppDataContext";

export default function DistributorPartnerProgramPage() {
  const { loading } = useAppData();

  if (loading) return <DistributorSkeleton />;

  return (
    <DistributorPage className="space-y-6 pb-8">
      <DistributorPageHeader
        title="Partner program"
        description="Hajime Distribution Partners — tiers, rebates, co-op, and quarterly performance vs HQ targets."
        actions={
          <Link to="/distributor" className="dist-btn dist-btn-outline dist-btn-sm no-underline">
            Back to dashboard
          </Link>
        }
      />
      <IncentiveProgressDashboardCard />
    </DistributorPage>
  );
}
