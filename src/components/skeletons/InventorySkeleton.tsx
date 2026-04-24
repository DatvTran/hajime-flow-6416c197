import { PageHeaderSkeleton, StatCardSkeleton, TableSkeleton, SearchBarSkeleton, CardSkeleton, ListItemSkeleton } from "./SkeletonUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function InventorySkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth={140} descWidth={380} />
      
      {/* KPI strip */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton featured />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <SearchBarSkeleton filterCount={3} />

      {/* Inventory table */}
      <Card className="card-elevated border-border/70 shadow-none">
        <CardHeader className="border-b border-border/50 p-5 pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32 rounded" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24 rounded" />
              <Skeleton className="h-8 w-24 rounded" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto pt-0">
          <TableSkeleton rows={6} cols={7} />
        </CardContent>
      </Card>
    </div>
  );
}
