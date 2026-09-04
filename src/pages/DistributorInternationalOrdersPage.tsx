import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getExportOrder, getExportOrders, patchExportOrder, createExportOrder, type ExportOrderDto } from "@/lib/api-v1";
import {
  BUYER_EXPORT_DOC_TYPES,
  EXPORT_SELLER,
  EXPORT_SKUS,
  EXPORT_STAGES,
  isBuyerExportDoc,
  type ExportDocType,
} from "@/lib/export-commercial";
import { EXPORT_BUYER_TERMS } from "@/lib/export-pack-copy";
import { ExportOrderDocView } from "@/components/export/ExportOrderDocView";
import { DistributorPage, DistributorPageHeader } from "@/components/distributor/DistributorUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";

export default function DistributorInternationalOrdersPage() {
  const { user } = useAuth();
  const { orderId, docType } = useParams();
  if (!user || user.role !== "distributor") return <Navigate to="/" replace />;
  if (orderId && docType) return <BuyerDoc orderId={orderId} docType={docType} />;
  if (orderId) return <BuyerDetail orderId={orderId} />;
  return <BuyerList />;
}

function BuyerList() {
  const [rows, setRows] = useState<ExportOrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [territory, setTerritory] = useState("");
  const [destination, setDestination] = useState("");
  const [buyerPoNo, setBuyerPoNo] = useState("");
  const [forwarderName, setForwarderName] = useState("");
  const [casesBySku, setCasesBySku] = useState<Record<string, number>>({
    first_press_750: 25,
    yuzu_mint_750: 0,
    first_press_200: 0,
    yuzu_mint_200: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    void getExportOrders()
      .then((r) => setRows(r.data || []))
      .finally(() => setLoading(false));
  }, []);

  const place = async () => {
    const lines = Object.entries(casesBySku)
      .filter(([, c]) => c > 0)
      .map(([sku, cases]) => ({ sku, cases }));
    if (!territory.trim()) {
      toast.error("Territory / market is required");
      return;
    }
    if (!lines.length) {
      toast.error("Add at least one SKU");
      return;
    }
    setPlacing(true);
    try {
      const res = await createExportOrder({
        territory: territory.trim(),
        destinationCountry: destination.trim() || territory.trim(),
        buyerPoNo: buyerPoNo.trim() || undefined,
        forwarderName: forwarderName.trim() || undefined,
        lines,
      });
      toast.success("Order submitted to Hajime Ltd.", { description: res.data.displayId });
      setFormOpen(false);
      navigate(`/distributor/international-orders/${res.data.displayId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not place order");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <DistributorPage>
      <DistributorPageHeader
        title="International orders"
        description={`${EXPORT_SELLER.legalName} (${EXPORT_SELLER.jurisdiction}) is the seller. ${EXPORT_SELLER.paymentSummary}. Place an order here — Hajime issues the quotation and PI on this same file.`}
        rawDescription
        actions={
          <Button type="button" size="sm" onClick={() => setFormOpen((v) => !v)}>
            {formOpen ? "Cancel" : "Place Hajime order"}
          </Button>
        }
      />

      {formOpen ? (
        <div className="mt-4 space-y-3 rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg">Order from Hajime Ltd.</h2>
          <p className="text-[12px] text-muted-foreground">
            Working {EXPORT_SELLER.workingIncoterm}. List FOB applies until Brand HQ confirms the quotation. This is not a
            Canada retail route order.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Territory / market</Label>
              <Input value={territory} onChange={(e) => setTerritory(e.target.value)} placeholder="Singapore" />
            </div>
            <div className="space-y-1">
              <Label>Destination country</Label>
              <Input value={destination} onChange={(e) => setDestination(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Your PO (optional)</Label>
              <Input value={buyerPoNo} onChange={(e) => setBuyerPoNo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Forwarder (optional)</Label>
              <Input value={forwarderName} onChange={(e) => setForwarderName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            {EXPORT_SKUS.map((s) => (
              <div key={s.sku} className="flex items-center justify-between gap-3 text-[13px]">
                <span>
                  {s.product.replace("Hajime ", "")} {s.size}
                  <span className="block text-[11px] text-muted-foreground">List ${s.listFobUsd} FOB / bottle</span>
                </span>
                <Input
                  type="number"
                  min={0}
                  className="w-24"
                  value={casesBySku[s.sku] ?? 0}
                  onChange={(e) =>
                    setCasesBySku((prev) => ({ ...prev, [s.sku]: Math.max(0, Math.floor(Number(e.target.value) || 0)) }))
                  }
                />
              </div>
            ))}
          </div>
          <Button type="button" disabled={placing} onClick={() => void place()}>
            Submit order
          </Button>
        </div>
      ) : null}

      {loading ? (
        <Loader2 className="mt-8 size-4 animate-spin text-muted-foreground" />
      ) : rows.length === 0 && !formOpen ? (
        <p className="mt-6 max-w-[48ch] text-sm text-muted-foreground">
          Place an order with Hajime Ltd. Hajime will issue the quotation on this file. You do not wait for HQ to open a
          separate commercial file.
        </p>
      ) : rows.length === 0 ? null : (
        <ul className="mt-6 divide-y rounded-xl border border-border bg-card">
          {rows.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-muted/40"
                onClick={() => navigate(`/distributor/international-orders/${r.displayId}`)}
              >
                <span>
                  <span className="font-medium">{r.displayId}</span>
                  <span className="mt-0.5 block text-[12px] text-muted-foreground">
                    {String(r.territory)} · {String(r.stage)}
                  </span>
                </span>
                <span className="font-mono text-[12px]">
                  ${Number(r.subtotalUsd ?? 0).toLocaleString()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </DistributorPage>
  );
}

function BuyerDetail({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<ExportOrderDto | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await getExportOrder(orderId);
    setOrder(res.data);
  }, [orderId]);

  useEffect(() => {
    void load().catch(() => setOrder(null));
  }, [load]);

  const save = async (patch: Record<string, unknown>) => {
    if (!order) return;
    setSaving(true);
    try {
      const res = await patchExportOrder(String(order.displayId), patch);
      setOrder(res.data);
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  if (!order) {
    return (
      <DistributorPage>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </DistributorPage>
    );
  }

  const stageLabel = EXPORT_STAGES.find((s) => s.id === order.stage)?.label ?? String(order.stage);

  return (
    <DistributorPage>
      <DistributorPageHeader
        title={String(order.displayId)}
        rawTitle
        description={`${String(order.buyerCompany)} · ${String(order.territory)} · ${stageLabel}`}
        rawDescription
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/distributor/international-orders">All files</Link>
          </Button>
        }
      />

      <ul className="mb-6 list-disc space-y-1 pl-5 text-[12px] text-muted-foreground">
        {EXPORT_BUYER_TERMS.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <p className="mb-4 text-[12px] text-muted-foreground">
        Wire to {EXPORT_SELLER.bank.accountName}, {EXPORT_SELLER.bank.bankName} ({EXPORT_SELLER.bank.location}).
        Account {EXPORT_SELLER.bank.accountNumber} · Bank {EXPORT_SELLER.bank.bankCode} · Branch{" "}
        {EXPORT_SELLER.bank.branchCode} · SWIFT {EXPORT_SELLER.bank.swift}. {EXPORT_SELLER.wireFees}.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {BUYER_EXPORT_DOC_TYPES.map((k) => {
          const issuedAt = (order.buyerDocStatus as Record<string, { issuedAt?: string | null }> | undefined)?.[k]
            ?.issuedAt;
          return (
            <Button key={k} variant={issuedAt ? "default" : "outline"} size="sm" asChild>
              <Link to={`/distributor/international-orders/${order.displayId}/docs/${k}`}>
                {k.replace(/_/g, " ")}
                {issuedAt ? " · issued" : ""}
              </Link>
            </Button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg">Your order</h2>
          <p className="text-[13px]">
            Quote {String(order.quoteNo)} · PI {String(order.piNo)}
          </p>
          <p className="text-[13px]">
            Total ${Number(order.subtotalUsd ?? 0).toLocaleString()} · Deposit $
            {Number(order.depositDueUsd ?? 0).toLocaleString()} · Balance ${Number(order.balanceDueUsd ?? 0).toLocaleString()}
          </p>
          <p className="text-[13px]">Deposit status: {String(order.depositStatus)}</p>
          <p className="text-[13px]">Balance status: {String(order.balanceStatus)}</p>
        </div>
        <div className="space-y-3 rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg">Your PO &amp; forwarder</h2>
          <div className="space-y-1">
            <Label>Buyer PO</Label>
            <Input
              defaultValue={String(order.buyerPoNo ?? "")}
              key={`po-${order.buyerPoNo}`}
              disabled={saving}
              onBlur={(e) => void save({ buyerPoNo: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Forwarder</Label>
            <Input
              defaultValue={String(order.forwarderName ?? "")}
              key={`fw-${order.forwarderName}`}
              disabled={saving}
              onBlur={(e) => void save({ forwarderName: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Forwarder instructions</Label>
            <Textarea
              defaultValue={String(order.forwarderInstructions ?? "")}
              key={`fi-${order.forwarderInstructions}`}
              disabled={saving}
              onBlur={(e) => void save({ forwarderInstructions: e.target.value })}
            />
          </div>
        </div>
      </div>
    </DistributorPage>
  );
}

function BuyerDoc({ orderId, docType }: { orderId: string; docType: string }) {
  const [order, setOrder] = useState<ExportOrderDto | null>(null);

  useEffect(() => {
    void getExportOrder(orderId).then((r) => setOrder(r.data)).catch(() => setOrder(null));
  }, [orderId]);

  if (!isBuyerExportDoc(docType)) {
    return <p className="p-8 text-sm">This document is not available in the distributor portal.</p>;
  }
  if (!order) return <p className="p-8 text-sm text-muted-foreground">Loading…</p>;

  return (
    <ExportOrderDocView
      order={order}
      doc={docType as ExportDocType}
      backTo={`/distributor/international-orders/${order.displayId}`}
    />
  );
}
