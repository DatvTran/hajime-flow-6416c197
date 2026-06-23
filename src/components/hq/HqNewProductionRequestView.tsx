import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import type { PurchaseOrder } from "@/data/mockData";
import { useAccounts, useProducts, useAppData } from "@/contexts/AppDataContext";
import { activeDestinationWarehouses } from "@/lib/po-destination-warehouse";
import { findAccountForManufacturerPick } from "@/lib/manufacturer-account-nav";
import { getPurchaseOrderManufacturerOptions } from "@/lib/api-v1-mutations";
import { simulateLedgerCommit } from "@/lib/ledger";
import { kuraShortName } from "@/lib/hq-product-development-display";
import {
  addDaysISO,
  buildPurchaseOrderFromForm,
  casesFromBottles,
  distributorAccountsForSalesPo,
  FALLBACK_MANUFACTURER_NAMES,
  PO_STATUSES,
  PO_TYPES,
  todayISO,
  type PoManufacturerOption,
} from "@/lib/new-purchase-order-form";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/components/ui/sonner";
import {
  HqBtn,
  HqBtnLink,
  HqOperatorCard,
  HqOperatorPage,
  HqOperatorPageHeader,
} from "@/components/hq/HqOperatorUi";

type Props = {
  existing: PurchaseOrder[];
  onCreate: (po: PurchaseOrder) => Promise<{ success: boolean }>;
  prefill?: { sku?: string; quantity?: string } | null;
  userRole?: string;
  distributorAccountId?: string;
};

