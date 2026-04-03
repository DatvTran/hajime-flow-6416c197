/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Publishable key (pk_test_... / pk_live_...) — safe in the browser */
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  /** Optional API origin for Stripe routes in production (e.g. https://api.example.com). Leave empty if /api is same-origin. */
  readonly VITE_API_BASE_URL?: string;
}
