import type { Account } from "@/data/mockData";

/** Next ACC-### id based on existing rows (seed + user-created). */
export function nextAccountId(existing: Account[]): string {
  let max = 0;
  for (const a of existing) {
    const m = a.id.match(/^ACC-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `ACC-${String(max + 1).padStart(3, "0")}`;
}
