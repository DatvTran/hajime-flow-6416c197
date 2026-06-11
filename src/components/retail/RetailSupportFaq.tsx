import { useState } from "react";
import { cn } from "@/lib/utils";
import type { RetailSupportFaq } from "@/lib/retail-support-faqs";

type Props = {
  items: RetailSupportFaq[];
};

/** FAQ accordion — retail-store-app `.faq-item` */
export function RetailSupportFaqList({ items }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="overflow-hidden rounded-[14px] border border-border/70 bg-card px-5 shadow-[var(--shadow-soft)]">
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.q} className="border-b border-border/50 last:border-b-0">
            <button
              type="button"
              className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left text-sm font-medium text-foreground"
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
            >
              <span>{item.q}</span>
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs transition-transform duration-200",
                  open && "rotate-45",
                )}
                aria-hidden
              >
                +
              </span>
            </button>
            {open ? (
              <p className="pb-4 text-[13px] leading-relaxed text-muted-foreground">{item.a}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
