import { PageHeaderSkeleton, StatCardSkeleton, TableSkeleton, SearchBarSkeleton, CardSkeleton, ListItemSkeleton } from "./SkeletonUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function MarketsSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth={160} descWidth={380} />
      
      {/* KPI strip */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton featured />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Charts + table */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Card className="card-elevated border-border/70 shadow-none">
            <CardHeader className="border-b border-border/50 p-5 pb-3">
              <Skeleton className="h-5 w-32 rounded" />
              <Skeleton className="mt-1 h-3 w-24 rounded" />
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="w-full rounded" style={{ height: 280 }} />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6 lg:col-span-4">
          <Card className="card-elevated border-border/70 shadow-none">
            <CardHeader className="border-b border-border/50 p-5 pb-3">
              <Skeleton className="h-5 w-28 rounded" />
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <ListItemSkeleton key={i} lines={2} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Markets table */}
      <Card className="card-elevated border-border/70 shadow-none">
        <CardHeader className="border-b border-border/50 p-5 pb-3">
          <Skeleton className="h-5 w-32 rounded" />
        </CardHeader>
        <CardContent className="overflow-x-auto pt-0">
          <TableSkeleton rows={8} cols={6} />
        </CardContent>
      </Card>
    </div>
  );
}
