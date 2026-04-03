import { loadStripe, type Stripe } from "@stripe/stripe-js";

const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim();

export const stripePublishableConfigured = Boolean(pk);

let promise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> | null {
  if (!pk) return null;
  if (!promise) promise = loadStripe(pk);
  return promise;
}
