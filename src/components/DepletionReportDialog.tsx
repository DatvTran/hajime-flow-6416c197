import { useEffect, useMemo, useState } from "react";
import type { DepletionReport } from "@/data/mockData";
import { useAccounts, useProducts } from "@/contexts/AppDataContext";
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
import { Checkbox } from "@/components/ui/checkbox";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: DepletionReport | null;
  onSave: (report: Omit<DepletionReport, "id">) => void;
  readOnly?: boolean;
};

export function DepletionReportDialog({ open, onOpenChange, existing, onSave, readOnly }: Props) {
  const { accounts } = useAccounts();
  const { products } = useProducts();
  const retailAccounts = useMemo(
    () => accounts.filter((a) => a.status === "active" && a.type !== "distributor"),
    [accounts]
  );

  const [accountId, setAccountId] = useState(existing?.accountId ?? "");
  const [sku, setSku] = useState(existing?.sku ?? "");
  const [periodStart, setPeriodStart] = useState(existing?.periodStart ?? "");
  const [periodEnd, setPeriodEnd] = useState(existing?.periodEnd ?? "");
  const [bottlesSold, setBottlesSold] = useState(String(existing?.bottlesSold ?? ""));
  const [bottlesOnHandAtEnd, setBottlesOnHandAtEnd] = useState(String(existing?.bottlesOnHandAtEnd ?? ""));
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [flagged, setFlagged] = useState(existing?.flaggedForReplenishment ?? false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setAccountId(existing.accountId);
      setSku(existing.sku);
      setPeriodStart(existing.periodStart);
      setPeriodEnd(existing.periodEnd);
      setBottlesSold(String(existing.bottlesSold));
      setBottlesOnHandAtEnd(String(existing.bottlesOnHandAtEnd));
      setNotes(existing.notes);
      setFlagged(existing.flaggedForReplenishment);
    } else {
      const firstAcc = retailAccounts[0]?.id ?? "";
      const firstSku = products[0]?.sku ?? "";
      setAccountId(firstAcc);
      setSku(firstSku);
      const start = new Date();
      start.setDate(1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      setPeriodStart(start.toISOString().slice(0, 10));
      setPeriodEnd(end.toISOString().slice(0, 10));
      setBottlesSold("");
      setBottlesOnHandAtEnd("");
      setNotes("");
      setFlagged(false);
    }
  }, [open, existing, products, retailAccounts]);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === accountId),
    [accounts, accountId]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      toast.error("Select an account");
      return;
    }
    if (!sku) {
      toast.error("Select a SKU");
      return;
    }
    const sold = Math.max(0, Math.round(Number(bottlesSold) || 0));
    const onHand = Math.max(0, Math.round(Number(bottlesOnHandAtEnd) || 0));
    if (!periodStart || !periodEnd) {
      toast.error("Select a period");
      return;
    }

    const report: Omit<DepletionReport, "id"> = {
      accountId,
      sku,
      periodStart,
      periodEnd,
      bottlesSold: sold,
      bottlesOnHandAtEnd: onHand,
      notes: notes.trim(),
      reportedBy: "distributor",
      reportedAt: new Date().toISOString(),
      flaggedForReplenishment: flagged,
    };

    setSubmitting(true);
    try {
      onSave(report);
      toast.success(existing ? "Depletion report updated" : "Depletion report submitted");
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,800px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit depletion report" : "Report depletions"}</DialogTitle>
          <DialogDescription>
            Log actual bottles sold and remaining on-hand for an account. This feeds the Brand Operator sell-through dashboard.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Account</Label>
              <Select value={accountId} onValueChange={setAccountId} disabled={readOnly}>
                <SelectTrigger className="touch-manipulation">
                  <SelectValue placeholder="Select account..." />
                </SelectTrigger>
                <SelectContent>
                  {retailAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.tradingName || a.legalName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedAccount ? (
                <p className="text-xs text-muted-foreground">{selectedAccount.city} · {selectedAccount.type}</p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>SKU</Label>
              <Select value={sku} onValueChange={setSku} disabled={readOnly}>
                <SelectTrigger className="touch-manipulation">
                  <SelectValue placeholder="Select SKU..." />
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
              <Label htmlFor="dep-start">Period Start</Label>
              <Input id="dep-start" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} disabled={readOnly} className="touch-manipulation" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dep-end">Period End</Label>
              <Input id="dep-end" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} disabled={readOnly} className="touch-manipulation" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dep-sold">Bottles Sold</Label>
              <Input id="dep-sold" type="number" min={0} step={1} value={bottlesSold} onChange={(e) => setBottlesSold(e.target.value)} disabled={readOnly} className="touch-manipulation" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dep-hand">Bottles On-Hand (end of period)</Label>
              <Input id="dep-hand" type="number" min={0} step={1} value={bottlesOnHandAtEnd} onChange={(e) => setBottlesOnHandAtEnd(e.target.value)} disabled={readOnly} className="touch-manipulation" />
            </div>

            <div className="flex items-start gap-3 sm:col-span-2">
              <Checkbox id="dep-flag" checked={flagged} onCheckedChange={(v) => setFlagged(v === true)} disabled={readOnly} />
              <div className="grid gap-1.5 leading-none">
                <label htmlFor="dep-flag" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Flag for replenishment
                </label>
                <p className="text-xs text-muted-foreground">Alerts the Brand Operator that this account needs restock.</p>
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="dep-notes">Notes</Label>
              <Textarea id="dep-notes" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={readOnly} rows={3} className="touch-manipulation resize-y" />
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="touch-manipulation" onClick={() => onOpenChange(false)}>
              {readOnly ? "Close" : "Cancel"}
            </Button>
            {!readOnly ? (
              <Button type="submit" className="touch-manipulation" disabled={submitting}>
                {submitting ? "Saving…" : existing ? "Update Report" : "Submit Report"}
              </Button>
            ) : null}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
