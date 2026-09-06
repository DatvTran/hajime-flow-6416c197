import { priceExportLines } from "../lib/export-orders.mjs";

function parseLines(order) {
  if (Array.isArray(order.lines)) return order.lines;
  if (typeof order.lines === "string") {
    try {
      const p = JSON.parse(order.lines);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function bookExportOriginInventory(trx, { tenantId, order }) {
  const priced = priceExportLines(parseLines(order));
  const location = String(order.fob_named_point || "FOB origin").trim() || "FOB origin";
  const now = new Date();
  for (const line of priced.lines) {
    let product = await trx("products")
      .where({ tenant_id: tenantId, sku: line.sku })
      .whereNull("deleted_at")
      .first();
    if (!product) {
      const [p] = await trx("products")
        .insert({
          tenant_id: tenantId,
          sku: line.sku,
          name: line.product,
          unit_size: line.size,
          bottles_per_case: line.bottlesPerCase,
          created_at: now,
          updated_at: now,
        })
        .returning("*");
      product = p;
    }
    const existing = await trx("inventory")
      .where({ tenant_id: tenantId, product_id: product.id, location })
      .first();
    const qty = line.totalBottles;
    if (existing) {
      await trx("inventory")
        .where({ id: existing.id })
        .update({
          quantity_on_hand: Number(existing.quantity_on_hand || 0) + qty,
          updated_at: now,
        });
    } else {
      await trx("inventory").insert({
        tenant_id: tenantId,
        product_id: product.id,
        location,
        quantity_on_hand: qty,
        reserved_quantity: 0,
        updated_at: now,
      });
    }
  }
}

export async function shipExportOriginInventory(trx, { tenantId, order }) {
  const priced = priceExportLines(parseLines(order));
  const location = String(order.fob_named_point || "FOB origin").trim() || "FOB origin";
  const now = new Date();
  for (const line of priced.lines) {
    const product = await trx("products")
      .where({ tenant_id: tenantId, sku: line.sku })
      .whereNull("deleted_at")
      .first();
    if (!product) continue;
    const existing = await trx("inventory")
      .where({ tenant_id: tenantId, product_id: product.id, location })
      .first();
    if (!existing) continue;
    const next = Math.max(0, Number(existing.quantity_on_hand || 0) - line.totalBottles);
    await trx("inventory").where({ id: existing.id }).update({
      quantity_on_hand: next,
      updated_at: now,
    });
  }
}

export async function createDirectExportShipment(trx, { tenantId, order, actor }) {
  const priced = priceExportLines(parseLines(order));
  const bottles = priced.lines.reduce((s, l) => s + l.totalBottles, 0);
  const shipment_number = `EXP-${order.display_id}-${crypto.randomUUID().slice(0, 8)}`;
  const header = {
    tenant_id: tenantId,
    shipment_number,
    status: "in_transit",
    carrier: String(order.forwarder_name || "Buyer forwarder"),
    from_location: String(order.fob_named_point || "FOB origin"),
    to_location: String(order.destination_country || order.territory || "Destination"),
    total_bottles: bottles,
    order_id: order.production_po_id || order.id,
    order_type: "purchase_order",
    created_at: new Date(),
    updated_at: new Date(),
  };
  if (await trx.schema.hasColumn("shipments", "direct_export")) {
    header.direct_export = true;
    header.export_order_id = order.id;
  }
  if (await trx.schema.hasColumn("shipments", "order_type")) {
    header.order_type = "export_order";
  }
  const [ship] = await trx("shipments").insert(header).returning("*");
  if (await trx.schema.hasTable("shipment_items")) {
    for (const line of priced.lines) {
      await trx("shipment_items").insert({
        tenant_id: tenantId,
        shipment_id: ship.id,
        sku: line.sku,
        product_name: line.product,
        quantity: line.totalBottles,
      });
    }
  }
  return ship;
}
