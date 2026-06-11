import { cn } from "@/lib/utils";

export type RetailFilterOption<T extends string> = { id: T; label: string };

type Props<T extends string> = {
  options: RetailFilterOption<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
};

/** Pill filter bar — retail-store-app `.filter-bar` */
export function RetailFilterPills<T extends string>({ options, value, onChange, className }: Props<T>) {
  return (
    <div className={cn("mb-5 flex flex-wrap items-center gap-1.5", className)}>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors touch-manipulation",
            value === opt.id
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
