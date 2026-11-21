/**
 * Account-level sell-out currency + USD→local FX rate for partner negotiated pricing.
 * Sell-in remains USD; partner_sku_prices.currency means sell-out currency.
 */
export async function up(knex) {
  if (!(await knex.schema.hasTable("partner_pricing_settings"))) {
    await knex.schema.createTable("partner_pricing_settings", (t) => {
      t.bigIncrements("id").primary();
      t.uuid("tenant_id").notNullable();
      t.string("account_id", 64).notNullable();
      t.string("sell_out_currency", 3).notNullable().defaultTo("CAD");
      t.decimal("usd_to_local_rate", 16, 6);
      t.timestamps(true, true);
      t.unique(["tenant_id", "account_id"]);
      t.index(["tenant_id", "account_id"]);
    });
  }

  // Align existing partner_sku_prices.currency default semantics (sell-out currency).
  if (await knex.schema.hasTable("partner_sku_prices")) {
    // no column changes required — amounts stay; currency column = sell-out currency
  }
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("partner_pricing_settings");
}
