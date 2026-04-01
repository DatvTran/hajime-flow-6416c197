import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  available: "bg-success/10 text-success",
  reserved: "bg-accent/10 text-accent",
  damaged: "bg-destructive/10 text-destructive",
  "in-transit": "bg-info/10 text-info",
  "in-production": "bg-muted text-muted-foreground",
  draft: "bg-muted text-muted-foreground",
  confirmed: "bg-info/10 text-info",
  packed: "bg-accent/10 text-accent",
  shipped: "bg-info/10 text-info",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
  approved: "bg-success/10 text-success",
  completed: "bg-success/10 text-success",
  delayed: "bg-destructive/10 text-destructive",
  pending: "bg-accent/10 text-accent",
  paid: "bg-success/10 text-success",
  overdue: "bg-destructive/10 text-destructive",
  active: "bg-success/10 text-success",
  prospect: "bg-info/10 text-info",
  inactive: "bg-muted text-muted-foreground",
  preparing: "bg-accent/10 text-accent",
  development: "bg-info/10 text-info",
  high: "bg-destructive/10 text-destructive",
  medium: "bg-accent/10 text-accent",
  low: "bg-success/10 text-success",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize",
      statusColors[status] || "bg-muted text-muted-foreground"
    )}>
      {status.replace("-", " ")}
    </span>
  );
}
