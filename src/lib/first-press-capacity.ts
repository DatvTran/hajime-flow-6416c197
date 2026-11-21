/** Keep in sync with server/lib/first-press-capacity.mjs. 7,500 L a month, shared by both First Press sizes. */
export const FIRST_PRESS_MONTHLY_ML = 7_500_000;

export const FIRST_PRESS_ML_PER_CASE: Record<string, number> = { first_press_750: 9_000, first_press_200: 4_800 };

export function firstPressMl(lines: { sku?: string; cases?: number }[]): number {
  return lines.reduce(
    (ml, l) => ml + (FIRST_PRESS_ML_PER_CASE[String(l.sku)] ?? 0) * Math.max(0, Math.floor(Number(l.cases) || 0)),
    0,
  );
}

export function litresLabel(ml: number): string {
  return `${(Math.round(ml / 100) / 10).toLocaleString("en-US")} L`;
}

export function isMonth(v: unknown): v is string {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(v ?? ""));
}

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const i = y * 12 + (m - 1) + n;
  return `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;
}

/** We bottle the month before the goods are due. */
export function productionMonth(deliveryMonth: string): string {
  return addMonths(deliveryMonth, -1);
}

export function monthLabel(month: string | null | undefined, style: "long" | "short" = "long"): string {
  if (!isMonth(month)) return "";
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: style, year: "numeric", timeZone: "UTC" });
}
