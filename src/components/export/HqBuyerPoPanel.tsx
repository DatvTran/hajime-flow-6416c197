import { useState } from "react";
import { Copy, Loader2, Mail } from "lucide-react";
import { HqBtnLink, HqOperatorPill } from "@/components/hq/HqOperatorUi";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { rotateBuyerPoLink, sendBuyerPo, type ExportOrderDto } from "@/lib/api-v1";
import { poaDate, type BuyerPoSummary } from "@/lib/po-acceptance-terms";

async function copy(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Signing link copied", { description: "Send it to the buyer's signatory." });
  } catch {
    window.prompt("Copy the signing link", url);
  }
}

function emailToast(email: { sent?: boolean; logged?: boolean; skipped?: boolean } | null | undefined, to: string) {
  if (email?.sent) toast.success("Purchase order emailed", { description: to });
  else if (email?.logged) toast.message("Email logged (no mail provider in this environment)");
  else toast.message("No email sent", { description: "Add a buyer email, or copy the link and send it yourself." });
}

export function HqBuyerPoPanel({ order, onOrder }: { order: ExportOrderDto; onOrder: (order: ExportOrderDto) => void }) {
  const bpo = (order.buyerPo as BuyerPoSummary | null | undefined) ?? null;
  const status = bpo?.status ?? "draft";
  const [busy, setBusy] = useState<"send" | "copy" | "email" | null>(null);
  const [freshUrl, setFreshUrl] = useState<string | null>(null);
  const stage = String(order.stage || "");
  const quoted = Boolean((order.issuedDocs as Record<string, unknown> | undefined)?.quotation);
  const canSend = stage === "02_quotation" && quoted;
  const recipient = String(order.buyerNoticeEmail || order.buyerEmail || "");

  if (stage === "01_lead" || (status === "draft" && stage !== "02_quotation")) return null;

  async function send() {
    if (status === "open" && !window.confirm("A purchase order is already out for signature. Send a new revision? The old link stops working.")) {
      return;
    }
    setBusy("send");
    try {
      const res = await sendBuyerPo(String(order.displayId));
      onOrder(res.data);
      setFreshUrl(res.url || null);
      emailToast(res.email, recipient);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send");
    } finally {
      setBusy(null);
    }
  }

  async function newLink(email: boolean) {
    setBusy(email ? "email" : "copy");
    try {
      const res = await rotateBuyerPoLink(String(order.displayId), email);
      onOrder(res.data);
      setFreshUrl(res.url);
      if (email) emailToast(res.email, recipient);
      else await copy(res.url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create a link");
    } finally {
      setBusy(null);
    }
  }

  const pill =
    status === "signed" ? (
      <HqOperatorPill tone="green">Signed by buyer</HqOperatorPill>
    ) : status === "open" ? (
      <HqOperatorPill tone="amber">Awaiting signature</HqOperatorPill>
    ) : status === "expired" ? (
      <HqOperatorPill tone="red">Link expired</HqOperatorPill>
    ) : (
      <HqOperatorPill tone="ink">Not sent</HqOperatorPill>
    );

  return (
    <div className="mt-6 space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg">Purchase order</h2>
            {pill}
          </div>
          <p className="text-[12px] text-muted-foreground">
            {bpo && status !== "draft"
              ? `${bpo.docNumber}${bpo.revision > 1 ? ` rev. ${bpo.revision}` : ""} · sent ${poaDate(bpo.issuedAt)}`
              : "For buyers without their own PO form. Generated from the quotation; the buyer signs from a secure link."}
          </p>
        </div>
        <HqBtnLink to={`/export-orders/${order.displayId}/docs/buyer_po`} variant="outline" size="sm">
          View / print
        </HqBtnLink>
      </div>

      {status === "signed" && bpo?.buyerSignature ? (
        <div className="rounded-lg border border-[hsl(142_35%_70%)] bg-[hsl(142_40%_97%)] px-4 py-3 text-[13px]">
          <p className="font-medium">
            {bpo.buyerSignature.name}, {bpo.buyerSignature.title} · {bpo.buyerSignature.details.legalName}
          </p>
          <p className="text-muted-foreground">
            Signed {poaDate(bpo.buyerSignature.signedAt)} · PO {bpo.buyerSignature.details.buyerPoRef || bpo.docNumber}
            {bpo.buyerSignature.details.priceInitials ? ` · Prices initialled ${bpo.buyerSignature.details.priceInitials}` : ""}. Issue
            the PO acceptance next.
          </p>
        </div>
      ) : status === "open" || status === "expired" ? (
        <div className="space-y-2 rounded-lg border border-border/70 px-4 py-3 text-[13px]">
          <p>
            {status === "open"
              ? `Sent to ${recipient || "the buyer"}. Link open until ${poaDate(bpo?.linkExpiresAt)}.`
              : `The link expired ${poaDate(bpo?.linkExpiresAt)}. Send a fresh one.`}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" disabled={busy !== null} onClick={() => void newLink(false)}>
              {busy === "copy" ? <Loader2 className="size-3.5 animate-spin" /> : <Copy className="size-3.5" />}
              Copy new link
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={busy !== null || !recipient} onClick={() => void newLink(true)}>
              {busy === "email" ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
              Resend email
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">Each new link replaces the previous one.</p>
        </div>
      ) : null}

      {freshUrl ? (
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
          <code className="min-w-0 flex-1 truncate text-[12px]">{freshUrl}</code>
          <Button type="button" size="sm" variant="ghost" onClick={() => void copy(freshUrl)}>
            <Copy className="size-3.5" /> Copy
          </Button>
        </div>
      ) : null}

      {status !== "signed" ? (
        <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
          <Button type="button" disabled={busy !== null || !canSend || !recipient} onClick={() => void send()}>
            {busy === "send" ? <Loader2 className="size-4 animate-spin" /> : null}
            {status === "draft" ? "Send PO for signature" : "Send new revision"}
          </Button>
          <p className="text-[12px] text-muted-foreground">
            {!quoted
              ? "Issue the quotation first."
              : !canSend
                ? "Available while the file is at the quotation stage."
                : !recipient
                  ? "Add the buyer email first."
                  : `Emails a secure signing link to ${recipient}. If the buyer sends their own PO instead, use Record buyer PO.`}
          </p>
        </div>
      ) : null}
    </div>
  );
}
