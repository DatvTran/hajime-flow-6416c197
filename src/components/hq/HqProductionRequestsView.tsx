import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import type { PurchaseOrder } from "@/data/mockData";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatHqCurrency } from "@/lib/hq-format";
import { cn } from "@/lib/utils";
import {
  HqBtn,
  HqBtnLink,
  HqOperatorApprovalCard,
  HqOperatorFilterBar,
  HqOperatorFilterButton,
  HqOperatorPage,
  HqOperatorPageHeader,
  HqOperatorPill,
  HqOperatorSrcChip,
} from "@/components/hq/HqOperatorUi";

export type ProductionChangeRequest = {
  changeType: string;
  respondBy: string;
  message: string;
};

type Props = {
  purchaseOrders: PurchaseOrder[];
  onSelect: (id: string) => void;
  onApprove: (po: PurchaseOrder) => void;
  onDecline: (po: PurchaseOrder) => void;
  onRequestChange: (po: PurchaseOrder, change: ProductionChangeRequest) => void | Promise<void>;
  canEdit: boolean;
};

type FilterId = "all" | "urgent" | "kuramoto" | "echigo";

const CHANGE_TYPES = [
  "Adjust quantity",
  "Revise spec / polish ratio",
  "Change lot assignment",
  "Shift timeline",
  "Other",
] as const;

function productionOrders(pos: PurchaseOrder[]): PurchaseOrder[] {
  return pos.filter((p) => p.poType !== "sales");
}

function isUrgent(po: PurchaseOrder): boolean {
  return po.status === "delayed" || po.status === "draft";
}

function kuraShortName(manufacturer: string): string {
  return manufacturer.split(" ")[0] || manufacturer;
}

function defaultRespondByDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

function ProductionRequestChangePanel({
  po,
  onCancel,
  onSend,
}: {
  po: PurchaseOrder;
  onCancel: () => void;
  onSend: (change: ProductionChangeRequest) => void | Promise<void>;
}) {
  const { t } = useLanguage();
  const [changeType, setChangeType] = useState<string>(CHANGE_TYPES[0]);
  const [respondBy, setRespondBy] = useState(defaultRespondByDate);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      setMessageError(true);
      return;
    }
    setSending(true);
    try {
      await onSend({ changeType, respondBy, message: message.trim() });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="hq-change-panel">
      <div className="hq-change-panel-title">
        {t("Request a change from")} {kuraShortName(po.manufacturer)}
      </div>
      <div className="hq-appr-form-grid">
        <div className="hq-appr-form-group">
          <label htmlFor={`prchg-type-${po.id}`}>{t("Change type")}</label>
          <select
            id={`prchg-type-${po.id}`}
            value={changeType}
            onChange={(e) => setChangeType(e.target.value)}
            disabled={sending}
          >
            {CHANGE_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(type)}
              </option>
            ))}
          </select>
        </div>
        <div className="hq-appr-form-group">
          <label htmlFor={`prchg-date-${po.id}`}>{t("Respond by")}</label>
          <input
            id={`prchg-date-${po.id}`}
            type="date"
            value={respondBy}
            onChange={(e) => setRespondBy(e.target.value)}
            disabled={sending}
          />
        </div>
      </div>
      <div className="hq-appr-form-group mb-3">
        <label htmlFor={`prchg-msg-${po.id}`}>{t("Message to kura")}</label>
        <textarea
          id={`prchg-msg-${po.id}`}
          rows={3}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (messageError && e.target.value.trim()) setMessageError(false);
          }}
          placeholder={t("Describe the change you need before approving…")}
          disabled={sending}
          className={cn(messageError && "hq-input-error")}
        />
      </div>
      <div className="hq-appr-actions-end">
        <HqBtn variant="outline" size="sm" type="button" onClick={onCancel} disabled={sending}>
          {t("Cancel")}
        </HqBtn>
        <HqBtn variant="accent" size="sm" type="button" onClick={() => void handleSend()} disabled={sending}>
          {sending ? t("Sending…") : t("Send request")}
        </HqBtn>
      </div>
    </div>
  );
}

