import { useState } from "react";
import { Copy, Loader2, Mail } from "lucide-react";
import { HqBtnLink, HqOperatorPill } from "@/components/hq/HqOperatorUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { postExportOrderAction, rotatePoaLink, type ExportOrderDto } from "@/lib/api-v1";
import { poaDate, type PoaSummary } from "@/lib/po-acceptance-terms";

const TITLE_KEY = "hajime.poa.sellerTitle";

function readTitle(): string {
  try {
    return localStorage.getItem(TITLE_KEY) || "";
  } catch {
    return "";
  }
}

function issueGaps(order: ExportOrderDto): string[] {
  const gaps: string[] = [];
  const lines = Array.isArray(order.lines) ? (order.lines as { cases?: number }[]) : [];
  if (!lines.some((l) => Number(l.cases) > 0)) gaps.push("order lines");
  if (!["FOB", "FCA"].includes(String(order.incotermRule || ""))) gaps.push("Incoterms rule");
  if (!String(order.fobNamedPoint || "").trim()) gaps.push("named port or place");
  if (!String(order.deliveryWindow || "").trim()) gaps.push("delivery window");
  if (!String(order.buyerNoticeEmail || order.buyerEmail || "").trim()) gaps.push("buyer email");
  return gaps;
}

async function copy(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Signing link copied", { description: "Send it to the buyer's signatory." });
  } catch {
    window.prompt("Copy the signing link", url);
  }
}

function emailToast(email: { sent?: boolean; logged?: boolean; skipped?: boolean } | null | undefined, to: string) {
  if (email?.sent) toast.success("Signing link emailed", { description: to });
  else if (email?.logged) toast.message("Email logged (no mail provider in this environment)");
  else toast.message("No email sent", { description: "Add a buyer email, or copy the link and send it yourself." });
}

