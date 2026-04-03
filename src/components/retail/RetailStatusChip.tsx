import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100",
  in_transit: "bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-100",
  delivered: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100",
  cancelled: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export type RetailOrderFilter = "all" | "pending" | "in_transit" | "delivered";

export function retailBucketFromStatus(status: string): RetailOrderFilter {
  if (status === "delivered") return "delivered";
  if (status === "cancelled") return "pending";
  if (status === "draft" || status === "confirmed") return "pending";
  if (status === "packed" || status === "shipped") return "in_transit";
  return "pending";
}

export function retailStatusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: "Pending review",
    confirmed: "Approved",
    packed: "Processing",
    shipped: "In transit",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return map[status] ?? status;
}

export function RetailStatusChip({ status }: { status: string }) {
  const bucket = retailBucketFromStatus(status);
  const key = bucket === "pending" ? "pending" : bucket === "in_transit" ? "in_transit" : bucket === "delivered" ? "delivered" : "pending";
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", STYLES[key])}>
      {retailStatusLabel(status)}
    </span>
  );
}
