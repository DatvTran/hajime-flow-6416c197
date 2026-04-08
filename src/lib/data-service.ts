/**
 * Hybrid Data Service
 * Uses granular APIs when available, falls back to /api/app
 */
import { 
  getProducts, 
  getAccounts, 
  getOrders, 
  getInventory,
  getDashboardStats 
} from "./api-v1";
import { fetchAppData as fetchLegacyAppData } from "./api-app";
import type { AppData } from "@/types/app-data";

// Feature flag to control granular API usage - Stage 3: Always use granular
const USE_GRANULAR_API = true;

/**
 * Transform API v1 data to AppData format
 */
function transformToAppData(
  products: any[],
  accounts: any[],
  orders: any[],
  inventory: any[]
): Partial<AppData> {
  console.log("[DataService] transformToAppData input:", { 
    productsCount: products?.length, 
    accountsCount: accounts?.length, 
    ordersCount: orders?.length, 
    inventoryCount: inventory?.length 
  });
  
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
      accounts: (accounts || []).map(a => ({
        id: a.id,
        accountNumber: a.account_number,
        name: a.name,
        type: a.type,
        market: a.market,
        status: a.status,
        email: a.email,
        phone: a.phone,
        billingAddress: a.billing_address,
        shippingAddress: a.shipping_address,
        paymentTerms: a.payment_terms,
        creditLimit: a.credit_limit,
        notes: a.notes,
      })),
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
      // Empty arrays for entities not yet migrated
      purchaseOrders: [],
      shipments: [],
      productionStatuses: [],
      retailerShelfStock: {},
      financingLedger: [],
    };
    
    console.log("[DataService] transformToAppData output:", { 
      products: result.products?.length,
      accounts: result.accounts?.length,
      salesOrders: result.salesOrders?.length,
      inventory: result.inventory?.length,
    });
    
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
  console.log("[DataService] Using granular APIs (Stage 3)");
  
  const results = await Promise.allSettled([
    getProducts({ limit: 100 }),
    getAccounts({ limit: 100 }),
    getOrders({ limit: 100 }),
    getInventory({ limit: 100 }),
  ]);
  
  const productsRes = results[0].status === 'fulfilled' ? results[0].value : { data: [] };
  const accountsRes = results[1].status === 'fulfilled' ? results[1].value : { data: [] };
  const ordersRes = results[2].status === 'fulfilled' ? results[2].value : { data: [] };
  const inventoryRes = results[3].status === 'fulfilled' ? results[3].value : { data: [] };
  
  // Log any failures
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`[DataService] API ${index} failed:`, result.reason);
    }
  });
  
  console.log("[DataService] Raw API responses:", {
    products: productsRes?.data?.length,
    accounts: accountsRes?.data?.length,
    orders: ordersRes?.data?.length,
    inventory: inventoryRes?.data?.length,
  });
  
  const data = transformToAppData(
    productsRes.data || [],
    accountsRes.data || [],
    ordersRes.data || [],
    inventoryRes.data || []
  );
  
  console.log("[DataService] Transformed data:", {
    products: data.products?.length,
    accounts: data.accounts?.length,
    salesOrders: data.salesOrders?.length,
    inventory: data.inventory?.length,
  });
  
  return data as AppData;
}

/**
 * Fetch data - Stage 3: Use granular APIs with fallback to legacy
 */
export async function fetchAppData(): Promise<AppData> {
  try {
    // Stage 3: Try granular APIs first
    return await fetchAppDataGranular();
  } catch (err) {
    console.warn("[DataService] Granular APIs failed, falling back to legacy:", err);
    // Fallback to legacy API
    return fetchLegacyAppData();
  }
}

/**
 * Save data - Stage 3: Use granular APIs for saves
 * TODO: Implement granular save endpoints
 */
export async function putAppData(data: AppData): Promise<void> {
  // Stage 3: Data mutations should use granular endpoints
  // For now, still use legacy for writes until granular save endpoints are built
  const { putAppData: putLegacyAppData } = await import("./api-app");
  return putLegacyAppData(data);
}

// Re-export API v1 functions for direct use
export * from "./api-v1";
