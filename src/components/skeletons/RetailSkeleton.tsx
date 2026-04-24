import { Skeleton } from "@/components/ui/skeleton";

export function RetailSkeleton() {
  return (
    <div className="space-y-7 md:space-y-8">
      {/* Greeting */}
      <div>
        <Skeleton className="h-8 w-64 rounded" />
        <Skeleton className="mt-2 h-4 w-96 rounded" />
      </div>

      {/* Catalog section */}
      <div className="rounded-2xl border border-border/60 bg-gradient-to-b from-muted/30 to-transparent p-4 sm:p-6 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Skeleton className="h-6 w-40 rounded" />
            <Skeleton className="mt-1 h-4 w-72 rounded" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-5 w-32 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-9 w-28 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI snapshot */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5 rounded-[14px] border border-border/60 bg-card p-[18px]">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-8 w-20 rounded" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
        ))}
      </div>

      {/* Order tracker */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-40 rounded" />
            <Skeleton className="h-6 w-48 rounded" />
            <Skeleton className="h-4 w-56 rounded" />
          </div>
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        <div className="relative mt-5">
          <Skeleton className="h-0.5 w-full rounded" />
          <div className="relative z-[1] flex items-start gap-0 mt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
                <Skeleton className="h-[26px] w-[26px] rounded-full" />
                <Skeleton className="h-3 w-12 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-4 border-t border-border/60 pt-5">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-5 w-28 rounded" />
        </div>
      </div>

      {/* Recent orders */}
      <div>
        <Skeleton className="h-6 w-40 rounded" />
        <Skeleton className="mt-1 h-3 w-48 rounded" />
        <div className="mt-4 overflow-hidden rounded-[14px] border border-border/60 bg-card space-y-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 border-b border-border/50 px-4 py-3.5 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-center sm:gap-4">
              <div className="space-y-1">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
