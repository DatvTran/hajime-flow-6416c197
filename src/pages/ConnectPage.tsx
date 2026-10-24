import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, Check, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { ChoiceChip } from "@/components/connect/ChoiceChip";
import { CountryPhoneField } from "@/components/connect/CountryPhoneField";
import { ProductCard } from "@/components/connect/ProductCard";
import { CONNECT_COUNTRIES, DEFAULT_CONNECT_COUNTRY } from "@/lib/connect-countries";
import {
  CONNECT_BUSINESS,
  CONNECT_CHOICES_KEY,
  CONNECT_PRODUCTS,
  CONNECT_PURPOSES,
  UTM_KEYS,
  internationalPhone,
  isValidEnquiryEmail,
  newSubmissionKey,
  phoneDigits,
} from "@/lib/connect-enquiry";
import { submitExpoConnect } from "@/lib/expo-connect-api";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | "done";
type Choices = { business: string | null; products: string[]; purposes: string[] };
type Errors = Partial<Record<"business" | "products" | "purposes" | "name" | "email" | "phone", string>>;

const PAGE_TITLE = "Hajime Trade Enquiries";
/** Contact link from the Drink Hajime WhatsApp QR; breaks if the QR is reset in WhatsApp. */
const WHATSAPP_URL = "https://wa.me/qr/DIXQDR63EM7TF1";

function loadChoices(): Choices {
  try {
    const s = JSON.parse(sessionStorage.getItem(CONNECT_CHOICES_KEY) || "{}");
    return {
      business: typeof s.business === "string" ? s.business : null,
      products: Array.isArray(s.products) ? s.products : [],
      purposes: Array.isArray(s.purposes) ? s.purposes : [],
    };
  } catch {
    return { business: null, products: [], purposes: [] };
  }
}

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

const primaryBtn =
  "relative flex min-h-[52px] w-full items-center justify-center rounded-[10px] border border-[hsl(40_60%_46%/0.7)] " +
  "bg-[hsl(24_10%_10%)] font-display text-[22px] font-medium text-[hsl(40_20%_97%)] transition-[background,transform] " +
  "hover:bg-[hsl(24_10%_18%)] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 " +
  "focus-visible:outline-offset-[3px] focus-visible:outline-[hsl(40_88%_42%)]";
const secondaryBtn =
  "flex min-h-[52px] items-center justify-center gap-2.5 rounded-[10px] border border-[hsl(35_12%_82%)] " +
  "bg-[hsl(40_20%_99%)] text-base font-medium hover:bg-[hsl(35_16%_93%)] focus-visible:outline " +
  "focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[hsl(40_88%_42%)]";
const headingCls =
  "m-0 text-center font-display text-[34px] font-medium leading-[1.1] tracking-[-0.02em] outline-none";
const helperCls = "mb-5 mt-1.5 text-center text-base text-[hsl(24_8%_32%)]";
const srOnlyLegend = "sr-only";
const sectionLegendCls = "mb-2.5 p-0 text-[17px] font-semibold";

function ErrorLine({ id, message }: { id: string; message?: string }) {
  return (
    <div id={id} aria-live="polite">
      {message ? (
        <p className="mb-0 mt-3 flex items-center gap-2 text-[15px] text-[hsl(0_68%_40%)]">
          <AlertCircle className="h-4 w-4 flex-none" strokeWidth={1.75} aria-hidden />
          {message}
        </p>
      ) : null}
    </div>
  );
}

function TextField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[15px] font-medium">
        {label}{" "}
        <span aria-hidden className="text-[hsl(0_68%_44%)]">
          *
        </span>
      </label>
      {children}
      <div id={`${id}-error`} aria-live="polite">
        {error ? <p className="m-0 text-sm text-[hsl(0_68%_40%)]">{error}</p> : null}
      </div>
    </div>
  );
}

