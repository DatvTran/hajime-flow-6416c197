import { toast } from "@/components/ui/sonner";

/**
 * apiFetch wraps fetch with auth headers and error handling
 */
export async function apiFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ===== PRODUCTS =====

export async function createProduct(productData: {
  name: string;
  sku: string;
  category: string;
  abv: string;
  caseSize: string;
  unitPrice: string;
  bottlesPerCase: string;
  unit: string;
  status?: string;
  description?: string;
  tastingNotes?: string;
  pairingSuggestions?: string;
}) {
  return apiFetch("/api/v1/products", {
    method: "POST",
    body: JSON.stringify(productData),
  });
}

export async function updateProduct(id: string, productData: Partial<{
  name: string;
  sku: string;
  category: string;
  abv: string;
  caseSize: string;
  unitPrice: string;
  bottlesPerCase: string;
  unit: string;
  status: string;
  description: string;
  tastingNotes: string;
  pairingSuggestions: string;
}>) {
  return apiFetch(`/api/v1/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(productData),
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
  email: string;
  type: string;
  address: string;
  city: string;
  phone?: string;
  tradingName?: string;
  taxId?: string;
  stripeCustomerId?: string;
  deliveryInstructions?: string;
  contactName?: string;
  status?: string;
}) {
  return apiFetch("/api/v1/accounts", {
    method: "POST",
    body: JSON.stringify(accountData),
  });
}

export async function updateAccount(id: string, accountData: Partial<{
  name: string;
  email: string;
  type: string;
  address: string;
  city: string;
  phone: string;
  tradingName: string;
  taxId: string;
  stripeCustomerId: string;
  deliveryInstructions: string;
  contactName: string;
  status: string;
}>) {
  return apiFetch(`/api/v1/accounts/${id}`, {
    method: "PUT",
    body: JSON.stringify(accountData),
  });
}

export async function deleteAccount(id: string) {
  return apiFetch(`/api/v1/accounts/${id}`, {
    method: "DELETE",
  });
}

// ===== ORDERS =====

export async function createOrder(orderData: {
  accountId: string;
  accountName: string;
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  deliveryDate?: string;
  notes?: string;
  paymentTerms?: string;
}) {
  return apiFetch("/api/v1/orders", {
    method: "POST",
    body: JSON.stringify(orderData),
  });
}

export async function updateOrderStatus(id: string, status: string) {
  return apiFetch(`/api/v1/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function apiUpdateOrderStatus(
  id: string,
  status: string,
  options?: { rejectReason?: string }
) {
  const body: Record<string, unknown> = { status };
  if (options?.rejectReason) {
    body.reject_reason = options.rejectReason;
  }
  return apiFetch(`/api/v1/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function apiUpdateOrder(id: string, updates: Record<string, unknown>) {
  return apiFetch(`/api/v1/orders/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function apiDeleteOrder(id: string) {
  return apiFetch(`/api/v1/orders/${id}`, {
    method: "DELETE",
  });
}

export async function apiApproveOrder(id: string) {
  return apiFetch(`/api/v1/orders/${id}/approve`, {
    method: "PATCH",
  });
}

export async function apiRejectOrder(id: string, reason?: string) {
  return apiFetch(`/api/v1/orders/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reject_reason: reason }),
  });
}

// ===== ORDER LIFECYCLE (for Brand Operator dashboard) =====

export async function getOrderLifecycle(id: string) {
  return apiFetch(`/api/v1/orders/${id}/lifecycle`);
}

export async function getOrderTimeline(id: string) {
  return apiFetch(`/api/v1/orders/${id}/timeline`);
}

export async function createShipmentForOrder(
  orderId: string,
  shipmentData: {
    carrier?: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
    notes?: string;
  }
) {
  return apiFetch(`/api/v1/orders/${orderId}/ship`, {
    method: "POST",
    body: JSON.stringify(shipmentData),
  });
}

export async function createInvoiceForOrder(
  orderId: string,
  invoiceData?: { dueDate?: string; notes?: string }
) {
  return apiFetch(`/api/v1/orders/${orderId}/invoice`, {
    method: "POST",
    body: JSON.stringify(invoiceData || {}),
  });
}

export async function getInventory(params?: {
  sku?: string;
  location?: string;
  low_stock?: boolean;
}) {
  const queryParams = new URLSearchParams();
  if (params?.sku) queryParams.set("sku", params.sku);
  if (params?.location) queryParams.set("location", params.location);
  if (params?.low_stock) queryParams.set("low_stock", "true");

  return apiFetch(`/api/v1/inventory?${queryParams.toString()}`);
}

export async function adjustInventory(
  inventoryId: string,
  adjustment: { quantity: number; reason: string }
) {
  return apiFetch(`/api/v1/inventory/${inventoryId}/adjust`, {
    method: "PATCH",
    body: JSON.stringify(adjustment),
  });
}

export async function getAccounts(params?: {
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.type) queryParams.set("type", params.type);
  if (params?.search) queryParams.set("search", params.search);
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));

  return apiFetch(`/api/v1/accounts?${queryParams.toString()}`);
}

export async function getProducts(params?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.set("category", params.category);
  if (params?.search) queryParams.set("search", params.search);
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));

  return apiFetch(`/api/v1/products?${queryParams.toString()}`);
}

export async function getOrders(params?: {
  status?: string;
  account_id?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.set("status", params.status);
  if (params?.account_id) queryParams.set("account_id", params.account_id);
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));

  return apiFetch(`/api/v1/orders?${queryParams.toString()}`);
}

export async function getDashboardStats() {
  return apiFetch("/api/v1/dashboard/stats");
}

export async function getShipments(params?: {
  order_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.order_id) queryParams.set("order_id", params.order_id);
  if (params?.status) queryParams.set("status", params.status);
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));

  return apiFetch(`/api/v1/shipments?${queryParams.toString()}`);
}

export async function getInvoices(params?: {
  order_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.order_id) queryParams.set("order_id", params.order_id);
  if (params?.status) queryParams.set("status", params.status);
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));

  return apiFetch(`/api/v1/invoices?${queryParams.toString()}`);
}

export async function createPurchaseOrder(orderData: {
  manufacturer_id: string;
  manufacturer_name?: string;
  order_date: string;
  delivery_date?: string;
  market_destination?: string;
  items: Array<{
    product_id: string;
    sku: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price?: number;
  }>;
  total_bottles?: number;
  total_amount?: number;
  notes?: string;
  status?: string;
}) {
  return apiFetch("/api/v1/purchase-orders", {
    method: "POST",
    body: JSON.stringify(orderData),
  });
}

export async function updatePurchaseOrder(
  id: string,
  updates: Partial<{
    manufacturer_id: string;
    order_date: string;
    delivery_date: string;
    market_destination: string;
    items: Array<{
      product_id: string;
      sku: string;
      product_name: string;
      quantity: number;
      unit_price: number;
    }>;
    total_bottles: number;
    total_amount: number;
    notes: string;
    status: string;
  }>
) {
  return apiFetch(`/api/v1/purchase-orders/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function updatePurchaseOrderStatus(id: string, status: string) {
  return apiFetch(`/api/v1/purchase-orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function getPurchaseOrders(params?: {
  status?: string;
  manufacturer_id?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.set("status", params.status);
  if (params?.manufacturer_id) queryParams.set("manufacturer_id", params.manufacturer_id);
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));

  return apiFetch(`/api/v1/purchase-orders?${queryParams.toString()}`);
}

// ===== VISIT NOTES =====

export async function createVisitNote(visitData: {
  account_id: string | number;
  note: string;
  visit_date?: string;
}) {
  return apiFetch("/api/v1/visit-notes", {
    method: "POST",
    body: JSON.stringify(visitData),
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

// ═══════════════════════════════════════════════════════════════════════
// PHASE 2 — NEW TABLES (Migration 009)
// ═══════════════════════════════════════════════════════════════════════

// ===== TEAM MEMBERS =====

export async function getTeamMembers() {
  return apiFetch("/api/v1/team-members");
}

export async function createTeamMember(memberData: {
  name: string;
  email: string;
  role: string;
  phone?: string;
  department?: string;
}) {
  return apiFetch("/api/v1/team-members", {
    method: "POST",
    body: JSON.stringify(memberData),
  });
}

export async function deleteTeamMember(id: string) {
  return apiFetch(`/api/v1/team-members/${id}`, {
    method: "DELETE",
  });
}

// ===== OPERATIONAL SETTINGS =====

export async function getOperationalSettings() {
  return apiFetch("/api/v1/operational-settings");
}

export async function updateOperationalSettings(settings: {
  lead_time_days?: number;
  safety_stock_days?: number;
  shelf_threshold?: number;
  reorder_point_bottles?: number;
  default_payment_terms?: string;
  default_currency?: string;
  auto_create_shipment?: boolean;
  auto_alert_low_stock?: boolean;
}) {
  return apiFetch("/api/v1/operational-settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

// ===== SUPPORT TICKETS =====

export async function getSupportTickets(params?: {
  status?: string;
  priority?: string;
  account_id?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.set("status", params.status);
  if (params?.priority) queryParams.set("priority", params.priority);
  if (params?.account_id) queryParams.set("account_id", params.account_id);

  return apiFetch(`/api/v1/support-tickets?${queryParams.toString()}`);
}

export async function getSupportTicket(id: string) {
  return apiFetch(`/api/v1/support-tickets/${id}`);
}

export async function createSupportTicket(ticketData: {
  title: string;
  description: string;
  priority?: string;
  category?: string;
  account_id?: string;
}) {
  return apiFetch("/api/v1/support-tickets", {
    method: "POST",
    body: JSON.stringify(ticketData),
  });
}

export async function createTicketReply(
  ticketId: string,
  message: string
) {
  return apiFetch(`/api/v1/support-tickets/${ticketId}/replies`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export async function updateTicketStatus(
  id: string,
  status: "open" | "in_progress" | "resolved" | "closed"
) {
  return apiFetch(`/api/v1/support-tickets/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ===== MANUFACTURER PROFILES =====

export async function getManufacturerProfiles() {
  return apiFetch("/api/v1/manufacturer-profiles");
}

export async function getManufacturerProfile(id: string) {
  return apiFetch(`/api/v1/manufacturer-profiles/${id}`);
}

export async function createManufacturerProfile(profileData: {
  manufacturer_id: string;
  company_name?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  tax_id?: string;
  bank_name?: string;
  bank_account?: string;
  iban?: string;
  swift?: string;
  currency?: string;
  capacity_bottles_per_month?: number;
  min_order_bottles?: number;
  lead_time_days?: number;
  payment_terms?: string;
  certifications?: string;
  notes?: string;
}) {
  return apiFetch("/api/v1/manufacturer-profiles", {
    method: "POST",
    body: JSON.stringify(profileData),
  });
}

export async function updateManufacturerProfile(
  id: string,
  updates: Partial<{
    company_name: string;
    contact_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    website: string;
    tax_id: string;
    bank_name: string;
    bank_account: string;
    iban: string;
    swift: string;
    currency: string;
    capacity_bottles_per_month: number;
    min_order_bottles: number;
    lead_time_days: number;
    payment_terms: string;
    certifications: string;
    notes: string;
  }>
) {
  return apiFetch(`/api/v1/manufacturer-profiles/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

// ===== TASKS =====

export async function getTasks(params?: {
  status?: string;
  assigned_to?: string;
  account_id?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.set("status", params.status);
  if (params?.assigned_to) queryParams.set("assigned_to", params.assigned_to);
  if (params?.account_id) queryParams.set("account_id", params.account_id);

  return apiFetch(`/api/v1/tasks?${queryParams.toString()}`);
}

export async function createTask(taskData: {
  title: string;
  description?: string;
  priority?: string;
  assigned_to?: string;
  account_id?: string;
  due_date?: string;
}) {
  return apiFetch("/api/v1/tasks", {
    method: "POST",
    body: JSON.stringify(taskData),
  });
}

export async function updateTaskStatus(
  id: string,
  status: "todo" | "in_progress" | "done" | "cancelled"
) {
  return apiFetch(`/api/v1/tasks/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function updateTask(
  id: string,
  updates: Partial<{
    title: string;
    description: string;
    priority: string;
    assigned_to: string;
    account_id: string;
    due_date: string;
    status: string;
  }>
) {
  return apiFetch(`/api/v1/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

// ===== OPPORTUNITIES =====

export async function getOpportunities(params?: {
  status?: string;
  assigned_to?: string;
  account_id?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.set("status", params.status);
  if (params?.assigned_to) queryParams.set("assigned_to", params.assigned_to);
  if (params?.account_id) queryParams.set("account_id", params.account_id);

  return apiFetch(`/api/v1/opportunities?${queryParams.toString()}`);
}

export async function createOpportunity(opportunityData: {
  title: string;
  description?: string;
  value?: number;
  currency?: string;
  account_id?: string;
  expected_close_date?: string;
  assigned_to?: string;
}) {
  return apiFetch("/api/v1/opportunities", {
    method: "POST",
    body: JSON.stringify(opportunityData),
  });
}

export async function updateOpportunity(
  id: string,
  updates: Partial<{
    title: string;
    description: string;
    value: number;
    currency: string;
    account_id: string;
    expected_close_date: string;
    assigned_to: string;
    status: string;
  }>
) {
  return apiFetch(`/api/v1/opportunities/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function updateOpportunityStatus(
  id: string,
  status:
    | "prospecting"
    | "qualified"
    | "proposal"
    | "negotiation"
    | "closed_won"
    | "closed_lost"
) {
  return apiFetch(`/api/v1/opportunities/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
