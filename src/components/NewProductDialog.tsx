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
  existingSkus: string[];
  onCreate: (product: Product) => void;
};

export function NewProductDialog({ open, onOpenChange, existingSkus, onCreate }: Props) {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [size, setSize] = useState("750ml");
  const [caseSize, setCaseSize] = useState("12");
  const [status, setStatus] = useState<Product["status"]>("active");

  useEffect(() => {
    if (!open) {
      setSku("");
      setName("");
      setSize("750ml");
      setCaseSize("12");
      setStatus("active");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const skuNorm = sku.trim().toUpperCase();
    if (!skuNorm || !name.trim()) {
      toast.error("SKU and product name are required");
      return;
    }
    if (existingSkus.some((s) => s.toLowerCase() === skuNorm.toLowerCase())) {
      toast.error("This SKU already exists");
      return;
    }
    const cs = Math.max(1, Math.round(Number(caseSize) || 0));
    const product: Product = {
      sku: skuNorm,
      name: name.trim(),
      size: size.trim() || "—",
      caseSize: cs,
      status,
    };
    onCreate(product);
    toast.success("Product added", { description: `${product.sku} — ${product.name}` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add product / SKU</DialogTitle>
          <DialogDescription>
            New SKUs appear in sales orders, purchase orders, and the catalog. Use a unique code (e.g. HJM-NEW-750).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="np-sku">SKU *</Label>
            <Input
              id="np-sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="HJM-OG-750"
              className="touch-manipulation font-mono"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="np-name">Product name *</Label>
            <Input id="np-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Hajime Original" className="touch-manipulation" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="np-size">Size</Label>
              <Input id="np-size" value={size} onChange={(e) => setSize(e.target.value)} placeholder="750ml" className="touch-manipulation" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="np-case">Bottles per case</Label>
              <Input
                id="np-case"
                type="number"
                min={1}
                value={caseSize}
                onChange={(e) => setCaseSize(e.target.value)}
                className="touch-manipulation"
              />
            </div>
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
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" className="touch-manipulation" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="touch-manipulation">
              Add product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
