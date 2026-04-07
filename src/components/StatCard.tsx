import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: number;
  variant?: "default" | "accent" | "warning" | "success";
  to?: string;
  onClick?: () => void;
  isActive?: boolean;
}

const variantStyles = {
  default: "bg-card border border-border/60",
  accent:
    "bg-gradient-to-br from-amber-50/80 to-amber-100/40 dark:from-amber-950/20 dark:to-amber-900/10 border border-amber-200/50 dark:border-amber-800/30",
  warning:
    "bg-gradient-to-br from-orange-50/80 to-orange-100/40 dark:from-orange-950/20 dark:to-orange-900/10 border border-orange-200/50 dark:border-orange-800/30",
  success:
    "bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 dark:from-emerald-950/20 dark:to-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/30",
};

const iconStyles = {
  default: "bg-muted/80 text-muted-foreground",
  accent: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  warning: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
  success: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
};

export function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  to,
  onClick,
  isActive,
}: StatCardProps) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground animate-count-up">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
          {trend !== undefined && (
            <div className="mt-1.5 inline-flex items-center gap-1">
              <svg
                className={cn("h-3 w-3", trend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={trend >= 0 ? "M7 17l5-5 5 5" : "M7 7l5 5 5-5"} />
              </svg>
              <span
                className={cn(
                  "text-xs font-semibold tabular-nums",
                  trend >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400",
                )}
              >
                {trend >= 0 ? "+" : ""}
                {trend}%
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors", iconStyles[variant])}>
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </div>
        )}
      </div>
    </>
  );

  const interactiveRing = "touch-manipulation focus-ring";
  const shellClass = cn(
    "min-w-0 rounded-2xl p-5 transition-all duration-300 ease-out-expo",
    "shadow-soft hover:shadow-lifted",
    variantStyles[variant],
    isActive && "ring-2 ring-accent ring-offset-2 ring-offset-background shadow-lifted",
    (to || onClick) && interactiveRing,
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(shellClass, "w-full cursor-pointer text-left font-sans active:scale-[0.98]")}
        aria-pressed={isActive}
        aria-label={`Filter by ${label}`}
      >
        {inner}
      </button>
    );
  }

  if (to) {
    return (
      <Link to={to} className={cn(shellClass, "block text-inherit no-underline active:scale-[0.98]")} aria-label={`Open ${label}`}>
        {inner}
      </Link>
    );
  }

  return <div className={shellClass}>{inner}</div>;
}
