import { PageHeaderSkeleton, StatCardSkeleton, TableSkeleton, ListItemSkeleton } from "./SkeletonUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ManufacturerSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth={200} descWidth={380} />

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCardSkeleton featured />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          <Card className="card-elevated border-border/70 shadow-none">
            <CardHeader className="border-b border-border/50 p-5 pb-3">
              <Skeleton className="h-5 w-36 rounded" />
              <Skeleton className="mt-1 h-3 w-56 rounded" />
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {Array.from({ length: 3 }).map((_, i) => (
                <ListItemSkeleton key={i} lines={3} />
              ))}
            </CardContent>
          </Card>

          <Card className="card-elevated border-border/70 shadow-none">
            <CardHeader className="border-b border-border/50 p-5 pb-3">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="mt-1 h-3 w-48 rounded" />
            </CardHeader>
            <CardContent className="overflow-x-auto pt-0">
              <TableSkeleton rows={4} cols={5} />
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card className="card-elevated border-border/70 shadow-none">
            <CardHeader className="border-b border-border/50 p-5 pb-3 flex flex-row items-center justify-between">
              <Skeleton className="h-5 w-36 rounded" />
              <Skeleton className="h-8 w-20 rounded" />
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <ListItemSkeleton key={i} lines={2} />
              ))}
            </CardContent>
          </Card>

          <Card className="card-elevated border-border/70 shadow-none">
            <CardHeader className="border-b border-border/50 p-5 pb-3">
              <Skeleton className="h-5 w-32 rounded" />
              <Skeleton className="mt-1 h-3 w-48 rounded" />
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="w-full rounded" style={{ height: 200 }} />
            </CardContent>
          </Card>

          <Card className="card-elevated border-border/70 shadow-none">
            <CardHeader className="border-b border-border/50 p-5 pb-3 flex flex-row items-center justify-between">
              <Skeleton className="h-5 w-28 rounded" />
              <Skeleton className="h-8 w-20 rounded" />
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Shipments table */}
      <Card className="card-elevated border-border/70 shadow-none">
        <CardHeader className="border-b border-border/50 p-5 pb-3 flex flex-row items-center justify-between">
          <Skeleton className="h-5 w-36 rounded" />
          <Skeleton className="h-8 w-20 rounded" />
        </CardHeader>
        <CardContent className="overflow-x-auto pt-0">
          <TableSkeleton rows={5} cols={6} />
        </CardContent>
      </Card>
    </div>
  );
}
