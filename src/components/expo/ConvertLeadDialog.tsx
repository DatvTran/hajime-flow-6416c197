import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import {
  createAccountFromExpoLead,
  LeadAccountConflictError,
  type LeadAccountBody,
  type LeadAccountConflict,
} from "@/lib/api-v1";
import {
  LEAD_ACCOUNT_TYPES,
  type ExpoLeadDetail,
  type LeadAccountDraft,
} from "@/lib/expo-leads";

type Converted = Awaited<ReturnType<typeof createAccountFromExpoLead>>["data"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: ExpoLeadDetail;
  onConverted: (result: Converted) => void;
  /** The lead was linked elsewhere in the meantime; reload it. */
  onAlreadyLinked: () => void;
};

const EMPTY_DRAFT: LeadAccountDraft = {
  tradingName: "",
  legalName: "",
  type: "retail",
  contactName: "",
  email: "",
  phone: "",
  country: "",
  city: "",
  notes: "",
};

type Duplicate = Extract<LeadAccountConflict, { code: "possible_duplicate" }>["match"];

export function ConvertLeadDialog({ open, onOpenChange, lead, onConverted, onAlreadyLinked }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState<LeadAccountDraft>(EMPTY_DRAFT);
  const [salesOwner, setSalesOwner] = useState("");
  const [legalTouched, setLegalTouched] = useState(false);
  const [duplicate, setDuplicate] = useState<Duplicate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!open) return;
    const draft = lead.accountDraft ?? EMPTY_DRAFT;
    setForm(draft);
    setLegalTouched(Boolean(draft.legalName && draft.legalName !== draft.tradingName));
    setSalesOwner(user?.displayName ?? "");
    setDuplicate(null);
    setError(null);
    setSaving(false);
    inFlight.current = false;
  }, [open, lead.accountDraft, user?.displayName]);

  const set = <K extends keyof LeadAccountDraft>(key: K, value: LeadAccountDraft[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function submit(extra: Pick<LeadAccountBody, "linkAccountId" | "allowDuplicate"> = {}) {
    if (inFlight.current) return;
    if (!extra.linkAccountId && !form.tradingName.trim()) {
      setError("Please enter the business name.");
      return;
    }
    inFlight.current = true;
    setSaving(true);
    setError(null);
    try {
      const body: LeadAccountBody = extra.linkAccountId
        ? { linkAccountId: extra.linkAccountId }
        : {
            ...form,
            legalName: form.legalName.trim() || form.tradingName.trim(),
            salesOwner: salesOwner.trim() || undefined,
            allowDuplicate: extra.allowDuplicate,
          };
      const res = await createAccountFromExpoLead(lead.displayId, body);
      onConverted(res.data);
      onOpenChange(false);
    } catch (e) {
      if (e instanceof LeadAccountConflictError) {
        if (e.conflict.code === "possible_duplicate") {
          setDuplicate(e.conflict.match);
        } else {
          onOpenChange(false);
          onAlreadyLinked();
        }
      } else {
        setError(e instanceof Error ? e.message : "Could not create account");
      }
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-h-[min(90vh,760px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create account from {lead.displayId}</DialogTitle>
          <DialogDescription>
            Created as a Prospect. No portal invite is sent; invite from the account when ready.
          </DialogDescription>
        </DialogHeader>

        {duplicate ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm">
              <p className="font-medium text-foreground">This may already be an account</p>
              <p className="mt-1 text-muted-foreground">
                <span className="font-medium text-foreground">{duplicate.tradingName}</span>
                {duplicate.email ? ` · ${duplicate.email}` : ""} matches this email or business name.
              </p>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" disabled={saving} onClick={() => setDuplicate(null)}>
                Back
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => void submit({ allowDuplicate: true })}
              >
                Create anyway
              </Button>
              <Button type="button" disabled={saving} onClick={() => void submit({ linkAccountId: duplicate.id })}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
                Link to this account
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="lead-trading">Business name *</Label>
                <Input
                  id="lead-trading"
                  value={form.tradingName}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((f) => ({ ...f, tradingName: v, legalName: legalTouched ? f.legalName : v }));
                  }}
                  required
                  autoFocus
                  disabled={saving}
                  autoComplete="organization"
                  placeholder="The buyer's venue or company"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="lead-legal">Legal name</Label>
                <Input
                  id="lead-legal"
                  value={form.legalName}
                  onChange={(e) => {
                    setLegalTouched(true);
                    set("legalName", e.target.value);
                  }}
                  disabled={saving}
                  placeholder="Same as business name"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => set("type", v as LeadAccountDraft["type"])}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_ACCOUNT_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-contact">Contact name</Label>
                <Input
                  id="lead-contact"
                  value={form.contactName}
                  onChange={(e) => set("contactName", e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-owner">Sales owner</Label>
                <Input
                  id="lead-owner"
                  value={salesOwner}
                  onChange={(e) => setSalesOwner(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-email">Email</Label>
                <Input
                  id="lead-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-phone">Phone</Label>
                <Input
                  id="lead-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-city">City</Label>
                <Input id="lead-city" value={form.city} onChange={(e) => set("city", e.target.value)} disabled={saving} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-country">Country</Label>
                <Input
                  id="lead-country"
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="lead-notes">Notes</Label>
                <Textarea
                  id="lead-notes"
                  rows={4}
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
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
        )}
      </DialogContent>
    </Dialog>
  );
}
