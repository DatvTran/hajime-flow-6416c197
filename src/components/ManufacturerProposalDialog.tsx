import { useEffect, useState } from "react";
import type { NewProductRequest, NewProductManufacturerProposal } from "@/data/mockData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { Separator } from "@/components/ui/separator";

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: NewProductRequest | null;
  onPatch: (id: string, patch: Partial<NewProductRequest>) => void;
};

export function ManufacturerProposalDialog({ open, onOpenChange, request, onPatch }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [feasible, setFeasible] = useState(true);
  const [canHitAbv, setCanHitAbv] = useState(true);
  const [proposedAbv, setProposedAbv] = useState("");
  const [equipmentRequired, setEquipmentRequired] = useState("Standard still, Fermentation tanks");
  const [fermentationTime, setFermentationTime] = useState("14 days");
  const [agingTime, setAgingTime] = useState("");
  const [batchSize, setBatchSize] = useState("2400");
  const [minimumBatchSize, setMinimumBatchSize] = useState("2400");
  const [capacityAvailable, setCapacityAvailable] = useState(true);
  const [perBottleProduction, setPerBottleProduction] = useState("8.50");
  const [perBottlePackaging, setPerBottlePackaging] = useState("2.20");
  const [perBottleLabeling, setPerBottleLabeling] = useState("0.80");
  const [setupFee, setSetupFee] = useState("5000");
  const [sampleAvailableDate, setSampleAvailableDate] = useState(addDaysISO(45));
  const [productionStartDate, setProductionStartDate] = useState(addDaysISO(60));
  const [firstDeliveryDate, setFirstDeliveryDate] = useState(addDaysISO(120));
  const [technicalNotes, setTechnicalNotes] = useState("");
  const [regulatoryNotes, setRegulatoryNotes] = useState("");
  const [sampleQuantity, setSampleQuantity] = useState("12");
  const [sampleShipDate, setSampleShipDate] = useState(addDaysISO(47));

  useEffect(() => {
    if (!open || !request) return;
    const p = request.manufacturerProposal;
    if (p) {
      setFeasible(p.feasible);
      setCanHitAbv(p.canHitAbv);
      setProposedAbv(p.proposedAbv?.toString() ?? "");
      setEquipmentRequired(p.production.equipmentRequired.join(", "));
      setFermentationTime(p.production.fermentationTime);
      setAgingTime(p.production.agingTime ?? "");
      setBatchSize(p.production.batchSize.toString());
      setMinimumBatchSize(p.production.minimumBatchSize.toString());
      setCapacityAvailable(p.production.capacityAvailable);
      setPerBottleProduction(p.costs.perBottleProduction.toString());
      setPerBottlePackaging(p.costs.perBottlePackaging.toString());
      setPerBottleLabeling(p.costs.perBottleLabeling.toString());
      setSetupFee(p.costs.setupFee?.toString() ?? "5000");
      setSampleAvailableDate(p.timeline.sampleAvailableDate);
      setProductionStartDate(p.timeline.productionStartDate);
      setFirstDeliveryDate(p.timeline.firstDeliveryDate);
      setTechnicalNotes(p.technicalNotes);
      setRegulatoryNotes(p.regulatoryNotes);
      setSampleQuantity(p.sampleQuantity.toString());
      setSampleShipDate(p.sampleShipDate);
    } else {
      setFeasible(true);
      setCanHitAbv(true);
      setProposedAbv("");
      setEquipmentRequired("Standard still, Fermentation tanks");
      setFermentationTime("14 days");
      setAgingTime("");
      setBatchSize(String(request.specs.minimumOrderQuantity));
      setMinimumBatchSize(String(request.specs.minimumOrderQuantity));
      setCapacityAvailable(true);
      setPerBottleProduction("8.50");
      setPerBottlePackaging("2.20");
      setPerBottleLabeling("0.80");
      setSetupFee("5000");
      setSampleAvailableDate(addDaysISO(45));
      setProductionStartDate(addDaysISO(60));
      setFirstDeliveryDate(addDaysISO(120));
      setTechnicalNotes("");
      setRegulatoryNotes("No issues for " + request.specs.regulatoryMarkets.join(" / ") + ".");
      setSampleQuantity("12");
      setSampleShipDate(addDaysISO(47));
    }
  }, [open, request]);

  if (!request) return null;

  const canRespond = request.status === "submitted" || request.status === "under_review";
  const isReadOnly = !canRespond;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const batch = Math.max(1, Math.round(Number(batchSize) || 0));
    const minBatch = Math.max(1, Math.round(Number(minimumBatchSize) || 0));
    const prod = Number(perBottleProduction) || 0;
    const pkg = Number(perBottlePackaging) || 0;
    const lbl = Number(perBottleLabeling) || 0;
    const setup = setupFee ? Number(setupFee) : undefined;
    const total = parseFloat((prod + pkg + lbl).toFixed(2));

    const proposal: NewProductManufacturerProposal = {
      feasible,
      canHitAbv,
      proposedAbv: proposedAbv ? Number(proposedAbv) : undefined,
      production: {
        equipmentRequired: equipmentRequired.split(",").map((s) => s.trim()).filter(Boolean),
        fermentationTime,
        agingTime: agingTime.trim() || undefined,
        batchSize: batch,
        minimumBatchSize: minBatch,
        capacityAvailable,
      },
      costs: {
        perBottleProduction: prod,
        perBottlePackaging: pkg,
        perBottleLabeling: lbl,
        setupFee,
        totalPerBottle: total,
      },
      timeline: {
        sampleAvailableDate,
        productionStartDate,
        firstDeliveryDate,
      },
      technicalNotes: technicalNotes.trim(),
      regulatoryNotes: regulatoryNotes.trim(),
      sampleQuantity: Math.max(1, Math.round(Number(sampleQuantity) || 1)),
      sampleShipDate,
    };

    setSubmitting(true);
    try {
      onPatch(request.id, {
        manufacturerProposal: proposal,
        status: "proposed",
        reviewStartedAt: request.reviewStartedAt || new Date().toISOString(),
        proposalReceivedAt: new Date().toISOString(),
      });
      toast.success("Proposal submitted", { description: `${request.id} sent back to Hajime HQ` });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = () => {
    onPatch(request.id, {
      status: "declined",
      reviewStartedAt: request.reviewStartedAt || new Date().toISOString(),
      manufacturerProposal: {
        feasible: false,
        canHitAbv: false,
        production: {
          equipmentRequired: [],
          fermentationTime: "—",
          batchSize: 0,
          minimumBatchSize: 0,
          capacityAvailable: false,
        },
        costs: {
          perBottleProduction: 0,
          perBottlePackaging: 0,
          perBottleLabeling: 0,
          totalPerBottle: 0,
        },
        timeline: {
          sampleAvailableDate: "—",
          productionStartDate: "—",
          firstDeliveryDate: "—",
        },
        technicalNotes: "Product not feasible per current capacity.",
        regulatoryNotes: "—",
        sampleQuantity: 0,
        sampleShipDate: "—",
      },
    });
    toast.info("Request declined", { description: `${request.id} has been declined.` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,900px)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{request.title}</DialogTitle>
          <DialogDescription>
            {request.id} · Target ABV {request.specs.targetAbv}% · Launch {request.specs.targetLaunchDate}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <h4 className="font-display text-sm font-medium">Feasibility</h4>
            <div className="grid gap-4 rounded-lg border p-3 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="prop-feasible" className="text-sm">Feasible?</Label>
                <Switch
                  id="prop-feasible"
                  checked={feasible}
                  onCheckedChange={setFeasible}
                  disabled={isReadOnly}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="prop-abv" className="text-sm">Can hit target ABV?</Label>
                <Switch
                  id="prop-abv"
                  checked={canHitAbv}
                  onCheckedChange={setCanHitAbv}
                  disabled={isReadOnly}
                />
              </div>
              {!canHitAbv ? (
                <div className="sm:col-span-2">
                  <Label htmlFor="prop-proposed-abv">Proposed ABV (%)</Label>
                  <Input
                    id="prop-proposed-abv"
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={proposedAbv}
                    onChange={(e) => setProposedAbv(e.target.value)}
                    disabled={isReadOnly}
                    className="touch-manipulation"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-display text-sm font-medium">Production</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="prop-equip">Equipment Required (comma separated)</Label>
                <Input
                  id="prop-equip"
                  value={equipmentRequired}
                  onChange={(e) => setEquipmentRequired(e.target.value)}
                  disabled={isReadOnly}
                  className="touch-manipulation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-ferm">Fermentation Time</Label>
                <Input
                  id="prop-ferm"
                  value={fermentationTime}
                  onChange={(e) => setFermentationTime(e.target.value)}
                  disabled={isReadOnly}
                  className="touch-manipulation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-aging">Aging Time</Label>
                <Input
                  id="prop-aging"
                  value={agingTime}
                  onChange={(e) => setAgingTime(e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Optional"
                  className="touch-manipulation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-cap">Capacity Available?</Label>
                <div className="flex h-10 items-center gap-3">
                  <Switch
                    id="prop-cap"
                    checked={capacityAvailable}
                    onCheckedChange={setCapacityAvailable}
                    disabled={isReadOnly}
                  />
                  <span className="text-sm">{capacityAvailable ? "Yes" : "No"}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-batch">Batch Size (bottles)</Label>
                <Input
                  id="prop-batch"
                  type="number"
                  min={1}
                  value={batchSize}
                  onChange={(e) => setBatchSize(e.target.value)}
                  disabled={isReadOnly}
                  className="touch-manipulation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-min">Minimum Batch (bottles)</Label>
                <Input
                  id="prop-min"
                  type="number"
                  min={1}
                  value={minimumBatchSize}
                  onChange={(e) => setMinimumBatchSize(e.target.value)}
                  disabled={isReadOnly}
                  className="touch-manipulation"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-display text-sm font-medium">Costing</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="prop-c-prod">Production Cost / Bottle (USD)</Label>
                <Input
                  id="prop-c-prod"
                  type="number"
                  min={0}
                  step={0.01}
                  value={perBottleProduction}
                  onChange={(e) => setPerBottleProduction(e.target.value)}
                  disabled={isReadOnly}
                  className="touch-manipulation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-c-pkg">Packaging Cost / Bottle (USD)</Label>
                <Input
                  id="prop-c-pkg"
                  type="number"
                  min={0}
                  step={0.01}
                  value={perBottlePackaging}
                  onChange={(e) => setPerBottlePackaging(e.target.value)}
                  disabled={isReadOnly}
                  className="touch-manipulation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-c-lbl">Labeling Cost / Bottle (USD)</Label>
                <Input
                  id="prop-c-lbl"
                  type="number"
                  min={0}
                  step={0.01}
                  value={perBottleLabeling}
                  onChange={(e) => setPerBottleLabeling(e.target.value)}
                  disabled={isReadOnly}
                  className="touch-manipulation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-setup">Setup Fee (USD)</Label>
                <Input
                  id="prop-setup"
                  type="number"
                  min={0}
                  step={1}
                  value={setupFee}
                  onChange={(e) => setSetupFee(e.target.value)}
                  disabled={isReadOnly}
                  className="touch-manipulation"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-display text-sm font-medium">Timeline</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="prop-sample-date">Sample Available</Label>
                <Input
                  id="prop-sample-date"
                  type="date"
                  value={sampleAvailableDate}
                  onChange={(e) => setSampleAvailableDate(e.target.value)}
                  disabled={isReadOnly}
                  className="touch-manipulation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-start-date">Production Start</Label>
                <Input
                  id="prop-start-date"
                  type="date"
                  value={productionStartDate}
                  onChange={(e) => setProductionStartDate(e.target.value)}
                  disabled={isReadOnly}
                  className="touch-manipulation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-deliver-date">First Delivery</Label>
                <Input
                  id="prop-deliver-date"
                  type="date"
                  value={firstDeliveryDate}
                  onChange={(e) => setFirstDeliveryDate(e.target.value)}
                  disabled={isReadOnly}
                  className="touch-manipulation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-sample-qty">Sample Quantity</Label>
                <Input
                  id="prop-sample-qty"
                  type="number"
                  min={0}
                  step={1}
                  value={sampleQuantity}
                  onChange={(e) => setSampleQuantity(e.target.value)}
                  disabled={isReadOnly}
                  className="touch-manipulation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-sample-ship">Sample Ship Date</Label>
                <Input
                  id="prop-sample-ship"
                  type="date"
                  value={sampleShipDate}
                  onChange={(e) => setSampleShipDate(e.target.value)}
                  disabled={isReadOnly}
                  className="touch-manipulation"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-display text-sm font-medium">Notes</h4>
            <div className="space-y-2">
              <Label htmlFor="prop-tech">Technical Notes</Label>
              <Textarea
                id="prop-tech"
                value={technicalNotes}
                onChange={(e) => setTechnicalNotes(e.target.value)}
                disabled={isReadOnly}
                rows={3}
                className="touch-manipulation resize-y"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prop-reg">Regulatory Notes</Label>
              <Textarea
                id="prop-reg"
                value={regulatoryNotes}
                onChange={(e) => setRegulatoryNotes(e.target.value)}
                disabled={isReadOnly}
                rows={3}
                className="touch-manipulation resize-y"
              />
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            {isReadOnly ? (
              <Button type="button" variant="outline" className="touch-manipulation" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" className="touch-manipulation" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="destructive" className="touch-manipulation" onClick={handleDecline}>
                  Decline Request
                </Button>
                <Button type="submit" className="touch-manipulation" disabled={submitting}>
                  Submit Proposal
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
