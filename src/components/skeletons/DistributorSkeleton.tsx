import { Skeleton } from "@/components/ui/skeleton";
import { StatCardSkeleton } from "./SkeletonUtils";

export function DistributorSkeleton() {
  return (
    <div className="animate-enter space-y-7">
      <div className="space-y-2">
        <Skeleton className="h-9 w-72 max-w-full rounded" />
        <Skeleton className="h-4 w-full max-w-lg rounded" />
      </div>
      <Skeleton className="h-[72px] w-full rounded-xl" />
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid gap-[18px] lg:grid-cols-[1.3fr_1fr]">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}
