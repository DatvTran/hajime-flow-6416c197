import type { Account } from "@/data/mockData";

export function nextAccountId(accounts: Account[]): string {
  let max = 0;
  for (const a of accounts) {
    const m = a.id.match(/^ACC-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `ACC-${String(max + 1).padStart(3, "0")}`;
}

/** Demo partners + legacy seed CRM rows are client-only — never PUT to the API. */
export function shouldSyncAccountToApi(id: string): boolean {
  const norm = id.trim();
  if (!norm) return false;
  if (norm.startsWith("demo-")) return false;
  if (/^ACC-[A-Z][A-Z0-9-]*$/i.test(norm)) return false;
  return true;
}
