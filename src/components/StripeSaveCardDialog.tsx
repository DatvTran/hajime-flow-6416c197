import { useEffect, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getStripe } from "@/lib/stripe-client";
import { apiCreateSetupIntent, apiEnsureCustomer, apiListCardLast4s } from "@/lib/stripe-api";
import { setStoredCardLast4, setStoredCustomerId } from "@/lib/stripe-local";
import { toast } from "@/components/ui/sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountEmail: string;
  accountKey: string;
  accountDisplayName: string;
  onSaved?: () => void;
};

function SaveForm({ onSuccess, onError }: { onSuccess: () => void; onError: (msg: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    try {
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/orders`,
        },
        redirect: "if_required",
      });
      if (error) {
        onError(error.message ?? "Could not save card");
        return;
      }
      if (setupIntent?.status === "succeeded") {
        onSuccess();
        return;
      }
      onError(setupIntent ? `Setup status: ${setupIntent.status}` : "No setup result");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <DialogFooter>
        <Button type="submit" disabled={!stripe || submitting} className="touch-manipulation">
          {submitting ? "Saving…" : "Save card"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function StripeSaveCardDialog({
  open,
  onOpenChange,
  accountEmail,
  accountKey,
  accountDisplayName,
  onSaved,
}: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const stripePromise = getStripe();

  useEffect(() => {
    if (!open) {
      setClientSecret(null);
      setLoadError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      setClientSecret(null);
      try {
        const customerId = await apiEnsureCustomer({
          accountKey,
          email: accountEmail,
          name: accountDisplayName,
        });
        setStoredCustomerId(accountKey, customerId);
        const secret = await apiCreateSetupIntent(customerId);
        if (!cancelled) setClientSecret(secret);
      } catch (e) {
        if (!cancelled) setLoadError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, accountKey, accountEmail, accountDisplayName]);

  const handleSuccess = async () => {
    try {
      const customerId = await apiEnsureCustomer({
        accountKey,
        email: accountEmail,
        name: accountDisplayName,
      });
      const lasts = await apiListCardLast4s(customerId);
      if (lasts[0]) setStoredCardLast4(accountKey, lasts[0]);
    } catch {
      /* ignore */
    }
    toast.success("Card saved", { description: `Payment method on file for ${accountDisplayName}.` });
    onSaved?.();
    onOpenChange(false);
    setClientSecret(null);
  };

  if (!stripePromise) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,640px)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save card on account</DialogTitle>
          <DialogDescription>
            Card is stored securely with Stripe for {accountDisplayName}. You can charge it when payment is overdue (if
            the bank allows off-session charges).
          </DialogDescription>
        </DialogHeader>
        {loading && <p className="text-sm text-muted-foreground">Preparing form…</p>}
        {loadError && <p className="text-sm text-destructive">{loadError}</p>}
        {clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
            <SaveForm
              onSuccess={handleSuccess}
              onError={(msg) => toast.error("Could not save card", { description: msg })}
            />
          </Elements>
        )}
        <Button type="button" variant="ghost" className="touch-manipulation" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}
