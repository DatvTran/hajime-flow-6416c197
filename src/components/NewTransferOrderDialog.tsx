import { useEffect, useMemo, useState } from "react";
import type { TransferOrder } from "@/data/mockData";
import { useProducts, useInventory } from "@/contexts/AppDataContext";
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
import { useAccounts } from "@/contexts/AppDataContext";

const LOCATIONS = ["Toronto Main", "Milan DC", "Paris Hub", "NYC Warehouse"] as const;

const TO_STATUSES: TransferOrder["status"][] = ["draft", "picked", "packed", "shipped", "delivered", "cancelled"];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing: TransferOrder[];
  onCreate: (to: Omit<TransferOrder, "id">) => void;
};

export function NewTransferOrderDialog({ open, onOpenChange, onCreate }: Props) {
  const { products } = useProducts();
  const { accounts } = useAccounts();
  const { availableBottlesAtWarehouse } = useInventory();
  const [submitting, setSubmitting] = useState(false);

  const [fromLocation, setFromLocation] = useState<typeof LOCATIONS[number]>(LOCATIONS[0]);
  const [toAccountId, setToAccountId] = useState<string | undefined>(undefined);
  const [sku, setSku] = useState(products[0]?.sku ?? "HJM-OG-750");
  const [quantity, setQuantity] = useState("48");
  const [shipDate, setShipDate] = useState(todayISO());
  const [deliveryDate, setDeliveryDate] = useState(addDaysISO(2));
  const [status, setStatus] = useState<TransferOrder["status"]>("draft");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setFromLocation(LOCATIONS[0]);
    setToAccountId(accounts[0]?.id);
    const defaultSku = products[0]?.sku ?? "HJM-OG-750";
    setSku(defaultSku);
    setQuantity("48");
    setShipDate(todayISO());
    setDeliveryDate(addDaysISO(2));
    setStatus("draft");
    setTrackingNumber("");
    setNotes("");
  }, [open, products, accounts]);

  const availableForSku = useMemo(() => availableBottlesAtWarehouse(sku, fromLocation), [availableBottlesAtWarehouse, sku, fromLocation]);

  const toAccount = useMemo(
    () => accounts.find((a) => a.id === toAccountId),
    [accounts, toAccountId]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || products.length === 0) {
      toast.error("Select a SKU");
      return;
    }
    const qty = Math.max(1, Math.round(Number(quantity) || 0));
    if (availableForSku < qty) {
      toast.error("Insufficient available inventory", {
        description: `${sku} needs ${qty.toLocaleString()} bottles; only ${availableForSku.toLocaleString()} available.`,
      });
      return;
    }
    if (!toAccount) {
      toast.error("Select a destination account");
      return;
    }

    const to: Omit<TransferOrder, "id"> = {
      fromLocation,
      toLocation: toAccount.legalName || toAccount.tradingName,
      toAccountId: toAccount.id,
      sku,
      quantity: qty,
      shipDate,
      deliveryDate,
      status,
      trackingNumber: trackingNumber.trim() || undefined,
      notes: notes.trim(),
    };

    setSubmitting(true);
    try {
      onCreate(to);
      toast.success("Transfer order created", { description: `From ${fromLocation} to ${to.toLocation}` });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New transfer order</DialogTitle>
          <DialogDescription>
            Move existing inventory from a warehouse to a customer or distributor. Requires available stock.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>From Location</Label>
              <Select value={fromLocation} onValueChange={(v) => setFromLocation(v as typeof LOCATIONS[number])}>
                <SelectTrigger className="touch-manipulation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>To Account</Label>
              <Select value={toAccountId} onValueChange={setToAccountId}>
                <SelectTrigger className="touch-manipulation">
                  <SelectValue placeholder="Select account..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.legalName || a.tradingName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>SKU</Label>
              <Select value={sku} onValueChange={setSku}>
                <SelectTrigger className="touch-manipulation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.sku} value={p.sku}>
                      {p.sku} — {p.name} {p.size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-qty">Quantity (bottles)</Label>
              <Input
                id="to-qty"
                type="number"
                min={1}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="touch-manipulation"
              />
              <p className="text-xs text-muted-foreground">
                Available for <span className="font-mono text-foreground">{sku}</span>:{" "}
                <strong className="tabular-nums text-foreground">{availableForSku.toLocaleString()}</strong> bottles
                {availableForSku < Math.max(1, Math.round(Number(quantity) || 0)) ? (
                  <span className="text-destructive"> — below requested quantity</span>
                ) : null}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TransferOrder["status"])}>
                <SelectTrigger className="touch-manipulation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TO_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-ship">Ship Date</Label>
              <Input id="to-ship" type="date" value={shipDate} onChange={(e) => setShipDate(e.target.value)} className="touch-manipulation" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-delivery">Delivery Date</Label>
              <Input id="to-delivery" type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="touch-manipulation" />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="to-tracking">Tracking / BOL Number</Label>
              <Input
                id="to-tracking"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Optional"
                className="touch-manipulation"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="to-notes">Notes</Label>
              <Textarea id="to-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="touch-manipulation resize-y" />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="touch-manipulation" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="touch-manipulation" disabled={submitting || products.length === 0}>
              {submitting ? "Creating…" : "Create Transfer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
