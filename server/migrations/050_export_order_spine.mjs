/**
 * Export-order spine: events, immutable documents, sequences, hold/PO/shipment links.
 * Platform DB only (050 > TENANT_MIGRATION_MAX).
 */
export async function up(knex) {
  const hasOrders = await knex.schema.hasTable("export_orders");
  if (!hasOrders) return;

    const cols = await knex("export_orders").columnInfo();
    const toAdd = [];
    if (!cols.state_before_hold) toAdd.push((t) => t.string("state_before_hold", 40));
    if (!cols.hold_reason) toAdd.push((t) => t.text("hold_reason"));
    if (!cols.next_action) toAdd.push((t) => t.string("next_action", 255));
    if (!cols.production_po_id) toAdd.push((t) => t.bigInteger("production_po_id"));
    if (!cols.shipment_id) toAdd.push((t) => t.bigInteger("shipment_id"));
    if (!cols.quantity_reconciled_at) toAdd.push((t) => t.timestamp("quantity_reconciled_at"));
    if (!cols.deposit_amount_frozen) toAdd.push((t) => t.boolean("deposit_amount_frozen").notNullable().defaultTo(false));
    if (!cols.short_payment_tolerance) {
      toAdd.push((t) => t.decimal("short_payment_tolerance", 14, 2).notNullable().defaultTo(0));
    }
    if (toAdd.length) {
      await knex.schema.alterTable("export_orders", (t) => {
        for (const fn of toAdd) fn(t);
      });
    }

  if (!(await knex.schema.hasTable("document_sequences"))) {
    await knex.schema.createTable("document_sequences", (t) => {
      t.bigIncrements("id").primary();
      t.uuid("tenant_id").notNullable();
      t.string("series", 20).notNullable();
      t.integer("year").notNullable();
      t.integer("last_value").notNullable().defaultTo(0);
      t.unique(["tenant_id", "series", "year"]);
    });
  }

  if (!(await knex.schema.hasTable("export_documents"))) {
    await knex.schema.createTable("export_documents", (t) => {
      t.bigIncrements("id").primary();
      t.uuid("tenant_id").notNullable();
      t.bigInteger("export_order_id").notNullable().references("id").inTable("export_orders").onDelete("CASCADE");
      t.string("doc_type", 40).notNullable();
      t.string("doc_number", 50).notNullable();
      t.integer("revision").notNullable().defaultTo(1);
      t.jsonb("payload").notNullable().defaultTo("{}");
      t.string("file_path", 500);
      t.timestamp("issued_at");
      t.bigInteger("issued_by");
      t.bigInteger("superseded_by");
      t.timestamps(true, true);
      t.unique(["tenant_id", "doc_number", "revision"]);
      t.index(["tenant_id", "export_order_id", "doc_type"]);
    });
  }

  if (!(await knex.schema.hasTable("export_order_events"))) {
    await knex.schema.createTable("export_order_events", (t) => {
      t.bigIncrements("id").primary();
      t.uuid("tenant_id").notNullable();
      t.bigInteger("export_order_id").notNullable().references("id").inTable("export_orders").onDelete("CASCADE");
      t.string("event_type", 40).notNullable();
      t.string("from_state", 40);
      t.string("to_state", 40);
      t.string("action", 40);
      t.jsonb("detail").notNullable().defaultTo("{}");
      t.bigInteger("actor_user_id");
      t.string("actor_role", 50);
      t.timestamp("occurred_at").notNullable().defaultTo(knex.fn.now());
      t.index(["tenant_id", "export_order_id", "occurred_at"]);
      t.index(["tenant_id", "event_type"]);
    });
  }

  if (await knex.schema.hasTable("shipments")) {
    const sCols = await knex("shipments").columnInfo();
    await knex.schema.alterTable("shipments", (t) => {
      if (!sCols.export_order_id) t.bigInteger("export_order_id");
      if (!sCols.direct_export) t.boolean("direct_export").notNullable().defaultTo(false);
    });
  }

  if (await knex.schema.hasTable("purchase_orders")) {
    const pCols = await knex("purchase_orders").columnInfo();
    if (!pCols.export_order_id) {
      await knex.schema.alterTable("purchase_orders", (t) => {
        t.bigInteger("export_order_id");
        t.boolean("direct_export").notNullable().defaultTo(false);
      });
    }
  }

  console.log("[Migration 050] Export-order spine tables");
}

export async function down(knex) {
  if (await knex.schema.hasTable("purchase_orders")) {
    const pCols = await knex("purchase_orders").columnInfo();
    await knex.schema.alterTable("purchase_orders", (t) => {
      if (pCols.export_order_id) t.dropColumn("export_order_id");
      if (pCols.direct_export) t.dropColumn("direct_export");
    });
  }
  if (await knex.schema.hasTable("shipments")) {
    const sCols = await knex("shipments").columnInfo();
    await knex.schema.alterTable("shipments", (t) => {
      if (sCols.export_order_id) t.dropColumn("export_order_id");
      if (sCols.direct_export) t.dropColumn("direct_export");
    });
  }
  await knex.schema.dropTableIfExists("export_order_events");
  await knex.schema.dropTableIfExists("export_documents");
  await knex.schema.dropTableIfExists("document_sequences");
}
