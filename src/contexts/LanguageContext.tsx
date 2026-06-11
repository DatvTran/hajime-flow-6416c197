import { useCallback, useSyncExternalStore, type ReactNode } from "react";
import {
  getPortalLanguage,
  getServerPortalLanguage,
  languageOptions,
  setPortalLanguage,
  subscribePortalLanguage,
  translatePortalText,
  type SupportedLanguage,
  type TranslateVars,
} from "@/lib/i18n-store";

export type { SupportedLanguage, TranslateVars };

/** Kept for App tree compatibility; language state lives in i18n-store. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useLanguage() {
  const language = useSyncExternalStore(
    subscribePortalLanguage,
    getPortalLanguage,
    getServerPortalLanguage,
  );

  const setLanguage = useCallback((next: SupportedLanguage) => {
    setPortalLanguage(next);
  }, []);

  const t = useCallback(
    (text: string, vars?: TranslateVars) => translatePortalText(language, text, vars),
    [language],
  );

  return { language, setLanguage, t, options: languageOptions };
}
