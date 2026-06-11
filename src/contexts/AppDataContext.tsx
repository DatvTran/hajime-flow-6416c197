import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  Account,
  DepletionReport,
  InventoryItem,
  NewProductRequest,
  Product,
  PurchaseOrder,
  SalesOrder,
  TransferOrder,
} from "@/data/mockData";
import { deductFifoAvailableBottles } from "@/lib/inventory-deduct";
import {
  moveInventory,
  reserveInventory,
  releaseReservation,
  deductInTransitInventory,
  canShipTransfer,
  getInventoryByLocation,
  type InTransitDetails,
} from "@/lib/inventory-movement";
import { fetchAppData, mapApiInventoryRows } from "@/lib/data-service";
import type { AppData, FinancingLedgerEntry, TeamMember, TeamMemberPortalRole } from "@/types/app-data";
import type { ProductionStatus } from "@/data/mockData";
import seedJson from "@/data/seed-app.json";
import { toast } from "@/components/ui/sonner";
import { normalizeAppData } from "@/lib/normalize-app-data";
import { applyCatalogToAppData, mapApiRowToProduct } from "@/lib/product-catalog-sync";
import {
  mapNewProductRequestApiResponse,
  mapNewProductRequestPatchToApi,
  newProductRequestApiId,
} from "@/lib/new-product-request-api";
import { loadLocalAppData, saveLocalAppData } from "@/lib/local-app-data";
import {
  canSyncOrderStatusToApi,
  isPersistedApiOrderId,
  resolveAccountForSalesOrder,
} from "@/lib/sales-order-utils";
import { useAuth } from "./AuthContext";
import {
  createProduct as apiCreateProduct,
  updateProduct as apiUpdateProduct,
  updateProductBySku as apiUpdateProductBySku,
  deleteProductBySku as apiDeleteProductBySku,
  createAccount as apiCreateAccount,
  updateAccount as apiUpdateAccount,
  createOrder as apiCreateOrder,
  updateOrderStatus as apiUpdateOrderStatus,
  adjustInventory as apiAdjustInventory,
  createDepletionReport as apiCreateDepletionReport,
  updateDepletionReport as apiUpdateDepletionReport,
  deleteDepletionReport as apiDeleteDepletionReport,
  createInventoryAdjustmentRequest as apiCreateInventoryAdjustmentRequest,
  getInventoryAdjustmentRequests as apiGetInventoryAdjustmentRequests,
  createPurchaseOrder as apiCreatePurchaseOrder,
  updatePurchaseOrder as apiUpdatePurchaseOrder,
  updatePurchaseOrderStatus as apiUpdatePurchaseOrderStatus,
  deletePurchaseOrder as apiDeletePurchaseOrder,
  createTransferOrder as apiCreateTransferOrder,
  updateTransferOrder as apiUpdateTransferOrder,
  updateTransferOrderStatus as apiUpdateTransferOrderStatus,
  deleteTransferOrder as apiDeleteTransferOrder,
  createShipment as apiCreateShipment,
  updateShipment as apiUpdateShipment,
  updateShipmentStatus as apiUpdateShipmentStatus,
  deleteShipment as apiDeleteShipment,
  createIncentive as apiCreateIncentive,
  updateIncentive as apiUpdateIncentive,
  updateIncentiveStatus as apiUpdateIncentiveStatus,
  deleteIncentive as apiDeleteIncentive,
  getTeamMembers as apiGetTeamMembers,
  getShipments as apiGetShipments,
  getInventory as apiGetInventory,
  getIncentives as apiGetIncentives,
  getProducts as apiGetProducts,
  createProductionStatus as apiCreateProductionStatus,
  updateProductionStatus as apiUpdateProductionStatus,
  deleteProductionStatus as apiDeleteProductionStatus,
  getProductionStatuses as apiGetProductionStatuses,
} from "@/lib/api-v1-mutations";
import { mapApiOrdersToSalesOrders, mapRowToShipment, mergeSalesOrdersFromApi } from "@/lib/data-service";
import { getOrders } from "@/lib/api-v1";
import { resolveOrderIdForApiUpdate } from "@/lib/sales-order-api-id";
import {
  getNewProductRequests,
  createNewProductRequest as apiCreateNewProductRequest,
  updateNewProductRequest as apiUpdateNewProductRequest,
  deleteNewProductRequest as apiDeleteNewProductRequest,
} from "@/lib/api-v1";

const FALLBACK_SEED = normalizeAppData(seedJson as AppData);

/** Build API payload aligned with `products` table + JSONB metadata (see data-service transformToAppData). */
function catalogProductApiPayload(merged: Product): {
  name: string;
  description?: string;
  category?: string;
  unit_size: string;
  metadata: Record<string, unknown>;
} {
  const wholesale = merged.wholesaleCasePrice ?? 0;
  return {
    name: merged.name,
    ...(merged.shortDescription != null ? { description: merged.shortDescription } : {}),
    unit_size: merged.size,
    metadata: {
      size: merged.size,
      caseSize: merged.caseSize,
      wholesalePriceCase: wholesale,
      wholesaleCasePrice: wholesale,
      retailPriceCase: 0,
      minOrderCases: merged.minOrderCases ?? 1,
      status: merged.status,
      ...(merged.abv != null ? { abv: merged.abv } : {}),
      ...(merged.imageUrl != null ? { imageUrl: merged.imageUrl, image: merged.imageUrl } : {}),
    },
  };
}

/**
 * Merge server data with local data - local changes take precedence.
 * Preserves new features (financing ledger, shelf stock, onboarding) when API doesn't have them yet.
 */
function mergeServerWithLocal(server: AppData, local: AppData | null): AppData {
  if (!local) return applyCatalogToAppData(server);
  
  // Start with server data as base
  const merged: AppData = { ...server };
  
  // Preserve local arrays if server returns empty (API might not support these features yet)
  if (!server.financingLedger?.length && local.financingLedger?.length) {
    merged.financingLedger = local.financingLedger;
  }
  if (!server.visitNotes?.length && local.visitNotes?.length) {
    merged.visitNotes = local.visitNotes;
  }
  
  // Merge retailer shelf stock - combine both sources
  merged.retailerShelfStock = {
    ...server.retailerShelfStock,
    ...local.retailerShelfStock,
  };

  // Operational settings: server GET includes replenishment + HQ labels when DB is migrated
  if (!server.operationalSettings && local.operationalSettings) {
    merged.operationalSettings = local.operationalSettings;
  } else if (server.operationalSettings && local.operationalSettings) {
    merged.operationalSettings = { ...local.operationalSettings, ...server.operationalSettings };
  } else if (server.operationalSettings) {
    merged.operationalSettings = server.operationalSettings;
  }
  
  // For accounts: preserve onboardingPipeline status from local if server account doesn't have it.
  // Important: do NOT require server.accounts.length > 0; otherwise an empty server response can wipe local-only data.
  if (local.accounts?.length && Array.isArray(server.accounts)) {
    const localAccountsById = new Map(local.accounts.map((a) => [a.id, a]));
    merged.accounts = (server.accounts ?? []).map((serverAccount) => {
      const localAccount = localAccountsById.get(serverAccount.id);
      if (localAccount?.onboardingPipeline && !serverAccount.onboardingPipeline) {
        return { ...serverAccount, onboardingPipeline: localAccount.onboardingPipeline };
      }
      return serverAccount;
    });

    // Add local-only accounts (new accounts created while offline)
    const serverIds = new Set((server.accounts ?? []).map((a) => a.id));
    const localOnlyAccounts = local.accounts.filter((a) => !serverIds.has(a.id));
    merged.accounts = [...merged.accounts, ...localOnlyAccounts];
  }
  
  // Orders: server is source of truth; keep offline drafts only (see mergeSalesOrdersFromApi).
  if (Array.isArray(server.salesOrders)) {
    merged.salesOrders = mergeSalesOrdersFromApi(local.salesOrders ?? [], server.salesOrders);
  }

  // CRM contacts: always prefer the server's list when it has data so Settings → team members
  // updates (from another session or after API mutations) are not stuck behind an old
  // localStorage copy. If the API returns empty, keep local roster (offline / not migrated).
  if (Array.isArray(server.teamMembers) && server.teamMembers.length > 0) {
    merged.teamMembers = server.teamMembers;
  }

  // Catalog: server is the shared source of truth (Brand Operator → all roles on same tenant).
  if (Array.isArray(server.products) && server.products.length > 0) {
    merged.products = server.products;
  } else if (local.products?.length && (!server.products || server.products.length === 0)) {
    merged.products = local.products;
  }

  if (Array.isArray(server.purchaseOrders) && server.purchaseOrders.length > 0 && local.purchaseOrders?.length) {
    const serverPoIds = new Set(server.purchaseOrders.map((p) => p.id).filter(Boolean));
    const localOnlyPos = local.purchaseOrders.filter((p) => p.id && !serverPoIds.has(p.id));
    merged.purchaseOrders = [...server.purchaseOrders, ...localOnlyPos];
  }

  return applyCatalogToAppData(merged);
}

