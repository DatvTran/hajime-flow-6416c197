import type { AppData } from "@/types/app-data";

/** Bumped when manufacturer portal demo seed must not rehydrate from an old browser cache. */
const KEY = "hajime-app-data-v2";
const LEGACY_KEYS = ["hajime-app-data-v1"];

export function loadLocalAppData(): AppData | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppData;
  } catch {
    return null;
  }
}

/** Persist full app snapshot for refresh when the API is offline (same shape as PUT /api/app). */
export function saveLocalAppData(data: AppData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* quota */
  }
}

export function clearLocalAppData(): void {
  try {
    localStorage.removeItem(KEY);
    for (const legacy of LEGACY_KEYS) localStorage.removeItem(legacy);
  } catch {
    /* ignore */
  }
}

/** Drop obsolete v1 snapshots so Kirin/Florin demo rows can't stick around after demo wipe. */
export function purgeLegacyLocalAppData(): void {
  try {
    for (const legacy of LEGACY_KEYS) localStorage.removeItem(legacy);
  } catch {
    /* ignore */
  }
}
