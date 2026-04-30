const API_URL = import.meta.env.VITE_API_URL || "";

function getAuthToken(): string | null {
  try {
    // Keep backward compatibility with legacy token key used in older dev builds
    return localStorage.getItem("hajime_access_token") || localStorage.getItem("token");
  } catch {
    return null;
  }
}

/**
 * apiFetch wraps fetch with auth headers and error handling
 */
export async function apiFetch(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API_URL}${url}`, {
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
  tradingName?: string;
  type: string;
  market: string;
  email?: string;
  phone?: string;
  billingAddress?: string;
  shippingAddress?: string;
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

export async function updateAccount(id: string, accountData: Partial<{
  name: string;
  tradingName: string;
  type: string;
  market: string;
  email: string;
  phone: string;
  billingAddress: string;
  shippingAddress: string;
  paymentTerms: string;
  creditLimit: number;
  salesOwner: string;
  notes: string;
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
  order_number?: string;
  account_id: string;
  status?: string;
  order_date?: string;
  sales_rep?: string;
  items?: Array<{
    sku: string;
    name?: string;
    quantity: number;
    price?: number;
  }>;
  subtotal?: number;
  taxAmount?: number;
  shippingCost?: number;
  totalAmount?: number;
  shippingAddress?: Record<string, unknown>;
  notes?: string;
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
  options?: { message?: string }
) {
  return apiFetch(`/api/v1/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, message: options?.message }),
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
    method: "POST",
  });
}

