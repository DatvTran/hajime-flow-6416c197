/**
 * Persist the portal login email on manufacturer (and other) accounts so an
 * HQ-managed manufacturer connects to the portal user that signs in with it.
 */
export async function up(knex) {
  const has = await knex.schema.hasTable('accounts');
  if (!has) return;

  const exists = await knex.schema.hasColumn('accounts', 'portal_login_email');
  if (!exists) {
    await knex.schema.alterTable('accounts', (t) => {
      t.text('portal_login_email').nullable();
    });
  }
}

export async function down(knex) {
  const has = await knex.schema.hasTable('accounts');
  if (!has) return;

  const exists = await knex.schema.hasColumn('accounts', 'portal_login_email');
  if (exists) {
    await knex.schema.alterTable('accounts', (t) => {
      t.dropColumn('portal_login_email');
    });
  }
}
