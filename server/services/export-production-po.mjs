import { canonicalizeManufacturerAssignmentId } from "../lib/npr-manufacturer-scope.mjs";
import { priceExportLines } from "../lib/export-orders.mjs";

export async function createProductionPoForExport(trx, { tenantId, order, actor }) {
  const lines = Array.isArray(order.lines)
    ? order.lines
    : typeof order.lines === "string"
      ? JSON.parse(order.lines)
      : [];
  const pack = priceExportLines(lines);
  const bottles = pack.lines.reduce((s, l) => s + l.totalBottles, 0);
  const supplier = String(order.manufacturer_name || "Kosapan Distillery").trim();
  const mfgId = canonicalizeManufacturerAssignmentId(null, supplier) || "kosapan";
  const year = new Date().getUTCFullYear();
  const po_number = `PO-EX-${year}-${String(order.seq || order.id).padStart(4, "0")}`;

  const existing = await trx("purchase_orders")
    .where({ tenant_id: tenantId, po_number })
    .whereNull("deleted_at")
    .first();
  if (existing) return existing;

  const header = {
    tenant_id: tenantId,
    po_number,
    supplier_name: supplier,
    manufacturer_id: mfgId,
    status: "approved",
    order_date: new Date(),
    expected_delivery_date: order.requested_completion || null,
    total_bottles: bottles,
    total_amount: Number(order.subtotal_usd || 0),
    notes: `Export ${order.display_id} production authorization`,
    po_type: "production",
    metadata: JSON.stringify({ export_order_id: order.id, direct_export: true }),
    created_by: actor.userId || null,
  };
  if (await trx.schema.hasColumn("purchase_orders", "export_order_id")) {
    header.export_order_id = order.id;
    header.direct_export = true;
  }

  const [po] = await trx("purchase_orders").insert(header).returning("*");
  for (const line of pack.lines) {
    await trx("purchase_order_items").insert({
      tenant_id: tenantId,
      purchase_order_id: po.id,
      sku: line.sku,
      product_name: line.product,
      quantity_ordered: line.totalBottles,
      quantity_received: 0,
      unit_cost: 0,
      line_total: 0,
    });
  }
  return po;
}
