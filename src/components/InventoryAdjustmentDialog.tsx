/**
 * Inventory Adjustment Dialog
 * Distributor requests to reconcile physical count with system inventory
 */

import { useState } from "react";
import { useAppData } from "@/contexts/AppDataContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useInventoryAdjustments } from "@/contexts/AppDataContext";

interface InventoryAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InventoryAdjustmentDialog({ open, onOpenChange }: InventoryAdjustmentDialogProps) {
  const { data } = useAppData();
  const { addAdjustment } = useInventoryAdjustments();

  const [accountId, setAccountId] = useState("");
  const [sku, setSku] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<"count_discrepancy" | "damage" | "theft" | "other">("count_discrepancy");
  const [quantityExpected, setQuantityExpected] = useState("");
  const [quantityActual, setQuantityActual] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeAccounts = data.accounts.filter((a) => a.status === "active");
  const products = data.products.filter((p) => p.status === "active");

  const adjustment = Number(quantityActual) - Number(quantityExpected);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await addAdjustment({
      accountId,
      sku,
      adjustmentType,
      quantityExpected: Number(quantityExpected),
      quantityActual: Number(quantityActual),
      reason,
    });

    setIsSubmitting(false);
    if (result.success) {
      onOpenChange(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setAccountId("");
    setSku("");
    setAdjustmentType("count_discrepancy");
    setQuantityExpected("");
    setQuantityActual("");
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-display">Request Inventory Adjustment</DialogTitle>
            <DialogDescription>
              Reconcile physical count discrepancies with system inventory.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="account">Account</Label>
              <Select value={accountId} onValueChange={setAccountId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select account..." />
                </SelectTrigger>
                <SelectContent>
                  {activeAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.tradingName || a.legalName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">Product SKU</Label>
              <Select value={sku} onValueChange={setSku} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select SKU..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.sku} value={p.sku}>
                      {p.sku} — {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjustmentType">Adjustment Type</Label>
              <Select
                value={adjustmentType}
                onValueChange={(v) => setAdjustmentType(v as typeof adjustmentType)}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="count_discrepancy">Count Discrepancy</SelectItem>
                  <SelectItem value="damage">Damaged Product</SelectItem>
                  <SelectItem value="theft">Theft / Loss</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expected">Expected (System)</Label>
                <Input
                  id="expected"
                  type="number"
                  min={0}
                  value={quantityExpected}
                  onChange={(e) => setQuantityExpected(e.target.value)}
                  placeholder="Bottles"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actual">Actual (Physical)</Label>
                <Input
                  id="actual"
                  type="number"
                  min={0}
                  value={quantityActual}
                  onChange={(e) => setQuantityActual(e.target.value)}
                  placeholder="Bottles"
                  required
                />
              </div>
            </div>

            {quantityExpected && quantityActual && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <span className="text-muted-foreground">Adjustment: {" "}</span>
                <span
                  className={
                    adjustment >= 0 ? "text-emerald-600 font-medium" : "text-destructive font-medium"
                  }
                >
                  {adjustment > 0 ? "+" : ""}
                  {adjustment} bottles
                </span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason / Notes</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain the discrepancy..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
