/**
 * HQ Settings UI preferences (approval / notification toggles) on operational_settings.
 */
export async function up(knex) {
  const has = await knex.schema.hasTable('operational_settings');
  if (!has) return;

  const exists = await knex.schema.hasColumn('operational_settings', 'hq_ui_preferences');
  if (!exists) {
    await knex.schema.alterTable('operational_settings', (t) => {
      t.text('hq_ui_preferences');
    });
  }
}

export async function down(knex) {
  const has = await knex.schema.hasTable('operational_settings');
  if (!has) return;

  const exists = await knex.schema.hasColumn('operational_settings', 'hq_ui_preferences');
  if (exists) {
    await knex.schema.alterTable('operational_settings', (t) => {
      t.dropColumn('hq_ui_preferences');
    });
  }
}
