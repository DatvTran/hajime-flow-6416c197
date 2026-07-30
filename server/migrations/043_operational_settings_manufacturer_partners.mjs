/**
 * Persist HQ manufacturer partner configs (survives logout / new sessions / deploys).
 */
export async function up(knex) {
  const has = await knex.schema.hasTable('operational_settings');
  if (!has) return;

  const exists = await knex.schema.hasColumn('operational_settings', 'hq_manufacturer_partner_configs');
  if (!exists) {
    await knex.schema.alterTable('operational_settings', (t) => {
      t.text('hq_manufacturer_partner_configs').nullable();
    });
  }
}

export async function down(knex) {
  const has = await knex.schema.hasTable('operational_settings');
  if (!has) return;

  const exists = await knex.schema.hasColumn('operational_settings', 'hq_manufacturer_partner_configs');
  if (exists) {
    await knex.schema.alterTable('operational_settings', (t) => {
      t.dropColumn('hq_manufacturer_partner_configs');
    });
  }
}