export function HqProductionRequestsView({
  purchaseOrders,
  onSelect,
  onApprove,
  onDecline,
  onRequestChange,
  canEdit,
}: Props) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<FilterId>("all");
  const [changeOpenId, setChangeOpenId] = useState<string | null>(null);
  const [exitingIds, setExitingIds] = useState<Set<string>>(() => new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());

  const dismissCard = (id: string, after?: () => void) => {
    setExitingIds((prev) => new Set(prev).add(id));
    window.setTimeout(() => {
      setDismissedIds((prev) => new Set(prev).add(id));
      setExitingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      after?.();
    }, 250);
  };

  const toggleChangePanel = (poId: string) => {
    setChangeOpenId((cur) => (cur === poId ? null : poId));
  };

  const rows = useMemo(() => {
    const base = productionOrders(purchaseOrders).filter(
      (p) => p.status !== "delivered" && p.status !== "completed" && !dismissedIds.has(p.id),
    );
    if (filter === "urgent") return base.filter(isUrgent);
    if (filter === "kuramoto") return base.filter((p) => /kuramoto|kirin/i.test(p.manufacturer));
    if (filter === "echigo") return base.filter((p) => /echigo/i.test(p.manufacturer));
    return base;
  }, [purchaseOrders, filter, dismissedIds]);

  const counts = useMemo(() => {
    const base = productionOrders(purchaseOrders).filter(
      (p) => p.status !== "delivered" && p.status !== "completed" && !dismissedIds.has(p.id),
    );
    return {
      all: base.length,
      urgent: base.filter(isUrgent).length,
    };
  }, [purchaseOrders, dismissedIds]);

  return (
    <HqOperatorPage className="space-y-6">
      <HqOperatorPageHeader
        title="Production requests"
        description="Batch requests from kura partners — your sign-off confirms spec, lot, and allocation before they schedule production. Retail and rep orders are approved by distributors, not HQ."
        actions={
          <div className="flex flex-wrap gap-2">
            <HqBtn variant="outline" size="sm" type="button">
              {t("Request history")}
            </HqBtn>
            {canEdit ? (
              <HqBtnLink to="/purchase-orders/new" variant="accent" size="sm">
                + {t("New production request")}
              </HqBtnLink>
            ) : null}
          </div>
        }
      />

      <HqOperatorFilterBar>
        <HqOperatorFilterButton active={filter === "all"} onClick={() => setFilter("all")}>
          {t("All")} ({counts.all})
        </HqOperatorFilterButton>
        <HqOperatorFilterButton active={filter === "urgent"} onClick={() => setFilter("urgent")}>
          {t("Urgent")} ({counts.urgent})
        </HqOperatorFilterButton>
        <HqOperatorFilterButton active={filter === "kuramoto"} onClick={() => setFilter("kuramoto")}>
          Kuramoto
        </HqOperatorFilterButton>
        <HqOperatorFilterButton active={filter === "echigo"} onClick={() => setFilter("echigo")}>
          Echigo Kura
        </HqOperatorFilterButton>
      </HqOperatorFilterBar>

      {rows.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-border px-10 py-10 text-center text-muted-foreground">
          <Check className="mx-auto size-7 text-[hsl(158_56%_32%)]" strokeWidth={1.75} />
          <p className="mt-3 text-sm font-medium text-foreground">{t("All caught up")}</p>
          <p className="mt-1 text-[13px]">
            {t("No production requests pending. New batch requests from kura partners appear here.")}
          </p>
          {canEdit ? (
            <HqBtnLink to="/purchase-orders/new" variant="accent" size="sm" className="mt-4">
              {t("New production request")}
            </HqBtnLink>
          ) : null}
        </div>
      ) : (
        rows.map((po, i) => {
          const urgent = isUrgent(po);
          const batchValue = po.quantity * 38;
          const changeOpen = changeOpenId === po.id;

          return (
            <div key={po.id} className={cn("hq-approval-card-wrap", exitingIds.has(po.id) && "exiting")}>
              <HqOperatorApprovalCard
                urgent={urgent}
                defaultOpen={i === 0}
                header={
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <HqOperatorSrcChip variant="kura">{kuraShortName(po.manufacturer)}</HqOperatorSrcChip>
                        {urgent ? <HqOperatorPill tone="red">{t("urgent")}</HqOperatorPill> : null}
                      </div>
                      <div className="font-display text-[17px] font-medium tracking-[-0.01em]">{po.sku}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {po.id} · {po.marketDestination} · {t("received")} {po.issueDate}
                      </div>
                    </div>
                    <div className="mr-2 shrink-0 text-right">
                      <div className="font-display text-xl font-semibold">{formatHqCurrency(batchValue)}</div>
                      <div className="text-[10px] text-muted-foreground">{t("batch value")}</div>
                    </div>
                    {canEdit ? (
                      <div className="flex shrink-0 gap-2">
                        <HqBtn
                          variant="red"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(t("Decline this production request? The kura will be notified."))) {
                              dismissCard(po.id, () => onDecline(po));
                            }
                          }}
                        >
                          {t("Decline")}
                        </HqBtn>
                        <HqBtn
                          variant="green"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissCard(po.id, () => onApprove(po));
                          }}
                        >
                          {t("Approve")}
                        </HqBtn>
                      </div>
                    ) : null}
                  </>
                }
                detail={
                  <>
                    <div className="mb-3.5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="hq-detail-panel">
                        <div className="hq-detail-label">{t("Requested by")}</div>
                        <div className="text-[13px] font-medium">
                          {kuraShortName(po.manufacturer)} · {t("Tōji")}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{po.manufacturer}</div>
                      </div>
                      <div className="hq-detail-panel">
                        <div className="hq-detail-label">{t("On approval")}</div>
                        <div className="text-[13px] font-medium">{t("Kura schedules batch")}</div>
                        <div className="text-[11px] text-muted-foreground">{t("finished goods → distributors")}</div>
                      </div>
                    </div>
                    <div className="hq-detail-panel mb-3.5 text-[13px]">
                      <strong className="mb-0 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        {t("Context")}
                      </strong>
                      <div className="mt-1.5 text-foreground">
                        {po.notes || t("Standard production batch for network replenishment.")}
                      </div>
                    </div>
                    {canEdit ? (
                      <>
                        <div className="hq-appr-actions">
                          <HqBtn
                            variant="green"
                            size="sm"
                            type="button"
                            onClick={() => dismissCard(po.id, () => onApprove(po))}
                          >
                            <Check className="size-3.5" strokeWidth={2} />
                            {t("Approve & confirm spec")}
                          </HqBtn>
                          <HqBtn
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => toggleChangePanel(po.id)}
                          >
                            {t("Request change")}
                          </HqBtn>
                          <HqBtn
                            variant="red"
                            size="sm"
                            type="button"
                            className="ml-auto"
                            onClick={() => {
                              if (window.confirm(t("Decline this production request? The kura will be notified."))) {
                                dismissCard(po.id, () => onDecline(po));
                              }
                            }}
                          >
                            {t("Decline")}
                          </HqBtn>
                        </div>
                        {changeOpen ? (
                          <ProductionRequestChangePanel
                            po={po}
                            onCancel={() => setChangeOpenId(null)}
                            onSend={async (change) => {
                              await onRequestChange(po, change);
                              setChangeOpenId(null);
                              dismissCard(po.id);
                            }}
                          />
                        ) : null}
                      </>
                    ) : (
                      <div className="hq-appr-actions">
                        <HqBtn variant="outline" size="sm" onClick={() => onSelect(po.id)}>
                          {t("View details")}
                        </HqBtn>
                      </div>
                    )}
                  </>
                }
              />
            </div>
          );
        })
      )}
    </HqOperatorPage>
  );
}
