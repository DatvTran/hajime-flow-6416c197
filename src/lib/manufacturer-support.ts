export type SupportFaq = {
  question: string;
  answer: string;
};

export type SupportLiaison = {
  initials: string;
  name: string;
  role: string;
  email: string;
  escalationEmail: string;
  escalationSla: string;
};

export const SUPPORT_LIAISON: SupportLiaison = {
  initials: "H",
  name: "Hajime",
  role: "Brand Operator · HQ Production Liaison · responds within 2 hours on business days",
  email: "dat@drinkhajime.jp",
  escalationEmail: "production@hajimespirits.com",
  escalationSla: "4 hours",
};

export const SUPPORT_SUBJECTS = [
  "Production request query",
  "Rice / material allocation",
  "Quality spec clarification",
  "Manufacturer partner program",
  "Shipment / logistics",
  "Other",
] as const;

export const SUPPORT_URGENCY_OPTIONS = [
  "Normal (next business day)",
  "High (within 4 hours)",
  "Urgent (immediately)",
] as const;

export const SUPPORT_FAQS: SupportFaq[] = [
  {
    question: "How are production requests prioritized?",
    answer:
      "HQ assigns each request a due-by start date and urgency. Action-needed requests (red) should be scheduled first. Contact Hajime if a deadline conflicts with your brew calendar capacity.",
  },
  {
    question: "What determines my quality score?",
    answer:
      "Quality pass rate = batches passing HQ spec ÷ batches tested. Each batch is graded by lab analysis against SMV, acidity, alcohol, amino acidity, and polish ratio targets. A+ batches earn an additional per-bottle bonus.",
  },
  {
    question: "How is yield efficiency calculated?",
    answer:
      "Actual bottle yield ÷ theoretical maximum yield from the rice input. Losses from pressing, filtration, and pasteurization all count. Master manufacturer partner requires 95% sustained over the quarter.",
  },
  {
    question: "When is my production premium paid?",
    answer:
      "Premiums are calculated at quarter-end on total bottles shipped and accepted by HQ, then paid within 15 days. Q2 premium will be paid by 15 Jul 2026.",
  },
  {
    question: "How do I request a rice allocation increase?",
    answer:
      "Use the rice subsidy fund or contact Hajime for priority Yamada Nishiki allocation. Preferred manufacturer partners get guaranteed Grade A supply at contract rate.",
  },
];
