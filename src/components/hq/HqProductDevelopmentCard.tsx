import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Check, ChevronDown, FlaskConical } from "lucide-react";
import type { NewProductRequest } from "@/data/mockData";
import {
  HQ_NPR_STAGES,
  NPR_STAGE_COLORS,
  formatNprPerBottle,
  hqNprDisplayStatus,
  nprConceptBrief,
  nprConceptSummary,
  nprFeasibilitySummary,
  nprHqMovePending,
  nprIsClosed,
  nprIsUrgent,
  nprStageProgress,
  nprUpdatedLabel,
  nprWaitingOnManufacturer,
} from "@/lib/hq-product-development-display";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/components/ui/sonner";
import { NprPipelineStepper } from "@/components/hq/NprPipelineStepper";
import { HqBtn, HqOperatorApprovalCard, HqOperatorPill } from "@/components/hq/HqOperatorUi";

type Props = {
  request: NewProductRequest;
  defaultOpen?: boolean;
  onPatch: (
    id: string,
    patch: Partial<NewProductRequest>,
  ) => void | Promise<{ success?: boolean } | unknown>;
  onNudge?: (id: string) => void | Promise<{ success?: boolean } | unknown>;
};

export function HqProductDevelopmentCard({ request, defaultOpen, onPatch, onNudge }: Props) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [nudging, setNudging] = useState(false);
  const urgent = nprIsUrgent(request);
  const closed = nprIsClosed(request.status);
  const { index: stageIndex } = nprStageProgress(request.status);
  const stageLabel = hqNprDisplayStatus(request.status).label;
  const stageColor = closed ? "hsl(0 72% 46%)" : NPR_STAGE_COLORS[stageIndex];
  const hqMove = nprHqMovePending(request.status);
  const waitingOnMfr = nprWaitingOnManufacturer(request.status);
  const proposalQty =
    request.manufacturerProposal?.production.batchSize ?? request.specs.minimumOrderQuantity;

  const handleSubmit = async () => {
    if (!request.assignedManufacturer?.trim()) {
      toast.error(t("Manufacturer required"), {
        description: t("Assign a manufacturer before sending for feasibility review."),
      });
      return;
    }
    const result = await onPatch(request.id, {
      status: "submitted",
      submittedAt: new Date().toISOString(),
    });
    if (result && typeof result === "object" && "success" in result && !result.success) return;
    toast.success(t("Sent for feasibility review"), {
      description: `${request.id} ${t("sent to")} ${request.assignedManufacturer}`,
    });
  };

  const handleNudge = async () => {
    if (!onNudge) return;
    setNudging(true);
    try {
      await onNudge(request.id);
    } finally {
      setNudging(false);
    }
  };

  const handleApprove = async () => {
    const result = await onPatch(request.id, {
      status: "approved",
      decidedAt: new Date().toISOString(),
      brandDecision: {
        approved: true,
        approvedAt: new Date().toISOString(),
        approvedBy: "brand_operator",
      },
    });
    if (result && typeof result === "object" && "success" in result && !result.success) return;
    toast.success(t("Proposal approved for production"), {
      description: request.id,
    });
  };

  const handleRevision = async () => {
    if (!window.confirm(t("Send this proposal back to the manufacturer for revision?"))) return;
    const stamp = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const result = await onPatch(request.id, {
      status: "under_review",
      brandDecision: {
        approved: false,
        requestedChanges: `HQ requested revision ${stamp}.`,
      },
    });
    if (result && typeof result === "object" && "success" in result && !result.success) return;
    toast.info(t("Revision requested"), { description: request.id });
  };

  const handleArchive = async () => {
    if (!window.confirm(t("Archive this product concept?"))) return;
    const result = await onPatch(request.id, {
      status: "declined",
      decidedAt: new Date().toISOString(),
    });
    if (result && typeof result === "object" && "success" in result && !result.success) return;
    toast.info(t("Concept archived"), { description: request.id });
  };

  const handleCreatePo = () => {
    const params = new URLSearchParams();
    if (request.resultingSku) params.set("sku", request.resultingSku);
    params.set("qty", String(proposalQty));
    params.set("npr", request.id);
    navigate(`/production-requests/new?${params.toString()}`);
  };

  const header = (
    <>
      <div className="mr-1 flex size-[42px] shrink-0 items-center justify-center rounded-[10px] bg-[hsl(280_40%_50%/.1)] text-[hsl(280_40%_48%)]">
        <FlaskConical className="size-[19px]" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em]"
            style={{ background: `${stageColor}1f`, color: stageColor }}
          >
            {t(stageLabel)}
          </span>
          <span
            className={
              closed
                ? "rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                : hqMove
                  ? "rounded-full bg-[hsl(40_88%_42%/.14)] px-2 py-0.5 text-[10px] font-semibold text-[hsl(40_88%_34%)]"
                  : waitingOnMfr
                    ? "rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                    : "rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
            }
          >
            {closed
              ? t(request.status === "rejected" ? "Closed" : "Archived")
              : hqMove
                ? t("Your move")
                : waitingOnMfr
                  ? t("Waiting on manufacturer")
                  : t("In progress")}
          </span>
          {urgent ? <HqOperatorPill tone="red">{t("priority")}</HqOperatorPill> : null}
        </div>
        <div className="font-display text-[17px] font-medium tracking-[-0.01em]">{request.title}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {request.id} · {nprConceptSummary(request)}
        </div>
      </div>
      <div className="mr-2 shrink-0 text-right">
        <div className="text-xs font-medium">{request.assignedManufacturer ?? "—"}</div>
        <div className="text-[10px] text-muted-foreground">
          {t("updated")} {nprUpdatedLabel(request)}
        </div>
        {request.manufacturerProposal ? (
          <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{formatNprPerBottle(request)}</div>
        ) : null}
      </div>
      <ChevronDown className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
    </>
  );

  const detail = (
    <>
      <NprPipelineStepper status={request.status} />
      <div className="mb-3.5 grid gap-4 sm:grid-cols-2">
        <div className="hq-detail-panel">
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {t("Concept brief")}
          </div>
          <div className="text-[13px] leading-relaxed text-foreground">{nprConceptBrief(request)}</div>
          <div className="mt-3 grid gap-2 border-t border-border/40 pt-3 text-[12px] text-muted-foreground sm:grid-cols-2">
            <div>
              <span className="font-medium text-foreground">{t("Target launch")}</span>
              <br />
              {request.specs.targetLaunchDate}
            </div>
            <div>
              <span className="font-medium text-foreground">{t("Min order")}</span>
              <br />
              {request.specs.minimumOrderQuantity.toLocaleString()} {t("bottles")}
            </div>
            <div>
              <span className="font-medium text-foreground">{t("Price point")}</span>
              <br />
              {request.specs.targetPricePoint.replace(/_/g, " ")}
            </div>
            <div>
              <span className="font-medium text-foreground">{t("Packaging")}</span>
              <br />
              {request.specs.packaging.bottleSize} · {request.specs.packaging.caseConfiguration}-pack
            </div>
          </div>
        </div>
        <div className="hq-detail-panel">
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {t("Manufacturer feasibility")}
          </div>
          <div
            className={`text-[13px] leading-relaxed ${nprFeasibilitySummary(request) ? "text-foreground" : "text-muted-foreground"}`}
          >
            {nprFeasibilitySummary(request) || t("Not yet sent for feasibility review.")}
          </div>
          {request.manufacturerProposal ? (
            <div className="mt-3 grid gap-2 border-t border-border/40 pt-3 text-[12px] text-muted-foreground sm:grid-cols-2">
              <div>
                <span className="font-medium text-foreground">{t("Batch size")}</span>
                <br />
                {request.manufacturerProposal.production.batchSize.toLocaleString()} {t("bottles")}
              </div>
              <div>
                <span className="font-medium text-foreground">{t("First delivery")}</span>
                <br />
                {request.manufacturerProposal.timeline.firstDeliveryDate}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {request.status === "draft" ? (
          <HqBtn variant="accent" size="sm" type="button" onClick={handleSubmit}>
            <FlaskConical className="size-3.5" strokeWidth={1.75} />
            {t("Send for feasibility review")}
          </HqBtn>
        ) : null}
        {waitingOnMfr ? (
          <HqBtn
            variant="outline"
            size="sm"
            type="button"
            disabled={nudging || !onNudge}
            onClick={handleNudge}
          >
            {nudging ? t("Sending…") : t("Nudge manufacturer")}
          </HqBtn>
        ) : null}
        {request.status === "proposed" ? (
          <>
            <HqBtn variant="green" size="sm" type="button" onClick={handleApprove}>
              <Check className="size-3.5" strokeWidth={1.75} />
              {t("Approve proposal for production")}
            </HqBtn>
            <HqBtn variant="outline" size="sm" type="button" onClick={handleRevision}>
              {t("Request revision")}
            </HqBtn>
          </>
        ) : null}
        {request.status === "approved" && !request.productionPoId ? (
          <HqBtn variant="green" size="sm" type="button" onClick={handleCreatePo}>
            <Check className="size-3.5" strokeWidth={1.75} />
            {t("Reorder production")}
          </HqBtn>
        ) : null}
        <HqBtn
          variant="outline"
          size="sm"
          type="button"
          onClick={() => navigate(`/product-development/${encodeURIComponent(request.id)}`)}
        >
          {t("View full brief")}
        </HqBtn>
        {!closed ? (
          <HqBtn variant="red" size="sm" type="button" className="ml-auto" onClick={handleArchive}>
            {t("Archive")}
          </HqBtn>
        ) : null}
      </div>
      {request.status === "approved" ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("Concept approved")} — {HQ_NPR_STAGES[3].toLowerCase()}.{" "}
          {request.productionPoId
            ? t("First production reorder linked.")
            : t("Next: reorder production for this SKU — set quantity and destination.")}
        </p>
      ) : null}
    </>
  );

  return (
    <HqOperatorApprovalCard urgent={urgent} defaultOpen={defaultOpen} header={header} detail={detail} />
  );
}