function TextField({
  label,
  value,
  onSave,
  area,
  hint,
  disabled,
  type,
}: {
  label: string;
  value: unknown;
  onSave: (v: string) => void;
  area?: boolean;
  hint?: string;
  disabled?: boolean;
  type?: string;
}) {
  const Comp = area ? Textarea : Input;
  const v = value == null ? "" : String(value);
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Comp
        defaultValue={v}
        key={label + v}
        type={type}
        disabled={disabled}
        onBlur={(e) => {
          if (e.target.value !== v) onSave(e.target.value);
        }}
      />
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function HqPoAcceptancePanel({
  order,
  saving,
  save,
  onOrder,
}: {
  order: ExportOrderDto;
  saving: boolean;
  save: (patch: Record<string, unknown>) => Promise<void> | void;
  onOrder: (order: ExportOrderDto) => void;
}) {
  const poa = (order.poAcceptance as PoaSummary | null | undefined) ?? null;
  const status = poa?.status ?? "draft";
  const [title, setTitle] = useState(readTitle);
  const [busy, setBusy] = useState<"issue" | "copy" | "email" | null>(null);
  const [freshUrl, setFreshUrl] = useState<string | null>(null);
  const gaps = issueGaps(order);
  const canIssue = ["03_buyer_po", "04_po_acceptance"].includes(String(order.stage));
  const recipient = String(order.buyerNoticeEmail || order.buyerEmail || "");
  const frozen = Boolean(order.depositFrozen);

  async function issue() {
    const sellerTitle = title.trim();
    if (!sellerTitle) {
      toast.error("Enter your title to sign for Hajime Ltd.");
      return;
    }
    if (status === "signed" && !window.confirm("The buyer already countersigned. Issue a new revision they must sign again?")) {
      return;
    }
    try {
      localStorage.setItem(TITLE_KEY, sellerTitle);
    } catch {
      /* private mode */
    }
    setBusy("issue");
    try {
      const res = (await postExportOrderAction(String(order.displayId), "acceptance", { sellerTitle })) as {
        data: ExportOrderDto;
        url?: string | null;
        email?: { sent?: boolean; logged?: boolean; skipped?: boolean };
      };
      onOrder(res.data);
      setFreshUrl(res.url || null);
      emailToast(res.email, recipient);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not issue");
    } finally {
      setBusy(null);
    }
  }

  async function newLink(email: boolean) {
    setBusy(email ? "email" : "copy");
    try {
      const res = await rotatePoaLink(String(order.displayId), email);
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
      <HqOperatorPill tone="green">Countersigned</HqOperatorPill>
    ) : status === "open" ? (
      <HqOperatorPill tone="amber">Awaiting signature</HqOperatorPill>
    ) : status === "expired" ? (
      <HqOperatorPill tone="red">Link expired</HqOperatorPill>
    ) : (
      <HqOperatorPill tone="ink">Draft</HqOperatorPill>
    );

  return (
    <div className="mt-6 space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg">PO acceptance</h2>
            {pill}
          </div>
          <p className="text-[12px] text-muted-foreground">
            {poa && status !== "draft"
              ? `${poa.docNumber}${poa.revision > 1 ? ` rev. ${poa.revision}` : ""} · signed for Hajime Ltd. by ${poa.seller.signedName ?? "HQ"} on ${poaDate(poa.seller.signedAt)}`
              : "Fill the terms below, then issue. You sign for Hajime Ltd. on issue; the buyer countersigns from a secure link."}
          </p>
        </div>
        <HqBtnLink to={`/export-orders/${order.displayId}/docs/po_acceptance`} variant="outline" size="sm">
          View document
        </HqBtnLink>
      </div>

      {status === "signed" && poa?.buyerSignature ? (
        <div className="rounded-lg border border-[hsl(142_35%_70%)] bg-[hsl(142_40%_97%)] px-4 py-3 text-[13px]">
          <p className="font-medium">
            {poa.buyerSignature.name}, {poa.buyerSignature.title} · {poa.buyerSignature.details.legalName}
          </p>
          <p className="text-muted-foreground">
            Countersigned {poaDate(poa.buyerSignature.signedAt)}. The pro forma invoice is unlocked.
          </p>
        </div>
      ) : status === "open" || status === "expired" ? (
        <div className="space-y-2 rounded-lg border border-border/70 px-4 py-3 text-[13px]">
          <p>
            {status === "open"
              ? `Sent ${poaDate(poa?.issuedAt)} to ${recipient || "the buyer"}. Link open until ${poaDate(poa?.linkExpiresAt)}.`
              : `The link expired ${poaDate(poa?.linkExpiresAt)}. Send a fresh one.`}
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

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Buyer legal details</p>
          <TextField
            label="Legal name"
            value={order.buyerLegalName ?? ""}
            onSave={(v) => void save({ buyerLegalName: v })}
            hint={`Optional. The buyer confirms these when signing. Defaults to ${String(order.buyerCompany || "the company name")}.`}
          />
          <TextField label="Registration no." value={order.buyerRegistrationNo} onSave={(v) => void save({ buyerRegistrationNo: v })} />
          <TextField
            label="Registered address"
            value={order.buyerRegisteredAddress}
            onSave={(v) => void save({ buyerRegisteredAddress: v })}
            area
          />
          <TextField
            label="Notice email (signing link goes here)"
            type="email"
            value={order.buyerNoticeEmail}
            onSave={(v) => void save({ buyerNoticeEmail: v })}
            hint={order.buyerEmail ? `Leave blank to use ${String(order.buyerEmail)}.` : undefined}
          />
          <TextField label="Consignee" value={order.consignee} onSave={(v) => void save({ consignee: v })} />
        </div>
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Order terms</p>
          <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
            <div className="space-y-1">
              <Label>Incoterms</Label>
              <select
                className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={String(order.incotermRule || "")}
                disabled={saving}
                onChange={(e) => void save({ incotermRule: e.target.value || null })}
              >
                <option value="">Select</option>
                <option value="FOB">FOB</option>
                <option value="FCA">FCA</option>
              </select>
            </div>
            <TextField
              label="Exact port or place"
              value={order.fobNamedPoint}
              onSave={(v) => void save({ fobNamedPoint: v })}
            />
          </div>
          <TextField
            label="Delivery window / lead time"
            value={order.deliveryWindow}
            onSave={(v) => void save({ deliveryWindow: v })}
            hint="e.g. 8–10 weeks from cleared deposit"
          />
          <TextField label="Approved spec / label / handling ref." value={order.specLabelRef} onSave={(v) => void save({ specLabelRef: v })} />
          <TextField
            label="Required documents / special conditions"
            value={order.specialConditions}
            onSave={(v) => void save({ specialConditions: v })}
            area
          />
          <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-2">
            <TextField
              label="Other charges USD"
              type="number"
              value={order.otherChargesUsd ?? 0}
              disabled={frozen}
              onSave={(v) => void save({ otherChargesUsd: Number(v) || 0 })}
            />
            <TextField label="Charges note" value={order.otherChargesNote} onSave={(v) => void save({ otherChargesNote: v })} />
          </div>
          <p className="text-[12px] text-muted-foreground">
            Total ${Number(order.totalOrderUsd ?? order.subtotalUsd ?? 0).toLocaleString()} · Deposit $
            {Number(order.depositDueUsd ?? 0).toLocaleString()} · Balance ${Number(order.balanceDueUsd ?? 0).toLocaleString()}
            {frozen ? " · locked at pro forma" : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 border-t border-border/60 pt-4">
        <div className="space-y-1">
          <Label htmlFor="poa-seller-title">Your title (signs for Hajime Ltd.)</Label>
          <Input
            id="poa-seller-title"
            className="w-56"
            placeholder="e.g. Director"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <Button
          type="button"
          disabled={busy !== null || saving || gaps.length > 0 || !canIssue || !title.trim()}
          onClick={() => void issue()}
        >
          {busy === "issue" ? <Loader2 className="size-4 animate-spin" /> : null}
          {status === "draft" ? "Issue for countersignature" : "Issue new revision"}
        </Button>
        <p className="w-full text-[12px] text-muted-foreground">
          {!canIssue
            ? "Record the buyer PO first. Issuing is available at the buyer PO and PO acceptance stages."
            : gaps.length
              ? `Still needed: ${gaps.join(", ")}.`
              : `Issuing emails a secure signing link to ${recipient}.`}
        </p>
      </div>
    </div>
  );
}
