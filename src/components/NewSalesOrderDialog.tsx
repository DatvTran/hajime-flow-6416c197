import { useEffect, useMemo, useState } from "react";
import type { Account, OrderRoutingTarget, SalesOrder } from "@/data/mockData";
import { orderCreatedByFromRole, isProxyOrder, getProxyAuditInfo } from "@/lib/order-routing";
import { useAccounts, useAppData, useProducts, useInventory } from "@/contexts/AppDataContext";
import type { TeamMember, TeamMemberPortalRole } from "@/types/app-data";
import { useAuth } from "@/contexts/AuthContext";
import { resolveSalesRepLabelForSession } from "@/data/team-roster";
import {
  accountsForSalesOrderVariant,
  getSalesOrderFormVariantConfig,
  type NewSalesOrderFormVariant,
} from "@/lib/sales-order-form-variants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/sonner";
import { Link } from "react-router-dom";
import { isDistributorAccountType } from "@/lib/distributor-accounts";
import { isManufacturerAccountType, looksLikeManufacturerAccount } from "@/lib/manufacturer-accounts";
import {
  getAccountSkuPrices,
  getMySkuPrices,
  type PartnerPricingSettings,
  type PartnerSkuPriceRow,
} from "@/lib/api-v1";
import {
  currencyForMarket,
  netFromListAndDiscountPct,
  partnerPriceBySku,
  priceSourceLabel,
  resolvePartnerCasePrice,
} from "@/lib/partner-sku-prices";
import { useIsMobile } from "@/hooks/use-mobile";

const ORDER_STATUSES: SalesOrder["status"][] = [
  "draft",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];

const PAYMENT_STATUSES: SalesOrder["paymentStatus"][] = ["pending", "paid", "overdue"];

