import { PageHeaderSkeleton, StatCardSkeleton, TableSkeleton, ListItemSkeleton } from "./SkeletonUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function GlobalMarketsSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth={160} descWidth={400} />

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCardSkeleton featured />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 sm:grid-cols-5">
        <div className="sm:col-span-3">
          <Card className="card-elevated border-border/70 shadow-none">
            <CardHeader className="border-b border-border/50 p-5 pb-3">
              <Skeleton className="h-5 w-32 rounded" />
              <Skeleton className="mt-1 h-3 w-24 rounded" />
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="w-full rounded" style={{ height: 200 }} />
            </CardContent>
          </Card>
        </div>
        <div className="sm:col-span-2">
          <Card className="card-elevated border-border/70 shadow-none">
            <CardHeader className="border-b border-border/50 p-5 pb-3">
              <Skeleton className="h-5 w-28 rounded" />
              <Skeleton className="mt-1 h-3 w-24 rounded" />
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="w-full rounded" style={{ height: 200 }} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Market detail table */}
      <Card className="card-elevated border-border/70 shadow-none">
        <CardHeader className="border-b border-border/50 p-5 pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-28 rounded" />
            <div className="flex gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-10 rounded-md" />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto pt-0">
          <TableSkeleton rows={5} cols={6} />
        </CardContent>
      </Card>

      {/* Manufacturers table */}
      <Card className="card-elevated border-border/70 shadow-none">
        <CardHeader className="border-b border-border/50 p-5 pb-3">
          <Skeleton className="h-5 w-40 rounded" />
          <Skeleton className="mt-1 h-3 w-56 rounded" />
        </CardHeader>
        <CardContent className="overflow-x-auto pt-0">
          <TableSkeleton rows={5} cols={5} />
        </CardContent>
      </Card>

      {/* Geo map */}
      <Card className="card-elevated border-border/70 shadow-none">
        <CardHeader className="border-b border-border/50 p-5 pb-3">
          <Skeleton className="h-5 w-24 rounded" />
        </CardHeader>
        <CardContent className="pt-0">
          <Skeleton className="w-full rounded" style={{ height: 300 }} />
        </CardContent>
      </Card>
    </div>
  );
}
