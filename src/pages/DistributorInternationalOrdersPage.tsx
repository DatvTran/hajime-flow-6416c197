import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/contexts/AppDataContext";
import {
  getExportOrder,
  getExportOrders,
  getMySkuPrices,
  patchExportOrder,
  createExportOrder,
  type ExportOrderDto,
} from "@/lib/api-v1";
import {
  BUYER_EXPORT_DOC_TYPES,
  EXPORT_SELLER,
  EXPORT_STAGES,
  formatListFobUsd,
  isBuyerExportDoc,
  listFobCaseUsd,
  priceLines,
  unitFobFromCase,
  type ExportDocType,
  type ExportSkuCode,
} from "@/lib/export-commercial";
import {
  internationalOrderRowsFallback,
  internationalOrderRowsFromCatalog,
  type NegotiatedCaseByCatalogOrExport,
} from "@/lib/export-catalog";
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
  const { products } = useProducts();
  const [rows, setRows] = useState<ExportOrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [territory, setTerritory] = useState("Hong Kong");
  const [destination, setDestination] = useState("Hong Kong");
  const [buyerPoNo, setBuyerPoNo] = useState("");
  const [forwarderName, setForwarderName] = useState("");
  const [casesByExportSku, setCasesByExportSku] = useState<Record<string, number>>({});
  const [negotiatedBySku, setNegotiatedBySku] = useState<NegotiatedCaseByCatalogOrExport>({});
  const navigate = useNavigate();

  const skuRows = useMemo(() => {
    const fromCatalog = internationalOrderRowsFromCatalog(products ?? [], negotiatedBySku);
    return fromCatalog.length > 0 ? fromCatalog : internationalOrderRowsFallback(negotiatedBySku);
  }, [products, negotiatedBySku]);

  const orderPreview = useMemo(() => {
    const lines = skuRows
      .map((row) => {
        const cases = casesByExportSku[row.exportSku] ?? 0;
        if (cases <= 0) return null;
        return {
          sku: row.exportSku as ExportSkuCode,
          cases,
          caseUsd: row.caseListUsd,
          unitFobUsd: unitFobFromCase(row.caseListUsd, row.bottlesPerCase),
        };
      })
      .filter((l): l is { sku: ExportSkuCode; cases: number; caseUsd: number; unitFobUsd: number } => l != null);
    return priceLines(lines);
  }, [skuRows, casesByExportSku]);

  useEffect(() => {
    setCasesByExportSku((prev) => {
      const next: Record<string, number> = {};
      for (const row of skuRows) {
        next[row.exportSku] = prev[row.exportSku] ?? (row.exportSku === "first_press_750" ? 40 : 0);
      }
      return next;
    });
  }, [skuRows]);

  useEffect(() => {
    void getExportOrders()
      .then((r) => {
        const next = r.data || [];
        setRows(next);
        if (next.length === 0) setFormOpen(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void getMySkuPrices()
      .then((sheet) => {
        const map: NegotiatedCaseByCatalogOrExport = {};
        for (const row of sheet.data || []) {
          if (row.sellInSource !== "negotiated") continue;
          const n = Number(row.sellInCasePrice ?? row.sellInCasePriceUsd);
          if (!(n > 0)) continue;
          map[String(row.sku)] = n;
        }
        setNegotiatedBySku(map);
      })
      .catch(() => {
        /* list FOB fallback */
      });
  }, []);

  const place = async () => {
    // Catalog SKU + cases — server applies this distributor's negotiated sell-in × cases.
    const lines = skuRows
      .map((row) => {
        const cases = casesByExportSku[row.exportSku] ?? 0;
        if (cases <= 0) return null;
        return { sku: row.catalogSku, cases };
      })
      .filter((l): l is { sku: string; cases: number } => l != null);
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
            Working {EXPORT_SELLER.workingIncoterm}. Your negotiated USD case sell-in × cases (list FOB if HQ has not set
            one). First Press only — not a Canada retail route order.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Territory / market</Label>
              <Input
                value={territory}
                onChange={(e) => {
                  const next = e.target.value;
                  setTerritory(next);
                  setDestination((prev) => (prev.trim() === "" || prev === territory ? next : prev));
                }}
                placeholder="Hong Kong"
              />
            </div>
            <div className="space-y-1">
              <Label>Destination country</Label>
              <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Hong Kong" />
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
            <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-wide text-muted-foreground">
              <span>Product (HQ catalog)</span>
              <span className="w-[8.5rem] text-right">Cases</span>
            </div>
            {skuRows.map((s) => {
              const cases = casesByExportSku[s.exportSku] ?? 0;
              const caseList = formatListFobUsd(s.caseListUsd);
              const lineTotal = cases > 0 ? s.caseListUsd * cases : 0;
              const priceLabel = s.negotiated ? "Negotiated" : "List FOB";
              return (
                <div key={s.catalogSku} className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="min-w-0">
                    {s.label} {s.size}
                    <span className="block text-[11px] text-muted-foreground">
                      <span className="font-mono">{s.catalogSku}</span>
                      {" · "}
                      {priceLabel} ${formatListFobUsd(s.fobPerBottle ?? s.caseListUsd / s.bottlesPerCase)}{" "}
                      FOB / btl · ${caseList} / case ({s.bottlesPerCase} btls)
                      {cases > 0
                        ? ` · ${cases} cs · $${formatListFobUsd(lineTotal)}`
                        : ""}
                    </span>
                  </span>
                  <Input
                    type="number"
                    min={0}
                    aria-label={`${s.label} ${s.size} cases`}
                    className="w-24 shrink-0"
                    value={cases}
                    onChange={(e) =>
                      setCasesByExportSku((prev) => ({
                        ...prev,
                        [s.exportSku]: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                      }))
                    }
                  />
                </div>
              );
            })}
            {orderPreview.subtotalUsd > 0 ? (
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-[13px]">
                <div className="flex justify-between font-semibold">
                  <span>Order total (FOB USD)</span>
                  <span>${orderPreview.subtotalUsd.toLocaleString()}</span>
                </div>
                <div className="mt-1 flex justify-between text-muted-foreground">
                  <span>Deposit 50%</span>
                  <span>${orderPreview.depositDueUsd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Balance 50%</span>
                  <span>${orderPreview.balanceDueUsd.toLocaleString()}</span>
                </div>
              </div>
            ) : null}
          </div>
          <Button type="button" className="w-full touch-manipulation sm:w-auto" disabled={placing} onClick={() => void place()}>
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
        titleClassName="text-[32px] sm:text-[36px]"
        descriptionClassName="mt-2 max-w-[62ch] text-[16px] leading-relaxed"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/distributor/international-orders">All files</Link>
          </Button>
        }
      />

      <ul className="mb-6 list-disc space-y-2.5 pl-5 text-[16px] leading-relaxed text-muted-foreground">
        {EXPORT_BUYER_TERMS.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <p className="mb-5 text-[18px] font-semibold leading-relaxed text-foreground sm:text-[20px]">
        Wire to {EXPORT_SELLER.bank.accountName}, {EXPORT_SELLER.bank.bankName} ({EXPORT_SELLER.bank.location}).
        Account {EXPORT_SELLER.bank.accountNumber} · Bank {EXPORT_SELLER.bank.bankCode} · Branch{" "}
        {EXPORT_SELLER.bank.branchCode} · SWIFT {EXPORT_SELLER.bank.swift}. {EXPORT_SELLER.wireFees}.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {BUYER_EXPORT_DOC_TYPES.map((k) => {
          const issuedAt = (order.buyerDocStatus as Record<string, { issuedAt?: string | null }> | undefined)?.[k]
            ?.issuedAt;
          return (
            <Button key={k} variant={issuedAt ? "default" : "outline"} size="default" asChild>
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
          <h2 className="font-display text-xl">Your order</h2>
          <p className="text-[16px] leading-relaxed">
            Quote {String(order.quoteNo)} · PI {String(order.piNo)}
          </p>
          <ul className="space-y-2 text-[15px]">
            {(Array.isArray(order.lines) ? order.lines : []).map((raw, i) => {
              const l = raw as Record<string, unknown>;
              const sku = String(l.sku ?? "");
              const cases = Number(l.cases ?? 0);
              const caseUsd =
                l.caseUsd != null
                  ? Number(l.caseUsd)
                  : l.unitFobUsd != null
                    ? Number(l.unitFobUsd) * Number(l.bottlesPerCase ?? 12)
                    : listFobCaseUsd(sku);
              const lineTotal =
                l.lineTotalUsd != null
                  ? Number(l.lineTotalUsd)
                  : Math.round(caseUsd * cases * 100) / 100;
              const label = String(l.product ?? sku);
              const size = String(l.size ?? "");
              return (
                <li key={`${sku}-${i}`} className="flex justify-between gap-3 border-b border-border/60 pb-2">
                  <span className="min-w-0">
                    {cases} cs · {label.replace(/^Hajime\s+/i, "")} {size}
                    <span className="block text-[13px] text-muted-foreground">
                      ${formatListFobUsd(caseUsd)} FOB / case
                    </span>
                  </span>
                  <span className="shrink-0 font-medium">${formatListFobUsd(lineTotal)}</span>
                </li>
              );
            })}
          </ul>
          <p className="text-[16px] font-semibold leading-relaxed">
            Total ${Number(order.subtotalUsd ?? 0).toLocaleString()} · Deposit $
            {Number(order.depositDueUsd ?? 0).toLocaleString()} · Balance $
            {Number(order.balanceDueUsd ?? 0).toLocaleString()}
          </p>
          <p className="text-[16px] leading-relaxed">Deposit status: {String(order.depositStatus)}</p>
          <p className="text-[16px] leading-relaxed">Balance status: {String(order.balanceStatus)}</p>
        </div>
        <div className="space-y-3 rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-xl">Your PO &amp; forwarder</h2>
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
