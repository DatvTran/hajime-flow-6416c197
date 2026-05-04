import { useState, useMemo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BASE_SPIRIT_OPTIONS } from "@/lib/base-spirit-options";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function nextNprId(existing: NewProductRequest[]): string {
  let maxSeq = 0;
  const year = new Date().getFullYear();
  for (const r of existing) {
    const m = r.id.match(/^NPR-(\d{4})-(\d+)$/);
    if (m) {
      const y = parseInt(m[1], 10);
      const seq = parseInt(m[2], 10);
      if (y === year) maxSeq = Math.max(maxSeq, seq);
    }
  }
  return `NPR-${year}-${String(maxSeq + 1).padStart(4, "0")}`;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingRequests: NewProductRequest[];
  onCreate: (npr: Omit<NewProductRequest, "id">) => void;
};

const FLAVOR_PROFILES = [
  "coffee", "vanilla", "caramel", "hazelnut", "chocolate", "cinnamon",
  "citrus", "orange", "lemon", "lime", "yuzu", "ginger", "honey",
  "spiced", "herbal", "floral", "berry", "cherry", "apple", "pear",
  "tropical", "coconut", "mint", "smoky", "oak", "butterscotch", "salted_caramel",
];

export function ManufacturerNewProductDialog({ open, onOpenChange, existingRequests, onCreate }: Props) {
  const [submitting, setSubmitting] = useState(false);
  
  // Product specs
  const [title, setTitle] = useState("");
  const [baseSpirit, setBaseSpirit] = useState("rhum");
  const [targetAbv, setTargetAbv] = useState("25");
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>(["coffee"]);
  const [sweetener, setSweetener] = useState("cane_sugar");
  const [pricePoint, setPricePoint] = useState<"premium" | "super_premium" | "ultra_premium">("super_premium");
  const [bottleSize, setBottleSize] = useState<"375ml" | "750ml" | "1000ml">("750ml");
  const [labelStyle, setLabelStyle] = useState("Minimalist ensō with copper foil");
  const [caseConfig, setCaseConfig] = useState("12");
  const [moq, setMoq] = useState("2400");
  const [launchDate, setLaunchDate] = useState(addDaysISO(180));
  const [markets, setMarkets] = useState("Ontario, EU, US");
  const [notes, setNotes] = useState("");

  // Manufacturer proposal (prefilled)
  const [batchSize, setBatchSize] = useState("2400");
  const [minBatch, setMinBatch] = useState("2400");
  const [prodCost, setProdCost] = useState("8.50");
  const [pkgCost, setPkgCost] = useState("2.20");
  const [lblCost, setLblCost] = useState("0.80");
  const [setupFee, setSetupFee] = useState("5000");
  const [sampleDate, setSampleDate] = useState(addDaysISO(60));
  const [prodStart, setProdStart] = useState(addDaysISO(90));
  const [firstDelivery, setFirstDelivery] = useState(addDaysISO(150));
  const [techNotes, setTechNotes] = useState("");
  const [regNotes, setRegNotes] = useState("");

  const totalPerBottle = useMemo(() => {
    return parseFloat((Number(prodCost) + Number(pkgCost) + Number(lblCost)).toFixed(2));
  }, [prodCost, pkgCost, lblCost]);

  const toggleFlavor = (flavor: string) => {
    setSelectedFlavors((prev) =>
      prev.includes(flavor) ? prev.filter((f) => f !== flavor) : [...prev, flavor]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Product name is required");
      return;
    }

    const proposal: NewProductManufacturerProposal = {
      feasible: true,
      canHitAbv: true,
      production: {
        equipmentRequired: ["Standard still", "Fermentation tanks"],
        fermentationTime: "14 days",
        batchSize: Math.max(1, Math.round(Number(batchSize) || 0)),
        minimumBatchSize: Math.max(1, Math.round(Number(minBatch) || 0)),
        capacityAvailable: true,
      },
      costs: {
        perBottleProduction: Number(prodCost) || 0,
        perBottlePackaging: Number(pkgCost) || 0,
        perBottleLabeling: Number(lblCost) || 0,
        setupFee: Number(setupFee) || 0,
        totalPerBottle,
      },
      timeline: {
        sampleAvailableDate: sampleDate,
        productionStartDate: prodStart,
        firstDeliveryDate: firstDelivery,
      },
      technicalNotes: techNotes.trim() || "Standard production process. No anticipated issues.",
      regulatoryNotes: regNotes.trim() || `Compliant for ${markets}.`,
      sampleQuantity: 12,
      sampleShipDate: addDaysISO(62),
    };

    const newRequest: Omit<NewProductRequest, "id"> = {
      title: title.trim(),
      requestedBy: "manufacturer",
      requestedAt: new Date().toISOString(),
      specs: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        baseSpirit: baseSpirit as any,
        targetAbv: Number(targetAbv) || 25,
        flavorProfile: selectedFlavors,
        sweetener: sweetener || undefined,
        targetPricePoint: pricePoint,
        packaging: {
          bottleSize,
          labelStyle: labelStyle.trim(),
          caseConfiguration: Math.max(1, Math.round(Number(caseConfig) || 12)),
        },
        minimumOrderQuantity: Math.max(1, Math.round(Number(moq) || 2400)),
        targetLaunchDate: launchDate,
        regulatoryMarkets: markets.split(",").map((m) => m.trim()).filter(Boolean),
      },
      attachments: [],
      notes: notes.trim() || `Proposed new SKU by Kirin Brewery Co.`,
      status: "proposed",
      assignedManufacturer: "Kirin Brewery Co.",
      submittedAt: new Date().toISOString(),
      reviewStartedAt: new Date().toISOString(),
      proposalReceivedAt: new Date().toISOString(),
      manufacturerProposal: proposal,
    };

    setSubmitting(true);
    try {
      onCreate(newRequest);
      toast.success("New SKU proposal submitted", {
        description: `${title.trim()} sent to Hajime HQ for review`,
      });
      onOpenChange(false);
      // Reset form
      setTitle("");
      setSelectedFlavors(["coffee"]);
      setNotes("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,900px)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Propose New SKU</DialogTitle>
          <DialogDescription>
            Submit a new product formulation proposal to Hajime HQ for review and approval.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Product Overview */}
          <div className="space-y-3">
            <h4 className="font-display text-sm font-medium">Product Overview</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="mnp-title">Product Name *</Label>
                <Input
                  id="mnp-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Hazelnut Coffee Rhum 30%"
                  required
                  className="touch-manipulation"
                />
              </div>
              <div className="space-y-2">
                <Label>Base Spirit</Label>
                <Select value={baseSpirit} onValueChange={setBaseSpirit}>
                  <SelectTrigger className="touch-manipulation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BASE_SPIRIT_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mnp-abv">Target ABV (%)</Label>
                <Input
                  id="mnp-abv"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={targetAbv}
                  onChange={(e) => setTargetAbv(e.target.value)}
                  className="touch-manipulation"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Flavor Profile</Label>
                <div className="flex flex-wrap gap-2">
                  {FLAVOR_PROFILES.map((flavor) => (
                    <button
                      key={flavor}
                      type="button"
                      onClick={() => toggleFlavor(flavor)}
                      className={`rounded-full px-3 py-1 text-xs transition-colors ${
                        selectedFlavors.includes(flavor)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {flavor}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Packaging */}
          <div className="space-y-3">
            <h4 className="font-display text-sm font-medium">Packaging & Positioning</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Bottle Size</Label>
                <Select value={bottleSize} onValueChange={(v) => setBottleSize(v as "375ml" | "750ml" | "1000ml")}>
                  <SelectTrigger className="touch-manipulation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="375ml">375ml</SelectItem>
                    <SelectItem value="750ml">750ml</SelectItem>
                    <SelectItem value="1000ml">1000ml</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Price Point</Label>
                <Select value={pricePoint} onValueChange={(v) => setPricePoint(v as "premium" | "super_premium" | "ultra_premium")}>
                  <SelectTrigger className="touch-manipulation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="super_premium">Super Premium</SelectItem>
                    <SelectItem value="ultra_premium">Ultra Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mnp-case">Case Configuration (bottles)</Label>
                <Input
                  id="mnp-case"
                  type="number"
                  min={1}
                  value={caseConfig}
                  onChange={(e) => setCaseConfig(e.target.value)}
                  className="touch-manipulation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mnp-moq">Minimum Order Quantity (bottles)</Label>
                <Input
                  id="mnp-moq"
                  type="number"
                  min={1}
                  value={moq}
                  onChange={(e) => setMoq(e.target.value)}
                  className="touch-manipulation"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="mnp-label">Label Style Description</Label>
                <Input
                  id="mnp-label"
                  value={labelStyle}
                  onChange={(e) => setLabelStyle(e.target.value)}
                  className="touch-manipulation"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Costing */}
          <div className="space-y-3">
            <h4 className="font-display text-sm font-medium">Production Costing</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mnp-prod">Production Cost / Bottle (USD)</Label>
                <Input
                  id="mnp-prod"
                  type="number"
                  min={0}
                  step={0.01}
                  value={prodCost}
                  onChange={(e) => setProdCost(e.target.value)}
                  className="touch-manipulation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mnp-pkg">Packaging Cost / Bottle (USD)</Label>
                <Input
                  id="mnp-pkg"
                  type="number"
                  min={0}
                  step={0.01}
                  value={pkgCost}
                  onChange={(e) => setPkgCost(e.target.value)}
                  className="touch-manipulation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mnp-lbl">Labeling Cost / Bottle (USD)</Label>
                <Input
                  id="mnp-lbl"
                  type="number"
                  min={0}
                  step={0.01}
                  value={lblCost}
                  onChange={(e) => setLblCost(e.target.value)}
                  className="touch-manipulation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mnp-setup">Setup Fee (USD)</Label>
                <Input
                  id="mnp-setup"
                  type="number"
                  min={0}
                  value={setupFee}
                  onChange={(e) => setSetupFee(e.target.value)}
                  className="touch-manipulation"
                />
              </div>
              <div className="sm:col-span-2 rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Cost per Bottle:</span>
                  <span className="font-semibold">${totalPerBottle.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Timeline */}
          <div className="space-y-3">
            <h4 className="font-display text-sm font-medium">Timeline</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mnp-sample">Sample Available</Label>
                <Input
                  id="mnp-sample"
                  type="date"
                  value={sampleDate}
                  onChange={(e) => setSampleDate(e.target.value)}
                  className="touch-manipulation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mnp-prodstart">Production Start</Label>
                <Input
                  id="mnp-prodstart"
                  type="date"
                  value={prodStart}
                  onChange={(e) => setProdStart(e.target.value)}
                  className="touch-manipulation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mnp-delivery">First Delivery</Label>
                <Input
                  id="mnp-delivery"
                  type="date"
                  value={firstDelivery}
                  onChange={(e) => setFirstDelivery(e.target.value)}
                  className="touch-manipulation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mnp-launch">Target Launch Date</Label>
                <Input
                  id="mnp-launch"
                  type="date"
                  value={launchDate}
                  onChange={(e) => setLaunchDate(e.target.value)}
                  className="touch-manipulation"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-3">
            <h4 className="font-display text-sm font-medium">Additional Information</h4>
            <div className="space-y-2">
              <Label htmlFor="mnp-markets">Target Markets (comma separated)</Label>
              <Input
                id="mnp-markets"
                value={markets}
                onChange={(e) => setMarkets(e.target.value)}
                placeholder="Ontario, EU, US"
                className="touch-manipulation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mnp-tech">Technical Notes</Label>
              <Textarea
                id="mnp-tech"
                value={techNotes}
                onChange={(e) => setTechNotes(e.target.value)}
                placeholder="Production process, equipment requirements, etc."
                rows={2}
                className="touch-manipulation resize-y"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mnp-reg">Regulatory Notes</Label>
              <Textarea
                id="mnp-reg"
                value={regNotes}
                onChange={(e) => setRegNotes(e.target.value)}
                placeholder="Compliance considerations for target markets"
                rows={2}
                className="touch-manipulation resize-y"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mnp-notes">Proposal Notes</Label>
              <Textarea
                id="mnp-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Why this product? Competitive positioning, market opportunity..."
                rows={2}
                className="touch-manipulation resize-y"
              />
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="touch-manipulation" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="touch-manipulation" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Proposal to Hajime HQ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
