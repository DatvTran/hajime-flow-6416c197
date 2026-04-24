import { PageHeaderSkeleton, TableSkeleton, SearchBarSkeleton, CardSkeleton, ListItemSkeleton } from "./SkeletonUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function OrdersSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth={120} descWidth={360} />
      
      {/* Tab counts */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-md" />
        ))}
      </div>

      <SearchBarSkeleton filterCount={1} />

      {/* Orders table */}
      <Card className="card-elevated border-border/70 shadow-none">
        <CardHeader className="border-b border-border/50 p-5 pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="h-8 w-28 rounded" />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto pt-0">
          <TableSkeleton rows={8} cols={7} />
        </CardContent>
      </Card>
    </div>
  );
}
