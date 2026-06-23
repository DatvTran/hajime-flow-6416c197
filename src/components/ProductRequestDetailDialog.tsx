import { useNavigate } from "react-router-dom";
import type { NewProductRequest } from "@/data/mockData";
import { formatBaseSpiritLabel } from "@/lib/base-spirit-options";
import { hqNprDisplayStatus, kuraShortName } from "@/lib/hq-product-development-display";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { CheckCircle, Package, XCircle } from "lucide-react";
import {
  HqBtn,
  HqOperatorCardHead,
  HqOperatorPill,
  HqOperatorSrcChip,
} from "@/components/hq/HqOperatorUi";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: NewProductRequest | null;
  onPatch: (id: string, patch: Partial<NewProductRequest>) => void;
};

function DetailCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="hq-detail-label">{label}</div>
      <div className="text-[13px] font-medium text-foreground">{value}</div>
    </div>
  );
}

export function ProductRequestDetailDialog({ open, onOpenChange, request, onPatch }: Props) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (!request) return null;

  const proposalQty = request.manufacturerProposal?.production.batchSize ?? request.specs.minimumOrderQuantity;

  const pill = hqNprDisplayStatus(request.status);
  const canSubmit = request.status === "draft";
  const canDecide = request.status === "proposed";
  const hasProposal = !!request.manufacturerProposal;
  const canCreatePo = request.status === "approved" && !request.productionPoId;

  const handleSubmit = () => {
    onPatch(request.id, {
      status: "submitted",
      submittedAt: new Date().toISOString(),
    });
    toast.success("Request submitted", { description: `${request.id} sent to ${request.assignedManufacturer}` });
  };

  const handleApprove = () => {
    onPatch(request.id, {
      status: "approved",
      decidedAt: new Date().toISOString(),
      brandDecision: {
        approved: true,
        approvedAt: new Date().toISOString(),
        approvedBy: "brand_operator",
      },
    });
    toast.success("Proposal approved", {
      description: `${request.id} approved — SKU will be added to the shared product catalog.`,
    });
  };

  const handleReject = () => {
    onPatch(request.id, {
      status: "rejected",
      decidedAt: new Date().toISOString(),
      brandDecision: {
        approved: false,
        approvedAt: new Date().toISOString(),
        approvedBy: "brand_operator",
        rejectionReason: "Does not meet current product strategy.",
      },
    });
    toast.info("Proposal rejected", { description: `${request.id} rejected.` });
  };

  const handleCreatePoNavigate = () => {
    if (!request) return;
    const params = new URLSearchParams();
    if (request.resultingSku) params.set("sku", request.resultingSku);
    params.set("qty", String(proposalQty));
    params.set("npr", request.id);
    onOpenChange(false);
    navigate(`/purchase-orders/new?${params.toString()}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,900px)] gap-0 overflow-y-auto border-border/80 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border/60 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="font-display text-xl font-semibold tracking-[-0.02em]">
                {request.title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-[13px]">
                <span className="font-mono">{request.id}</span>
                {request.assignedManufacturer ? (
                  <>
                    {" "}
                    ·{" "}
                    <HqOperatorSrcChip variant="kura">{kuraShortName(request.assignedManufacturer)}</HqOperatorSrcChip>
                  </>
                ) : null}
              </DialogDescription>
            </div>
            <HqOperatorPill tone={pill.tone}>{t(pill.label)}</HqOperatorPill>
          </div>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          <section>
            <HqOperatorCardHead title="Specifications" subtitle="Brief sent to the manufacturer" />
            <div className="hq-detail-panel grid gap-4 sm:grid-cols-2">
              <DetailCell label="Base spirit" value={formatBaseSpiritLabel(request.specs.baseSpirit)} />
              <DetailCell label="Target ABV" value={`${request.specs.targetAbv}%`} />
              <DetailCell
                label="Flavor profile"
                value={request.specs.flavorProfile.join(", ") || "—"}
              />
              <DetailCell
                label="Sweetener"
                value={request.specs.sweetener?.replace(/_/g, " ") ?? "—"}
              />
              <DetailCell
                label="Price point"
                value={request.specs.targetPricePoint.replace(/_/g, " ")}
              />
              <DetailCell label="Target launch" value={request.specs.targetLaunchDate} />
              <div className="sm:col-span-2">
                <DetailCell label="Regulatory markets" value={request.specs.regulatoryMarkets.join(", ")} />
              </div>
              <div className="sm:col-span-2">
                <DetailCell
                  label="Packaging"
                  value={`${request.specs.packaging.bottleSize} · ${request.specs.packaging.caseConfiguration}-bottle case · ${request.specs.packaging.labelStyle || "—"}`}
                />
              </div>
              <DetailCell
                label="Minimum order"
                value={`${request.specs.minimumOrderQuantity.toLocaleString()} bottles`}
              />
              {request.notes ? (
                <div className="sm:col-span-2">
                  <DetailCell label="Notes" value={request.notes} />
                </div>
              ) : null}
            </div>
          </section>

          <section>
            <div className="hq-sec-head mb-3.5">
              <div className="hq-sec-title font-display text-[19px] font-medium tracking-[-0.01em]">
                {t("Manufacturer proposal")}
              </div>
            </div>
            {hasProposal ? (
              <div className="hq-detail-panel border-[hsl(158_56%_36%/0.25)] bg-[hsl(158_56%_36%/0.06)]">
                <div className="mb-3 flex items-center gap-2 text-[13px] font-medium text-[hsl(158_56%_32%)]">
                  <CheckCircle className="size-4" strokeWidth={1.75} />
                  {request.manufacturerProposal?.feasible ? "Feasible — can produce" : "Not feasible"}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailCell
                    label="Batch size"
                    value={`${request.manufacturerProposal?.production.batchSize.toLocaleString()} bottles`}
                  />
                  <DetailCell
                    label="Min batch"
                    value={`${request.manufacturerProposal?.production.minimumBatchSize.toLocaleString()} bottles`}
                  />
                  <DetailCell label="Fermentation" value={request.manufacturerProposal?.production.fermentationTime} />
                  <DetailCell
                    label="Sample available"
                    value={request.manufacturerProposal?.timeline.sampleAvailableDate}
                  />
                  <DetailCell
                    label="Production start"
                    value={request.manufacturerProposal?.timeline.productionStartDate}
                  />
                  <DetailCell
                    label="First delivery"
                    value={request.manufacturerProposal?.timeline.firstDeliveryDate}
                  />
                  <div className="sm:col-span-2">
                    <DetailCell
                      label="Costing"
                      value={
                        <>
                          Production ${request.manufacturerProposal?.costs.perBottleProduction.toFixed(2)} + Packaging $
                          {request.manufacturerProposal?.costs.perBottlePackaging.toFixed(2)} + Labeling $
                          {request.manufacturerProposal?.costs.perBottleLabeling.toFixed(2)} ={" "}
                          <strong>${request.manufacturerProposal?.costs.totalPerBottle.toFixed(2)}/bottle</strong>
                          {request.manufacturerProposal?.costs.setupFee ? (
                            <> · Setup ${request.manufacturerProposal.costs.setupFee.toLocaleString()}</>
                          ) : null}
                        </>
                      }
                    />
                  </div>
                  {request.manufacturerProposal?.technicalNotes ? (
                    <div className="sm:col-span-2">
                      <DetailCell label="Technical notes" value={request.manufacturerProposal.technicalNotes} />
                    </div>
                  ) : null}
                  {request.manufacturerProposal?.regulatoryNotes ? (
                    <div className="sm:col-span-2">
                      <DetailCell label="Regulatory notes" value={request.manufacturerProposal.regulatoryNotes} />
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                {request.status === "draft"
                  ? "Submit this request to send it to the manufacturer for review."
                  : request.status === "submitted" || request.status === "under_review"
                    ? `Awaiting proposal from ${request.assignedManufacturer}…`
                    : request.requestedBy === "manufacturer"
                      ? `${request.assignedManufacturer} proposed this new SKU for your review.`
                      : "No proposal was submitted for this request."}
              </p>
            )}
          </section>

          {request.productionPoId ? (
            <div className="hq-detail-panel flex items-center gap-3">
              <Package className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
              <div className="text-[13px]">
                <p className="font-medium">Production PO created</p>
                <p className="text-muted-foreground">
                  {request.productionPoId} · SKU will be generated on first shipment
                </p>
              </div>
            </div>
          ) : request.status === "approved" && request.resultingSku ? (
            <div className="hq-detail-panel border-[hsl(158_56%_36%/0.25)] bg-[hsl(158_56%_36%/0.06)]">
              <div className="flex items-center gap-3">
                <CheckCircle className="size-5 shrink-0 text-[hsl(158_56%_32%)]" strokeWidth={1.75} />
                <div className="text-[13px]">
                  <p className="font-medium text-[hsl(158_56%_32%)]">Product approved</p>
                  <p className="text-muted-foreground">
                    SKU {request.resultingSku} created. Create a production PO to begin manufacturing.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="hq-appr-actions flex-col gap-2 border-t border-border/60 px-6 py-4 sm:flex-row sm:justify-end">
          {canSubmit ? (
            <HqBtn variant="accent" size="sm" type="button" onClick={handleSubmit}>
              Submit to manufacturer
            </HqBtn>
          ) : null}
          {canDecide ? (
            <>
              <HqBtn variant="outline" size="sm" type="button" onClick={handleReject}>
                <XCircle className="size-3.5" strokeWidth={1.75} />
                Reject
              </HqBtn>
              <HqBtn variant="green" size="sm" type="button" onClick={handleApprove}>
                <CheckCircle className="size-3.5" strokeWidth={1.75} />
                Approve
              </HqBtn>
            </>
          ) : null}
          {canCreatePo ? (
            <HqBtn variant="accent" size="sm" type="button" onClick={handleCreatePoNavigate}>
              Create production PO
            </HqBtn>
          ) : null}
          {!canSubmit && !canDecide && !canCreatePo ? (
            <HqBtn variant="outline" size="sm" type="button" onClick={() => onOpenChange(false)}>
              Close
            </HqBtn>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
