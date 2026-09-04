import { useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { HajimeLogo } from "@/components/HajimeLogo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { submitExpoConnect } from "@/lib/expo-connect-api";
import {
  EXPO_BOTTLE_FORMATS,
  EXPO_BUSINESS_TYPES,
  EXPO_EXPRESSIONS,
  EXPO_INTERESTS,
  EXPO_TERRITORIES,
  EXPO_TIMINGS,
  EXPO_VOLUMES,
} from "@/lib/expo-leads";
import { cn } from "@/lib/utils";

function FieldLabel({ htmlFor, children, required }: { htmlFor: string; children: string; required?: boolean }) {
  return (
    <Label htmlFor={htmlFor} className="text-[13px] font-medium">
      {children}
      {required ? <span className="text-destructive"> *</span> : null}
    </Label>
  );
}

function ChoiceRow({
  name,
  options,
  value,
  onChange,
  required,
}: {
  name: string;
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-required={required}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            name={name}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-left text-[13px] transition-colors",
              selected
                ? "border-accent bg-accent/10 text-foreground"
                : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
            aria-pressed={selected}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function ConnectPage() {
  const [searchParams] = useSearchParams();
  const eventCode = (searchParams.get("event") || "HK26").toUpperCase();

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [countryMarket, setCountryMarket] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [expression, setExpression] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [bottleFormat, setBottleFormat] = useState("");
  const [volume, setVolume] = useState("");
  const [territory, setTerritory] = useState("");
  const [timing, setTiming] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [fax, setFax] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ displayId: string } | null>(null);

  const canSubmit = useMemo(
    () =>
      Boolean(
        fullName.trim() &&
          companyName.trim() &&
          jobTitle.trim() &&
          businessEmail.trim() &&
          countryMarket.trim() &&
          businessType &&
          expression &&
          consent,
      ),
    [fullName, companyName, jobTitle, businessEmail, countryMarket, businessType, expression, consent],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitExpoConnect({
        eventCode,
        fullName: fullName.trim(),
        companyName: companyName.trim(),
        jobTitle: jobTitle.trim(),
        businessEmail: businessEmail.trim(),
        mobile: mobile.trim() || undefined,
        countryMarket: countryMarket.trim(),
        companyWebsite: companyWebsite.trim() || undefined,
        businessType,
        expression,
        interests,
        bottleFormat: bottleFormat || undefined,
        volume: volume || undefined,
        territory: territory || undefined,
        timing: timing || undefined,
        message: message.trim() || undefined,
        consent: true,
        fax,
      });
      setDone({ displayId: res.data.displayId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit");
    } finally {
      setSubmitting(false);
    }
  }

  function toggleInterest(value: string) {
    setInterests((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/80 bg-card/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <HajimeLogo className="h-7 w-auto" />
            <div>
              <p className="font-display text-lg font-semibold tracking-tight">Connect with Hajime</p>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Buyer registration</p>
            </div>
          </div>
          <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        {done ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center shadow-[var(--shadow-soft)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-success/25 bg-success/10">
              <CheckCircle2 className="h-7 w-7 text-success" strokeWidth={1.75} aria-hidden />
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">We have your details</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Thank you. Mention this reference if you return to the booth:
            </p>
            <p className="mt-4 font-mono text-xl tracking-wide text-foreground">{done.displayId}</p>
            <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
              Our team will be in touch regarding your inquiry.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-8">
            <div className="border-b border-border/60 pb-6">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.16em] text-accent">Connect with Hajime</p>
              <h1 className="font-display text-3xl font-semibold tracking-tight">Interested in representing, stocking, serving, or featuring Hajime?</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Share a few details and our team will follow up. Fields marked with an asterisk are required.
              </p>
            </div>

            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="hidden" aria-hidden="true">
              <label htmlFor="fax">Fax</label>
              <input id="fax" name="fax" tabIndex={-1} autoComplete="off" value={fax} onChange={(e) => setFax(e.target.value)} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <FieldLabel htmlFor="fullName" required>
                  Full name
                </FieldLabel>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <FieldLabel htmlFor="companyName" required>
                  Company name
                </FieldLabel>
                <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required autoComplete="organization" />
              </div>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="jobTitle" required>
                  Job title / position
                </FieldLabel>
                <Input id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required autoComplete="organization-title" />
              </div>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="businessEmail" required>
                  Business email
                </FieldLabel>
                <Input id="businessEmail" type="email" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="mobile">Mobile / WhatsApp</FieldLabel>
                <Input id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} autoComplete="tel" />
              </div>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="countryMarket" required>
                  Country / market
                </FieldLabel>
                <Input id="countryMarket" value={countryMarket} onChange={(e) => setCountryMarket(e.target.value)} required />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <FieldLabel htmlFor="companyWebsite">Company website</FieldLabel>
                <Input id="companyWebsite" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} autoComplete="url" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[13px] font-medium">
                What best describes your business?<span className="text-destructive"> *</span>
              </p>
              <ChoiceRow name="businessType" options={EXPO_BUSINESS_TYPES} value={businessType} onChange={setBusinessType} required />
            </div>

            <div className="space-y-2">
              <p className="text-[13px] font-medium">
                Which Hajime expression interests you?<span className="text-destructive"> *</span>
              </p>
              <ChoiceRow name="expression" options={EXPO_EXPRESSIONS} value={expression} onChange={setExpression} required />
            </div>

            <div className="space-y-2">
              <p className="text-[13px] font-medium">What are you interested in?</p>
              <div className="flex flex-wrap gap-2">
                {EXPO_INTERESTS.map((opt) => {
                  const selected = interests.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleInterest(opt.value)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-[13px]",
                        selected
                          ? "border-accent bg-accent/10 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-foreground/30",
                      )}
                      aria-pressed={selected}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[13px] font-medium">Which bottle format interests you?</p>
              <ChoiceRow name="bottleFormat" options={EXPO_BOTTLE_FORMATS} value={bottleFormat} onChange={setBottleFormat} />
            </div>

            <div className="space-y-2">
              <p className="text-[13px] font-medium">Estimated purchasing volume / opportunity</p>
              <ChoiceRow name="volume" options={EXPO_VOLUMES} value={volume} onChange={setVolume} />
            </div>

            <div className="space-y-2">
              <p className="text-[13px] font-medium">Are you interested in discussing territory representation?</p>
              <ChoiceRow name="territory" options={EXPO_TERRITORIES} value={territory} onChange={setTerritory} />
            </div>

            <div className="space-y-2">
              <p className="text-[13px] font-medium">When are you looking to move forward?</p>
              <ChoiceRow name="timing" options={EXPO_TIMINGS} value={timing} onChange={setTiming} />
            </div>

            <div className="space-y-1.5">
              <FieldLabel htmlFor="message">Message / notes</FieldLabel>
              <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
            </div>

            <label className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm">
              <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
              <span>
                I agree that Hajime Ltd. may contact me regarding this inquiry.
                <span className="text-destructive"> *</span>
              </span>
            </label>

            <Button type="submit" disabled={!canSubmit || submitting} className="w-full sm:w-auto">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting
                </>
              ) : (
                "Send to Hajime"
              )}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
