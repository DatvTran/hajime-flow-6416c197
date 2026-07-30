import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import type { PurchaseOrder } from "@/data/mockData";
import {
  DistributorFilterBar,
  DistributorFilterButton,
  DistributorPage,
  DistributorPageHeader,
} from "@/components/distributor/DistributorUi";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

type RequestFilter = "all" | "action" | "scheduled" | "queued";

type RequestTone = "red" | "amber" | "neutral";

/** Only requests HQ has actually issued reach the kura — drafts stay with HQ. */
function productionOrders(pos: PurchaseOrder[]): PurchaseOrder[] {
  return pos.filter(
    (p) =>
      p.poType !== "sales" &&
      p.status !== "draft" &&
      p.status !== "delivered",
  );
}

function casesEstimate(bottles: number): number {
  return Math.max(1, Math.round(bottles / 12));
}

/** A request has been accepted once it (or later) is in production. */
function isAccepted(po: PurchaseOrder): boolean {
  return (
    po.status === "in-production" ||
    po.status === "completed" ||
    po.status === "shipped"
  );
}

function requestTone(po: PurchaseOrder): RequestTone {
  if (po.status === "approved" || po.status === "delayed") return "red";
  if (isAccepted(po)) return "amber";
  return "neutral";
}

function requestFilterFor(po: PurchaseOrder): RequestFilter {
  if (po.status === "delayed") return "action";
  if (isAccepted(po)) return "scheduled";
  return "queued"; // issued by HQ, awaiting the kura to accept & schedule
}

function requestStatusLabel(po: PurchaseOrder, t: (s: string) => string): string {
  if (po.status === "approved") return t("to schedule");
  if (po.status === "delayed") return t("action needed");
  if (po.status === "in-production") return t("scheduled");
  if (po.status === "completed") return t("brewing complete");
  return t(po.status.replace(/-/g, " "));
}

function formatReceived(date: string): string {
  try {
    return new Date(date).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  } catch {
    return date;
  }
}

function formatStartBy(date: string): string {
  try {
    return `Start by ${new Date(date).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}`;
  } catch {
    return date;
  }
}

function polishLine(po: PurchaseOrder): string {
  const parts = [po.labelVersion, po.packagingInstructions].filter(Boolean);
  return parts.join(" · ") || "—";
}

function MfgRequestPill({ tone, label }: { tone: RequestTone; label: string }) {
  const styles = {
    red: "border-[hsl(0_68%_48%/0.2)] bg-[hsl(0_68%_48%/0.08)] text-[hsl(0_68%_38%)]",
    amber: "border-[hsl(38_90%_50%/0.25)] bg-[hsl(38_90%_50%/0.1)] text-[hsl(30_80%_30%)]",
    neutral: "border-border bg-muted text-muted-foreground",
  } as const;
  const dots = {
    red: "bg-[hsl(0_68%_48%)]",
    amber: "bg-[hsl(38_90%_50%)]",
    neutral: "bg-muted-foreground",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
        styles[tone],
      )}
    >
      <span className={cn("size-1.5 rounded-full", dots[tone])} />
      {label}
    </span>
  );
}

type ChangePanelProps = {
  po: PurchaseOrder;
  onCancel: () => void;
  onSend: (message: string) => void | Promise<void>;
};

function ManufacturerChangePanel({ po, onCancel, onSend }: ChangePanelProps) {
  const { t } = useLanguage();
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!message.trim()) {
      setError(true);
      return;
    }
    setSending(true);
    try {
      await onSend(message.trim());
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-4 rounded-[10px] border border-border/60 bg-muted/40 p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {t("Request change from HQ")}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("{{id}} · {{sku}}", { id: po.id, sku: po.sku })}
      </p>
      <textarea
        rows={3}
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          if (error && e.target.value.trim()) setError(false);
        }}
        placeholder={t("Describe timeline, spec, or volume changes Hajime should review…")}
        className={cn(
          "mt-3 w-full resize-none rounded-lg border bg-background px-3 py-2 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring",
          error && "border-destructive",
        )}
        disabled={sending}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="dist-btn dist-btn-outline dist-btn-sm" onClick={onCancel} disabled={sending}>
          {t("Cancel")}
        </button>
        <button type="button" className="dist-btn dist-btn-accent dist-btn-sm" onClick={() => void submit()} disabled={sending}>
          {sending ? t("Sending…") : t("Send to HQ")}
        </button>
      </div>
    </div>
  );
}

export type ManufacturerProductionRequestsViewProps = {
  purchaseOrders: PurchaseOrder[];
  onAcceptSchedule: (po: PurchaseOrder) => void | Promise<void>;
  onRequestChange: (po: PurchaseOrder, message: string) => void | Promise<void>;
  onViewSpec: (id: string) => void;
};

