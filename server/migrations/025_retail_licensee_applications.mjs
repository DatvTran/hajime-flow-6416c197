/**
 * Retail New Licensee Application — multi-step form submissions linked to invite + account.
 */
export async function up(knex) {
  const exists = await knex.schema.hasTable('retail_licensee_applications');
  if (exists) return;

  await knex.schema.createTable('retail_licensee_applications', (table) => {
    table.bigIncrements('id').primary();
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.bigInteger('account_id').nullable().references('id').inTable('accounts').onDelete('SET NULL');
    table.string('invite_token', 128).nullable();
    table.string('status', 32).notNullable().defaultTo('submitted');
    table.jsonb('form_data').notNullable().defaultTo('{}');
    table.timestamp('submitted_at').nullable();
    table.timestamps(true, true);

    table.index(['tenant_id', 'account_id']);
    table.index(['invite_token']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('retail_licensee_applications');
}
