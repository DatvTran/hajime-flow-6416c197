import { Check } from "lucide-react";
import type { NewProductRequest } from "@/data/mockData";
import {
  HQ_NPR_STAGES,
  NPR_STAGE_COLORS,
  nprStageProgress,
} from "@/lib/hq-product-development-display";
import { useLanguage } from "@/contexts/LanguageContext";

export function NprPipelineStepper({ status }: { status: NewProductRequest["status"] }) {
  const { t } = useLanguage();
  const { index: activeIndex, failed } = nprStageProgress(status);

  return (
    <div className="relative mb-[18px] mt-1 flex items-start overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {HQ_NPR_STAGES.map((stage, si) => {
        const done = si < activeIndex || (si === activeIndex && !failed && status === "approved");
        const current = si === activeIndex;
        const color = NPR_STAGE_COLORS[si];
        const bg = done ? "hsl(158 56% 36%)" : current ? color : "hsl(var(--muted))";
        const fg = done || current ? "white" : "hsl(var(--muted-foreground))";

        return (
          <div key={stage} className="flex min-w-0 flex-1 items-start sm:min-w-0">
            <div className="relative z-[1] flex min-w-[64px] flex-1 flex-col items-center gap-1.5 sm:min-w-0">
              <div
                className="flex size-7 items-center justify-center rounded-full border-2 border-card text-[11px] font-semibold"
                style={{
                  background: bg,
                  color: fg,
                  boxShadow: current && !failed ? `0 0 0 4px ${color}2e` : undefined,
                }}
              >
                {done ? <Check className="size-3" strokeWidth={2.5} /> : si + 1}
              </div>
              <div
                className="max-w-[72px] text-center text-[10px] font-medium leading-tight sm:max-w-[90px]"
                style={{ color: done || current ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
              >
                {t(stage)}
              </div>
            </div>
            {si < HQ_NPR_STAGES.length - 1 ? (
              <div className="mt-[13px] hidden shrink-0 px-0.5 text-border sm:block" aria-hidden>
                ———
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
