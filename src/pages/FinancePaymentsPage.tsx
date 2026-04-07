import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinancingLedger, usePurchaseOrders } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import type { FinancingLedgerEntry } from "@/types/app-data";
import { toast } from "@/components/ui/sonner";

function kindLabel(k: FinancingLedgerEntry["kind"]): string {
  switch (k) {
    case "retailer_to_wholesaler":
      return "Retail → wholesaler";
    case "wholesaler_to_manufacturer":
      return "Wholesaler → manufacturer";
    case "manufacturer_receipt":
      return "Manufacturer receipt";
    default:
      return k;
  }
}

export default function FinancePaymentsPage() {
  const { user } = useAuth();
  const { entries, appendEntry } = useFinancingLedger();
  const { purchaseOrders } = usePurchaseOrders();
  const [poId, setPoId] = useState("");
  const [mfgAmount, setMfgAmount] = useState("");
  const [mfgNote, setMfgNote] = useState("");

  const sorted = useMemo(() => [...entries].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)), [entries]);

  const totalRetailToWh = useMemo(
    () => entries.filter((e) => e.kind === "retailer_to_wholesaler" && e.status === "recorded").reduce((s, e) => s + e.amountCad, 0),
    [entries],
  );
  const totalWhToMfg = useMemo(
    () =>
      entries.filter((e) => e.kind === "wholesaler_to_manufacturer" && e.status === "recorded").reduce((s, e) => s + e.amountCad, 0),
    [entries],
  );

  const recordWhToMfg = (e: React.FormEvent) => {
    e.preventDefault();
    if (user.role !== "distributor" && user.role !== "brand_operator") return;
    const amt = parseFloat(mfgAmount.replace(/,/g, ""));
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Enter a positive amount (CAD)");
      return;
    }
    const po = poId.trim() ? purchaseOrders.find((p) => p.id === poId.trim()) : undefined;
    appendEntry({
      kind: "wholesaler_to_manufacturer",
      fromLabel: "Wholesaler / DC",
      toLabel: "Kirin Brewery Co.",
      amountCad: Math.round(amt * 100) / 100,
      description: mfgNote.trim() || `Transfer for production / inbound${po ? ` · ${po.id}` : ""}`,
      purchaseOrderId: po?.id,
      status: "recorded",
      at: new Date().toISOString(),
    });
    toast.success("Payment recorded", { description: "Ledger updated — manufacturer can confirm receipt." });
    setMfgAmount("");
    setMfgNote("");
    setPoId("");
  };

  const confirmManufacturerReceipt = (row: FinancingLedgerEntry) => {
    if (user.role !== "manufacturer" && user.role !== "brand_operator") return;
    appendEntry({
      kind: "manufacturer_receipt",
      fromLabel: "Kirin Brewery Co.",
      toLabel: "Hajime HQ treasury",
      amountCad: row.amountCad,
      description: `Confirmed receipt for wholesaler payment — ${row.description}`,
      status: "recorded",
      at: new Date().toISOString(),
    });
    toast.success("Receipt logged");
  };

  return (
    <div>
      <PageHeader
        title="Payments & receivables"
        description={
          user.role === "brand_operator"
            ? "Full network visibility: retail collections, wholesaler remits to manufacturer, and manufacturer confirmations."
            : user.role === "distributor"
              ? "Record wholesaler payments to the manufacturer against POs. Retail payments appear when orders are marked paid."
              : "Confirm inbound payments from the distribution network (demo ledger)."
        }
      />

      {user.role === "brand_operator" ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Retail → wholesaler (captured)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-2xl font-semibold tabular-nums">${totalRetailToWh.toLocaleString()} CAD</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Wholesaler → manufacturer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-2xl font-semibold tabular-nums">${totalWhToMfg.toLocaleString()} CAD</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ledger lines</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-2xl font-semibold tabular-nums">{entries.length}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {(user.role === "distributor" || user.role === "brand_operator") && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-display text-lg">Record wholesaler → manufacturer payment</CardTitle>
            <p className="text-sm text-muted-foreground">Tie to a production request when applicable — manufacturer sees it in this same ledger.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={recordWhToMfg} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <Label htmlFor="fin-po">PO id (optional)</Label>
                <Input id="fin-po" value={poId} onChange={(e) => setPoId(e.target.value)} placeholder="PO-2025-001" className="touch-manipulation font-mono" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fin-amt">Amount (CAD) *</Label>
                <Input id="fin-amt" inputMode="decimal" value={mfgAmount} onChange={(e) => setMfgAmount(e.target.value)} className="touch-manipulation tabular-nums" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="fin-note">Note</Label>
                <Input id="fin-note" value={mfgNote} onChange={(e) => setMfgNote(e.target.value)} placeholder="Wire ref, invoice batch…" className="touch-manipulation" />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full touch-manipulation">
                  Record payment
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Ledger</CardTitle>
          <p className="text-sm text-muted-foreground">Entries append on retail order payment (automatic) and manual wholesaler remits.</p>
        </CardHeader>
        <CardContent>
          <div className="-mx-4 overflow-x-auto touch-pan-x px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted-foreground">When</th>
                  <th className="pb-3 font-medium text-muted-foreground">Flow</th>
                  <th className="pb-3 font-medium text-muted-foreground">From → to</th>
                  <th className="pb-3 font-medium text-muted-foreground">Amount</th>
                  <th className="pb-3 font-medium text-muted-foreground">Detail</th>
                  <th className="pb-3 w-28" />
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-muted-foreground">
                      No entries yet — mark a retail order paid to create the first retail → wholesaler line.
                    </td>
                  </tr>
                ) : (
                  sorted.map((row) => (
                    <tr key={row.id} className="border-b border-border/60 last:border-0">
                      <td className="py-3 text-xs text-muted-foreground tabular-nums">{new Date(row.at).toLocaleString()}</td>
                      <td className="py-3 text-xs">{kindLabel(row.kind)}</td>
                      <td className="py-3">
                        <span className="text-xs">{row.fromLabel}</span>
                        <span className="text-muted-foreground"> → </span>
                        <span className="text-xs">{row.toLabel}</span>
                      </td>
                      <td className="py-3 tabular-nums font-medium">${row.amountCad.toLocaleString()}</td>
                      <td className="py-3 text-xs text-muted-foreground max-w-[280px]">{row.description}</td>
                      <td className="py-3 text-right">
                        {row.kind === "wholesaler_to_manufacturer" && (user.role === "manufacturer" || user.role === "brand_operator") ? (
                          <Button type="button" size="sm" variant="outline" className="touch-manipulation" onClick={() => confirmManufacturerReceipt(row)}>
                            Confirm receipt
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
