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
  InventoryItem,
  Product,
  PurchaseOrder,
  SalesOrder,
} from "@/data/mockData";
import { deductFifoAvailableBottles } from "@/lib/inventory-deduct";
import { fetchAppData, putAppData } from "@/lib/data-service";
import type { AppData, FinancingLedgerEntry } from "@/types/app-data";
import type { ProductionStatus } from "@/data/mockData";
import seedJson from "@/data/seed-app.json";
import { toast } from "@/components/ui/sonner";
import { normalizeAppData } from "@/lib/normalize-app-data";
import { loadLocalAppData, saveLocalAppData } from "@/lib/local-app-data";
import { useAuth } from "./AuthContext";

const FALLBACK_SEED = normalizeAppData(seedJson as AppData);

function sumAvailableForSku(items: InventoryItem[], sku: string): number {
  let s = 0;
  for (const i of items) {
    if (i.sku === sku && i.status === "available") s += i.quantityBottles;
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
    (async () => {
      try {
        console.log("[AppDataContext] Fetching app data...");
        const d = await fetchAppData();
        console.log("[AppDataContext] Data received:", { hasProducts: !!(d as any)?.products?.length });
        if (!cancelled) {
          setData(normalizeAppData(d as AppData));
          setError(null);
        }
      } catch (e) {
        console.error("[AppDataContext] Fetch error:", e);
        if (!cancelled) {
          const local = loadLocalAppData();
          if (local) {
            setData(normalizeAppData(local));
            setError(String(e));
            toast.info("API unavailable — loaded data from this browser", {
              description: "Your last saved session is restored. Start npm run dev:api to sync with the server.",
            });
          } else {
            setData(FALLBACK_SEED);
            setError(String(e));
            toast.info("API unavailable — using local seed data", {
              description: "Start the server (npm run dev:api) to load and save persisted data. Edits save in-browser until then.",
            });
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
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

  useEffect(() => {
    if (!data || loading) return;
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    const id = window.setTimeout(() => {
      saveLocalAppData(data);
      putAppData(data).catch(() => {
        toast.error("Could not save to server", { description: "Data is saved in this browser — start the API to sync." });
      });
    }, 700);
    return () => window.clearTimeout(id);
  }, [data, loading]);

  const value = useMemo((): AppDataContextValue | null => {
    if (!data) return null;
    return { data, loading, error, updateData };
  }, [data, loading, error, updateData]);

  console.log("[AppDataContext] Render state:", { hasData: !!data, hasValue: !!value, loading, error: error?.slice(0, 100), user: user?.email, role: user?.role });

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
  return useMemo(
    () => ({
      products: data.products,
      addProduct: (p: Product) =>
        updateData((d) => {
          if (d.products.some((x) => x.sku.toLowerCase() === p.sku.toLowerCase())) return d;
          return { ...d, products: [...d.products, p] };
        }),
      patchProduct: (sku: string, patch: Partial<Product>) =>
        updateData((d) => ({
          ...d,
          products: d.products.map((x) => (x.sku === sku ? { ...x, ...patch } : x)),
        })),
      removeProduct: (sku: string) =>
        updateData((d) => ({
          ...d,
          products: d.products.filter((x) => x.sku !== sku),
        })),
    }),
    [data.products, updateData],
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
  return useMemo(
    () => ({
      accounts: data.accounts,
      addAccount: (a: Account) => updateData((d) => ({ ...d, accounts: [...d.accounts, a] })),
      updateAccount: (a: Account) =>
        updateData((d) => ({
          ...d,
          accounts: d.accounts.map((x) => (x.id === a.id ? a : x)),
        })),
    }),
    [data.accounts, updateData],
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

  const receiveLine = useCallback(
    (line: InventoryItem) => {
      updateData((d) => ({ ...d, inventory: [line, ...d.inventory] }));
    },
    [updateData],
  );

  const setItemStatus = useCallback(
    (id: string, status: InventoryItem["status"]) => {
      updateData((d) => ({
        ...d,
        inventory: d.inventory.map((row) => (row.id === id ? { ...row, status } : row)),
      }));
    },
    [updateData],
  );

  const consumeForPo = useCallback(
    (po: PurchaseOrder) => {
      const caseSize = caseSizeForSku(po.sku);
      const prev = itemsRef.current;
      const { next, shortfall } = deductFifoAvailableBottles(prev, po.sku, po.quantity, caseSize);
      if (shortfall > 0) return { ok: false, shortfall };
      updateData((d) => ({ ...d, inventory: next }));
      itemsRef.current = next;
      return { ok: true, shortfall: 0 };
    },
    [caseSizeForSku, updateData],
  );

  return useMemo(
    () => ({
      items,
      receiveLine,
      setItemStatus,
      availableBottlesForSku,
      consumeForPo,
    }),
    [items, receiveLine, setItemStatus, availableBottlesForSku, consumeForPo],
  );
}

export function useSalesOrders() {
  const { data, updateData } = useAppData();
  return useMemo(
    () => ({
      salesOrders: data.salesOrders,
      addSalesOrder: (o: SalesOrder) => updateData((d) => ({ ...d, salesOrders: [o, ...d.salesOrders] })),
      patchSalesOrder: (id: string, patch: Partial<SalesOrder>) =>
        updateData((d) => ({
          ...d,
          salesOrders: d.salesOrders.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
    }),
    [data.salesOrders, updateData],
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
