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
import { QrCode } from "lucide-react";

const SALES_REPS = ["Marcus Chen", "Sarah Kim", "Luca Moretti"] as const;
const ACCOUNT_TYPES: Account["type"][] = ["retail", "bar", "restaurant", "hotel", "distributor", "lifestyle"];
const ACCOUNT_STATUSES: Account["status"][] = ["active", "prospect", "inactive"];

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
  onCreate: (account: Account) => void;
};

export function NewAccountDialog({ open, onOpenChange, accounts, onCreate }: Props) {
  const [step, setStep] = useState<"form" | "qr">("form");
  const [created, setCreated] = useState<Account | null>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tn = tradingName.trim();
    const ln = legalName.trim();
    const em = email.trim();
    if (!tn || !ln || !em) {
      toast.error("Trading name, legal name, and email are required");
      return;
    }
    const dup = accounts.some((a) => a.tradingName.toLowerCase() === tn.toLowerCase());
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
      type,
      contactName: contactName.trim(),
      contactRole: contactRole.trim(),
      phone: phone.trim(),
      email: em,
      salesOwner,
      paymentTerms: paymentTerms.trim() || "Net 30",
      firstOrderDate: "",
      lastOrderDate: "",
      avgOrderSize: Math.max(0, Math.round(Number(avgOrderSize) || 0)),
      status,
      tags: parseTags(tagsInput),
    };
    onCreate(account);
    setCreated(account);
    setStep("qr");
    toast.success("Account created", { description: `${account.id} · ${account.tradingName}` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,760px)] overflow-y-auto sm:max-w-lg">
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle>New account</DialogTitle>
              <DialogDescription>Add a customer account. You can share a Stripe link and QR code on the next step.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="new-trading">Trading name *</Label>
                  <Input
                    id="new-trading"
                    value={tradingName}
                    onChange={(e) => setTradingName(e.target.value)}
                    required
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
                    className="touch-manipulation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-city">City</Label>
                  <Input id="new-city" value={city} onChange={(e) => setCity(e.target.value)} className="touch-manipulation" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-country">Country</Label>
                  <Input id="new-country" value={country} onChange={(e) => setCountry(e.target.value)} className="touch-manipulation" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as Account["type"])}>
                    <SelectTrigger className="touch-manipulation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="capitalize">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-contact">Contact name</Label>
                  <Input id="new-contact" value={contactName} onChange={(e) => setContactName(e.target.value)} className="touch-manipulation" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-role">Role</Label>
                  <Input id="new-role" value={contactRole} onChange={(e) => setContactRole(e.target.value)} className="touch-manipulation" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="new-email">Email *</Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="touch-manipulation"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="new-phone">Phone</Label>
                  <Input id="new-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="touch-manipulation" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-terms">Payment terms</Label>
                  <Input id="new-terms" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className="touch-manipulation" />
                </div>
                <div className="space-y-2">
                  <Label>Sales owner</Label>
                  <Select value={salesOwner} onValueChange={(v) => setSalesOwner(v as (typeof SALES_REPS)[number])}>
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
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as Account["status"])}>
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
                    className="touch-manipulation"
                  />
                </div>
              </div>
              <DialogFooter className="flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" className="touch-manipulation" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="touch-manipulation">
                  Create account
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : created ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" aria-hidden />
                Card setup for {created.tradingName}
              </DialogTitle>
              <DialogDescription>
                Share this QR code or link with the business so they can add a payment method on Stripe’s secure page. After they finish, they
                return to your Orders screen and the card syncs to this account.
              </DialogDescription>
            </DialogHeader>
            <StripeSetupLinkQr key={created.id} accountKey={created.tradingName} email={created.email} displayName={created.tradingName} />
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
