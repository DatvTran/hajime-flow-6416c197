import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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
import { fetchAppData } from "@/lib/data-service";
import type { AppData, FinancingLedgerEntry } from "@/types/app-data";
import type { ProductionStatus } from "@/data/mockData";
import seedJson from "@/data/seed-app.json";
import { toast } from "@/components/ui/sonner";
import { normalizeAppData } from "@/lib/normalize-app-data";
import { loadLocalAppData, saveLocalAppData } from "@/lib/local-app-data";
import { useAuth } from "./AuthContext";
// Granular API mutations (Stage 4: Replace monolithic writes)
import {
  createProduct as apiCreateProduct,
  updateProduct as apiUpdateProduct,
  deleteProduct as apiDeleteProduct,
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
} from "@/lib/api-v1-mutations";

const FALLBACK_SEED = normalizeAppData(seedJson as AppData);

/**
 * Merge server data with local data - local changes take precedence.
 * Preserves new features (financing ledger, shelf stock, onboarding) when API doesn't have them yet.
 */
function mergeServerWithLocal(server: AppData, local: AppData | null): AppData {
  if (!local) return server;
  
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
  
  // For accounts: preserve onboardingPipeline status from local if server account doesn't have it
  if (local.accounts?.length && server.accounts?.length) {
    const localAccountsById = new Map(local.accounts.map(a => [a.id, a]));
    merged.accounts = server.accounts.map(serverAccount => {
      const localAccount = localAccountsById.get(serverAccount.id);
      if (localAccount && localAccount.onboardingPipeline && !serverAccount.onboardingPipeline) {
        return { ...serverAccount, onboardingPipeline: localAccount.onboardingPipeline };
      }
      return serverAccount;
    });
    
    // Add local-only accounts (new accounts created while offline)
    const serverIds = new Set(server.accounts.map(a => a.id));
    const localOnlyAccounts = local.accounts.filter(a => !serverIds.has(a.id));
    merged.accounts = [...merged.accounts, ...localOnlyAccounts];
  }
  
  // For orders: preserve local-only orders (created while offline)
  if (local.salesOrders?.length && server.salesOrders?.length) {
    const serverIds = new Set(server.salesOrders.map(o => o.id));
    const localOnlyOrders = local.salesOrders.filter(o => !serverIds.has(o.id));
    merged.salesOrders = [...server.salesOrders, ...localOnlyOrders];
  }
  
  return merged;
}

function sumAvailableForSku(items: InventoryItem[], sku: string): number {
  // Only count inventory at distributor warehouses and retail shelves as "available" for fulfillment
  // Manufacturer and in-transit inventory is NOT available for sales/transfer
  let s = 0;
  for (const i of items) {
    if (i.sku === sku && i.status === "available" && 
        (i.locationType === "distributor_warehouse" || i.locationType === "retail_shelf")) {
      s += i.quantityBottles;
    }
  }
  return s;
}

/** Get available inventory at a specific warehouse location */
function sumAvailableAtWarehouse(items: InventoryItem[], sku: string, warehouse: string): number {
  let s = 0;
  for (const i of items) {
    if (i.sku === sku && i.warehouse === warehouse && i.status === "available") {
      s += i.quantityBottles;
    }
  }
  return s;
}

type AppDataContextValue = {
  data: AppData;
  loading: boolean;
  error: string | null;
  updateData: (fn: (prev: AppData) => AppData) => void;
};

const AppDataStateContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const skipSaveRef = useRef(true);
  const hasAttemptedFetch = useRef(false);

  useEffect(() => {
    // Only fetch when user is authenticated
    if (!user) {
      setLoading(false);
      return;
    }

    // Prevent duplicate fetches
    if (hasAttemptedFetch.current) return;
    hasAttemptedFetch.current = true;

    let cancelled = false;
    
    // STEP 1: Load from localStorage FIRST for instant UI (prevents data loss on refresh)
    const local = loadLocalAppData();
    if (local && !cancelled) {
      setData(normalizeAppData(local));
      setLoading(false); // Show UI immediately with local data
    }
    
    // STEP 2: Try to fetch from API in background
    (async () => {
      try {
        const serverData = await fetchAppData();
        if (!cancelled) {
          // Merge server data with local data - local changes take precedence
          const merged = mergeServerWithLocal(serverData as AppData, loadLocalAppData());
          setData(normalizeAppData(merged));
          setError(null);
          // Save merged data back to localStorage
          saveLocalAppData(merged);
        }
      } catch (e) {
        console.error("[AppDataContext] Fetch error:", e);
        if (!cancelled) {
          setError(String(e));
          // If we already loaded local data, just show the API error toast
          // If no local data was loaded, fall back to seed
          if (!local) {
            setData(FALLBACK_SEED);
            toast.info("API unavailable — using local seed data", {
              description: "Start the server (npm run dev:api) to load and save persisted data. Edits save in-browser until then.",
            });
          } else {
            toast.info("API unavailable — working from local copy", {
              description: "Your changes are saved in this browser. Connect to server to sync.",
            });
          }
        }
      }
    })();
    
    return () => {
      cancelled = true;
    };
  }, [user]);

  const updateData = useCallback((fn: (prev: AppData) => AppData) => {
    setData((prev) => {
      if (!prev) return prev;
      return fn(prev);
    });
  }, []);

  // Stage 4: Removed auto-save useEffect — writes now use granular API mutations
  // Local changes are persisted via saveLocalAppData only
  useEffect(() => {
    if (!data || loading) return;
    saveLocalAppData(data);
  }, [data, loading]);

  const value = useMemo((): AppDataContextValue | null => {
    if (!data) return null;
    return { data, loading, error, updateData };
  }, [data, loading, error, updateData]);

  if (!data || !value) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        background: '#1a1a2e', 
        color: '#fff', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 99999,
        fontFamily: 'system-ui, sans-serif',
        padding: '20px'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '20px' }}>⏳ Hajime Loading...</div>
        <div style={{ fontSize: '16px', opacity: 0.8, marginBottom: '10px' }}>
          {loading ? "Loading data…" : error ? "Error loading data" : "Waiting for data..."}
        </div>
        {error && (
          <div style={{ fontSize: '12px', opacity: 0.7, maxWidth: '500px', wordBreak: 'break-word', textAlign: 'center', marginBottom: '10px' }}>
            {error}
          </div>
        )}
        <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '10px' }}>
          user: {user?.email ?? 'none'} | role: {user?.role ?? 'none'} | loading: {String(loading)}
        </div>
        <button 
          onClick={() => window.location.reload()} 
          style={{ marginTop: '20px', padding: '8px 16px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
        >
          Reload Page
        </button>
      </div>
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
  const { data, updateData } = useAppData();
  
  const addProduct = useCallback(async (p: Product) => {
    // Check for duplicate SKU locally first
    if (data.products.some((x) => (x.sku?.toLowerCase() || "") === (p.sku?.toLowerCase() || ""))) {
      toast.error("Product with this SKU already exists");
      return { success: false, error: "Duplicate SKU" };
    }
    
    try {
      // Call granular API
      const result = await apiCreateProduct({
        sku: p.sku,
        name: p.name,
        description: p.description,
        category: p.category,
        unit_size: p.unitSize,
        metadata: {
          caseSize: p.caseSize,
          bottleSizeMl: p.bottleSizeMl,
          abv: p.abv,
          wholesalePriceCase: p.wholesalePriceCase,
          retailPriceCase: p.retailPriceCase,
          launchDate: p.launchDate,
          status: p.status,
          image: p.image,
        },
      });
      
      // Update local state with server response (includes id, timestamps)
      updateData((d) => ({
        ...d,
        products: [...d.products, { ...p, id: result.data.id }],
      }));
      
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
    
    try {
      // Call granular API
      const result = await apiUpdateProduct(product.id, {
        name: patch.name,
        description: patch.description,
        category: patch.category,
        unit_size: patch.unitSize,
        metadata: patch.caseSize !== undefined ? {
          caseSize: patch.caseSize,
          bottleSizeMl: patch.bottleSizeMl,
          abv: patch.abv,
          wholesalePriceCase: patch.wholesalePriceCase,
          retailPriceCase: patch.retailPriceCase,
          launchDate: patch.launchDate,
          status: patch.status,
          image: patch.image,
        } : undefined,
      });
      
      // Update local state
      updateData((d) => ({
        ...d,
        products: d.products.map((x) => (x.sku === sku ? { ...x, ...patch } : x)),
      }));
      
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
    
    try {
      // Call granular API
      await apiDeleteProduct(product.id);
      
      // Update local state
      updateData((d) => ({
        ...d,
        products: d.products.filter((x) => x.sku !== sku),
      }));
      
      toast.success("Product deleted");
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete product";
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
    }),
    [data.products, addProduct, patchProduct, removeProduct],
  );
}

export function useRetailerShelfStock() {
  const { data, updateData } = useAppData();
  const shelf = data.retailerShelfStock ?? {};
  return useMemo(
    () => ({
      shelf,
      setShelfBottles: (accountId: string, sku: string, bottles: number) =>
        updateData((d) => {
          const cur = d.retailerShelfStock ?? {};
          const nextAcc = { ...cur[accountId], [sku]: Math.max(0, bottles) };
          return { ...d, retailerShelfStock: { ...cur, [accountId]: nextAcc } };
        }),
    }),
    [shelf, updateData],
  );
}

function nextFinancingLedgerId(): string {
  return `FL-${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useFinancingLedger() {
  const { data, updateData } = useAppData();
  const entries = data.financingLedger ?? [];
  return useMemo(
    () => ({
      entries,
      appendEntry: (entry: Omit<FinancingLedgerEntry, "id"> & { id?: string }) =>
        updateData((d) => {
          const row: FinancingLedgerEntry = {
            ...entry,
            id: entry.id ?? nextFinancingLedgerId(),
          };
          return { ...d, financingLedger: [...(d.financingLedger ?? []), row] };
        }),
    }),
    [entries, updateData],
  );
}

export function useAccounts() {
  const { data, updateData } = useAppData();
  
  const addAccount = useCallback(async (a: Account) => {
    try {
      // Call granular API
      const result = await apiCreateAccount({
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
      });
      
      // Update local state with server response
      updateData((d) => ({
        ...d,
        accounts: [...d.accounts, { ...a, id: result.data.id }],
      }));
      
      toast.success("Account created", { description: a.name });
      return { success: true, data: result.data };
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
        location: line.location,
        quantity: line.quantityBottles,
        reason: "receipt",
        notes: `Received inventory: ${line.batchId || "manual entry"}`,
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
      consumeForPo,
      addForPo,
    }),
    [items, receiveLine, setItemStatus, adjustQuantity, availableBottlesForSku, availableBottlesAtWarehouse, consumeForPo, addForPo],
  );
}

export function useSalesOrders() {
  const { data, updateData } = useAppData();
  
  const addSalesOrder = useCallback(async (o: SalesOrder) => {
    try {
      // Find account ID from account number
      const account = data.accounts.find((a) => a.accountNumber === o.account);
      
      // Call granular API
      const result = await apiCreateOrder({
        order_number: o.orderNumber,
        account_id: account?.id || o.accountId || "",
        status: o.status,
        order_date: o.orderDate || new Date().toISOString(),
        sales_rep: o.salesRep,
        items: o.items?.map((item) => ({
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          price: item.unitPrice,
        })) || [],
        subtotal: o.subtotal || o.price * (o.quantity || 1),
        taxAmount: o.taxAmount || 0,
        shippingCost: o.shippingCost || 0,
        totalAmount: o.totalAmount || o.price * (o.quantity || 1),
        shippingAddress: o.shippingAddress,
        notes: o.notes,
      });
      
      // Update local state with server response
      updateData((d) => ({
        ...d,
        salesOrders: [{ ...o, id: result.data.id }, ...d.salesOrders],
      }));
      
      toast.success("Order created", { description: o.orderNumber });
      return { success: true, data: result.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create order";
      toast.error("Failed to create order", { description: message });
      return { success: false, error: message };
    }
  }, [data.accounts, updateData]);
  
  const patchSalesOrder = useCallback(async (id: string, patch: Partial<SalesOrder>) => {
    // If only status is being updated, use the status endpoint
    if (patch.status && Object.keys(patch).length === 1) {
      try {
        const result = await apiUpdateOrderStatus(id, patch.status);
        
        updateData((d) => ({
          ...d,
          salesOrders: d.salesOrders.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        }));
        
        toast.success("Order status updated");
        return { success: true, data: result.data };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update order";
        toast.error("Failed to update order", { description: message });
        return { success: false, error: message };
      }
    }
    
    // For other updates, just update local state (full update API not yet implemented)
    updateData((d) => ({
      ...d,
      salesOrders: d.salesOrders.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
    
    return { success: true };
  }, [updateData]);
  
  return useMemo(
    () => ({
      salesOrders: data.salesOrders,
      addSalesOrder,
      patchSalesOrder,
    }),
    [data.salesOrders, addSalesOrder, patchSalesOrder],
  );
}

export function usePurchaseOrders() {
  const { data, updateData } = useAppData();
  return useMemo(
    () => ({
      purchaseOrders: data.purchaseOrders,
      addPurchaseOrder: (po: PurchaseOrder) =>
        updateData((d) => ({ ...d, purchaseOrders: [po, ...d.purchaseOrders] })),
      patchPurchaseOrder: (id: string, patch: Partial<PurchaseOrder>) =>
        updateData((d) => ({
          ...d,
          purchaseOrders: d.purchaseOrders.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
    }),
    [data.purchaseOrders, updateData],
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
  const { data, updateData } = useAppData();
  return useMemo(
    () => ({
      newProductRequests: data.newProductRequests ?? [],
      addNewProductRequest: (npr: Omit<NewProductRequest, "id">) =>
        updateData((d) => {
          const existing = d.newProductRequests ?? [];
          const created: NewProductRequest = { ...npr, id: nextNprId(existing) };
          return { ...d, newProductRequests: [created, ...existing] };
        }),
      patchNewProductRequest: (id: string, patch: Partial<NewProductRequest>) =>
        updateData((d) => ({
          ...d,
          newProductRequests: (d.newProductRequests ?? []).map((n) =>
            n.id === id ? { ...n, ...patch } : n
          ),
        })),
    }),
    [data.newProductRequests, updateData]
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
