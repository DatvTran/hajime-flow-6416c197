/**
 * Track whether the commercial file was opened by HQ or placed in the distributor portal.
 */
export async function up(knex) {
  const has = await knex.schema.hasTable("export_orders");
  if (!has) return;
  const hasOrigin = await knex.schema.hasColumn("export_orders", "origin");
  if (!hasOrigin) {
    await knex.schema.alterTable("export_orders", (table) => {
      table.string("origin", 24).notNullable().defaultTo("hq");
    });
  }
}

export async function down(knex) {
  const has = await knex.schema.hasTable("export_orders");
  if (!has) return;
  const hasOrigin = await knex.schema.hasColumn("export_orders", "origin");
  if (hasOrigin) {
    await knex.schema.alterTable("export_orders", (table) => {
      table.dropColumn("origin");
    });
  }
}
