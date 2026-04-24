import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Reusable page header skeleton */
export function PageHeaderSkeleton({ titleWidth = 180, descWidth = 320 }: { titleWidth?: number; descWidth?: number }) {
  return (
    <div className="mb-6">
      <Skeleton className="h-8 w-full rounded" style={{ maxWidth: titleWidth }} />
      <Skeleton className="mt-2 h-4 w-full rounded" style={{ maxWidth: descWidth }} />
    </div>
  );
}

/** Skeleton for a stat/KPI card with icon + value + label */
export function StatCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div className="card-interactive flex items-center gap-4 p-4">
      <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
      <div className="flex-1">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className={`mt-1 rounded ${featured ? "h-8 w-20" : "h-6 w-16"}`} />
        <Skeleton className="mt-1 h-3 w-20 rounded" />
      </div>
    </div>
  );
}

/** Skeleton for a table with specified rows and columns */
export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b">
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} className="pb-2">
              <Skeleton className="h-3 w-16 rounded" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r} className="border-b border-border/40 last:border-0">
            {Array.from({ length: cols }).map((_, c) => (
              <td key={c} className="py-2.5">
                <Skeleton className="h-3 w-[80%] rounded" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Skeleton for a card with title + content */
export function CardSkeleton({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={`card-elevated border-border/70 shadow-none ${className || ""}`}>
      {title && (
        <CardHeader className="border-b border-border/50 p-5 pb-3">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="mt-1 h-3 w-48 rounded" />
        </CardHeader>
      )}
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
}

/** Skeleton for a search/filter bar */
export function SearchBarSkeleton({ filterCount = 2 }: { filterCount?: number }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Skeleton className="h-9 w-full min-w-[200px] flex-1 rounded-md" />
      {Array.from({ length: filterCount }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-[140px] rounded-md" />
      ))}
    </div>
  );
}

/** Skeleton for a list of items with title + subtitle */
export function ListItemSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className="rounded-lg border border-border/50 p-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full rounded" />
      ))}
    </div>
  );
}
