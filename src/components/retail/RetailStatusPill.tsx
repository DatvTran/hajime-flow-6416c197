import { retailBucketFromStatus, retailStatusLabel } from "@/components/retail/RetailStatusChip";
import { cn } from "@/lib/utils";

type PillTone = "green" | "blue" | "amber" | "red" | "neutral";

function toneFromStatus(status: string): PillTone {
  const bucket = retailBucketFromStatus(status);
  if (bucket === "delivered") return "green";
  if (bucket === "in_transit") return "blue";
  if (status === "cancelled") return "red";
  return "amber";
}

const PILL: Record<PillTone, { wrap: string; dot: string }> = {
  green: {
    wrap: "border-emerald-600/20 bg-emerald-600/8 text-emerald-800 dark:text-emerald-100",
    dot: "bg-emerald-600",
  },
  blue: {
    wrap: "border-sky-500/20 bg-sky-500/8 text-sky-800 dark:text-sky-100",
    dot: "bg-sky-500",
  },
  amber: {
    wrap: "border-amber-500/30 bg-amber-500/12 text-amber-900 dark:text-amber-100",
    dot: "bg-amber-500",
  },
  red: {
    wrap: "border-red-500/20 bg-red-500/8 text-red-800 dark:text-red-100",
    dot: "bg-red-500",
  },
  neutral: {
    wrap: "border-border bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

type Props = {
  status: string;
  label?: string;
  className?: string;
};

/** Status pill with dot — retail-store-app `.pill` */
export function RetailStatusPill({ status, label, className }: Props) {
  const tone = toneFromStatus(status);
  const styles = PILL[tone];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize",
        styles.wrap,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", styles.dot)} />
      {label ?? retailStatusLabel(status)}
    </span>
  );
}
