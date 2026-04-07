import type { Account } from "@/data/mockData";

export function nextAccountId(accounts: Account[]): string {
  let max = 0;
  for (const a of accounts) {
    const m = a.id.match(/^ACC-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `ACC-${String(max + 1).padStart(3, "0")}`;
}
