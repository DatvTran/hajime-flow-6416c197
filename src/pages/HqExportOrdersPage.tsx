import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Loader2, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  createExportOrder,
  getExportOrder,
  getExportOrders,
  patchExportOrder,
  postExportOrderAction,
  type ExportOrderDto,
} from "@/lib/api-v1";
import { getDistributorOrganizations, type DistributorOrganizationRow } from "@/lib/api-v1-mutations";
import { useHqDistilleryCatalogOptions } from "@/hooks/useHqDistilleryCatalogOptions";
import { manufacturerPartnerPath } from "@/lib/hq-manufacturers-metrics";
import {
  CORE_EXPORT_CHECKLIST,
  OPTIONAL_EXPORT_CHECKLIST,
  applyOrderStateToChecklist,
  EXPORT_SELLER,
  EXPORT_SKUS,
  EXPORT_STAGES,
  canAuthorizeProduction,
  canReleaseShipment,
  requiredChecklistReady,
  priceLines,
  type DepositStatus,
  type ExportSkuCode,
} from "@/lib/export-commercial";
import {
  HqBtnLink,
  HqOperatorPage,
  HqOperatorPageHeader,
  HqOperatorPill,
} from "@/components/hq/HqOperatorUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

function canHq(role: string | undefined) {
  return role === "brand_operator" || role === "founder_admin" || role === "operations" || role === "finance";
}

export default function HqExportOrdersPage() {
  const { user } = useAuth();
  const { orderId } = useParams();
  if (!user || !canHq(user.role)) return <Navigate to="/" replace />;
  if (orderId) return <ExportOrderDetail orderId={orderId} />;
  return <ExportOrderList />;
}

