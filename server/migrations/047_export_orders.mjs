/**
 * International distributor export orders (Hajime Ltd. HK → Thailand manufacturer → buyer forwarder).
 */
export async function up(knex) {
  const exists = await knex.schema.hasTable("export_orders");
  if (exists) return;

  await knex.schema.createTable("export_orders", (table) => {
    table.bigIncrements("id").primary();
    table.uuid("tenant_id").notNullable().references("id").inTable("tenants").onDelete("CASCADE");
    table.integer("seq").notNullable();
    table.string("display_id", 32).notNullable();
    table.string("quote_no", 32).nullable();
    table.string("pi_no", 32).nullable();
    table.string("deposit_no", 32).nullable();
    table.string("pa_no", 32).nullable();
    table.string("release_no", 32).nullable();

    table.bigInteger("expo_lead_id").nullable().references("id").inTable("expo_leads").onDelete("SET NULL");
    table.bigInteger("account_id").nullable().references("id").inTable("accounts").onDelete("SET NULL");

    table.string("buyer_name", 255).notNullable();
    table.string("buyer_company", 255).notNullable();
    table.text("buyer_address").nullable();
    table.string("buyer_email", 255).nullable();
    table.string("territory", 120).notNullable();
    table.string("destination_country", 120).nullable();
    table.string("buyer_po_no", 80).nullable();

    table.string("stage", 40).notNullable().defaultTo("01_lead");
    table.jsonb("lines").notNullable().defaultTo("[]");
    table.decimal("subtotal_usd", 12, 2).notNullable().defaultTo(0);
    table.decimal("deposit_due_usd", 12, 2).notNullable().defaultTo(0);
    table.decimal("balance_due_usd", 12, 2).notNullable().defaultTo(0);

    table.string("deposit_status", 24).notNullable().defaultTo("pending");
    table.decimal("deposit_received_usd", 12, 2).nullable();
    table.decimal("wire_fees_usd", 12, 2).nullable();
    table.string("deposit_ref", 120).nullable();
    table.date("deposit_value_date").nullable();
    table.text("deposit_notes").nullable();

    table.string("balance_status", 24).notNullable().defaultTo("pending");
    table.decimal("balance_received_usd", 12, 2).nullable();
    table.string("balance_ref", 120).nullable();

    table.string("manufacturer_name", 255).nullable();
    table.date("requested_completion").nullable();
    table.string("production_slot", 120).nullable();
    table.date("expected_completion").nullable();
    table.text("batch_plan").nullable();
    table.string("cases_per_pallet", 40).nullable();
    table.string("estimated_pallets", 40).nullable();
    table.string("estimated_gross_weight", 80).nullable();
    table.string("factory_contact", 255).nullable();
    table.date("ready_to_ship_on").nullable();

    table.string("forwarder_name", 255).nullable();
    table.text("forwarder_instructions").nullable();
    table.string("fob_named_point", 255).nullable();
    table.date("planned_departure").nullable();

    table.jsonb("checklist").notNullable().defaultTo("{}");
    table.boolean("checklist_cleared").notNullable().defaultTo(false);
    table.text("checklist_open_items").nullable();
    table.boolean("exclusivity").notNullable().defaultTo(false);
    table.text("notes").nullable();
    table.string("quote_valid_until", 40).nullable();

    table.timestamps(true, true);

    table.unique(["tenant_id", "display_id"]);
    table.unique(["tenant_id", "seq"]);
    table.index(["tenant_id", "stage"]);
    table.index(["tenant_id", "expo_lead_id"]);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("export_orders");
}
