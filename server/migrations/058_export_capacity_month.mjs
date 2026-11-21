/**
 * First Press capacity by month: the delivery month the buyer wants, and when the order's litres were reserved
 * (set when the buyer countersigns the PO acceptance).
 */
const ORDER_COLUMNS = [
  ["requested_month", (t) => t.string("requested_month", 7)],
  ["capacity_reserved_at", (t) => t.timestamp("capacity_reserved_at")],
];

export async function up(knex) {
  if (!(await knex.schema.hasTable("export_orders"))) return;
  const info = await knex("export_orders").columnInfo();
  const missing = ORDER_COLUMNS.filter(([name]) => !info[name]);
  if (!missing.length) return;
  await knex.schema.alterTable("export_orders", (t) => {
    for (const [, add] of missing) add(t);
  });
}

export async function down(knex) {
  if (!(await knex.schema.hasTable("export_orders"))) return;
  const info = await knex("export_orders").columnInfo();
  const present = ORDER_COLUMNS.filter(([name]) => info[name]).map(([name]) => name);
  if (!present.length) return;
  await knex.schema.alterTable("export_orders", (t) => {
    for (const name of present) t.dropColumn(name);
  });
}
