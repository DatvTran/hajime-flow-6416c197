import { Skeleton } from "@/components/ui/skeleton";

/** Main-column skeleton while lazy routes resolve (operator sidebar stays mounted). */
export function OperatorOutletFallback() {
  return (
    <div className="space-y-6 pb-8 animate-enter" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-9 w-[min(320px,60%)] rounded-md" />
        <Skeleton className="h-4 w-[min(480px,85%)] rounded-md" />
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
      </div>
    </div>
  );
}
