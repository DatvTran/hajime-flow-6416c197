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
  /** When set, the card navigates to this path (e.g. from Dashboard). */
  to?: string;
  /** When set (e.g. on Inventory), uses a button so filters always update without relying on same-route Link behavior. */
  onClick?: () => void;
  /** Highlights the tile when its filter matches the current view. */
  isActive?: boolean;
}

const variantStyles = {
  default: "bg-card border",
  accent: "bg-accent/10 border border-accent/20",
  warning: "bg-warning/10 border border-warning/20",
  success: "bg-success/10 border border-success/20",
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
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-2xl font-semibold text-foreground">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
          {trend !== undefined && (
            <p className={cn("mt-1 text-xs font-medium", trend >= 0 ? "text-success" : "text-destructive")}>
              {trend >= 0 ? "+" : ""}
              {trend}%
            </p>
          )}
        </div>
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
    </>
  );

  const interactiveRing = "touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  const shellClass = cn(
    "min-w-0 rounded-xl p-5 transition-shadow hover:shadow-md",
    variantStyles[variant],
    isActive && "ring-2 ring-accent shadow-md",
    (to || onClick) && interactiveRing,
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(shellClass, "w-full cursor-pointer text-left font-sans")}
        aria-pressed={isActive}
        aria-label={`Filter by ${label}`}
      >
        {inner}
      </button>
    );
  }

  if (to) {
    return (
      <Link to={to} className={cn(shellClass, "block text-inherit no-underline")} aria-label={`Open ${label}`}>
        {inner}
      </Link>
    );
  }

  return <div className={shellClass}>{inner}</div>;
}
