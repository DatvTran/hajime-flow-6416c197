import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData } from "@/contexts/AppDataContext";
import {
  createShipment,
  getOrderReceivingWarehouses,
  type OrderReceivingWarehousesData,
} from "@/lib/api-v1-mutations";
import { getOrder, type Order, type OrderItem } from "@/lib/api-v1";
import { isDistributorAccountType } from "@/lib/distributor-accounts";
import { toast } from "@/components/ui/sonner";
import type { Account, SalesOrder } from "@/data/mockData";
import type { TeamMember, Warehouse } from "@/types/app-data";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isoDateEndOfDay(dateYmd: string): string {
  const d = new Date(`${dateYmd}T23:59:59`);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function lineStableKey(it: OrderItem, idx: number): string {
  const id = it.id != null ? String(it.id).trim() : "";
  return id !== "" ? `id:${id}` : `idx:${idx}:${it.sku}`;
}

function caseSizeFromCatalog(
  products: { sku: string; caseSize: number }[] | undefined,
  sku: string,
): number {
  const p = (products ?? []).find((x) => x.sku === sku);
  const n = Number(p?.caseSize);
  return Number.isFinite(n) && n > 0 ? n : 12;
}

function normalizeLabelPart(s: string | undefined): string {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function labelsLikelySame(a: string | undefined, b: string | undefined): boolean {
  const x = normalizeLabelPart(a);
  const y = normalizeLabelPart(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const min = 4;
  if (x.length < min || y.length < min) return false;
  return x.includes(y) || y.includes(x);
}

type CommercialAccountHints = {
  email?: string;
  tradingName?: string;
  legalName?: string;
  contactName?: string;
};

/**
 * CRM distributors for this wholesale account — **exact account email wins** over fuzzy name overlap.
 * Mirrors server `/orders/:id/receiving-warehouses` logic.
 */
function matchedDistributorsForCommercialAccount(
  teamMembers: TeamMember[] | undefined,
  hints: CommercialAccountHints,
  orderAccountTradingLabel: string | undefined,
): TeamMember[] {
  const distributors = (teamMembers ?? []).filter((tm) => tm.role === "distributor");
  const ae = normalizeLabelPart(hints.email);
  if (ae) {
    const emailHits = distributors.filter((tm) => normalizeLabelPart(tm.email) === ae);
    if (emailHits.length > 0) return emailHits;
  }
  const nameHints = [
    hints.tradingName,
    hints.legalName,
    hints.contactName,
    orderAccountTradingLabel,
  ].filter((x): x is string => normalizeLabelPart(x).length > 0);

  return distributors.filter((tm) =>
    nameHints.some((h) => labelsLikelySame(tm.displayName, h)),
  );
}

/** Hajime pool only: exclude CRM-linked depots + account-linked locations + distributor primaries. */
function isBrandShipFromWarehouse(w: Warehouse, distributorTeamMembers: TeamMember[]): boolean {
  if (w.linkedTeamMemberId != null && String(w.linkedTeamMemberId).trim() !== "") return false;
  if (w.linkedAccountId != null && String(w.linkedAccountId).trim() !== "") return false;
  if (
    distributorTeamMembers.some(
      (tm) =>
        tm.role === "distributor" &&
        tm.primaryWarehouseId != null &&
        String(tm.primaryWarehouseId).trim() === String(w.id).trim(),
    )
  ) {
    return false;
  }
  return true;
}

type CrmDepotMatchRow = {
  id: string;
  name: string;
  email: string;
  primaryWarehouseId?: string;
};

function crmRowsFromServerPayload(d: OrderReceivingWarehousesData): CrmDepotMatchRow[] {
  return (d.matched_crm_display ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    ...(m.primary_warehouse_id ? { primaryWarehouseId: m.primary_warehouse_id } : {}),
  }));
}

function crmRowsFromTeamMembers(tms: TeamMember[]): CrmDepotMatchRow[] {
  return tms.map((tm) => ({
    id: tm.id,
    name: tm.displayName,
    email: tm.email,
    ...(tm.primaryWarehouseId ? { primaryWarehouseId: tm.primaryWarehouseId } : {}),
  }));
}

function distributorSalesOrderDropdownLabel(order: SalesOrder, accounts: Account[] | undefined): string {
  const acc = accounts?.find((a) => String(a.id) === String(order.accountId));
  const wholesale = (
    acc?.tradingName ||
    acc?.legalName ||
    acc?.name ||
    order.account
  ).trim();
  const mail = acc?.email?.trim();
  return `${order.orderNumber ?? order.id} · Wholesale: ${wholesale}${mail ? ` · ${mail}` : ""}`;
}

/** One line per receiving depot tying physical depot name to distributor account + CRM where known. */
function receivingDepotDropdownLabel(
  w: Warehouse,
  wholesale: { trading: string; email?: string },
  crmRows: CrmDepotMatchRow[],
  teamMemberById: Map<string, TeamMember>,
): string {
  const accLabel = wholesale.email
    ? `${wholesale.trading} (${wholesale.email})`
    : wholesale.trading;

  const tmId = w.linkedTeamMemberId != null ? String(w.linkedTeamMemberId).trim() : "";
  if (tmId) {
    const tm = teamMemberById.get(tmId);
    if (tm && tm.role === "distributor") {
      return `${w.name} — ${accLabel} · CRM ${tm.displayName} <${tm.email}>`;
    }
    const fromApi = crmRows.find((r) => String(r.id) === tmId);
    if (fromApi) {
      return `${w.name} — ${accLabel} · CRM ${fromApi.name} <${fromApi.email}>`;
    }
  }

  const primaryRow = crmRows.find((r) => r.primaryWarehouseId === w.id);
  if (primaryRow) {
    return `${w.name} — ${accLabel} · CRM primary ${primaryRow.name} <${primaryRow.email}>`;
  }

  if (crmRows.length === 1) {
    const r = crmRows[0];
    return `${w.name} — ${accLabel} · CRM ${r.name} <${r.email}>`;
  }

  return `${w.name} — ${accLabel}`;
}

export function RecordDistributorOutboundShipmentDialog({ open, onOpenChange }: Props) {
  const { data, refreshShipments } = useAppData();
  const [orderId, setOrderId] = useState<string>("");
  const [orderDetail, setOrderDetail] = useState<Order | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [serverReceivingDepots, setServerReceivingDepots] =
    useState<OrderReceivingWarehousesData | null>(null);
  const [loadingReceivingDepots, setLoadingReceivingDepots] = useState(false);
  const [depotsResolveError, setDepotsResolveError] = useState<string | null>(null);

  const [originWarehouseId, setOriginWarehouseId] = useState<string>("");
  const [destWarehouseId, setDestWarehouseId] = useState<string>("");
  const [shipAt, setShipAt] = useState(() => toDatetimeLocalValue(new Date()));
  const [etaDate, setEtaDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");
  const [busy, setBusy] = useState(false);
  /** Integer case counts per order line — quantity stored on shipment is bottles = cases × case size. */
  const [casesByLine, setCasesByLine] = useState<Record<string, string>>({});

  const warehouses = useMemo(
    () => (data.warehouses ?? []).filter((w) => w.isActive !== false).sort((a, b) => a.sortOrder - b.sortOrder),
    [data.warehouses],
  );

  const distributorTeamMembers = useMemo(
    () => (data.teamMembers ?? []).filter((m) => m.role === "distributor"),
    [data.teamMembers],
  );

  /** Brand / inventory pool origins only — not distributor DCs or retailer-linked docks. */
  const hasBrandOutboundOriginWarehouse = useMemo(
    () => warehouses.some((w) => isBrandShipFromWarehouse(w, distributorTeamMembers)),
    [distributorTeamMembers, warehouses],
  );

  const originWarehouses = useMemo(() => {
    const brand = warehouses.filter((w) => isBrandShipFromWarehouse(w, distributorTeamMembers));
    if (brand.length > 0) return brand;
    return warehouses;
  }, [distributorTeamMembers, warehouses]);

  const eligibleOrders = useMemo(() => {
    const orders = data.salesOrders ?? [];
    const accounts = data.accounts ?? [];
    return orders.filter((o) => {
      const pk = Number(o.id);
      if (!Number.isFinite(pk) || pk <= 0) return false;
      const aid = String(o.accountId ?? "").trim();
      if (!aid) return false;
      const acc = accounts.find((a) => String(a.id) === aid);
      if (!acc || !isDistributorAccountType(acc.type)) return false;
      const st = String(o.status ?? "").toLowerCase();
      return st === "confirmed" || st === "packed";
    });
  }, [data.accounts, data.salesOrders]);

  const selectedOrderRow = useMemo(
    () => eligibleOrders.find((o) => o.id === orderId),
    [eligibleOrders, orderId],
  );

  const accountIdForOrder = String(selectedOrderRow?.accountId ?? orderDetail?.account_id ?? "").trim();

  const accountForOrder = useMemo(() => {
    if (!accountIdForOrder) return undefined;
    return (data.accounts ?? []).find((a) => String(a.id) === accountIdForOrder);
  }, [accountIdForOrder, data.accounts]);

  const orderCommercialLabel = [
    orderDetail?.account_trading_name,
    orderDetail?.account_name,
    selectedOrderRow?.account,
  ].find((x) => typeof x === "string" && normalizeLabelPart(x).length > 0);

  const commercialHints = useMemo((): CommercialAccountHints => {
    const em = (accountForOrder?.email ?? orderDetail?.account_email ?? "").trim();
    return {
      ...(em !== "" ? { email: em } : {}),
      tradingName: accountForOrder?.tradingName ?? orderDetail?.account_trading_name,
      legalName: accountForOrder?.legalName,
      contactName: accountForOrder?.contactName,
    };
  }, [accountForOrder, orderDetail]);

  /** CRM roster rows (Settings → CRM) aligned to this wholesale account — fallback when depot API unavailable. */
  const matchedDistributorContacts = useMemo(
    () => matchedDistributorsForCommercialAccount(data.teamMembers, commercialHints, orderCommercialLabel),
    [commercialHints, data.teamMembers, orderCommercialLabel],
  );

  type DepotPickKind =
    | "server_crm"
    | "server_account"
    | "server_none"
    | "loading_hint"
    | "aligned"
    | "fallback"
    | "all";

  const receivingDepots = useMemo((): {
    list: typeof warehouses;
    kind: DepotPickKind;
    detail: string;
    crmRows: CrmDepotMatchRow[];
    usedServer: boolean;
    warnAccent: boolean;
  } => {
    const wh = warehouses;
    if (!accountIdForOrder) {
      return { list: wh, kind: "all", detail: "", crmRows: [], usedServer: false, warnAccent: false };
    }

    const accountLinkedList = wh
      .filter((w) => w.linkedAccountId && String(w.linkedAccountId) === accountIdForOrder)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    if (orderId && loadingReceivingDepots && !serverReceivingDepots && !depotsResolveError) {
      return {
        list: accountLinkedList,
        kind: "loading_hint",
        detail:
          accountLinkedList.length > 0
            ? "Resolving CRM-linked depots from the server… Only account-linked depots are shown until this finishes."
            : "Resolving CRM-linked depots from the server…",
        crmRows: [],
        usedServer: false,
        warnAccent: true,
      };
    }

    if (orderId && serverReceivingDepots && !depotsResolveError) {
      const idSet = new Set(serverReceivingDepots.warehouse_ids.map(String));
      const list = wh.filter((w) => idSet.has(w.id)).sort((a, b) => a.sortOrder - b.sortOrder);
      const kind: DepotPickKind =
        serverReceivingDepots.kind === "crm_aligned"
          ? "server_crm"
          : serverReceivingDepots.kind === "account_linked"
            ? "server_account"
            : "server_none";
      return {
        list,
        kind,
        detail: serverReceivingDepots.detail,
        crmRows: crmRowsFromServerPayload(serverReceivingDepots),
        usedServer: true,
        warnAccent: kind === "server_none",
      };
    }

    const ids = new Set<string>();
    for (const w of wh) {
      if (w.linkedAccountId && String(w.linkedAccountId) === accountIdForOrder) {
        ids.add(w.id);
      }
    }
    for (const tm of matchedDistributorContacts) {
      if (tm.primaryWarehouseId) ids.add(tm.primaryWarehouseId);
      for (const x of wh) {
        if (x.linkedTeamMemberId && String(x.linkedTeamMemberId) === tm.id) ids.add(x.id);
      }
    }

    if (ids.size > 0) {
      const list = wh.filter((w) => ids.has(w.id)).sort((a, b) => a.sortOrder - b.sortOrder);
      const names =
        matchedDistributorContacts.map((m) => m.displayName).join(", ").trim() || "commercial account mapping";
      return {
        list,
        kind: "aligned",
        detail:
          (depotsResolveError ? `${depotsResolveError} Showing locally inferred depots. ` : "") +
          (matchedDistributorContacts.length > 0
            ? `Receiving options for CRM distributors matching this account (${names}).`
            : `Receiving options linked to this distributor / wholesaler account.`),
        crmRows: crmRowsFromTeamMembers(matchedDistributorContacts),
        usedServer: false,
        warnAccent: Boolean(depotsResolveError),
      };
    }

    return {
      list: wh,
      kind: "fallback",
      detail:
        (depotsResolveError ? `${depotsResolveError} ` : "") +
        "No CRM-linked depot for this account yet — configure Settings → Warehouses (link to account / CRM distributor) or align CRM distributor email with the wholesale account.",
      crmRows: [],
      usedServer: false,
      warnAccent: true,
    };
  }, [
    accountIdForOrder,
    depotsResolveError,
    matchedDistributorContacts,
    loadingReceivingDepots,
    orderId,
    serverReceivingDepots,
    warehouses,
  ]);

  /** Prefer server CRM snapshot; until it loads, show locally matched distributors so identity is never blank. */
  const distributorContactsForSummary = useMemo((): CrmDepotMatchRow[] => {
    if (receivingDepots.crmRows.length > 0) return receivingDepots.crmRows;
    return crmRowsFromTeamMembers(matchedDistributorContacts);
  }, [matchedDistributorContacts, receivingDepots.crmRows]);

  const wholesaleDistributorForShipment = useMemo(() => {
    const srv = serverReceivingDepots?.distributor_wholesale_account;
    if (srv?.id) {
      const trading = (
        srv.trading_name ||
        srv.legal_name ||
        accountForOrder?.tradingName ||
        accountForOrder?.legalName ||
        "Wholesale distributor"
      ).trim();
      const email =
        (srv.email || accountForOrder?.email || orderDetail?.account_email || "").trim() || undefined;
      return { id: srv.id, trading, email };
    }
    if (accountForOrder) {
      return {
        id: accountForOrder.id,
        trading: (accountForOrder.tradingName || accountForOrder.legalName || accountForOrder.name).trim(),
        email: accountForOrder.email?.trim() || undefined,
      };
    }
    return {
      id: accountIdForOrder,
      trading: (
        orderDetail?.account_trading_name ||
        orderDetail?.account_name ||
        selectedOrderRow?.account ||
        "Wholesale distributor"
      ).trim(),
      email: (orderDetail?.account_email || "").trim() || undefined,
    };
  }, [
    accountForOrder,
    accountIdForOrder,
    orderDetail,
    selectedOrderRow?.account,
    serverReceivingDepots?.distributor_wholesale_account,
  ]);

  const teamMemberById = useMemo(() => {
    const m = new Map<string, TeamMember>();
    for (const tm of data.teamMembers ?? []) {
      m.set(String(tm.id), tm);
    }
    return m;
  }, [data.teamMembers]);

  useEffect(() => {
    if (!destWarehouseId.trim()) return;
    if (!receivingDepots.list.some((w) => w.id === destWarehouseId)) {
      setDestWarehouseId("");
    }
  }, [destWarehouseId, receivingDepots.list]);

  useEffect(() => {
    if (!originWarehouseId.trim()) return;
    if (!originWarehouses.some((w) => w.id === originWarehouseId)) {
      setOriginWarehouseId("");
    }
  }, [originWarehouseId, originWarehouses]);

  useEffect(() => {
    if (!open || !orderId) {
      setOrderDetail(null);
      setLoadError(null);
      return;
    }
    let cancelled = false;
    setLoadingOrder(true);
    setLoadError(null);
    void getOrder(orderId)
      .then((res) => {
        if (cancelled) return;
        setOrderDetail(res.data);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setOrderDetail(null);
        setLoadError(e instanceof Error ? e.message : "Could not load order.");
      })
      .finally(() => {
        if (!cancelled) setLoadingOrder(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, orderId]);

  useEffect(() => {
    if (!open || !orderId) {
      setServerReceivingDepots(null);
      setDepotsResolveError(null);
      setLoadingReceivingDepots(false);
      return;
    }
    let cancelled = false;
    setLoadingReceivingDepots(true);
    setDepotsResolveError(null);
    setServerReceivingDepots(null);
    void getOrderReceivingWarehouses(orderId)
      .then((res) => {
        if (cancelled) return;
        setServerReceivingDepots(res.data);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setServerReceivingDepots(null);
        setDepotsResolveError(
          e instanceof Error ? e.message : "Could not resolve receiving depots from the server.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingReceivingDepots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, orderId]);

  useEffect(() => {
    if (!open) return;
    setDestWarehouseId("");
  }, [accountIdForOrder, open]);

  useEffect(() => {
    const items = orderDetail?.items;
    if (!items?.length) {
      setCasesByLine({});
      return;
    }
    const products = data.products ?? [];
    const next: Record<string, string> = {};
    items.forEach((it, idx) => {
      const csz = caseSizeFromCatalog(products, it.sku);
      const maxWhole = Math.floor(it.quantity_ordered / csz);
      next[lineStableKey(it, idx)] = String(Math.max(0, maxWhole));
    });
    setCasesByLine(next);
  }, [orderDetail, data.products]);

  const resetForm = () => {
    setOrderId("");
    setOrderDetail(null);
    setLoadError(null);
    setServerReceivingDepots(null);
    setDepotsResolveError(null);
    setLoadingReceivingDepots(false);
    setOriginWarehouseId("");
    setDestWarehouseId("");
    setShipAt(toDatetimeLocalValue(new Date()));
    setEtaDate(new Date().toISOString().slice(0, 10));
    setCarrier("");
    setTracking("");
    setCasesByLine({});
  };

  const submit = async () => {
    const oidNum = Number(orderId);
    if (!Number.isFinite(oidNum) || oidNum <= 0 || !orderDetail) {
      toast.error("Select a distributor sales order");
      return;
    }
    const ow = originWarehouseId.trim();
    const dw = destWarehouseId.trim();
    if (!ow || !dw) {
      toast.error("Choose ship-from warehouse and distributor receiving depot");
      return;
    }
    const origin = originWarehouses.find((w) => w.id === ow) ?? warehouses.find((w) => w.id === ow);
    const dest = warehouses.find((w) => w.id === dw);
    if (!origin?.name?.trim()) {
      toast.error("Invalid origin warehouse");
      return;
    }
    const products = data.products ?? [];
    const itemsPayload: {
      sku: string;
      product_name: string;
      quantity: number;
      product_id?: string;
    }[] = [];
    let totalBt = 0;
    for (let idx = 0; idx < (orderDetail.items?.length ?? 0); idx++) {
      const it = orderDetail.items![idx];
      const key = lineStableKey(it, idx);
      const raw = String(casesByLine[key] ?? "0").trim();
      const n = /^-?\d+$/.test(raw) ? parseInt(raw, 10) : NaN;
      const cases = Number.isFinite(n) && n >= 0 ? n : 0;
      if (cases === 0) continue;
      const csz = caseSizeFromCatalog(products, it.sku);
      const bottlesOut = cases * csz;
      if (bottlesOut > it.quantity_ordered) {
        toast.error("Cases exceed order quantity", {
          description: `${it.sku}: ${cases} cs (${bottlesOut} bottles) vs ${it.quantity_ordered} bottles ordered.`,
        });
        return;
      }
      itemsPayload.push({
        sku: it.sku,
        product_name:
          bottlesOut !== it.quantity_ordered
            ? `${it.product_name} (${cases} cs × ${csz} bt/cs)`
            : it.product_name,
        quantity: bottlesOut,
        ...(it.product_id != null && String(it.product_id).trim() !== ""
          ? { product_id: String(it.product_id) }
          : {}),
      });
      totalBt += bottlesOut;
    }

    if (itemsPayload.length === 0) {
      toast.error("Enter at least one case quantity");
      return;
    }

    const depart = shipAt.trim();
    if (!depart) {
      toast.error("Departed date and time are required");
      return;
    }
    const departed = new Date(depart);
    if (Number.isNaN(departed.getTime())) {
      toast.error("Invalid departure time");
      return;
    }
    if (!etaDate.trim()) {
      toast.error("Expected arrival date is required");
      return;
    }

    setBusy(true);
    try {
      await createShipment({
        order_type: "sales_order",
        order_id: oidNum,
        from_location: origin.name.trim(),
        destination_warehouse_id: dw,
        to_location: dest?.name ?? undefined,
        carrier: carrier.trim() || undefined,
        tracking_number: tracking.trim() || undefined,
        ship_date: departed.toISOString(),
        estimated_delivery: isoDateEndOfDay(etaDate.trim()),
        status: "in_transit",
        shipment_number: `WH-DC-${Date.now()}`,
        total_bottles: totalBt,
        items: itemsPayload,
      });
      await refreshShipments();
      toast.success("Shipment to distributor recorded", {
        description: `${wholesaleDistributorForShipment.trading}: ${origin.name} → ${dest?.name ?? "depot"} · ETA ${etaDate}`,
      });
      onOpenChange(false);
      resetForm();
    } catch (e) {
      toast.error("Could not save shipment", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) resetForm();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display">Ship to distributor (warehouse → DC)</DialogTitle>
          <DialogDescription>
            Builds the outbound manifest in{" "}
            <span className="font-medium text-foreground">whole cases</span> (SKU case size comes from catalog). Stored
            line quantities remain bottles (= cases × case size) so inventory stays coherent. Partial bottles on the order
            that do not fill a case are left unshipped unless you ship fewer cases to match availability. Choosing a
            distributor order below attaches the shipment to that wholesale account and shows matching CRM distributor
            contacts next to receiving depots.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Distributor sales order</Label>
            <Select value={orderId || undefined} onValueChange={setOrderId}>
              <SelectTrigger className="touch-manipulation">
                <SelectValue placeholder="Select order…" />
              </SelectTrigger>
              <SelectContent className="max-h-[min(70vh,24rem)]">
                {eligibleOrders.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No distributor orders in confirmed/packed status with numeric API ids.
                  </div>
                ) : (
                  eligibleOrders.map((o) => (
                    <SelectItem key={o.id} value={o.id} className="items-start">
                      <span className="line-clamp-3 whitespace-normal text-left">
                        {distributorSalesOrderDropdownLabel(o, data.accounts)}
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {orderId ? (
            <div className="rounded-md border border-primary/30 bg-primary/[0.06] px-3 py-2.5 dark:bg-primary/10">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">Wholesale distributor</p>
              <p className="mt-0.5 text-sm font-semibold leading-snug text-foreground">
                {wholesaleDistributorForShipment.trading}
              </p>
              {wholesaleDistributorForShipment.email ? (
                <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
                  {wholesaleDistributorForShipment.email}
                </p>
              ) : (
                <p className="mt-1 text-[11px] leading-relaxed text-amber-800 dark:text-amber-400">
                  Add an email on this distributor account so it lines up with the CRM distributor invite email.
                </p>
              )}
              <div className="mt-3 border-t border-border/60 pt-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  CRM distributor (Settings → CRM)
                </p>
                {loadingReceivingDepots && !serverReceivingDepots && !depotsResolveError ? (
                  <p className="mt-1 text-xs text-muted-foreground">Checking server for CRM linkage…</p>
                ) : distributorContactsForSummary.length > 0 ? (
                  <ul className="mt-1.5 space-y-1 text-xs leading-snug text-foreground">
                    {distributorContactsForSummary.map((m) => (
                      <li key={m.id}>
                        <span className="font-medium">{m.name || "Contact"}</span>{" "}
                        <span className="break-all font-mono text-[11px] text-muted-foreground">&lt;{m.email}&gt;</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    No CRM distributor invite matched yet. Receiving depots can still list if warehouses are linked to this
                    wholesale account.
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {loadingOrder ? <p className="text-xs text-muted-foreground">Loading order lines…</p> : null}
          {loadError ? <p className="text-xs text-destructive">{loadError}</p> : null}

          {orderDetail?.items && orderDetail.items.length > 0 ? (
            <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-xs">
              <p className="font-medium text-foreground">Shipment by case</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Order totals are bottles; enter full cases loading out. Bottle count sent to the API = cases × case size.
              </p>
              <div className="mt-3 space-y-3">
                {orderDetail.items.map((it, idx) => {
                  const key = lineStableKey(it, idx);
                  const csz = caseSizeFromCatalog(data.products, it.sku);
                  const maxWhole = Math.floor(it.quantity_ordered / csz);
                  const rem = it.quantity_ordered % csz;
                  const rawCases = String(casesByLine[key] ?? "0").trim();
                  const pv = /^-?\d+$/.test(rawCases) ? parseInt(rawCases, 10) : 0;
                  const casesDraft = Number.isFinite(pv) && pv >= 0 ? pv : 0;
                  const btOut = casesDraft * csz;
                  return (
                    <div
                      key={it.id ? String(it.id) : `ln-${idx}-${it.sku}`}
                      className="space-y-1.5 rounded-md border border-border/40 bg-background/50 px-2 py-2"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-medium text-foreground">{it.product_name ?? it.sku}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{it.sku}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Case size</p>
                          <p className="tabular-nums text-foreground">{csz} bt/cs</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">On order</p>
                          <p className="tabular-nums text-foreground">{it.quantity_ordered.toLocaleString()} bt</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Max cases</p>
                          <p className="tabular-nums text-foreground">{maxWhole} cs</p>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <Label htmlFor={`cs-${key}`} className="text-[10px] uppercase tracking-wide">
                            Cases to ship
                          </Label>
                          <Input
                            id={`cs-${key}`}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="mt-0.5 h-8 tabular-nums touch-manipulation"
                            value={casesByLine[key] ?? ""}
                            onChange={(e) =>
                              setCasesByLine((prev) => ({ ...prev, [key]: e.target.value.replace(/[^\d]/g, "") }))
                            }
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                        <span>
                          Manifest:{" "}
                          <span className="font-medium text-foreground">
                            {btOut.toLocaleString()} bottles ({casesDraft} cs)
                          </span>
                        </span>
                        {rem > 0 ? (
                          <span className="text-amber-700 dark:text-amber-400">
                            {rem} bottle(s) remain on order below one full case.
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Ship-from warehouse (origin)</Label>
            <Select value={originWarehouseId || undefined} onValueChange={setOriginWarehouseId}>
              <SelectTrigger className="touch-manipulation">
                <SelectValue placeholder="Choose brand inventory depot…" />
              </SelectTrigger>
              <SelectContent>
                {originWarehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasBrandOutboundOriginWarehouse ? (
              <p className="text-[10px] text-muted-foreground">
                Showing only Hajime / brand inventory locations. Distributor receiving depots, CRM-linked docks, and
                account-linked warehouses (e.g. a retail monopoly DC) are hidden here — choose those under{" "}
                <span className="font-medium text-foreground">Distributor receiving depot</span>.
              </p>
            ) : (
              <p className="text-[10px] text-amber-700 dark:text-amber-400">
                No unlinked depot found — all warehouses appear to be distributor or account-linked. Add a neutral
                brand pool warehouse in Settings → Warehouses (leave CRM and account links empty).
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Distributor receiving depot</Label>
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Each option includes the wholesale account and CRM distributor contact when that depot is tied to them in
              Settings.
            </p>
            <Select
              value={destWarehouseId || undefined}
              onValueChange={setDestWarehouseId}
              disabled={Boolean(orderId) && loadingReceivingDepots}
            >
              <SelectTrigger className="touch-manipulation min-h-[2.75rem] text-left [&>span]:line-clamp-2 [&>span]:text-left">
                <SelectValue
                  placeholder={
                    orderId && loadingReceivingDepots
                      ? "Resolving depot options…"
                      : "Choose receiving warehouse…"
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-[min(70vh,28rem)]">
                {receivingDepots.list.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {loadingReceivingDepots && orderId
                      ? "Loading depot options…"
                      : orderId && receivingDepots.kind === "server_none"
                        ? "No depot matches this order’s account + CRM linkage."
                        : "No warehouses in directory."}
                  </div>
                ) : (
                  receivingDepots.list.map((w) => (
                    <SelectItem key={w.id} value={w.id} className="items-start py-2">
                      <span className="line-clamp-4 whitespace-normal text-left text-xs leading-snug">
                        {receivingDepotDropdownLabel(
                          w,
                          {
                            trading: wholesaleDistributorForShipment.trading,
                            email: wholesaleDistributorForShipment.email,
                          },
                          receivingDepots.crmRows.length > 0
                            ? receivingDepots.crmRows
                            : distributorContactsForSummary,
                          teamMemberById,
                        )}
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {receivingDepots.detail ? (
              <p
                className={`text-[10px] ${
                  receivingDepots.warnAccent ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"
                }`}
              >
                {receivingDepots.detail}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="out-ship-at">Left warehouse</Label>
            <Input
              id="out-ship-at"
              type="datetime-local"
              value={shipAt}
              onChange={(e) => setShipAt(e.target.value)}
              className="touch-manipulation"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="out-eta">Expected arrival date</Label>
            <Input
              id="out-eta"
              type="date"
              value={etaDate}
              onChange={(e) => setEtaDate(e.target.value)}
              className="touch-manipulation"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="out-carrier">Carrier (optional)</Label>
              <Input
                id="out-carrier"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="touch-manipulation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="out-track">Tracking (optional)</Label>
              <Input
                id="out-track"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                className="touch-manipulation"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" className="touch-manipulation" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="touch-manipulation"
            disabled={busy || loadingOrder || !orderDetail}
            onClick={() => void submit()}
          >
            {busy ? "Saving…" : "Save shipment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
