export type ConnectOption = { id: string; label: string; img: string | null };

export const CONNECT_BUSINESS: ConnectOption[] = [
  { id: "restaurant", label: "Restaurant", img: "/connect-img/restaurant.jpg" },
  { id: "bar", label: "Bar", img: "/connect-img/bar.jpg" },
  { id: "hotel", label: "Hotel", img: "/connect-img/hotel.jpg" },
  { id: "retail", label: "Retail", img: "/connect-img/retail.jpg" },
  { id: "wholesale", label: "Wholesale", img: "/connect-img/wholesale.jpg" },
  { id: "importer", label: "Importer", img: "/connect-img/importer.jpg" },
  { id: "other", label: "Other", img: null },
];

export const CONNECT_PRODUCTS = [
  { id: "first_press", name: "First Press", desc: "Coffee Rhum", img: "/connect-img/first_press.jpg" },
  { id: "second_bloom", name: "Second Bloom", desc: "Yuzu Mint Rhum", img: "/connect-img/second_bloom.jpg" },
] as const;

export const CONNECT_PURPOSES: ConnectOption[] = [
  { id: "pricing", label: "Pricing", img: "/connect-img/pricing.jpg" },
  { id: "tasting", label: "Tasting", img: "/connect-img/tasting.jpg" },
  { id: "distribution", label: "Distribution", img: "/connect-img/distribution.jpg" },
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
