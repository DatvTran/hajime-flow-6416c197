import type { AppData } from "@/types/app-data";

const KEY = "hajime-app-data-v1";

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
  } catch {
    /* ignore */
  }
}
