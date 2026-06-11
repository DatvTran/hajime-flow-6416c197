/**
 * Tenant-scoped JSON document for Supply Chain Incentive Manager
 * (partners, SPIF log, pricing ladder, SPIF rates, volume bonus amounts).
 */

export async function up(knex) {
  const exists = await knex.schema.hasTable("supply_chain_incentive_state");
  if (exists) {
    console.log("[Migration 021] supply_chain_incentive_state already exists, skipping");
    return;
  }

  await knex.schema.createTable("supply_chain_incentive_state", (table) => {
    table.uuid("tenant_id").primary().references("id").inTable("tenants").onDelete("CASCADE");
    table.jsonb("state").notNullable().defaultTo("{}");
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.bigInteger("updated_by").nullable().references("id").inTable("users").onDelete("SET NULL");
  });

  console.log("[Migration 021] Created supply_chain_incentive_state");
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("supply_chain_incentive_state");
  console.log("[Migration 021] Dropped supply_chain_incentive_state");
}
