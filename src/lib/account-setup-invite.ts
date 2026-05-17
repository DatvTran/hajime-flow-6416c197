export const INVITE_LINK_TTL_DAYS = 7;

export function defaultStoreInviteMessage(wholesalerLabel: string, repName?: string): string {
  const org = wholesalerLabel.trim() || "your wholesaler";
  const rep = repName?.trim() || "Your rep";
  return `I've set you up with a Hajime account. Please complete your application using the link below to activate ordering with ${org}.

This takes about 5 minutes. ${rep} will review and approve within one business day.

Welcome aboard.`;
}

export function formatInviteExpiry(iso?: string | null): string {
  if (!iso) {
    const d = new Date();
    d.setDate(d.getDate() + INVITE_LINK_TTL_DAYS);
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
