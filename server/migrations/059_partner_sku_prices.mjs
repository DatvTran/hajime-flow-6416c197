/**
 * Negotiated sell-in (HQ → wholesaler) and partner sell-out (wholesaler → retail) per account × SKU.
 */
export async function up(knex) {
  if (await knex.schema.hasTable("partner_sku_prices")) return;
  await knex.schema.createTable("partner_sku_prices", (t) => {
    t.bigIncrements("id").primary();
    t.uuid("tenant_id").notNullable();
    t.string("account_id", 64).notNullable();
    t.string("sku", 100).notNullable();
    t.decimal("sell_in_case_price", 12, 2);
    t.decimal("sell_out_case_price", 12, 2);
    t.string("currency", 3).notNullable().defaultTo("CAD");
    t.timestamps(true, true);
    t.unique(["tenant_id", "account_id", "sku"]);
    t.index(["tenant_id", "account_id"]);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("partner_sku_prices");
}
