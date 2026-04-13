/**
 * Granular API Client - v1 - Mutations
 * RESTful API wrapper for writes (POST/PUT/DELETE)
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

export async function createProduct(productData: {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unit_size?: string;
  metadata?: Record<string, any>;
}) {
  return apiFetch("/api/v1/products", {
    method: "POST",
    body: JSON.stringify(productData),
  });
}

export async function updateProduct(id: string, updates: Partial<{
  name: string;
  description: string;
  category: string;
  unit_size: string;
  metadata: Record<string, any>;
}>) {
  return apiFetch(`/api/v1/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function deleteProduct(id: string) {
  return apiFetch(`/api/v1/products/${id}`, {
    method: "DELETE",
  });
}

// ===== ACCOUNTS =====

export async function createAccount(accountData: {
  name: string;
  tradingName?: string;
  type?: string;
  market?: string;
  email?: string;
  phone?: string;
  billingAddress?: any;
  shippingAddress?: any;
  paymentTerms?: string;
  creditLimit?: number;
  salesOwner?: string;
  notes?: string;
}) {
  return apiFetch("/api/v1/accounts", {
    method: "POST",
    body: JSON.stringify(accountData),
  });
}

export async function updateAccount(id: string, updates: Partial<{
  name: string;
  tradingName: string;
  type: string;
  market: string;
  email: string;
  phone: string;
  billingAddress: any;
  shippingAddress: any;
  paymentTerms: string;
  creditLimit: number;
  salesOwner: string;
  notes: string;
  status: string;
}>) {
  return apiFetch(`/api/v1/accounts/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function deleteAccount(id: string) {
  return apiFetch(`/api/v1/accounts/${id}`, {
    method: "DELETE",
  });
}

// ===== ORDERS =====

export async function createOrder(orderData: {
  order_number: string;
  account_id: string;
  status?: string;
  order_date?: string;
  sales_rep?: string;
  items?: Array<{
    product_id?: string;
    sku: string;
    name?: string;
    quantity: number;
    price?: number;
  }>;
  subtotal?: number;
  taxAmount?: number;
  shippingCost?: number;
  totalAmount?: number;
  shippingAddress?: any;
  notes?: string;
}) {
  return apiFetch("/api/v1/orders", {
    method: "POST",
    body: JSON.stringify(orderData),
  });
}

export async function updateOrder(id: string, updates: Partial<{
  account_id: string;
  order_date: string;
  sales_rep: string;
  items: Array<{
    product_id?: string;
    sku: string;
    name?: string;
    quantity: number;
    price?: number;
  }>;
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  shippingAddress: any;
  notes: string;
}>) {
  return apiFetch(`/api/v1/orders/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function updateOrderStatus(id: string, status: string) {
  return apiFetch(`/api/v1/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteOrder(id: string) {
  return apiFetch(`/api/v1/orders/${id}`, {
    method: "DELETE",
  });
}

// ===== INVENTORY =====

export async function adjustInventory(adjustmentData: {
  product_id: string;
  location?: string;
  quantity: number;
  reason?: string;
  notes?: string;
}) {
  return apiFetch("/api/v1/inventory/adjust", {
    method: "POST",
    body: JSON.stringify(adjustmentData),
  });
}

// ===== VISIT NOTES =====

export async function createVisitNote(noteData: {
  account_id: string;
  note: string;
  visit_date?: string;
}) {
  return apiFetch("/api/v1/visit-notes", {
    method: "POST",
    body: JSON.stringify(noteData),
  });
}

export async function getVisitNotes(params?: {
  account_id?: string;
  sales_rep?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.account_id) queryParams.set("account_id", params.account_id);
  if (params?.sales_rep) queryParams.set("sales_rep", params.sales_rep);
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));
  
  return apiFetch(`/api/v1/visit-notes?${queryParams.toString()}`);
}

// ===== SALES TARGETS =====

export async function createSalesTarget(targetData: {
  sales_rep: string;
  quarter: number;
  year: number;
  target_amount: number;
}) {
  return apiFetch("/api/v1/sales-targets", {
    method: "POST",
    body: JSON.stringify(targetData),
  });
}

export async function getSalesTargets(params?: {
  sales_rep?: string;
  quarter?: number;
  year?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.sales_rep) queryParams.set("sales_rep", params.sales_rep);
  if (params?.quarter) queryParams.set("quarter", String(params.quarter));
  if (params?.year) queryParams.set("year", String(params.year));
  
  return apiFetch(`/api/v1/sales-targets?${queryParams.toString()}`);
}

// ===== DEPLETION REPORTS =====

export async function createDepletionReport(reportData: {
  account_id: string;
  sku: string;
  period_start: string;
  period_end: string;
  bottles_sold: number;
  bottles_on_hand_at_end: number;
  notes?: string;
  flagged_for_replenishment?: boolean;
}) {
  return apiFetch("/api/v1/depletion-reports", {
    method: "POST",
    body: JSON.stringify(reportData),
  });
}

export async function updateDepletionReport(
  id: string,
  updates: Partial<{
    account_id: string;
    sku: string;
    period_start: string;
    period_end: string;
    bottles_sold: number;
    bottles_on_hand_at_end: number;
    notes: string;
    flagged_for_replenishment: boolean;
  }>
) {
  return apiFetch(`/api/v1/depletion-reports/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function deleteDepletionReport(id: string) {
  return apiFetch(`/api/v1/depletion-reports/${id}`, {
    method: "DELETE",
  });
}

export async function getDepletionReports(params?: {
  account_id?: string;
  sku?: string;
  flagged?: boolean;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.account_id) queryParams.set("account_id", params.account_id);
  if (params?.sku) queryParams.set("sku", params.sku);
  if (params?.flagged) queryParams.set("flagged", "true");
  if (params?.start_date) queryParams.set("start_date", params.start_date);
  if (params?.end_date) queryParams.set("end_date", params.end_date);
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));

  return apiFetch(`/api/v1/depletion-reports?${queryParams.toString()}`);
}

export async function getDepletionReport(id: string) {
  return apiFetch(`/api/v1/depletion-reports/${id}`);
}

export async function getSellThroughVelocity(params?: {
  account_id?: string;
  sku?: string;
  days?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.account_id) queryParams.set("account_id", params.account_id);
  if (params?.sku) queryParams.set("sku", params.sku);
  if (params?.days) queryParams.set("days", String(params.days));

  return apiFetch(`/api/v1/depletion-reports/sellthrough/velocity?${queryParams.toString()}`);
}

export async function getSellThroughSummary(params?: {
  period?: "7d" | "30d" | "90d";
}) {
  const queryParams = new URLSearchParams();
  if (params?.period) queryParams.set("period", params.period);

  return apiFetch(`/api/v1/depletion-reports/sellthrough/summary?${queryParams.toString()}`);
}

// ===== INVENTORY ADJUSTMENT REQUESTS =====

export async function createInventoryAdjustmentRequest(requestData: {
  account_id: string;
  sku: string;
  adjustment_type: "count_discrepancy" | "damage" | "theft" | "other";
  quantity_expected: number;
  quantity_actual: number;
  reason?: string;
}) {
  return apiFetch("/api/v1/inventory-adjustment-requests", {
    method: "POST",
    body: JSON.stringify(requestData),
  });
}

export async function getInventoryAdjustmentRequests(params?: {
  account_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.account_id) queryParams.set("account_id", params.account_id);
  if (params?.status) queryParams.set("status", params.status);
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));

  return apiFetch(`/api/v1/inventory-adjustment-requests?${queryParams.toString()}`);
}

export async function approveInventoryAdjustmentRequest(
  id: string,
  approved: boolean,
  rejectionReason?: string
) {
  return apiFetch(`/api/v1/inventory-adjustment-requests/${id}/approve`, {
    method: "PATCH",
    body: JSON.stringify({
      approved,
      rejection_reason: rejectionReason,
    }),
  });
}
