import type { Account } from "@/data/mockData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { Link } from "react-router-dom";
import { CreditCard, ExternalLink, MapPin, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

function onboardingPipelineLabel(p: Account["onboardingPipeline"] | undefined): string {
  switch (p) {
    case "sales_intake":
      return "Sales submitted — wholesaler review";
    case "brand_review":
      return "Brand HQ approval pending";
    case "complete":
      return "Onboarding complete";
    default:
      return "—";
  }
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const ACCOUNT_TYPES: Account["type"][] = ["retail", "bar", "restaurant", "hotel", "distributor", "lifestyle"];
const ACCOUNT_STATUSES: Account["status"][] = ["active", "prospect", "inactive"];

type Props = {
  account: Account | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (account: Account) => void;
};

function parseTags(s: string): string[] {
  return s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function AccountDetailDialog({ account, open, onOpenChange, onSave }: Props) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Account | null>(null);
  const [tagsInput, setTagsInput] = useState("");
  const [whVerifyNotes, setWhVerifyNotes] = useState("");
  const [brandTier, setBrandTier] = useState<NonNullable<Account["pricingTier"]>>("standard");
  const [brandCredit, setBrandCredit] = useState("");
  const [portalEmail, setPortalEmail] = useState("");

  useEffect(() => {
    if (account) {
      setDraft({ ...account });
      setTagsInput(account.tags.join(", "));
      setEditing(false);
      setWhVerifyNotes(account.wholesalerReviewNotes ?? "");
      setBrandTier(account.pricingTier ?? "standard");
      setBrandCredit(account.creditLimitCad != null ? String(account.creditLimitCad) : "25000");
      setPortalEmail(account.portalLoginEmail ?? account.email);
    }
  }, [account]);

  const handleClose = (next: boolean) => {
    if (!next) setEditing(false);
    onOpenChange(next);
  };

  const cancelEdit = () => {
    if (account) {
      setDraft({ ...account });
      setTagsInput(account.tags.join(", "));
    }
    setEditing(false);
  };

  const save = () => {
    if (!draft) return;
    const next: Account = {
      ...draft,
      tags: parseTags(tagsInput),
    };
    onSave(next);
    setEditing(false);
    toast.success("Account updated", { description: next.tradingName });
  };

  const update = <K extends keyof Account>(key: K, value: Account[K]) => {
    setDraft((d) => (d ? { ...d, [key]: value } : null));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[min(90vh,760px)] overflow-y-auto sm:max-w-lg">
        {draft ? (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <DialogTitle className="font-display text-lg">{draft.tradingName}</DialogTitle>
                  <DialogDescription className="text-base text-foreground">{draft.legalName}</DialogDescription>
                </div>
                {!editing ? (
                  <Button type="button" variant="outline" size="sm" className="touch-manipulation shrink-0" onClick={() => setEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                ) : null}
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={draft.status} />
                <span className="rounded-md border bg-muted/50 px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                  {draft.type}
                </span>
              </div>

              <Separator />

              {editing ? (
                <div className="space-y-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="acc-trading">Trading name</Label>
                      <Input
                        id="acc-trading"
                        value={draft.tradingName}
                        onChange={(e) => update("tradingName", e.target.value)}
                        className="touch-manipulation"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="acc-legal">Legal name</Label>
                      <Input
                        id="acc-legal"
                        value={draft.legalName}
                        onChange={(e) => update("legalName", e.target.value)}
                        className="touch-manipulation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="acc-city">City</Label>
                      <Input id="acc-city" value={draft.city} onChange={(e) => update("city", e.target.value)} className="touch-manipulation" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="acc-country">Country</Label>
                      <Input
                        id="acc-country"
                        value={draft.country}
                        onChange={(e) => update("country", e.target.value)}
                        className="touch-manipulation"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Type</Label>
                      <Select value={draft.type} onValueChange={(v) => update("type", v as Account["type"])}>
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
                      <Label htmlFor="acc-contact">Contact name</Label>
                      <Input
                        id="acc-contact"
                        value={draft.contactName}
                        onChange={(e) => update("contactName", e.target.value)}
                        className="touch-manipulation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="acc-role">Role</Label>
                      <Input
                        id="acc-role"
                        value={draft.contactRole}
                        onChange={(e) => update("contactRole", e.target.value)}
                        className="touch-manipulation"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="acc-email">Email</Label>
                      <Input
                        id="acc-email"
                        type="email"
                        value={draft.email}
                        onChange={(e) => update("email", e.target.value)}
                        className="touch-manipulation"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="acc-phone">Phone</Label>
                      <Input
                        id="acc-phone"
                        value={draft.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        className="touch-manipulation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="acc-terms">Payment terms</Label>
                      <Input
                        id="acc-terms"
                        value={draft.paymentTerms}
                        onChange={(e) => update("paymentTerms", e.target.value)}
                        className="touch-manipulation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="acc-owner">Sales owner</Label>
                      <Input
                        id="acc-owner"
                        value={draft.salesOwner}
                        onChange={(e) => update("salesOwner", e.target.value)}
                        className="touch-manipulation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={draft.status} onValueChange={(v) => update("status", v as Account["status"])}>
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
                      <Label htmlFor="acc-avg">Avg order ($)</Label>
                      <Input
                        id="acc-avg"
                        type="number"
                        min={0}
                        step={1}
                        value={draft.avgOrderSize || ""}
                        onChange={(e) => update("avgOrderSize", Number(e.target.value) || 0)}
                        className="touch-manipulation"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="acc-tags">Tags (comma-separated)</Label>
                      <Input
                        id="acc-tags"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        placeholder="key-account, toronto"
                        className="touch-manipulation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="acc-first">First order date</Label>
                      <Input
                        id="acc-first"
                        value={draft.firstOrderDate}
                        onChange={(e) => update("firstOrderDate", e.target.value)}
                        placeholder="YYYY-MM-DD"
                        className="touch-manipulation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="acc-last">Last order date</Label>
                      <Input
                        id="acc-last"
                        value={draft.lastOrderDate}
                        onChange={(e) => update("lastOrderDate", e.target.value)}
                        placeholder="YYYY-MM-DD"
                        className="touch-manipulation"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="acc-listing">Listing status</Label>
                      <Input
                        id="acc-listing"
                        value={draft.listingStatus ?? ""}
                        onChange={(e) => update("listingStatus", e.target.value || undefined)}
                        placeholder="e.g. LCBO Vintages"
                        className="touch-manipulation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="acc-st">Sell-through (bottles / period)</Label>
                      <Input
                        id="acc-st"
                        type="number"
                        min={0}
                        value={draft.sellThroughLastPeriod ?? ""}
                        onChange={(e) =>
                          update("sellThroughLastPeriod", e.target.value === "" ? undefined : Number(e.target.value))
                        }
                        className="touch-manipulation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="acc-lc">Last contact</Label>
                      <Input
                        id="acc-lc"
                        value={draft.lastContactDate ?? ""}
                        onChange={(e) => update("lastContactDate", e.target.value || undefined)}
                        placeholder="YYYY-MM-DD"
                        className="touch-manipulation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="acc-na">Next action</Label>
                      <Input
                        id="acc-na"
                        value={draft.nextActionDate ?? ""}
                        onChange={(e) => update("nextActionDate", e.target.value || undefined)}
                        placeholder="YYYY-MM-DD"
                        className="touch-manipulation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="acc-ccy">Default currency</Label>
                      <Input
                        id="acc-ccy"
                        value={draft.defaultCurrency ?? ""}
                        onChange={(e) => update("defaultCurrency", e.target.value || undefined)}
                        placeholder="CAD / EUR"
                        className="touch-manipulation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="acc-tz">Timezone (IANA)</Label>
                      <Input
                        id="acc-tz"
                        value={draft.timezone ?? ""}
                        onChange={(e) => update("timezone", e.target.value || undefined)}
                        placeholder="America/Toronto"
                        className="touch-manipulation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="acc-credit">Credit limit (CAD)</Label>
                      <Input
                        id="acc-credit"
                        type="number"
                        min={0}
                        step={1}
                        value={draft.creditLimitCad ?? ""}
                        onChange={(e) =>
                          update("creditLimitCad", e.target.value === "" ? undefined : Number(e.target.value))
                        }
                        className="touch-manipulation"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="acc-channel">Order channel preference</Label>
                      <Input
                        id="acc-channel"
                        value={draft.orderChannelPreference ?? ""}
                        onChange={(e) => update("orderChannelPreference", e.target.value || undefined)}
                        className="touch-manipulation"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="acc-network">Network role (supply chain)</Label>
                      <Textarea
                        id="acc-network"
                        rows={3}
                        value={draft.networkRole ?? ""}
                        onChange={(e) => update("networkRole", e.target.value || undefined)}
                        placeholder="How this partner fits production → logistics → retail"
                        className="touch-manipulation"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="acc-ship">Delivery / ship-to address</Label>
                      <Textarea
                        id="acc-ship"
                        rows={2}
                        value={draft.deliveryAddress ?? ""}
                        onChange={(e) => update("deliveryAddress", e.target.value || undefined)}
                        className="touch-manipulation"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="acc-bill">Billing address</Label>
                      <Textarea
                        id="acc-bill"
                        rows={2}
                        value={draft.billingAddress ?? ""}
                        onChange={(e) => update("billingAddress", e.target.value || undefined)}
                        className="touch-manipulation"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="acc-notes">Internal notes</Label>
                      <Textarea
                        id="acc-notes"
                        rows={4}
                        value={draft.internalNotes ?? ""}
                        onChange={(e) => update("internalNotes", e.target.value || undefined)}
                        placeholder="PO refs, shipment lanes, risks, next steps"
                        className="touch-manipulation"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Account ID</span>
                    <span className="font-mono text-xs font-medium">{draft.id}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-muted-foreground">Location</span>
                    <span className="max-w-[60%] text-right font-medium">
                      <MapPin className="mr-1 inline h-3.5 w-3.5 align-text-bottom text-muted-foreground" aria-hidden />
                      {draft.city}, {draft.country}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Contact</span>
                    <span className="text-right font-medium">
                      {draft.contactName}
                      <span className="block text-xs font-normal text-muted-foreground">{draft.contactRole}</span>
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Email</span>
                    <a href={`mailto:${draft.email}`} className="break-all text-right font-medium text-primary hover:underline">
                      {draft.email}
                    </a>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Phone</span>
                    <a href={`tel:${draft.phone.replace(/\s/g, "")}`} className="text-right font-medium text-primary hover:underline">
                      {draft.phone}
                    </a>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Payment terms</span>
                    <span className="font-medium">{draft.paymentTerms}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Sales owner</span>
                    <span className="font-medium">{draft.salesOwner}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Avg order</span>
                    <span className="font-medium tabular-nums">${draft.avgOrderSize.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">First / last order</span>
                    <span className="text-right text-xs font-medium">
                      {draft.firstOrderDate || "—"} → {draft.lastOrderDate || "—"}
                    </span>
                  </div>
                  {draft.listingStatus ? (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Listing</span>
                      <span className="max-w-[60%] text-right font-medium">{draft.listingStatus}</span>
                    </div>
                  ) : null}
                  {draft.sellThroughLastPeriod != null ? (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Sell-through (est.)</span>
                      <span className="font-medium tabular-nums">{draft.sellThroughLastPeriod.toLocaleString()} bottles</span>
                    </div>
                  ) : null}
                  {draft.lastContactDate || draft.nextActionDate ? (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Contact / next action</span>
                      <span className="text-right text-xs font-medium">
                        {draft.lastContactDate || "—"} → {draft.nextActionDate || "—"}
                      </span>
                    </div>
                  ) : null}
                  {draft.cardOnFileLast4 ? (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Card on file</span>
                      <span className="font-mono font-medium">
                        <CreditCard className="mr-1 inline h-3.5 w-3.5 align-text-bottom text-muted-foreground" aria-hidden />
                        ••••{draft.cardOnFileLast4}
                      </span>
                    </div>
                  ) : null}
                  {draft.defaultCurrency ||
                  draft.timezone ||
                  draft.creditLimitCad != null ||
                  draft.orderChannelPreference ? (
                    <>
                      <Separator className="my-2" />
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Commercial</p>
                      {draft.defaultCurrency ? (
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Currency</span>
                          <span className="font-medium">{draft.defaultCurrency}</span>
                        </div>
                      ) : null}
                      {draft.timezone ? (
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Timezone</span>
                          <span className="font-mono text-xs font-medium">{draft.timezone}</span>
                        </div>
                      ) : null}
                      {draft.creditLimitCad != null ? (
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Credit limit (CAD)</span>
                          <span className="font-medium tabular-nums">${draft.creditLimitCad.toLocaleString()}</span>
                        </div>
                      ) : null}
                      {draft.orderChannelPreference ? (
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Order channel</span>
                          <span className="max-w-[60%] text-right text-xs font-medium">{draft.orderChannelPreference}</span>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                  {draft.networkRole || draft.deliveryAddress || draft.billingAddress || draft.internalNotes ? (
                    <>
                      <Separator className="my-2" />
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Supply chain</p>
                      {draft.networkRole ? (
                        <div className="space-y-1">
                          <span className="text-muted-foreground">Network role</span>
                          <p className="text-sm leading-snug text-foreground">{draft.networkRole}</p>
                        </div>
                      ) : null}
                      {draft.deliveryAddress ? (
                        <div className="space-y-1">
                          <span className="text-muted-foreground">Delivery address</span>
                          <p className="text-sm leading-snug">{draft.deliveryAddress}</p>
                        </div>
                      ) : null}
                      {draft.billingAddress ? (
                        <div className="space-y-1">
                          <span className="text-muted-foreground">Billing address</span>
                          <p className="text-sm leading-snug">{draft.billingAddress}</p>
                        </div>
                      ) : null}
                      {draft.internalNotes ? (
                        <div className="space-y-1">
                          <span className="text-muted-foreground">Internal notes</span>
                          <p className="whitespace-pre-wrap text-sm leading-snug text-foreground">{draft.internalNotes}</p>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>
              )}

              {!editing && draft.tags.length > 0 ? (
                <>
                  <Separator />
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {draft.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}

              {draft.onboardingPipeline && draft.onboardingPipeline !== "none" && draft.onboardingPipeline !== "complete" ? (
                <>
                  <Separator />
                  <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Retailer onboarding</p>
                    <p className="mt-1 text-sm font-medium text-foreground">{onboardingPipelineLabel(draft.onboardingPipeline)}</p>
                    {draft.applicationSubmittedAt ? (
                      <p className="mt-1 text-xs text-muted-foreground">Submitted {draft.applicationSubmittedAt.slice(0, 10)}</p>
                    ) : null}
                    {draft.applicationBusinessSummary ? (
                      <p className="mt-2 text-sm leading-snug text-foreground">{draft.applicationBusinessSummary}</p>
                    ) : null}
                    {draft.wholesalerReviewNotes ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Wholesaler notes:</span> {draft.wholesalerReviewNotes}
                      </p>
                    ) : null}

                    {user.role === "distributor" && draft.onboardingPipeline === "sales_intake" ? (
                      <div className="mt-3 space-y-2">
                        <Label htmlFor="wh-verify">Verification notes for HQ</Label>
                        <Textarea
                          id="wh-verify"
                          rows={3}
                          value={whVerifyNotes}
                          onChange={(e) => setWhVerifyNotes(e.target.value)}
                          className="touch-manipulation resize-none"
                          placeholder="License check, trade references, delivery constraints…"
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="touch-manipulation"
                          onClick={() => {
                            const next: Account = {
                              ...draft,
                              onboardingPipeline: "brand_review",
                              wholesalerReviewNotes: whVerifyNotes.trim() || undefined,
                            };
                            onSave(next);
                            setDraft(next);
                            toast.success("Forwarded to brand HQ", { description: draft.tradingName });
                          }}
                        >
                          Verify & forward to brand
                        </Button>
                      </div>
                    ) : null}

                    {user.role === "brand_operator" && draft.onboardingPipeline === "brand_review" ? (
                      <div className="mt-3 space-y-3">
                        <div className="space-y-2">
                          <Label>Pricing tier</Label>
                          <Select value={brandTier} onValueChange={(v) => setBrandTier(v as NonNullable<Account["pricingTier"]>)}>
                            <SelectTrigger className="touch-manipulation">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                              <SelectItem value="key">Key account</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="brand-credit">Credit limit (CAD)</Label>
                          <Input
                            id="brand-credit"
                            inputMode="numeric"
                            value={brandCredit}
                            onChange={(e) => setBrandCredit(e.target.value)}
                            className="touch-manipulation tabular-nums"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="portal-em">Portal login email</Label>
                          <Input
                            id="portal-em"
                            type="email"
                            value={portalEmail}
                            onChange={(e) => setPortalEmail(e.target.value)}
                            className="touch-manipulation"
                          />
                          <p className="text-xs text-muted-foreground">
                            Demo: add this email to Team roster as retail role — user signs in with that email and selects this trading name.
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          className="touch-manipulation"
                          onClick={() => {
                            const cred = Math.max(0, parseFloat(brandCredit.replace(/,/g, "")) || 0);
                            const next: Account = {
                              ...draft,
                              onboardingPipeline: "complete",
                              status: "active",
                              pricingTier: brandTier,
                              creditLimitCad: cred,
                              portalLoginEmail: portalEmail.trim() || draft.email,
                              firstOrderDate: draft.firstOrderDate || todayISO(),
                            };
                            onSave(next);
                            setDraft(next);
                            toast.success("Retailer approved", {
                              description: `${draft.tradingName} — tier ${brandTier}, credit $${cred.toLocaleString()} CAD`,
                            });
                          }}
                        >
                          Approve & activate account
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : null}

              {draft.onboardingPipeline === "complete" && draft.pricingTier ? (
                <>
                  <Separator />
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm">
                    <p className="font-medium text-foreground">Onboarding complete</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Tier <span className="capitalize text-foreground">{draft.pricingTier}</span>
                      {draft.portalLoginEmail ? (
                        <>
                          {" "}
                          · Portal email <span className="font-mono text-foreground">{draft.portalLoginEmail}</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                </>
              ) : null}

              <Separator />

              <Button type="button" variant="secondary" className="w-full touch-manipulation" asChild>
                <Link to={`/orders?account=${encodeURIComponent(draft.tradingName)}`} onClick={() => handleClose(false)}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View orders for this account
                </Link>
              </Button>

              {editing ? (
                <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" className="touch-manipulation" onClick={cancelEdit}>
                    Cancel
                  </Button>
                  <Button type="button" className="touch-manipulation" onClick={save}>
                    Save changes
                  </Button>
                </DialogFooter>
              ) : null}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
