import { Link } from "react-router-dom";
import type { ExportOrderDto } from "@/lib/api-v1";
import {
  EXPORT_SELLER,
  exportDocTitle,
  isBuyerExportDoc,
  type ExportDocType,
} from "@/lib/export-commercial";
import { EXPORT_BUYER_TERMS } from "@/lib/export-pack-copy";
import { Button } from "@/components/ui/button";
import { HajimeLogo } from "@/components/HajimeLogo";

type Line = {
  sku: string;
  product?: string;
  size?: string;
  cases?: number;
  unitFobUsd?: number;
  lineTotalUsd?: number;
  bottlesPerCase?: number;
};

export function ExportOrderDocView({
  order,
  doc,
  backTo,
  onIssue,
  issuing,
}: {
  order: ExportOrderDto;
  doc: ExportDocType;
  backTo: string;
  onIssue?: () => void;
  issuing?: boolean;
}) {
  const lines = (Array.isArray(order.lines) ? order.lines : []) as Line[];
  const issuedAt =
    (order.issuedDocs as Record<string, { issuedAt?: string }> | undefined)?.[doc]?.issuedAt ||
    (order.buyerDocStatus as Record<string, { issuedAt?: string }> | undefined)?.[doc]?.issuedAt;

  return (
    <div className="mx-auto max-w-[800px] px-4 py-6 print:max-w-none print:px-0 print:py-0">
      <style>{`
        @media print {
          .export-doc-chrome { display: none !important; }
          body { background: #fff !important; }
        }
      `}</style>
      <div className="export-doc-chrome mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link to={backTo} className="text-sm text-accent underline-offset-2 hover:underline">
          Back to file
        </Link>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
            Print / Save PDF
          </Button>
          {onIssue && isBuyerExportDoc(doc) ? (
            <Button type="button" size="sm" disabled={issuing} onClick={onIssue}>
              {issuedAt ? "Re-issue to buyer" : "Issue & email buyer"}
            </Button>
          ) : onIssue && doc === "production_auth" ? (
            <Button type="button" size="sm" disabled={issuing} onClick={onIssue}>
              Mark issued (manufacturer)
            </Button>
          ) : onIssue && (doc === "export_checklist" || doc === "shipment_release") ? (
            <Button type="button" size="sm" disabled={issuing} onClick={onIssue}>
              {doc === "shipment_release" ? (issuedAt ? "Re-issue to buyer" : "Issue & email buyer") : "Mark checklist issued"}
            </Button>
          ) : null}
        </div>
      </div>

      <article className="rounded-none border border-border bg-[hsl(40_18%_97%)] p-8 text-[13px] leading-relaxed text-foreground print:border-0">
        <header className="mb-6 flex items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <HajimeLogo className="mb-2 h-8 w-8" />
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{EXPORT_SELLER.legalName}</p>
            <p className="font-display text-2xl font-semibold tracking-tight">{exportDocTitle(doc)}</p>
            <p className="mt-1 text-muted-foreground">
              {String(order.displayId)} · {docRef(order, doc)}
            </p>
          </div>
          <div className="text-right text-[12px] text-muted-foreground">
            <p>{EXPORT_SELLER.jurisdiction} · Production {EXPORT_SELLER.productionBase}</p>
            <p>{EXPORT_SELLER.workingIncoterm}</p>
            <p>{EXPORT_SELLER.currency}</p>
          </div>
        </header>

        <section className="mb-5 grid gap-4 sm:grid-cols-2">
          <div>
            <h2 className="text-[11px] uppercase tracking-wide text-muted-foreground">Buyer</h2>
            <p className="font-medium">{String(order.buyerCompany)}</p>
            <p>{String(order.buyerName)}</p>
            <p>{String(order.buyerAddress || "—")}</p>
            <p>{String(order.buyerEmail || "—")}</p>
            <p>
              {String(order.territory)}
              {order.destinationCountry ? ` · ${String(order.destinationCountry)}` : ""}
            </p>
          </div>
          <div>
            <h2 className="text-[11px] uppercase tracking-wide text-muted-foreground">Commercial</h2>
            <p>Buyer PO: {String(order.buyerPoNo || "—")}</p>
            <p>Quote {String(order.quoteNo)} · PI {String(order.piNo)}</p>
            {issuedAt ? <p>Issued {String(issuedAt).slice(0, 10)}</p> : <p>Draft — not yet issued</p>}
          </div>
        </section>

        {doc !== "export_checklist" ? (
          <table className="mb-5 w-full border-collapse text-left">
            <thead>
              <tr className="border-b text-[11px] uppercase text-muted-foreground">
                <th className="py-1.5">Product</th>
                <th className="py-1.5">Size</th>
                <th className="py-1.5">Cases</th>
                <th className="py-1.5">FOB / btl</th>
                <th className="py-1.5">Line USD</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.sku} className="border-b border-border/60">
                  <td className="py-1.5">{l.product || l.sku}</td>
                  <td className="py-1.5">{l.size}</td>
                  <td className="py-1.5">{l.cases}</td>
                  <td className="py-1.5">{l.unitFobUsd != null ? `$${l.unitFobUsd}` : "—"}</td>
                  <td className="py-1.5">{l.lineTotalUsd != null ? `$${Number(l.lineTotalUsd).toLocaleString()}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        <p className="mb-4 font-medium">
          Subtotal ${Number(order.subtotalUsd ?? 0).toLocaleString()} · Deposit due $
          {Number(order.depositDueUsd ?? 0).toLocaleString()} · Balance ${Number(order.balanceDueUsd ?? 0).toLocaleString()}
        </p>

        {docCopy(doc, order)}

        {showWire(doc) ? <WireBlock /> : null}

        <ul className="mt-6 list-disc space-y-1 pl-5 text-[11px] text-muted-foreground">
          {EXPORT_BUYER_TERMS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p className="mt-4 text-[10px] text-muted-foreground">はじめ · Hajime Ltd. · Hong Kong Expo pack 2026</p>
      </article>
    </div>
  );
}

function showWire(doc: ExportDocType): boolean {
  return doc === "quotation" || doc === "proforma" || doc === "deposit" || doc === "shipment_release";
}

function WireBlock() {
  const b = EXPORT_SELLER.bank;
  return (
    <section className="mt-5 border border-border bg-white/60 p-4 text-[12px]">
      <h2 className="text-[11px] uppercase tracking-wide text-muted-foreground">Wire instructions (USD)</h2>
      <p className="mt-1 font-medium">{b.accountName}</p>
      <p>
        {b.bankName} · {b.location}
      </p>
      <p>Account {b.accountNumber}</p>
      <p>
        Bank code {b.bankCode} · Branch {b.branchCode}
      </p>
      <p>SWIFT {b.swift}</p>
      <p className="mt-2 text-muted-foreground">{EXPORT_SELLER.wireFees}.</p>
    </section>
  );
}

function docRef(order: ExportOrderDto, doc: ExportDocType): string {
  if (doc === "quotation") return String(order.quoteNo || "");
  if (doc === "proforma") return String(order.piNo || "");
  if (doc === "deposit") return String(order.depositNo || "");
  if (doc === "production_auth") return String(order.paNo || "");
  if (doc === "shipment_release") return String(order.releaseNo || "");
  return "";
}

function docCopy(doc: ExportDocType, order: ExportOrderDto) {
  if (doc === "quotation") {
    return (
      <p>
        This quotation is issued by Hajime Ltd. for the territory named above. Volume bands apply to 750 ml cases. 200 ml
        is quoted at list and is not 1:1 with 750 ml tiers. Valid {String(order.quoteValidUntil || "as stated on issue")}.
      </p>
    );
  }
  if (doc === "po_acceptance") {
    return (
      <p>
        Hajime Ltd. accepts the buyer purchase order {String(order.buyerPoNo || "(number to follow)")} against the quoted
        SKUs and FOB amounts. This acceptance does not modify Incoterms or payment until named FOB point and deposit are
        confirmed.
      </p>
    );
  }
  if (doc === "proforma") {
    return (
      <p>
        Pro forma invoice for deposit of 50% ({EXPORT_SELLER.paymentSummary}). Wire so Hajime Ltd. receives the full
        invoiced amount. Goods remain Hajime Ltd. property until final payment.
      </p>
    );
  }
  if (doc === "deposit") {
    return (
      <p>
        Deposit status: {String(order.depositStatus)}. Received {String(order.depositReceivedUsd ?? "—")} USD. Production
        is not authorized until the deposit is cleared in full (or a written exception).
      </p>
    );
  }
  if (doc === "production_auth") {
    return (
      <p>
        Internal instruction to the manufacturer. Slot {String(order.productionSlot || "TBD")}. Requested completion{" "}
        {String(order.requestedCompletion || "TBD")}. Not for the buyer.
      </p>
    );
  }
  if (doc === "shipment_release") {
    return (
      <p>
        Final balance status: {String(order.balanceStatus)}. FOB named point: {String(order.fobNamedPoint || "not confirmed")}.
        Release is valid only when balance is cleared, the export checklist is cleared, and the named point is set.
      </p>
    );
  }
  if (doc === "export_checklist") {
    return (
      <p>
        Operational control list for this file. Destination import permits remain with the buyer/importer. Thailand
        exporter-of-record remains to be confirmed.
      </p>
    );
  }
  return null;
}
