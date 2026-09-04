/**
 * Link export files to a distributor org (portal visibility) and persist issued documents.
 */
export async function up(knex) {
  const has = await knex.schema.hasTable("export_orders");
  if (!has) return;

  const hasOrg = await knex.schema.hasColumn("export_orders", "distributor_org_id");
  if (!hasOrg) {
    await knex.schema.alterTable("export_orders", (table) => {
      table.uuid("distributor_org_id").nullable();
      table.index("distributor_org_id");
    });
  }

  const hasIssued = await knex.schema.hasColumn("export_orders", "issued_docs");
  if (!hasIssued) {
    await knex.schema.alterTable("export_orders", (table) => {
      table.jsonb("issued_docs").notNullable().defaultTo("{}");
    });
  }
}

export async function down(knex) {
  const has = await knex.schema.hasTable("export_orders");
  if (!has) return;
  const hasIssued = await knex.schema.hasColumn("export_orders", "issued_docs");
  if (hasIssued) {
    await knex.schema.alterTable("export_orders", (table) => {
      table.dropColumn("issued_docs");
    });
  }
}
