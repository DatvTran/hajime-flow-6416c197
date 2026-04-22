/**
 * Migration 008: Backfill missing accounts columns used by API v1.
 * Some older databases were created before these columns existed.
 */
export async function up(knex) {
  const hasAccounts = await knex.schema.hasTable("accounts");
  if (!hasAccounts) return;

  const hasTradingName = await knex.schema.hasColumn("accounts", "trading_name");
  const hasSalesOwner = await knex.schema.hasColumn("accounts", "sales_owner");

  if (!hasTradingName || !hasSalesOwner) {
    await knex.schema.alterTable("accounts", (table) => {
      if (!hasTradingName) {
        table.string("trading_name", 255);
      }
      if (!hasSalesOwner) {
        table.string("sales_owner", 255);
      }
    });
  }
}

export async function down(knex) {
  const hasAccounts = await knex.schema.hasTable("accounts");
  if (!hasAccounts) return;

  const hasTradingName = await knex.schema.hasColumn("accounts", "trading_name");
  const hasSalesOwner = await knex.schema.hasColumn("accounts", "sales_owner");

  await knex.schema.alterTable("accounts", (table) => {
    if (hasTradingName) {
      table.dropColumn("trading_name");
    }
    if (hasSalesOwner) {
      table.dropColumn("sales_owner");
    }
  });
}
