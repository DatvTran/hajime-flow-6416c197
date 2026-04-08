/**
 * Granular API Client - v1
 * RESTful API wrapper for products, orders, accounts, inventory
 */
import { getStoredTokens } from "./api-app";

const API_URL = import.meta.env.VITE_API_URL || "";

// Generic fetch wrapper with auth
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const tokens = getStoredTokens();
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  
  if (tokens?.accessToken) {
    headers["Authorization"] = `Bearer ${tokens.accessToken}`;
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
  billing_address?: any;
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
