/**
 * Payments, FOB price lists, case pack, RLS deny-anon, expo capture_ip.
 * Platform DB only.
 */
export async function up(knex) {
  if (await knex.schema.hasTable("export_orders")) {
    const o = await knex("export_orders").columnInfo();
    if (!o.actual_ship_date) {
      await knex.schema.alterTable("export_orders", (t) => {
        t.date("actual_ship_date");
      });
    }
  }

  if (await knex.schema.hasTable("export_orders") && !(await knex.schema.hasTable("export_payments"))) {
    await knex.schema.createTable("export_payments", (t) => {
      t.bigIncrements("id").primary();
      t.uuid("tenant_id").notNullable();
      t.bigInteger("export_order_id").notNullable().references("id").inTable("export_orders").onDelete("CASCADE");
      t.string("payment_type", 20).notNullable();
      t.decimal("amount_expected", 14, 2).notNullable();
      t.decimal("amount_received", 14, 2).notNullable().defaultTo(0);
      t.decimal("bank_fees_deducted", 14, 2).notNullable().defaultTo(0);
      t.decimal("net_credited_amount", 14, 2).notNullable().defaultTo(0);
      t.string("status", 20).notNullable().defaultTo("pending");
      t.date("value_date");
      t.string("payment_reference", 100);
      t.string("method", 30).defaultTo("bank_transfer");
      t.bigInteger("verified_by");
      t.timestamp("verified_at");
      t.text("notes");
      t.timestamps(true, true);
      t.index(["tenant_id", "export_order_id", "payment_type"]);
    });
    await knex.raw(`
      ALTER TABLE export_payments
      ADD CONSTRAINT export_payments_net_non_negative
      CHECK (net_credited_amount >= 0 AND net_credited_amount <= amount_received)
    `);
  }

  if (await knex.schema.hasTable("products")) {
    const p = await knex("products").columnInfo();
    if (!p.bottles_per_case) {
      await knex.schema.alterTable("products", (t) => {
        t.integer("bottles_per_case");
      });
      await knex.raw(`
        UPDATE products SET bottles_per_case = 12
        WHERE bottles_per_case IS NULL AND (unit_size ILIKE '%750%' OR unit_size IS NULL)
      `);
      await knex.raw(`
        UPDATE products SET bottles_per_case = 20
        WHERE bottles_per_case IS NULL AND unit_size ILIKE '%200%'
      `);
    }
  }

  if (!(await knex.schema.hasTable("price_lists"))) {
    await knex.schema.createTable("price_lists", (t) => {
      t.bigIncrements("id").primary();
      t.uuid("tenant_id").notNullable();
      t.string("name", 150).notNullable();
      t.string("currency", 3).notNullable().defaultTo("USD");
      t.string("market", 100);
      t.boolean("is_default").defaultTo(false);
      t.date("effective_from").notNullable();
      t.date("effective_to");
      t.string("status", 20).notNullable().defaultTo("active");
      t.timestamps(true, true);
      t.index(["tenant_id", "status"]);
    });
    await knex.schema.createTable("pricing_tiers", (t) => {
      t.bigIncrements("id").primary();
      t.uuid("tenant_id").notNullable();
      t.bigInteger("price_list_id").notNullable().references("id").inTable("price_lists").onDelete("CASCADE");
      t.string("code", 20).notNullable();
      t.string("label", 60).notNullable();
      t.integer("min_cases").notNullable();
      t.string("basis", 20).notNullable().defaultTo("750ml_cases");
      t.integer("sort_order").defaultTo(0);
      t.text("commercial_treatment");
      t.unique(["tenant_id", "price_list_id", "code"]);
    });
    await knex.schema.createTable("price_list_entries", (t) => {
      t.bigIncrements("id").primary();
      t.uuid("tenant_id").notNullable();
      t.bigInteger("price_list_id").notNullable().references("id").inTable("price_lists").onDelete("CASCADE");
      t.string("sku", 100).notNullable();
      t.string("unit_size", 20).notNullable();
      t.string("tier_code", 20).notNullable();
      t.decimal("case_price", 12, 2).notNullable();
      t.decimal("unit_price", 12, 2).notNullable();
      t.decimal("internal_floor_case", 12, 2);
      t.decimal("target_retail", 12, 2);
      t.timestamps(true, true);
      t.unique(["tenant_id", "price_list_id", "sku", "unit_size", "tier_code"]);
    });
  }

  if (await knex.schema.hasTable("expo_leads")) {
    const e = await knex("expo_leads").columnInfo();
    if (!e.capture_ip) {
      await knex.schema.alterTable("expo_leads", (t) => {
        t.string("capture_ip", 45);
      });
    }
  }

  const exportTables = [
    "export_orders",
    "export_payments",
    "export_documents",
    "export_order_events",
    "document_sequences",
    "price_lists",
    "pricing_tiers",
    "price_list_entries",
    "expo_leads",
  ];
  for (const name of exportTables) {
    if (!(await knex.schema.hasTable(name))) continue;
    await knex.raw(`ALTER TABLE ${name} ENABLE ROW LEVEL SECURITY`);
    await knex.raw(`REVOKE ALL ON TABLE ${name} FROM anon, authenticated`).catch(() => {});
  }

  console.log("[Migration 051] Export payments, pricing, RLS");
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("price_list_entries");
  await knex.schema.dropTableIfExists("pricing_tiers");
  await knex.schema.dropTableIfExists("price_lists");
  await knex.schema.dropTableIfExists("export_payments");
}