function ExportOrderList() {
  const [rows, setRows] = useState<ExportOrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState("");
  const [territory, setTerritory] = useState("");
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getExportOrders();
      setRows(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    if (!company.trim() || !territory.trim()) {
      toast.error("Company and territory are required");
      return;
    }
    try {
      const res = await createExportOrder({
        buyerName: company.trim(),
        buyerCompany: company.trim(),
        territory: territory.trim(),
        lines: [{ sku: "first_press_750", cases: 25 }],
      });
      toast.success("Commercial file opened", { description: res.data.displayId });
      navigate(`/export-orders/${res.data.displayId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create");
    }
  };

  return (
    <HqOperatorPage>
      <HqOperatorPageHeader
        title="International orders"
        description="Hajime Ltd. (Hong Kong) seller file. Distributors place orders in their portal; those files appear here already linked. Expo / HQ can still open a file when the buyer is not in the portal yet."
        actions={
          <HqBtnLink to="/brand-kit" variant="outline">
            Brand kit
          </HqBtnLink>
        }
      />
      <p className="mb-4 text-[12px] text-muted-foreground">
        {EXPORT_SELLER.workingIncoterm}. {EXPORT_SELLER.incotermNote} Floor prices stay on this HQ screen only.
      </p>

      <div className="mb-6 flex flex-wrap items-end gap-2 rounded-xl border border-border bg-card p-4">
        <div className="space-y-1">
          <Label>Buyer company</Label>
          <Input value={company} onChange={(e) => setCompany(e.target.value)} className="w-56" />
        </div>
        <div className="space-y-1">
          <Label>Territory</Label>
          <Input value={territory} onChange={(e) => setTerritory(e.target.value)} className="w-44" />
        </div>
        <Button type="button" onClick={() => void create()}>
          New commercial file
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {loading ? (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No international files yet. A distributor can place an order in their portal, or open a file from an Expo lead
          / the form above.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">File</th>
                <th className="px-3 py-2">Buyer</th>
                <th className="px-3 py-2">Territory</th>
                <th className="px-3 py-2">Origin</th>
                <th className="px-3 py-2">Stage</th>
                <th className="px-3 py-2">USD</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="cursor-pointer border-b last:border-0 hover:bg-muted/30"
                  onClick={() => navigate(`/export-orders/${r.displayId}`)}
                >
                  <td className="px-3 py-2 font-mono text-[12px]">{r.displayId}</td>
                  <td className="px-3 py-2">{String(r.buyerCompany)}</td>
                  <td className="px-3 py-2">{String(r.territory)}</td>
                  <td className="px-3 py-2">
                    {r.origin === "portal" ? (
                      <HqOperatorPill tone="ink">From portal</HqOperatorPill>
                    ) : (
                      <span className="text-muted-foreground">HQ</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {EXPORT_STAGES.find((s) => s.id === r.stage)?.label ?? r.stage}
                  </td>
                  <td className="px-3 py-2">{Number(r.subtotalUsd ?? 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </HqOperatorPage>
  );
}

function lineCases(order: ExportOrderDto): { sku: ExportSkuCode; cases: number; unitFobUsd?: number }[] {
  const lines = Array.isArray(order.lines) ? order.lines : [];
  return lines.map((l: { sku: string; cases: number; unitFobUsd?: number }) => ({
    sku: l.sku as ExportSkuCode,
    cases: Number(l.cases) || 0,
    unitFobUsd: l.unitFobUsd,
  }));
}

function ExportOrderDetail({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<ExportOrderDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [optionalOpen, setOptionalOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getExportOrder(orderId);
      setOrder(res.data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Not found");
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (path: string, body: Record<string, unknown> = {}, method: "POST" | "PATCH" = "POST") => {
    if (!order) return;
    setSaving(true);
    try {
      const res = await postExportOrderAction(String(order.displayId), path, body, method);
      setOrder(res.data);
      toast.success("Updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setSaving(false);
    }
  };

  const save = async (patch: Record<string, unknown>) => {
    if (!order) return;
    setSaving(true);
    try {
      const res = await patchExportOrder(String(order.displayId), patch);
      setOrder(res.data);
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const setLine = (sku: ExportSkuCode, cases: number) => {
    if (!order) return;
    const current = lineCases(order).filter((l) => l.sku !== sku);
    if (cases > 0) current.push({ sku, cases });
    void save({ lines: current });
  };

  if (!order && !error) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading
      </div>
    );
  }
  if (!order) {
    return (
      <HqOperatorPage>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Link to="/export-orders" className="mt-4 text-sm text-accent">
          Back
        </Link>
      </HqOperatorPage>
    );
  }

  const priced = priceLines(lineCases(order));
  const depositStatus = String(order.depositStatus || "pending") as DepositStatus;
  const balanceStatus = String(order.balanceStatus || "pending") as "pending" | "cleared" | "exception";
  const hasDistillery = Boolean(String(order.manufacturerId || order.manufacturerName || "").trim());
  const paOk = canAuthorizeProduction(depositStatus) && hasDistillery;
  const relOk = canReleaseShipment({
    balanceStatus,
    checklistCleared: Boolean(order.checklistCleared),
    fobNamedPoint: order.fobNamedPoint as string,
  });
  const checklist = applyOrderStateToChecklist(
    order.checklist && typeof order.checklist === "object" ? order.checklist : {},
    {
      stage: String(order.stage || ""),
      buyerPoNo: order.buyerPoNo as string | undefined,
      depositStatus: String(order.depositStatus || ""),
    },
  );
  const docsReady = requiredChecklistReady(checklist);
  const coreDone = CORE_EXPORT_CHECKLIST.filter((row) => {
    const st = String(checklist[row.key]?.status || "required");
    return st === "complete" || st === "issued" || st === "na";
  }).length;

  const docs = [
    ["quotation", "Quotation"],
    ["po_acceptance", "PO acceptance"],
    ["proforma", "Pro forma"],
    ["deposit", "Deposit"],
    ["production_auth", "Production auth"],
    ["export_checklist", "Export checklist"],
    ["shipment_release", "Shipment release"],
  ] as const;

  return (
    <HqOperatorPage>
      <HqOperatorPageHeader
        title={String(order.displayId)}
        rawTitle
        description={`${order.buyerCompany} · ${order.territory} · ${EXPORT_SELLER.paymentSummary}${order.origin === "portal" ? " · From portal" : ""}`}
        rawDescription
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/export-orders">All files</Link>
          </Button>
        }
      />

      {priced.lines.some((l) => l.belowFloor) ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            Unit FOB is below the internal floor. Buyer PDFs must not show floor or cost. Pricing outside approved tier
            needs a commercial approver.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-1.5">
        {EXPORT_STAGES.map((s) => (
          <span
            key={s.id}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px]",
              order.stage === s.id ? "border-accent bg-accent/10" : "border-border text-muted-foreground",
            )}
            title={s.owner}
          >
            {s.n} {s.label}
          </span>
        ))}
      </div>
      {order.nextAction ? (
        <p className="mb-4 text-[13px] text-muted-foreground">Next: {String(order.nextAction)}</p>
      ) : null}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={saving} onClick={() => void act("quotation")}>
          Issue quotation
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={saving} onClick={() => void act("buyer-po", { buyerPoNo: order.buyerPoNo })}>
          Record buyer PO
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={saving} onClick={() => void act("acceptance")}>
          Accept PO
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={saving} onClick={() => void act("proforma")}>
          Issue PI
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={saving}
          onClick={() =>
            void act("payments", {
              paymentType: "deposit",
              amountReceived: Number(order.depositDueUsd || 0),
              bankFees: 0,
            })
          }
        >
          Record deposit
        </Button>
        <Button type="button" size="sm" disabled={saving || !paOk} onClick={() => void act("production-authorization")}>
          Authorize production
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={saving} onClick={() => void act("balance-request")}>
          Request balance
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={saving}
          onClick={() =>
            void act("payments", {
              paymentType: "balance",
              amountReceived: Number(order.balanceDueUsd || 0),
              bankFees: 0,
            })
          }
        >
          Record balance
        </Button>
        <Button type="button" size="sm" disabled={saving} onClick={() => void act("release")}>
          Release shipment
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={saving}
          onClick={() => void act("handover", { transportReference: String(order.forwarderInstructions || "BL pending") })}
        >
          Confirm handover
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={saving} onClick={() => void act("close")}>
          Close
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {docs.map(([k, lab]) => (
          <HqBtnLink key={k} to={`/export-orders/${order.displayId}/docs/${k}`} variant="outline" size="sm">
            {lab}
          </HqBtnLink>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg">Buyer (Hajime Ltd. counterparty)</h2>
          <Field label="Company" value={String(order.buyerCompany ?? "")} onBlur={(v) => void save({ buyerCompany: v })} />
          <Field label="Contact" value={String(order.buyerName ?? "")} onBlur={(v) => void save({ buyerName: v })} />
          <Field label="Email" value={String(order.buyerEmail ?? "")} onBlur={(v) => void save({ buyerEmail: v })} />
          <Field label="Territory" value={String(order.territory ?? "")} onBlur={(v) => void save({ territory: v })} />
          <Field label="Buyer PO" value={String(order.buyerPoNo ?? "")} onBlur={(v) => void save({ buyerPoNo: v })} />
          <div className="space-y-1">
            <Label>Portal access (distributor org)</Label>
            <OrgPicker
              value={String(order.distributorOrgId ?? "")}
              onChange={(v) => void save({ distributorOrgId: v || null })}
            />
            <p className="text-[11px] text-muted-foreground">
              {order.origin === "portal"
                ? "Linked automatically when this distributor placed the order. No second attach step."
                : "Links this file to a logged-in distributor portal. Does not create a CRM account. Prefer inviting the buyer and letting them place the order."}
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Quote {String(order.quoteNo)} · PI {String(order.piNo)} · Exclusivity is never implied by this file.
          </p>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg">FOB lines (USD)</h2>
          {EXPORT_SKUS.map((s) => {
            const line = priced.lines.find((l) => l.sku === s.sku);
            return (
              <div key={s.sku} className="flex items-center justify-between gap-2 text-[13px]">
                <span className="min-w-0 flex-1">
                  {s.product.replace("Hajime ", "")} {s.size}
                  <span className="block text-[11px] text-muted-foreground">
                    Target {s.listFobUsd} · floor {s.floorFobUsd} (HQ only)
                  </span>
                </span>
                <Input
                  type="number"
                  className="w-20"
                  defaultValue={line?.cases ?? 0}
                  onBlur={(e) => setLine(s.sku, Number(e.target.value) || 0)}
                />
              </div>
            );
          })}
          <p className="text-[13px]">
            Subtotal ${priced.subtotalUsd.toLocaleString()} · Deposit ${priced.depositDueUsd.toLocaleString()} · Balance $
            {priced.balanceDueUsd.toLocaleString()} · {priced.tier.label} tier
          </p>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg">Money gates</h2>
          <Label>Deposit (read-only — record via payments)</Label>
          <p className="text-[13px]">{depositStatus}</p>
          <Field
            label="Deposit received USD (notes)"
            value={String(order.depositReceivedUsd ?? "")}
            onBlur={(v) => void save({ depositRef: v })}
          />
          <HqOperatorPill tone={paOk ? "green" : "red"}>
            {paOk
              ? "May authorize production"
              : hasDistillery
                ? "Hold production"
                : "Pick a distillery to authorize"}
          </HqOperatorPill>
          <Label>Final balance</Label>
          <p className="text-[13px]">{balanceStatus}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={saving}
            onClick={() =>
              void act("exceptions", {
                kind: "deposit_waived",
                reason: "HQ documented exception",
                shortfall: 0,
              })
            }
          >
            Approve gate exception
          </Button>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg">Thailand + forwarder</h2>
          <DistilleryPicker
            manufacturerId={String(order.manufacturerId ?? "")}
            manufacturerName={String(order.manufacturerName ?? "")}
            onChange={(id, name) => void save({ manufacturerId: id || null, manufacturerName: name || null })}
          />
          <Field
            label="FOB named port / terminal"
            value={String(order.fobNamedPoint ?? "")}
            onBlur={(v) => void save({ fobNamedPoint: v })}
          />
          <Field label="Forwarder" value={String(order.forwarderName ?? "")} onBlur={(v) => void save({ forwarderName: v })} />
          <Field
            label="Forwarder instructions"
            value={String(order.forwarderInstructions ?? "")}
            onBlur={(v) => void save({ forwarderInstructions: v })}
            area
          />
          <HqOperatorPill tone={relOk ? "green" : "amber"}>
            {relOk ? "Release conditions met" : "Release blocked until balance, checklist, named FOB"}
          </HqOperatorPill>
        </div>
      </div>

      <div className="mt-6 space-y-4 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg">Documents</h2>
            <p className="text-[12px] text-muted-foreground">
              Ops checklist only. Import stays with the buyer. {coreDone}/{CORE_EXPORT_CHECKLIST.length} Hajime items
              ready.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant={order.checklistCleared ? "outline" : "default"}
            disabled={saving || (!order.checklistCleared && !docsReady)}
            onClick={() => void save({ checklist, checklistCleared: !order.checklistCleared })}
          >
            {order.checklistCleared ? "Docs ready" : "Mark docs ready"}
          </Button>
        </div>
        <ul className="divide-y divide-border/60">
          {CORE_EXPORT_CHECKLIST.map((row) => (
            <ChecklistRow
              key={row.key}
              label={row.label}
              status={String(checklist[row.key]?.status || "required")}
              disabled={saving}
              onChange={(status) => {
                const next = { ...checklist, [row.key]: { ...checklist[row.key], status } };
                void save({ checklist: next });
              }}
            />
          ))}
        </ul>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-lg border border-border/70 px-3 py-2 text-left text-[13px]"
          onClick={() => setOptionalOpen((v) => !v)}
        >
          <span>If destination requires it ({OPTIONAL_EXPORT_CHECKLIST.length})</span>
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", optionalOpen && "rotate-180")} />
        </button>
        {optionalOpen ? (
          <ul className="divide-y divide-border/60 rounded-lg border border-border/50 px-1">
            {OPTIONAL_EXPORT_CHECKLIST.map((row) => (
              <ChecklistRow
                key={row.key}
                label={row.label}
                status={String(checklist[row.key]?.status || "na")}
                disabled={saving}
                onChange={(status) => {
                  const next = { ...checklist, [row.key]: { ...checklist[row.key], status } };
                  void save({ checklist: next });
                }}
              />
            ))}
          </ul>
        ) : null}
      </div>
    </HqOperatorPage>
  );
}

function ChecklistRow({
  label,
  status,
  disabled,
  onChange,
}: {
  label: string;
  status: string;
  disabled?: boolean;
  onChange: (status: string) => void;
}) {
  const ready = status === "issued" || status === "complete" || status === "na";
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <span className="min-w-0 text-[13px] font-medium">{label}</span>
      <select
        className={cn(
          "shrink-0 rounded-md border bg-background px-2 py-1 text-[12px]",
          ready ? "border-accent/40 text-foreground" : "border-border text-muted-foreground",
        )}
        value={status}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="required">Needed</option>
        <option value="issued">Done</option>
        <option value="na">N/A</option>
      </select>
    </li>
  );
}

function DistilleryPicker({
  manufacturerId,
  manufacturerName,
  onChange,
}: {
  manufacturerId: string;
  manufacturerName: string;
  onChange: (id: string, name: string) => void;
}) {
  const distilleries = useHqDistilleryCatalogOptions();
  const known = distilleries.some((d) => d.id === manufacturerId);
  return (
    <div className="space-y-1">
      <Label>Distillery</Label>
      <select
        className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
        value={manufacturerId}
        onChange={(e) => {
          const id = e.target.value;
          const name = distilleries.find((d) => d.id === id)?.name || "";
          onChange(id, name);
        }}
      >
        <option value="">Select distillery</option>
        {manufacturerId && manufacturerName && !known ? (
          <option value={manufacturerId}>{manufacturerName}</option>
        ) : null}
        {distilleries.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
      {manufacturerId ? (
        <Link
          to={manufacturerPartnerPath(manufacturerId)}
          className="inline-block text-[11px] text-accent no-underline hover:underline"
        >
          Open distillery in Network
        </Link>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Same partners as Network → Distilleries. Required before authorizing production.
        </p>
      )}
    </div>
  );
}

function OrgPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [orgs, setOrgs] = useState<DistributorOrganizationRow[]>([]);
  useEffect(() => {
    void getDistributorOrganizations()
      .then((r) => setOrgs(r.data || []))
      .catch(() => setOrgs([]));
  }, []);
  return (
    <select
      className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Not linked — buyer cannot see this file</option>
      {orgs.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  );
}

function Field({
  label,
  value,
  onBlur,
  area,
}: {
  label: string;
  value: string;
  onBlur: (v: string) => void;
  area?: boolean;
}) {
  const Comp = area ? Textarea : Input;
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Comp defaultValue={value} key={label + value} onBlur={(e) => onBlur(e.target.value)} />
    </div>
  );
}
