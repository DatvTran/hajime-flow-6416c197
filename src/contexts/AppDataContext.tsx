import { createContext, useContext, useMemo, useCallback, useState, useEffect, type ReactNode } from "react";
import type { AppData, FinancingLedgerEntry, OperationalSettings, TeamMember } from "@/types/app-data";
import type { Account, InventoryItem, Product, PurchaseOrder, SalesOrder, Shipment, DepletionReport, InventoryAdjustmentRequest, NewProductRequest } from "@/data/mockData";
import { fetchAppData } from "@/lib/api-app";
import { computeInventorySummary } from "@/lib/hajime-metrics";

// Context type
type AppDataContextValue = {
  data: AppData;
  isLoading: boolean;
  error: Error | null;
  updateData: (updater: (prev: AppData) => AppData) => void;
  refresh: () => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

// ID generators
let financingLedgerIdSeq = 1;
function nextFinancingLedgerId(): string {
  return `fin-${Date.now()}-${financingLedgerIdSeq++}`;
}

let salesOrderIdSeq = 1;
function nextSalesOrderId(): string {
  return `SO-${new Date().getFullYear()}-${String(salesOrderIdSeq++).padStart(3, "0")}`;
}

let purchaseOrderIdSeq = 1;
function nextPurchaseOrderId(): string {
  return `PO-${new Date().getFullYear()}-${String(purchaseOrderIdSeq++).padStart(3, "0")}`;
}

// Default initial data
const defaultAppData: AppData = {
  version: 1,
  products: [],
  inventory: [],
  accounts: [],
  salesOrders: [],
  purchaseOrders: [],
  shipments: [],
  productionStatuses: [],
  operationalSettings: {
    manufacturerLeadTimeDays: 45,
    safetyStockBySku: {},
    retailerStockThresholdBottles: 48,
  },
  auditLogs: [],
  teamMembers: [],
  retailerShelfStock: {},
  financingLedger: [],
  visitNotes: [],
  newProductRequests: [],
  depletionReports: [],
  inventoryAdjustmentRequests: [],
};

// Provider component
export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(defaultAppData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetched = await fetchAppData();
      setData(fetched);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateData = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => updater(prev));
  }, []);

  const value = useMemo(
    () => ({ data, isLoading, error, updateData, refresh }),
    [data, isLoading, error, updateData, refresh]
  );

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
}

// Main hook
export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return ctx;
}

// Product hooks
export function useProducts() {
  const { data, updateData } = useAppData();
  return useMemo(
    () => ({
      products: data.products,
      addProduct: (product: Product) =>
        updateData((d) => ({ ...d, products: [...d.products, product] })),
      removeProduct: (sku: string) =>
        updateData((d) => ({ ...d, products: d.products.filter((p) => p.sku !== sku) })),
      patchProduct: (sku: string, patch: Partial<Product>) =>
        updateData((d) => ({
          ...d,
          products: d.products.map((p) => (p.sku === sku ? { ...p, ...patch } : p)),
        })),
    }),
    [data.products, updateData]
  );
}

