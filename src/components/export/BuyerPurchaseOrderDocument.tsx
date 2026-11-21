import type { ReactNode } from "react";
import { EXPORT_SELLER } from "@/lib/export-commercial";
import {
  BUYER_PO_TERMS,
  BUYER_PO_TERMS_VERSION,
  PO_ACCEPTANCE_SKUS,
  poaDate,
  type BuyerPoSummary,
} from "@/lib/po-acceptance-terms";
import { cn } from "@/lib/utils";
import { monthLabel } from "@/lib/first-press-capacity";

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

function dateTime(v: unknown): string {
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

export function BuyerPurchaseOrderDocument({
  order,
  bpo,
  showAudit = false,
}: {
  order: Order;
  bpo?: BuyerPoSummary | null;
  showAudit?: boolean;
}) {
  const issued = bpo && bpo.status !== "draft";
  const o: Order = issued && bpo?.snapshot ? bpo.snapshot : order;
  const sig = bpo?.buyerSignature ?? null;
  const priceInitials = sig?.details.priceInitials ?? "";
  const buyer = {
    legalName: sig?.details.legalName ?? o.buyerLegalName ?? o.buyerCompany,
    registrationNo: sig?.details.registrationNo ?? o.buyerRegistrationNo,
    address: sig?.details.registeredAddress ?? o.buyerRegisteredAddress ?? o.buyerAddress,
    email: sig?.details.noticeEmail ?? o.buyerNoticeEmail ?? o.buyerEmail,
  };
  const lines = (Array.isArray(o.lines) ? o.lines : []) as Line[];
  const bySku = new Map(lines.map((l) => [String(l.sku), l]));
  const rows = PO_ACCEPTANCE_SKUS.filter((s) => bySku.has(s.sku));
  const incoterm = [o.incotermRule, o.fobNamedPoint].filter((x) => String(x ?? "").trim()).join(" ");
  const docNo = issued ? `${bpo?.docNumber}${(bpo?.revision ?? 1) > 1 ? ` (rev. ${bpo?.revision})` : ""}` : "HJ-BPO- (on send)";

  return (
    <div className="mx-auto max-w-[820px] print:max-w-none">
      <style>{`@media print { @page { size: A4; margin: 12mm 14mm; } }`}</style>
      <section className="relative flex flex-col bg-[hsl(40_30%_99%)] px-5 py-6 text-[hsl(24_10%_10%)] shadow-[0_1px_3px_hsl(24_10%_10%/0.08)] sm:px-9 sm:py-8 print:px-0 print:py-0 print:shadow-none">
        <header className="mb-5 flex items-baseline justify-between gap-3 border-b border-[hsl(24_10%_10%)] pb-2">
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.32em]">{text(buyer.legalName)}</p>
          <p className="m-0 text-right text-[10px] uppercase tracking-[0.22em] text-[hsl(24_8%_34%)]">Purchase order</p>
        </header>

        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="m-0 font-display text-[30px] font-medium leading-none tracking-[-0.01em] sm:text-[34px]">
              Purchase order
            </h1>
            <p className="m-0 mt-1.5 text-[10.5px] uppercase tracking-[0.2em] text-[hsl(24_8%_34%)]">
              To Hajime Ltd. | Hong Kong
            </p>
          </div>
          {!issued ? (
            <span className="rounded-full border border-[hsl(40_70%_42%)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(36_80%_30%)]">
              Draft · not sent
            </span>
          ) : null}
        </div>

        <div className="grid border-l border-t border-[hsl(35_14%_82%)] sm:grid-cols-3 [&>*]:border-r [&>*]:border-r-[hsl(35_14%_82%)]">
          <Field label="PO no.">{docNo}</Field>
          <Field label="Buyer PO reference">{text(sig?.details.buyerPoRef ?? o.buyerPoNo)}</Field>
          <Field label="Date">{issued ? poaDate(bpo?.issuedAt) : NA}</Field>

          <Field label="Buyer (issuer)">
            {text(buyer.legalName)}
            {buyer.registrationNo ? ` · ${String(buyer.registrationNo)}` : ""}
          </Field>
          <Field label="Buyer address">{text(buyer.address)}</Field>
          <Field label="Buyer contact">
            {[o.buyerName, buyer.email].filter((x) => String(x ?? "").trim()).join(" · ") || NA}
          </Field>

          <Field label="Seller">
            {EXPORT_SELLER.legalNameFull} · {EXPORT_SELLER.registrationNo}
          </Field>
          <Field label="Seller address">{EXPORT_SELLER.registeredAddress}</Field>
          <Field label="Against quotation">{text(o.quoteNo)}</Field>

          <Field label="Destination / consignee" className="sm:col-span-3">
            {[o.destinationCountry, o.consignee].filter((x) => String(x ?? "").trim()).join(" — ") || NA}
          </Field>
        </div>

        <h2 className="mb-2 mt-5 font-display text-[19px] font-semibold">Goods ordered</h2>
        <div className="-mx-1 overflow-x-auto px-1">
          <table className="w-full min-w-[520px] border-collapse text-left text-[11.5px] tabular-nums">
            <thead>
              <tr className="border-y border-[hsl(24_10%_10%)] text-[9.5px] uppercase tracking-[0.1em] text-[hsl(24_8%_30%)]">
                <th className="py-1.5 pr-2 font-semibold">Product</th>
                <th className="px-2 py-1.5 font-semibold">Size</th>
                <th className="px-2 py-1.5 text-right font-semibold">Cases</th>
                <th className="px-2 py-1.5 text-right font-semibold">Btls/case</th>
                <th className="px-2 py-1.5 text-right font-semibold">FOB / case (USD)</th>
                <th className="py-1.5 pl-2 text-right font-semibold">Line total (USD)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const l = bySku.get(s.sku) as Line;
                const caseUsd =
                  l.caseUsd ??
                  (l.unitFobUsd != null ? Number(l.unitFobUsd) * s.bottlesPerCase : undefined);
                return (
                  <tr key={s.sku} className="border-b border-[hsl(35_14%_86%)]">
                    <td className="py-1.5 pr-2">
                      <span className="font-medium">{s.name}</span>
                      <span className="block text-[10.5px] text-[hsl(24_8%_38%)]">{s.sub}</span>
                    </td>
                    <td className="px-2 py-1.5">{s.size}</td>
                    <td className="px-2 py-1.5 text-right">{l.cases}</td>
                    <td className="px-2 py-1.5 text-right">{s.bottlesPerCase}</td>
                    <td className="px-2 py-1.5 text-right">{usd(caseUsd)}</td>
                    <td className="py-1.5 pl-2 text-right font-medium">{usd(l.lineTotalUsd)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="grid self-start border-l border-t border-[hsl(35_14%_82%)] [&>*]:border-r [&>*]:border-r-[hsl(35_14%_82%)]">
            <Field label="Delivery rule / named place">
              {incoterm || "To be confirmed on the PO acceptance"}
              <span className="mt-0.5 block text-[10px] text-[hsl(24_8%_38%)]">Incoterms® 2020</span>
            </Field>
            <Field label="Requested delivery">
              {monthLabel(sig?.details.requestedMonth ?? (o.requestedMonth as string | undefined)) ||
                (o.deliveryWindow ? String(o.deliveryWindow) : "Chosen by Buyer when signing")}
            </Field>
          </div>
          <div className="flex flex-col gap-2 self-start">
            <dl className="m-0 border border-[hsl(24_10%_10%)] text-[12px] tabular-nums">
              {[
                ["Order total", o.totalOrderUsd ?? o.subtotalUsd],
                ["Deposit (50%)", o.depositDueUsd],
                ["Balance before release (50%)", o.balanceDueUsd],
              ].map(([label, value], i) => (
                <div
                  key={String(label)}
                  className={cn(
                    "flex items-baseline justify-between gap-3 px-3 py-1.5",
                    i < 2 && "border-b border-[hsl(35_14%_84%)]",
                    i === 0 && "bg-[hsl(38_24%_95%)] font-semibold",
                  )}
                >
                  <dt className="text-[10.5px] uppercase tracking-[0.08em]">{String(label)}</dt>
                  <dd className="m-0">US$ {usd(value)}</dd>
                </div>
              ))}
            </dl>
            <div className="grid break-inside-avoid grid-cols-[minmax(0,1fr)_88px] border border-[hsl(24_10%_10%)]">
              <div className="min-w-0 px-3 py-2">
                <p className="m-0 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[hsl(24_8%_38%)]">Prices agreed by Buyer</p>
                <p className="m-0 mt-0.5 text-[11px] leading-snug text-[hsl(24_8%_34%)]">
                  {priceInitials
                    ? `Unit prices and order total above agreed on ${poaDate(sig?.signedAt)}.`
                    : "Buyer initials to agree the unit prices and order total above."}
                </p>
              </div>
              <div className="border-l border-[hsl(35_14%_82%)] px-3 py-2">
                <p className="m-0 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[hsl(24_8%_38%)]">Initials</p>
                <p className="m-0 mt-0.5 min-h-[26px] font-display text-[22px] italic leading-tight">{priceInitials}</p>
              </div>
            </div>
          </div>
        </div>

        <h2 className="mb-2 mt-5 font-display text-[17px] font-semibold">Terms</h2>
        <ol className="m-0 list-decimal space-y-1.5 pl-5 text-[11.5px] leading-[1.55] text-[hsl(24_10%_14%)]">
          {BUYER_PO_TERMS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>

        <div className="mt-5 break-inside-avoid border border-[hsl(35_14%_78%)]">
          <p className="m-0 border-b border-[hsl(35_14%_78%)] bg-[hsl(38_24%_95%)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]">
            For Buyer
          </p>
          <Field label="Authorized name / title">{sig ? `${sig.name}, ${sig.title}` : NA}</Field>
          <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <Field label="Signature" className="border-b-0 border-r border-r-[hsl(35_14%_82%)]">
              {sig ? (
                <span>
                  <span className="block font-display text-[22px] italic leading-tight">{sig.name}</span>
                  <span className="text-[10.5px] text-[hsl(24_8%_34%)]">Signed electronically</span>
                </span>
              ) : (
                <span className="text-[hsl(24_8%_45%)]">Awaiting signature</span>
              )}
            </Field>
            <Field label="Date" className="border-b-0">
              {sig ? poaDate(sig.signedAt) : NA}
            </Field>
          </div>
        </div>
        {sig ? (
          <div className="mt-3 break-inside-avoid border border-dashed border-[hsl(35_14%_76%)] px-3 py-2 text-[hsl(24_8%_34%)] [&_p]:text-[10px] [&_p]:leading-relaxed">
            <p className="m-0 font-semibold uppercase tracking-[0.12em]">Electronic signature record</p>
            <p className="m-0">
              {bpo?.docNumber} rev. {bpo?.revision} · Buyer signed {dateTime(sig.signedAt)} · Terms {bpo?.termsVersion}
            </p>
            {bpo?.contentHash ? <p className="m-0 break-all">Document fingerprint (SHA-256): {bpo.contentHash}</p> : null}
            {showAudit && sig.ip ? (
              <p className="m-0 break-all">
                Signed from {sig.ip}
                {sig.userAgent ? ` · ${sig.userAgent}` : ""}
              </p>
            ) : null}
          </div>
        ) : null}

        <footer className="mt-6 flex flex-wrap items-baseline justify-between gap-2 border-t border-[hsl(35_14%_82%)] pt-2 text-[9.5px] uppercase tracking-[0.14em] text-[hsl(24_8%_38%)]">
          <span>Prepared by Hajime Ltd. from quotation {text(o.quoteNo)}</span>
          <span>{bpo?.termsVersion || BUYER_PO_TERMS_VERSION}</span>
        </footer>
      </section>
    </div>
  );
}
