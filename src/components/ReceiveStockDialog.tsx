import { useEffect, useRef, useState } from "react";
import type { InventoryItem } from "@/data/mockData";
import { useProducts } from "@/contexts/AppDataContext";
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
import { nextInventoryId } from "@/lib/inventory-ids";
import { Link } from "react-router-dom";

const WAREHOUSES = ["Toronto Main", "Milan Depot", "Production", "Toronto Main Warehouse"] as const;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function randomBatchLot(): string {
  return `B${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingItems: InventoryItem[];
  onReceive: (item: InventoryItem) => void;
};

export function ReceiveStockDialog({ open, onOpenChange, existingItems, onReceive }: Props) {
  const { products } = useProducts();
  /** Rows added in this open session before parent re-renders — keeps INV-### unique for rapid “Receive & add line”. */
  const sessionAddsRef = useRef<InventoryItem[]>([]);
  const [sku, setSku] = useState("");
  const [batchLot, setBatchLot] = useState("");
  const [productionDate, setProductionDate] = useState(todayISO());
  const [quantityBottles, setQuantityBottles] = useState("1200");
  const [warehouse, setWarehouse] = useState<(typeof WAREHOUSES)[number]>("Toronto Main");
  const [status, setStatus] = useState<InventoryItem["status"]>("available");
  const [labelVersion, setLabelVersion] = useState("v3.1");
  const [notes, setNotes] = useState("");

  const selectedProduct = products.find((p) => p.sku === sku);

  useEffect(() => {
    if (!open) return;
    sessionAddsRef.current = [];
    setSku(products[0]?.sku ?? "");
    setBatchLot(randomBatchLot());
    setProductionDate(todayISO());
    setQuantityBottles("1200");
    setWarehouse("Toronto Main");
    setStatus("available");
    setLabelVersion("v3.1");
    setNotes("");
  }, [open, products]);

  const resetFormForAnotherLine = () => {
    setBatchLot(randomBatchLot());
    setProductionDate(todayISO());
    setQuantityBottles("1200");
    setNotes("");
  };

  const derivedCases = selectedProduct
    ? Math.floor(Math.max(0, Number(quantityBottles) || 0) / selectedProduct.caseSize)
    : 0;

  const commitReceive = (closeAfter: boolean) => {
    if (!selectedProduct) {
      toast.error("Select a product SKU");
      return;
    }
    const batch = batchLot.trim();
    if (!batch) {
      toast.error("Batch / lot is required");
      return;
    }
    const bottles = Math.max(1, Math.round(Number(quantityBottles) || 0));
    const cases = Math.max(0, Math.floor(bottles / selectedProduct.caseSize));
    const productName = `${selectedProduct.name} ${selectedProduct.size}`.replace(/\s+/g, " ").trim();

    const combined = [...existingItems, ...sessionAddsRef.current];
    const item: InventoryItem = {
      id: nextInventoryId(combined),
      sku: selectedProduct.sku,
      productName,
      batchLot: batch,
      productionDate,
      quantityBottles: bottles,
      quantityCases: cases,
      warehouse,
      status,
      labelVersion: labelVersion.trim() || "v3.1",
      notes: notes.trim(),
    };
    sessionAddsRef.current = [...sessionAddsRef.current, item];
    onReceive(item);
    if (closeAfter) {
      toast.success("Stock received", { description: `${item.id} · ${bottles.toLocaleString()} bottles` });
      onOpenChange(false);
    } else {
      toast.success("Line added", { description: `${item.id} · ${bottles.toLocaleString()} bottles — add another or close` });
      resetFormForAnotherLine();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    commitReceive(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Receive stock</DialogTitle>
          <DialogDescription>
            Record an inbound receipt as a new lot line. Quantities update your on-hand totals and status filters.
          </DialogDescription>
        </DialogHeader>

        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add products first in{" "}
            <Link to="/settings" className="font-medium text-primary underline-offset-2 hover:underline">
              Settings → Product catalog
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label>Product / SKU *</Label>
              <Select value={sku} onValueChange={setSku}>
                <SelectTrigger className="touch-manipulation">
                  <SelectValue placeholder="Select SKU" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.sku} value={p.sku}>
                      {p.sku} — {p.name} {p.size} ({p.caseSize} / case)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rs-batch">Batch / lot *</Label>
              <Input id="rs-batch" value={batchLot} onChange={(e) => setBatchLot(e.target.value)} className="touch-manipulation font-mono" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rs-prod">Production date</Label>
                <Input id="rs-prod" type="date" value={productionDate} onChange={(e) => setProductionDate(e.target.value)} className="touch-manipulation" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rs-qty">Quantity (bottles) *</Label>
                <Input
                  id="rs-qty"
                  type="number"
                  min={1}
                  step={1}
                  value={quantityBottles}
                  onChange={(e) => setQuantityBottles(e.target.value)}
                  className="touch-manipulation"
                />
              </div>
            </div>
            {selectedProduct ? (
              <p className="text-xs text-muted-foreground">
                Cases (derived): <strong className="text-foreground">{derivedCases.toLocaleString()}</strong> at {selectedProduct.caseSize}{" "}
                bottles/case
              </p>
            ) : null}
            <div className="space-y-2">
              <Label>Warehouse *</Label>
              <Select value={warehouse} onValueChange={(v) => setWarehouse(v as (typeof WAREHOUSES)[number])}>
                <SelectTrigger className="touch-manipulation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WAREHOUSES.map((w) => (
                    <SelectItem key={w} value={w}>
                      {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as InventoryItem["status"])}>
                <SelectTrigger className="touch-manipulation capitalize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["available", "reserved", "in-transit", "in-production", "damaged"] as const).map((st) => (
                    <SelectItem key={st} value={st} className="capitalize">
                      {st.replace(/-/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rs-label">Label version</Label>
              <Input id="rs-label" value={labelVersion} onChange={(e) => setLabelVersion(e.target.value)} className="touch-manipulation" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rs-notes">Notes</Label>
              <Textarea id="rs-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="resize-y touch-manipulation" />
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className="touch-manipulation" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                className="touch-manipulation"
                disabled={products.length === 0}
                onClick={() => commitReceive(true)}
              >
                Receive
              </Button>
              <Button type="submit" className="touch-manipulation" disabled={products.length === 0}>
                Receive & add line
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
