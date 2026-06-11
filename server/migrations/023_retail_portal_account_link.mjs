/**
 * Link retail CRM / portal users to commercial accounts and managing distributor.
 */
export async function up(knex) {
  const hasLinked = await knex.schema.hasColumn('team_members', 'linked_account_id');
  if (!hasLinked) {
    await knex.schema.alterTable('team_members', (table) => {
      table.string('linked_account_id', 64).nullable();
      table.string('retail_trading_name', 255).nullable();
      table
        .bigInteger('managed_by_user_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL');
    });
    await knex.raw(`
      CREATE INDEX IF NOT EXISTS team_members_linked_account_idx
      ON team_members (tenant_id, linked_account_id)
      WHERE linked_account_id IS NOT NULL
    `);
    console.log('[Migration 023] Added retail portal columns on team_members');
  }
}

export async function down(knex) {
  await knex.raw(`DROP INDEX IF EXISTS team_members_linked_account_idx`);
  for (const col of ['managed_by_user_id', 'retail_trading_name', 'linked_account_id']) {
    const has = await knex.schema.hasColumn('team_members', col);
    if (has) {
      await knex.schema.alterTable('team_members', (table) => {
        table.dropColumn(col);
      });
    }
  }
  console.log('[Migration 023] Removed retail portal columns from team_members');
}
