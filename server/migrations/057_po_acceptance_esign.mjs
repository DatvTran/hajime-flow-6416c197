/**
 * Purchase order acceptance (HJ-POA) with secure-link buyer countersigning:
 * order particulars on export_orders, per-revision signatures and link on export_documents.
 */
const ORDER_COLUMNS = [
  ["buyer_legal_name", (t) => t.string("buyer_legal_name", 255)],
  ["buyer_registration_no", (t) => t.string("buyer_registration_no", 120)],
  ["buyer_registered_address", (t) => t.text("buyer_registered_address")],
  ["buyer_notice_email", (t) => t.string("buyer_notice_email", 255)],
  ["consignee", (t) => t.text("consignee")],
  ["incoterm_rule", (t) => t.string("incoterm_rule", 8)],
  ["delivery_window", (t) => t.string("delivery_window", 255)],
  ["spec_label_ref", (t) => t.string("spec_label_ref", 255)],
  ["special_conditions", (t) => t.text("special_conditions")],
  ["other_charges_usd", (t) => t.decimal("other_charges_usd", 12, 2).notNullable().defaultTo(0)],
  ["other_charges_note", (t) => t.string("other_charges_note", 255)],
];

const DOCUMENT_COLUMNS = [
  ["sign_token_hash", (t) => t.string("sign_token_hash", 64)],
  ["sign_token_expires_at", (t) => t.timestamp("sign_token_expires_at")],
  ["seller_signed_name", (t) => t.string("seller_signed_name", 255)],
  ["seller_signed_title", (t) => t.string("seller_signed_title", 255)],
  ["seller_signed_at", (t) => t.timestamp("seller_signed_at")],
  ["seller_notice_email", (t) => t.string("seller_notice_email", 255)],
  ["buyer_signed_name", (t) => t.string("buyer_signed_name", 255)],
  ["buyer_signed_title", (t) => t.string("buyer_signed_title", 255)],
  ["buyer_signed_at", (t) => t.timestamp("buyer_signed_at")],
  ["buyer_signed_ip", (t) => t.string("buyer_signed_ip", 64)],
  ["buyer_signed_user_agent", (t) => t.string("buyer_signed_user_agent", 500)],
  ["buyer_details", (t) => t.jsonb("buyer_details")],
  ["terms_version", (t) => t.string("terms_version", 40)],
  ["content_hash", (t) => t.string("content_hash", 64)],
];

async function addMissing(knex, table, columns) {
  if (!(await knex.schema.hasTable(table))) return;
  const info = await knex(table).columnInfo();
  const missing = columns.filter(([name]) => !info[name]);
  if (!missing.length) return;
  await knex.schema.alterTable(table, (t) => {
    for (const [, add] of missing) add(t);
  });
}

export async function up(knex) {
  await addMissing(knex, "export_orders", ORDER_COLUMNS);
  await addMissing(knex, "export_documents", DOCUMENT_COLUMNS);
  if (await knex.schema.hasTable("export_documents")) {
    await knex.raw(`
      CREATE UNIQUE INDEX IF NOT EXISTS export_documents_sign_token_hash_unique
        ON export_documents (sign_token_hash)
        WHERE sign_token_hash IS NOT NULL
    `);
  }
}

export async function down(knex) {
  await knex.raw("DROP INDEX IF EXISTS export_documents_sign_token_hash_unique");
  for (const [table, columns] of [
    ["export_documents", DOCUMENT_COLUMNS],
    ["export_orders", ORDER_COLUMNS],
  ]) {
    if (!(await knex.schema.hasTable(table))) continue;
    const info = await knex(table).columnInfo();
    const present = columns.filter(([name]) => info[name]).map(([name]) => name);
    if (present.length) {
      await knex.schema.alterTable(table, (t) => {
        for (const name of present) t.dropColumn(name);
      });
    }
  }
}
