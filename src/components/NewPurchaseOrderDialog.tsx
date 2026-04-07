import { useEffect, useMemo, useState } from "react";
import type { PurchaseOrder } from "@/data/mockData";
import { useProducts, useInventory } from "@/contexts/AppDataContext";
import { simulateLedgerCommit } from "@/lib/ledger";
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
import { nextPoId } from "@/lib/po-ids";
import { Link } from "react-router-dom";

const MANUFACTURERS = ["Kirin Brewery Co."] as const;
const PO_STATUSES: PurchaseOrder["status"][] = [
  "draft",
  "approved",
  "in-production",
  "completed",
  "shipped",
  "delivered",
  "delayed",
];

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
  existing: PurchaseOrder[];
  onCreate: (po: PurchaseOrder) => void;
  /** Deep link from manufacturer / alerts — pre-fill SKU and bottle quantity. */
  prefill?: { sku?: string; quantity?: string } | null;
};

export function NewPurchaseOrderDialog({ open, onOpenChange, existing, onCreate, prefill }: Props) {
  const { products } = useProducts();
  const { availableBottlesForSku } = useInventory();
  const [submitting, setSubmitting] = useState(false);
  const [manufacturer, setManufacturer] = useState<(typeof MANUFACTURERS)[number]>(MANUFACTURERS[0]);
  const [issueDate, setIssueDate] = useState(todayISO());
  const [requiredDate, setRequiredDate] = useState(addDaysISO(30));
  const [requestedShipDate, setRequestedShipDate] = useState(addDaysISO(35));
  const [sku, setSku] = useState(products[0]?.sku ?? "HJM-OG-750");
  const [quantity, setQuantity] = useState("1200");
  const [packagingInstructions, setPackagingInstructions] = useState("Standard 12-bottle case");
  const [labelVersion, setLabelVersion] = useState("v3.1");
  const [marketDestination, setMarketDestination] = useState("Ontario");
  const [status, setStatus] = useState<PurchaseOrder["status"]>("draft");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setManufacturer(MANUFACTURERS[0]);
    setIssueDate(todayISO());
    setRequiredDate(addDaysISO(30));
    setRequestedShipDate(addDaysISO(35));
    const defaultSku = products[0]?.sku ?? "HJM-OG-750";
    setSku(prefill?.sku && products.some((p) => p.sku === prefill.sku) ? prefill.sku : defaultSku);
    setQuantity(prefill?.quantity ?? "1200");
    setPackagingInstructions("Standard 12-bottle case");
    setLabelVersion("v3.1");
    setMarketDestination("Ontario");
    setStatus("draft");
    setNotes(prefill?.sku ? `Replenishment suggestion for ${prefill.sku}` : "");
  }, [open, products, prefill]);

  const availableForSku = useMemo(() => availableBottlesForSku(sku), [availableBottlesForSku, sku]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || products.length === 0) {
      toast.error("Select a SKU", { description: "Add products under Settings → Product catalog if the list is empty." });
      return;
    }
    const qty = Math.max(1, Math.round(Number(quantity) || 0));
    const available = availableBottlesForSku(sku);
    if (available < qty) {
      toast.error("Insufficient available inventory", {
        description: `${sku} needs ${qty.toLocaleString()} bottles; only ${available.toLocaleString()} available (status: available).`,
      });
      return;
    }
    const po: PurchaseOrder = {
      id: nextPoId(existing),
      manufacturer,
      issueDate,
      requiredDate,
      requestedShipDate,
      sku,
      quantity: qty,
      packagingInstructions: packagingInstructions.trim() || "—",
      labelVersion: labelVersion.trim() || "v1.0",
      marketDestination: marketDestination.trim() || "—",
      status,
      notes: notes.trim(),
    };
    setSubmitting(true);
    try {
      const { txHash } = await simulateLedgerCommit({ type: "po_create", poId: po.id, sku: po.sku, quantity: po.quantity });
      onCreate(po);
      toast.success("Purchase order created", {
        description: `${po.id} · Network commit ${txHash.slice(0, 10)}…`,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New purchase order</DialogTitle>
          <DialogDescription>
            Production PO for the manufacturer. Before save we verify <strong className="text-foreground">available</strong> inventory for the SKU;
            when the PO moves to <strong className="text-foreground">shipped</strong> or <strong className="text-foreground">delivered</strong>, that
            quantity is removed from inventory (FIFO). Creation is recorded on the simulated ledger.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Manufacturer</Label>
              <Select value={manufacturer} onValueChange={(v) => setManufacturer(v as (typeof MANUFACTURERS)[number])}>
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
              <Label htmlFor="po-issue">Issue date</Label>
              <Input id="po-issue" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="touch-manipulation" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="po-req">Required date</Label>
              <Input id="po-req" type="date" value={requiredDate} onChange={(e) => setRequiredDate(e.target.value)} className="touch-manipulation" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="po-ship">Requested ship date</Label>
              <Input
                id="po-ship"
                type="date"
                value={requestedShipDate}
                onChange={(e) => setRequestedShipDate(e.target.value)}
                className="touch-manipulation"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>SKU</Label>
              {products.length === 0 ? (
                <p className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  No products yet.{" "}
                  <Link to="/settings" className="font-medium text-primary underline-offset-2 hover:underline">
                    Add SKUs in Settings
                  </Link>
                  .
                </p>
              ) : (
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
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="po-qty">Quantity (bottles)</Label>
              <Input
                id="po-qty"
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
              <Label>Initial status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as PurchaseOrder["status"])}>
                <SelectTrigger className="touch-manipulation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PO_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s.replace("-", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="po-pack">Packaging instructions</Label>
              <Input
                id="po-pack"
                value={packagingInstructions}
                onChange={(e) => setPackagingInstructions(e.target.value)}
                className="touch-manipulation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="po-label">Label version</Label>
              <Input id="po-label" value={labelVersion} onChange={(e) => setLabelVersion(e.target.value)} className="touch-manipulation" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="po-market">Market destination</Label>
              <Input id="po-market" value={marketDestination} onChange={(e) => setMarketDestination(e.target.value)} className="touch-manipulation" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="po-notes">Notes</Label>
              <Textarea id="po-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="touch-manipulation resize-y" />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="touch-manipulation" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="touch-manipulation" disabled={submitting || products.length === 0}>
              {submitting ? "Committing…" : "Create PO"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