export async function apiRejectOrder(id: string, reason?: string) {
  return apiFetch(`/api/v1/orders/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function getOrderLifecycle(id: string) {
  return apiFetch(`/api/v1/orders/${id}/lifecycle`);
}

export async function getOrderTimeline(id: string) {
  return apiFetch(`/api/v1/orders/${id}/timeline`);
}

export async function createShipmentForOrder(
  orderId: string,
  shipmentData: {
    carrier: string;
    tracking_number: string;
    estimated_delivery_date?: string;
    notes?: string;
    auto_create_invoice?: boolean;
  }
) {
  return apiFetch(`/api/v1/orders/${orderId}/ship`, {
    method: "POST",
    body: JSON.stringify({
      ...shipmentData,
      auto_create_shipment: true,
    }),
  });
}

export async function createInvoiceForOrder(
  orderId: string,
  invoiceData: {
    due_date?: string;
    payment_terms?: string;
    notes?: string;
  }
) {
  return apiFetch(`/api/v1/orders/${orderId}/invoice`, {
    method: "POST",
    body: JSON.stringify(invoiceData),
  });
}

// ===== INVENTORY =====

export async function getInventory(params?: {
  location?: string;
  status?: string;
  sku?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.location) queryParams.set("location", params.location);
  if (params?.status) queryParams.set("status", params.status);
  if (params?.sku) queryParams.set("sku", params.sku);
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));
  return apiFetch(`/api/v1/inventory?${queryParams.toString()}`);
}

export async function adjustInventory(data: {
  product_id: string;
  location: string;
  quantity: number;
  reason: string;
  notes?: string;
}) {
  return apiFetch("/api/v1/inventory/adjust", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ===== ACCOUNTS LOOKUP =====

export async function getAccounts(params?: {
  type?: string;
  market?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.type) queryParams.set("type", params.type);
  if (params?.market) queryParams.set("market", params.market);
  if (params?.status) queryParams.set("status", params.status);
  if (params?.search) queryParams.set("search", params.search);
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));
  return apiFetch(`/api/v1/accounts?${queryParams.toString()}`);
}

export async function getProducts(params?: {
  category?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.set("category", params.category);
  if (params?.status) queryParams.set("status", params.status);
  if (params?.search) queryParams.set("search", params.search);
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));
  return apiFetch(`/api/v1/products?${queryParams.toString()}`);
}

export async function getOrders(params?: {
  status?: string;
  account_id?: string;
  sales_rep?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.set("status", params.status);
  if (params?.account_id) queryParams.set("account_id", params.account_id);
  if (params?.sales_rep) queryParams.set("sales_rep", params.sales_rep);
  if (params?.start_date) queryParams.set("start_date", params.start_date);
  if (params?.end_date) queryParams.set("end_date", params.end_date);
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
  carrier?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.order_id) queryParams.set("order_id", params.order_id);
  if (params?.status) queryParams.set("status", params.status);
  if (params?.carrier) queryParams.set("carrier", params.carrier);
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

// ===== PURCHASE ORDERS =====

export async function createPurchaseOrder(orderData: {
  po_number: string;
  supplier_id?: string;
  supplier_name?: string;
  po_type?: "sales" | "production";
  status?: string;
  order_date?: string;
  expected_delivery_date?: string;
  items?: Array<{
    sku: string;
    product_name?: string;
    quantity: number;
    unit_price?: number;
  }>;
  total_amount?: number;
  notes?: string;
  distributor_account_id?: string;
}) {
  return apiFetch("/api/v1/purchase-orders", {
    method: "POST",
    body: JSON.stringify(orderData),
  });
}

export async function updatePurchaseOrder(
  id: string,
  orderData: Partial<{
    po_number: string;
    supplier_id: string;
    supplier_name: string;
    po_type: "sales" | "production";
    status: string;
    order_date: string;
    expected_delivery_date: string;
    total_amount: number;
    notes: string;
    distributor_account_id: string;
    brand_operator_acknowledged_at: string;
  }>
) {
  return apiFetch(`/api/v1/purchase-orders/${id}`, {
    method: "PUT",
    body: JSON.stringify(orderData),
  });
}

export async function updatePurchaseOrderStatus(id: string, status: string) {
  return apiFetch(`/api/v1/purchase-orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deletePurchaseOrder(id: string) {
  return apiFetch(`/api/v1/purchase-orders/${id}`, {
    method: "DELETE",
  });
}

export async function getPurchaseOrders(params?: {
  status?: string;
  supplier_id?: string;
  po_type?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.set("status", params.status);
  if (params?.supplier_id) queryParams.set("supplier_id", params.supplier_id);
  if (params?.po_type) queryParams.set("po_type", params.po_type);
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));
  return apiFetch(`/api/v1/purchase-orders?${queryParams.toString()}`);
}

// ===== VISIT NOTES =====

export async function createVisitNote(visitData: {
  account_id: string;
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
  account_id?: string;
  sku?: string;
  period: string;
  target_bottles: number;
  target_revenue?: number;
  notes?: string;
}) {
  return apiFetch("/api/v1/sales-targets", {
    method: "POST",
    body: JSON.stringify(targetData),
  });
}

export async function getSalesTargets(params?: {
  account_id?: string;
  sku?: string;
  period?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.account_id) queryParams.set("account_id", params.account_id);
  if (params?.sku) queryParams.set("sku", params.sku);
  if (params?.period) queryParams.set("period", params.period);
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));
  return apiFetch(`/api/v1/sales-targets?${queryParams.toString()}`);
}

// ===== DEPLETION REPORTS =====

export async function createDepletionReport(reportData: {
  account_id: string;
  sku: string;
  period_start: string;
  period_end: string;
  bottles_sold: number;
  bottles_on_hand_at_end?: number;
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
  reportData: Partial<{
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
    body: JSON.stringify(reportData),
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
  period_start?: string;
  period_end?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.account_id) queryParams.set("account_id", params.account_id);
  if (params?.sku) queryParams.set("sku", params.sku);
  if (params?.period_start) queryParams.set("period_start", params.period_start);
  if (params?.period_end) queryParams.set("period_end", params.period_end);
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
  account_id?: string;
  period?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.account_id) queryParams.set("account_id", params.account_id);
  if (params?.period) queryParams.set("period", params.period);
  return apiFetch(`/api/v1/depletion-reports/sellthrough/summary?${queryParams.toString()}`);
}

