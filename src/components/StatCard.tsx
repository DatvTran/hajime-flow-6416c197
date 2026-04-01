import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: number;
  variant?: "default" | "accent" | "warning" | "success";
}

const variantStyles = {
  default: "bg-card border",
  accent: "bg-accent/10 border border-accent/20",
  warning: "bg-warning/10 border border-warning/20",
  success: "bg-success/10 border border-success/20",
};

export function StatCard({ label, value, subtitle, icon: Icon, trend, variant = "default" }: StatCardProps) {
  return (
    <div className={cn("rounded-xl p-5 transition-shadow hover:shadow-md", variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-2xl font-semibold text-foreground">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
          {trend !== undefined && (
            <p className={cn("mt-1 text-xs font-medium", trend >= 0 ? "text-success" : "text-destructive")}>
              {trend >= 0 ? "+" : ""}{trend}%
            </p>
          )}
        </div>
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
