export type RetailSupportFaq = { q: string; a: string };

export function retailSupportFaqs(repFirstName: string): RetailSupportFaq[] {
  return [
    {
      q: "How do I change my delivery address?",
      a: `Contact your Hajime rep ${repFirstName} to update delivery details on your account. Changes take effect within 1 business day.`,
    },
    {
      q: "When do I receive my quarterly rebate?",
      a: "Rebates are calculated at the end of each quarter and credited within 15 days. Q2 rebate will be paid by 15 Jul 2026.",
    },
    {
      q: "Can I place an order outside my reorder window?",
      a: `Yes — contact ${repFirstName} directly or place a draft order through the portal. They will confirm allocation and HQ approval typically within 24 hours.`,
    },
    {
      q: "What happens if my order is short-shipped?",
      a: "Hajime will credit the difference on your next invoice, or reship the shortfall in the following delivery cycle. Your rep will notify you proactively.",
    },
    {
      q: "How is my backbar depletion rate calculated?",
      a: "Depletion rate uses your weekly bottle count updates compared to the previous count. The cover days estimate assumes the same pace continues.",
    },
    {
      q: "Can I return product?",
      a: `Returns are accepted for damaged or incorrect product within 5 business days of delivery. Contact ${repFirstName} to arrange a return and credit note.`,
    },
  ];
}

/** Next Wednesday — matches retail-store-app support “Next check-in” demo. */
export function nextRepCheckInLabel(): { date: string; sub: string } {
  const now = new Date();
  const day = now.getDay();
  const daysUntilWed = ((3 - day + 7) % 7) || 7;
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntilWed);
  return {
    date: next.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }),
    sub: "Scheduled visit",
  };
}