// Account hooks
export function useAccounts() {
  const { data, updateData } = useAppData();
  return useMemo(
    () => ({
      accounts: data.accounts,
      addAccount: (account: Account) =>
        updateData((d) => ({ ...d, accounts: [...d.accounts, account] })),
      removeAccount: (id: string) =>
        updateData((d) => ({ ...d, accounts: d.accounts.filter((a) => a.id !== id) })),
      patchAccount: (id: string, patch: Partial<Account>) =>
        updateData((d) => ({
          ...d,
          accounts: d.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),
    }),
    [data.accounts, updateData]
  );
}

// Inventory hooks
export function useInventory() {
  const { data, updateData } = useAppData();
  return useMemo(
    () => ({
      inventory: data.inventory,
      inventorySummary: computeInventorySummary(data.inventory, data.purchaseOrders),
      availableBottlesForSku: (sku: string) => {
        return data.inventory
          .filter((i) => i.sku === sku && i.status === "available")
          .reduce((sum, i) => sum + i.quantityBottles, 0);
      },
      addInventoryItem: (item: InventoryItem) =>
        updateData((d) => ({ ...d, inventory: [...d.inventory, item] })),
      removeInventoryItem: (id: string) =>
        updateData((d) => ({ ...d, inventory: d.inventory.filter((i) => i.id !== id) })),
      patchInventoryItem: (id: string, patch: Partial<InventoryItem>) =>
        updateData((d) => ({
          ...d,
          inventory: d.inventory.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        })),
    }),
    [data.inventory, data.purchaseOrders, updateData]
  );
}

// Sales order hooks
export function useSalesOrders() {
  const { data, updateData } = useAppData();
  return useMemo(
    () => ({
      salesOrders: data.salesOrders,
      addSalesOrder: (order: Omit<SalesOrder, "id">) =>
        updateData((d) => {
          const newOrder: SalesOrder = { ...order, id: nextSalesOrderId() };
          return { ...d, salesOrders: [...d.salesOrders, newOrder] };
        }),
      removeSalesOrder: (id: string) =>
        updateData((d) => ({ ...d, salesOrders: d.salesOrders.filter((o) => o.id !== id) })),
      patchSalesOrder: (id: string, patch: Partial<SalesOrder>) =>
        updateData((d) => ({
          ...d,
          salesOrders: d.salesOrders.map((o) => (o.id === id ? { ...o, ...patch } : o)),
        })),
    }),
    [data.salesOrders, updateData]
  );
}

// Purchase order hooks
export function usePurchaseOrders() {
  const { data, updateData } = useAppData();
  return useMemo(
    () => ({
      purchaseOrders: data.purchaseOrders,
      addPurchaseOrder: (po: Omit<PurchaseOrder, "id">) =>
        updateData((d) => {
          const newPo: PurchaseOrder = { ...po, id: nextPurchaseOrderId() };
          return { ...d, purchaseOrders: [...d.purchaseOrders, newPo] };
        }),
      removePurchaseOrder: (id: string) =>
        updateData((d) => ({ ...d, purchaseOrders: d.purchaseOrders.filter((p) => p.id !== id) })),
      patchPurchaseOrder: (id: string, patch: Partial<PurchaseOrder>) =>
        updateData((d) => ({
          ...d,
          purchaseOrders: d.purchaseOrders.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
    }),
    [data.purchaseOrders, updateData]
  );
}

// Shipment hooks
export function useShipments() {
  const { data, updateData } = useAppData();
  return useMemo(
    () => ({
      shipments: data.shipments,
      addShipment: (shipment: Shipment) =>
        updateData((d) => ({ ...d, shipments: [...d.shipments, shipment] })),
      removeShipment: (id: string) =>
        updateData((d) => ({ ...d, shipments: d.shipments.filter((s) => s.id !== id) })),
      patchShipment: (id: string, patch: Partial<Shipment>) =>
        updateData((d) => ({
          ...d,
          shipments: d.shipments.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        })),
    }),
    [data.shipments, updateData]
  );
}

// Depletion report hooks
export function useDepletionReports() {
  const { data, updateData } = useAppData();
  return useMemo(
    () => ({
      depletionReports: data.depletionReports ?? [],
      addDepletionReport: (report: DepletionReport) =>
        updateData((d) => ({
          ...d,
          depletionReports: [...(d.depletionReports ?? []), report],
        })),
      removeDepletionReport: (id: string) =>
        updateData((d) => ({
          ...d,
          depletionReports: (d.depletionReports ?? []).filter((r) => r.id !== id),
        })),
    }),
    [data.depletionReports, updateData]
  );
}

// Inventory adjustment hooks
export function useInventoryAdjustments() {
  const { data, updateData } = useAppData();
  return useMemo(
    () => ({
      inventoryAdjustmentRequests: data.inventoryAdjustmentRequests ?? [],
      addInventoryAdjustmentRequest: (request: InventoryAdjustmentRequest) =>
        updateData((d) => ({
          ...d,
          inventoryAdjustmentRequests: [...(d.inventoryAdjustmentRequests ?? []), request],
        })),
      patchInventoryAdjustmentRequest: (id: string, patch: Partial<InventoryAdjustmentRequest>) =>
        updateData((d) => ({
          ...d,
          inventoryAdjustmentRequests: (d.inventoryAdjustmentRequests ?? []).map((r) =>
            r.id === id ? { ...r, ...patch } : r
          ),
        })),
    }),
    [data.inventoryAdjustmentRequests, updateData]
  );
}

// New product request hooks
export function useNewProductRequests() {
  const { data, updateData } = useAppData();
  return useMemo(
    () => ({
      newProductRequests: data.newProductRequests ?? [],
      addNewProductRequest: (request: NewProductRequest) =>
        updateData((d) => ({
          ...d,
          newProductRequests: [...(d.newProductRequests ?? []), request],
        })),
      patchNewProductRequest: (id: string, patch: Partial<NewProductRequest>) =>
        updateData((d) => ({
          ...d,
          newProductRequests: (d.newProductRequests ?? []).map((r) =>
            r.id === id ? { ...r, ...patch } : r
          ),
        })),
    }),
    [data.newProductRequests, updateData]
  );
}

// Team members hooks
export function useTeamMembers() {
  const { data, updateData } = useAppData();
  return useMemo(
    () => ({
      teamMembers: data.teamMembers ?? [],
      addTeamMember: (member: TeamMember) =>
        updateData((d) => ({
          ...d,
          teamMembers: [...(d.teamMembers ?? []), member],
        })),
      removeTeamMember: (id: string) =>
        updateData((d) => ({
          ...d,
          teamMembers: (d.teamMembers ?? []).filter((m) => m.id !== id),
        })),
    }),
    [data.teamMembers, updateData]
  );
}

// Operational settings hooks
export function useOperationalSettings() {
  const { data, updateData } = useAppData();
  return useMemo(
    () => ({
      operationalSettings: data.operationalSettings,
      updateOperationalSettings: (settings: Partial<OperationalSettings>) =>
        updateData((d) => ({
          ...d,
          operationalSettings: { ...d.operationalSettings!, ...settings },
        })),
    }),
    [data.operationalSettings, updateData]
  );
}

// Retailer shelf stock hook - FIXED: null-coalesce inside useMemo
export function useRetailerShelfStock() {
  const { data, updateData } = useAppData();
  return useMemo(
    () => {
      const shelf = data.retailerShelfStock ?? {};
      return {
        shelf,
        setShelfBottles: (accountId: string, sku: string, bottles: number) =>
          updateData((d) => {
            const current = d.retailerShelfStock ?? {};
            const accountShelf = current[accountId] ?? {};
            const updated: AppData["retailerShelfStock"] = {
              ...current,
              [accountId]: {
                ...accountShelf,
                [sku]: bottles,
              },
            };
            return { ...d, retailerShelfStock: updated };
          }),
      };
    },
    [data.retailerShelfStock, updateData]
  );
}

// Financing ledger hook - FIXED: null-coalesce inside useMemo
export function useFinancingLedger() {
  const { data, updateData } = useAppData();
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
    [data.financingLedger, updateData]
  );
}
