import { useCallback, useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { apiCreateCheckoutSetupSession, apiEnsureCustomer } from "@/lib/stripe-api";
import { stripePublishableConfigured } from "@/lib/stripe-client";
import { setStoredCustomerId } from "@/lib/stripe-local";
import { saveCardLinkMailto } from "@/lib/billing";
import { Copy, Mail, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/sonner";

type Props = {
  accountKey: string;
  email: string;
  displayName: string;
};

export function StripeSetupLinkQr({ accountKey, email, displayName }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => stripePublishableConfigured);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const customerId = await apiEnsureCustomer({
        accountKey,
        email,
        name: displayName,
      });
      setStoredCustomerId(accountKey, customerId);
      const { url: checkoutUrl } = await apiCreateCheckoutSetupSession({
        customerId,
        accountKey,
        origin: window.location.origin,
      });
      setUrl(checkoutUrl);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [accountKey, email, displayName]);

  useEffect(() => {
    if (!stripePublishableConfigured) return;
    void load();
    // stripePublishableConfigured is a module-level constant, not reactive state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  if (!stripePublishableConfigured) {
    return (
      <p className="text-sm text-muted-foreground">
        Set <code className="rounded bg-muted px-1">VITE_STRIPE_PUBLISHABLE_KEY</code> and run the Stripe API (
        <code className="rounded bg-muted px-1">npm run dev:full</code>) to generate a secure link and QR code.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {loading && !url ? <p className="text-sm text-muted-foreground">Preparing secure Stripe link…</p> : null}
      {error ? (
        <div className="space-y-2">
          <p className="text-sm text-destructive">{error}</p>
          <Button type="button" variant="outline" size="sm" className="touch-manipulation" onClick={() => void load()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </div>
      ) : null}
      {url ? (
        <>
          <div className="flex flex-col items-center gap-3 rounded-lg border bg-background p-4">
            <p className="text-center text-xs text-muted-foreground">
              Scan with a phone camera — opens Stripe so this business can add a card on file. They return to Orders when done.
            </p>
            <div className="rounded-lg bg-white p-3">
              <QRCode value={url} size={200} level="M" />
            </div>
            <p className="max-w-full break-all text-center font-mono text-[10px] text-muted-foreground">{url}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button type="button" variant="secondary" size="sm" className="touch-manipulation" onClick={() => void copy()}>
              <Copy className="mr-2 h-4 w-4" />
              Copy link
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="touch-manipulation"
              onClick={() => window.open(saveCardLinkMailto(email, displayName, url), "_blank", "noopener,noreferrer")}
            >
              <Mail className="mr-2 h-4 w-4" />
              Email link
            </Button>
          </div>
        </>
      ) : !loading && !error ? (
        <Button type="button" variant="secondary" size="sm" className="touch-manipulation" onClick={() => void load()}>
          Generate link & QR
        </Button>
      ) : null}
    </div>
  );
}
