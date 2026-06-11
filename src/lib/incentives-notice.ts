const STORAGE_KEY = "hajime_incentives_load_fallback_dismissed";

export function isIncentivesLoadFallbackNoticeDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissIncentivesLoadFallbackNotice(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}
