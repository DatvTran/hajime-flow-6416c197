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
  getDepletionReports,
  getPurchaseOrders,
  getShipments,
  getNewProductRequests,
} from "./api-v1";
import type { AppData } from "@/types/app-data";
import type { NewProductRequest, PurchaseOrder, Shipment } from "@/data/mockData";

const isDev = process.env.NODE_ENV === 'development' || import.meta.env?.DEV;
const isLocalHost = (() => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
})();
const canUseLegacyFallback = isDev || isLocalHost;

function sliceIsoDate(v: unknown): string {
  if (v == null || v === "") return new Date().toISOString().slice(0, 10);
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function mapRowToPurchaseOrder(po: Record<string, unknown>): PurchaseOrder {
  const id = po.po_number != null ? String(po.po_number) : String(po.id ?? "");
  const rawStatus = String(po.status ?? "draft").toLowerCase().replace(/-/g, "_");

  let status: PurchaseOrder["status"] = "draft";
  if (rawStatus === "approved" || rawStatus === "acknowledged") {
    status = "approved";
  } else if (rawStatus === "submitted") {
    status = "draft";
  } else if (rawStatus === "in_production") {
    status = "in-production";
  } else if (rawStatus === "completed") {
    status = "completed";
  } else if (rawStatus === "ready_for_shipment") {
    status = "shipped";
  } else if (rawStatus === "shipped") {
    status = "shipped";
  } else if (rawStatus === "delivered") {
    status = "delivered";
  } else if (rawStatus === "delayed" || rawStatus === "exception") {
    status = "delayed";
  }

  const manufacturer = String(
    po.supplier_name ?? po.manufacturer ?? po.manufacturer_name ?? "Manufacturer",
  );

  const issueDate = sliceIsoDate(po.order_date ?? po.issue_date);
  const requiredDate = sliceIsoDate(
    po.expected_delivery_date ?? po.delivery_date ?? po.required_date ?? issueDate,
  );

  const poTypeRaw = po.po_type;
  const poType =
    poTypeRaw === "sales" || poTypeRaw === "production"
      ? poTypeRaw
      : undefined;

  return {
    id,
    manufacturer,
    issueDate,
    requiredDate,
    requestedShipDate: requiredDate,
    sku: "—",
    quantity: 0,
    packagingInstructions: "",
    labelVersion: "",
    marketDestination: String(po.market_destination ?? po.marketDestination ?? "—"),
    status,
    notes: String(po.notes ?? ""),
    poType,
    distributorAccountId:
      po.distributor_account_id != null ? String(po.distributor_account_id) : undefined,
    brandOperatorAcknowledgedAt:
      po.brand_operator_acknowledged_at != null
        ? String(po.brand_operator_acknowledged_at)
        : undefined,
  };
}

function productionStageLabel(po: PurchaseOrder): string {
  switch (po.status) {
    case "in-production":
      return "In Production";
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    case "delayed":
      return "Delayed / Issue";
    case "completed":
      return "Ready to Ship";
    case "approved":
      return "Scheduled";
    default:
      return "PO Received";
  }
}

function mapRowToShipment(s: Record<string, unknown>): Shipment {
  const orderType = String(s.order_type ?? "");
  const type: Shipment["type"] = orderType === "purchase_order" ? "inbound" : "outbound";

  const rawStatus = String(s.status ?? "packed").toLowerCase();
  let status: Shipment["status"] = "preparing";
  if (rawStatus === "in_transit" || rawStatus === "out_for_delivery") {
    status = "in-transit";
  } else if (rawStatus === "delivered") {
    status = "delivered";
  } else if (rawStatus === "exception" || rawStatus === "cancelled") {
    status = "delayed";
  }

  const shipTs = s.ship_date ?? s.shipped_at;
  const etaTs = s.estimated_delivery ?? s.eta;
  const delTs = s.delivered_at;

  return {
    id: s.shipment_number != null ? String(s.shipment_number) : String(s.id ?? ""),
    origin: String(s.from_location ?? s.fromLocation ?? "—"),
    destination: String(s.to_location ?? s.toLocation ?? "—"),
    carrier: String(s.carrier ?? ""),
    shipDate: shipTs ? String(shipTs).slice(0, 10) : "",
    eta: etaTs ? String(etaTs).slice(0, 10) : "",
    actualDelivery: delTs ? String(delTs).slice(0, 10) : "",
    linkedOrder: String(s.order_id ?? ""),
    type,
    status,
    notes: String(s.notes ?? ""),
  };
}

function parseMaybeJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  if (typeof value === "object") return value as T;
  return fallback;
}

