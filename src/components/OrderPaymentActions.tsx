import { useState } from "react";
import type { SalesOrder } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";
import { useAccounts } from "@/contexts/AppDataContext";
import { invoiceMailto, overdueNoticeMailto, resolveAccountForOrder, saveCardLinkMailto } from "@/lib/billing";
import { stripePublishableConfigured } from "@/lib/stripe-client";
import {
  apiChargeSavedCard,
  apiCreateCheckoutSetupSession,
  apiEnsureCustomer,
  apiListCardLast4s,
  orderAmountCents,
} from "@/lib/stripe-api";
import { getStoredCardLast4, setStoredCardLast4, setStoredCustomerId } from "@/lib/stripe-local";
import { Copy, CreditCard, Mail } from "lucide-react";
import { StripePayOrderDialog } from "@/components/StripePayOrderDialog";
import { StripeSaveCardDialog } from "@/components/StripeSaveCardDialog";

type Props = {
  order: SalesOrder;
  onPatch: (id: string, patch: Partial<Pick<SalesOrder, "status" | "paymentStatus">>) => void;
  onStripeBillingUpdated?: () => void;
};

export function OrderPaymentActions({ order, onPatch, onStripeBillingUpdated }: Props) {
  const { accounts } = useAccounts();
  const [chargeOpen, setChargeOpen] = useState(false);
  const [payCardOpen, setPayCardOpen] = useState(false);
  const [saveCardOpen, setSaveCardOpen] = useState(false);
  const [charging, setCharging] = useState(false);
  const [creatingCustomerLink, setCreatingCustomerLink] = useState(false);

  const account = resolveAccountForOrder(order, accounts);
  const billingEmail = account?.email ?? "billing@hajime.example";
  const mockLast4 = account?.cardOnFileLast4;
  const storedLast4 = getStoredCardLast4(order.account);
  const displayLast4 = mockLast4 ?? storedLast4;
  const hasCardHint = Boolean(displayLast4);

  const sendInvoice = () => {
    toast.success("Invoice queued", {
      description: `Sending to ${billingEmail} for ${order.id} (and opening your mail app)`,
    });
    window.open(invoiceMailto(order, billingEmail), "_blank", "noopener,noreferrer");
  };

  const sendOverdueNotice = () => {
    toast.success("Overdue notice queued", {
      description: `Emailing ${billingEmail} about ${order.id}`,
    });
    window.open(overdueNoticeMailto(order, billingEmail), "_blank", "noopener,noreferrer");
  };

  const runChargeSavedCard = async () => {
    setChargeOpen(false);
    setCharging(true);
    try {
      const customerId = await apiEnsureCustomer({
        accountKey: order.account,
        email: billingEmail,
        name: order.account,
      });
      await apiChargeSavedCard({
        customerId,
        amountCents: orderAmountCents(order.price),
        orderId: order.id,
      });
      onPatch(order.id, { paymentStatus: "paid" });
      try {
        const lasts = await apiListCardLast4s(customerId);
        if (lasts[0]) setStoredCardLast4(order.account, lasts[0]);
      } catch {
        /* ignore */
      }
      onStripeBillingUpdated?.();
      toast.success("Card charged", {
        description: `Visa ••••${displayLast4 ?? "····"} — ${order.id} marked paid.`,
      });
    } catch (e) {
      const msg = String(e);
      toast.error("Charge failed", {
        description: msg.includes("No saved card") ? `${msg} Save a card first, or use Pay with card.` : msg,
      });
    } finally {
      setCharging(false);
    }
  };

  const createCustomerCheckoutSetupUrl = async () => {
    const customerId = await apiEnsureCustomer({
      accountKey: order.account,
      email: billingEmail,
      name: order.account,
    });
    setStoredCustomerId(order.account, customerId);
    const { url } = await apiCreateCheckoutSetupSession({
      customerId,
      accountKey: order.account,
      origin: window.location.origin,
    });
    return url;
  };

  const emailCustomerSaveCardLink = async () => {
    setCreatingCustomerLink(true);
    try {
      const url = await createCustomerCheckoutSetupUrl();
      window.open(saveCardLinkMailto(billingEmail, order.account, url), "_blank", "noopener,noreferrer");
      toast.success("Opening email draft", {
        description: `Send the Stripe link to ${billingEmail}. When they finish, they return to Orders and the card syncs here.`,
      });
    } catch (e) {
      toast.error("Could not create customer link", { description: String(e) });
    } finally {
      setCreatingCustomerLink(false);
    }
  };

  const copyCustomerSaveCardLink = async () => {
    setCreatingCustomerLink(true);
    try {
      const url = await createCustomerCheckoutSetupUrl();
      await navigator.clipboard.writeText(url);
      toast.success("Link copied", {
        description: "Share it with your customer. After they add a card, they land back on Orders and we update this account.",
      });
    } catch (e) {
      toast.error("Could not create link", { description: String(e) });
    } finally {
      setCreatingCustomerLink(false);
    }
  };

  if (order.paymentStatus === "paid") {
    return (
      <p className="rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Paid.</span> No balance due on this order.
      </p>
    );
  }

  const showStripeChargeOnInvoice =
    stripePublishableConfigured && (order.paymentStatus === "pending" || order.paymentStatus === "overdue");

  return (
    <>
      <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Invoice</p>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Invoice #</span>
            <span className="font-mono font-medium">{order.id}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Amount due</span>
            <span className="font-semibold tabular-nums text-foreground">${order.price.toLocaleString()} CAD</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Bill to</span>
            <span className="max-w-[60%] break-all text-right font-medium">{billingEmail}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Charge the default card saved on the Stripe customer for this account (same amount as this invoice).
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {showStripeChargeOnInvoice ? (
            <>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="touch-manipulation"
                disabled={charging}
                onClick={() => setChargeOpen(true)}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Charge card on file
              </Button>
              <Button type="button" variant="outline" size="sm" className="touch-manipulation" onClick={() => setPayCardOpen(true)}>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay with card (3DS / new card)
              </Button>
            </>
          ) : null}
          {order.paymentStatus === "pending" ? (
            <Button type="button" variant="outline" size="sm" className="touch-manipulation" onClick={sendInvoice}>
              <Mail className="mr-2 h-4 w-4" />
              Send invoice
            </Button>
          ) : null}
          {order.paymentStatus === "overdue" ? (
            <Button type="button" variant="outline" size="sm" className="touch-manipulation" onClick={sendOverdueNotice}>
              <Mail className="mr-2 h-4 w-4" />
              Email overdue notice
            </Button>
          ) : null}
        </div>

        {!stripePublishableConfigured && (order.paymentStatus === "pending" || order.paymentStatus === "overdue") ? (
          <p className="text-xs text-muted-foreground">
            Set <code className="rounded bg-muted px-1">VITE_STRIPE_PUBLISHABLE_KEY</code> and run the Stripe API server (
            <code className="rounded bg-muted px-1">npm run dev:full</code>) to charge the card on file from this invoice.
          </p>
        ) : null}
      </div>

      <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Billing & Stripe</p>
        {hasCardHint ? (
          <p className="text-sm text-foreground">
            <CreditCard className="mr-1.5 inline-block h-4 w-4 align-text-bottom text-muted-foreground" aria-hidden />
            Card on file: <span className="font-mono font-medium">Visa ••••{displayLast4}</span>
            {storedLast4 && !mockLast4 ? (
              <span className="ml-1 text-xs text-muted-foreground">(from Stripe)</span>
            ) : null}
            {order.paymentStatus === "overdue" ? (
              <span className="mt-1 block text-xs text-muted-foreground">
                Use <strong className="text-foreground">Charge card on file</strong> on the invoice above to bill this card for the
                order amount. If the bank requires 3DS, use <strong className="text-foreground">Pay with card</strong> instead.
              </span>
            ) : (
              <span className="mt-1 block text-xs text-muted-foreground">
                Use <strong className="text-foreground">Charge card on file</strong> on the invoice above to collect from the saved
                card. Save a card first if none exists in Stripe yet.
              </span>
            )}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No card on file yet. Use <strong className="text-foreground">Save card on account</strong> here, send your customer a{" "}
            <strong className="text-foreground">secure link</strong> (Stripe Checkout), or <strong className="text-foreground">Pay with card</strong>{" "}
            on this order.
          </p>
        )}

        {stripePublishableConfigured && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Customer link:</strong> Opens Stripe’s hosted page so they can add a card safely. They are
              redirected back to <span className="font-medium text-foreground">Orders</span> when done; this dashboard picks up the card on file.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button type="button" variant="secondary" size="sm" className="touch-manipulation" onClick={() => setSaveCardOpen(true)}>
                <CreditCard className="mr-2 h-4 w-4" />
                Save card on account
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="touch-manipulation"
                disabled={creatingCustomerLink}
                onClick={emailCustomerSaveCardLink}
              >
                <Mail className="mr-2 h-4 w-4" />
                Email link to customer
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="touch-manipulation"
                disabled={creatingCustomerLink}
                onClick={copyCustomerSaveCardLink}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy customer link
              </Button>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={chargeOpen} onOpenChange={setChargeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Charge card on file?</AlertDialogTitle>
            <AlertDialogDescription>
              Your API charges the default saved card on the Stripe customer for this account (off-session). If the bank
              requires 3D Secure, the charge may fail — use <strong>Pay with card (3DS / new card)</strong> instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Amount: <strong className="text-foreground">${order.price.toLocaleString()} CAD</strong>
              {displayLast4 ? (
                <>
                  {" "}
                  · Card <strong className="font-mono text-foreground">••••{displayLast4}</strong>
                </>
              ) : null}{" "}
              · {order.account} · {order.id}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="touch-manipulation">Cancel</AlertDialogCancel>
            <AlertDialogAction className="touch-manipulation" onClick={runChargeSavedCard} disabled={charging}>
              {charging ? "Charging…" : "Charge card"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <StripePayOrderDialog
        open={payCardOpen}
        onOpenChange={setPayCardOpen}
        order={order}
        accountEmail={billingEmail}
        accountKey={order.account}
        accountDisplayName={order.account}
        onPaid={() => {
          onPatch(order.id, { paymentStatus: "paid" });
        }}
        onStripeUpdated={onStripeBillingUpdated}
      />

      <StripeSaveCardDialog
        open={saveCardOpen}
        onOpenChange={setSaveCardOpen}
        accountEmail={billingEmail}
        accountKey={order.account}
        accountDisplayName={order.account}
        onSaved={onStripeBillingUpdated}
      />
    </>
  );
}
