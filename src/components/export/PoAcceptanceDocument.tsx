import type { ReactNode } from "react";
import { EXPORT_SELLER } from "@/lib/export-commercial";
import {
  PO_ACCEPTANCE_CLAUSES,
  PO_ACCEPTANCE_EXECUTION_NOTE,
  PO_ACCEPTANCE_LEGAL_REVIEW_NOTE,
  PO_ACCEPTANCE_PAGE1_NOTE,
  PO_ACCEPTANCE_SKUS,
  PO_ACCEPTANCE_TERMS_VERSION,
  poaDate,
  type PoaSummary,
} from "@/lib/po-acceptance-terms";
import { cn } from "@/lib/utils";

type Order = Record<string, unknown>;
type Line = { sku?: string; cases?: number; totalBottles?: number; unitFobUsd?: number; caseUsd?: number; lineTotalUsd?: number };

const NA = "N/A";

function text(v: unknown): string {
  const s = v == null ? "" : String(v).trim();
  return s || NA;
}

function usd(v: unknown): string {
  const n = Number(v);
  if (v == null || v === "" || !Number.isFinite(n)) return NA;
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function poaDateTime(v: unknown): string {
  if (!v) return NA;
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return NA;
  return `${d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Hong_Kong",
  })} HKT`;
}

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0 border-b border-[hsl(35_14%_82%)] px-3 py-2", className)}>
      <p className="m-0 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[hsl(24_8%_38%)]">{label}</p>
      <div className="mt-0.5 whitespace-pre-line break-words text-[12.5px] leading-snug">{children}</div>
    </div>
  );
}

function PageFrame({ n, kicker, children }: { n: number; kicker: string; children: ReactNode }) {
  return (
    <section className="poa-page relative flex flex-col bg-[hsl(40_30%_99%)] px-5 py-6 text-[hsl(24_10%_10%)] shadow-[0_1px_3px_hsl(24_10%_10%/0.08)] sm:px-9 sm:py-8 print:min-h-[277mm] print:px-0 print:py-0 print:shadow-none">
      <header className="mb-5 flex items-baseline justify-between gap-3 border-b border-[hsl(24_10%_10%)] pb-2">
        <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.32em]">Hajime Ltd.</p>
        <p className="m-0 text-right text-[10px] uppercase tracking-[0.22em] text-[hsl(24_8%_34%)]">{kicker}</p>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="mt-6 flex flex-wrap items-baseline justify-between gap-2 border-t border-[hsl(35_14%_82%)] pt-2 text-[9.5px] uppercase tracking-[0.14em] text-[hsl(24_8%_38%)]">
        <span>Hajime · Hong Kong · drinkhajime.jp</span>
        <span>
          Confidential trade · {PO_ACCEPTANCE_TERMS_VERSION} · {n} / 3
        </span>
      </footer>
    </section>
  );
}

function Clause({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <p className="m-0 break-inside-avoid text-[11.5px] leading-[1.55] text-[hsl(24_10%_14%)]">
      <span className="mr-1.5 font-semibold tabular-nums">{n}</span>
      <span className="font-semibold">{title}</span> {body}
    </p>
  );
}

function SignatureBlock({
  heading,
  name,
  title,
  signedAt,
  pendingLabel,
}: {
  heading: string;
  name?: string | null;
  title?: string | null;
  signedAt?: string | null;
  pendingLabel: string;
}) {
  return (
    <div className="break-inside-avoid border border-[hsl(35_14%_78%)]">
      <p className="m-0 border-b border-[hsl(35_14%_78%)] bg-[hsl(38_24%_95%)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]">
        {heading}
      </p>
      <Field label="Authorized name / title">{name ? `${name}${title ? `, ${title}` : ""}` : NA}</Field>
      <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Field label="Signature" className="border-b-0 border-r border-r-[hsl(35_14%_82%)]">
          {signedAt && name ? (
            <span>
              <span className="block font-display text-[22px] italic leading-tight">{name}</span>
              <span className="text-[10.5px] text-[hsl(24_8%_34%)]">Signed electronically</span>
            </span>
          ) : (
            <span className="text-[hsl(24_8%_45%)]">{pendingLabel}</span>
          )}
        </Field>
        <Field label="Date" className="border-b-0">
          {signedAt ? poaDate(signedAt) : NA}
        </Field>
      </div>
    </div>
  );
}

