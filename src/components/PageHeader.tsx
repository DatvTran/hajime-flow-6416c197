import type { ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  titleAddon?: ReactNode;
  /** Retail store shell, sales rep field shell — same display title / description scale. */
  variant?: "default" | "retail" | "sales_rep" | "distributor";
}

export function PageHeader({ title, description, actions, titleAddon, variant = "default" }: PageHeaderProps) {
  const { t, language } = useLanguage();
  const useKitTypography = variant === "retail" || variant === "sales_rep" || variant === "distributor";
  const titleClass = useKitTypography
    ? "font-display text-[26px] font-semibold tracking-[-0.02em] text-foreground"
    : "font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl";
  const descClass = useKitTypography
    ? "mt-1 max-w-[54ch] text-[13px] leading-relaxed text-muted-foreground"
    : "mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground";
  return (
    <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-start sm:justify-between sm:gap-6 animate-enter">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 key={language} className={titleClass}>
            {t(title)}
          </h1>
          {titleAddon}
        </div>
        {description && (
          <p key={language} className={descClass}>
            {t(description)}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}
