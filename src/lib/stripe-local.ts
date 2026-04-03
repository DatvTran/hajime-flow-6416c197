/** Browser cache for Stripe card last4 per account (UI hint; Stripe remains source of truth). */

const key = (accountKey: string) => `hajime_stripe_last4_${encodeURIComponent(accountKey)}`;

export function getStoredCardLast4(accountKey: string): string | undefined {
  try {
    return localStorage.getItem(key(accountKey)) || undefined;
  } catch {
    return undefined;
  }
}

export function setStoredCardLast4(accountKey: string, last4: string) {
  try {
    localStorage.setItem(key(accountKey), last4);
  } catch {
    /* ignore */
  }
}

export function clearStoredCardLast4(accountKey: string) {
  try {
    localStorage.removeItem(key(accountKey));
  } catch {
    /* ignore */
  }
}

const customerKey = (accountKey: string) => `hajime_stripe_customer_${encodeURIComponent(accountKey)}`;

export function getStoredCustomerId(accountKey: string): string | undefined {
  try {
    return localStorage.getItem(customerKey(accountKey)) || undefined;
  } catch {
    return undefined;
  }
}

export function setStoredCustomerId(accountKey: string, customerId: string) {
  try {
    localStorage.setItem(customerKey(accountKey), customerId);
  } catch {
    /* ignore */
  }
}