const CRM_PORTAL_ROLES = new Set<TeamMemberPortalRole>([
  "sales_rep",
  "retail",
  "distributor",
  "manufacturer",
]);

function sliceIsoDate(v: unknown): string {
  if (v == null || v === "") return new Date().toISOString().slice(0, 10);
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

/** Map `/api/v1/team-members` row → client `TeamMember` (aligned with data-service). */
function mapApiRowToTeamMember(row: Record<string, unknown>): TeamMember {
  const roleRaw = String(row.role ?? "sales_rep");
  const role = (
    CRM_PORTAL_ROLES.has(roleRaw as TeamMemberPortalRole) ? roleRaw : "sales_rep"
  ) as TeamMemberPortalRole;
  const isActive =
    row.is_active === undefined || row.is_active === null ? true : Boolean(row.is_active);
  const pwRaw = row.primary_warehouse_id;
  const primaryWarehouseId =
    pwRaw != null && String(pwRaw).trim() !== "" ? String(pwRaw).trim() : undefined;
  const pendingRaw = row.pending_distributor_approval;
  const pendingDistributorApproval =
    pendingRaw === undefined || pendingRaw === null ? undefined : Boolean(pendingRaw);
  const crmReqRaw = row.crm_requested_by_user_id;
  const crmRequestedByUserId =
    crmReqRaw != null && String(crmReqRaw).trim() !== ""
      ? String(crmReqRaw).trim()
      : undefined;
  const managedByUserId =
    row.managed_by_user_id != null && String(row.managed_by_user_id).trim() !== ""
      ? String(row.managed_by_user_id).trim()
      : undefined;

  return {
    id: String(row.id ?? ""),
    displayName: String(row.name ?? row.display_name ?? ""),
    email: String(row.email ?? "").trim().toLowerCase(),
    role,
    createdAt: sliceIsoDate(row.created_at ?? row.createdAt),
    isActive,
    ...(primaryWarehouseId ? { primaryWarehouseId } : {}),
    ...(pendingDistributorApproval === true ? { pendingDistributorApproval: true } : {}),
    ...(crmRequestedByUserId ? { crmRequestedByUserId } : {}),
    ...(managedByUserId ? { managedByUserId } : {}),
  };
}

function sumAvailableForSku(items: InventoryItem[], sku: string): number {
  // Only count inventory at distributor warehouses and retail shelves as "available" for fulfillment
  // Manufacturer and in-transit inventory is NOT available for sales/transfer
  return items
    .filter(
      (i) =>
        i.sku === sku &&
        i.status === "available" &&
        (i.locationType === "distributor_warehouse" || i.locationType === "retail_shelf")
    )
    .reduce((sum, i) => sum + i.quantityBottles, 0);
}

/** Get available inventory at a specific warehouse location */
function sumAvailableAtWarehouse(items: InventoryItem[], sku: string, warehouse: string): number {
  return items
    .filter(
      (i) =>
        i.sku === sku &&
        i.warehouse === warehouse &&
        i.status === "available" &&
        i.locationType === "distributor_warehouse"
    )
    .reduce((sum, i) => sum + i.quantityBottles, 0);
}

/** Get available inventory at a specific location type */
function sumAvailableAtLocationType(
  items: InventoryItem[],
  sku: string,
  locationType: InventoryItem["locationType"]
): number {
  return items
    .filter((i) => i.sku === sku && i.status === "available" && i.locationType === locationType)
    .reduce((sum, i) => sum + i.quantityBottles, 0);
}

/** Get inventory breakdown by location type for a SKU */
function getInventoryBreakdown(
  items: InventoryItem[],
  sku: string
): Record<InventoryItem["locationType"], number> {
  const result: Record<string, number> = {
    manufacturer: 0,
    distributor_warehouse: 0,
    in_transit: 0,
    retail_shelf: 0,
  };

  for (const item of items) {
    if (item.sku !== sku) continue;
    if (item.status !== "available") continue;
    result[item.locationType] = (result[item.locationType] || 0) + item.quantityBottles;
  }

  return result as Record<InventoryItem["locationType"], number>;
}

type AppDataContextValue = {
  data: AppData;
  loading: boolean;
  error: string | null;
  updateData: (fn: (prev: AppData) => AppData) => void;
  /** Re-fetch CRM contacts from the API and merge into local app state + localStorage. */
  refreshTeamMembers: () => Promise<void>;
  /** Re-fetch shipments from the API and merge into app state. */
  refreshShipments: () => Promise<void>;
  /** Re-fetch sales orders (role-scoped) and merge into app state. */
  refreshSalesOrders: () => Promise<void>;
  /** Re-fetch product catalog from the API (Brand Operator source of truth). */
  refreshProducts: () => Promise<void>;
  /** Re-fetch inventory rows from the API and merge into app state. */
  refreshInventory: () => Promise<void>;
};

const AppDataStateContext = createContext<AppDataContextValue | null>(null);

function AppDataLoadingScreen({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <p className="text-center text-sm text-muted-foreground">Loading your store data…</p>
        {error ? <p className="text-center text-xs text-destructive">{error}</p> : null}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/60"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const skipSaveRef = useRef(true);
  const [fetchEpoch, setFetchEpoch] = useState(0);

  // Hydrate from localStorage or seed synchronously so dashboards render immediately (stale-while-revalidate).
  useLayoutEffect(() => {
    if (!user) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    const local = loadLocalAppData();
    if (local) {
      setData(normalizeAppData(applyCatalogToAppData(local)));
    } else {
      setData(FALLBACK_SEED);
    }
    setLoading(false);
    setError(null);
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const hadLocalOnStart = Boolean(loadLocalAppData());

    const applyServer = (serverData: AppData) => {
      const merged = mergeServerWithLocal(serverData, loadLocalAppData());
      setData(normalizeAppData(applyCatalogToAppData(merged)));
      setError(null);
      saveLocalAppData(merged);
    };

    (async () => {
      try {
        const platformData = await fetchAppData({ scope: "platform" });
        if (!cancelled) applyServer(platformData as AppData);
      } catch (e) {
        console.error("[AppDataContext] Platform sync error:", e);
        if (!cancelled) {
          const message = e instanceof Error ? e.message : String(e);
          setError(message);
          if (!hadLocalOnStart) {
            setData((prev) => prev ?? FALLBACK_SEED);
            toast.info("API unavailable — using local seed data", {
              description: "Start the server (npm run dev:api) to load and save persisted data. Edits save in-browser until then.",
            });
          } else {
            toast.info("API unavailable — working from local copy", {
              description: "Your changes are saved in this browser. Connect to server to sync.",
            });
          }
        }
        return;
      }

      if (cancelled) return;

      try {
        const fullData = await fetchAppData({ scope: "full" });
        if (!cancelled) applyServer(fullData as AppData);
      } catch (e) {
        console.warn("[AppDataContext] Full distributor sync skipped:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, fetchEpoch]);

  const updateData = useCallback((fn: (prev: AppData) => AppData) => {
    setData((prev) => {
      if (!prev) return prev;
      return fn(prev);
    });
  }, []);

  const refreshTeamMembers = useCallback(async () => {
    const res = (await apiGetTeamMembers({ includeInactive: true })) as { data?: unknown[] };
    const rows = Array.isArray(res.data) ? res.data : [];
    const teamMembers = rows.map((r) => mapApiRowToTeamMember(r as Record<string, unknown>));
    setData((prev) => {
      if (!prev) return prev;
      return normalizeAppData({ ...prev, teamMembers });
    });
  }, []);

  const refreshShipments = useCallback(async () => {
    try {
      const res = (await apiGetShipments({ limit: 200 })) as { data?: unknown[] };
      const rows = Array.isArray(res.data) ? res.data : [];
      const shipments = rows.map((r) => mapRowToShipment(r as Record<string, unknown>));
      setData((prev) => {
        if (!prev) return prev;
        const apiIds = new Set(shipments.map((s) => s.id));
        const localOnly = prev.shipments.filter((s) => !apiIds.has(s.id));
        const prevById = new Map(prev.shipments.map((s) => [s.id, s]));
        const merged = shipments.map((apiRow) => {
          const local = prevById.get(apiRow.id);
          if (
            local?.status === "delivered" &&
            apiRow.status !== "delivered" &&
            local.type === "inbound" &&
            /verified by/i.test(local.notes ?? "")
          ) {
            return {
              ...apiRow,
              status: "delivered" as const,
              eta: local.eta || apiRow.eta,
              notes: local.notes || apiRow.notes,
            };
          }
          return apiRow;
        });
        return normalizeAppData({ ...prev, shipments: [...merged, ...localOnly] });
      });
    } catch (err) {
      console.warn("[refreshShipments] API list failed; keeping local shipments:", err);
    }
  }, []);

  const refreshSalesOrders = useCallback(async () => {
    try {
      const res = await getOrders({ limit: 200 });
      const rows = Array.isArray(res.data) ? res.data : [];
      setData((prev) => {
        if (!prev) return prev;
        const fromApi = mapApiOrdersToSalesOrders(
          rows as Record<string, unknown>[],
          prev.accounts.map((a) => ({ id: a.id, market: a.market })),
        );
        return normalizeAppData({
          ...prev,
          salesOrders: mergeSalesOrdersFromApi(prev.salesOrders, fromApi),
        });
      });
    } catch (err) {
      console.warn("[refreshSalesOrders] API list failed; keeping local orders:", err);
    }
  }, []);

  const refreshProducts = useCallback(async () => {
    const res = (await apiGetProducts({ limit: 500 })) as { data?: unknown[] };
    const rows = Array.isArray(res.data) ? res.data : [];
    const products = rows.map((r) => mapApiRowToProduct(r as Record<string, unknown>));
    setData((prev) => {
      if (!prev) return prev;
      return normalizeAppData(applyCatalogToAppData({ ...prev, products }));
    });
  }, []);

  const refreshInventory = useCallback(async () => {
    try {
      const res = (await apiGetInventory({ limit: 500 })) as { data?: unknown[] };
      const rows = Array.isArray(res.data) ? res.data : [];
      const inventory = mapApiInventoryRows(rows);
      setData((prev) => {
        if (!prev) return prev;
        return normalizeAppData({ ...prev, inventory });
      });
    } catch (err) {
      console.warn("[refreshInventory] API list failed; keeping local inventory:", err);
    }
  }, []);

  // Stage 4: Removed auto-save useEffect — writes now use granular API mutations
  // Local changes are persisted via saveLocalAppData only
  useEffect(() => {
    if (!data || loading) return;
    saveLocalAppData(data);
  }, [data, loading]);

  const value = useMemo((): AppDataContextValue | null => {
    if (!data) return null;
    return {
      data,
      loading,
      error,
      updateData,
      refreshTeamMembers,
      refreshShipments,
      refreshSalesOrders,
      refreshProducts,
      refreshInventory,
    };
  }, [
    data,
    loading,
    error,
    updateData,
    refreshTeamMembers,
    refreshShipments,
    refreshSalesOrders,
    refreshProducts,
    refreshInventory,
  ]);

  if (!user) {
    return <>{children}</>;
  }

  if (!data || !value) {
    return (
      <AppDataLoadingScreen
        error={error}
        onRetry={() => {
          setFetchEpoch((n) => n + 1);
          setLoading(true);
        }}
      />
    );
  }

  return <AppDataStateContext.Provider value={value}>{children}</AppDataStateContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataStateContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}

export function useProducts() {
  const { data, updateData, refreshProducts } = useAppData();
  
  const addProduct = useCallback(async (p: Product) => {
    // Check for duplicate SKU locally first
    if (data.products.some((x) => (x.sku?.toLowerCase() || "") === (p.sku?.toLowerCase() || ""))) {
      toast.error("Product with this SKU already exists");
      return { success: false, error: "Duplicate SKU" };
    }
    
    try {
      const payload = catalogProductApiPayload(p);
      const result = await apiCreateProduct({
        sku: p.sku,
        ...payload,
      });
      
      // Update local state with server response (includes id, timestamps)
      updateData((d) =>
        applyCatalogToAppData({
          ...d,
          products: [...d.products, { ...p, id: result.data.id }],
        }),
      );
      
      toast.success("Product created", { description: `${p.name} (${p.sku})` });
      return { success: true, data: result.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create product";
      toast.error("Failed to create product", { description: message });
      return { success: false, error: message };
    }
  }, [data.products, updateData]);
  
  const patchProduct = useCallback(async (sku: string, patch: Partial<Product>) => {
    const product = data.products.find((x) => x.sku === sku);
    if (!product) {
      toast.error("Product not found");
      return { success: false, error: "Product not found" };
    }

    const merged: Product = { ...product, ...patch };
    const payload = catalogProductApiPayload(merged);
    const idRaw = product.id;
    const hasNumericId =
      idRaw != null && String(idRaw).trim() !== "" && String(idRaw) !== "undefined";

    try {
      const result = hasNumericId
        ? await apiUpdateProduct(String(idRaw), payload)
        : await apiUpdateProductBySku(sku, payload);

      const rid = (result as { data?: { id?: string | number } }).data?.id;

      updateData((d) =>
        applyCatalogToAppData({
          ...d,
          products: d.products.map((x) =>
            x.sku === sku ? { ...merged, id: rid ?? idRaw } : x,
          ),
        }),
      );

      toast.success("Product updated");
      return { success: true, data: result.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update product";
      toast.error("Failed to update product", { description: message });
      return { success: false, error: message };
    }
  }, [data.products, updateData]);
  
  const removeProduct = useCallback(async (sku: string) => {
    const product = data.products.find((x) => x.sku === sku);
    if (!product) {
      return { success: false, error: "Product not found" };
    }

    const dropLocal = () => {
      updateData((d) =>
        applyCatalogToAppData({
          ...d,
          products: d.products.filter((x) => x.sku !== sku),
        }),
      );
    };

    try {
      await apiDeleteProductBySku(sku);
      dropLocal();
      toast.success("Product deleted");
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete product";
      const isNotInDb =
        /product not found/i.test(message) ||
        /\b404\b/i.test(message) ||
        message.includes("HTTP 404");

      if (isNotInDb) {
        dropLocal();
        toast.success("Product removed", {
          description: "This SKU was not in the database — removed from your catalog only.",
        });
        return { success: true };
      }

      toast.error("Failed to delete product", { description: message });
      return { success: false, error: message };
    }
  }, [data.products, updateData]);
  
  return useMemo(
    () => ({
      products: data.products,
      addProduct,
      patchProduct,
      removeProduct,
      refreshProducts,
    }),
    [data.products, addProduct, patchProduct, removeProduct, refreshProducts],
  );
}

export function useRetailerShelfStock() {
  const { data, updateData } = useAppData();
  // FIXED: null-coalesce inside useMemo to prevent new object references on every render
  return useMemo(
    () => {
      const shelf = data.retailerShelfStock ?? {};
      return {
        shelf,
        setShelfBottles: (accountId: string, sku: string, bottles: number) =>
          updateData((d) => {
            const cur = d.retailerShelfStock ?? {};
            const nextAcc = { ...cur[accountId], [sku]: Math.max(0, bottles) };
            return { ...d, retailerShelfStock: { ...cur, [accountId]: nextAcc } };
          }),
      };
    },
    [data.retailerShelfStock, updateData],
  );
}

function nextFinancingLedgerId(): string {
  return `FL-${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useFinancingLedger() {
  const { data, updateData } = useAppData();
  // FIXED: null-coalesce inside useMemo to prevent new object references on every render
  return useMemo(
    () => {
      const entries = data.financingLedger ?? [];
      return {
        entries,
        appendEntry: (entry: Omit<FinancingLedgerEntry, "id"> & { id?: string }) =>
          updateData((d) => {
            const row: FinancingLedgerEntry = {
              ...entry,
              id: entry.id ?? nextFinancingLedgerId(),
            };
            return { ...d, financingLedger: [...(d.financingLedger ?? []), row] };
          }),
      };
    },
    [data.financingLedger, updateData],
  );
}

export function useAccounts() {
  const { data, updateData } = useAppData();
  
  const addAccount = useCallback(async (a: Account) => {
    try {
      const market =
        a.city && a.country ? `${a.city}, ${a.country}` : a.city || a.country || "—";
      const result = await apiCreateAccount({
        name: a.legalName || a.tradingName,
        tradingName: a.tradingName,
        legalName: a.legalName,
        type: a.type,
        market,
        city: a.city,
        country: a.country,
        email: a.email,
        phone: a.phone,
        billingAddress: a.billingAddress,
        shippingAddress: a.deliveryAddress || a.shippingAddress,
        paymentTerms: a.paymentTerms,
        creditLimit: a.creditLimitCad ?? a.creditLimit,
        salesOwner: a.salesOwner,
        notes: a.internalNotes ?? a.notes,
        status: a.status,
      });

      const serverId = String(result.data?.id ?? a.id);
      const saved: Account = { ...a, id: serverId };

      updateData((d) => ({
        ...d,
        accounts: [...d.accounts, saved],
      }));

      const depot = (result as { depotLink?: { linked?: boolean } }).depotLink;
      if (depot?.linked === false) {
        toast.success("Account created", {
          description: `${saved.tradingName} — link this account to your depot in Settings → Warehouses to manage portal users.`,
        });
      } else {
        toast.success("Account created", { description: `${saved.id} · ${saved.tradingName}` });
      }
      return { success: true, data: { ...result.data, id: serverId } };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create account";
      toast.error("Failed to create account", { description: message });
      return { success: false, error: message };
    }
  }, [updateData]);
  
  const updateAccount = useCallback(async (a: Account) => {
    try {
      // Call granular API
      const result = await apiUpdateAccount(a.id, {
        name: a.name,
        tradingName: a.tradingName,
        type: a.type,
        market: a.market,
        email: a.email,
        phone: a.phone,
        billingAddress: a.billingAddress,
        shippingAddress: a.shippingAddress,
        paymentTerms: a.paymentTerms,
        creditLimit: a.creditLimit,
        salesOwner: a.salesOwner,
        notes: a.notes,
        status: a.status,
      });
      
      // Update local state
      updateData((d) => ({
        ...d,
        accounts: d.accounts.map((x) => (x.id === a.id ? a : x)),
      }));
      
      toast.success("Account updated");
      return { success: true, data: result.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update account";
      toast.error("Failed to update account", { description: message });
      return { success: false, error: message };
    }
  }, [updateData]);
  
  return useMemo(
    () => ({
      accounts: data.accounts,
      addAccount,
      updateAccount,
    }),
    [data.accounts, addAccount, updateAccount],
  );
}

export function useInventory() {
  const { data, updateData } = useAppData();
  const items = data.inventory;
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const caseSizeForSku = useCallback(
    (sku: string) => data.products.find((p) => p.sku === sku)?.caseSize ?? 12,
    [data.products],
  );

  const availableBottlesForSku = useCallback((sku: string) => sumAvailableForSku(items, sku), [items]);
  const availableBottlesAtWarehouse = useCallback((sku: string, warehouse: string) => sumAvailableAtWarehouse(items, sku, warehouse), [items]);
  const availableBottlesAtLocationType = useCallback(
    (sku: string, locationType: InventoryItem["locationType"]) => sumAvailableAtLocationType(items, sku, locationType),
    [items]
  );
  const getInventoryBreakdownForSku = useCallback((sku: string) => getInventoryBreakdown(items, sku), [items]);
  const checkCanShipTransfer = useCallback(
    (sku: string, quantity: number, fromWarehouse: string) => canShipTransfer(items, sku, quantity, fromWarehouse),
    [items]
  );

  // Move inventory between locations (for transfer orders)
  const moveInventoryBetweenLocations = useCallback(
    (sku: string, quantity: number, fromLocation: { warehouse: string; locationType: InventoryItem["locationType"] }, toLocation: { warehouse: string; locationType: InventoryItem["locationType"]; retailAccountId?: string }, options?: { transferOrderId?: string; shipDate?: string; expectedDelivery?: string }) => {
      const caseSize = caseSizeForSku(sku);
      const result = moveInventory(items, sku, quantity, fromLocation, toLocation, { ...options, caseSize });
      if (result.success) {
        updateData((d) => ({ ...d, inventory: result.nextInventory }));
        itemsRef.current = result.nextInventory;
      }
      return result;
    },
    [items, caseSizeForSku, updateData]
  );

  // Reserve inventory for picking (soft hold)
  const reserveInventoryForTransfer = useCallback(
    (sku: string, quantity: number, warehouse: string, reservationId: string) => {
      const caseSize = caseSizeForSku(sku);
      const result = reserveInventory(items, sku, quantity, warehouse, reservationId, caseSize);
      if (result.success) {
        updateData((d) => ({ ...d, inventory: result.nextInventory }));
        itemsRef.current = result.nextInventory;
      }
      return result;
    },
    [items, caseSizeForSku, updateData]
  );

  // Release reserved inventory (cancel transfer)
  const releaseReservedInventory = useCallback(
    (reservationId: string) => {
      const caseSize = 12; // Default case size for release
      const result = releaseReservation(items, reservationId, caseSize);
      if (result.success) {
        updateData((d) => ({ ...d, inventory: result.nextInventory }));
        itemsRef.current = result.nextInventory;
      }
      return result;
    },
    [items, updateData]
  );

  // Deduct in-transit inventory (when transfer is delivered)
  const deductInTransitForDelivery = useCallback(
    (transferOrderId: string) => {
      const result = deductInTransitInventory(items, transferOrderId);
      if (result.success) {
        updateData((d) => ({ ...d, inventory: result.nextInventory }));
        itemsRef.current = result.nextInventory;
      }
      return result;
    },
    [items, updateData]
  );

  const receiveLine = useCallback(async (line: InventoryItem) => {
    try {
      // Find product ID from SKU
      const product = data.products.find((p) => p.sku === line.sku);
      if (!product) {
        toast.error("Product not found for inventory adjustment");
        return { success: false, error: "Product not found" };
      }
      
      // Call granular API to adjust inventory (positive adjustment = receive)
      const result = await apiAdjustInventory({
        product_id: product.id,
        location: line.warehouse,
        quantity: line.quantityBottles,
        reason: "receipt",
        notes: `Received inventory: ${line.batchLot || "manual entry"}`,
      });
      
      // Update local state with the returned inventory item
      updateData((d) => ({
        ...d,
        inventory: [{
          ...line,
          id: result.data.id,
          quantityBottles: result.data.quantity_on_hand,
          availableQuantity: result.data.available_quantity,
        }, ...d.inventory],
      }));
      
      toast.success("Inventory received", { description: `${line.sku}: +${line.quantityBottles} bottles` });
      return { success: true, data: result.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to receive inventory";
      toast.error("Failed to receive inventory", { description: message });
      return { success: false, error: message };
    }
  }, [data.products, updateData]);

  const setItemStatus = useCallback(
    (id: string, status: InventoryItem["status"]) => {
      // Status changes are local-only for now (no API endpoint yet)
      updateData((d) => ({
        ...d,
        inventory: d.inventory.map((row) => (row.id === id ? { ...row, status } : row)),
      }));
    },
    [updateData],
  );
  
  const adjustQuantity = useCallback(async (id: string, delta: number, reason: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) {
      return { success: false, error: "Inventory item not found" };
    }
    
    try {
      // Find product ID from SKU
      const product = data.products.find((p) => p.sku === item.sku);
      if (!product) {
        return { success: false, error: "Product not found" };
      }
      
      // Call granular API
      const result = await apiAdjustInventory({
        product_id: product.id,
        location: item.location,
        quantity: delta,
        reason: delta > 0 ? "adjustment" : "damage",
        notes: reason,
      });
      
      // Update local state
      updateData((d) => ({
        ...d,
        inventory: d.inventory.map((row) =>
          row.id === id
            ? {
                ...row,
                quantityBottles: result.data.quantity_on_hand,
                availableQuantity: result.data.available_quantity,
              }
            : row
        ),
      }));
      
      toast.success("Inventory adjusted", { description: `${item.sku}: ${delta > 0 ? "+" : ""}${delta}` });
      return { success: true, data: result.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to adjust inventory";
      toast.error("Failed to adjust inventory", { description: message });
      return { success: false, error: message };
    }
  }, [items, data.products, updateData]);

  const consumeForPo = useCallback(
    (po: PurchaseOrder, opts?: { warehouse?: string; locationType?: InventoryItem["locationType"] }) => {
      const caseSize = caseSizeForSku(po.sku);
      const prev = itemsRef.current;
      const { next, shortfall } = deductFifoAvailableBottles(prev, po.sku, po.quantity, caseSize, opts);
      if (shortfall > 0) return { ok: false, shortfall };
      updateData((d) => ({ ...d, inventory: next }));
      itemsRef.current = next;
      return { ok: true, shortfall: 0 };
    },
    [caseSizeForSku, updateData],
  );

  // Add inventory when a Production PO is delivered (manufacturer shipment arrives)
  const addForPo = useCallback(
    async (po: PurchaseOrder, location: string = "Toronto Main") => {
      try {
        // Find product ID from SKU
        const product = data.products.find((p) => p.sku === po.sku);
        if (!product) {
          return { ok: false, error: "Product not found" };
        }
        
        // Call API to add inventory (positive adjustment)
        const result = await apiAdjustInventory({
          product_id: product.id,
          location,
          quantity: po.quantity,
          reason: "production_po_delivery",
          notes: `Received from PO ${po.id} - ${po.manufacturer}`,
        });
        
        // Update local state
        updateData((d) => ({
          ...d,
          inventory: [{
            id: result.data.id,
            sku: po.sku,
            productName: product.name,
            batchLot: po.id,
            productionDate: new Date().toISOString().slice(0, 10),
            quantityBottles: result.data.quantity_on_hand,
            quantityCases: Math.floor(result.data.quantity_on_hand / (product.caseSize || 12)),
            warehouse: location,
            locationType: "distributor_warehouse" as const,
            status: "available" as const,
            labelVersion: po.labelVersion || "v1.0",
            notes: `Received from ${po.manufacturer}`,
            availableQuantity: result.data.available_quantity,
            reservedQuantity: 0,
          }, ...d.inventory],
        }));
        
        return { ok: true, error: null };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to add inventory";
        return { ok: false, error: message };
      }
    },
    [data.products, updateData],
  );

  return useMemo(
    () => ({
      items,
      receiveLine,
      setItemStatus,
      adjustQuantity,
      availableBottlesForSku,
      availableBottlesAtWarehouse,
      availableBottlesAtLocationType,
      getInventoryBreakdownForSku,
      checkCanShipTransfer,
      consumeForPo,
      addForPo,
      moveInventoryBetweenLocations,
      reserveInventoryForTransfer,
      releaseReservedInventory,
      deductInTransitForDelivery,
    }),
    [
      items,
      receiveLine,
      setItemStatus,
      adjustQuantity,
      availableBottlesForSku,
      availableBottlesAtWarehouse,
      availableBottlesAtLocationType,
      getInventoryBreakdownForSku,
      checkCanShipTransfer,
      consumeForPo,
      addForPo,
      moveInventoryBetweenLocations,
      reserveInventoryForTransfer,
      releaseReservedInventory,
      deductInTransitForDelivery,
    ],
  );
}

/**
 * Role-based inventory visibility rules
 */
const ROLE_LOCATION_VISIBILITY: Record<
  import("./AuthContext").HajimeRole,
  InventoryItem["locationType"][]
> = {
  // Manufacturer only sees their own production inventory
  manufacturer: ["manufacturer"],
  
  // Distributor sees warehouses, their in-transit shipments, and retail shelves they service
  distributor: ["distributor_warehouse", "in_transit", "retail_shelf"],
  
  // Sales rep sees warehouse (read-only) and their accounts' shelves
  sales_rep: ["distributor_warehouse", "retail_shelf"],
  
  // Retail only sees their own shelf stock
  retail: ["retail_shelf"],
  
  // Brand operators see everything
  brand_operator: ["manufacturer", "distributor_warehouse", "in_transit", "retail_shelf"],
  
  // Operations sees everything
  operations: ["manufacturer", "distributor_warehouse", "in_transit", "retail_shelf"],
  
  // Founder admin sees everything
  founder_admin: ["manufacturer", "distributor_warehouse", "in_transit", "retail_shelf"],
  
  // Sales (legacy) - same as sales_rep
  sales: ["distributor_warehouse", "retail_shelf"],
  
  // Finance - sees warehouse and retail for reporting
  finance: ["distributor_warehouse", "retail_shelf"],
};

/**
 * Filter inventory items based on user role
 */
function filterInventoryByRole(
  items: InventoryItem[],
  role: import("./AuthContext").HajimeRole,
  userAccountId?: string
): InventoryItem[] {
  const allowedLocations = ROLE_LOCATION_VISIBILITY[role] || [];
  
  return items.filter((item) => {
    // Check location type visibility
    if (!allowedLocations.includes(item.locationType)) {
      return false;
    }
    
    // Retail users only see their own shelf stock
    if (role === "retail" && item.locationType === "retail_shelf") {
      return item.retailAccountId === userAccountId;
    }
    
    // Sales reps only see their assigned accounts' shelf stock
    // Note: This would need account assignment data - for now, show all retail_shelf
    // TODO: Filter by rep's account assignments when that data is available
    
    return true;
  });
}

/**
 * Get available warehouses for transfer creation based on role
 */
function getTransferSourceWarehouses(
  role: import("./AuthContext").HajimeRole
): InventoryItem["locationType"][] {
  switch (role) {
    case "distributor":
    case "brand_operator":
    case "operations":
    case "founder_admin":
      return ["distributor_warehouse"];
    default:
      return [];
  }
}

/**
 * Role-aware inventory hook
 * Filters inventory based on user role and location permissions
 */
export function useInventoryForRole() {
  const { user } = useAuth();
  const inventory = useInventory();
  const { data } = useAppData();
  
  const role = user?.role || "brand_operator";
  const userAccountId = user?.id; // For retail users to see only their stock
  
  // Filter inventory items by role
  const filteredItems = useMemo(() => {
    return filterInventoryByRole(inventory.items, role, userAccountId);
  }, [inventory.items, role, userAccountId]);
  
  // Calculate available bottles filtered by role
  const availableBottlesForSku = useCallback(
    (sku: string) => {
      return filteredItems
        .filter(
          (i) =>
            i.sku === sku &&
            i.status === "available" &&
            (i.locationType === "distributor_warehouse" || i.locationType === "retail_shelf")
        )
        .reduce((sum, i) => sum + i.quantityBottles, 0);
    },
    [filteredItems]
  );
  
  // Calculate available at specific warehouse (role-filtered)
  const availableBottlesAtWarehouse = useCallback(
    (sku: string, warehouse: string) => {
      return filteredItems
        .filter(
          (i) =>
            i.sku === sku &&
            i.warehouse === warehouse &&
            i.status === "available" &&
            i.locationType === "distributor_warehouse"
        )
        .reduce((sum, i) => sum + i.quantityBottles, 0);
    },
    [filteredItems]
  );
  
  // Get breakdown by location type (role-filtered)
  const getInventoryBreakdownForSku = useCallback(
    (sku: string) => {
      const result: Record<string, number> = {
        manufacturer: 0,
        distributor_warehouse: 0,
        in_transit: 0,
        retail_shelf: 0,
      };

      for (const item of filteredItems) {
        if (item.sku !== sku) continue;
        if (item.status !== "available") continue;
        result[item.locationType] = (result[item.locationType] || 0) + item.quantityBottles;
      }

      return result as Record<InventoryItem["locationType"], number>;
    },
    [filteredItems]
  );
  
  // Check if user can create transfers from a warehouse
  const canCreateTransferFrom = useCallback(
    (warehouse: string) => {
      const allowedSourceTypes = getTransferSourceWarehouses(role);
      
      // Check if there's any inventory at this warehouse that the user can access
      return filteredItems.some(
        (i) =>
          i.warehouse === warehouse &&
          allowedSourceTypes.includes(i.locationType) &&
          i.status === "available"
      );
    },
    [filteredItems, role]
  );
  
  // Get list of warehouses user can transfer from
  const availableSourceWarehouses = useMemo(() => {
    const warehouses = new Set<string>();
    const allowedSourceTypes = getTransferSourceWarehouses(role);
    
    for (const item of filteredItems) {
      if (allowedSourceTypes.includes(item.locationType) && item.status === "available") {
        warehouses.add(item.warehouse);
      }
    }
    
    return Array.from(warehouses);
  }, [filteredItems, role]);
  
  return {
    // Filtered items
    items: filteredItems,
    allItems: inventory.items, // Unfiltered for admin operations
    
    // Role-filtered queries
    availableBottlesForSku,
    availableBottlesAtWarehouse,
    getInventoryBreakdownForSku,
    canCreateTransferFrom,
    availableSourceWarehouses,
    
    // Pass through mutation functions (these handle their own permissions)
    receiveLine: inventory.receiveLine,
    setItemStatus: inventory.setItemStatus,
    adjustQuantity: inventory.adjustQuantity,
    consumeForPo: inventory.consumeForPo,
    addForPo: inventory.addForPo,
    moveInventoryBetweenLocations: inventory.moveInventoryBetweenLocations,
    reserveInventoryForTransfer: inventory.reserveInventoryForTransfer,
    releaseReservedInventory: inventory.releaseReservedInventory,
    deductInTransitForDelivery: inventory.deductInTransitForDelivery,
    checkCanShipTransfer: inventory.checkCanShipTransfer,
  };
}

export function useSalesOrders() {
  const { data, updateData } = useAppData();
  
  const addSalesOrder = useCallback(async (o: SalesOrder) => {
    try {
      const account = resolveAccountForSalesOrder(o, data.accounts);
      const accountId = account?.id ?? o.accountId ?? "";
      if (!accountId) {
        toast.error("Failed to create order", {
          description:
            "Could not resolve this customer to an account id. The order form stores the account name — refresh accounts or pick the customer again.",
        });
        return { success: false, error: "Missing account id" };
      }

      const productIdForSku = (sku: string): string | undefined => {
        const p = data.products.find((x) => x.sku === sku) as { id?: string } | undefined;
        return p?.id;
      };

      const itemsPayload =
        o.lines?.map((l) => {
          const product_id = productIdForSku(l.sku);
          return {
            sku: l.sku,
            name: l.sku,
            quantity: l.quantityBottles,
            price: l.lineTotal,
            ...(product_id ? { product_id } : {}),
          };
        }) ??
        (o.sku
          ? (() => {
              const product_id = productIdForSku(o.sku);
              return [
                {
                  sku: o.sku,
                  name: o.sku,
                  quantity: o.quantity,
                  price: o.price,
                  ...(product_id ? { product_id } : {}),
                },
              ];
            })()
          : []);

      // Call granular API
      const orderNumber =
        o.orderNumber ?? `SO-${Date.now().toString(36).toUpperCase()}`;
      const result = await apiCreateOrder({
        order_number: orderNumber,
        account_id: accountId,
        status: o.status,
        order_date: o.orderDate || new Date().toISOString(),
        sales_rep: o.salesRep,
        items: itemsPayload,
        subtotal: o.subtotal || o.price * (o.quantity || 1),
        taxAmount: o.taxAmount || 0,
        shippingCost: o.shippingCost || 0,
        totalAmount: o.totalAmount || o.price * (o.quantity || 1),
        shippingAddress: o.shippingAddress,
        notes: o.notes ?? o.orderNotes,
      });

      const serverId = result?.data?.id != null ? String(result.data.id) : null;
      if (!serverId) {
        toast.error("Failed to create order", {
          description: "Server did not return an order id — your order was not saved.",
        });
        return { success: false, error: "Missing order id from server" };
      }

      updateData((d) => ({
        ...d,
        salesOrders: [{ ...o, id: serverId, orderNumber }, ...d.salesOrders],
      }));

      toast.success("Order created", { description: orderNumber });
      return { success: true, data: result.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create order";
      toast.error("Failed to create order", { description: message });
      return { success: false, error: message };
    }
  }, [data.accounts, data.products, updateData]);
  
  const patchSalesOrder = useCallback(async (
    id: string,
    patch: Partial<SalesOrder>,
    options?: { requireSync?: boolean },
  ) => {
    const applyLocalStatus = (apiId: string) => {
      flushSync(() => {
        updateData((d) => ({
          ...d,
          salesOrders: d.salesOrders.map((x) =>
            x.id === id || x.id === apiId || x.orderNumber === id ? { ...x, ...patch } : x,
          ),
        }));
      });
    };

    // Status-only updates (pick & pack, log shipment, HQ order workflow).
    if (patch.status && Object.keys(patch).length === 1) {
      const exists = data.salesOrders.some(
        (x) => x.id === id || x.orderNumber === id,
      );
      if (!exists) {
        return { success: false, synced: false, error: "Order not found in session" };
      }

      const apiId = await resolveOrderIdForApiUpdate(id, data.salesOrders);
      const requireSync = options?.requireSync === true;

      if (requireSync && !canSyncOrderStatusToApi(apiId)) {
        return {
          success: false,
          synced: false,
          error:
            "This order is not saved on the server yet. Refresh the page or recreate the order before fulfillment.",
        };
      }

      if (requireSync && canSyncOrderStatusToApi(apiId)) {
        try {
          const result = await apiUpdateOrderStatus(apiId, patch.status);
          applyLocalStatus(apiId);
          return { success: true, synced: true, data: result.data };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to update order status on server";
          console.warn("[patchSalesOrder] API status sync failed:", err);
          const notOnServer = /not found|HTTP 404|404/i.test(message);
          return {
            success: false,
            synced: false,
            error: notOnServer
              ? "This order is not saved on the server yet. Refresh the page or recreate the order before fulfillment."
              : message,
          };
        }
      }

      applyLocalStatus(apiId);

      if (canSyncOrderStatusToApi(apiId)) {
        try {
          const result = await apiUpdateOrderStatus(apiId, patch.status);
          return { success: true, synced: true, data: result.data };
        } catch (err) {
          console.warn("[patchSalesOrder] API status sync failed; local state updated:", err);
          return { success: true, synced: false };
        }
      }

      return { success: true, synced: false };
    }
    
    // For other updates, just update local state (full update API not yet implemented)
    updateData((d) => ({
      ...d,
      salesOrders: d.salesOrders.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
    
    return { success: true };
  }, [data.salesOrders, updateData]);
  
  return useMemo(
    () => ({
      salesOrders: data.salesOrders,
      addSalesOrder,
      patchSalesOrder,
    }),
    [data.salesOrders, addSalesOrder, patchSalesOrder],
  );
}

function purchaseOrderStatusToApi(status: PurchaseOrder["status"]): string {
  switch (status) {
    case "approved":
      return "acknowledged";
    case "in-production":
      return "in_production";
    case "completed":
      return "ready_for_shipment";
    case "delayed":
      return "in_production";
    default:
      return String(status).replace(/-/g, "_");
  }
}

function purchaseOrderApiId(orders: PurchaseOrder[], clientId: string): string {
  const po = orders.find((p) => p.id === clientId);
  if (po?.databaseId != null && Number.isFinite(Number(po.databaseId))) {
    return String(po.databaseId);
  }
  return clientId;
}

export function usePurchaseOrders() {
  const { data, updateData } = useAppData();

  const addPurchaseOrder = useCallback(async (po: PurchaseOrder) => {
    try {
      const product = data.products.find((p) => p.sku === po.sku);
      const productName = product ? `${product.name} ${product.size}`.trim() : po.sku;

      const result = await apiCreatePurchaseOrder({
        po_number: po.id,
        supplier_name: po.manufacturer,
        manufacturer_id: po.manufacturerId,
        po_type: po.poType || "production",
        status: purchaseOrderStatusToApi(po.status),
        order_date: po.issueDate,
        expected_delivery_date: po.requiredDate,
        delivery_date: po.requiredDate,
        market_destination: po.marketDestination,
        total_bottles: po.quantity,
        total_amount: 0,
        notes: po.notes || "",
        distributor_account_id: po.distributorAccountId,
        metadata: {
          packagingInstructions: po.packagingInstructions,
          labelVersion: po.labelVersion,
          requestedShipDate: po.requestedShipDate,
        },
        items: [
          {
            sku: po.sku,
            product_name: productName,
            quantity: po.quantity,
            unit_price: 0,
            product_id: product?.id != null ? String(product.id) : undefined,
          },
        ],
      });

      const row = result.data as {
        id?: string | number;
        po_number?: string;
      };

      updateData((d) => ({
        ...d,
        purchaseOrders: [
          {
            ...po,
            id: String(row.po_number ?? po.id),
            databaseId: row.id != null ? Number(row.id) : po.databaseId,
          },
          ...d.purchaseOrders,
        ],
      }));
      toast.success("Purchase order created", { description: String(row.po_number ?? po.id) });
      return { success: true, data: result.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create purchase order";
      toast.error("Failed to create purchase order", { description: message });
      return { success: false, error: message };
    }
  }, [data.products, updateData]);

  const patchPurchaseOrder = useCallback(async (id: string, patch: Partial<PurchaseOrder>) => {
    try {
      const apiId = purchaseOrderApiId(data.purchaseOrders, id);
      if (patch.status && Object.keys(patch).length === 1) {
        await apiUpdatePurchaseOrderStatus(apiId, purchaseOrderStatusToApi(patch.status));
      } else {
        await apiUpdatePurchaseOrder(apiId, {
          po_number: patch.poNumber,
          status: patch.status ? purchaseOrderStatusToApi(patch.status) : undefined,
          expected_delivery_date: patch.requiredDate,
          total_amount: patch.totalAmount,
          notes: patch.notes,
          supplier_name: patch.manufacturer,
          market_destination: patch.marketDestination,
        });
      }

      updateData((d) => ({
        ...d,
        purchaseOrders: d.purchaseOrders.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      }));
      toast.success("Purchase order updated");
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update purchase order";
      toast.error("Failed to update purchase order", { description: message });
      return { success: false, error: message };
    }
  }, [data.purchaseOrders, updateData]);

  const removePurchaseOrder = useCallback(async (id: string) => {
    try {
      await apiDeletePurchaseOrder(purchaseOrderApiId(data.purchaseOrders, id));
      updateData((d) => ({
        ...d,
        purchaseOrders: d.purchaseOrders.filter((p) => p.id !== id),
      }));
      toast.success("Purchase order deleted");
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete purchase order";
      toast.error("Failed to delete purchase order", { description: message });
      return { success: false, error: message };
    }
  }, [data.purchaseOrders, updateData]);

  return useMemo(
    () => ({
      purchaseOrders: data.purchaseOrders,
      addPurchaseOrder,
      patchPurchaseOrder,
      removePurchaseOrder,
    }),
    [data.purchaseOrders, addPurchaseOrder, patchPurchaseOrder, removePurchaseOrder]
  );
}

export function useShipments() {
  const { data } = useAppData();
  return useMemo(() => ({ shipments: data.shipments }), [data.shipments]);
}

export function useProductionStatuses() {
  const { data, updateData } = useAppData();
  return useMemo(
    () => ({
      productionStatuses: data.productionStatuses,
      addProductionStatus: (row: ProductionStatus) =>
        updateData((d) => ({ ...d, productionStatuses: [row, ...d.productionStatuses] })),
    }),
    [data.productionStatuses, updateData],
  );
}

function nextNprId(existing: NewProductRequest[]): string {
  const year = new Date().getFullYear();
  const nums = existing
    .filter((n) => n.id.startsWith(`NPR-${year}`))
    .map((n) => {
      const m = n.id.match(/-(\d+)$/);
      return m ? parseInt(m[1], 10) : 0;
    });
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `NPR-${year}-${String(next).padStart(4, "0")}`;
}

export function useNewProductRequests() {
  const { data, updateData, refreshProducts } = useAppData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getNewProductRequests({ limit: 100 });
      const rows = Array.isArray(response.data) ? response.data : [];
      const mapped = rows.map((row) =>
        mapNewProductRequestApiResponse(row as Record<string, unknown>),
      );
      updateData((d) => ({ ...d, newProductRequests: mapped }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch new product requests";
      setError(message);
      toast.error("Failed to fetch new product requests", { description: message });
    } finally {
      setLoading(false);
    }
  }, [updateData]);

  const addNewProductRequest = useCallback(async (npr: Omit<NewProductRequest, "id">) => {
    try {
      const response = await apiCreateNewProductRequest({
        request_id: npr.id,
        title: npr.title,
        requested_by: npr.requestedBy as "brand_operator" | "manufacturer",
        specs: npr.specs,
        notes: npr.notes,
        assigned_manufacturer: npr.assignedManufacturer,
        status: npr.status,
        manufacturer_proposal: npr.manufacturerProposal,
      });
      updateData((d) => ({
        ...d,
        newProductRequests: [
          mapNewProductRequestApiResponse(
            (response as { data: Record<string, unknown> }).data,
          ),
          ...(d.newProductRequests ?? []),
        ],
      }));
      toast.success("New product request created", { description: response.data.title });
      return { success: true, data: response.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create new product request";
      toast.error("Failed to create new product request", { description: message });
      return { success: false, error: message };
    }
  }, [updateData]);

  const patchNewProductRequest = useCallback(async (id: string, patch: Partial<NewProductRequest>) => {
    try {
      const existing = (data.newProductRequests ?? []).find((n) => n.id === id);
      const apiId = existing ? newProductRequestApiId(existing) : id;
      const response = await apiUpdateNewProductRequest(
        apiId,
        mapNewProductRequestPatchToApi(patch),
      );
      const mapped = mapNewProductRequestApiResponse(
        (response as { data: Record<string, unknown> }).data,
      );
      updateData((d) => ({
        ...d,
        newProductRequests: (d.newProductRequests ?? []).map((n) =>
          n.id === id ? { ...n, ...mapped } : n,
        ),
      }));
      if (patch.status === "approved") {
        await refreshProducts();
      }
      toast.success("New product request updated");
      return { success: true, data: mapped };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update new product request";
      toast.error("Failed to update new product request", { description: message });
      return { success: false, error: message };
    }
  }, [data.newProductRequests, refreshProducts, updateData]);

  return useMemo(
    () => ({
      newProductRequests: data.newProductRequests ?? [],
      loading,
      error,
      fetchRequests,
      addNewProductRequest,
      patchNewProductRequest,
    }),
    [data.newProductRequests, loading, error, fetchRequests, addNewProductRequest, patchNewProductRequest]
  );
}

export function useTransferOrders() {
  const { data, updateData } = useAppData();
  return useMemo(
    () => ({
      transferOrders: data.transferOrders ?? [],
      addTransferOrder: (to: Omit<TransferOrder, "id">) =>
        updateData((d) => {
          const existing = d.transferOrders ?? [];
          const year = new Date().getFullYear();
          const nums = existing
            .filter((n) => n.id.startsWith(`TO-${year}`))
            .map((n) => {
              const m = n.id.match(/-(\d+)$/);
              return m ? parseInt(m[1], 10) : 0;
            });
          const next = (nums.length ? Math.max(...nums) : 0) + 1;
          const id = `TO-${year}-${String(next).padStart(4, "0")}`;
          return { ...d, transferOrders: [{ ...to, id }, ...existing] };
        }),
      patchTransferOrder: (id: string, patch: Partial<TransferOrder>) =>
        updateData((d) => ({
          ...d,
          transferOrders: (d.transferOrders ?? []).map((t) =>
            t.id === id ? { ...t, ...patch } : t
          ),
        })),
    }),
    [data.transferOrders, updateData]
  );
}

export function useDepletionReports() {
  const { data, updateData } = useAppData();

  const addDepletionReport = useCallback(async (r: Omit<DepletionReport, "id">) => {
    try {
      const result = await apiCreateDepletionReport({
        account_id: r.accountId,
        sku: r.sku,
        period_start: r.periodStart,
        period_end: r.periodEnd,
        bottles_sold: r.bottlesSold,
        bottles_on_hand_at_end: r.bottlesOnHandAtEnd,
        notes: r.notes,
        flagged_for_replenishment: r.flaggedForReplenishment,
      });
      updateData((d) => ({
        ...d,
        depletionReports: [{
          ...r,
          id: result.data.id,
          reportedAt: result.data.reported_at,
          reportedBy: result.data.reported_by || 'distributor',
        }, ...(d.depletionReports ?? [])],
      }));
      toast.success("Depletion report submitted");
      return { success: true, data: result.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit depletion report";
      toast.error("Failed to submit depletion report", { description: message });
      return { success: false, error: message };
    }
  }, [updateData]);

  const patchDepletionReport = useCallback(async (id: string, patch: Partial<DepletionReport>) => {
    try {
      const result = await apiUpdateDepletionReport(id, {
        account_id: patch.accountId,
        sku: patch.sku,
        period_start: patch.periodStart,
        period_end: patch.periodEnd,
        bottles_sold: patch.bottlesSold,
        bottles_on_hand_at_end: patch.bottlesOnHandAtEnd,
        notes: patch.notes,
        flagged_for_replenishment: patch.flaggedForReplenishment,
      });
      updateData((d) => ({
        ...d,
        depletionReports: (d.depletionReports ?? []).map((r) =>
          r.id === id ? { ...r, ...patch } : r
        ),
      }));
      toast.success("Depletion report updated");
      return { success: true, data: result.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update depletion report";
      toast.error("Failed to update depletion report", { description: message });
      return { success: false, error: message };
    }
  }, [updateData]);

  const removeDepletionReport = useCallback(async (id: string) => {
    try {
      await apiDeleteDepletionReport(id);
      updateData((d) => ({
        ...d,
        depletionReports: (d.depletionReports ?? []).filter((r) => r.id !== id),
      }));
      toast.success("Depletion report deleted");
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete depletion report";
      toast.error("Failed to delete depletion report", { description: message });
      return { success: false, error: message };
    }
  }, [updateData]);

  return useMemo(
    () => ({
      depletionReports: data.depletionReports ?? [],
      addDepletionReport,
      patchDepletionReport,
      removeDepletionReport,
    }),
    [data.depletionReports, addDepletionReport, patchDepletionReport, removeDepletionReport],
  );
}

export function useInventoryAdjustments() {
  const { data, updateData } = useAppData();

  const addAdjustment = useCallback(async (r: Omit<import("@/data/mockData").InventoryAdjustmentRequest, "id" | "status" | "quantityAdjustment" | "requestedAt">) => {
    try {
      const result = await apiCreateInventoryAdjustmentRequest({
        account_id: r.accountId,
        sku: r.sku,
        adjustment_type: r.adjustmentType,
        quantity_expected: r.quantityExpected,
        quantity_actual: r.quantityActual,
        reason: r.reason,
      });
      updateData((d) => ({
        ...d,
        inventoryAdjustmentRequests: [
          {
            ...r,
            id: result.data.id,
            status: "pending",
            quantityAdjustment: result.data.quantity_adjustment,
            requestedAt: result.data.requested_at,
          },
          ...(d.inventoryAdjustmentRequests ?? []),
        ],
      }));
      toast.success("Adjustment request submitted");
      return { success: true, data: result.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit adjustment request";
      toast.error("Failed to submit adjustment request", { description: message });
      return { success: false, error: message };
    }
  }, [updateData]);

  const fetchAdjustments = useCallback(async () => {
    try {
      const result = await apiGetInventoryAdjustmentRequests({ limit: 200 });
      updateData((d) => ({
        ...d,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        inventoryAdjustmentRequests: (result.data || []).map((item: any) => ({
          id: item.id,
          accountId: item.account_id,
          sku: item.sku,
          adjustmentType: item.adjustment_type,
          quantityExpected: item.quantity_expected,
          quantityActual: item.quantity_actual,
          quantityAdjustment: item.quantity_adjustment,
          reason: item.reason,
          status: item.status,
          requestedAt: item.requested_at,
          approvedAt: item.approved_at,
          rejectionReason: item.rejection_reason,
        })),
      }));
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch adjustment requests";
      return { success: false, error: message };
    }
  }, [updateData]);

  return useMemo(
    () => ({
      adjustments: data.inventoryAdjustmentRequests ?? [],
      addAdjustment,
      fetchAdjustments,
    }),
    [data.inventoryAdjustmentRequests, addAdjustment, fetchAdjustments],
  );
}
