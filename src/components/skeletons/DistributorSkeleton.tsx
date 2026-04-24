import { PageHeaderSkeleton, StatCardSkeleton, ListItemSkeleton } from "./SkeletonUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DistributorSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth={200} descWidth={420} />

      {/* 5 stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Orders awaiting fulfillment */}
        <div className="card-elevated">
          <div className="flex items-center gap-2 border-b border-border/50 p-5 pb-3">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-48 rounded" />
          </div>
          <div className="space-y-2 p-5 pt-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1 rounded-lg border border-border/50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-24 rounded" />
                    <Skeleton className="h-4 w-32 rounded" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery schedule */}
        <div className="card-elevated">
          <div className="flex items-center gap-2 border-b border-border/50 p-5 pb-3">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-40 rounded" />
          </div>
          <div className="space-y-2 p-5 pt-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border/50 px-3 py-2 space-y-1">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20 rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
                <Skeleton className="h-3 w-full rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Backorder & risk alerts - full width */}
        <div className="card-elevated lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-border/50 p-5 pb-3">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-44 rounded" />
          </div>
          <div className="flex flex-col gap-3 p-5 pt-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border/50 px-3 py-2">
                  <Skeleton className="h-3 w-full rounded" />
                </div>
              ))}
            </div>
            <Skeleton className="h-8 w-28 rounded shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
