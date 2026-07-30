/**
 * Store manufacturer contact email / CRM id on product briefs for inbox matching and notifications.
 */
export async function up(knex) {
  const has = await knex.schema.hasTable('new_product_requests');
  if (!has) return;

  const addString = async (name) => {
    const exists = await knex.schema.hasColumn('new_product_requests', name);
    if (!exists) {
      await knex.schema.alterTable('new_product_requests', (table) => {
        table.string(name, 255);
      });
    }
  };

  await addString('assigned_manufacturer_email');
  await addString('assigned_crm_member_id');

  console.log('[Migration 037] Added NPR manufacturer assignment columns');
}

export async function down(knex) {
  const has = await knex.schema.hasTable('new_product_requests');
  if (!has) return;

  for (const col of ['assigned_crm_member_id', 'assigned_manufacturer_email']) {
    const exists = await knex.schema.hasColumn('new_product_requests', col);
    if (exists) {
      await knex.schema.alterTable('new_product_requests', (table) => {
        table.dropColumn(col);
      });
    }
  }
}
