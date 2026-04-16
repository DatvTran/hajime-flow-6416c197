import { useEffect, useMemo, useState } from "react";
import type { Account, PurchaseOrder } from "@/data/mockData";
import { useAccounts, useProducts, useAuth } from "@/contexts/AppDataContext";
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

const PO_TYPES: { value: NonNullable<PurchaseOrder["poType"]>; label: string; description: string }[] = [
  { 
    value: "sales", 
    label: "Sales PO", 
    description: "Distributor ordering from manufacturer — brand operator approves" 
  },
  { 
    value: "production", 
    label: "Production PO", 
    description: "Brand operator ordering directly from manufacturer — no inventory gate" 
  },
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
  /**
   * Variant of the dialog. "replenishment" checks available inventory before creation.
   * "production" (default for manufacturing new SKUs) skips the inventory guard.
   */
  variant?: "replenishment" | "production";
  /** User role to determine default PO type and account scoping */
  userRole?: string;
  /** Distributor account ID (when distributor creates a Sales PO) */
  distributorAccountId?: string;
};

export function NewPurchaseOrderDialog({ 
  open, 
  onOpenChange, 
  existing, 
  onCreate, 
  prefill, 
  variant = "production",
  userRole = "brand_operator",
  distributorAccountId,
}: Props) {
  const { products } = useProducts();
  const { accounts } = useAccounts();
  const [submitting, setSubmitting] = useState(false);
  
  // NEW: PO Type selection
  const defaultPoType: PurchaseOrder["poType"] = userRole === "distributor" ? "sales" : "production";
  const [poType, setPoType] = useState<NonNullable<PurchaseOrder["poType"]>>(defaultPoType);
  
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
  
  // NEW: Selected distributor for Sales PO
  const [selectedDistributorId, setSelectedDistributorId] = useState<string>(distributorAccountId || "");

  // NEW: Filter accounts based on PO type and user role
  const availableAccounts = useMemo(() => {
    // For Sales PO: distributor can only see manufacturer (but we handle that via PO type)
    // For Production PO: brand operator sees manufacturer only
    if (poType === "production") {
      // Production POs don't need account selection — brand operator orders directly
      return [];
    }
    
    // For Sales PO: filter to manufacturer accounts only
    // Distributor should only see manufacturer accounts
    return accounts.filter(a => a.type === "distributor" || a.networkRole?.includes("manufacturer"));
  }, [accounts, poType]);

  useEffect(() => {
    if (!open) return;
    
    // Reset to defaults when opening
    setPoType(defaultPoType);
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
    setSelectedDistributorId(distributorAccountId || "");
  }, [open, products, prefill, defaultPoType, distributorAccountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || products.length === 0) {
      toast.error("Select a SKU", { description: "Add products under Settings → Product catalog if the list is empty." });
      return;
    }
    
    // Validation for Sales PO
    if (poType === "sales" && !selectedDistributorId && userRole === "brand_operator") {
      toast.error("Select distributor account", { description: "Sales POs must specify which distributor is ordering." });
      return;
    }
    
    const qty = Math.max(1, Math.round(Number(quantity) || 0));
    
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
      // NEW: PO type fields
      poType,
      distributorAccountId: poType === "sales" ? (selectedDistributorId || distributorAccountId || undefined) : undefined,
    };
    
    setSubmitting(true);
    try {
      const { txHash } = await simulateLedgerCommit({ type: "po_create", poId: po.id, sku: po.sku, quantity: po.quantity });
      onCreate(po);
      toast.success("Purchase order created", {
        description: `${po.id} · ${poType === "sales" ? "Sales PO" : "Production PO"} · Network commit ${txHash.slice(0, 10)}…`,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const canChangePoType = userRole === "brand_operator" || userRole === "operations" || userRole === "founder_admin";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New purchase order</DialogTitle>
          <DialogDescription>
            {variant === "replenishment" 
              ? "Sales PO for the manufacturer. Before save we verify available inventory for the SKU." 
              : "Create a purchase order. Sales POs are distributor orders requiring brand approval; Production POs are direct brand orders."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* NEW: PO Type Selection */}
          <div className="space-y-2 rounded-lg border border-border/80 bg-muted/20 p-3">
            <Label>PO Type *</Label>
            <Select 
              value={poType} 
              onValueChange={(v) => setPoType(v as NonNullable<PurchaseOrder["poType"]>)}
              disabled={!canChangePoType}
            >
              <SelectTrigger className="touch-manipulation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PO_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{t.label}</span>
                      <span className="text-xs text-muted-foreground">{t.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!canChangePoType && (
              <p className="text-xs text-muted-foreground">
                PO type is fixed based on your role ({userRole}).
              </p>
            )}
          </div>
          
          {/* NEW: Distributor selection for Sales POs (when brand operator creates) */}
          {poType === "sales" && userRole === "brand_operator" && (
            <div className="space-y-2">
              <Label>Distributor *</Label>
              <Select value={selectedDistributorId} onValueChange={setSelectedDistributorId}>
                <SelectTrigger className="touch-manipulation">
                  <SelectValue placeholder="Select distributor account..." />
                </SelectTrigger>
                <SelectContent>
                  {availableAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.tradingName || a.legalName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Sales POs are linked to the distributor placing the order.
              </p>
            </div>
          )}
          
          {poType === "sales" && userRole === "distributor" && distributorAccountId && (
            <div className="space-y-2">
              <Label>Distributor</Label>
              <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Your account</span>
              </div>
            </div>
          )}
          
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
              {submitting ? "Committing…" : `Create ${poType === "sales" ? "Sales" : "Production"} PO`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
