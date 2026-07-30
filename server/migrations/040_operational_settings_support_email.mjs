/**
 * Adds an HQ-controlled support contact email on operational_settings.
 * One source of truth surfaced on the Manufacturer and Distributor support pages.
 */

export async function up(knex) {
  const has = await knex.schema.hasTable('operational_settings');
  if (!has) return;

  const exists = await knex.schema.hasColumn('operational_settings', 'support_email');
  if (!exists) {
    await knex.schema.alterTable('operational_settings', (t) => {
      t.text('support_email');
    });
  }
}

export async function down(knex) {
  const has = await knex.schema.hasTable('operational_settings');
  if (!has) return;

  const exists = await knex.schema.hasColumn('operational_settings', 'support_email');
  if (exists) {
    await knex.schema.alterTable('operational_settings', (t) => {
      t.dropColumn('support_email');
    });
  }
}
