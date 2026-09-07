const KEY = "hajime-dismissed-alerts-v1";

export function loadDismissedAlertIds(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

export function saveDismissedAlertIds(ids: Set<string>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify([...ids]));
  } catch {
    /* quota */
  }
}

export function dismissAllAlertIds(ids: string[]): Set<string> {
  const next = loadDismissedAlertIds();
  for (const id of ids) next.add(id);
  saveDismissedAlertIds(next);
  return next;
}
