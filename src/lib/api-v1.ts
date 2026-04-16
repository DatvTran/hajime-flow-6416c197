/**
 * Granular API Client - v1
 * RESTful API wrapper for products, orders, accounts, inventory
 */

const API_URL = import.meta.env.VITE_API_URL || "";

// Helper to get auth token from localStorage
function getAuthToken(): string | null {
  try {
    return localStorage.getItem("hajime_access_token");
  } catch {
    return null;
  }
}

// Generic fetch wrapper with auth
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// ===== PRODUCTS =====

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unit_size?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProductsResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function getProducts(params?: { 
  page?: number; 
  limit?: number; 
  category?: string; 
  search?: string;
}): Promise<ProductsResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.category) query.set("category", params.category);
  if (params?.search) query.set("search", params.search);
  
  return apiFetch(`/api/v1/products?${query.toString()}`);
}

export function getProduct(id: string): Promise<{ data: Product }> {
  return apiFetch(`/api/v1/products/${id}`);
}

export function createProduct(data: Partial<Product>): Promise<{ data: Product }> {
  return apiFetch("/api/v1/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateProduct(id: string, data: Partial<Product>): Promise<{ data: Product }> {
  return apiFetch(`/api/v1/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteProduct(id: string): Promise<{ data: Product; message: string }> {
  return apiFetch(`/api/v1/products/${id}`, {
    method: "DELETE",
  });
}

// ===== ACCOUNTS =====

export interface Account {
  id: string;
  account_number?: string;
  name: string;
  type?: string;
  market?: string;
  status: string;
  email?: string;
  phone?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  billing_address?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shipping_address?: any;
  payment_terms?: string;
  credit_limit?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AccountsResponse {
  data: Account[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function getAccounts(params?: {
  page?: number;
  limit?: number;
  type?: string;
  market?: string;
  status?: string;
}): Promise<AccountsResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.type) query.set("type", params.type);
  if (params?.market) query.set("market", params.market);
  if (params?.status) query.set("status", params.status);
  
  return apiFetch(`/api/v1/accounts?${query.toString()}`);
}

export function getAccount(id: string): Promise<{ data: Account }> {
  return apiFetch(`/api/v1/accounts/${id}`);
}

export function createAccount(data: Partial<Account>): Promise<{ data: Account }> {
  return apiFetch("/api/v1/accounts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAccount(id: string, data: Partial<Account>): Promise<{ data: Account }> {
  return apiFetch(`/api/v1/accounts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ===== SALES ORDERS =====

export interface OrderItem {
  id: string;
  product_id?: string;
  sku: string;
  product_name: string;
  quantity_ordered: number;
  quantity_fulfilled: number;
  unit_price: number;
  line_total: number;
}

export interface Order {
  id: string;
  order_number: string;
  account_id?: string;
  account_name?: string;
  account_number?: string;
  status: string;
  order_date: string;
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrdersResponse {
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function getOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
  account_id?: string;
  date_from?: string;
  date_to?: string;
}): Promise<OrdersResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);
  if (params?.account_id) query.set("account_id", params.account_id);
  if (params?.date_from) query.set("date_from", params.date_from);
  if (params?.date_to) query.set("date_to", params.date_to);
  
  return apiFetch(`/api/v1/orders?${query.toString()}`);
}

export function getOrder(id: string): Promise<{ data: Order }> {
  return apiFetch(`/api/v1/orders/${id}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createOrder(data: Partial<Order> & { items?: any[] }): Promise<{ data: Order }> {
  return apiFetch("/api/v1/orders", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateOrderStatus(id: string, status: string): Promise<{ data: Order }> {
  return apiFetch(`/api/v1/orders/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

// ===== INVENTORY =====

export interface InventoryItem {
  id: string;
  product_id: string;
  sku: string;
  product_name: string;
  category?: string;
  location: string;
  quantity_on_hand: number;
  reserved_quantity: number;
  available_quantity: number;
  reorder_point?: number;
  reorder_quantity?: number;
}

export interface InventoryResponse {
  data: InventoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function getInventory(params?: {
  page?: number;
  limit?: number;
  location?: string;
  low_stock?: boolean;
}): Promise<InventoryResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.location) query.set("location", params.location);
  if (params?.low_stock) query.set("low_stock", "true");
  
  return apiFetch(`/api/v1/inventory?${query.toString()}`);
}

export function adjustInventory(data: {
  product_id: string;
  location?: string;
  quantity: number;
  reason?: string;
  notes?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): Promise<{ data: InventoryItem; adjustment: any }> {
  return apiFetch("/api/v1/inventory/adjust", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ===== DASHBOARD =====

export interface DashboardStats {
  products: number;
  accounts: number;
  orders: {
    total: number;
    pending: number;
    revenue: number;
  };
  inventory: {
    items: number;
    units: number;
    lowStock: number;
  };
}

export function getDashboardStats(): Promise<{ data: DashboardStats }> {
  return apiFetch("/api/v1/dashboard/stats");
}

// ===== DEPLETION REPORTS =====

export interface DepletionReport {
  id: string;
  account_id: string;
  account_name?: string;
  account_trading_name?: string;
  product_id?: string;
  sku: string;
  period_start: string;
  period_end: string;
  bottles_sold: number;
  bottles_on_hand_at_end: number;
  flagged_for_replenishment: boolean;
  notes: string;
  reported_by?: string;
  reported_by_role?: string;
  reported_at: string;
  created_at: string;
  updated_at: string;
}

export interface DepletionReportsResponse {
  data: DepletionReport[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function getDepletionReports(params?: {
  page?: number;
  limit?: number;
  account_id?: string;
  sku?: string;
  flagged?: boolean;
  start_date?: string;
  end_date?: string;
}): Promise<DepletionReportsResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.account_id) query.set("account_id", params.account_id);
  if (params?.sku) query.set("sku", params.sku);
  if (params?.flagged) query.set("flagged", "true");
  if (params?.start_date) query.set("start_date", params.start_date);
  if (params?.end_date) query.set("end_date", params.end_date);

  return apiFetch(`/api/v1/depletion-reports?${query.toString()}`);
}

export function getDepletionReport(id: string): Promise<{ data: DepletionReport }> {
  return apiFetch(`/api/v1/depletion-reports/${id}`);
}

export interface SellThroughVelocity {
  account_id: string;
  account_name?: string;
  sku: string;
  total_bottles_sold: number;
  avg_on_hand: number;
  report_count: number;
  first_period: string;
  last_period: string;
  velocity_bottles_per_day: number;
  days_in_period: number;
}

export function getSellThroughVelocity(params?: {
  account_id?: string;
  sku?: string;
  days?: number;
}): Promise<{ data: SellThroughVelocity[] }> {
  const query = new URLSearchParams();
  if (params?.account_id) query.set("account_id", params.account_id);
  if (params?.sku) query.set("sku", params.sku);
  if (params?.days) query.set("days", String(params.days));

  return apiFetch(`/api/v1/depletion-reports/sellthrough/velocity?${query.toString()}`);
}

export interface SellThroughSummary {
  period: string;
  period_days: number;
  total_bottles_sold: number;
  total_bottles_on_hand: number;
  accounts_reporting: number;
  total_reports: number;
  flagged_for_replenishment: number;
  top_skus: Array<{ sku: string; total_sold: number }>;
  calculated_at: string;
}

export function getSellThroughSummary(params?: {
  period?: "7d" | "30d" | "90d";
}): Promise<{ data: SellThroughSummary }> {
  const query = new URLSearchParams();
  if (params?.period) query.set("period", params.period);

  return apiFetch(`/api/v1/depletion-reports/sellthrough/summary?${query.toString()}`);
}

// ===== INVENTORY ADJUSTMENT REQUESTS =====

export interface InventoryAdjustmentRequest {
  id: string;
  account_id: string;
  account_name?: string;
  account_trading_name?: string;
  product_id?: string;
  sku: string;
  adjustment_type: "count_discrepancy" | "damage" | "theft" | "other";
  quantity_expected: number;
  quantity_actual: number;
  quantity_adjustment: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requested_by?: string;
  approved_by?: string;
  requested_at: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryAdjustmentRequestsResponse {
  data: InventoryAdjustmentRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function getInventoryAdjustmentRequests(params?: {
  page?: number;
  limit?: number;
  account_id?: string;
  status?: string;
}): Promise<InventoryAdjustmentRequestsResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.account_id) query.set("account_id", params.account_id);
  if (params?.status) query.set("status", params.status);

  return apiFetch(`/api/v1/inventory-adjustment-requests?${query.toString()}`);
}

// ===== NEW PRODUCT REQUESTS =====

export interface NewProductRequestApi {
  id: string;
  request_id: string;
  title: string;
  requested_by: "brand_operator" | "manufacturer";
  requested_at: string;
  specs: {
    baseSpirit: string;
    targetAbv: number;
    flavorProfile: string[];
    sweetener?: string;
    targetPricePoint: string;
    packaging: {
      bottleSize: string;
      labelStyle: string;
      caseConfiguration: number;
    };
    minimumOrderQuantity: number;
    targetLaunchDate: string;
    regulatoryMarkets: string[];
  };
  status: "draft" | "submitted" | "under_review" | "proposed" | "approved" | "rejected" | "declined";
  assigned_manufacturer?: string;
  submitted_at?: string;
  review_started_at?: string;
  proposal_received_at?: string;
  decided_at?: string;
  manufacturer_proposal?: {
    feasible: boolean;
    canHitAbv: boolean;
    proposedAbv?: number;
    production: {
      equipmentRequired: string[];
      fermentationTime: string;
      agingTime?: string;
      batchSize: number;
      minimumBatchSize: number;
      capacityAvailable: boolean;
    };
    costs: {
      perBottleProduction: number;
      perBottlePackaging: number;
      perBottleLabeling: number;
      setupFee?: number;
      totalPerBottle: number;
    };
    timeline: {
      sampleAvailableDate: string;
      productionStartDate: string;
      firstDeliveryDate: string;
    };
    technicalNotes: string;
    regulatoryNotes: string;
    sampleQuantity: number;
    sampleShipDate: string;
  };
  brand_decision?: {
    decision: "approve" | "reject" | "request_changes";
    notes: string;
    decidedAt: string;
    decidedBy: string;
  };
  production_po_id?: string;
  resulting_sku?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attachments: any[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface NewProductRequestsResponse {
  data: NewProductRequestApi[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export function getNewProductRequests(params?: {
  limit?: number;
  offset?: number;
  status?: string;
  assigned_manufacturer?: string;
}): Promise<NewProductRequestsResponse> {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));
  if (params?.status) query.set("status", params.status);
  if (params?.assigned_manufacturer) query.set("assigned_manufacturer", params.assigned_manufacturer);

  return apiFetch(`/api/v1/new-product-requests?${query.toString()}`);
}

export function getNewProductRequest(id: string): Promise<{ data: NewProductRequestApi }> {
  return apiFetch(`/api/v1/new-product-requests/${id}`);
}

export function createNewProductRequest(data: Partial<NewProductRequestApi>): Promise<{ data: NewProductRequestApi }> {
  return apiFetch("/api/v1/new-product-requests", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateNewProductRequest(id: string, data: Partial<NewProductRequestApi>): Promise<{ data: NewProductRequestApi }> {
  return apiFetch(`/api/v1/new-product-requests/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteNewProductRequest(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/api/v1/new-product-requests/${id}`, {
    method: "DELETE",
  });
}
