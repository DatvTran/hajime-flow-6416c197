import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, CheckCircle, Package, X, XCircle } from "lucide-react";
import type { NewProductRequest } from "@/data/mockData";
import { formatBaseSpiritLabel } from "@/lib/base-spirit-options";
import {
  formatNprPerBottle,
  hqNprDisplayStatus,
  HQ_NPR_STAGES,
  kuraShortName,
  nprStageProgress,
} from "@/lib/hq-product-development-display";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/components/ui/sonner";
import {
  HqBtn,
  HqBtnLink,
  HqOperatorCard,
  HqOperatorPage,
  HqOperatorPill,
  HqOperatorSrcChip,
} from "@/components/hq/HqOperatorUi";

type Props = {
  request: NewProductRequest;
  onPatch: (id: string, patch: Partial<NewProductRequest>) => void | Promise<unknown>;
};

function DetailCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="hq-detail-label">{label}</div>
      <div className="text-[13px] font-medium text-foreground">{value}</div>
    </div>
  );
}

function NprStageStepper({ status }: { status: NewProductRequest["status"] }) {
  const { t } = useLanguage();
  const { index: activeIndex, failed } = nprStageProgress(status);

  return (
    <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
      {HQ_NPR_STAGES.map((stage, i) => {
        const isComplete = i < activeIndex || (i === activeIndex && !failed && status === "approved");
        const isCurrent = i === activeIndex;
        const isFailed = isCurrent && failed;

        const dotClass = isFailed
          ? "border-[hsl(0_72%_51%/0.4)] bg-[hsl(0_72%_51%/0.1)] text-[hsl(0_72%_45%)]"
          : isComplete
            ? "border-[hsl(158_56%_36%/0.4)] bg-[hsl(158_56%_36%/0.12)] text-[hsl(158_56%_32%)]"
            : isCurrent
              ? "border-accent/50 bg-accent/10 text-accent"
              : "border-border bg-muted/40 text-muted-foreground";

        const labelClass = isFailed
          ? "text-[hsl(0_72%_45%)]"
          : isComplete || isCurrent
            ? "text-foreground"
            : "text-muted-foreground";

        return (
          <li key={stage} className="flex items-center gap-1.5">
            <div className="flex items-center gap-2">
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold tabular-nums ${dotClass}`}
              >
                {isFailed ? (
                  <X className="size-3" strokeWidth={2.5} />
                ) : isComplete ? (
                  <Check className="size-3" strokeWidth={2.5} />
                ) : (
                  i + 1
                )}
              </span>
              <span className={`text-[12px] font-medium ${labelClass}`}>{t(stage)}</span>
            </div>
            {i < HQ_NPR_STAGES.length - 1 ? (
              <span
                className={`mx-1 h-px w-5 ${i < activeIndex ? "bg-[hsl(158_56%_36%/0.4)]" : "bg-border"}`}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export function HqProductRequestDetailView({ request, onPatch }: Props) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const proposalQty = request.manufacturerProposal?.production.batchSize ?? request.specs.minimumOrderQuantity;
  const pill = hqNprDisplayStatus(request.status);
  const canSubmit = request.status === "draft";
  const canDecide = request.status === "proposed";
  const hasProposal = !!request.manufacturerProposal;
  const canCreatePo = request.status === "approved" && !request.productionPoId;

  const handleSubmit = () => {
    void onPatch(request.id, {
      status: "submitted",
      submittedAt: new Date().toISOString(),
    });
    toast.success(t("Sent for feasibility review"), {
      description: `${request.id} ${t("sent to")} ${request.assignedManufacturer}`,
    });
  };

  const handleApprove = () => {
    void onPatch(request.id, {
      status: "approved",
      decidedAt: new Date().toISOString(),
      brandDecision: {
        approved: true,
        approvedAt: new Date().toISOString(),
        approvedBy: "brand_operator",
      },
    });
    toast.success(t("Proposal approved"), {
      description: `${request.id} ${t("approved — SKU will be added to the shared product catalog.")}`,
    });
  };

  const handleReject = () => {
    void onPatch(request.id, {
      status: "rejected",
      decidedAt: new Date().toISOString(),
      brandDecision: {
        approved: false,
        approvedAt: new Date().toISOString(),
        approvedBy: "brand_operator",
        rejectionReason: "Does not meet current product strategy.",
      },
    });
    toast.info(t("Proposal rejected"), { description: `${request.id} ${t("rejected.")}` });
  };

  const handleCreatePoNavigate = () => {
    const params = new URLSearchParams();
    if (request.resultingSku) params.set("sku", request.resultingSku);
    params.set("qty", String(proposalQty));
    params.set("npr", request.id);
    navigate(`/production-requests/new?${params.toString()}`);
  };

  const summaryRows = [
    { label: "Request ID", value: request.id },
    { label: "Manufacturer", value: request.assignedManufacturer || "—" },
    {
      label: "Spirit / ABV",
      value: `${formatBaseSpiritLabel(request.specs.baseSpirit)} · ${request.specs.targetAbv}%`,
    },
    { label: "Target launch", value: request.specs.targetLaunchDate },
    { label: "Proposed $/bottle", value: formatNprPerBottle(request) },
    {
      label: "Minimum order",
      value: `${request.specs.minimumOrderQuantity.toLocaleString()} ${t("bottles")}`,
    },
  ];

  return (
    <HqOperatorPage className="space-y-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <Link
          to="/product-development"
          className="hq-btn hq-btn-outline hq-btn-sm inline-flex items-center gap-1.5 no-underline"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.75} />
          {t("Product development")}
        </Link>
        <span className="font-mono text-xs text-muted-foreground">/ {request.id}</span>
      </div>

      <HqOperatorCard className="overflow-hidden p-0">
        <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-[22px] font-semibold tracking-[-0.02em]">{request.title}</h1>
              <HqOperatorPill tone={pill.tone}>{t(pill.label)}</HqOperatorPill>
            </div>
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
              <span className="font-mono">{request.id}</span>
              {request.assignedManufacturer ? (
                <>
                  <span>·</span>
                  <HqOperatorSrcChip variant="kura">
                    {kuraShortName(request.assignedManufacturer)}
                  </HqOperatorSrcChip>
                  <span>{request.assignedManufacturer}</span>
                </>
              ) : null}
            </p>
          </div>
        </div>
        <div className="border-t border-border/50 px-6 py-4">
          <NprStageStepper status={request.status} />
        </div>
      </HqOperatorCard>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <HqOperatorCard className="hq-settings-panel">
            <div className="hq-settings-title">{t("Product brief")}</div>
            <p className="mb-3 text-[12px] text-muted-foreground">
              {t("Brief sent to the manufacturer")}
            </p>
            <div className="hq-detail-panel grid gap-4 sm:grid-cols-2">
              <DetailCell label={t("Base spirit")} value={formatBaseSpiritLabel(request.specs.baseSpirit)} />
              <DetailCell label={t("Target ABV")} value={`${request.specs.targetAbv}%`} />
              <DetailCell
                label={t("Flavor profile")}
                value={request.specs.flavorProfile.join(", ") || "—"}
              />
              <DetailCell
                label={t("Sweetener")}
                value={request.specs.sweetener?.replace(/_/g, " ") ?? "—"}
              />
              <DetailCell
                label={t("Price point")}
                value={request.specs.targetPricePoint.replace(/_/g, " ")}
              />
              <DetailCell label={t("Target launch")} value={request.specs.targetLaunchDate} />
              <div className="sm:col-span-2">
                <DetailCell
                  label={t("Regulatory markets")}
                  value={request.specs.regulatoryMarkets.join(", ") || "—"}
                />
              </div>
              <div className="sm:col-span-2">
                <DetailCell
                  label={t("Packaging")}
                  value={`${request.specs.packaging.bottleSize} · ${request.specs.packaging.caseConfiguration}-bottle case · ${request.specs.packaging.labelStyle || "—"}`}
                />
              </div>
              <DetailCell
                label={t("Minimum order")}
                value={`${request.specs.minimumOrderQuantity.toLocaleString()} ${t("bottles")}`}
              />
              {request.notes ? (
                <div className="sm:col-span-2">
                  <DetailCell label={t("Notes")} value={request.notes} />
                </div>
              ) : null}
            </div>
          </HqOperatorCard>

          <HqOperatorCard className="hq-settings-panel">
            <div className="hq-settings-title">{t("Manufacturer proposal")}</div>
            {hasProposal ? (
              <div className="hq-detail-panel border-[hsl(158_56%_36%/0.25)] bg-[hsl(158_56%_36%/0.06)]">
                <div className="mb-3 flex items-center gap-2 text-[13px] font-medium text-[hsl(158_56%_32%)]">
                  <CheckCircle className="size-4" strokeWidth={1.75} />
                  {request.manufacturerProposal?.feasible
                    ? t("Feasible — can produce")
                    : t("Not feasible")}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailCell
                    label={t("Batch size")}
                    value={`${request.manufacturerProposal?.production.batchSize.toLocaleString()} ${t("bottles")}`}
                  />
                  <DetailCell
                    label={t("Min batch")}
                    value={`${request.manufacturerProposal?.production.minimumBatchSize.toLocaleString()} ${t("bottles")}`}
                  />
                  <DetailCell
                    label={t("Fermentation")}
                    value={request.manufacturerProposal?.production.fermentationTime}
                  />
                  <DetailCell
                    label={t("Sample available")}
                    value={request.manufacturerProposal?.timeline.sampleAvailableDate}
                  />
                  <DetailCell
                    label={t("Production start")}
                    value={request.manufacturerProposal?.timeline.productionStartDate}
                  />
                  <DetailCell
                    label={t("First delivery")}
                    value={request.manufacturerProposal?.timeline.firstDeliveryDate}
                  />
                  <div className="sm:col-span-2">
                    <DetailCell
                      label={t("Costing")}
                      value={
                        <>
                          {t("Production")} ${request.manufacturerProposal?.costs.perBottleProduction.toFixed(2)} +{" "}
                          {t("Packaging")} ${request.manufacturerProposal?.costs.perBottlePackaging.toFixed(2)} +{" "}
                          {t("Labeling")} ${request.manufacturerProposal?.costs.perBottleLabeling.toFixed(2)} ={" "}
                          <strong>${request.manufacturerProposal?.costs.totalPerBottle.toFixed(2)}/bottle</strong>
                          {request.manufacturerProposal?.costs.setupFee ? (
                            <> · {t("Setup")} ${request.manufacturerProposal.costs.setupFee.toLocaleString()}</>
                          ) : null}
                        </>
                      }
                    />
                  </div>
                  {request.manufacturerProposal?.technicalNotes ? (
                    <div className="sm:col-span-2">
                      <DetailCell
                        label={t("Technical notes")}
                        value={request.manufacturerProposal.technicalNotes}
                      />
                    </div>
                  ) : null}
                  {request.manufacturerProposal?.regulatoryNotes ? (
                    <div className="sm:col-span-2">
                      <DetailCell
                        label={t("Regulatory notes")}
                        value={request.manufacturerProposal.regulatoryNotes}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                {request.status === "draft"
                  ? t("Send this concept for feasibility review by the manufacturer.")
                  : request.status === "submitted" || request.status === "under_review"
                    ? `${t("In feasibility review with")} ${request.assignedManufacturer}…`
                    : request.requestedBy === "manufacturer"
                      ? `${request.assignedManufacturer} ${t("proposed this new SKU for your review.")}`
                      : t("No proposal was submitted for this request.")}
              </p>
            )}
          </HqOperatorCard>

          {request.productionPoId ? (
            <HqOperatorCard className="hq-settings-panel">
              <div className="flex items-center gap-3">
                <Package className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                <div className="text-[13px]">
                  <p className="font-medium">{t("Production PO created")}</p>
                  <p className="text-muted-foreground">
                    {request.productionPoId} · {t("SKU will be generated on first shipment")}
                  </p>
                </div>
              </div>
            </HqOperatorCard>
          ) : request.status === "approved" && request.resultingSku ? (
            <HqOperatorCard className="hq-settings-panel border-[hsl(158_56%_36%/0.25)] bg-[hsl(158_56%_36%/0.06)]">
              <div className="flex items-center gap-3">
                <CheckCircle className="size-5 shrink-0 text-[hsl(158_56%_32%)]" strokeWidth={1.75} />
                <div className="text-[13px]">
                  <p className="font-medium text-[hsl(158_56%_32%)]">{t("Product approved")}</p>
                  <p className="text-muted-foreground">
                    {t("SKU")} {request.resultingSku} {t("created. Reorder production to brew inventory to a destination.")}
                  </p>
                </div>
              </div>
            </HqOperatorCard>
          ) : null}
        </div>

        <div className="flex flex-col gap-3.5">
          <HqOperatorCard className="sticky top-5 p-5">
            <div className="mb-3.5 border-b border-border/50 pb-3 text-sm font-semibold">
              {t("Request summary")}
            </div>
            <div className="space-y-0">
              {summaryRows.map((row, i) => (
                <div
                  key={row.label}
                  className="flex justify-between gap-3 py-1.5 text-[13px]"
                  style={
                    i < summaryRows.length - 1
                      ? { borderBottom: "1px solid hsl(var(--border) / 0.3)" }
                      : undefined
                  }
                >
                  <span className="text-muted-foreground">{t(row.label)}</span>
                  <span className="max-w-[58%] truncate text-right font-medium">{row.value}</span>
                </div>
              ))}
            </div>

            {canSubmit ? (
              <HqBtn variant="accent" className="mt-4 h-[42px] w-full" type="button" onClick={handleSubmit}>
                {t("Send for feasibility review")}
              </HqBtn>
            ) : null}
            {canDecide ? (
              <>
                <HqBtn variant="green" className="mt-4 h-[42px] w-full" type="button" onClick={handleApprove}>
                  <CheckCircle className="size-3.5" strokeWidth={1.75} />
                  {t("Approve proposal")}
                </HqBtn>
                <HqBtn variant="outline" className="mt-2 w-full justify-center" type="button" onClick={handleReject}>
                  <XCircle className="size-3.5" strokeWidth={1.75} />
                  {t("Reject")}
                </HqBtn>
              </>
            ) : null}
            {canCreatePo ? (
              <HqBtn variant="accent" className="mt-4 h-[42px] w-full" type="button" onClick={handleCreatePoNavigate}>
                {t("Reorder production")}
              </HqBtn>
            ) : null}
            <HqBtnLink to="/product-development" variant="outline" className="mt-2 w-full justify-center">
              {t("Back to list")}
            </HqBtnLink>
          </HqOperatorCard>

          {canDecide ? (
            <div className="rounded-[14px] border border-[hsl(280_40%_50%/0.2)] bg-[hsl(280_40%_50%/0.06)] p-4 text-xs leading-relaxed text-[hsl(280_30%_42%)]">
              <strong className="text-[hsl(280_40%_44%)]">{t("Next:")}</strong>{" "}
              {t(
                "approving adds the SKU to your catalog. Rejecting returns the brief to the manufacturer with your feedback.",
              )}
            </div>
          ) : null}
        </div>
      </div>
    </HqOperatorPage>
  );
}
