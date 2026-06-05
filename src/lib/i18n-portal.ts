/** Shared portal copy helpers — pass `t` from useLanguage(). */

export type TranslateFn = (text: string, vars?: Record<string, string | number>) => string;

export function portalTimeGreeting(t: TranslateFn): string {
  const h = new Date().getHours();
  if (h < 12) return t("Good morning");
  if (h < 17) return t("Good afternoon");
  return t("Good evening");
}

export function formatActivePoMetaI18n(
  order: { requestedDelivery?: string },
  lineCount: number,
  totalCases: number,
  t: TranslateFn,
  parseDue: (raw: string) => Date | null,
  formatCasesTotal: (cases: number) => string,
): string {
  const d = order.requestedDelivery ? parseDue(order.requestedDelivery) : null;
  let duePart = t("No delivery window set");
  if (d) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(d);
    due.setHours(0, 0, 0, 0);
    const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
    const time = d
      .toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
      .replace(/\s/g, "")
      .toLowerCase();
    if (diff === 0) duePart = t("Due today {{time}}", { time });
    else if (diff === 1) duePart = t("Due tomorrow {{time}}", { time });
    else if (diff < 0) duePart = t("Overdue");
    else
      duePart = t("Due {{date}}", {
        date: d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }),
      });
  }
  const items = t("{{count}} items", { count: lineCount });
  return `${duePart} · ${items} · ${formatCasesTotal(totalCases)}`;
}

export function formatQueueDueI18n(requestedDelivery: string, t: TranslateFn, parseDue: (raw: string) => Date | null): string {
  const d = parseDue(requestedDelivery);
  if (!d) return t("No due date");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(d);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
  const time = d
    .toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    .replace(/\s/g, "")
    .toLowerCase();
  if (diff === 0) return t("Today {{time}}", { time });
  if (diff === 1) return t("Tomorrow {{time}}");
  if (diff === -1) return t("Yesterday");
  if (diff < 0) return t("Overdue");
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}
