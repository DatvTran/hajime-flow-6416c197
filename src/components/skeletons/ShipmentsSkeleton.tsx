import { PageHeaderSkeleton, StatCardSkeleton, TableSkeleton, SearchBarSkeleton, ListItemSkeleton } from "./SkeletonUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ShipmentsSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth={140} descWidth={360} />
      
      {/* Asymmetric KPI strip */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCardSkeleton featured />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <SearchBarSkeleton filterCount={1} />

      {/* Active shipments list */}
      <Card className="card-elevated border-border/70 shadow-none">
        <CardHeader className="border-b border-border/50 p-5 pb-3">
          <Skeleton className="h-5 w-32 rounded" />
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <ListItemSkeleton key={i} lines={2} />
          ))}
        </CardContent>
      </Card>

      {/* Completed shipments */}
      <Card className="card-elevated border-border/70 shadow-none">
        <CardHeader className="border-b border-border/50 p-5 pb-3">
          <Skeleton className="h-5 w-36 rounded" />
        </CardHeader>
        <CardContent className="overflow-x-auto pt-0">
          <TableSkeleton rows={4} cols={6} />
        </CardContent>
      </Card>
    </div>
  );
}
