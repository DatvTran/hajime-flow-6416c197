import type { ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

/** Page hero — matches retail-store-app `.ph-row` */
export function RetailPageHeader({ title, description, actions }: Props) {
  const { t, language } = useLanguage();
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 key={language} className="font-display text-[26px] font-semibold tracking-[-0.02em] text-foreground">
          {t(title)}
        </h1>
        {description ? (
          <p key={language} className="mt-1 max-w-[54ch] text-[13px] leading-relaxed text-muted-foreground">
            {t(description)}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
