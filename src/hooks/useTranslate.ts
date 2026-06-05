import { useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

/** Re-run when language changes — use for breadcrumbs and page chrome. */
export function useTranslate() {
  const { language, t } = useLanguage();
  const translate = useCallback((text: string) => t(text), [language, t]);
  return { language, t: translate };
}
