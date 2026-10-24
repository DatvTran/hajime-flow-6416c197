/**
 * Link an expo lead to the CRM account it was converted into.
 */
export async function up(knex) {
  if (!(await knex.schema.hasTable('expo_leads'))) return;
  if (!(await knex.schema.hasColumn('expo_leads', 'account_id'))) {
    await knex.schema.alterTable('expo_leads', (t) => {
      t.bigInteger('account_id').nullable().references('id').inTable('accounts').onDelete('SET NULL');
    });
  }
  await knex.raw(
    'CREATE INDEX IF NOT EXISTS expo_leads_tenant_account_idx ON expo_leads (tenant_id, account_id)',
  );
}

export async function down(knex) {
  if (!(await knex.schema.hasTable('expo_leads'))) return;
  await knex.raw('DROP INDEX IF EXISTS expo_leads_tenant_account_idx');
  if (await knex.schema.hasColumn('expo_leads', 'account_id')) {
    await knex.schema.alterTable('expo_leads', (t) => t.dropColumn('account_id'));
  }
}
