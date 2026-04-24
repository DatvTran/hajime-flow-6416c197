import { PageHeaderSkeleton, ListItemSkeleton } from "./SkeletonUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AlertsHubSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth={100} descWidth={400} />

      <Card className="card-elevated border-border/70 shadow-none">
        <CardHeader className="border-b border-border/50 p-5 pb-3">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="mt-2 h-3 w-full rounded" />
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
              <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-14 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-3 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
              <Skeleton className="h-4 w-4 shrink-0 rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
