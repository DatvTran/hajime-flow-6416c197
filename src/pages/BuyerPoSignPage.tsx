import { useEffect, useRef, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { BuyerPurchaseOrderDocument } from "@/components/export/BuyerPurchaseOrderDocument";
import { ContactRow, EMAIL_RE, Field, Notice, Shell, inputCls, primaryBtn, secondaryBtn, usd } from "@/components/export/SignPageParts";
import {
  PoaApiError,
  getBuyerPoForSigning,
  signBuyerPo,
  type BuyerPoSignFields,
  type BuyerPoSigningView,
} from "@/lib/po-acceptance-api";
import { PO_ACCEPTANCE_SKUS, poaDate } from "@/lib/po-acceptance-terms";
import { monthLabel } from "@/lib/first-press-capacity";
import { cn } from "@/lib/utils";

type FieldKey = keyof BuyerPoSignFields | "authority";
type Errors = Partial<Record<FieldKey, string>>;

const EMPTY: BuyerPoSignFields = {
  legalName: "",
  registrationNo: "",
  registeredAddress: "",
  noticeEmail: "",
  signatoryName: "",
  signatoryTitle: "",
  buyerPoRef: "",
  priceInitials: "",
  requestedMonth: "",
};

function validate(f: BuyerPoSignFields, authority: boolean): Errors {
  const e: Errors = {};
  if (!f.legalName.trim()) e.legalName = "Enter your company's legal name.";
  if (!f.registrationNo.trim()) e.registrationNo = "Enter the registration number, or N/A.";
  if (!f.registeredAddress.trim()) e.registeredAddress = "Enter the registered address.";
  if (!EMAIL_RE.test(f.noticeEmail.trim())) e.noticeEmail = "Enter a valid email.";
  if (!f.signatoryName.trim()) e.signatoryName = "Enter your full name.";
  if (!f.signatoryTitle.trim()) e.signatoryTitle = "Enter your title.";
  if (!f.requestedMonth) e.requestedMonth = "Choose when you need the goods.";
  if (!f.priceInitials.trim()) e.priceInitials = "Add your initials to agree the prices.";
  if (!authority) e.authority = "Confirm you are authorised to sign.";
  return e;
}

type TextKey = Exclude<keyof BuyerPoSignFields, "registeredAddress">;

export default function BuyerPoSignPage() {
  const { token = "" } = useParams();
  const [view, setView] = useState<BuyerPoSigningView | null>(null);
  const [loadError, setLoadError] = useState<"invalid" | "error" | null>(null);
  const [fields, setFields] = useState<BuyerPoSignFields>(EMPTY);
  const [authority, setAuthority] = useState(false);
  const [fax, setFax] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [justSigned, setJustSigned] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Purchase order · Hajime";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  useEffect(() => {
    let live = true;
    getBuyerPoForSigning(token)
      .then((v) => {
        if (!live) return;
        setView(v);
        const prefill: BuyerPoSignFields = {
          ...EMPTY,
          ...Object.fromEntries(Object.entries(v.prefill || {}).map(([k, x]) => [k, x ?? ""])),
        };
        if (!v.deliveryMonths?.some((m) => m.available && m.month === prefill.requestedMonth)) prefill.requestedMonth = "";
        setFields(prefill);
      })
      .catch((err) => {
        if (live) setLoadError(err instanceof PoaApiError && err.status === 404 ? "invalid" : "error");
      });
    return () => {
      live = false;
    };
  }, [token]);

  const set = (k: keyof BuyerPoSignFields) => (e: { target: { value: string } }) => {
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
      const signed = await signBuyerPo(token, { ...fields, authority, fax });
      setView(signed);
      setJustSigned(true);
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (err) {
      if (err instanceof PoaApiError) {
        if (err.fields) setErrors(err.fields);
        if (err.code === "ALREADY_SIGNED" || err.code === "REPLACED" || err.code === "EXPIRED" || err.code === "CAPACITY_FULL") {
          getBuyerPoForSigning(token).then(setView).catch(() => undefined);
        }
        if (err.code === "CAPACITY_FULL") setFields((f) => ({ ...f, requestedMonth: "" }));
        setFormError(err.message);
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
  const deliveryMonths = view.deliveryMonths ?? [];
  const orderLines = (Array.isArray(order.lines) ? order.lines : []) as {
    sku?: string;
    cases?: number;
    unitFobUsd?: number;
    caseUsd?: number;
    lineTotalUsd?: number;
  }[];
  const priceRows = PO_ACCEPTANCE_SKUS.flatMap((s) => {
    const l = orderLines.find((x) => x.sku === s.sku && Number(x.cases) > 0);
    if (!l) return [];
    const caseUsd =
      l.caseUsd != null
        ? Number(l.caseUsd)
        : l.unitFobUsd != null
          ? Number(l.unitFobUsd) * s.bottlesPerCase
          : undefined;
    return [{ ...s, cases: Number(l.cases), caseUsd, total: l.lineTotalUsd }];
  });

  const input = (k: TextKey, label: string, opts: { hint?: string; autoComplete?: string; type?: string; required?: boolean; placeholder?: string; maxLength?: number } = {}) => (
    <Field id={`bpo-${k}`} label={label} hint={opts.hint} error={errors[k]} optional={opts.required === false}>
      <input
        id={`bpo-${k}`}
        name={k}
        type={opts.type}
        autoComplete={opts.autoComplete}
        placeholder={opts.placeholder}
        maxLength={opts.maxLength}
        value={fields[k]}
        onChange={set(k)}
        aria-invalid={Boolean(errors[k])}
        aria-describedby={`bpo-${k}-error`}
        className={cn(inputCls(Boolean(errors[k])), "h-[52px]")}
      />
    </Field>
  );

  return (
    <Shell>
      <div ref={resultRef} className="scroll-mt-4">
        {view.status === "signed" && sig ? (
          <Notice tone="success" title={justSigned ? "Signed. Thank you." : "Already signed"}>
            {sig.name} ({sig.title}) signed purchase order {sig.details.buyerPoRef || view.docNumber} for{" "}
            {sig.details.legalName || "the buyer"} on {poaDate(sig.signedAt)}. A confirmation email is on its way to{" "}
            {sig.details.noticeEmail || "you"}. Hajime will send the purchase order acceptance for your countersignature next.
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
        <section className="mt-3 print:hidden" aria-labelledby="bpo-heading">
          <p className="m-0 text-[13px] font-semibold uppercase tracking-[0.16em] text-[hsl(24_8%_38%)]">
            {view.docNumber}
            {view.revision > 1 ? ` · Revision ${view.revision}` : ""} · Order {view.displayId}
          </p>
          <h1 id="bpo-heading" className="m-0 mt-1 font-display text-[34px] font-medium leading-[1.1] tracking-[-0.02em]">
            Review and sign your purchase order
          </h1>
          <p className="mb-0 mt-2 text-base text-[hsl(24_8%_30%)]">
            Hajime Ltd. prepared this purchase order from your quotation. Check it below, then sign at the bottom of the page.
          </p>
          <dl className="mt-4 grid grid-cols-2 overflow-hidden rounded-xl border border-[hsl(35_12%_84%)] bg-[hsl(40_20%_99%)]">
            {[
              ["Order total", usd(order.totalOrderUsd ?? order.subtotalUsd)],
              ["Deposit (50%)", usd(order.depositDueUsd)],
            ].map(([k, v], i) => (
              <div key={k} className={cn("min-w-0 px-4 py-3", i === 0 && "border-r border-[hsl(35_12%_88%)]")}>
                <dt className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[hsl(24_8%_38%)]">{k}</dt>
                <dd className="m-0 mt-0.5 break-words text-[16px] font-medium tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          <a href="#bpo-sign" className={cn(secondaryBtn, "mt-3 w-full")}>
            Skip to signature
          </a>
        </section>
      ) : null}

      <div className="mt-6 print:mt-0">
        <BuyerPurchaseOrderDocument order={order} bpo={view} />
      </div>

      {open ? (
        <form
          ref={formRef}
          id="bpo-sign"
          noValidate
          onSubmit={onSubmit}
          className="mt-6 scroll-mt-4 rounded-xl border border-[hsl(35_12%_84%)] bg-[hsl(40_20%_99%)] px-5 py-6 print:hidden"
          aria-labelledby="bpo-sign-heading"
        >
          <h2 id="bpo-sign-heading" className="m-0 font-display text-[28px] font-medium leading-tight">
            Sign for the buyer
          </h2>
          <p className="mb-5 mt-1.5 text-[15px] text-[hsl(24_8%_32%)]">
            These details print on the purchase order exactly as you enter them.
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
            <legend className="mb-2.5 p-0 text-[17px] font-semibold">Agree the prices</legend>
            <div className="overflow-hidden rounded-lg border border-[hsl(35_12%_84%)]">
              <ul className="m-0 list-none divide-y divide-[hsl(35_12%_88%)] p-0">
                {priceRows.map((r) => (
                  <li key={r.sku} className="flex items-baseline justify-between gap-3 px-4 py-2.5 text-[15px]">
                    <span className="min-w-0">
                      {r.name} {r.size}
                      <span className="block text-[13px] text-[hsl(24_8%_38%)]">
                        {r.cases} cases · {usd(r.caseUsd)} FOB / case
                      </span>
                    </span>
                    <span className="flex-none font-medium tabular-nums">{usd(r.total)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-baseline justify-between gap-3 border-t border-[hsl(24_10%_10%)] bg-[hsl(38_24%_95%)] px-4 py-2.5 text-[15px] font-semibold">
                <span>Order total</span>
                <span className="tabular-nums">{usd(order.totalOrderUsd ?? order.subtotalUsd)}</span>
              </div>
            </div>
            {input("priceInitials", "Your initials", {
              autoComplete: "off",
              placeholder: "e.g. JW",
              maxLength: 12,
              hint: "Initialling confirms you agree these case prices and the order total.",
            })}
          </fieldset>

          <fieldset className="m-0 mt-6 border-0 p-0" aria-describedby="bpo-requestedMonth-hint bpo-requestedMonth-error">
            <legend className="mb-1 p-0 text-[17px] font-semibold">When do you need the goods?</legend>
            <p id="bpo-requestedMonth-hint" className="mb-3 mt-0 text-[13px] text-[hsl(24_8%_38%)]">
              Pick your delivery month. We bottle the month before, so fully booked months can't be chosen.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {deliveryMonths.map((m) => {
                const checked = fields.requestedMonth === m.month;
                return (
                  <label
                    key={m.month}
                    className={cn(
                      "flex min-h-[56px] cursor-pointer flex-col justify-center rounded-lg border px-4 py-2 text-[15px]",
                      !m.available && "cursor-not-allowed opacity-50",
                      checked
                        ? "border-[hsl(24_10%_10%)] bg-[hsl(24_10%_10%)] text-[hsl(40_30%_98%)]"
                        : "border-[hsl(35_12%_80%)] bg-white",
                      errors.requestedMonth && !checked && "border-[hsl(0_68%_40%)]",
                    )}
                  >
                    <input
                      type="radio"
                      name="requestedMonth"
                      value={m.month}
                      checked={checked}
                      disabled={!m.available}
                      onChange={() => {
                        setFields((f) => ({ ...f, requestedMonth: m.month }));
                        if (errors.requestedMonth) setErrors((x) => ({ ...x, requestedMonth: undefined }));
                      }}
                      className="sr-only"
                    />
                    <span className="font-medium">{monthLabel(m.month)}</span>
                    <span className={cn("text-[12px]", checked ? "opacity-80" : "text-[hsl(24_8%_38%)]")}>
                      {m.available ? "Available" : "Fully booked"}
                    </span>
                  </label>
                );
              })}
            </div>
            <div id="bpo-requestedMonth-error" aria-live="polite">
              {errors.requestedMonth ? <p className="mb-0 mt-2 text-sm text-[hsl(0_68%_40%)]">{errors.requestedMonth}</p> : null}
            </div>
          </fieldset>

          <fieldset className="m-0 mt-6 flex flex-col gap-4 border-0 p-0">
            <legend className="mb-2.5 p-0 text-[17px] font-semibold">Your PO reference</legend>
            {input("buyerPoRef", "PO reference", {
              required: false,
              hint: `Optional. Your own purchase order number. Leave blank to use ${view.docNumber}.`,
            })}
          </fieldset>

          <fieldset className="m-0 mt-6 flex flex-col gap-4 border-0 p-0">
            <legend className="mb-2.5 p-0 text-[17px] font-semibold">Buyer company</legend>
            {input("legalName", "Legal name", { autoComplete: "organization" })}
            {input("registrationNo", "Registration no.", { hint: "Business or company registration. Write N/A if none." })}
            <Field id="bpo-registeredAddress" label="Registered address" error={errors.registeredAddress}>
              <textarea
                id="bpo-registeredAddress"
                name="registeredAddress"
                rows={3}
                autoComplete="street-address"
                value={fields.registeredAddress}
                onChange={set("registeredAddress")}
                aria-invalid={Boolean(errors.registeredAddress)}
                aria-describedby="bpo-registeredAddress-error"
                className={cn(inputCls(Boolean(errors.registeredAddress)), "min-h-[96px] py-3 leading-snug")}
              />
            </Field>
            {input("noticeEmail", "Notice email", { type: "email", autoComplete: "email", hint: "Formal notices under this order go here." })}
          </fieldset>

          <fieldset className="m-0 mt-6 flex flex-col gap-4 border-0 p-0">
            <legend className="mb-2.5 p-0 text-[17px] font-semibold">Authorised signatory</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              {input("signatoryName", "Full name", { autoComplete: "name" })}
              {input("signatoryTitle", "Title", { autoComplete: "organization-title", placeholder: "e.g. Director" })}
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
              aria-describedby="bpo-authority-error"
              className="mt-0.5 h-5 w-5 flex-none accent-[hsl(24_10%_10%)]"
            />
            <span>I am authorised to place this order for the company named above, and I accept the terms of this purchase order.</span>
          </label>
          <div id="bpo-authority-error" aria-live="polite">
            {errors.authority ? <p className="mb-0 mt-2 text-sm text-[hsl(0_68%_40%)]">{errors.authority}</p> : null}
          </div>

          <div aria-live="polite">
            {formError ? (
              <p className="mb-0 mt-4 flex items-center gap-2 text-[15px] text-[hsl(0_68%_40%)]">
                <AlertCircle className="h-4 w-4 flex-none" strokeWidth={1.75} aria-hidden />
                {formError}
              </p>
            ) : null}
          </div>

          <button type="submit" disabled={submitting} className={cn(primaryBtn, "mt-5")}>
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
            {submitting ? "Signing…" : "Sign purchase order"}
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
