import { useCallback, useState, type ChangeEvent } from "react";
import type { LicenseeApplicationContext, LicenseeApplicationFormData } from "@/types/licensee-application";
import {
  CA_PROVINCES,
  LICENSEE_STEP_LABELS,
  LICENSEE_TERMS_EXCERPT,
  PAYMENT_METHODS,
  validateLicenseeStep,
} from "@/lib/licensee-application-form";
import { submitLicenseeApplication } from "@/lib/licensee-application-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] sm:p-5">
      <h2 className="mb-4 font-display text-base font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function YesNoField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <RadioGroup
        value={value ? "yes" : "no"}
        onValueChange={(v) => onChange(v === "yes")}
        className="flex gap-4"
        disabled={disabled}
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="yes" id={`${label}-yes`} />
          <Label htmlFor={`${label}-yes`} className="font-normal">
            Yes
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="no" id={`${label}-no`} />
          <Label htmlFor={`${label}-no`} className="font-normal">
            No
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}

type Props = {
  context: LicenseeApplicationContext;
  initialData: LicenseeApplicationFormData;
  onSubmitted: (summary: { storeName: string; salesRepName: string }) => void;
};

export function LicenseeApplicationWizard({ context, initialData, onSubmitted }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<LicenseeApplicationFormData>(initialData);
  const [submitting, setSubmitting] = useState(false);

  const set =
    <K extends keyof LicenseeApplicationFormData>(key: K) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setData((d) => ({ ...d, [key]: e.target.value }));
    };

  const setBool = (key: keyof LicenseeApplicationFormData) => (value: boolean) => {
    setData((d) => ({ ...d, [key]: value }));
  };

  const goNext = () => {
    const err = validateLicenseeStep(step, data);
    if (err) {
      toast.error(err);
      return;
    }
    setStep((s) => Math.min(s + 1, LICENSEE_STEP_LABELS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    const err = validateLicenseeStep(4, data);
    if (err) {
      toast.error(err);
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitLicenseeApplication(context.token, data);
      onSubmitted({
        storeName: result.data.storeName,
        salesRepName: result.data.salesRepName,
      });
    } catch (e) {
      toast.error("Could not submit", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = submitting;

  const stepContent = useCallback(() => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col gap-4">
            <SectionCard title="Business information">
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <Label htmlFor="la-business">Business name *</Label>
                  <Input
                    id="la-business"
                    placeholder="Legal business name"
                    value={data.businessName}
                    onChange={set("businessName")}
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="la-group">Affiliated group</Label>
                  <p className="text-xs text-muted-foreground">If applicable</p>
                  <Input
                    id="la-group"
                    placeholder="Parent company or group"
                    value={data.affiliatedGroup}
                    onChange={set("affiliatedGroup")}
                    disabled={disabled}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="la-lic">Licensee # *</Label>
                    <Input
                      id="la-lic"
                      placeholder="LIC-0000000"
                      className="font-mono text-sm"
                      value={data.licenseeNum}
                      onChange={set("licenseeNum")}
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="la-hst">HST registration # *</Label>
                    <Input
                      id="la-hst"
                      placeholder="12345 6789 RT0001"
                      className="font-mono text-sm"
                      value={data.hstNum}
                      onChange={set("hstNum")}
                      disabled={disabled}
                    />
                  </div>
                </div>
              </div>
            </SectionCard>
            <div className="rounded-lg border border-accent/25 bg-accent/5 px-4 py-3 text-xs leading-relaxed text-foreground/90">
              You must be <strong>19 years of age or older</strong> to place an order. Currently licensed to deliver
              in <strong>Ontario only</strong>.
            </div>
          </div>
        );
      case 1:
        return (
          <div className="flex flex-col gap-4">
            <SectionCard title="Shipping address">
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <Label htmlFor="la-ship">Shipping address *</Label>
                  <Input
                    id="la-ship"
                    placeholder="Street address"
                    value={data.shippingAddr}
                    onChange={set("shippingAddr")}
                    disabled={disabled}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="la-city">City *</Label>
                    <Input id="la-city" placeholder="Toronto" value={data.city} onChange={set("city")} disabled={disabled} />
                  </div>
                  <div className="space-y-2">
                    <Label>Province</Label>
                    <Select value={data.province} onValueChange={(v) => setData((d) => ({ ...d, province: v }))} disabled={disabled}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CA_PROVINCES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="la-postal">Postal code *</Label>
                    <Input
                      id="la-postal"
                      placeholder="M5V 2T6"
                      className="font-mono text-sm"
                      value={data.postalCode}
                      onChange={set("postalCode")}
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2 lg:col-span-4">
                    <Label htmlFor="la-phone">Phone # *</Label>
                    <Input id="la-phone" placeholder="416-555-0100" value={data.phone} onChange={set("phone")} disabled={disabled} />
                  </div>
                </div>
              </div>
            </SectionCard>
            <SectionCard title="Main contact">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="la-cname">Full name *</Label>
                  <Input id="la-cname" value={data.contactName} onChange={set("contactName")} disabled={disabled} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="la-ctitle">Title *</Label>
                  <Input id="la-ctitle" placeholder="e.g. Beverage Director" value={data.contactTitle} onChange={set("contactTitle")} disabled={disabled} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="la-cphone">Phone #</Label>
                  <Input id="la-cphone" value={data.contactPhone} onChange={set("contactPhone")} disabled={disabled} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="la-cemail">Email *</Label>
                  <Input id="la-cemail" type="email" value={data.contactEmail} onChange={set("contactEmail")} disabled={disabled} />
                </div>
              </div>
            </SectionCard>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col gap-4">
            <SectionCard title="Accounting details">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="la-aname">Accounting contact name *</Label>
                  <Input id="la-aname" value={data.acctName} onChange={set("acctName")} disabled={disabled} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="la-atitle">Title *</Label>
                  <Input id="la-atitle" placeholder="e.g. Controller" value={data.acctTitle} onChange={set("acctTitle")} disabled={disabled} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="la-aphone">Phone #</Label>
                  <Input id="la-aphone" value={data.acctPhone} onChange={set("acctPhone")} disabled={disabled} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="la-aemail">Email *</Label>
                  <Input id="la-aemail" type="email" value={data.acctEmail} onChange={set("acctEmail")} disabled={disabled} />
                </div>
              </div>
            </SectionCard>
            <SectionCard title="Method of payment">
              <div className="flex flex-col gap-4">
                <RadioGroup
                  value={data.paymentMethod}
                  onValueChange={(v) =>
                    setData((d) => ({ ...d, paymentMethod: v as LicenseeApplicationFormData["paymentMethod"] }))
                  }
                  className="flex flex-col gap-2"
                  disabled={disabled}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <div key={m} className="flex items-center gap-2">
                      <RadioGroupItem value={m} id={`pay-${m}`} />
                      <Label htmlFor={`pay-${m}`} className="font-normal">
                        {m}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {data.paymentMethod === "Credit Card" ? (
                  <div className="space-y-4 border-t border-border pt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Credit card authorization
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Card details are collected on a secure Stripe page after your application is approved. Provide
                      initials below to authorize charges for agreed purchases.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="la-exp">Expiry (MM/YY)</Label>
                        <Input
                          id="la-exp"
                          placeholder="MM/YY"
                          className="font-mono text-sm"
                          value={data.cardExpiry}
                          onChange={set("cardExpiry")}
                          disabled={disabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="la-init">Your initials *</Label>
                        <Input id="la-init" value={data.cardInitial} onChange={set("cardInitial")} disabled={disabled} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="la-bill-same"
                        checked={data.billingSame}
                        onCheckedChange={(c) => setBool("billingSame")(c === true)}
                        disabled={disabled}
                      />
                      <Label htmlFor="la-bill-same" className="font-normal">
                        Billing address same as shipping
                      </Label>
                    </div>
                    {!data.billingSame ? (
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="la-baddr">Billing address</Label>
                          <Input id="la-baddr" value={data.billingAddr} onChange={set("billingAddr")} disabled={disabled} />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="la-bcity">City</Label>
                            <Input id="la-bcity" value={data.billingCity} onChange={set("billingCity")} disabled={disabled} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="la-bpostal">Postal code</Label>
                            <Input
                              id="la-bpostal"
                              className="font-mono text-sm"
                              value={data.billingPostal}
                              onChange={set("billingPostal")}
                              disabled={disabled}
                            />
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </SectionCard>
          </div>
        );
      case 3:
        return (
          <SectionCard title="Delivery instructions">
            <div className="flex flex-col gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <YesNoField label="Front door access" value={data.frontDoor} onChange={setBool("frontDoor")} disabled={disabled} />
                <YesNoField label="Loading dock access" value={data.loadingDock} onChange={setBool("loadingDock")} disabled={disabled} />
                <YesNoField label="Purchase order required" value={data.poRequired} onChange={setBool("poRequired")} disabled={disabled} />
                <YesNoField
                  label="Signature required"
                  value={data.signatureRequired}
                  onChange={setBool("signatureRequired")}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="la-op">Operating days *</Label>
                <Input id="la-op" placeholder="e.g. Monday – Saturday" value={data.operatingDays} onChange={set("operatingDays")} disabled={disabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="la-rec">Receiving hours *</Label>
                <p className="text-xs text-muted-foreground">When staff can accept deliveries</p>
                <Input
                  id="la-rec"
                  placeholder="e.g. 8:00am – 4:00pm"
                  value={data.receivingHours}
                  onChange={set("receivingHours")}
                  disabled={disabled}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="la-rname">Receiver contact name</Label>
                  <Input id="la-rname" value={data.receiverName} onChange={set("receiverName")} disabled={disabled} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="la-rphone">Receiver phone #</Label>
                  <Input id="la-rphone" value={data.receiverPhone} onChange={set("receiverPhone")} disabled={disabled} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="la-door">Door code / lock box #</Label>
                <Input id="la-door" className="font-mono text-sm" value={data.doorCode} onChange={set("doorCode")} disabled={disabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="la-dnotes">Requested delivery instructions</Label>
                <Textarea
                  id="la-dnotes"
                  rows={3}
                  placeholder="Any special instructions for the delivery driver…"
                  value={data.deliveryNotes}
                  onChange={set("deliveryNotes")}
                  disabled={disabled}
                  className="resize-none"
                />
              </div>
              <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                While we try to accommodate all delivery requests, we cannot always allow specific instructions based
                on access circumstances.
              </p>
            </div>
          </SectionCard>
        );
      case 4:
        return (
          <SectionCard title="Terms & conditions of trade">
            <div className="flex flex-col gap-4">
              <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
                {LICENSEE_TERMS_EXCERPT.split("\n\n").map((para) => (
                  <p key={para.slice(0, 24)} className="mb-3 last:mb-0">
                    {para}
                  </p>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="la-print">Printed name *</Label>
                  <Input id="la-print" value={data.printName} onChange={set("printName")} disabled={disabled} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="la-date">Date</Label>
                  <Input id="la-date" value={data.date} onChange={set("date")} disabled={disabled} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="la-sig">Signature (type full name) *</Label>
                <Input
                  id="la-sig"
                  className="font-display text-lg italic"
                  placeholder="Your signature"
                  value={data.signature}
                  onChange={set("signature")}
                  disabled={disabled}
                />
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="la-agree"
                  checked={data.agreed}
                  onCheckedChange={(c) => setBool("agreed")(c === true)}
                  disabled={disabled}
                />
                <Label htmlFor="la-agree" className="text-sm font-normal leading-relaxed">
                  I have read and agree to the terms and conditions of trade, and confirm the information in this
                  application is accurate.
                </Label>
              </div>
            </div>
          </SectionCard>
        );
      default:
        return null;
    }
  }, [step, data, disabled, set, setBool]);

  return (
    <div>
      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Application steps">
        {LICENSEE_STEP_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            disabled={i > step || disabled}
            onClick={() => i < step && setStep(i)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              i === step
                ? "bg-accent text-accent-foreground"
                : i < step
                  ? "bg-muted text-foreground hover:bg-muted/80"
                  : "bg-muted/50 text-muted-foreground",
            )}
          >
            {i + 1}. {label}
          </button>
        ))}
      </nav>

      {stepContent()}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
        <Button type="button" variant="outline" onClick={goBack} disabled={step === 0 || disabled}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        {step < LICENSEE_STEP_LABELS.length - 1 ? (
          <Button type="button" onClick={goNext} disabled={disabled}>
            Continue
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" onClick={() => void handleSubmit()} disabled={disabled}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit application
          </Button>
        )}
      </div>
    </div>
  );
}
