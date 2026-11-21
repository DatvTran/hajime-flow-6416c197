import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Horizontal scroll region for wide tables on phone/tablet; no page-level overflow. */
export function MobileTableScroll({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("-mx-4 overflow-x-auto touch-pan-x px-4 sm:mx-0 sm:px-0", className)}>
      {children}
    </div>
  );
}
