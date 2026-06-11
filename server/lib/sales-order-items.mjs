/**
 * Batch-load line items onto sales order rows (list + bootstrap).
 * @param {import('knex').Knex} db
 * @param {string} tenantId
 * @param {object[]} orders
 */
export async function attachSalesOrderItems(db, tenantId, orders) {
  if (!Array.isArray(orders) || orders.length === 0) return orders;

  const ids = orders.map((o) => o.id).filter((id) => id != null);
  if (ids.length === 0) return orders;

  const rows = await db('sales_order_items')
    .where({ tenant_id: tenantId })
    .whereIn('sales_order_id', ids)
    .select('*');

  const byOrder = new Map();
  for (const row of rows) {
    const key = String(row.sales_order_id);
    if (!byOrder.has(key)) byOrder.set(key, []);
    byOrder.get(key).push(row);
  }

  return orders.map((o) => ({
    ...o,
    items: byOrder.get(String(o.id)) ?? [],
  }));
}
