export type ConnectOption = { id: string; label: string };

export const CONNECT_BUSINESS: ConnectOption[] = [
  { id: "restaurant", label: "Restaurant" },
  { id: "bar", label: "Bar" },
  { id: "hotel", label: "Hotel" },
  { id: "retail", label: "Retail" },
  { id: "wholesale", label: "Wholesale" },
  { id: "importer", label: "Importer" },
  { id: "other", label: "Other" },
];

export const CONNECT_PRODUCTS = [
  { id: "first_press", name: "First Press", desc: "Coffee Rhum", img: "/connect-img/first_press.jpg" },
  { id: "second_bloom", name: "Second Bloom", desc: "Yuzu Mint Rhum", img: "/connect-img/second_bloom.jpg" },
] as const;

export const CONNECT_PURPOSES: ConnectOption[] = [
  { id: "pricing", label: "Pricing" },
  { id: "tasting", label: "Tasting" },
  { id: "distribution", label: "Distribution" },
];

export const CONNECT_CHOICES_KEY = "hajime_supply_v1_choices";

export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;

export function newSubmissionKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID().replace(/-/g, "");
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function isValidEnquiryEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Combines the picked dial code with the typed number unless the buyer pasted a full +number. */
export function internationalPhone(dial: string, phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) return `+${phoneDigits(trimmed)}`;
  if (trimmed.startsWith("00")) return `+${phoneDigits(trimmed).slice(2)}`;
  return `${dial}${phoneDigits(trimmed).replace(/^0+/, "")}`;
}
