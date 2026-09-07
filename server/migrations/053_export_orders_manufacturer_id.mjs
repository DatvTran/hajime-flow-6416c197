/**
 * Link export files to HQ Distilleries CRM (manufacturer_profiles / partner id).
 */
export async function up(knex) {
  if (!(await knex.schema.hasTable("export_orders"))) return;
  if (await knex.schema.hasColumn("export_orders", "manufacturer_id")) return;
  await knex.schema.alterTable("export_orders", (table) => {
    table.string("manufacturer_id", 80).nullable();
    table.index(["tenant_id", "manufacturer_id"]);
  });
}

export async function down(knex) {
  if (!(await knex.schema.hasTable("export_orders"))) return;
  if (!(await knex.schema.hasColumn("export_orders", "manufacturer_id"))) return;
  await knex.schema.alterTable("export_orders", (table) => {
    table.dropIndex(["tenant_id", "manufacturer_id"]);
    table.dropColumn("manufacturer_id");
  });
}