function mapRowToNewProductRequest(row: Record<string, unknown>): NewProductRequest {
  const specs = parseMaybeJson<NewProductRequest["specs"]>(row.specs, {
    baseSpirit: "coffee_rhum",
    targetAbv: 25,
    flavorProfile: [],
    targetPricePoint: "premium",
    packaging: {
      bottleSize: "750ml",
      labelStyle: "",
      caseConfiguration: 12,
    },
    minimumOrderQuantity: 1200,
    targetLaunchDate: new Date().toISOString().slice(0, 10),
    regulatoryMarkets: [],
  });

  const manufacturerProposal = parseMaybeJson<NewProductRequest["manufacturerProposal"]>(
    row.manufacturer_proposal,
    undefined,
  );
  const brandDecision = parseMaybeJson<NewProductRequest["brandDecision"]>(
    row.brand_decision,
    undefined,
  );
  const attachments = parseMaybeJson<NewProductRequest["attachments"]>(row.attachments, []);

  return {
    id: String(row.request_id ?? row.id ?? ""),
    title: String(row.title ?? "Untitled request"),
    requestedBy: String(row.requested_by ?? "brand_operator"),
    requestedAt: String(row.requested_at ?? row.created_at ?? new Date().toISOString()),
    specs,
    attachments,
    notes: String(row.notes ?? ""),
    status: (String(row.status ?? "draft") as NewProductRequest["status"]),
    assignedManufacturer:
      row.assigned_manufacturer != null ? String(row.assigned_manufacturer) : undefined,
    submittedAt: row.submitted_at != null ? String(row.submitted_at) : undefined,
    reviewStartedAt: row.review_started_at != null ? String(row.review_started_at) : undefined,
    proposalReceivedAt:
      row.proposal_received_at != null ? String(row.proposal_received_at) : undefined,
    decidedAt: row.decided_at != null ? String(row.decided_at) : undefined,
    manufacturerProposal,
    brandDecision,
    sampleShipmentId: row.sample_shipment_id != null ? String(row.sample_shipment_id) : undefined,
    productionPoId: row.production_po_id != null ? String(row.production_po_id) : undefined,
    resultingSku: row.resulting_sku != null ? String(row.resulting_sku) : undefined,
  };
}

/**
 * Transform API v1 data to AppData format
 */
