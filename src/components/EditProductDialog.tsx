import { useEffect, useState } from "react";
import type { Product } from "@/data/mockData";
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
import { toast } from "@/components/ui/sonner";

const STATUSES: Product["status"][] = ["active", "development"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSave: (sku: string, patch: Partial<Product>) => void;
};

export function EditProductDialog({ open, onOpenChange, product, onSave }: Props) {
  const [name, setName] = useState("");
  const [size, setSize] = useState("");
  const [caseSize, setCaseSize] = useState("12");
  const [wholesaleCasePrice, setWholesaleCasePrice] = useState("");
  const [minOrderCases, setMinOrderCases] = useState("1");
  const [status, setStatus] = useState<Product["status"]>("active");

  useEffect(() => {
    if (!product || !open) return;
    setName(product.name);
    setSize(product.size);
    setCaseSize(String(product.caseSize));
    setWholesaleCasePrice(product.wholesaleCasePrice != null ? String(product.wholesaleCasePrice) : "");
    setMinOrderCases(product.minOrderCases != null ? String(product.minOrderCases) : "1");
    setStatus(product.status);
  }, [product, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    const cs = Math.max(1, Math.round(Number(caseSize) || 0));
    const priceNum = parseFloat(wholesaleCasePrice.replace(/,/g, ""));
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      toast.error("Enter a valid wholesale case price (CAD)");
      return;
    }
    const minCs = Math.max(1, Math.round(Number(minOrderCases) || 1));
    onSave(product.sku, {
      name: name.trim() || product.name,
      size: size.trim() || product.size,
      caseSize: cs,
      wholesaleCasePrice: Math.round(priceNum * 100) / 100,
      minOrderCases: minCs,
      status,
    });
    toast.success("Catalog updated", { description: `${product.sku} — pricing saved; retail and field apps use this on next load.` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit SKU</DialogTitle>
          <DialogDescription>
            Pricing changes propagate to the retail catalog, sales orders, and POs — same product record across the network.
          </DialogDescription>
        </DialogHeader>
        {product ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="font-mono text-xs text-muted-foreground">{product.sku}</p>
            <div className="space-y-2">
              <Label htmlFor="ep-name">Product name</Label>
              <Input id="ep-name" value={name} onChange={(e) => setName(e.target.value)} className="touch-manipulation" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ep-size">Size</Label>
                <Input id="ep-size" value={size} onChange={(e) => setSize(e.target.value)} className="touch-manipulation" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ep-case">Bottles per case</Label>
                <Input id="ep-case" value={caseSize} onChange={(e) => setCaseSize(e.target.value)} className="touch-manipulation" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ep-price">Wholesale case price (CAD) *</Label>
              <Input
                id="ep-price"
                inputMode="decimal"
                value={wholesaleCasePrice}
                onChange={(e) => setWholesaleCasePrice(e.target.value)}
                className="touch-manipulation tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ep-min">Min order (cases)</Label>
              <Input id="ep-min" inputMode="numeric" value={minOrderCases} onChange={(e) => setMinOrderCases(e.target.value)} className="touch-manipulation" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Product["status"])}>
                <SelectTrigger className="touch-manipulation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
