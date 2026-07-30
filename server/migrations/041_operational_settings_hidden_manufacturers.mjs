/**
 * Persist HQ-hidden manufacturer partner ids (survives logout / new sessions).
 */
export async function up(knex) {
  const has = await knex.schema.hasTable('operational_settings');
  if (!has) return;

  const exists = await knex.schema.hasColumn('operational_settings', 'hq_hidden_manufacturer_ids');
  if (!exists) {
    await knex.schema.alterTable('operational_settings', (t) => {
      t.text('hq_hidden_manufacturer_ids').nullable();
    });
  }
}

export async function down(knex) {
  const has = await knex.schema.hasTable('operational_settings');
  if (!has) return;

  const exists = await knex.schema.hasColumn('operational_settings', 'hq_hidden_manufacturer_ids');
  if (exists) {
    await knex.schema.alterTable('operational_settings', (t) => {
      t.dropColumn('hq_hidden_manufacturer_ids');
    });
  }
}
