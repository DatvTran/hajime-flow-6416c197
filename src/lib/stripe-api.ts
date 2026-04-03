function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";
  return `${base}${path}`;
}

async function parseError(res: Response): Promise<string> {
  const text = await res.text();
  const fallback = `HTTP ${res.status} ${res.statusText}`;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    const snippet = text.replace(/\s+/g, " ").trim().slice(0, 240);
    return snippet || `${fallback}. Is the Stripe API running? (npm run dev:stripe or npm run dev:full)`;
  }
  const j = parsed as { error?: unknown; message?: unknown };
  const errField = j.error;
  let msg: string | undefined;
  if (typeof errField === "string") msg = errField;
  else if (errField && typeof errField === "object" && errField !== null && "message" in errField) {
    const m = (errField as { message?: unknown }).message;
    if (typeof m === "string") msg = m;
  }
  if (!msg && typeof j.message === "string") msg = j.message;
  if (msg?.trim()) return msg.trim();
  return text.trim() || `${fallback}. Start the Stripe API on port 4242 (npm run dev:stripe).`;
}

export async function apiCreateCheckoutSetupSession(body: {
  customerId: string;
  accountKey: string;
  /** e.g. window.location.origin — used for success/cancel redirect URLs */
  origin: string;
}): Promise<{ url: string }> {
  const res = await fetch(apiUrl("/api/stripe/checkout-setup-session"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ url: string }>;
}

export async function apiVerifyCheckoutSession(sessionId: string): Promise<{
  ok: boolean;
  customerId: string;
  accountKey: string;
  setupStatus: string;
}> {
  const q = new URLSearchParams({ session_id: sessionId });
  const res = await fetch(apiUrl(`/api/stripe/checkout-session-status?${q}`));
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{
    ok: boolean;
    customerId: string;
    accountKey: string;
    setupStatus: string;
  }>;
}

export async function apiEnsureCustomer(body: { accountKey: string; email: string; name?: string }): Promise<string> {
  const res = await fetch(apiUrl("/api/stripe/customer"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = (await res.json()) as { customerId: string };
  return data.customerId;
}

export async function apiCreateSetupIntent(customerId: string): Promise<string> {
  const res = await fetch(apiUrl("/api/stripe/setup-intent"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerId }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = (await res.json()) as { clientSecret: string };
  return data.clientSecret;
}

export async function apiCreatePaymentIntent(body: {
  customerId: string;
  amountCents: number;
  orderId: string;
  currency?: string;
}): Promise<string> {
  const res = await fetch(apiUrl("/api/stripe/payment-intent"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = (await res.json()) as { clientSecret: string };
  return data.clientSecret;
}

export async function apiChargeSavedCard(body: {
  customerId: string;
  amountCents: number;
  orderId: string;
  currency?: string;
}): Promise<{ status: string; paymentIntentId?: string }> {
  const res = await fetch(apiUrl("/api/stripe/charge-saved-card"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await parseError(res);
    throw new Error(err);
  }
  return res.json() as Promise<{ status: string; paymentIntentId?: string }>;
}

export async function apiListCardLast4s(customerId: string): Promise<string[]> {
  const res = await fetch(apiUrl(`/api/stripe/payment-methods/${encodeURIComponent(customerId)}`));
  if (!res.ok) throw new Error(await parseError(res));
  const data = (await res.json()) as { cards: { last4?: string }[] };
  return data.cards.map((c) => c.last4).filter(Boolean) as string[];
}

/** `order.price` is in dollars (same as mock data). */
export function orderAmountCents(priceDollars: number): number {
  return Math.max(50, Math.round(Number(priceDollars) * 100));
}
