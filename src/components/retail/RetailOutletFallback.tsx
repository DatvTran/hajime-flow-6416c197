import { Skeleton } from "@/components/ui/skeleton";

/** Narrow loading state for the retail main column only (sidebar stays mounted). */
export function RetailOutletFallback() {
  return (
    <div className="space-y-6 pb-8 animate-enter" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[min(280px,55%)] rounded-md" />
        <Skeleton className="h-4 w-[min(420px,80%)] rounded-md" />
      </div>
      <Skeleton className="h-[180px] w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </div>
  );
}
