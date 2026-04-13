import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";

const MANUFACTURERS = ["Kirin Brewery Co."] as const;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addMonthsISO(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (npr: Omit<NewProductRequest, "id">) => void;
};

export function NewProductRequestDialog({ open, onOpenChange, onCreate }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [baseSpirit, setBaseSpirit] = useState("coffee_rhum");
  const [targetAbv, setTargetAbv] = useState("25");
  const [flavorProfile, setFlavorProfile] = useState("");
  const [sweetener, setSweetener] = useState("cane_sugar");
  const [targetPricePoint, setTargetPricePoint] = useState<NewProductRequest["specs"]["targetPricePoint"]>("super_premium");
  const [bottleSize, setBottleSize] = useState<NewProductRequest["specs"]["packaging"]["bottleSize"]>("750ml");
  const [caseConfiguration, setCaseConfiguration] = useState("12");
  const [labelStyle, setLabelStyle] = useState("");
  const [minimumOrderQuantity, setMinimumOrderQuantity] = useState("1200");
  const [targetLaunchDate, setTargetLaunchDate] = useState(addMonthsISO(3));
  const [regulatoryMarkets, setRegulatoryMarkets] = useState("Ontario, US");
  const [notes, setNotes] = useState("");
  const [manufacturer, setManufacturer] = useState<(typeof MANUFACTURERS)[number]>(MANUFACTURERS[0]);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setBaseSpirit("coffee_rhum");
    setTargetAbv("25");
    setFlavorProfile("");
    setSweetener("cane_sugar");
    setTargetPricePoint("super_premium");
    setBottleSize("750ml");
    setCaseConfiguration("12");
    setLabelStyle("");
    setMinimumOrderQuantity("1200");
    setTargetLaunchDate(addMonthsISO(3));
    setRegulatoryMarkets("Ontario, US");
    setNotes("");
    setManufacturer(MANUFACTURERS[0]);
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Enter a product name");
      return;
    }
    const abv = Math.max(0, Math.min(100, Number(targetAbv) || 0));
    const moq = Math.max(1, Math.round(Number(minimumOrderQuantity) || 0));
    const cases = Math.max(1, Math.round(Number(caseConfiguration) || 0));
    const markets = regulatoryMarkets
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    const flavors = flavorProfile
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);

    const npr: Omit<NewProductRequest, "id"> = {
      title: title.trim(),
      requestedBy: "brand_operator",
      requestedAt: new Date().toISOString(),
      specs: {
        baseSpirit,
        targetAbv: abv,
        flavorProfile: flavors,
        sweetener,
        targetPricePoint,
        packaging: {
          bottleSize,
          caseConfiguration: cases,
          labelStyle: labelStyle.trim() || "—",
        },
        minimumOrderQuantity: moq,
        targetLaunchDate,
        regulatoryMarkets: markets,
      },
      attachments: [],
      notes: notes.trim(),
      status: "draft",
      assignedManufacturer: manufacturer,
    };

    setSubmitting(true);
    try {
      onCreate(npr);
      toast.success("Product request created", { description: npr.title });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,800px)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New Product Development Request</DialogTitle>
          <DialogDescription>
            Describe the new product you want the manufacturer to evaluate. You can save as draft and submit when ready.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="npr-title">Product Name</Label>
            <Input
              id="npr-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Hazelnut Coffee Rhum 30%"
              className="touch-manipulation"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Base Spirit</Label>
              <Select value={baseSpirit} onValueChange={setBaseSpirit}>
                <SelectTrigger className="touch-manipulation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coffee_rhum">Coffee Rhum</SelectItem>
                  <SelectItem value="coffee_vodka">Coffee Vodka</SelectItem>
                  <SelectItem value="coffee_whiskey">Coffee Whiskey</SelectItem>
                  <SelectItem value="coffee_liqueur">Coffee Liqueur</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="npr-abv">Target ABV (%)</Label>
              <Input
                id="npr-abv"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={targetAbv}
                onChange={(e) => setTargetAbv(e.target.value)}
                className="touch-manipulation"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="npr-flavors">Flavor Profile (comma separated)</Label>
            <Input
              id="npr-flavors"
              value={flavorProfile}
              onChange={(e) => setFlavorProfile(e.target.value)}
              placeholder="e.g., hazelnut, vanilla, caramel"
              className="touch-manipulation"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Sweetener</Label>
              <Select value={sweetener} onValueChange={setSweetener}>
                <SelectTrigger className="touch-manipulation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cane_sugar">Cane Sugar</SelectItem>
                  <SelectItem value="honey">Honey</SelectItem>
                  <SelectItem value="agave">Agave</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target Price Point</Label>
              <Select
                value={targetPricePoint}
                onValueChange={(v) => setTargetPricePoint(v as NewProductRequest["specs"]["targetPricePoint"])}
              >
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
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Bottle Size</Label>
              <Select
                value={bottleSize}
                onValueChange={(v) => setBottleSize(v as NewProductRequest["specs"]["packaging"]["bottleSize"])}
              >
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
              <Label htmlFor="npr-case">Case Configuration</Label>
              <Input
                id="npr-case"
                type="number"
                min={1}
                step={1}
                value={caseConfiguration}
                onChange={(e) => setCaseConfiguration(e.target.value)}
                className="touch-manipulation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="npr-moq">Minimum Order (bottles)</Label>
              <Input
                id="npr-moq"
                type="number"
                min={1}
                step={1}
                value={minimumOrderQuantity}
                onChange={(e) => setMinimumOrderQuantity(e.target.value)}
                className="touch-manipulation"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="npr-label">Label Style / Design Direction</Label>
            <Input
              id="npr-label"
              value={labelStyle}
              onChange={(e) => setLabelStyle(e.target.value)}
              placeholder="e.g., Minimalist ensō with copper foil"
              className="touch-manipulation"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="npr-launch">Target Launch Date</Label>
              <Input
                id="npr-launch"
                type="date"
                value={targetLaunchDate}
                onChange={(e) => setTargetLaunchDate(e.target.value)}
                className="touch-manipulation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="npr-markets">Regulatory Markets (comma separated)</Label>
              <Input
                id="npr-markets"
                value={regulatoryMarkets}
                onChange={(e) => setRegulatoryMarkets(e.target.value)}
                placeholder="Ontario, US, EU"
                className="touch-manipulation"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Manufacturer</Label>
            <Select value={manufacturer} onValueChange={(v) => setManufacturer(v as typeof MANUFACTURERS[number])}>
              <SelectTrigger className="touch-manipulation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MANUFACTURERS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="npr-notes">Notes</Label>
            <Textarea
              id="npr-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Competitor references, positioning notes, special requirements..."
              rows={3}
              className="touch-manipulation resize-y"
            />
          </div>

          <DialogFooter className="flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="touch-manipulation" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="touch-manipulation" disabled={submitting}>
              {submitting ? "Creating..." : "Create Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
