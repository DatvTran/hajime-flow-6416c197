/**
 * Adds HQ display fields on operational_settings (Settings → Company & replenishment).
 */

export async function up(knex) {
  const has = await knex.schema.hasTable('operational_settings');
  if (!has) return;

  const addText = async (col) => {
    const exists = await knex.schema.hasColumn('operational_settings', col);
    if (!exists) {
      await knex.schema.alterTable('operational_settings', (t) => {
        t.text(col);
      });
    }
  };

  await addText('company_name');
  await addText('primary_markets');
  await addText('manufacturer_name');
}

export async function down(knex) {
  const has = await knex.schema.hasTable('operational_settings');
  if (!has) return;

  const drop = async (col) => {
    const exists = await knex.schema.hasColumn('operational_settings', col);
    if (exists) {
      await knex.schema.alterTable('operational_settings', (t) => {
        t.dropColumn(col);
      });
    }
  };

  await drop('company_name');
  await drop('primary_markets');
  await drop('manufacturer_name');
}
