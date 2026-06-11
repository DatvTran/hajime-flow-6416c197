import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const RETAIL_TRACKER_STEPS = ["Placed", "Approved", "Packed", "In transit", "Delivered"] as const;

export function fulfillmentStepIndex(status: string): number {
  switch (status) {
    case "draft":
      return 0;
    case "confirmed":
      return 1;
    case "packed":
      return 2;
    case "shipped":
      return 3;
    case "delivered":
      return 4;
    default:
      return 0;
  }
}

function stepRowState(status: string, stepIndex: number): "done" | "current" | "upcoming" {
  if (status === "cancelled") return stepIndex === 0 ? "current" : "upcoming";
  if (status === "delivered") return "done";
  const cur = fulfillmentStepIndex(status);
  if (stepIndex < cur) return "done";
  if (stepIndex === cur) return "current";
  return "upcoming";
}

type Props = {
  status: string;
  dates?: (string | undefined)[];
};

/** Five-step tracker — retail-store-app `.tracker-steps` */
export function RetailShipmentTracker({ status, dates }: Props) {
  return (
    <div className="relative mb-4">
      <div className="pointer-events-none absolute left-[5%] right-[5%] top-4 z-0 h-0.5 bg-border" aria-hidden />
      <div className="relative z-[1] flex items-start">
        {RETAIL_TRACKER_STEPS.map((label, i) => {
          const row = stepRowState(status, i);
          const date = dates?.[i];
          return (
            <div key={label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 border-card text-xs font-medium",
                  row === "done" && "bg-[hsl(158_56%_36%)] text-white",
                  row === "current" && "bg-accent text-accent-foreground shadow-[0_0_0_5px_hsl(40_88%_42%/0.16)]",
                  row === "upcoming" && "bg-muted text-muted-foreground",
                )}
              >
                {row === "done" ? <Check className="size-3.5" strokeWidth={2} /> : row === "current" ? "●" : "○"}
              </div>
              <span className={cn("text-[11px] font-medium", row === "upcoming" ? "text-muted-foreground" : "text-foreground")}>
                {label}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">{date ?? (row === "upcoming" ? "—" : "—")}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