export function HqNewProductionRequestView({
  existing,
  onCreate,
  prefill,
  userRole = "brand_operator",
  distributorAccountId,
}: Props) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data } = useAppData();
  const { products } = useProducts();
  const { accounts } = useAccounts();

  const defaultPoType: PurchaseOrder["poType"] = userRole === "distributor" ? "sales" : "production";
  const canChangePoType =
    userRole === "brand_operator" || userRole === "operations" || userRole === "founder_admin";

  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdPoId, setCreatedPoId] = useState("");

  const [poType, setPoType] = useState<NonNullable<PurchaseOrder["poType"]>>(defaultPoType);
  const [manufacturerChoices, setManufacturerChoices] = useState<PoManufacturerOption[]>(() =>
    FALLBACK_MANUFACTURER_NAMES.map((label, i) => ({
      key: `fallback:${i}`,
      label,
      crmMemberId: null,
      hasProfile: false,
    })),
  );
  const [manufacturerKey, setManufacturerKey] = useState("fallback:0");
  const [manufacturerPickerHasCrm, setManufacturerPickerHasCrm] = useState(false);
  const [issueDate, setIssueDate] = useState(todayISO());
  const [requiredDate, setRequiredDate] = useState(addDaysISO(30));
  const [requestedShipDate, setRequestedShipDate] = useState(addDaysISO(35));
  const [sku, setSku] = useState(products[0]?.sku ?? "HJM-OG-750");
  const [quantity, setQuantity] = useState("1200");
  const [packagingInstructions, setPackagingInstructions] = useState("Standard 12-bottle case");
  const [labelVersion, setLabelVersion] = useState("v3.1");
  const [marketDestination, setMarketDestination] = useState("Toronto Main Warehouse");
  const [status, setStatus] = useState<PurchaseOrder["status"]>("draft");
  const [notes, setNotes] = useState("");
  const [selectedDistributorId, setSelectedDistributorId] = useState(distributorAccountId || "");

  const destinationWarehouses = useMemo(
    () => activeDestinationWarehouses(data.warehouses),
    [data.warehouses],
  );

  const salesPoAccounts = useMemo(() => distributorAccountsForSalesPo(accounts), [accounts]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.sku === sku) ?? null,
    [products, sku],
  );

  useEffect(() => {
    const defaultSku = products[0]?.sku ?? "HJM-OG-750";
    setSku(prefill?.sku && products.some((p) => p.sku === prefill.sku) ? prefill.sku : defaultSku);
    setQuantity(prefill?.quantity ?? "1200");
    setNotes(prefill?.sku ? `Replenishment suggestion for ${prefill.sku}` : "");
    setSelectedDistributorId(distributorAccountId || "");
  }, [products, prefill, distributorAccountId]);

  useEffect(() => {
    if (destinationWarehouses.length === 0) return;
    if (!destinationWarehouses.some((w) => w.name === marketDestination)) {
      setMarketDestination(destinationWarehouses[0].name);
    }
  }, [destinationWarehouses, marketDestination]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = (await getPurchaseOrderManufacturerOptions()) as { data?: PoManufacturerOption[] };
        const rows = Array.isArray(res.data) ? res.data : [];
        if (cancelled) return;
        if (rows.length > 0) {
          setManufacturerChoices(rows);
          setManufacturerKey(rows[0].key);
          setManufacturerPickerHasCrm(rows.some((r) => Boolean(r.crmMemberId)));
        }
      } catch {
        /* keep fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (manufacturerChoices.length === 0) return;
    if (!manufacturerChoices.some((c) => c.key === manufacturerKey)) {
      setManufacturerKey(manufacturerChoices[0].key);
    }
  }, [manufacturerChoices, manufacturerKey]);

  const manufacturerDisplayLabel =
    manufacturerChoices.find((c) => c.key === manufacturerKey)?.label ?? FALLBACK_MANUFACTURER_NAMES[0];

  const bottleQty = Math.max(1, Math.round(Number(quantity) || 0));
  const caseSize = selectedProduct?.caseSize ?? 12;
  const cases = casesFromBottles(bottleQty, caseSize);

  const summaryRows = useMemo(
    () => [
      {
        label: "SKU",
        value: selectedProduct ? `${selectedProduct.sku} — ${selectedProduct.name}` : sku || "—",
      },
      { label: "Quantity", value: `${cases.toLocaleString()} cases (${bottleQty.toLocaleString()} bottles)` },
      { label: "Kura", value: kuraShortName(manufacturerDisplayLabel) },
      { label: "Destination", value: marketDestination || "—" },
      { label: "Target completion", value: requiredDate || "—" },
      { label: "Ship by", value: requestedShipDate || "—" },
      { label: "PO type", value: poType === "sales" ? "Sales PO" : "Production PO" },
    ],
    [
      selectedProduct,
      sku,
      cases,
      bottleQty,
      manufacturerDisplayLabel,
      marketDestination,
      requiredDate,
      requestedShipDate,
      poType,
    ],
  );

  const handleSubmit = async () => {
    if (!sku.trim() || products.length === 0) {
      toast.error(t("Select a SKU"), {
        description: t("Add products under Product catalog if the list is empty."),
      });
      return;
    }

    if (poType === "sales" && !selectedDistributorId && userRole === "brand_operator") {
      toast.error(t("Select distributor account"), {
        description: t("Sales POs must specify which distributor is ordering."),
      });
      return;
    }

    const po = buildPurchaseOrderFromForm(
      {
        poType,
        manufacturerKey,
        manufacturerDisplayLabel,
        issueDate,
        requiredDate,
        requestedShipDate,
        sku,
        quantity,
        packagingInstructions,
        labelVersion,
        marketDestination,
        status,
        notes,
        selectedDistributorId,
      },
      existing,
      { distributorAccountId },
    );

    setSubmitting(true);
    try {
      await simulateLedgerCommit({ type: "po_create", poId: po.id, sku: po.sku, quantity: po.quantity });
      const res = await onCreate(po);
      if (!res.success) return;

      setCreatedPoId(po.id);
      setShowSuccess(true);

      const hqProductionNavRoles = ["brand_operator", "founder_admin", "operations"];
      if (poType === "production" && hqProductionNavRoles.includes(userRole)) {
        const selected = manufacturerChoices.find((c) => c.key === manufacturerKey);
        const linked = findAccountForManufacturerPick(
          accounts,
          selected ? { label: selected.label, email: selected.email } : undefined,
        );
        if (linked) {
          sessionStorage.setItem("hq_po_success_nav", `/accounts?account=${encodeURIComponent(linked.id)}`);
        } else {
          sessionStorage.setItem(
            "hq_po_success_nav",
            `/purchase-orders?po=${encodeURIComponent(po.id)}`,
          );
        }
      } else {
        sessionStorage.setItem("hq_po_success_nav", `/purchase-orders?po=${encodeURIComponent(po.id)}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const finishSuccess = () => {
    const target = sessionStorage.getItem("hq_po_success_nav") ?? "/purchase-orders";
    sessionStorage.removeItem("hq_po_success_nav");
    navigate(target);
  };

  return (
    <HqOperatorPage className="space-y-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <Link
          to="/purchase-orders"
          className="hq-btn hq-btn-outline hq-btn-sm inline-flex items-center gap-1.5 no-underline"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.75} />
          {t("Production requests")}
        </Link>
        <span className="text-xs text-muted-foreground">/ {t("New request")}</span>
      </div>

      <HqOperatorPageHeader
        title="New production request"
        description="Commission a batch from a kura partner. They confirm spec and schedule it into their brew calendar."
      />

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          {canChangePoType ? (
            <HqOperatorCard className="hq-settings-panel">
              <div className="hq-settings-title">{t("Order type")}</div>
              <div className="hq-form-group mb-0">
                <label htmlFor="po-type">{t("PO type")}</label>
                <select
                  id="po-type"
                  value={poType}
                  onChange={(e) => setPoType(e.target.value as NonNullable<PurchaseOrder["poType"]>)}
                  disabled={submitting}
                  className="hq-form-select"
                >
                  {PO_TYPES.map((row) => (
                    <option key={row.value} value={row.value}>
                      {row.label} — {row.description}
                    </option>
                  ))}
                </select>
              </div>
            </HqOperatorCard>
          ) : null}

          {poType === "sales" && userRole === "brand_operator" ? (
            <HqOperatorCard className="hq-settings-panel">
              <div className="hq-settings-title">{t("Distributor")}</div>
              <div className="hq-form-group mb-0">
                <label htmlFor="po-distributor">{t("Distributor account")}</label>
                <select
                  id="po-distributor"
                  value={selectedDistributorId}
                  onChange={(e) => setSelectedDistributorId(e.target.value)}
                  disabled={submitting}
                  className="hq-form-select"
                >
                  <option value="">{t("Select distributor…")}</option>
                  {salesPoAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.tradingName || a.legalName}
                    </option>
                  ))}
                </select>
              </div>
            </HqOperatorCard>
          ) : null}

          <HqOperatorCard className="hq-settings-panel">
            <div className="hq-settings-title">{t("Product & quantity")}</div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="hq-form-group mb-0 sm:col-span-2">
                <label htmlFor="po-sku">{t("SKU to produce")}</label>
                {products.length === 0 ? (
                  <p className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-[13px] text-muted-foreground">
                    {t("No products yet.")}{" "}
                    <Link to="/inventory/add" className="font-medium text-accent underline-offset-2 hover:underline">
                      {t("Add SKU")}
                    </Link>
                  </p>
                ) : (
                  <select
                    id="po-sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    disabled={submitting}
                    className="hq-form-select font-mono text-[13px]"
                  >
                    {products.map((p) => (
                      <option key={p.sku} value={p.sku}>
                        {p.sku} — {p.name} {p.size}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="hq-form-group mb-0">
                <label htmlFor="po-qty">{t("Quantity (bottles)")}</label>
                <input
                  id="po-qty"
                  type="number"
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="hq-form-group mb-0">
                <label htmlFor="po-status">{t("Initial status")}</label>
                <select
                  id="po-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PurchaseOrder["status"])}
                  disabled={submitting}
                  className="hq-form-select capitalize"
                >
                  {PO_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("-", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hq-form-group mb-0 sm:col-span-2">
                <label htmlFor="po-pack">{t("Packaging instructions")}</label>
                <input
                  id="po-pack"
                  value={packagingInstructions}
                  onChange={(e) => setPackagingInstructions(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="hq-form-group mb-0">
                <label htmlFor="po-label">{t("Label version")}</label>
                <input
                  id="po-label"
                  value={labelVersion}
                  onChange={(e) => setLabelVersion(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
          </HqOperatorCard>

          <HqOperatorCard className="hq-settings-panel">
            <div className="hq-settings-title">{t("Assignment & timing")}</div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="hq-form-group mb-0 sm:col-span-2">
                <label htmlFor="po-kura">{t("Assign to kura")}</label>
                <select
                  id="po-kura"
                  value={manufacturerKey}
                  onChange={(e) => setManufacturerKey(e.target.value)}
                  disabled={submitting}
                  className="hq-form-select"
                >
                  {manufacturerChoices.map((row) => (
                    <option key={row.key} value={row.key}>
                      {row.label}
                    </option>
                  ))}
                </select>
                {manufacturerPickerHasCrm ? (
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {t("Contacts from Settings → CRM. Profile company names are preferred when the email matches.")}
                  </p>
                ) : manufacturerChoices.some((c) => c.key.startsWith("fallback:")) ? (
                  <p className="mt-1.5 text-[11px] text-[hsl(30_80%_34%)]">
                    {t("No manufacturer CRM contacts loaded — using demo kura name.")}
                  </p>
                ) : null}
              </div>
              <div className="hq-form-group mb-0">
                <label htmlFor="po-issue">{t("Issue date")}</label>
                <input
                  id="po-issue"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="hq-form-group mb-0">
                <label htmlFor="po-req">{t("Target completion")}</label>
                <input
                  id="po-req"
                  type="date"
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="hq-form-group mb-0">
                <label htmlFor="po-ship">{t("Requested ship date")}</label>
                <input
                  id="po-ship"
                  type="date"
                  value={requestedShipDate}
                  onChange={(e) => setRequestedShipDate(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="hq-form-group mb-0">
                <label htmlFor="po-dest">{t("Destination warehouse")}</label>
                <select
                  id="po-dest"
                  value={marketDestination}
                  onChange={(e) => setMarketDestination(e.target.value)}
                  disabled={submitting}
                  className="hq-form-select"
                >
                  {(destinationWarehouses.length > 0
                    ? destinationWarehouses
                    : [{ id: "fallback", name: "Toronto Main Warehouse", isActive: true, sortOrder: 0 }]
                  ).map((w) => (
                    <option key={w.id} value={w.name}>
                      {w.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {t("Same locations as Settings → Warehouses. Inventory receipts map here when the PO is delivered.")}
                </p>
              </div>
            </div>
          </HqOperatorCard>

          <HqOperatorCard className="hq-settings-panel">
            <div className="hq-settings-title">{t("Notes for the kura")}</div>
            <div className="hq-form-group mb-0">
              <label htmlFor="po-notes">{t("Spec details & requirements")}</label>
              <textarea
                id="po-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("Spec details, quality holds, tasting requirements…")}
                rows={4}
                disabled={submitting}
              />
            </div>
          </HqOperatorCard>
        </div>

        <div className="flex flex-col gap-3.5">
          <HqOperatorCard className="sticky top-5 p-5">
            <div className="mb-3.5 border-b border-border/50 pb-3 text-sm font-semibold">
              {t("Request summary")}
            </div>
            <div className="space-y-0">
              {summaryRows.map((row, i) => (
                <div
                  key={row.label}
                  className="flex justify-between gap-3 py-1.5 text-[13px]"
                  style={
                    i < summaryRows.length - 1
                      ? { borderBottom: "1px solid hsl(var(--border) / 0.3)" }
                      : undefined
                  }
                >
                  <span className="text-muted-foreground">{t(row.label)}</span>
                  <span className="max-w-[58%] truncate text-right font-medium">{row.value}</span>
                </div>
              ))}
            </div>
            <HqBtn
              type="button"
              variant="accent"
              className="mt-4 h-[42px] w-full"
              disabled={submitting || products.length === 0}
              onClick={() => void handleSubmit()}
            >
              {submitting
                ? t("Sending…")
                : poType === "sales"
                  ? t("Create sales PO")
                  : t("Send request to kura")}
            </HqBtn>
            <HqBtnLink to="/purchase-orders" variant="outline" className="mt-2 w-full justify-center">
              {t("Cancel")}
            </HqBtnLink>
          </HqOperatorCard>

          <div className="rounded-[14px] border border-[hsl(280_40%_50%/0.2)] bg-[hsl(280_40%_50%/0.06)] p-4 text-xs leading-relaxed text-[hsl(280_30%_42%)]">
            <strong className="text-[hsl(280_40%_44%)]">{t("Next:")}</strong>{" "}
            {t(
              "the kura confirms spec and schedules the batch. You'll see it appear under Production requests once submitted.",
            )}
          </div>
        </div>
      </div>

      {showSuccess ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[hsl(24_12%_8%/0.5)] p-4 backdrop-blur-sm">
          <div className="w-full max-w-[380px] rounded-[18px] border border-border bg-card p-8 text-center shadow-[var(--shadow-float)]">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[hsl(158_56%_36%/0.12)] text-[hsl(158_56%_32%)]">
              <Check className="size-7" strokeWidth={1.75} />
            </div>
            <div className="font-display text-xl font-semibold tracking-[-0.01em]">{t("Request sent")}</div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              {createdPoId
                ? `${createdPoId} ${t("sent to")} ${kuraShortName(manufacturerDisplayLabel)}. ${t("You'll be notified once they confirm the spec and schedule the batch.")}`
                : t("Your production request was sent to the kura partner.")}
            </p>
            <HqBtn variant="accent" size="sm" className="mt-5" onClick={finishSuccess}>
              {t("Back to production requests")}
            </HqBtn>
          </div>
        </div>
      ) : null}
    </HqOperatorPage>
  );
}
