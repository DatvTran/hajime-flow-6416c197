import type { FirstPressCapacityMonth } from "@/lib/api-v1";
import { monthLabel } from "@/lib/first-press-capacity";
import { cn } from "@/lib/utils";

/** Upcoming First Press delivery months with litres left; tapping the picked month again clears it. */
export function DeliveryMonthStrip({
  months,
  value,
  onChange,
  quoteMl,
}: {
  months: FirstPressCapacityMonth[] | null;
  value: string;
  onChange: (month: string) => void;
  quoteMl: number;
}) {
  return (
    <div role="radiogroup" aria-label="Requested delivery month" className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
      {(months ?? []).map((m) => {
        const picked = value === m.deliveryMonth;
        const fits = quoteMl <= m.leftMl;
        return (
          <button
            key={m.deliveryMonth}
            type="button"
            role="radio"
            aria-checked={picked}
            onClick={() => onChange(picked ? "" : m.deliveryMonth)}
            className={cn(
              "rounded-lg border px-2 py-2 text-left transition-colors",
              picked ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:border-foreground/40",
            )}
          >
            <span className="block text-[13px] font-medium">{monthLabel(m.deliveryMonth, "short")}</span>
            <span
              className={cn(
                "block text-[12px] tabular-nums",
                picked ? "text-background/80" : fits ? "text-muted-foreground" : "text-[hsl(0_68%_40%)]",
              )}
            >
              {m.leftLitres.toLocaleString("en-US")} L left
            </span>
          </button>
        );
      })}
    </div>
  );
}
