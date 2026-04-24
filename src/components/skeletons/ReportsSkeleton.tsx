import { PageHeaderSkeleton, TableSkeleton, CardSkeleton } from "./SkeletonUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth={160} descWidth={400} />
      
      {/* Alert banner */}
      <Skeleton className="h-16 w-full rounded-lg" />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 w-[180px] rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>

      {/* KPI row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-interactive p-4 space-y-2">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-8 w-20 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="card-elevated border-border/70 shadow-none">
          <CardHeader className="border-b border-border/50 p-5 pb-3">
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="mt-1 h-3 w-24 rounded" />
          </CardHeader>
          <CardContent className="pt-0">
            <Skeleton className="w-full rounded" style={{ height: 240 }} />
          </CardContent>
        </Card>
        <Card className="card-elevated border-border/70 shadow-none">
          <CardHeader className="border-b border-border/50 p-5 pb-3">
            <Skeleton className="h-5 w-28 rounded" />
            <Skeleton className="mt-1 h-3 w-24 rounded" />
          </CardHeader>
          <CardContent className="pt-0">
            <Skeleton className="w-full rounded" style={{ height: 240 }} />
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="card-elevated border-border/70 shadow-none">
          <CardHeader className="border-b border-border/50 p-5 pb-3">
            <Skeleton className="h-5 w-36 rounded" />
          </CardHeader>
          <CardContent className="overflow-x-auto pt-0">
            <TableSkeleton rows={5} cols={4} />
          </CardContent>
        </Card>
        <Card className="card-elevated border-border/70 shadow-none">
          <CardHeader className="border-b border-border/50 p-5 pb-3">
            <Skeleton className="h-5 w-36 rounded" />
          </CardHeader>
          <CardContent className="overflow-x-auto pt-0">
            <TableSkeleton rows={5} cols={4} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
