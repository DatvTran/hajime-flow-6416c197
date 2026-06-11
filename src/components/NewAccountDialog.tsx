import { useEffect, useState } from "react";
import type { Account } from "@/data/mockData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { StripeSetupLinkQr } from "@/components/StripeSetupLinkQr";
import { nextAccountId } from "@/lib/account-ids";
import { stripePublishableConfigured } from "@/lib/stripe-client";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, Loader2, QrCode } from "lucide-react";

const SALES_REPS = ["Marcus Chen", "Sarah Kim", "Luca Moretti"] as const;
const ACCOUNT_TYPES: Account["type"][] = ["retail", "bar", "restaurant", "hotel", "distributor", "lifestyle"];
const DISTRIBUTOR_ACCOUNT_TYPES: Account["type"][] = ["retail", "bar", "restaurant", "hotel"];
const ACCOUNT_STATUSES: Account["status"][] = ["active", "prospect", "inactive"];

type CreateResult = Promise<{ success: boolean; data?: { id?: string }; error?: string }>;

function parseTags(s: string): string[] {
  return s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  onCreate: (account: Account) => CreateResult;
};

export function NewAccountDialog({ open, onOpenChange, accounts, onCreate }: Props) {
  const { user } = useAuth();
  const isDistributor = user?.role === "distributor";
  const typeOptions = isDistributor ? DISTRIBUTOR_ACCOUNT_TYPES : ACCOUNT_TYPES;

  const [step, setStep] = useState<"form" | "qr">("form");
  const [created, setCreated] = useState<Account | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [tradingName, setTradingName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Canada");
  const [type, setType] = useState<Account["type"]>("retail");
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [salesOwner, setSalesOwner] = useState<(typeof SALES_REPS)[number]>(SALES_REPS[0]);
  const [status, setStatus] = useState<Account["status"]>("prospect");
  const [tagsInput, setTagsInput] = useState("");
  const [avgOrderSize, setAvgOrderSize] = useState("0");

  useEffect(() => {
    if (!open) {
      setStep("form");
      setCreated(null);
      setSubmitting(false);
      setTradingName("");
      setLegalName("");
      setCity("");
      setCountry("Canada");
      setType("retail");
      setContactName("");
      setContactRole("");
      setEmail("");
      setPhone("");
      setPaymentTerms("Net 30");
      setSalesOwner(SALES_REPS[0]);
      setStatus("prospect");
      setTagsInput("");
      setAvgOrderSize("0");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tn = tradingName.trim();
    const ln = legalName.trim();
    const em = email.trim();
    if (!tn || !ln || !em) {
      toast.error("Trading name, legal name, and email are required");
      return;
    }
    const dup = accounts.some((a) => (a.tradingName?.toLowerCase() || "") === tn.toLowerCase());
    if (dup) {
      toast.error("An account with this trading name already exists");
      return;
    }
    const account: Account = {
      id: nextAccountId(accounts),
      legalName: ln,
      tradingName: tn,
      country: country.trim() || "Canada",
      city: city.trim(),
      type: isDistributor && !DISTRIBUTOR_ACCOUNT_TYPES.includes(type) ? "retail" : type,
      contactName: contactName.trim(),
      contactRole: contactRole.trim(),
      phone: phone.trim(),
      email: em,
      salesOwner: isDistributor ? user?.displayName || salesOwner : salesOwner,
      paymentTerms: paymentTerms.trim() || "Net 30",
      firstOrderDate: "",
      lastOrderDate: "",
      avgOrderSize: Math.max(0, Math.round(Number(avgOrderSize) || 0)),
      status,
      tags: parseTags(tagsInput),
    };

    setSubmitting(true);
    try {
      const result = await onCreate(account);
      if (!result.success) {
        if (result.error) {
          toast.error("Could not save account", { description: result.error });
        }
        return;
      }
      const serverId = result.data?.id ? String(result.data.id) : account.id;
      const saved = { ...account, id: serverId };
      setCreated(saved);
      setStep("qr");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,760px)] overflow-y-auto sm:max-w-lg">
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle>New account</DialogTitle>
              <DialogDescription>
                {isDistributor
                  ? "Add an on-premise retail account. It is saved to the server immediately; card setup on the next step is optional."
                  : "Add a customer or distributor account (Brand Operator). Complete profile and contact email here. For distributors and warehouse partners, go to Settings → CRM afterward to send the portal invite. You can share a Stripe link and QR code on the next step."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="new-trading">Trading name *</Label>
                  <Input
                    id="new-trading"
                    value={tradingName}
                    onChange={(e) => setTradingName(e.target.value)}
                    required
                    disabled={submitting}
                    className="touch-manipulation"
                    autoComplete="organization"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="new-legal">Legal name *</Label>
                  <Input
                    id="new-legal"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    required
                    disabled={submitting}
                    className="touch-manipulation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-city">City</Label>
                  <Input
                    id="new-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={submitting}
                    className="touch-manipulation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-country">Country</Label>
                  <Input
                    id="new-country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    disabled={submitting}
                    className="touch-manipulation"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as Account["type"])} disabled={submitting}>
                    <SelectTrigger className="touch-manipulation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((t) => (
                        <SelectItem key={t} value={t} className="capitalize">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-contact">Contact name</Label>
                  <Input
                    id="new-contact"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    disabled={submitting}
                    className="touch-manipulation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-role">Role</Label>
                  <Input
                    id="new-role"
                    value={contactRole}
                    onChange={(e) => setContactRole(e.target.value)}
                    disabled={submitting}
                    className="touch-manipulation"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="new-email">Email *</Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={submitting}
                    className="touch-manipulation"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="new-phone">Phone</Label>
                  <Input
                    id="new-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={submitting}
                    className="touch-manipulation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-terms">Payment terms</Label>
                  <Input
                    id="new-terms"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    disabled={submitting}
                    className="touch-manipulation"
                  />
                </div>
                {!isDistributor ? (
                  <div className="space-y-2">
                    <Label>Sales owner</Label>
                    <Select
                      value={salesOwner}
                      onValueChange={(v) => setSalesOwner(v as (typeof SALES_REPS)[number])}
                      disabled={submitting}
                    >
                      <SelectTrigger className="touch-manipulation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SALES_REPS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as Account["status"])} disabled={submitting}>
                    <SelectTrigger className="touch-manipulation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-avg">Avg order ($)</Label>
                  <Input
                    id="new-avg"
                    type="number"
                    min={0}
                    value={avgOrderSize}
                    onChange={(e) => setAvgOrderSize(e.target.value)}
                    disabled={submitting}
                    className="touch-manipulation"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="new-tags">Tags (comma-separated)</Label>
                  <Input
                    id="new-tags"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="new-account, toronto"
                    disabled={submitting}
                    className="touch-manipulation"
                  />
                </div>
              </div>
              <DialogFooter className="flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="touch-manipulation"
                  disabled={submitting}
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="touch-manipulation" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                      Saving…
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : created ? (
          <>
            <div className="flex items-start gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              <p>
                <strong className="font-medium text-foreground">{created.tradingName}</strong> is saved on the server (
                <span className="font-mono text-xs">{created.id}</span>). You can close this dialog or continue with optional card setup below.
              </p>
            </div>
            <DialogHeader className="pt-2">
              <DialogTitle className="flex items-center gap-2 text-base">
                <QrCode className="h-5 w-5" aria-hidden />
                Optional: card on file
              </DialogTitle>
              <DialogDescription>
                {stripePublishableConfigured
                  ? "Share this QR code or link so the business can add a payment method on Stripe’s secure page. After they finish, the card syncs to this account."
                  : "Stripe is not configured in this environment. The account is already saved — skip this step or configure Stripe locally to generate a link and QR code."}
              </DialogDescription>
            </DialogHeader>
            <StripeSetupLinkQr
              key={created.id}
              accountKey={created.tradingName}
              email={created.email}
              displayName={created.tradingName}
            />
            {isDistributor ? (
              <p className="text-xs text-muted-foreground">
                To add retail portal logins, open this account from the list → Retail portal users.
              </p>
            ) : null}
            <DialogFooter>
              <Button type="button" className="w-full touch-manipulation sm:w-auto" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}