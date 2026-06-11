/**
 * Per-user retail portal profile + notification prefs (My account page).
 */
export async function up(knex) {
  const exists = await knex.schema.hasTable('retail_portal_settings');
  if (exists) {
    console.log('[Migration 024] retail_portal_settings already exists, skipping');
    return;
  }

  await knex.schema.createTable('retail_portal_settings', (table) => {
    table.bigIncrements('id').primary();
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table
      .bigInteger('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('linked_account_id', 64).nullable();
    table.string('first_name', 120).nullable();
    table.string('last_name', 120).nullable();
    table.string('phone', 50).nullable();
    table.jsonb('notification_prefs').notNullable().defaultTo('{}');
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.unique(['user_id']);
    table.index(['tenant_id', 'linked_account_id']);
  });

  console.log('[Migration 024] Created retail_portal_settings');
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('retail_portal_settings');
  console.log('[Migration 024] Dropped retail_portal_settings');
}
