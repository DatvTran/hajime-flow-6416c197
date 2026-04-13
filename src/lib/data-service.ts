/**
 * Hybrid Data Service
 * Stage 4: Reads use granular APIs, Writes use api-v1-mutations
 * Legacy putAppData removed — all mutations go through granular endpoints
 */
import { 
  getProducts, 
  getAccounts, 
  getOrders, 
  getInventory,
  getDashboardStats,
  getDepletionReports,
} from "./api-v1";
import { fetchAppData as fetchLegacyAppData } from "./api-app";
import type { AppData } from "@/types/app-data";

// Feature flag to control granular API usage - Stage 3: Always use granular
const USE_GRANULAR_API = true;

// Dev mode flag for logging
const isDev = process.env.NODE_ENV === 'development' || import.meta.env?.DEV;

/**
 * Transform API v1 data to AppData format
 */
function transformToAppData(
  products: any[],
  accounts: any[],
  orders: any[],
  inventory: any[],
  depletionReports?: any[]
): Partial<AppData> {
  if (isDev) {
    console.log("[DataService] transformToAppData input:", { 
      productsCount: products?.length, 
      accountsCount: accounts?.length, 
      ordersCount: orders?.length, 
      inventoryCount: inventory?.length,
      depletionReportsCount: depletionReports?.length
    });
  }
  
  try {
    const result = {
      products: (products || []).map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        description: p.description,
        category: p.category,
        unitSize: p.unit_size,
        caseSize: p.metadata?.caseSize || 12,
        bottleSizeMl: p.metadata?.bottleSizeMl || 750,
        abv: p.metadata?.abv || 25,
        wholesalePriceCase: p.metadata?.wholesalePriceCase || 0,
        retailPriceCase: p.metadata?.retailPriceCase || 0,
        launchDate: p.metadata?.launchDate,
        status: p.metadata?.status || "active",
        image: p.metadata?.image,
      })),
      accounts: (accounts || []).map(a => {
        // Convert address objects to strings if needed
        const formatAddress = (addr: any): string | undefined => {
          if (!addr) return undefined;
          if (typeof addr === "string") return addr;
          // Handle object format: {street, city, province, postal}
          if (typeof addr === "object") {
            const parts = [addr.street, addr.city, addr.province, addr.postal].filter(Boolean);
            return parts.join(", ");
          }
          return String(addr);
        };
        
        return {
          id: a.id,
          accountNumber: a.account_number,
          name: a.name,
          legalName: a.legal_name || a.name,
          tradingName: a.trading_name || a.name,
          type: a.type || "retail",
          market: a.market,
          status: a.status || "active",
          email: a.email || "",
          phone: a.phone || "",
          city: a.city || "",
          country: a.country || "Canada",
          billingAddress: formatAddress(a.billing_address),
          shippingAddress: formatAddress(a.shipping_address),
          deliveryAddress: formatAddress(a.shipping_address),
          paymentTerms: a.payment_terms || "Net 30",
          creditLimit: a.credit_limit,
          notes: a.notes,
          salesOwner: a.sales_owner || "Unassigned",
          tags: a.tags || [],
          avgOrderSize: a.avg_order_size || 0,
          firstOrderDate: a.first_order_date || new Date().toISOString(),
          lastOrderDate: a.last_order_date || new Date().toISOString(),
        };
      }),
      salesOrders: (orders || []).map(o => ({
        id: o.id,
        orderNumber: o.order_number,
        accountNumber: o.account_number,
        accountId: o.account_id,
        items: o.items?.map((i: any) => ({
          sku: i.sku,
          name: i.product_name,
          quantity: i.quantity_ordered,
          unitPrice: i.unit_price,
        })) || [],
        status: o.status,
        orderDate: o.order_date,
        subtotal: o.subtotal,
        taxAmount: o.tax_amount,
        shippingCost: o.shipping_cost,
        totalAmount: o.total_amount,
      })),
      inventory: (inventory || []).map(i => ({
        id: i.id,
        sku: i.sku,
        productName: i.product_name,
        location: i.location,
        quantityBottles: i.quantity_on_hand,
        reservedQuantity: i.reserved_quantity,
        availableQuantity: i.available_quantity,
        reorderPoint: i.reorder_point,
        reorderQuantity: i.reorder_quantity,
        status: i.available_quantity <= (i.reorder_point || 0) ? "low" : "available",
      })),
      depletionReports: (depletionReports || []).map(r => ({
        id: r.id,
        accountId: r.account_id,
        sku: r.sku,
        periodStart: r.period_start,
        periodEnd: r.period_end,
        bottlesSold: r.bottles_sold,
        bottlesOnHandAtEnd: r.bottles_on_hand_at_end,
        notes: r.notes || '',
        reportedBy: r.reported_by || 'distributor',
        reportedAt: r.reported_at,
        flaggedForReplenishment: r.flagged_for_replenishment || false,
      })),
      // Empty arrays for entities not yet migrated
      purchaseOrders: [],
      shipments: [],
      productionStatuses: [],
      retailerShelfStock: {},
      financingLedger: [],
    };
    
    if (isDev) {
      console.log("[DataService] transformToAppData output:", { 
        products: result.products?.length,
        accounts: result.accounts?.length,
        salesOrders: result.salesOrders?.length,
        inventory: result.inventory?.length,
        depletionReports: result.depletionReports?.length,
      });
    }
    
    return result;
  } catch (err) {
    console.error("[DataService] transformToAppData error:", err);
    throw err;
  }
}

