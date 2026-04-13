import type { NewProductRequest } from "@/data/mockData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";
import { Package, DollarSign, Calendar, Factory, CheckCircle, XCircle, FilePlus } from "lucide-react";
import { usePurchaseOrders } from "@/contexts/AppDataContext";
import { NewPurchaseOrderDialog } from "./NewPurchaseOrderDialog";
import { useState } from "react";
import { nextPoId } from "@/lib/po-ids";
import type { PurchaseOrder } from "@/data/mockData";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  under_review: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  proposed: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  declined: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  proposed: "Proposal Received",
  approved: "Approved",
  rejected: "Rejected",
  declined: "Declined",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: NewProductRequest | null;
  onPatch: (id: string, patch: Partial<NewProductRequest>) => void;
};

export function ProductRequestDetailDialog({ open, onOpenChange, request, onPatch }: Props) {
  if (!request) return null;

  const { addPurchaseOrder, purchaseOrders } = usePurchaseOrders();
  const [poDialogOpen, setPoDialogOpen] = useState(false);

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
      description: `${request.id} approved. Create a production PO to begin manufacturing.`,
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

  const handleCreatePo = (po: PurchaseOrder) => {
    addPurchaseOrder(po);
    onPatch(request.id, { productionPoId: po.id });
    toast.success("Production PO created", { description: `${po.id} linked to ${request.id}` });
    setPoDialogOpen(false);
  };

  const proposalQty = request.manufacturerProposal?.production.batchSize ?? request.specs.minimumOrderQuantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,900px)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle>{request.title}</DialogTitle>
              <DialogDescription>
                {request.id} · Assigned to {request.assignedManufacturer || "Unassigned"}
              </DialogDescription>
            </div>
            <Badge className={`text-xs ${STATUS_STYLES[request.status]}`}>
              {STATUS_LABELS[request.status]}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Specifications */}
          <div className="space-y-3">
            <h4 className="font-display text-sm font-medium">Specifications</h4>
            <div className="grid gap-3 rounded-lg border p-3 text-sm sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground">Base Spirit</span>
                <p className="font-medium capitalize">{request.specs.baseSpirit.replace(/_/g, " ")}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Target ABV</span>
                <p className="font-medium">{request.specs.targetAbv}%</p>
              </div>
              <div>
                <span className="text-muted-foreground">Flavor Profile</span>
                <p className="font-medium">{request.specs.flavorProfile.join(", ") || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Sweetener</span>
                <p className="font-medium capitalize">{request.specs.sweetener?.replace(/_/g, " ") || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Price Point</span>
                <p className="font-medium capitalize">{request.specs.targetPricePoint.replace(/_/g, " ")}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Target Launch</span>
                <p className="font-medium">{request.specs.targetLaunchDate}</p>
              </div>
              <div className="sm:col-span-2">
                <span className="text-muted-foreground">Regulatory Markets</span>
                <p className="font-medium">{request.specs.regulatoryMarkets.join(", ")}</p>
              </div>
              <div className="sm:col-span-2">
                <span className="text-muted-foreground">Packaging</span>
                <p className="font-medium">
                  {request.specs.packaging.bottleSize} · {request.specs.packaging.caseConfiguration}-bottle case ·{" "}
                  {request.specs.packaging.labelStyle}
                </p>
              </div>
              <div className="sm:col-span-2">
                <span className="text-muted-foreground">Minimum Order</span>
                <p className="font-medium">{request.specs.minimumOrderQuantity.toLocaleString()} bottles</p>
              </div>
              {request.notes ? (
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground">Notes</span>
                  <p className="font-medium">{request.notes}</p>
                </div>
              ) : null}
            </div>
          </div>

          <Separator />

          {/* Manufacturer Proposal */}
          {hasProposal ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Factory className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-display text-sm font-medium">Manufacturer Proposal</h4>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/20">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-300">
                  <CheckCircle className="h-4 w-4" />
                  {request.manufacturerProposal?.feasible ? "Feasible — can produce" : "Not feasible"}
                </div>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">Batch Size</span>
                    <p className="font-medium">
                      {request.manufacturerProposal?.production.batchSize.toLocaleString()} bottles
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Min Batch</span>
                    <p className="font-medium">
                      {request.manufacturerProposal?.production.minimumBatchSize.toLocaleString()} bottles
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fermentation</span>
                    <p className="font-medium">{request.manufacturerProposal?.production.fermentationTime}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sample Available</span>
                    <p className="font-medium">{request.manufacturerProposal?.timeline.sampleAvailableDate}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Production Start</span>
                    <p className="font-medium">{request.manufacturerProposal?.timeline.productionStartDate}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">First Delivery</span>
                    <p className="font-medium">{request.manufacturerProposal?.timeline.firstDeliveryDate}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground">Costing</span>
                    <p className="font-medium">
                      Production ${request.manufacturerProposal?.costs.perBottleProduction.toFixed(2)} +
                      Packaging ${request.manufacturerProposal?.costs.perBottlePackaging.toFixed(2)} +
                      Labeling ${request.manufacturerProposal?.costs.perBottleLabeling.toFixed(2)} ={" "}
                      <strong>${request.manufacturerProposal?.costs.totalPerBottle.toFixed(2)}/bottle</strong>
                      {request.manufacturerProposal?.costs.setupFee ? (
                        <> · Setup fee ${request.manufacturerProposal.costs.setupFee.toLocaleString()}</>
                      ) : null}
                    </p>
                  </div>
                  {request.manufacturerProposal?.technicalNotes ? (
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground">Technical Notes</span>
                      <p className="font-medium">{request.manufacturerProposal.technicalNotes}</p>
                    </div>
                  ) : null}
                  {request.manufacturerProposal?.regulatoryNotes ? (
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground">Regulatory Notes</span>
                      <p className="font-medium">{request.manufacturerProposal.regulatoryNotes}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Factory className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-display text-sm font-medium">Manufacturer Proposal</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {request.status === "draft"
                  ? "Submit this request to send it to the manufacturer for review."
                  : request.status === "submitted" || request.status === "under_review"
                    ? `Awaiting proposal from ${request.assignedManufacturer}...`
                    : "No proposal was submitted for this request."}
              </p>
            </div>
          )}

          {/* Linked PO */}
          {request.productionPoId ? (
            <>
              <Separator />
              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                <Package className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">Production PO Created</p>
                  <p className="text-muted-foreground">
                    {request.productionPoId} · SKU will be generated on first shipment
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </div>

        <DialogFooter className="flex-col gap-2 pt-4 sm:flex-row sm:justify-end">
          {canSubmit ? (
            <Button className="touch-manipulation" onClick={handleSubmit}>
              Submit to Manufacturer
            </Button>
          ) : null}
          {canDecide ? (
            <>
              <Button variant="outline" className="touch-manipulation" onClick={handleReject}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button className="touch-manipulation" onClick={handleApprove}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </>
          ) : null}
          {canCreatePo ? (
            <Button className="touch-manipulation" onClick={() => setPoDialogOpen(true)}>
              <FilePlus className="mr-2 h-4 w-4" />
              Create Production PO
            </Button>
          ) : null}
          {!canSubmit && !canDecide && !canCreatePo ? (
            <Button type="button" variant="outline" className="touch-manipulation" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>

      <NewPurchaseOrderDialog
        open={poDialogOpen}
        onOpenChange={setPoDialogOpen}
        existing={purchaseOrders}
        onCreate={handleCreatePo}
        prefill={{ sku: undefined, quantity: String(proposalQty) }}
        variant="production"
      />
    </Dialog>
  );
}
