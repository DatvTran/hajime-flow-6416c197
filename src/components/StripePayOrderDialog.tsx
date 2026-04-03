import { useEffect, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { SalesOrder } from "@/data/mockData";
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
import { apiCreatePaymentIntent, apiEnsureCustomer, apiListCardLast4s, orderAmountCents } from "@/lib/stripe-api";
import { setStoredCardLast4, setStoredCustomerId } from "@/lib/stripe-local";
import { toast } from "@/components/ui/sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: SalesOrder | null;
  accountEmail: string;
  accountKey: string;
  accountDisplayName: string;
  onPaid: () => void;
  onStripeUpdated?: () => void;
};

function PayForm({
  orderId,
  amountLabel,
  onSuccess,
  onError,
}: {
  orderId: string;
  amountLabel: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/orders`,
        },
        redirect: "if_required",
      });
      if (error) {
        onError(error.message ?? "Payment failed");
        return;
      }
      if (paymentIntent?.status === "succeeded") {
        onSuccess();
        return;
      }
      onError(paymentIntent ? `Payment status: ${paymentIntent.status}` : "No payment result");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="submit" disabled={!stripe || submitting} className="touch-manipulation">
          {submitting ? "Processing…" : `Pay ${amountLabel}`}
        </Button>
      </DialogFooter>
      <p className="text-xs text-muted-foreground">Order {orderId} · Secured by Stripe</p>
    </form>
  );
}

export function StripePayOrderDialog({
  open,
  onOpenChange,
  order,
  accountEmail,
  accountKey,
  accountDisplayName,
  onPaid,
  onStripeUpdated,
}: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const stripePromise = getStripe();

  useEffect(() => {
    if (!open || !order) {
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
        const secret = await apiCreatePaymentIntent({
          customerId,
          amountCents: orderAmountCents(order.price),
          orderId: order.id,
        });
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
  }, [open, order, accountKey, accountEmail, accountDisplayName]);

  const amountLabel = order ? `$${order.price.toLocaleString()} CAD` : "";

  const handlePaid = async () => {
    if (!order) return;
    try {
      const customerId = await apiEnsureCustomer({
        accountKey,
        email: accountEmail,
        name: accountDisplayName,
      });
      const lasts = await apiListCardLast4s(customerId);
      if (lasts[0]) setStoredCardLast4(accountKey, lasts[0]);
    } catch {
      /* optional */
    }
    toast.success("Payment successful", { description: `${order.id} is paid.` });
    onPaid();
    onStripeUpdated?.();
    onOpenChange(false);
    setClientSecret(null);
  };

  if (!stripePromise) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,640px)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Process card payment</DialogTitle>
          <DialogDescription>
            {order ? (
              <>
                Enter card details below. Payment is processed by Stripe (Payment Element) — not a separate payment link
                tab. {order.id} · {amountLabel}
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        {loading && <p className="text-sm text-muted-foreground">Preparing secure checkout…</p>}
        {loadError && <p className="text-sm text-destructive">{loadError}</p>}
        {clientSecret && order && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: { theme: "stripe" },
            }}
          >
            <PayForm
              orderId={order.id}
              amountLabel={amountLabel}
              onSuccess={handlePaid}
              onError={(msg) => toast.error("Payment failed", { description: msg })}
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