function nextOrderId(existing: SalesOrder[]): string {
  let maxSeq = 0;
  const year = new Date().getFullYear();
  for (const o of existing) {
    const m = o.id.match(/^SO-(\d{4})-(\d+)$/);
    if (m) {
      const y = parseInt(m[1], 10);
      const seq = parseInt(m[2], 10);
      if (y === year) maxSeq = Math.max(maxSeq, seq);
    }
  }
  return `SO-${year}-${String(maxSeq + 1).padStart(3, "0")}`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function defaultMarketForAccount(tradingName: string, accountList: Account[]): string {
  const acc = accountList.find((a) => a.tradingName === tradingName);
  if (!acc) return "";
  if (acc.tradingName === "LCBO Ontario" || (acc.legalName?.toLowerCase() || "").includes("liquor control")) return "Ontario";
  return acc.city;
}

function marketLabelForAccount(a: Account): string {
  if (a.tradingName === "LCBO Ontario" || (a.legalName?.toLowerCase() || "").includes("liquor control")) return "Ontario";
  return a.city || "";
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingOrders: SalesOrder[];
  onCreate: (order: SalesOrder) => void;
  variant: NewSalesOrderFormVariant;
};

type BrandCrmChoiceRow =
  | { key: string; kind: "account"; account: Account; member?: TeamMember }
  | { key: string; kind: "crm_only"; member: TeamMember };

/** Merge Accounts with Settings CRM contacts by email; remainder are CRM-only rows. */
function mergeCrmAccountChoices(
  crmRole: TeamMemberPortalRole,
  scopedAccounts: Account[],
  teamMembers: TeamMember[],
): BrandCrmChoiceRow[] {
  const crm = teamMembers.filter((m) => m.role === crmRole && m.isActive !== false);
  const byEmail = new Map(crm.map((m) => [m.email?.trim().toLowerCase() || "", m] as const));
  const usedMemberIds = new Set<string>();
  const rows: BrandCrmChoiceRow[] = [];
  for (const a of scopedAccounts) {
    const em = a.email?.trim().toLowerCase() || "";
    const member = em ? byEmail.get(em) : undefined;
    if (member) usedMemberIds.add(member.id);
    rows.push({ key: `acc:${a.id}`, kind: "account", account: a, member });
  }
  for (const m of crm) {
    if (usedMemberIds.has(m.id)) continue;
    rows.push({ key: `tm:${m.id}`, kind: "crm_only", member: m });
  }
  rows.sort((x, y) => {
    const sx = x.kind === "account" ? x.account.tradingName : x.member.displayName;
    const sy = y.kind === "account" ? y.account.tradingName : y.member.displayName;
    return sx.localeCompare(sy, undefined, { sensitivity: "base" });
  });
  return rows;
}

/** Stock availability for case-based sell-in (inventory is tracked in bottles). */
function StockAvailability({
  availableBottles,
  requestedCases,
  caseSize,
}: {
  availableBottles: number;
  requestedCases: number;
  caseSize: number;
}) {
  const bpc = Math.max(1, caseSize || 12);
  const requestedBottles = Math.max(0, requestedCases) * bpc;
  const availableCases = Math.floor(availableBottles / bpc);
  const shortfallCases = Math.max(0, requestedCases - availableCases);
  const isShort = shortfallCases > 0 || availableBottles < requestedBottles;
  return (
    <div className={`rounded-md border px-3 py-2 text-xs ${isShort ? "border-destructive/60 bg-destructive/10" : "border-emerald-600/40 bg-emerald-600/10"}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground">Available stock:</span>
        <span className={`font-medium tabular-nums ${isShort ? "text-destructive" : "text-emerald-700"}`}>
          {availableCases.toLocaleString()} cases ({availableBottles.toLocaleString()} bt)
        </span>
      </div>
      {isShort ? (
        <p className="mt-1 text-destructive">
          Short by {Math.max(shortfallCases, 1).toLocaleString()} case
          {Math.max(shortfallCases, 1) === 1 ? "" : "s"}. Order may be backordered.
        </p>
      ) : (
        <p className="mt-1 text-emerald-700">Sufficient stock for this order.</p>
      )}
    </div>
  );
}

export function NewSalesOrderDialog({ open, onOpenChange, existingOrders, onCreate, variant }: Props) {
  const { accounts: allAccounts } = useAccounts();
  const { data: appData } = useAppData();
  const teamMembers = appData.teamMembers ?? [];
  const warehouses = appData.warehouses ?? [];
  const { products } = useProducts();
  const { user } = useAuth();
  const sessionRep = resolveSalesRepLabelForSession(user?.email, user?.displayName ?? "");
  const { availableBottlesForSku } = useInventory();
  const salesRepNames = useMemo(
    () =>
      teamMembers
        .filter((m) => m.role === "sales_rep" && m.isActive !== false)
        .map((m) => m.displayName)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [teamMembers],
  );

  const skuOptions = useMemo(
    () => products.filter((p) => p.status === "active" || p.status === "development"),
    [products],
  );

  const cfg = getSalesOrderFormVariantConfig(variant);
  const baseAccountsForVariant = useMemo(
    () => accountsForSalesOrderVariant(allAccounts, variant),
    [allAccounts, variant],
  );

  const [account, setAccount] = useState("");
  const [market, setMarket] = useState("");
  const [marketIsCustom, setMarketIsCustom] = useState(false);
  const [orderDate, setOrderDate] = useState(todayISO());
  const [requestedDelivery, setRequestedDelivery] = useState(addDaysISO(14));
  const [sku, setSku] = useState("");
  /** Case count — sell-in is priced and entered per case; stored on the order as bottles. */
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [priceAuto, setPriceAuto] = useState(true);
  const [discountPct, setDiscountPct] = useState("0");
  const [discountReason, setDiscountReason] = useState("");
  const [salesRep, setSalesRep] = useState("");
  const [status, setStatus] = useState<SalesOrder["status"]>("draft");
  const [paymentStatus, setPaymentStatus] = useState<SalesOrder["paymentStatus"]>("pending");
  const [error, setError] = useState<string | null>(null);
  /** Brand HQ: who this order is for. */
  const [brandPath, setBrandPath] = useState<OrderRoutingTarget>("wholesaler");
  /** Wholesaler: route via rep vs direct to retail. */
  const [wholesalerPath, setWholesalerPath] = useState<"rep" | "retail">("retail");
  const [wholesaleRep, setWholesaleRep] = useState("");
  
  // NEW: Proxy mode state
  const [isProxyMode, setIsProxyMode] = useState(false);
  const [onBehalfOfAccountId, setOnBehalfOfAccountId] = useState<string>("");
  const [partnerPrices, setPartnerPrices] = useState<PartnerSkuPriceRow[]>([]);
  const [partnerSettings, setPartnerSettings] = useState<PartnerPricingSettings | null>(null);
  const [partnerSheetState, setPartnerSheetState] = useState<"idle" | "loading" | "ok" | "missing" | "error">(
    "idle",
  );

  const sessionRoleLabel = useMemo(() => {
    const r = user?.role || "brand_operator";
    if (r === "founder_admin") return "Founder Admin";
    if (r === "brand_operator") return "Brand Operator";
    if (r === "operations") return "Operations";
    if (r === "manufacturer") return "Distillery";
    if (r === "distributor") return "Distributor";
    if (r === "sales_rep") return "Sales Rep";
    if (r === "retail") return "Retail";
    return r.replace(/_/g, " ");
  }, [user?.role]);

  useEffect(() => {
    if (!open) return;
    setAccount("");
    setMarket("");
    setMarketIsCustom(false);
    setOrderDate(todayISO());
    setRequestedDelivery(addDaysISO(14));
    setSku("");
    setQuantity("1");
    setPrice("");
    setPriceAuto(true);
    setDiscountPct("0");
    setDiscountReason("");
    setSalesRep(salesRepNames[0] ?? "");
    setStatus(variant === "manufacturer" ? "draft" : "draft");
    setPaymentStatus("pending");
    setError(null);
    setBrandPath("wholesaler");
    setWholesalerPath("retail");
    setWholesaleRep(salesRepNames[0] ?? "");
    // NEW: Reset proxy mode
    setIsProxyMode(false);
    setOnBehalfOfAccountId("");
    setPartnerSheetState("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, variant]);

  useEffect(() => {
    if (!account) return;
    if (variant === "brand") {
      if (account.startsWith("acc:")) {
        const acc = allAccounts.find((a) => a.id === account.slice(4));
        if (acc) {
          setMarket(defaultMarketForAccount(acc.tradingName, allAccounts));
          setMarketIsCustom(false);
        }
        return;
      }
      if (account.startsWith("tm:")) {
        setMarket("");
        setMarketIsCustom(true);
        return;
      }
    }
    setMarket(defaultMarketForAccount(account, allAccounts));
    setMarketIsCustom(false);
  }, [account, allAccounts, variant, brandPath]);

  useEffect(() => {
    if (!open || variant !== "brand") return;
    setAccount("");
  }, [brandPath, open, variant]);

  const pathwayTarget: OrderRoutingTarget = useMemo(() => {
    if (variant === "brand") return brandPath;
    if (variant === "distributor") return wholesalerPath === "rep" ? "sales_rep" : "retail";
    if (variant === "sales_rep") return "retail";
    if (variant === "manufacturer") return "manufacturer";
    return "retail";
  }, [brandPath, variant, wholesalerPath]);

  // Brand HQ: make Account list match the selected pathway target.
  const accounts = useMemo(() => {
    if (variant !== "brand") return baseAccountsForVariant;
    const base = (allAccounts || []).filter((a) => a.status !== "inactive");

    if (pathwayTarget === "wholesaler") {
      const dc = base.filter((a) => isDistributorAccountType(a.type));
      return dc.length > 0 ? dc : base;
    }
    if (pathwayTarget === "manufacturer") {
      const mf = base.filter((a) => isManufacturerAccountType(a.type) || looksLikeManufacturerAccount(a));
      return mf.length > 0 ? mf : base;
    }
    if (pathwayTarget === "sales_rep") {
      const reps = teamMembers.filter((m) => m.role === "sales_rep" && m.isActive !== false);
      const repEmails = new Set(reps.map((m) => m.email?.trim().toLowerCase()).filter(Boolean));
      const linked = base.filter((a) => repEmails.has(a.email?.trim().toLowerCase() || ""));
      return linked.length > 0 ? linked : base.filter((a) => !isDistributorAccountType(a.type));
    }
    // retail: retail-like accounts (everything except wholesaler/distributor)
    const retailLike = base.filter((a) => !isDistributorAccountType(a.type));
    return retailLike.length > 0 ? retailLike : base;
  }, [allAccounts, baseAccountsForVariant, pathwayTarget, variant, teamMembers]);

  /** Brand HQ: CRM contacts aligned to pathway (same merge rules as Settings → CRM). */
  const brandCrmAccountChoices = useMemo((): BrandCrmChoiceRow[] | null => {
    if (variant !== "brand") return null;
    const base = (allAccounts || []).filter((a) => a.status !== "inactive");

    if (pathwayTarget === "wholesaler") {
      const list = base.filter((a) => isDistributorAccountType(a.type));
      return mergeCrmAccountChoices("distributor", list.length > 0 ? list : base, teamMembers);
    }
    if (pathwayTarget === "manufacturer") {
      const mf = base.filter((a) => isManufacturerAccountType(a.type) || looksLikeManufacturerAccount(a));
      const list = mf.length > 0 ? mf : base;
      return mergeCrmAccountChoices("manufacturer", list, teamMembers);
    }
    if (pathwayTarget === "sales_rep") {
      const reps = teamMembers.filter((m) => m.role === "sales_rep" && m.isActive !== false);
      const repEmails = new Set(reps.map((m) => m.email?.trim().toLowerCase()).filter(Boolean));
      const linked = base.filter((a) => repEmails.has(a.email?.trim().toLowerCase() || ""));
      return mergeCrmAccountChoices("sales_rep", linked, teamMembers);
    }
    const retailLike = base.filter((a) => !isDistributorAccountType(a.type));
    const list = retailLike.length > 0 ? retailLike : base;
    return mergeCrmAccountChoices("retail", list, teamMembers);
  }, [variant, pathwayTarget, allAccounts, teamMembers]);

  const warehouseName = (id: string | undefined) =>
    id ? warehouses.find((w) => w.id === id)?.name : undefined;

  const brandAccountGuide = useMemo(() => {
    if (variant !== "brand") return null;
    const label =
      brandPath === "wholesaler"
        ? "Wholesaler / distributor *"
        : brandPath === "manufacturer"
          ? "Distillery / partner *"
          : brandPath === "sales_rep"
            ? "Field sales rep *"
            : "Retail customer *";
    const hint =
      brandPath === "wholesaler"
        ? "Distributor accounts merged with CRM by email; receiving depot mirrors CRM when set."
        : brandPath === "manufacturer"
          ? "Distillery / partner accounts merged with CRM distillery contacts by email."
          : brandPath === "sales_rep"
            ? "Sales rep contacts from CRM (Settings → CRM, role Sales rep). Accounts rows merge when email matches."
            : "Retail accounts merged with CRM store contacts by email.";
    const empty =
      brandPath === "wholesaler"
        ? "No distributor accounts or active distributor CRM contacts."
        : brandPath === "manufacturer"
          ? "No distillery accounts or distillery CRM contacts."
          : brandPath === "sales_rep"
            ? "No sales rep CRM contacts (or no Accounts rows sharing their email)."
            : "No retail accounts or retail CRM contacts.";
    const missingCrm =
      brandPath === "wholesaler"
        ? "No CRM contact with this email — add Distributor in Settings → CRM."
        : brandPath === "manufacturer"
          ? "No CRM contact with this email — add Distillery in Settings → CRM."
          : brandPath === "sales_rep"
            ? "No CRM contact with this email — add Sales rep in Settings → CRM."
            : "No CRM contact with this email — add Retail store / account in Settings → CRM.";
    const crmOnlyNote =
      brandPath === "wholesaler"
        ? "No Accounts row — create a distributor account with the same email for billing."
        : brandPath === "manufacturer"
          ? "No Accounts row — create a partner account with the same email."
          : brandPath === "sales_rep"
            ? "No Accounts row — add an account with the same email if you need billing / territory linkage."
            : "No Accounts row — create a retail customer account with the same email.";
    const placeholder =
      brandPath === "wholesaler"
        ? "Choose wholesaler / distributor"
        : brandPath === "manufacturer"
          ? "Choose distillery / partner"
          : brandPath === "sales_rep"
            ? "Choose sales rep"
            : "Choose retail customer";
    return { label, hint, empty, missingCrm, crmOnlyNote, placeholder };
  }, [variant, brandPath]);

  const marketOptionsForPathway = useMemo(() => {
    const base = (allAccounts || []).filter((a) => a.status !== "inactive");
    const filtered = (() => {
      if (pathwayTarget === "wholesaler") return base.filter((a) => isDistributorAccountType(a.type));
      if (pathwayTarget === "manufacturer") {
        const mf = base.filter((a) => isManufacturerAccountType(a.type) || looksLikeManufacturerAccount(a));
        return mf.length > 0 ? mf : base;
      }
      if (pathwayTarget === "sales_rep") {
        const reps = teamMembers.filter((m) => m.role === "sales_rep" && m.isActive !== false);
        const repEmails = new Set(reps.map((m) => m.email?.trim().toLowerCase()).filter(Boolean));
        const linked = base.filter((a) => repEmails.has(a.email?.trim().toLowerCase() || ""));
        if (linked.length > 0) return linked;
        return base.filter((a) => !isDistributorAccountType(a.type));
      }
      return base.filter((a) => !isDistributorAccountType(a.type));
    })();

    const set = new Set<string>();
    const op = String(appData.operationalSettings?.primaryMarkets ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const m of op) set.add(m);
    for (const a of filtered) {
      const label = marketLabelForAccount(a).trim();
      if (label) set.add(label);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allAccounts, appData.operationalSettings?.primaryMarkets, pathwayTarget, teamMembers]);

  const selectedSku = useMemo(() => skuOptions.find((p) => p.sku === sku), [sku, skuOptions]);

  const selectedAccountRow = useMemo(
    () => allAccounts.find((a) => a.tradingName === account) ?? null,
    [allAccounts, account],
  );

  const resolvedCase = useMemo(() => {
    if (!selectedSku) {
      const marketCur = currencyForMarket(market);
      return {
        casePrice: 0,
        source: "none",
        currency:
          variant === "distributor" || variant === "sales_rep"
            ? marketCur || partnerSettings?.sellOutCurrency || selectedAccountRow?.defaultCurrency || "USD"
            : "USD",
      };
    }
    const partnerRow = partnerPriceBySku(partnerPrices, selectedSku.sku);
    if (variant === "distributor" || variant === "sales_rep") {
      // Country/market drives the label; only apply partner FX when it matches that currency.
      const marketCur = currencyForMarket(market);
      const sellOutCurrency = String(
        marketCur ||
          partnerSettings?.sellOutCurrency ||
          selectedAccountRow?.defaultCurrency ||
          "CAD",
      ).toUpperCase();
      const settingsCur = String(partnerSettings?.sellOutCurrency || "").toUpperCase();
      const rateMatches = settingsCur === sellOutCurrency || sellOutCurrency === "USD";
      const settingsForMarket = {
        sellOutCurrency,
        usdToLocalRate: rateMatches ? (partnerSettings?.usdToLocalRate ?? (sellOutCurrency === "USD" ? 1 : null)) : null,
        sellInCurrency: "USD" as const,
      };
      return resolvePartnerCasePrice({
        direction: "sell_out",
        product: selectedSku,
        partnerRow,
        settings: settingsForMarket,
        market,
      });
    }
    if (variant === "brand" && selectedAccountRow && isDistributorAccountType(selectedAccountRow.type)) {
      return resolvePartnerCasePrice({
        direction: "sell_in",
        product: selectedSku,
        partnerRow,
        settings: partnerSettings,
      });
    }
    return resolvePartnerCasePrice({
      direction: "sell_in",
      product: selectedSku,
      partnerRow: null,
    });
  }, [selectedSku, partnerPrices, partnerSettings, variant, selectedAccountRow, market]);

  const caseQtyForPrice = Math.max(1, parseInt(quantity, 10) || 1);
  const listTotal =
    Number.isFinite(resolvedCase.casePrice) && resolvedCase.casePrice > 0
      ? Math.round(caseQtyForPrice * resolvedCase.casePrice * 100) / 100
      : 0;
  const discountPctNum = (() => {
    const n = parseFloat(String(discountPct).replace(/,/g, ""));
    if (!Number.isFinite(n)) return 0;
    return Math.min(100, Math.max(0, n));
  })();
  const netTotal = netFromListAndDiscountPct(listTotal, discountPctNum);
  const salesRepPriced = variant === "sales_rep" && listTotal > 0;

  useEffect(() => {
    if (!open) {
      setPartnerPrices([]);
      setPartnerSettings(null);
      setPartnerSheetState("idle");
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        if (variant === "distributor" || variant === "sales_rep") {
          if (!cancelled) setPartnerSheetState("loading");
          const res = await getMySkuPrices();
          if (!cancelled) {
            setPartnerPrices(res.data ?? []);
            setPartnerSettings(res.settings ?? null);
            setPartnerSheetState(res.accountId ? "ok" : "missing");
          }
          return;
        }
        if (variant === "brand" && selectedAccountRow && isDistributorAccountType(selectedAccountRow.type)) {
          if (!cancelled) setPartnerSheetState("loading");
          const res = await getAccountSkuPrices(selectedAccountRow.id);
          if (!cancelled) {
            setPartnerPrices(res.data ?? []);
            setPartnerSettings(res.settings ?? null);
            setPartnerSheetState("ok");
          }
          return;
        }
        if (!cancelled) {
          setPartnerPrices([]);
          setPartnerSettings(null);
          setPartnerSheetState("idle");
        }
      } catch (err) {
        if (!cancelled) {
          setPartnerPrices([]);
          setPartnerSettings(null);
          const status =
            typeof err === "object" && err && "status" in err ? Number((err as { status?: number }).status) : 0;
          const msg = err instanceof Error ? err.message : String(err);
          setPartnerSheetState(
            status === 404 || /wholesale account|not linked|not found/i.test(msg) ? "missing" : "error",
          );
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, variant, selectedAccountRow?.id]);

  // Reset discount when list basis changes (SKU / cases / case price / currency).
  useEffect(() => {
    if (!open || variant !== "sales_rep") return;
    setDiscountPct("0");
    setDiscountReason("");
  }, [open, variant, sku, quantity, resolvedCase.casePrice, resolvedCase.currency]);

  useEffect(() => {
    if (!open || !selectedSku) return;
    if (variant === "sales_rep") {
      if (listTotal > 0) {
        const next = String(netTotal);
        setPriceAuto(true);
        setPrice((prev) => (prev === next ? prev : next));
      }
      return;
    }
    const casePrice = resolvedCase.casePrice;
    if (!Number.isFinite(casePrice) || casePrice <= 0) return;
    const nextVal = Math.round(caseQtyForPrice * casePrice * 100) / 100;
    if (!Number.isFinite(nextVal) || nextVal <= 0) return;
    if (!priceAuto && price.trim() !== "") return;
    const next = String(nextVal);
    setPriceAuto(true);
    setPrice((prev) => (prev === next ? prev : next));
  }, [
    open,
    variant,
    price,
    priceAuto,
    selectedSku,
    resolvedCase.casePrice,
    listTotal,
    netTotal,
    caseQtyForPrice,
  ]);

  useEffect(() => {
    if (!open || variant !== "sales_rep") return;
    setSalesRep(sessionRep);
  }, [open, variant, sessionRep]);

  const effectiveSalesRep = variant === "sales_rep" ? sessionRep : salesRep;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const accountPick = account.trim();
    if (!accountPick) {
      setError("Select a customer account.");
      return;
    }

    const resolvedAccountForOrder = (() => {
      if (variant !== "brand") return accountPick;
      if (accountPick.startsWith("acc:")) {
        const a = allAccounts.find((x) => x.id === accountPick.slice(4));
        return a?.tradingName?.trim() || accountPick;
      }
      if (accountPick.startsWith("tm:")) {
        const m = teamMembers.find((x) => x.id === accountPick.slice(3));
        if (!m) return accountPick;
        if (m.role === "distributor") {
          const dep = warehouseName(m.primaryWarehouseId);
          return [m.displayName, m.email, dep ? `Depot: ${dep}` : null].filter(Boolean).join(" · ");
        }
        return [m.displayName, m.email].filter(Boolean).join(" · ");
      }
      return accountPick;
    })();
    if (!market.trim()) {
      setError("Market / region is required.");
      return;
    }
    if (!orderDate || !requestedDelivery) {
      setError("Order date and requested delivery date are required.");
      return;
    }
    if (requestedDelivery < orderDate) {
      setError("Requested delivery must be on or after the order date.");
      return;
    }
    if (!sku) {
      setError("Select a SKU.");
      return;
    }
    const caseQty = parseInt(quantity, 10);
    if (!Number.isFinite(caseQty) || caseQty < 1) {
      setError("Quantity must be a whole number of cases (at least 1).");
      return;
    }
    const caseSize = Math.max(1, Number(selectedSku?.caseSize) || 12);
    const qtyBottles = caseQty * caseSize;

    // Stock availability check for sales reps / wholesalers (inventory is bottles)
    if (variant === "sales_rep" || variant === "distributor") {
      const available = availableBottlesForSku(sku);
      if (available < qtyBottles) {
        setError(
          `Insufficient stock for ${sku}. Available: ${Math.floor(available / caseSize).toLocaleString()} cases (${available.toLocaleString()} bt). Requested: ${caseQty.toLocaleString()} cases (${qtyBottles.toLocaleString()} bt).`,
        );
        return;
      }
    }
    let priceNum: number;
    if (variant === "sales_rep" && listTotal > 0) {
      priceNum = netTotal;
    } else {
      if (!price.trim()) {
        setError(`Enter the order value (${resolvedCase.currency || "USD"}).`);
        return;
      }
      priceNum = parseFloat(price.replace(/,/g, ""));
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        setError("Order value must be a number zero or greater.");
        return;
      }
    }

    if (variant === "distributor" && wholesalerPath === "rep" && !wholesaleRep.trim()) {
      setError("Select the field rep this route is for.");
      return;
    }

    let repLine = effectiveSalesRep;
    let routingTarget: OrderRoutingTarget | undefined;
    let assignedSalesRep: string | undefined;

    if (variant === "brand") {
      routingTarget = brandPath;
    } else if (variant === "distributor") {
      routingTarget = wholesalerPath === "rep" ? "sales_rep" : "retail";
      if (wholesalerPath === "rep") {
        repLine = wholesaleRep;
        assignedSalesRep = wholesaleRep;
      } else {
        const acc = allAccounts.find((a) => a.tradingName === accountPick);
        repLine = acc?.salesOwner ?? salesRep;
      }
    } else if (variant === "sales_rep") {
      routingTarget = "retail";
      repLine = sessionRep;
    } else if (variant === "manufacturer") {
      routingTarget = "manufacturer";
    }

    const discountNote =
      variant === "sales_rep" && discountPctNum > 0
        ? [
            `Discount: ${discountPctNum}%`,
            discountReason.trim() ? discountReason.trim() : "volume / incentive",
            `List ${listTotal.toLocaleString()} ${resolvedCase.currency} → net ${priceNum.toLocaleString()} ${resolvedCase.currency}`,
          ].join(" — ")
        : undefined;

    const order: SalesOrder = {
      id: nextOrderId(existingOrders),
      account: resolvedAccountForOrder,
      market: market.trim(),
      orderDate,
      requestedDelivery,
      sku,
      quantity: qtyBottles,
      price: Math.round(priceNum * 100) / 100,
      salesRep: repLine,
      status,
      paymentStatus,
      orderRoutingTarget: routingTarget,
      orderCreatedByRole: orderCreatedByFromRole(user?.role || "brand_operator"),
      repApprovalStatus: "not_required",
      assignedSalesRep,
      placedOnBehalfByRep: variant === "sales_rep",
      notes: discountNote,
      orderNotes: discountNote,
      // NEW: Proxy mode fields
      placedByRole: isProxyMode ? orderCreatedByFromRole(user?.role || "brand_operator") : undefined,
      onBehalfOfAccount: isProxyMode ? onBehalfOfAccountId || undefined : undefined,
    };

    onCreate(order);
    
    // Show appropriate success message
    if (isProxyMode && onBehalfOfAccountId) {
      const auditInfo = getProxyAuditInfo(order);
      toast.success(cfg.badge + " — Proxy order saved", { 
        description: `${order.id} · ${resolvedAccountForOrder} · ${auditInfo.auditMessage}` 
      });
    } else {
      toast.success(cfg.badge + " — Order saved", { description: `${order.id} · ${resolvedAccountForOrder}` });
    }
    
    onOpenChange(false);
  };

  const showLifecycleDetails = variant !== "manufacturer";
  const isMobile = useIsMobile();
  
  // NEW: Proxy mode available for brand_operator and operations
  const canUseProxyMode = user?.role === "brand_operator" || user?.role === "operations" || user?.role === "founder_admin";

  const headerBadges = (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="secondary" className="font-normal">
        {cfg.badge}
      </Badge>
      {isProxyMode && (
        <Badge variant="outline" className="font-normal text-amber-600 border-amber-600">
          Proxy Mode
        </Badge>
      )}
    </div>
  );

  const formFields = (
        <form
          id="new-sales-order-form"
          onSubmit={handleSubmit}
          className={isMobile ? "flex min-h-0 flex-1 flex-col" : "space-y-6"}
        >
          <div
            className={
              isMobile
                ? "min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-y-contain touch-pan-y px-4 pb-4 pt-2"
                : "contents"
            }
          >
          {variant === "brand" ? (
            <div className="space-y-2 rounded-lg border border-border/80 bg-muted/20 p-4">
              <Label htmlFor="so-brand-path">Order pathway *</Label>
              <p className="text-xs text-muted-foreground">Choose who this sell-in is for — Brand HQ can route across the network.</p>
              <Select value={brandPath} onValueChange={(v) => setBrandPath(v as OrderRoutingTarget)}>
                <SelectTrigger id="so-brand-path" className="touch-manipulation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manufacturer">Distillery / production</SelectItem>
                  <SelectItem value="wholesaler">Wholesaler / distributor (DC)</SelectItem>
                  <SelectItem value="sales_rep">Field sales rep</SelectItem>
                  <SelectItem value="retail">Retail store</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {variant === "distributor" ? (
            <div className="space-y-3 rounded-lg border border-border/80 bg-muted/20 p-4">
              <Label htmlFor="so-wh-path">Place order for *</Label>
              <p className="text-xs text-muted-foreground">Wholesalers route to a rep's book or direct to a retail account.</p>
              <Select value={wholesalerPath} onValueChange={(v) => setWholesalerPath(v as "rep" | "retail")}>
                <SelectTrigger id="so-wh-path" className="touch-manipulation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rep">Retail account (attributed to a field rep)</SelectItem>
                  <SelectItem value="retail">Retail store (direct)</SelectItem>
                </SelectContent>
              </Select>
              {wholesalerPath === "rep" ? (
                <div className="space-y-2">
                  <Label htmlFor="so-wh-rep">Field rep *</Label>
                  <Select value={wholesaleRep || undefined} onValueChange={setWholesaleRep}>
                    <SelectTrigger id="so-wh-rep" className="touch-manipulation">
                      <SelectValue placeholder={salesRepNames.length ? "Select field rep" : "No sales reps yet"} />
                    </SelectTrigger>
                    <SelectContent>
                      {salesRepNames.length === 0 ? (
                        <SelectItem value="__none" disabled>
                          No sales reps yet — invite one in CRM
                        </SelectItem>
                      ) : (
                        salesRepNames.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>
          ) : null}
          
          {/* NEW: Proxy Mode Section for Brand Operator */}
          {canUseProxyMode && (
            <div className="space-y-3 rounded-lg border border-amber-600/30 bg-amber-50/30 p-4">
              <div className="flex items-start gap-3">
                <Checkbox 
                  id="proxy-mode" 
                  checked={isProxyMode} 
                  onCheckedChange={(v) => {
                    setIsProxyMode(v === true);
                    if (!v) setOnBehalfOfAccountId("");
                  }}
                />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="proxy-mode" className="text-sm font-medium">
                    Proxy Mode — Place order on behalf of another account
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Order will be recorded as placed by {sessionRoleLabel} on behalf of the selected account. 
                    Downstream roles will see it as coming from the original account.
                  </p>
                </div>
              </div>
              
              {isProxyMode && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="on-behalf-of">On behalf of account *</Label>
                  <Select value={onBehalfOfAccountId || undefined} onValueChange={setOnBehalfOfAccountId}>
                    <SelectTrigger id="on-behalf-of" className="touch-manipulation">
                      <SelectValue placeholder="Select account..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allAccounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.tradingName || a.legalName} · {a.type} · {a.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {onBehalfOfAccountId && (
                    <p className="text-xs text-amber-700">
                      Audit trail: {sessionRoleLabel} placing order for account {onBehalfOfAccountId}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{cfg.customerSectionLabel}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="so-account">
                  {variant === "brand" && brandAccountGuide ? brandAccountGuide.label : "Account *"}
                </Label>
                {variant === "brand" && brandAccountGuide && brandCrmAccountChoices ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      {brandAccountGuide.hint} Edit roster in{" "}
                      <Link to="/crm" className="font-medium text-primary underline-offset-2 hover:underline">
                        CRM
                      </Link>{" "}
                      and{" "}
                      <Link to="/accounts" className="font-medium text-primary underline-offset-2 hover:underline">
                        Accounts
                      </Link>
                      .
                    </p>
                    {brandCrmAccountChoices.length === 0 ? (
                      <p className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                        {brandAccountGuide.empty}
                      </p>
                    ) : (
                      <Select value={account || undefined} onValueChange={setAccount}>
                        <SelectTrigger id="so-account" className="touch-manipulation">
                          <SelectValue placeholder={brandAccountGuide.placeholder} />
                        </SelectTrigger>
                        <SelectContent className="max-h-[min(60vh,320px)]">
                          {brandCrmAccountChoices.map((row) => {
                            if (row.kind === "account") {
                              const a = row.account;
                              const m = row.member;
                              const wh =
                                m?.role === "distributor" ? warehouseName(m.primaryWarehouseId) : undefined;
                              return (
                                <SelectItem key={row.key} value={row.key}>
                                  <span className="flex flex-col gap-0.5 text-left">
                                    <span className="font-medium leading-tight">{a.tradingName}</span>
                                    {m ? (
                                      <span className="text-[11px] font-normal text-muted-foreground">
                                        CRM: {m.displayName} · {m.email}
                                        {wh ? ` · Receiving: ${wh}` : ""}
                                      </span>
                                    ) : (
                                      <span className="text-[11px] font-normal text-amber-800 dark:text-amber-500">
                                        {brandAccountGuide.missingCrm}
                                      </span>
                                    )}
                                  </span>
                                </SelectItem>
                              );
                            }
                            const m = row.member;
                            const wh =
                              m.role === "distributor" ? warehouseName(m.primaryWarehouseId) : undefined;
                            return (
                              <SelectItem key={row.key} value={row.key}>
                                <span className="flex flex-col gap-0.5 text-left">
                                  <span className="flex flex-wrap items-center gap-1.5 leading-tight">
                                    <span className="font-medium">{m.displayName}</span>
                                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                                      CRM only
                                    </Badge>
                                  </span>
                                  <span className="text-[11px] font-normal text-muted-foreground">
                                    {m.email}
                                    {wh ? ` · Receiving: ${wh}` : ""}
                                  </span>
                                  <span className="text-[11px] font-normal text-amber-800 dark:text-amber-500">
                                    {brandAccountGuide.crmOnlyNote}
                                  </span>
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  </>
                ) : (
                  <Select value={account || undefined} onValueChange={setAccount}>
                    <SelectTrigger id="so-account" className="touch-manipulation">
                      <SelectValue placeholder="Choose customer account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.tradingName}>
                          {a.tradingName}
                          {a.status === "prospect" ? " (prospect)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="so-market">Market / region *</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Select
                    value={marketIsCustom ? "__custom__" : market}
                    onValueChange={(v) => {
                      if (v === "__custom__") {
                        setMarketIsCustom(true);
                        setMarket("");
                        return;
                      }
                      setMarketIsCustom(false);
                      setMarket(v);
                    }}
                  >
                    <SelectTrigger id="so-market" className="touch-manipulation sm:col-span-1">
                      <SelectValue placeholder="Select market / region" />
                    </SelectTrigger>
                    <SelectContent>
                      {marketOptionsForPathway.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                      <SelectItem value="__custom__">Other…</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="so-market-custom"
                    value={market}
                    onChange={(e) => {
                      setMarketIsCustom(true);
                      setMarket(e.target.value);
                    }}
                    placeholder="e.g. Ontario, Toronto, Milan"
                    className="min-h-10"
                    aria-label="Market / region detail"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Options update based on order pathway: {pathwayTarget.replace(/_/g, " ")}.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Dates</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="so-order-date">Order date *</Label>
                <Input id="so-order-date" type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="so-delivery">Requested delivery *</Label>
                <Input
                  id="so-delivery"
                  type="date"
                  value={requestedDelivery}
                  onChange={(e) => setRequestedDelivery(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{cfg.lineItemSectionLabel}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="so-sku">SKU / product *</Label>
                {skuOptions.length === 0 ? (
                  <p className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    No products yet.{" "}
                    <Link to="/settings" className="font-medium text-primary underline-offset-2 hover:underline">
                      Add SKUs in Settings
                    </Link>
                    .
                  </p>
                ) : (
                  <Select value={sku || undefined} onValueChange={setSku}>
                    <SelectTrigger id="so-sku" className="touch-manipulation">
                      <SelectValue placeholder="Select product SKU" />
                    </SelectTrigger>
                    <SelectContent>
                      {skuOptions.map((p) => (
                        <SelectItem key={p.sku} value={p.sku}>
                          {p.sku} — {p.name} {p.size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="so-qty">Quantity (cases) *</Label>
                <Input
                  id="so-qty"
                  type="number"
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
                {selectedSku ? (
                  <p className="text-[11px] text-muted-foreground">
                    {Math.max(1, parseInt(quantity, 10) || 1) * (selectedSku.caseSize || 12)} bottles (
                    {selectedSku.caseSize || 12} bt / case).
                  </p>
                ) : null}
                {sku && selectedSku ? (
                  <StockAvailability
                    availableBottles={availableBottlesForSku(sku)}
                    requestedCases={Math.max(1, parseInt(quantity, 10) || 0)}
                    caseSize={selectedSku.caseSize || 12}
                  />
                ) : null}
              </div>
              <div className="space-y-2">
                {variant === "sales_rep" ? (
                  <>
                    <Label htmlFor="so-price">Order value ({resolvedCase.currency || "USD"}) *</Label>
                    {partnerSheetState === "missing" ? (
                      <p className="rounded-md border border-dashed border-amber-600/40 bg-amber-50/40 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
                        No wholesale sell-out sheet linked — ask your distributor to set prices on Inventory and confirm
                        your CRM link to their account.
                      </p>
                    ) : null}
                    {partnerSheetState === "error" ? (
                      <p className="rounded-md border border-dashed border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                        Could not load distributor sell-out prices. Try again, or enter value after HQ links your sheet.
                      </p>
                    ) : null}
                    {salesRepPriced ? (
                      <div className="space-y-3 rounded-lg border border-border/80 bg-muted/20 p-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                          <span className="text-muted-foreground">List total</span>
                          <span className="font-display font-semibold tabular-nums text-foreground">
                            {listTotal.toLocaleString()} {resolvedCase.currency}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          From {priceSourceLabel(resolvedCase.source, { forSalesRep: true })}:{" "}
                          {resolvedCase.casePrice.toLocaleString()} {resolvedCase.currency} / case × {caseQtyForPrice}{" "}
                          case{caseQtyForPrice === 1 ? "" : "s"}
                          {selectedSku ? ` (${selectedSku.caseSize} bt / case)` : ""}.
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="so-discount">Discount %</Label>
                            <Input
                              id="so-discount"
                              type="number"
                              min={0}
                              max={100}
                              step={0.1}
                              inputMode="decimal"
                              value={discountPct}
                              onChange={(e) => setDiscountPct(e.target.value)}
                              className="touch-manipulation"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="so-discount-reason">Reason (volume / incentive)</Label>
                            <Input
                              id="so-discount-reason"
                              value={discountReason}
                              onChange={(e) => setDiscountReason(e.target.value)}
                              placeholder="e.g. volume ladder, SPIF"
                              className="touch-manipulation"
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border/60 pt-2 text-sm">
                          <span className="font-medium text-foreground">Net order value</span>
                          <span className="font-display text-lg font-semibold tabular-nums text-foreground">
                            {netTotal.toLocaleString()} {resolvedCase.currency}
                          </span>
                        </div>
                        <input id="so-price" type="hidden" value={netTotal} readOnly />
                      </div>
                    ) : (
                      <>
                        <Input
                          id="so-price"
                          type="number"
                          min={0}
                          step={0.01}
                          inputMode="decimal"
                          value={price}
                          onChange={(e) => {
                            setPriceAuto(false);
                            setPrice(e.target.value);
                          }}
                          placeholder="0.00"
                          required
                          className="touch-manipulation"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          {selectedSku
                            ? "Enter order value manually (no sell-out case price on this SKU yet)."
                            : "Select a SKU to auto-price from distributor sell-out."}
                        </p>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Label htmlFor="so-price">Order value ({resolvedCase.currency || "USD"}) *</Label>
                    <Input
                      id="so-price"
                      type="number"
                      min={0}
                      step={0.01}
                      inputMode="decimal"
                      value={price}
                      onChange={(e) => {
                        setPriceAuto(false);
                        setPrice(e.target.value);
                      }}
                      placeholder="0.00"
                      required
                    />
                    {selectedSku ? (
                      Number.isFinite(resolvedCase.casePrice) && resolvedCase.casePrice > 0 ? (
                        <p className="text-[11px] text-muted-foreground">
                          Auto-priced from {priceSourceLabel(resolvedCase.source)}:{" "}
                          {resolvedCase.casePrice.toLocaleString()} {resolvedCase.currency} / case × {caseQtyForPrice}{" "}
                          case{caseQtyForPrice === 1 ? "" : "s"} ({selectedSku.caseSize} bt / case).
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground">
                          Enter order value manually (no case price set on this SKU).
                        </p>
                      )
                    ) : (
                      <p className="text-[11px] text-muted-foreground">
                        Enter order value manually (no case price set on this SKU).
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{cfg.assignmentSectionLabel}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {variant === "sales_rep" ? (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Sales rep (attributed)</Label>
                  <div className="rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm">
                    <span className="text-muted-foreground">You</span>
                    <p className="font-medium text-foreground">{sessionRep}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="so-rep">Sales rep *</Label>
                  <Select value={salesRep || undefined} onValueChange={setSalesRep}>
                    <SelectTrigger id="so-rep" className="touch-manipulation">
                      <SelectValue placeholder={salesRepNames.length ? "Select sales rep" : "No sales reps yet"} />
                    </SelectTrigger>
                    <SelectContent>
                      {salesRepNames.length === 0 ? (
                        <SelectItem value="__none" disabled>
                          No sales reps yet — invite one in CRM
                        </SelectItem>
                      ) : (
                        salesRepNames.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {showLifecycleDetails ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="so-status">Order status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as SalesOrder["status"])}>
                      <SelectTrigger id="so-status" className="touch-manipulation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="so-pay">Payment status</Label>
                    <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as SalesOrder["paymentStatus"])}>
                      <SelectTrigger id="so-pay" className="touch-manipulation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  Order stays <strong>draft</strong> until confirmed in Orders; payment pending by default.
                </p>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          {isMobile ? (
            <div className="flex shrink-0 gap-2 border-t border-border bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11 flex-1 touch-manipulation">
                Cancel
              </Button>
              <Button type="submit" className="h-11 flex-1 touch-manipulation">
                {isProxyMode ? "Create Proxy Order" : cfg.submitLabel}
              </Button>
            </div>
          ) : (
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="touch-manipulation">
                Cancel
              </Button>
              <Button type="submit" className="touch-manipulation">
                {isProxyMode ? "Create Proxy Order" : cfg.submitLabel}
              </Button>
            </DialogFooter>
          )}
        </form>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className={`flex h-[100svh] max-h-[100svh] w-full flex-col gap-0 overflow-hidden overscroll-none rounded-t-2xl p-0 ${cfg.accent}`}
        >
          <SheetHeader className="shrink-0 space-y-2 border-b border-border px-4 pb-3 pt-5 text-left">
            {headerBadges}
            <SheetTitle className="font-display text-xl">{cfg.title}</SheetTitle>
            <SheetDescription className="text-pretty text-left">{cfg.description}</SheetDescription>
            {cfg.contextNote ? <p className="text-xs text-muted-foreground">{cfg.contextNote}</p> : null}
          </SheetHeader>
          {formFields}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-h-[min(90vh,800px)] overflow-y-auto sm:max-w-2xl ${cfg.accent}`}>
        <DialogHeader className="space-y-3">
          {headerBadges}
          <DialogTitle className="font-display text-xl">{cfg.title}</DialogTitle>
          <DialogDescription className="text-pretty">{cfg.description}</DialogDescription>
          {cfg.contextNote ? <p className="text-xs text-muted-foreground">{cfg.contextNote}</p> : null}
        </DialogHeader>
        {formFields}
      </DialogContent>
    </Dialog>
  );
}
