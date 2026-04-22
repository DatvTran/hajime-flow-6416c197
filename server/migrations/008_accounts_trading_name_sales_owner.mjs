// No-op migration — columns already exist in production.
// This file was lost from the repo but exists in the production migration log.
export async function up(knex) {
  // Trading name and sales owner columns already added in prod.
  // Check and add only if missing (idempotent).
  const hasTradingName = await knex.schema.hasColumn('accounts', 'trading_name');
  if (!hasTradingName) {
    await knex.schema.alterTable('accounts', (table) => {
      table.string('trading_name', 255);
    });
  }
  const hasSalesOwner = await knex.schema.hasColumn('accounts', 'sales_owner');
  if (!hasSalesOwner) {
    await knex.schema.alterTable('accounts', (table) => {
      table.string('sales_owner', 255);
    });
  }
}

export async function down(knex) {
  await knex.schema.alterTable('accounts', (table) => {
    table.dropColumn('trading_name');
    table.dropColumn('sales_owner');
  });
}