function transformToAppData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accounts: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orders: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inventory: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  depletionReports?: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  purchaseOrdersRaw?: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shipmentsRaw?: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newProductRequestsRaw?: any[],
): Partial<AppData> {
  try {
    const accountById = new Map((accounts || []).map((a) => [String(a.id), a]));
    const purchaseOrdersMapped = (purchaseOrdersRaw || []).map((po) =>
      mapRowToPurchaseOrder(po as Record<string, unknown>),
    );
    const shipmentsMapped = (shipmentsRaw || []).map((sh) =>
      mapRowToShipment(sh as Record<string, unknown>),
    );
    const result = {
      products: (products || []).map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        shortDescription: p.description,
        category: p.category,
        size: p.unit_size || p.metadata?.size || "750ml",
        caseSize: p.metadata?.caseSize || 12,
        bottleSizeMl: p.metadata?.bottleSizeMl || 750,
        abv: p.metadata?.abv || 25,
        wholesaleCasePrice: Number(
          p.metadata?.wholesaleCasePrice ?? p.metadata?.wholesalePriceCase ?? 0,
        ),
        retailPriceCase: p.metadata?.retailPriceCase || 0,
        launchDate: p.metadata?.launchDate,
        status: p.metadata?.status || "active",
        imageUrl: p.metadata?.imageUrl || p.metadata?.image,
        minOrderCases: Number(p.metadata?.minOrderCases ?? 1),
      })),
      accounts: (accounts || []).map(a => {
        // Convert address objects to strings if needed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      salesOrders: (orders || []).map((o) => {
        const account = accountById.get(String(o.account_id));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const firstLine = Array.isArray(o.items) && o.items.length > 0 ? (o.items[0] as any) : null;
        const quantity = firstLine?.quantity_ordered ?? 0;
        const price = Number(o.total_amount ?? o.subtotal ?? 0);
        return {
          id: String(o.id),
          account: o.account_trading_name || o.account_name || o.account_number || "Unknown account",
          market: account?.market || "Unknown",
          orderDate: o.order_date ? String(o.order_date).slice(0, 10) : new Date().toISOString().slice(0, 10),
          requestedDelivery: o.requested_delivery_date
            ? String(o.requested_delivery_date).slice(0, 10)
            : new Date().toISOString().slice(0, 10),
          sku: firstLine?.sku || "—",
          quantity,
          price,
          salesRep: o.sales_rep || "—",
          status: o.status || "draft",
          paymentStatus: "pending",
          accountId: String(o.account_id || ""),
          orderNumber: o.order_number || String(o.id),
          subtotal: Number(o.subtotal ?? price),
          taxAmount: Number(o.tax_amount ?? 0),
          shippingCost: Number(o.shipping_cost ?? 0),
          totalAmount: price,
        };
      }),
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
      purchaseOrders: purchaseOrdersMapped,
      shipments: shipmentsMapped,
      productionStatuses: purchaseOrdersMapped.map((p) => ({
        poId: p.id,
        stage: productionStageLabel(p),
        updatedAt: p.issueDate,
        notes: p.notes,
      })),
      newProductRequests: (newProductRequestsRaw || []).map((npr) =>
        mapRowToNewProductRequest(npr as Record<string, unknown>),
      ),
      retailerShelfStock: {},
      financingLedger: [],
    };
    
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
  const results = await Promise.allSettled([
    getProducts({ limit: 100 }),
    getAccounts({ limit: 100 }),
    getOrders({ limit: 100 }),
    getInventory({ limit: 100 }),
    getDepletionReports({ limit: 200 }),
    getPurchaseOrders({ limit: 100 }),
    getShipments({ limit: 100 }),
    getNewProductRequests({ limit: 100 }),
  ]);
  
  const productsRes = results[0].status === 'fulfilled' ? results[0].value : { data: [] };
  const accountsRes = results[1].status === 'fulfilled' ? results[1].value : { data: [] };
  const ordersRes = results[2].status === 'fulfilled' ? results[2].value : { data: [] };
  const inventoryRes = results[3].status === 'fulfilled' ? results[3].value : { data: [] };
  const depletionReportsRes = results[4].status === 'fulfilled' ? results[4].value : { data: [] };
  const purchaseOrdersRes = results[5].status === 'fulfilled' ? results[5].value : { data: [] };
  const shipmentsRes = results[6].status === 'fulfilled' ? results[6].value : { data: [] };
  const newProductRequestsRes = results[7].status === 'fulfilled' ? results[7].value : { data: [] };
  
  // Log any failures
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`[DataService] API ${index} failed:`, result.reason);
    }
  });
  
  const data = transformToAppData(
    productsRes.data || [],
    accountsRes.data || [],
    ordersRes.data || [],
    inventoryRes.data || [],
    depletionReportsRes.data || [],
    purchaseOrdersRes.data || [],
    shipmentsRes.data || [],
    newProductRequestsRes.data || [],
  );
  
  return data as AppData;
}

/**
 * Fetch data - Stage 4: Use granular APIs.
 * Legacy fallback is only allowed in local/dev to aid migration debugging.
 */
export async function fetchAppData(): Promise<AppData> {
  try {
    return await fetchAppDataGranular();
  } catch (err) {
    if (!canUseLegacyFallback) {
      throw err;
    }
    if (isDev) {
      console.warn("[DataService] Granular APIs failed in local/dev mode, falling back to legacy:", err);
    }
    return fetchLegacyAppData();
  }
}

// Stage 4: putAppData removed — use api-v1-mutations for all writes
// Import { createProduct, updateProduct, etc. } from "@/lib/api-v1-mutations"

// Re-export API v1 functions for direct use
export * from "./api-v1";
