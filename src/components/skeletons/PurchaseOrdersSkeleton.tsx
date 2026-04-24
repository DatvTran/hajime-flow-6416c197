import { PageHeaderSkeleton, TableSkeleton, SearchBarSkeleton, ListItemSkeleton, StatCardSkeleton } from "./SkeletonUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function PurchaseOrdersSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth={200} descWidth={360} />
      
      {/* Tab toggle */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-32 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* KPI strip */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCardSkeleton featured />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <SearchBarSkeleton filterCount={1} />

      {/* Orders table */}
      <Card className="card-elevated border-border/70 shadow-none">
        <CardHeader className="border-b border-border/50 p-5 pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-8 w-28 rounded" />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto pt-0">
          <TableSkeleton rows={6} cols={7} />
        </CardContent>
      </Card>
    </div>
  );
}
