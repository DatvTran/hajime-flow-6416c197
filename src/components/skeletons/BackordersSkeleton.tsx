import { PageHeaderSkeleton, StatCardSkeleton, TableSkeleton, ListItemSkeleton, SearchBarSkeleton } from "./SkeletonUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function BackordersSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth={220} descWidth={400} />

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCardSkeleton featured />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        <div className="grid w-full grid-cols-3 gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>

        {/* Backorders tab content */}
        <div className="space-y-4">
          <SearchBarSkeleton filterCount={2} />

          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="card-elevated border-border/70 shadow-none">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-3 w-20 rounded" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-14 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-32 rounded" />
                      <Skeleton className="h-3 w-48 rounded" />
                    </div>
                    <div className="text-right space-y-1">
                      <Skeleton className="h-3 w-20 rounded" />
                      <Skeleton className="h-6 w-12 rounded" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="flex justify-between">
                        <Skeleton className="h-3 w-28 rounded" />
                        <Skeleton className="h-3 w-12 rounded" />
                      </div>
                    ))}
                    <Skeleton className="h-2 w-full rounded" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-32 rounded" />
                    <Skeleton className="h-8 w-28 rounded" />
                    <Skeleton className="h-8 w-24 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
