import { PageHeaderSkeleton } from "./SkeletonUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth={120} descWidth={300} />

      {/* Products section */}
      <Card className="card-elevated border-border/70 shadow-none">
        <CardHeader className="border-b border-border/50 p-5 pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-24 rounded" />
            <Skeleton className="h-8 w-28 rounded" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Team members section */}
      <Card className="card-elevated border-border/70 shadow-none">
        <CardHeader className="border-b border-border/50 p-5 pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-28 rounded" />
            <Skeleton className="h-8 w-32 rounded" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-3 w-36 rounded" />
                </div>
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Operational settings */}
      <Card className="card-elevated border-border/70 shadow-none">
        <CardHeader className="border-b border-border/50 p-5 pb-3">
          <Skeleton className="h-5 w-40 rounded" />
          <Skeleton className="mt-1 h-3 w-64 rounded" />
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            ))}
          </div>
          <Skeleton className="h-9 w-24 rounded-md" />
        </CardContent>
      </Card>
    </div>
  );
}