export function ManufacturerProductionRequestsView({
  purchaseOrders,
  onAcceptSchedule,
  onRequestChange,
  onViewSpec,
}: ManufacturerProductionRequestsViewProps) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<RequestFilter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [changeId, setChangeId] = useState<string | null>(null);

  const orders = useMemo(() => productionOrders(purchaseOrders), [purchaseOrders]);

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((po) => requestFilterFor(po) === filter);
  }, [filter, orders]);

  const counts = useMemo(
    () => ({
      all: orders.length,
      action: orders.filter((p) => requestFilterFor(p) === "action").length,
      scheduled: orders.filter((p) => requestFilterFor(p) === "scheduled").length,
      queued: orders.filter((p) => requestFilterFor(p) === "queued").length,
    }),
    [orders],
  );

  return (
    <DistributorPage className="space-y-5">
      <DistributorPageHeader
        title="Production requests"
        description="Orders from Hajime HQ to produce specific SKUs · accept and schedule against your brew calendar"
        actions={
          <button type="button" className="dist-btn dist-btn-outline dist-btn-sm">
            {t("Export")}
          </button>
        }
      />

      <DistributorFilterBar>
        {(
          [
            ["all", t("All ({{n}})", { n: counts.all })],
            ["queued", t("To schedule")],
            ["scheduled", t("Scheduled")],
            ["action", t("Needs attention")],
          ] as const
        ).map(([id, label]) => (
          <DistributorFilterButton key={id} active={filter === id} onClick={() => setFilter(id)}>
            {label}
          </DistributorFilterButton>
        ))}
      </DistributorFilterBar>

      {filtered.length === 0 ? (
        <div className="mfg-batch-card px-5 py-12 text-center text-sm text-muted-foreground">
          {t("No production requests in this view")}
        </div>
      ) : (
        filtered.map((po) => {
          const expanded = openId === po.id;
          const tone = requestTone(po);
          const cases = casesEstimate(po.quantity);
          const dueColor =
            tone === "red"
              ? "text-[hsl(0_68%_40%)]"
              : tone === "amber"
                ? "text-[hsl(30_80%_32%)]"
                : "text-muted-foreground";

          return (
            <div key={po.id} className="mfg-batch-card">
              <button
                type="button"
                className="mfg-batch-head w-full text-left"
                onClick={() => {
                  setOpenId(expanded ? null : po.id);
                  if (expanded) setChangeId(null);
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[11px] text-muted-foreground">
                    {po.id} · {t("received")} {formatReceived(po.issueDate)}
                  </div>
                  <div className="mt-0.5 font-display text-lg font-medium tracking-[-0.01em]">
                    {cases.toLocaleString()} {t("cases")} · {po.sku}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{polishLine(po)}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className={cn("text-[13px] font-semibold", dueColor)}>{formatStartBy(po.requiredDate)}</div>
                  <div className="mt-1 flex justify-end">
                    <MfgRequestPill tone={tone} label={requestStatusLabel(po, t)} />
                  </div>
                </div>
                <ChevronDown
                  className={cn("size-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")}
                  strokeWidth={1.75}
                />
              </button>

              {expanded ? (
                <div className="mfg-batch-detail open">
                  {po.notes?.trim() ? (
                    <div className="mb-4 rounded-[10px] bg-muted/40 px-3.5 py-3 text-[13px]">
                      <strong className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        {t("HQ notes")}
                      </strong>
                      <div className="mt-1.5 text-foreground">{po.notes}</div>
                    </div>
                  ) : null}

                  <div className="mb-4 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: t("Volume"), value: `${Math.round(cases * 9)} L est.` },
                      { label: t("Rice needed"), value: `${(cases * 0.012).toFixed(1)} t` },
                      { label: t("Brew time"), value: t("~30 days") },
                      { label: t("Tank"), value: t("To assign") },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-lg bg-muted/40 px-3 py-2.5">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                          {stat.label}
                        </div>
                        <div className="mt-0.5 font-display text-base font-semibold">{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  {changeId === po.id ? (
                    <ManufacturerChangePanel
                      po={po}
                      onCancel={() => setChangeId(null)}
                      onSend={async (message) => {
                        await onRequestChange(po, message);
                        setChangeId(null);
                      }}
                    />
                  ) : isAccepted(po) ? (
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/manufacturer/brew-batches?po=${encodeURIComponent(po.id)}`}
                        className="dist-btn dist-btn-accent dist-btn-sm no-underline"
                      >
                        {t("View on brew floor")}
                      </Link>
                      <button
                        type="button"
                        className="dist-btn dist-btn-outline dist-btn-sm"
                        onClick={() => onViewSpec(po.id)}
                      >
                        {t("View spec sheet")}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="dist-btn dist-btn-accent dist-btn-sm"
                        onClick={() => void onAcceptSchedule(po)}
                      >
                        {t("Accept & schedule batch")}
                      </button>
                      <button
                        type="button"
                        className="dist-btn dist-btn-outline dist-btn-sm"
                        onClick={() => setChangeId(po.id)}
                      >
                        {t("Request change")}
                      </button>
                      <button
                        type="button"
                        className="dist-btn dist-btn-outline dist-btn-sm"
                        onClick={() => onViewSpec(po.id)}
                      >
                        {t("View spec sheet")}
                      </button>
                      <Link to="/manufacturer/brew-batches" className="dist-btn dist-btn-outline dist-btn-sm no-underline">
                        {t("View brew floor")}
                      </Link>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </DistributorPage>
  );
}