/**
 * Fetch data using granular APIs
 * Uses Promise.allSettled to handle partial failures gracefully
 */
export async function fetchAppDataGranular(): Promise<AppData> {
  if (isDev) {
    console.log("[DataService] Using granular APIs (Stage 3)");
  }
  
  const results = await Promise.allSettled([
    getProducts({ limit: 100 }),
    getAccounts({ limit: 100 }),
    getOrders({ limit: 100 }),
    getInventory({ limit: 100 }),
    getDepletionReports({ limit: 200 }),
  ]);
  
  const productsRes = results[0].status === 'fulfilled' ? results[0].value : { data: [] };
  const accountsRes = results[1].status === 'fulfilled' ? results[1].value : { data: [] };
  const ordersRes = results[2].status === 'fulfilled' ? results[2].value : { data: [] };
  const inventoryRes = results[3].status === 'fulfilled' ? results[3].value : { data: [] };
  const depletionReportsRes = results[4].status === 'fulfilled' ? results[4].value : { data: [] };
  
  // Log any failures
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`[DataService] API ${index} failed:`, result.reason);
    }
  });
  
  if (isDev) {
    console.log("[DataService] Raw API responses:", {
      products: productsRes?.data?.length,
      accounts: accountsRes?.data?.length,
      orders: ordersRes?.data?.length,
      inventory: inventoryRes?.data?.length,
      depletionReports: depletionReportsRes?.data?.length,
    });
  }
  
  const data = transformToAppData(
    productsRes.data || [],
    accountsRes.data || [],
    ordersRes.data || [],
    inventoryRes.data || [],
    depletionReportsRes.data || []
  );
  
  if (isDev) {
    console.log("[DataService] Transformed data:", {
      products: data.products?.length,
      accounts: data.accounts?.length,
      salesOrders: data.salesOrders?.length,
      inventory: data.inventory?.length,
      depletionReports: data.depletionReports?.length,
    });
  }
  
  return data as AppData;
}

/**
 * Fetch data - Stage 4: Use granular APIs with fallback to legacy
 */
export async function fetchAppData(): Promise<AppData> {
  try {
    // Stage 4: Try granular APIs first
    return await fetchAppDataGranular();
  } catch (err) {
    if (isDev) {
      console.warn("[DataService] Granular APIs failed, falling back to legacy:", err);
    }
    // Fallback to legacy API
    return fetchLegacyAppData();
  }
}

// Stage 4: putAppData removed — use api-v1-mutations for all writes
// Import { createProduct, updateProduct, etc. } from "@/lib/api-v1-mutations"

// Re-export API v1 functions for direct use
export * from "./api-v1";
