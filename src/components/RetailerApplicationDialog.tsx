import { useEffect, useState } from "react";
import type { Account } from "@/data/mockData";
import { nextAccountId } from "@/lib/account-ids";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/contexts/AuthContext";

const TYPES: Account["type"][] = ["retail", "bar", "restaurant", "hotel", "lifestyle"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  onCreate: (account: Account) => void;
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function RetailerApplicationDialog({ open, onOpenChange, accounts, onCreate }: Props) {
  const { user } = useAuth();
  const [tradingName, setTradingName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Canada");
  const [type, setType] = useState<Account["type"]>("restaurant");
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("Owner");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [summary, setSummary] = useState("");

  useEffect(() => {
    if (!open) {
      setTradingName("");
      setLegalName("");
      setCity("");
      setCountry("Canada");
      setType("restaurant");
      setContactName("");
      setContactRole("Owner");
      setEmail("");
      setPhone("");
      setSummary("");
    }
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tradingName.trim() || !legalName.trim() || !city.trim() || !contactName.trim() || !email.trim()) {
      toast.error("Trading name, legal name, city, contact, and email are required.");
      return;
    }
    if (accounts.some((a) => a.tradingName.toLowerCase() === tradingName.trim().toLowerCase())) {
      toast.error("An account with this trading name already exists.");
      return;
    }
    const id = nextAccountId(accounts);
    const row: Account = {
      id,
      legalName: legalName.trim(),
      tradingName: tradingName.trim(),
      country: country.trim() || "Canada",
      city: city.trim(),
      type,
      contactName: contactName.trim(),
      contactRole: contactRole.trim() || "—",
      phone: phone.trim() || "—",
      email: email.trim().toLowerCase(),
      salesOwner: user.displayName,
      paymentTerms: "Net 30",
      firstOrderDate: "",
      lastOrderDate: "",
      avgOrderSize: 0,
      status: "prospect",
      tags: ["onboarding", "prospect-pipeline"],
      onboardingPipeline: "sales_intake",
      applicationBusinessSummary: summary.trim() || undefined,
      applicationSubmittedAt: new Date().toISOString(),
    };
    onCreate(row);
    toast.success("Application submitted", { description: `${tradingName.trim()} — wholesaler review is next.` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New retailer application</DialogTitle>
          <DialogDescription>
            Submit business details for wholesaler verification and brand approval. You are listed as sales owner ({user.displayName}).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="ra-trade">Trading name *</Label>
            <Input id="ra-trade" value={tradingName} onChange={(e) => setTradingName(e.target.value)} className="touch-manipulation" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ra-legal">Legal entity *</Label>
            <Input id="ra-legal" value={legalName} onChange={(e) => setLegalName(e.target.value)} className="touch-manipulation" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ra-city">City *</Label>
              <Input id="ra-city" value={city} onChange={(e) => setCity(e.target.value)} className="touch-manipulation" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ra-country">Country</Label>
              <Input id="ra-country" value={country} onChange={(e) => setCountry(e.target.value)} className="touch-manipulation" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Venue type</Label>
            <Select value={type} onValueChange={(v) => setType(v as Account["type"])}>
              <SelectTrigger className="touch-manipulation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ra-contact">Primary contact *</Label>
            <Input id="ra-contact" value={contactName} onChange={(e) => setContactName(e.target.value)} className="touch-manipulation" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ra-role">Role</Label>
            <Input id="ra-role" value={contactRole} onChange={(e) => setContactRole(e.target.value)} className="touch-manipulation" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ra-email">Email *</Label>
            <Input id="ra-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="touch-manipulation" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ra-phone">Phone</Label>
            <Input id="ra-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="touch-manipulation" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ra-sum">Business summary</Label>
            <Textarea
              id="ra-sum"
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Seats, beverage program, expected volume, competitive set…"
              className="touch-manipulation resize-none"
            />
          </div>
          <p className="text-xs text-muted-foreground">Submitted {todayISO()} — pipeline: sales → wholesaler → brand HQ.</p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Submit application</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
