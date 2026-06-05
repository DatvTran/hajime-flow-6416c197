import { Link } from "react-router-dom";
import { IncentiveProgressDashboardCard } from "@/components/incentives/IncentiveProgressDashboardCard";
import { DistributorSkeleton } from "@/components/skeletons";
import { useAppData } from "@/contexts/AppDataContext";
import { Button } from "@/components/ui/button";

export default function DistributorPartnerProgramPage() {
  const { loading } = useAppData();

  if (loading) return <DistributorSkeleton />;

  return (
    <div className="animate-enter space-y-6 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.02em]">Partner program</h1>
          <p className="mt-1 max-w-[60ch] text-[13px] text-muted-foreground">
            Read-only view of Hajime HQ Incentive Manager — same data Brand Operator uses for SPIFs, tiers, and
            distributor performance. Field reps and retail stores see their slice; HQ sees the full network.
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-9 shrink-0" asChild>
          <Link to="/distributor">Back to dashboard</Link>
        </Button>
      </div>

      <IncentiveProgressDashboardCard />
    </div>
  );
}