// ===== INVENTORY ADJUSTMENT REQUESTS =====

export async function createInventoryAdjustmentRequest(requestData: {
  account_id: string;
  sku: string;
  adjustment_type: "addition" | "removal" | "correction" | "damaged";
  quantity_expected: number;
  quantity_actual: number;
  reason: string;
}) {
  return apiFetch("/api/v1/inventory-adjustments", {
    method: "POST",
    body: JSON.stringify(requestData),
  });
}

export async function getInventoryAdjustmentRequests(params?: {
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
  return apiFetch(`/api/v1/inventory-adjustments?${queryParams.toString()}`);
}

export async function approveInventoryAdjustmentRequest(
  id: string,
  data: { approved_quantity?: number; notes?: string }
) {
  return apiFetch(`/api/v1/inventory-adjustments/${id}/approve`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ===== TEAM MEMBERS (Phase 2) =====

export async function getTeamMembers(opts?: { includeInactive?: boolean }) {
  const q =
    opts?.includeInactive === true
      ? "?include_inactive=1"
      : "";
  return apiFetch(`/api/v1/team-members${q}`);
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

// ===== WAREHOUSES =====

export async function getWarehouses(opts?: { includeInactive?: boolean }) {
  const q =
    opts?.includeInactive === true ? "?include_inactive=1" : "";
  return apiFetch(`/api/v1/warehouses${q}`);
}

export async function createWarehouse(body: { name: string }) {
  return apiFetch("/api/v1/warehouses", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateWarehouse(
  id: string,
  body: Partial<{ name: string; is_active: boolean; sort_order: number }>,
) {
  return apiFetch(`/api/v1/warehouses/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

// ===== OPERATIONAL SETTINGS (Phase 2) =====

export async function getOperationalSettings() {
  return apiFetch("/api/v1/operational-settings");
}

export async function updateOperationalSettings(settings: {
  lead_time_days?: number;
  reorder_point_bottles?: number;
  shelf_threshold?: number;
  auto_ship?: boolean;
  auto_alert?: boolean;
}) {
  return apiFetch("/api/v1/operational-settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

// ===== SUPPORT TICKETS (Phase 2) =====

export async function getSupportTickets(params?: {
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.set("status", params.status);
  if (params?.priority) queryParams.set("priority", params.priority);
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));
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
  message: string,
  data?: { is_internal?: boolean }
) {
  return apiFetch(`/api/v1/support-tickets/${ticketId}/replies`, {
    method: "POST",
    body: JSON.stringify({ message, ...data }),
  });
}

export async function updateTicketStatus(
  ticketId: string,
  status: string,
  data?: { resolution_notes?: string }
) {
  return apiFetch(`/api/v1/support-tickets/${ticketId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, ...data }),
  });
}

// ===== MANUFACTURER PROFILES (Phase 2) =====

export async function getManufacturerProfiles() {
  return apiFetch("/api/v1/manufacturer-profiles");
}

export async function getManufacturerProfile(id: string) {
  return apiFetch(`/api/v1/manufacturer-profiles/${id}`);
}

export async function createManufacturerProfile(profileData: {
  manufacturer_id: string;
  company_name: string;
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
  profileData: Partial<{
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
    body: JSON.stringify(profileData),
  });
}

// ===== TASKS (Phase 2) =====

export async function getTasks(params?: {
  status?: string;
  assigned_to?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.set("status", params.status);
  if (params?.assigned_to) queryParams.set("assigned_to", params.assigned_to);
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));
  return apiFetch(`/api/v1/tasks?${queryParams.toString()}`);
}

export async function createTask(taskData: {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  due_date?: string;
}) {
  return apiFetch("/api/v1/tasks", {
    method: "POST",
    body: JSON.stringify(taskData),
  });
}

export async function updateTaskStatus(id: string, status: string) {
  return apiFetch(`/api/v1/tasks/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function updateTask(
  id: string,
  taskData: Partial<{
    title: string;
    description: string;
    status: string;
    priority: string;
    assigned_to: string;
    due_date: string;
  }>
) {
  return apiFetch(`/api/v1/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(taskData),
  });
}

// ===== OPPORTUNITIES (Phase 2) =====

export async function getOpportunities(params?: {
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
  return apiFetch(`/api/v1/opportunities?${queryParams.toString()}`);
}

export async function createOpportunity(opportunityData: {
  title: string;
  value?: number;
  status?: string;
  account_id?: string;
  expected_close_date?: string;
  notes?: string;
}) {
  return apiFetch("/api/v1/opportunities", {
    method: "POST",
    body: JSON.stringify(opportunityData),
  });
}

export async function updateOpportunity(
  id: string,
  opportunityData: Partial<{
    title: string;
    value: number;
    status: string;
    account_id: string;
    expected_close_date: string;
    notes: string;
  }>
) {
  return apiFetch(`/api/v1/opportunities/${id}`, {
    method: "PUT",
    body: JSON.stringify(opportunityData),
  });
}

export async function updateOpportunityStatus(id: string, status: string) {
  return apiFetch(`/api/v1/opportunities/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ===== TRANSFER ORDERS =====

export async function createTransferOrder(orderData: {
  to_number: string;
  from_location: string;
  to_location: string;
  status?: string;
  request_date?: string;
  ship_date?: string;
  delivery_date?: string;
  tracking_number?: string;
  carrier?: string;
  total_bottles?: number;
  notes?: string;
  items?: Array<{
    sku: string;
    product_name?: string;
    quantity: number;
    batch_id?: string;
  }>;
}) {
  return apiFetch("/api/v1/transfer-orders", {
    method: "POST",
    body: JSON.stringify(orderData),
  });
}

export async function updateTransferOrder(
  id: string,
  orderData: Partial<{
    to_number: string;
    from_location: string;
    to_location: string;
    status: string;
    request_date: string;
    ship_date: string;
    delivery_date: string;
    tracking_number: string;
    carrier: string;
    total_bottles: number;
    notes: string;
  }>
) {
  return apiFetch(`/api/v1/transfer-orders/${id}`, {
    method: "PUT",
    body: JSON.stringify(orderData),
  });
}

export async function updateTransferOrderStatus(id: string, status: string) {
  return apiFetch(`/api/v1/transfer-orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteTransferOrder(id: string) {
  return apiFetch(`/api/v1/transfer-orders/${id}`, {
    method: "DELETE",
  });
}

export async function getTransferOrders(params?: {
  status?: string;
  from_location?: string;
  to_location?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.set("status", params.status);
  if (params?.from_location) queryParams.set("from_location", params.from_location);
  if (params?.to_location) queryParams.set("to_location", params.to_location);
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));
  return apiFetch(`/api/v1/transfer-orders?${queryParams.toString()}`);
}

// ===== SHIPMENTS =====

export async function createShipment(shipmentData: {
  shipment_number: string;
  order_id: number;
  carrier: string;
  tracking_number?: string;
  status?: string;
  shipped_at?: string;
  estimated_delivery_date?: string;
  notes?: string;
  items?: Array<{
    sku: string;
    product_name?: string;
    quantity: number;
    batch_id?: string;
  }>;
}) {
  return apiFetch("/api/v1/shipments", {
    method: "POST",
    body: JSON.stringify(shipmentData),
  });
}

export async function updateShipment(
  id: string,
  shipmentData: Partial<{
    carrier: string;
    tracking_number: string;
    status: string;
    shipped_at: string;
    estimated_delivery_date: string;
    notes: string;
  }>
) {
  return apiFetch(`/api/v1/shipments/${id}`, {
    method: "PUT",
    body: JSON.stringify(shipmentData),
  });
}

export async function updateShipmentStatus(id: string, status: string) {
  return apiFetch(`/api/v1/shipments/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteShipment(id: string) {
  return apiFetch(`/api/v1/shipments/${id}`, {
    method: "DELETE",
  });
}

// ===== NEW PRODUCT REQUESTS =====

export async function getNewProductRequests(params?: {
  status?: string;
  requested_by?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.set("status", params.status);
  if (params?.requested_by) queryParams.set("requested_by", params.requested_by);
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));
  return apiFetch(`/api/v1/new-product-requests?${queryParams.toString()}`);
}

export async function getNewProductRequest(id: string) {
  return apiFetch(`/api/v1/new-product-requests/${id}`);
}

export async function createNewProductRequest(requestData: {
  request_id: string;
  title: string;
  requested_by: "brand_operator" | "manufacturer";
  specs?: string;
  notes?: string;
  assigned_manufacturer?: string;
  status?: string;
  manufacturer_proposal?: string;
}) {
  return apiFetch("/api/v1/new-product-requests", {
    method: "POST",
    body: JSON.stringify(requestData),
  });
}

export async function updateNewProductRequest(
  id: string,
  requestData: Partial<{
    title: string;
    requested_by: string;
    specs: string;
    notes: string;
    assigned_manufacturer: string;
    status: string;
    manufacturer_proposal: string;
  }>
) {
  return apiFetch(`/api/v1/new-product-requests/${id}`, {
    method: "PUT",
    body: JSON.stringify(requestData),
  });
}

export async function deleteNewProductRequest(id: string) {
  return apiFetch(`/api/v1/new-product-requests/${id}`, {
    method: "DELETE",
  });
}

// ===== INCENTIVES =====

export async function getIncentives(params?: {
  status?: string;
  type?: string;
  target_account_id?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.set("status", params.status);
  if (params?.type) queryParams.set("type", params.type);
  if (params?.target_account_id) queryParams.set("target_account_id", params.target_account_id);
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));
  return apiFetch(`/api/v1/incentives?${queryParams.toString()}`);
}

export async function createIncentive(incentiveData: {
  name: string;
  type: string;
  target_sku?: string;
  target_account_id?: string;
  threshold_quantity?: number;
  reward_type: string;
  reward_amount?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
  notes?: string;
}) {
  return apiFetch("/api/v1/incentives", {
    method: "POST",
    body: JSON.stringify(incentiveData),
  });
}

export async function updateIncentive(
  id: string,
  incentiveData: Partial<{
    name: string;
    type: string;
    target_sku: string;
    target_account_id: string;
    threshold_quantity: number;
    reward_type: string;
    reward_amount: number;
    start_date: string;
    end_date: string;
    status: string;
    notes: string;
  }>
) {
  return apiFetch(`/api/v1/incentives/${id}`, {
    method: "PUT",
    body: JSON.stringify(incentiveData),
  });
}

export async function updateIncentiveStatus(id: string, status: string) {
  return apiFetch(`/api/v1/incentives/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteIncentive(id: string) {
  return apiFetch(`/api/v1/incentives/${id}`, {
    method: "DELETE",
  });
}

// ===== PRODUCTION STATUSES =====

export async function getProductionStatuses(params?: {
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));
  return apiFetch(`/api/v1/production-statuses?${queryParams.toString()}`);
}

export async function createProductionStatus(statusData: {
  po_id?: string;
  batch_id?: string;
  stage: string;
  status: string;
  notes?: string;
  started_at?: string;
  completed_at?: string;
}) {
  return apiFetch("/api/v1/production-statuses", {
    method: "POST",
    body: JSON.stringify(statusData),
  });
}

export async function updateProductionStatus(
  id: string,
  statusData: Partial<{
    stage: string;
    status: string;
    notes: string;
    started_at: string;
    completed_at: string;
  }>
) {
  return apiFetch(`/api/v1/production-statuses/${id}`, {
    method: "PUT",
    body: JSON.stringify(statusData),
  });
}

export async function deleteProductionStatus(id: string) {
  return apiFetch(`/api/v1/production-statuses/${id}`, {
    method: "DELETE",
  });
}
