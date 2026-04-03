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
import { fetchAppData, putAppData } from "@/lib/api-app";
import type { AppData } from "@/types/app-data";
import type { ProductionStatus } from "@/data/mockData";
import seedJson from "@/data/seed-app.json";
import { toast } from "@/components/ui/sonner";
import { normalizeAppData } from "@/lib/normalize-app-data";

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
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const skipSaveRef = useRef(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await fetchAppData();
        if (!cancelled) {
          setData(normalizeAppData(d as AppData));
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setData(FALLBACK_SEED);
          setError(String(e));
          toast.info("API unavailable — using local seed data", {
            description: "Start the server (npm run dev:api) to load and save persisted data.",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      putAppData(data).catch(() => {
        toast.error("Could not save to server", { description: "Check that the API is running on port 4242." });
      });
    }, 700);
    return () => window.clearTimeout(id);
  }, [data, loading]);

  const value = useMemo((): AppDataContextValue | null => {
    if (!data) return null;
    return { data, loading, error, updateData };
  }, [data, loading, error, updateData]);

  if (!data || !value) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 px-4">
        <p className="text-sm text-muted-foreground">{loading ? "Loading data…" : error ?? "No data"}</p>
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
      removeProduct: (sku: string) =>
        updateData((d) => ({
          ...d,
          products: d.products.filter((x) => x.sku !== sku),
        })),
    }),
    [data.products, updateData],
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
      patchSalesOrder: (id: string, patch: Partial<Pick<SalesOrder, "status" | "paymentStatus">>) =>
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
