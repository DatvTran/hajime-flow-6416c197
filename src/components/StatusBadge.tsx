import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const STATUS_I18N_KEY: Record<string, string> = {
  available: "Available",
  reserved: "Reserved",
  damaged: "Damaged",
  "in-transit": "In Transit",
  "in-production": "In Production",
  draft: "Draft",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  approved: "Approved",
  completed: "Completed",
  delayed: "Delayed",
  pending: "Pending",
  paid: "Paid",
  overdue: "Overdue",
  active: "Active",
  prospect: "Prospect",
  inactive: "Inactive",
  preparing: "Preparing",
  development: "Development",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const STATUS_THEME: Record<string, { dot: string; pill: string }> = {
  available: { dot: "bg-emerald-500", pill: "bg-emerald-500/8 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20" },
  reserved: { dot: "bg-amber-500", pill: "bg-amber-500/8 text-amber-700 dark:text-amber-400 ring-amber-500/20" },
  damaged: { dot: "bg-red-500", pill: "bg-red-500/8 text-red-700 dark:text-red-400 ring-red-500/20" },
  "in-transit": { dot: "bg-blue-500", pill: "bg-blue-500/8 text-blue-700 dark:text-blue-400 ring-blue-500/20" },
  "in-production": { dot: "bg-stone-400", pill: "bg-stone-400/10 text-stone-600 dark:text-stone-400 ring-stone-400/20" },
  draft: { dot: "bg-stone-400", pill: "bg-stone-400/10 text-stone-600 dark:text-stone-400 ring-stone-400/20" },
  confirmed: { dot: "bg-blue-500", pill: "bg-blue-500/8 text-blue-700 dark:text-blue-400 ring-blue-500/20" },
  packed: { dot: "bg-amber-500", pill: "bg-amber-500/8 text-amber-700 dark:text-amber-400 ring-amber-500/20" },
  shipped: { dot: "bg-blue-500", pill: "bg-blue-500/8 text-blue-700 dark:text-blue-400 ring-blue-500/20" },
  delivered: { dot: "bg-emerald-500", pill: "bg-emerald-500/8 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20" },
  cancelled: { dot: "bg-red-500", pill: "bg-red-500/8 text-red-700 dark:text-red-400 ring-red-500/20" },
  approved: { dot: "bg-emerald-500", pill: "bg-emerald-500/8 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20" },
  completed: { dot: "bg-emerald-500", pill: "bg-emerald-500/8 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20" },
  delayed: { dot: "bg-red-500", pill: "bg-red-500/8 text-red-700 dark:text-red-400 ring-red-500/20" },
  pending: { dot: "bg-amber-500", pill: "bg-amber-500/8 text-amber-700 dark:text-amber-400 ring-amber-500/20" },
  paid: { dot: "bg-emerald-500", pill: "bg-emerald-500/8 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20" },
  overdue: { dot: "bg-red-500", pill: "bg-red-500/8 text-red-700 dark:text-red-400 ring-red-500/20" },
  active: { dot: "bg-emerald-500", pill: "bg-emerald-500/8 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20" },
  prospect: { dot: "bg-blue-500", pill: "bg-blue-500/8 text-blue-700 dark:text-blue-400 ring-blue-500/20" },
  inactive: { dot: "bg-stone-400", pill: "bg-stone-400/10 text-stone-600 dark:text-stone-400 ring-stone-400/20" },
  preparing: { dot: "bg-amber-500", pill: "bg-amber-500/8 text-amber-700 dark:text-amber-400 ring-amber-500/20" },
  development: { dot: "bg-blue-500", pill: "bg-blue-500/8 text-blue-700 dark:text-blue-400 ring-blue-500/20" },
  high: { dot: "bg-red-500", pill: "bg-red-500/8 text-red-700 dark:text-red-400 ring-red-500/20" },
  medium: { dot: "bg-amber-500", pill: "bg-amber-500/8 text-amber-700 dark:text-amber-400 ring-amber-500/20" },
  low: { dot: "bg-emerald-500", pill: "bg-emerald-500/8 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20" },
};

const FALLBACK = { dot: "bg-stone-400", pill: "bg-stone-400/10 text-stone-600 dark:text-stone-400 ring-stone-400/20" };

export function StatusBadge({
  status,
  size = "sm",
  label,
  className,
}: {
  status: string;
  size?: "sm" | "xs";
  label?: string;
  className?: string;
}) {
  const { t } = useLanguage();
  const theme = STATUS_THEME[status] || FALLBACK;
  const key = label ?? STATUS_I18N_KEY[status] ?? status.replace(/-/g, " ");
  const text = t(key);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium capitalize ring-1 ring-inset",
        theme.pill,
        size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-[11px]",
        className,
      )}
    >
      <span className={cn("status-dot", theme.dot)} />
      {text}
    </span>
  );
}
