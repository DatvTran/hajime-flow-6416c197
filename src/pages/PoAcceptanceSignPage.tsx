import { useEffect, useRef, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { PoAcceptanceDocument } from "@/components/export/PoAcceptanceDocument";
import { ContactRow, EMAIL_RE, Field, Notice, Shell, inputCls, primaryBtn, secondaryBtn, usd } from "@/components/export/SignPageParts";
import {
  PoaApiError,
  countersignPoa,
  getPoaForSigning,
  type PoaCountersignFields,
  type PoaSigningView,
} from "@/lib/po-acceptance-api";
import { poaDate } from "@/lib/po-acceptance-terms";
import { cn } from "@/lib/utils";

type FieldKey = keyof PoaCountersignFields | "authority";
type Errors = Partial<Record<FieldKey, string>>;

const EMPTY: PoaCountersignFields = {
  legalName: "",
  registrationNo: "",
  registeredAddress: "",
  noticeEmail: "",
  signatoryName: "",
  signatoryTitle: "",
};

function validate(f: PoaCountersignFields, authority: boolean): Errors {
  const e: Errors = {};
  if (!f.legalName.trim()) e.legalName = "Enter your company's legal name.";
  if (!f.registrationNo.trim()) e.registrationNo = "Enter the registration number, or N/A.";
  if (!f.registeredAddress.trim()) e.registeredAddress = "Enter the registered address.";
  if (!EMAIL_RE.test(f.noticeEmail.trim())) e.noticeEmail = "Enter a valid email.";
  if (!f.signatoryName.trim()) e.signatoryName = "Enter your full name.";
  if (!f.signatoryTitle.trim()) e.signatoryTitle = "Enter your title.";
  if (!authority) e.authority = "Confirm you are authorised to sign.";
  return e;
}

export default function PoAcceptanceSignPage() {
  const { token = "" } = useParams();
  const [view, setView] = useState<PoaSigningView | null>(null);
  const [loadError, setLoadError] = useState<"invalid" | "error" | null>(null);
  const [fields, setFields] = useState<PoaCountersignFields>(EMPTY);
  const [authority, setAuthority] = useState(false);
  const [fax, setFax] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [justSigned, setJustSigned] = useState(false);
  const [capacityFull, setCapacityFull] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Purchase order acceptance · Hajime";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  useEffect(() => {
    let live = true;
    getPoaForSigning(token)
      .then((v) => {
        if (!live) return;
        setView(v);
        setFields({ ...EMPTY, ...Object.fromEntries(Object.entries(v.prefill || {}).map(([k, x]) => [k, x ?? ""])) });
      })
      .catch((err) => {
        if (live) setLoadError(err instanceof PoaApiError && err.status === 404 ? "invalid" : "error");
      });
    return () => {
      live = false;
    };
  }, [token]);

  const set = (k: keyof PoaCountersignFields) => (e: { target: { value: string } }) => {
    setFields((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validate(fields, authority);
    setErrors(found);
    setFormError(null);
    const first = Object.keys(found)[0];
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const signed = await countersignPoa(token, { ...fields, authority, fax });
      setView(signed);
      setJustSigned(true);
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (err) {
      if (err instanceof PoaApiError) {
        if (err.fields) setErrors(err.fields);
        if (err.code === "ALREADY_SIGNED" || err.code === "REPLACED" || err.code === "EXPIRED") {
          getPoaForSigning(token).then(setView).catch(() => undefined);
        }
        if (err.code === "CAPACITY_FULL") setCapacityFull(err.message);
        else setFormError(err.message);
      } else {
        setFormError("Could not reach the server. Check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <Shell>
        <Notice title={loadError === "invalid" ? "This link isn't valid" : "We couldn't load this document"}>
          {loadError === "invalid"
            ? "The link may be incomplete or replaced by a newer one. Use the latest email from Hajime, or message us and we'll send a fresh link."
            : "Please refresh the page in a moment. If it keeps happening, message us."}
        </Notice>
        <ContactRow />
      </Shell>
    );
  }

  if (!view) {
    return (
      <Shell>
        <div className="flex min-h-[50vh] items-center justify-center gap-3 text-[hsl(24_8%_34%)]" role="status">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          Loading document…
        </div>
      </Shell>
    );
  }

  const order = view.snapshot || {};
  const open = view.status === "open";
  const sig = view.buyerSignature;

  return (
    <Shell>
      <div ref={resultRef} className="scroll-mt-4">
        {view.status === "signed" && sig ? (
          <Notice tone="success" title={justSigned ? "Signed. Thank you." : "Already countersigned"}>
            {sig.name} ({sig.title}) countersigned {view.docNumber} for {sig.details.legalName || "the buyer"} on{" "}
            {poaDate(sig.signedAt)}. A confirmation email is on its way to {sig.details.noticeEmail || "you"}. Hajime will send the
            pro forma invoice for the 50% deposit next.
          </Notice>
        ) : view.status === "replaced" ? (
          <Notice tone="warning" title="A newer version replaced this document">
            {view.replacedBy
              ? `${view.replacedBy.docNumber} (revision ${view.replacedBy.revision}) is the current version.`
              : "There is a more recent version."}{" "}
            Use the link in Hajime's latest email to review and sign it.
          </Notice>
        ) : view.status === "expired" ? (
          <Notice tone="warning" title="This signing link has expired">
            Links stay open for 30 days. Message us and we'll send a fresh one. Nothing on your order has changed.
          </Notice>
        ) : null}
      </div>

      {open ? (
        <section className="mt-3 print:hidden" aria-labelledby="poa-heading">
          <p className="m-0 text-[13px] font-semibold uppercase tracking-[0.16em] text-[hsl(24_8%_38%)]">
            {view.docNumber}
            {view.revision > 1 ? ` · Revision ${view.revision}` : ""} · Order {view.displayId}
          </p>
          <h1 id="poa-heading" className="m-0 mt-1 font-display text-[34px] font-medium leading-[1.1] tracking-[-0.02em]">
            Review and countersign
          </h1>
          <p className="mb-0 mt-2 text-base text-[hsl(24_8%_30%)]">
            Hajime Ltd. has signed this purchase order acceptance. Check the order below, then sign at the bottom of the page.
          </p>
          <dl className="mt-4 grid grid-cols-2 overflow-hidden rounded-xl border border-[hsl(35_12%_84%)] bg-[hsl(40_20%_99%)] sm:grid-cols-4">
            {[
              ["Total order", usd(order.totalOrderUsd ?? order.subtotalUsd)],
              ["Deposit (50%)", usd(order.depositDueUsd)],
              ["Delivery", [order.incotermRule, order.fobNamedPoint].filter(Boolean).join(" ") || "N/A"],
              ["Window", String(order.deliveryWindow || "N/A")],
            ].map(([k, v], i) => (
              <div
                key={k}
                className={cn(
                  "min-w-0 px-4 py-3",
                  i % 2 === 0 && "border-r border-[hsl(35_12%_88%)]",
                  i < 2 && "border-b border-[hsl(35_12%_88%)] sm:border-b-0",
                  i === 1 && "sm:border-r",
                )}
              >
                <dt className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[hsl(24_8%_38%)]">{k}</dt>
                <dd className="m-0 mt-0.5 break-words text-[16px] font-medium tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          <a href="#poa-sign" className={cn(secondaryBtn, "mt-3 w-full")}>
            Skip to signature
          </a>
        </section>
      ) : null}

      <div className="mt-6 print:mt-0">
        <PoAcceptanceDocument order={order} poa={view} />
      </div>

      {open ? (
        <form
          ref={formRef}
          id="poa-sign"
          noValidate
          onSubmit={onSubmit}
          className="mt-6 scroll-mt-4 rounded-xl border border-[hsl(35_12%_84%)] bg-[hsl(40_20%_99%)] px-5 py-6 print:hidden"
          aria-labelledby="poa-sign-heading"
        >
          <h2 id="poa-sign-heading" className="m-0 font-display text-[28px] font-medium leading-tight">
            Countersign for the buyer
          </h2>
          <p className="mb-5 mt-1.5 text-[15px] text-[hsl(24_8%_32%)]">
            These details print on the acceptance exactly as you enter them.
          </p>

          <input
            type="text"
            name="fax"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            value={fax}
            onChange={(e) => setFax(e.target.value)}
            className="absolute left-[-9999px] h-px w-px opacity-0"
          />

          <fieldset className="m-0 flex flex-col gap-4 border-0 p-0">
            <legend className="mb-2.5 p-0 text-[17px] font-semibold">Buyer company</legend>
            <Field id="poa-legalName" label="Legal name" error={errors.legalName}>
              <input
                id="poa-legalName"
                name="legalName"
                autoComplete="organization"
                value={fields.legalName}
                onChange={set("legalName")}
                aria-invalid={Boolean(errors.legalName)}
                aria-describedby="poa-legalName-error"
                className={cn(inputCls(Boolean(errors.legalName)), "h-[52px]")}
              />
            </Field>
            <Field id="poa-registrationNo" label="Registration no." hint="Business or company registration. Write N/A if none." error={errors.registrationNo}>
              <input
                id="poa-registrationNo"
                name="registrationNo"
                value={fields.registrationNo}
                onChange={set("registrationNo")}
                aria-invalid={Boolean(errors.registrationNo)}
                aria-describedby="poa-registrationNo-error"
                className={cn(inputCls(Boolean(errors.registrationNo)), "h-[52px]")}
              />
            </Field>
            <Field id="poa-registeredAddress" label="Registered address" error={errors.registeredAddress}>
              <textarea
                id="poa-registeredAddress"
                name="registeredAddress"
                rows={3}
                autoComplete="street-address"
                value={fields.registeredAddress}
                onChange={set("registeredAddress")}
                aria-invalid={Boolean(errors.registeredAddress)}
                aria-describedby="poa-registeredAddress-error"
                className={cn(inputCls(Boolean(errors.registeredAddress)), "min-h-[96px] py-3 leading-snug")}
              />
            </Field>
            <Field id="poa-noticeEmail" label="Notice email" hint="Formal notices under this order go here." error={errors.noticeEmail}>
              <input
                id="poa-noticeEmail"
                name="noticeEmail"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={fields.noticeEmail}
                onChange={set("noticeEmail")}
                aria-invalid={Boolean(errors.noticeEmail)}
                aria-describedby="poa-noticeEmail-error"
                className={cn(inputCls(Boolean(errors.noticeEmail)), "h-[52px]")}
              />
            </Field>
          </fieldset>

          <fieldset className="m-0 mt-6 flex flex-col gap-4 border-0 p-0">
            <legend className="mb-2.5 p-0 text-[17px] font-semibold">Authorised signatory</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="poa-signatoryName" label="Full name" error={errors.signatoryName}>
                <input
                  id="poa-signatoryName"
                  name="signatoryName"
                  autoComplete="name"
                  value={fields.signatoryName}
                  onChange={set("signatoryName")}
                  aria-invalid={Boolean(errors.signatoryName)}
                  aria-describedby="poa-signatoryName-error"
                  className={cn(inputCls(Boolean(errors.signatoryName)), "h-[52px]")}
                />
              </Field>
              <Field id="poa-signatoryTitle" label="Title" error={errors.signatoryTitle}>
                <input
                  id="poa-signatoryTitle"
                  name="signatoryTitle"
                  autoComplete="organization-title"
                  placeholder="e.g. Director"
                  value={fields.signatoryTitle}
                  onChange={set("signatoryTitle")}
                  aria-invalid={Boolean(errors.signatoryTitle)}
                  aria-describedby="poa-signatoryTitle-error"
                  className={cn(inputCls(Boolean(errors.signatoryTitle)), "h-[52px]")}
                />
              </Field>
            </div>
            {fields.signatoryName.trim() ? (
              <div className="rounded-lg border border-dashed border-[hsl(35_12%_78%)] px-4 py-3" aria-hidden>
                <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.12em] text-[hsl(24_8%_38%)]">Signature preview</p>
                <p className="m-0 mt-1 font-display text-[28px] italic leading-tight">{fields.signatoryName}</p>
              </div>
            ) : null}
          </fieldset>

          <label className="mt-5 flex cursor-pointer items-start gap-3 text-[15px] leading-snug">
            <input
              type="checkbox"
              name="authority"
              checked={authority}
              onChange={(e) => {
                setAuthority(e.target.checked);
                if (errors.authority) setErrors((x) => ({ ...x, authority: undefined }));
              }}
              aria-invalid={Boolean(errors.authority)}
              aria-describedby="poa-authority-error"
              className="mt-0.5 h-5 w-5 flex-none accent-[hsl(24_10%_10%)]"
            />
            <span>
              I am authorised to bind the company named above, and I accept all three pages of this purchase order acceptance and
              the documents it references.
            </span>
          </label>
          <div id="poa-authority-error" aria-live="polite">
            {errors.authority ? <p className="mb-0 mt-2 text-sm text-[hsl(0_68%_40%)]">{errors.authority}</p> : null}
          </div>

          <div aria-live="polite">
            {capacityFull ? (
              <div className="mt-4">
                <Notice tone="warning" title="That delivery month is now full">
                  {capacityFull} Nothing has been signed.
                </Notice>
              </div>
            ) : null}
            {formError ? (
              <p className="mb-0 mt-4 flex items-center gap-2 text-[15px] text-[hsl(0_68%_40%)]">
                <AlertCircle className="h-4 w-4 flex-none" strokeWidth={1.75} aria-hidden />
                {formError}
              </p>
            ) : null}
          </div>

          <button type="submit" disabled={submitting || Boolean(capacityFull)} className={cn(primaryBtn, "mt-5")}>
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
            {submitting ? "Signing…" : "Sign and accept"}
          </button>
          <p className="mb-0 mt-3 text-center text-[13px] text-[hsl(24_8%_38%)]">
            Your typed name is your electronic signature. We record the date, time and device for the signing record.
          </p>
        </form>
      ) : null}

      <ContactRow />
    </Shell>
  );
}