export function PoAcceptanceDocument({
  order,
  poa,
  showAudit = false,
}: {
  order: Order;
  poa?: PoaSummary | null;
  showAudit?: boolean;
}) {
  const issued = poa && poa.status !== "draft";
  const o: Order = issued && poa?.snapshot ? poa.snapshot : order;
  const sig = poa?.buyerSignature ?? null;
  const buyer = {
    legalName: sig?.details.legalName ?? o.buyerLegalName ?? o.buyerCompany,
    registrationNo: sig?.details.registrationNo ?? o.buyerRegistrationNo,
    registeredAddress: sig?.details.registeredAddress ?? o.buyerRegisteredAddress,
    noticeEmail: sig?.details.noticeEmail ?? o.buyerNoticeEmail ?? o.buyerEmail,
  };
  const lines = (Array.isArray(o.lines) ? o.lines : []) as Line[];
  const bySku = new Map(lines.map((l) => [String(l.sku), l]));
  const seller = poa?.seller;
  const sellerNotice = seller?.noticeEmail;
  const incoterm = [o.incotermRule, o.fobNamedPoint].filter((x) => String(x ?? "").trim()).join(" ");

  return (
    <div className="poa-doc mx-auto flex max-w-[820px] flex-col gap-5 print:max-w-none print:gap-0">
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm 14mm; }
          .poa-page { break-after: page; page-break-after: always; }
          .poa-page:last-child { break-after: auto; page-break-after: auto; }
        }
      `}</style>

      <PageFrame n={1} kicker="Order confirmation">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="m-0 font-display text-[30px] font-medium leading-none tracking-[-0.01em] sm:text-[34px]">
              Purchase order acceptance
            </h1>
            <p className="m-0 mt-1.5 text-[10.5px] uppercase tracking-[0.2em] text-[hsl(24_8%_34%)]">
              Hajime Ltd. | Head office: Hong Kong
            </p>
          </div>
          {!issued ? (
            <span className="rounded-full border border-[hsl(40_70%_42%)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(36_80%_30%)]">
              Draft · not issued
            </span>
          ) : null}
        </div>

        <div className="grid border-l border-t border-[hsl(35_14%_82%)] sm:grid-cols-3 [&>*]:border-r [&>*]:border-r-[hsl(35_14%_82%)]">
          <Field label="Trade contact">{text(sellerNotice)}</Field>
          <Field label="Acceptance no.">{issued ? `${poa?.docNumber}${(poa?.revision ?? 1) > 1 ? ` (rev. ${poa?.revision})` : ""}` : "HJ-POA- (on issue)"}</Field>
          <Field label="Issue date">{issued ? poaDate(poa?.issuedAt) : NA}</Field>

          <Field label="Seller registered address">{EXPORT_SELLER.registeredAddress}</Field>
          <Field label="Seller registration no.">{EXPORT_SELLER.registrationNo}</Field>
          <Field label="Seller notice email">{text(sellerNotice)}</Field>

          <Field label="Buyer legal name / reg. no.">
            {text(buyer.legalName)}
            {buyer.registrationNo ? ` · ${String(buyer.registrationNo)}` : ""}
          </Field>
          <Field label="Buyer registered address">{text(buyer.registeredAddress)}</Field>
          <Field label="Buyer contact / notice email">
            {[o.buyerName, buyer.noticeEmail].filter((x) => String(x ?? "").trim()).join(" · ") || NA}
          </Field>

          <Field label="Buyer PO no.">{text(o.buyerPoNo)}</Field>
          <Field label="Quotation no.">{text(o.quoteNo)}</Field>
          <Field label="Pro forma no.">{text(o.piNo)}</Field>

          <Field label="Destination / consignee" className="sm:col-span-3">
            {[o.destinationCountry, o.consignee].filter((x) => String(x ?? "").trim()).join(" — ") || NA}
          </Field>
        </div>

        <div className="mb-2 mt-5 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="m-0 font-display text-[19px] font-semibold">Products &amp; pricing</h2>
          <p className="m-0 text-[10px] uppercase tracking-[0.14em] text-[hsl(24_8%_38%)]">
            USD | Prices on agreed delivery basis
          </p>
        </div>
        <div className="-mx-1 overflow-x-auto px-1">
          <table className="w-full min-w-[560px] border-collapse text-left text-[11.5px] tabular-nums">
            <thead>
              <tr className="border-y border-[hsl(24_10%_10%)] text-[9.5px] uppercase tracking-[0.1em] text-[hsl(24_8%_30%)]">
                <th className="py-1.5 pr-2 font-semibold">SKU / product</th>
                <th className="px-2 py-1.5 font-semibold">Size</th>
                <th className="px-2 py-1.5 text-right font-semibold">Cases</th>
                <th className="px-2 py-1.5 text-right font-semibold">Btls/case</th>
                <th className="px-2 py-1.5 text-right font-semibold">Total btls</th>
                <th className="px-2 py-1.5 text-right font-semibold">Unit (USD)</th>
                <th className="px-2 py-1.5 text-right font-semibold">Case (USD)</th>
                <th className="py-1.5 pl-2 text-right font-semibold">Line total (USD)</th>
              </tr>
            </thead>
            <tbody>
              {PO_ACCEPTANCE_SKUS.map((s) => {
                const l = bySku.get(s.sku);
                return (
                  <tr key={s.sku} className="border-b border-[hsl(35_14%_86%)]">
                    <td className="py-1.5 pr-2">
                      <span className="font-medium">{s.name}</span>
                      <span className="block text-[10.5px] text-[hsl(24_8%_38%)]">{s.sub}</span>
                    </td>
                    <td className="px-2 py-1.5">{s.size}</td>
                    <td className="px-2 py-1.5 text-right">{l ? l.cases : "—"}</td>
                    <td className="px-2 py-1.5 text-right">{s.bottlesPerCase}</td>
                    <td className="px-2 py-1.5 text-right">{l ? (l.totalBottles ?? Number(l.cases) * s.bottlesPerCase) : "—"}</td>
                    <td className="px-2 py-1.5 text-right">{l ? usd(l.unitFobUsd) : "—"}</td>
                    <td className="px-2 py-1.5 text-right">{l ? usd(l.caseUsd) : "—"}</td>
                    <td className="py-1.5 pl-2 text-right font-medium">{l ? usd(l.lineTotalUsd) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            <div className="text-[hsl(24_8%_30%)] [&_p]:text-[10.5px] [&_p]:leading-relaxed">
              <p className="m-0 font-semibold uppercase tracking-[0.12em]">Case calculation</p>
              <p className="m-0">Total bottles = cases × bottles per case.</p>
              <p className="m-0">Case price = unit price × bottles per case.</p>
              <p className="m-0">Line total = cases × case price.</p>
            </div>
            <div className="border border-[hsl(35_14%_82%)]">
              <Field label="Required documents / special conditions ref." className="border-b-0">
                {text(o.specialConditions)}
                <span className="mt-1 block text-[10.5px] text-[hsl(24_8%_38%)]">
                  Import duties, destination taxes and excluded logistics follow the agreed delivery rule and clause 4.
                </span>
              </Field>
            </div>
          </div>
          <dl className="m-0 self-start border border-[hsl(24_10%_10%)] text-[12px] tabular-nums">
            {[
              ["Order subtotal", o.subtotalUsd],
              [o.otherChargesNote ? `Other agreed charges (${String(o.otherChargesNote)})` : "Other agreed charges", o.otherChargesUsd ?? 0],
              ["Total order value", o.totalOrderUsd ?? o.subtotalUsd],
              ["Deposit required (50%)", o.depositDueUsd],
              ["Balance before release (50%)", o.balanceDueUsd],
            ].map(([label, value], i) => (
              <div
                key={String(label)}
                className={cn(
                  "flex items-baseline justify-between gap-3 px-3 py-1.5",
                  i < 4 && "border-b border-[hsl(35_14%_84%)]",
                  i === 2 && "bg-[hsl(38_24%_95%)] font-semibold",
                )}
              >
                <dt className="text-[10.5px] uppercase tracking-[0.08em]">{String(label)}</dt>
                <dd className="m-0">US$ {usd(value)}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-4 grid border-l border-t border-[hsl(35_14%_82%)] sm:grid-cols-3 [&>*]:border-r [&>*]:border-r-[hsl(35_14%_82%)]">
          <Field label="Incoterms rule / exact port or place">
            {incoterm || NA}
            <span className="mt-0.5 block text-[10px] text-[hsl(24_8%_38%)]">Incoterms® 2020</span>
          </Field>
          <Field label="Agreed delivery window / lead time">{text(o.deliveryWindow)}</Field>
          <Field label="Approved spec. / label / handling ref.">{text(o.specLabelRef)}</Field>
        </div>

        <p className="mb-0 mt-4 text-[10.5px] leading-relaxed text-[hsl(24_8%_30%)]">{PO_ACCEPTANCE_PAGE1_NOTE}</p>
      </PageFrame>

      <PageFrame n={2} kicker="International order · Purchase order acceptance">
        <h2 className="m-0 font-display text-[22px] font-semibold">Order acceptance conditions</h2>
        <p className="mb-4 mt-1 text-[11px] text-[hsl(24_8%_34%)]">
          These conditions form part of the commercial particulars on page 1.
        </p>
        <div className="space-y-3">
          {PO_ACCEPTANCE_CLAUSES.slice(0, 7).map((c) => (
            <Clause key={c.n} {...c} />
          ))}
        </div>
      </PageFrame>

      <PageFrame n={3} kicker="International order · Purchase order acceptance">
        <h2 className="m-0 font-display text-[22px] font-semibold">Conditions &amp; authorization</h2>
        <p className="mb-4 mt-1 text-[11px] text-[hsl(24_8%_34%)]">
          Continued conditions. Both parties confirm their agreement below.
        </p>
        <div className="space-y-3">
          {PO_ACCEPTANCE_CLAUSES.slice(7).map((c) => (
            <Clause key={c.n} {...c} />
          ))}
        </div>
        <p className="mb-3 mt-5 text-[10.5px] leading-relaxed text-[hsl(24_8%_30%)]">{PO_ACCEPTANCE_EXECUTION_NOTE}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <SignatureBlock
            heading="For Hajime Ltd. (Seller)"
            name={issued ? seller?.signedName : null}
            title={issued ? seller?.signedTitle : null}
            signedAt={issued ? seller?.signedAt : null}
            pendingLabel="Signed on issue"
          />
          <SignatureBlock
            heading="For Buyer"
            name={sig?.name}
            title={sig?.title}
            signedAt={sig?.signedAt}
            pendingLabel="Awaiting countersignature"
          />
        </div>
        {sig ? (
          <div className="mt-3 break-inside-avoid border border-dashed border-[hsl(35_14%_76%)] px-3 py-2 text-[hsl(24_8%_34%)] [&_p]:text-[10px] [&_p]:leading-relaxed">
            <p className="m-0 font-semibold uppercase tracking-[0.12em]">Electronic signature record</p>
            <p className="m-0">
              {poa?.docNumber} rev. {poa?.revision} · Hajime Ltd. signed {poaDateTime(seller?.signedAt)} · Buyer countersigned{" "}
              {poaDateTime(sig.signedAt)} · Terms {poa?.termsVersion}
            </p>
            {poa?.contentHash ? <p className="m-0 break-all">Document fingerprint (SHA-256): {poa.contentHash}</p> : null}
            {showAudit && sig.ip ? (
              <p className="m-0 break-all">
                Signed from {sig.ip}
                {sig.userAgent ? ` · ${sig.userAgent}` : ""}
              </p>
            ) : null}
          </div>
        ) : null}
        <p className="mb-0 mt-3 text-[9.5px] italic text-[hsl(24_8%_42%)]">{PO_ACCEPTANCE_LEGAL_REVIEW_NOTE}</p>
      </PageFrame>
    </div>
  );
}