const inputCls = (invalid: boolean) =>
  cn(
    "h-[52px] w-full rounded-lg border bg-[hsl(40_20%_99%)] px-3.5 text-base outline-none",
    "focus:border-[hsl(40_88%_42%)] focus:shadow-[0_0_0_3px_hsl(40_88%_42%/0.25)]",
    invalid ? "border-[hsl(0_68%_48%)]" : "border-[hsl(35_12%_84%)]",
  );

export default function ConnectPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const eventCode = (searchParams.get("event") || "HK26").toUpperCase();
  const utm = useMemo(() => {
    const out: Record<string, string> = {};
    for (const key of UTM_KEYS) {
      const v = searchParams.get(key);
      if (v) out[key] = v.slice(0, 100);
    }
    return out;
  }, [searchParams]);

  const [choices, setChoices] = useState<Choices>(loadChoices);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState(DEFAULT_CONNECT_COUNTRY);
  const [phone, setPhone] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [fax, setFax] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [submissionKey, setSubmissionKey] = useState(newSubmissionKey);
  const [leadRef, setLeadRef] = useState<string | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const privacyCloseRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const firstRender = useRef(true);

  const rawStep = (location.state as { connectStep?: Step } | null)?.connectStep ?? 1;
  const step: Step =
    rawStep === "done"
      ? leadRef
        ? "done"
        : 1
      : rawStep !== 1 && !choices.products.length
        ? 1
        : rawStep === 3 && (!choices.business || !choices.purposes.length)
          ? 2
          : rawStep;

  useEffect(() => {
    const prev = document.title;
    document.title = PAGE_TITLE;
    return () => {
      document.title = prev;
    };
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(CONNECT_CHOICES_KEY, JSON.stringify(choices));
    } catch {
      /* private mode */
    }
  }, [choices]);

  useEffect(() => {
    setErrors({});
    setSubmitError(false);
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  useEffect(() => {
    if (!privacyOpen) return;
    privacyCloseRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePrivacy();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [privacyOpen]);

  function goTo(next: Step, replace = false) {
    navigate(
      { pathname: location.pathname, search: location.search },
      { state: { connectStep: next }, replace },
    );
  }

  function openPrivacy(e?: { preventDefault: () => void }) {
    e?.preventDefault();
    lastFocus.current = document.activeElement as HTMLElement | null;
    setPrivacyOpen(true);
  }

  function closePrivacy() {
    setPrivacyOpen(false);
    lastFocus.current?.focus?.();
  }

  function next1() {
    if (!choices.products.length) setErrors({ products: "Please choose at least one beverage." });
    else goTo(2);
  }

  function next2() {
    const e: Errors = {};
    if (!choices.business) e.business = "Please choose your business type.";
    if (!choices.purposes.length) e.purposes = "Please choose how we can help.";
    if (e.business || e.purposes) setErrors(e);
    else goTo(3);
  }

  const dial = (CONNECT_COUNTRIES.find((c) => c.iso === country) ?? CONNECT_COUNTRIES[0]).dial;

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (submitting) return;
    const e: Errors = {};
    if (!name.trim()) e.name = "Please enter your name.";
    if (!isValidEnquiryEmail(email)) e.email = "Please enter a valid email address.";
    const digits = phoneDigits(phone).length;
    if (digits < 6 || digits > 15) e.phone = "Please enter a valid phone number with country code.";
    if (e.name || e.email || e.phone) {
      setErrors(e);
      setSubmitError(false);
      (e.name ? nameRef : e.email ? emailRef : phoneRef).current?.focus();
      return;
    }
    setErrors({});
    setSubmitting(true);
    setSubmitError(false);
    try {
      const res = await submitExpoConnect({
        eventCode,
        businessType: choices.business ?? "",
        products: choices.products,
        purposes: choices.purposes,
        fullName: name.trim().slice(0, 100),
        businessEmail: email.trim().slice(0, 254),
        mobile: internationalPhone(dial, phone),
        marketingOptIn: optIn,
        submissionKey,
        utm: Object.keys(utm).length ? utm : undefined,
        fax,
      });
      setLeadRef(res.data.displayId);
      goTo("done", true);
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  }

  function restart() {
    try {
      sessionStorage.removeItem(CONNECT_CHOICES_KEY);
    } catch {
      /* private mode */
    }
    setChoices({ business: null, products: [], purposes: [] });
    setName("");
    setEmail("");
    setPhone("");
    setCountry(DEFAULT_CONNECT_COUNTRY);
    setOptIn(false);
    setLeadRef(null);
    setSubmissionKey(newSubmissionKey());
    goTo(1);
  }

  const bizSel = CONNECT_BUSINESS.find((b) => b.id === choices.business);
  const prodSel = CONNECT_PRODUCTS.filter((p) => choices.products.includes(p.id));
  const purpSel = CONNECT_PURPOSES.filter((q) => choices.purposes.includes(q.id));

  const summaryRows = [
    {
      title: "Beverage",
      editLabel: "Edit beverage",
      onEdit: () => goTo(1),
      value: prodSel.map((p) => p.name).join(", "),
    },
    {
      title: "Business",
      editLabel: "Edit business type",
      onEdit: () => goTo(2),
      value: bizSel?.label ?? "",
    },
    {
      title: "How we can help",
      editLabel: "Edit enquiry purpose",
      onEdit: () => goTo(2),
      value: purpSel.map((q) => q.label).join(", "),
    },
  ];

  const stepNum = step === "done" ? 3 : step;

  return (
    <div className="flex min-h-screen justify-center bg-[hsl(40_18%_97%)] font-body text-[hsl(24_10%_10%)] antialiased [-webkit-tap-highlight-color:transparent]">
      <main className="flex w-full max-w-[max(480px,min(640px,calc(100vw-128px)))] flex-col px-[18px] pb-[calc(24px+env(safe-area-inset-bottom))]">
        <header className="flex items-center gap-3 pb-3 pt-4">
          <img
            src="/connect-img/hajime-enso.png"
            alt="Hajime"
            width={40}
            height={40}
            className="block h-10 w-10 object-contain mix-blend-multiply"
          />
          <span aria-hidden className="font-display text-[17px] font-semibold tracking-[0.34em]">
            HAJIME
          </span>
          {step !== "done" ? (
            <span
              aria-hidden
              className="ml-auto font-display text-[19px] font-medium tabular-nums tracking-[0.08em]"
            >
              {step} / 3
            </span>
          ) : null}
        </header>
        <div
          role="progressbar"
          aria-label="Enquiry progress"
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={stepNum}
          aria-valuetext={step === "done" ? "Enquiry sent" : `Step ${step} of 3`}
          className="mb-[22px] grid grid-cols-3 gap-1"
        >
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={cn(
                "h-[3px] rounded-full transition-colors duration-[400ms]",
                step === "done" || stepNum >= n ? "bg-[hsl(40_88%_42%)]" : "bg-[hsl(35_12%_86%)]",
              )}
            />
          ))}
        </div>

        {step === 1 ? (
          <section aria-labelledby="connect-h1" className="flex flex-col">
            <h1 id="connect-h1" ref={headingRef} tabIndex={-1} className={headingCls}>
              Pick your beverage
            </h1>
            <p id="connect-help-products" className={helperCls}>
              Choose one or both.
            </p>
            <fieldset
              aria-describedby="connect-help-products connect-err-products"
              className="m-0 min-w-0 border-0 p-0"
            >
              <legend className={srOnlyLegend}>Beverage</legend>
              <div className="grid grid-cols-2 gap-3">
                {CONNECT_PRODUCTS.map((p) => (
                  <ProductCard
                    key={p.id}
                    value={p.id}
                    name={p.name}
                    description={p.desc}
                    img={p.img}
                    checked={choices.products.includes(p.id)}
                    onChange={() => {
                      setChoices((c) => ({ ...c, products: toggle(c.products, p.id) }));
                      setErrors({});
                    }}
                  />
                ))}
              </div>
            </fieldset>
            <p className="mb-0 mt-3 text-center text-sm text-[hsl(24_8%_32%)]">
              Ready to pour. Serve chilled. Store refrigerated.
            </p>
            <ErrorLine id="connect-err-products" message={errors.products} />
            <button type="button" onClick={next1} className={cn(primaryBtn, "mt-5")}>
              Continue
              <ChevronRight className="absolute right-[18px] h-5 w-5" strokeWidth={1.75} aria-hidden />
            </button>
          </section>
        ) : null}

        {step === 2 ? (
          <section aria-labelledby="connect-h2" className="flex flex-col">
            <h1 id="connect-h2" ref={headingRef} tabIndex={-1} className={headingCls}>
              Refine your list
            </h1>
            <p className={helperCls}>Two quick questions.</p>

            <fieldset aria-describedby="connect-err-business" className="m-0 min-w-0 border-0 p-0">
              <legend className={sectionLegendCls}>Your business</legend>
              <div className="grid grid-cols-3 gap-2">
                {CONNECT_BUSINESS.map((b) => (
                  <ChoiceChip
                    key={b.id}
                    type="radio"
                    name="business"
                    value={b.id}
                    label={b.label}
                    checked={choices.business === b.id}
                    onChange={() => {
                      setChoices((c) => ({ ...c, business: b.id }));
                      setErrors((e) => ({ ...e, business: undefined }));
                    }}
                  />
                ))}
              </div>
            </fieldset>
            <ErrorLine id="connect-err-business" message={errors.business} />

            <fieldset
              aria-describedby="connect-help-purposes connect-err-purposes"
              className="m-0 mt-6 min-w-0 border-0 p-0"
            >
              <legend className={sectionLegendCls}>
                How can we help?{" "}
                <span id="connect-help-purposes" className="whitespace-nowrap text-sm font-normal text-[hsl(24_8%_32%)]">
                  Choose all that apply.
                </span>
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {CONNECT_PURPOSES.map((q) => (
                  <ChoiceChip
                    key={q.id}
                    type="checkbox"
                    name="purposes"
                    value={q.id}
                    label={q.label}
                    checked={choices.purposes.includes(q.id)}
                    onChange={() => {
                      setChoices((c) => ({ ...c, purposes: toggle(c.purposes, q.id) }));
                      setErrors((e) => ({ ...e, purposes: undefined }));
                    }}
                  />
                ))}
              </div>
            </fieldset>
            <ErrorLine id="connect-err-purposes" message={errors.purposes} />

            <div className="mt-6 grid grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)] gap-3">
              <button type="button" onClick={() => goTo(1)} className={secondaryBtn}>
                <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                Back
              </button>
              <button type="button" onClick={next2} className={primaryBtn}>
                Continue
                <ChevronRight className="absolute right-4 h-5 w-5" strokeWidth={1.75} aria-hidden />
              </button>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section aria-labelledby="connect-h3" className="flex flex-col">
            <h1 id="connect-h3" ref={headingRef} tabIndex={-1} className={headingCls}>
              Let’s connect
            </h1>
            <p className="mb-[18px] mt-1.5 text-center text-base text-[hsl(24_8%_32%)]">
              Tell us a little about yourself.
            </p>

            <div
              role="group"
              aria-label="Your selections"
              className="rounded-xl border border-[hsl(35_12%_89%)] bg-[hsl(40_20%_99%)] px-3.5 py-1.5"
            >
              {summaryRows.map((r, i) => (
                <div
                  key={r.title}
                  className={cn(
                    "grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)_auto] items-center gap-3 py-1",
                    i < summaryRows.length - 1 && "border-b border-[hsl(35_12%_91%)]",
                  )}
                >
                  <span className="text-sm text-[hsl(24_8%_34%)]">{r.title}</span>
                  <span className="text-[15px] font-medium">{r.value}</span>
                  <button
                    type="button"
                    onClick={r.onEdit}
                    aria-label={r.editLabel}
                    className="-mr-2.5 min-h-11 min-w-11 px-2.5 text-sm font-medium underline underline-offset-[3px] hover:text-[hsl(32_78%_34%)] focus-visible:rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[hsl(40_88%_42%)]"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>

            <form noValidate onSubmit={onSubmit} className="mt-[22px] flex flex-col gap-[18px]">
              <input
                type="text"
                name="fax"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={fax}
                onChange={(e) => setFax(e.target.value)}
                className="absolute -left-[9999px] h-px w-px"
              />
              <TextField id="connect-name" label="Name" error={errors.name}>
                <input
                  ref={nameRef}
                  id="connect-name"
                  type="text"
                  name="name"
                  autoComplete="name"
                  maxLength={100}
                  required
                  aria-required="true"
                  aria-invalid={errors.name ? "true" : "false"}
                  aria-describedby="connect-name-error"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrors((x) => ({ ...x, name: undefined }));
                  }}
                  className={inputCls(Boolean(errors.name))}
                />
              </TextField>
              <TextField id="connect-email" label="Email address" error={errors.email}>
                <input
                  ref={emailRef}
                  id="connect-email"
                  type="email"
                  inputMode="email"
                  name="email"
                  autoComplete="email"
                  maxLength={254}
                  required
                  aria-required="true"
                  aria-invalid={errors.email ? "true" : "false"}
                  aria-describedby="connect-email-error"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((x) => ({ ...x, email: undefined }));
                  }}
                  className={inputCls(Boolean(errors.email))}
                />
              </TextField>
              <CountryPhoneField
                ref={phoneRef}
                country={country}
                onCountryChange={setCountry}
                phone={phone}
                onPhoneChange={(v) => {
                  setPhone(v);
                  setErrors((x) => ({ ...x, phone: undefined }));
                }}
                error={errors.phone}
              />

              <p className="m-0 text-[15px] leading-normal text-[hsl(24_8%_30%)]">
                We’ll contact you about your enquiry. See our{" "}
                <a href="#privacy" onClick={openPrivacy} className="underline underline-offset-[3px]">
                  Privacy Notice
                </a>
                .
              </p>
              <label className="-mt-2 flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
                <input
                  type="checkbox"
                  name="marketing_opt_in"
                  checked={optIn}
                  onChange={(e) => setOptIn(e.target.checked)}
                  className="m-0 h-[22px] w-[22px] flex-none accent-[hsl(24_10%_10%)]"
                />
                Send me Hajime news by email.
              </label>

              <div aria-live="assertive">
                {submitError ? (
                  <div className="flex items-start gap-2.5 rounded-[10px] border border-[hsl(0_68%_48%/0.25)] bg-[hsl(0_68%_48%/0.08)] px-3.5 py-3 text-[15px] leading-[1.45] text-[hsl(0_68%_34%)]">
                    <AlertCircle className="mt-0.5 h-[18px] w-[18px] flex-none" strokeWidth={1.75} aria-hidden />
                    <span>We couldn’t send your enquiry. Please try again.</span>
                  </div>
                ) : null}
              </div>

              <button
                type="submit"
                aria-disabled={submitting}
                className={cn(primaryBtn, "-mt-1.5", submitting && "opacity-75")}
              >
                {submitting ? "Sending..." : "Send enquiry"}
                <ChevronRight className="absolute right-[18px] h-5 w-5" strokeWidth={1.75} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => goTo(2)}
                className="-mt-2 flex min-h-11 items-center gap-1.5 self-center px-4 text-base font-medium hover:text-[hsl(32_78%_34%)] focus-visible:rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(40_88%_42%)]"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                Back
              </button>
            </form>
          </section>
        ) : null}

        {step === "done" ? (
          <section role="status" aria-labelledby="connect-hdone" className="flex flex-col items-center pt-5 text-center">
            <span
              aria-hidden
              className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[hsl(40_88%_42%)] text-[hsl(40_88%_36%)]"
            >
              <Check className="h-7 w-7" strokeWidth={2} />
            </span>
            <h1
              id="connect-hdone"
              ref={headingRef}
              tabIndex={-1}
              className="mb-0 mt-5 font-display text-4xl font-medium leading-[1.1] tracking-[-0.02em] outline-none"
            >
              Thank you.
            </h1>
            <p className="mb-0 mt-2.5 max-w-[34ch] text-base leading-relaxed text-[hsl(24_8%_28%)]">
              Your enquiry has been received. Our team will contact you using the details you provided.
            </p>

            <div className="mt-7 w-full overflow-hidden rounded-[14px] border border-[hsl(35_12%_89%)] bg-[hsl(40_20%_99%)] text-left">
              <div className="flex items-baseline justify-between gap-3 border-b border-[hsl(35_12%_89%)] px-[18px] py-4">
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[hsl(24_8%_34%)]">
                  Enquiry reference
                </span>
                <span className="font-mono text-base font-medium tracking-[0.02em]">{leadRef}</span>
              </div>
              <dl className="m-0 px-[18px] pb-2.5 pt-1.5">
                {[
                  { title: "Beverage", value: prodSel.map((p) => p.name).join(", ") },
                  { title: "Business", value: bizSel?.label ?? "" },
                  { title: "How we can help", value: purpSel.map((q) => q.label).join(", ") },
                ].map((d, i, a) => (
                  <div
                    key={d.title}
                    className={cn(
                      "grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)] gap-3 py-2.5",
                      i < a.length - 1 && "border-b border-[hsl(35_12%_91%)]",
                    )}
                  >
                    <dt className="text-sm text-[hsl(24_8%_34%)]">{d.title}</dt>
                    <dd className="m-0 text-[15px] font-medium">{d.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-6 flex w-full flex-col gap-3">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(primaryBtn, "gap-2.5 text-[21px] no-underline")}
              >
                <MessageCircle aria-hidden className="h-5 w-5" strokeWidth={1.75} />
                Message us on WhatsApp
              </a>
              <a href="https://drinkhajime.jp" className={cn(secondaryBtn, "text-[hsl(24_10%_10%)] no-underline")}>
                Visit drinkhajime.jp
              </a>
              <button type="button" onClick={restart} className={secondaryBtn}>
                Start a new enquiry
              </button>
            </div>
          </section>
        ) : null}

        <footer className="mt-auto flex justify-center pt-7">
          <a
            href="#privacy"
            onClick={openPrivacy}
            className="flex min-h-11 items-center px-3 text-sm text-[hsl(24_8%_30%)] underline underline-offset-[3px]"
          >
            Privacy Notice
          </a>
        </footer>
      </main>

      {privacyOpen ? (
        <>
          <div onClick={closePrivacy} className="fixed inset-0 z-20 bg-black/50" />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="connect-privacy-title"
            className="fixed bottom-0 left-1/2 z-[21] flex w-full max-w-[520px] -translate-x-1/2 flex-col gap-3 rounded-t-[18px] bg-[hsl(40_20%_99%)] px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-[22px] shadow-[var(--shadow-float)]"
          >
            <h2
              id="connect-privacy-title"
              className="m-0 font-display text-[28px] font-medium tracking-[-0.015em]"
            >
              Privacy Notice
            </h2>
            <p className="m-0 text-[15px] leading-relaxed text-[hsl(24_8%_28%)]">
              Hajime uses the details you send here to respond to your trade enquiry. News emails are sent only if you
              tick the box. The full privacy notice will be published here.
            </p>
            <p className="m-0 text-sm leading-relaxed text-[hsl(24_8%_34%)]">
              Your answers stay on this page while you read.
            </p>
            <button
              type="button"
              ref={privacyCloseRef}
              onClick={closePrivacy}
              className={cn(primaryBtn, "mt-1.5 font-body text-base")}
            >
              Return to enquiry
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
