/**
 * Store state/region and postal code on manufacturer_profiles for round-trip with the portal UI.
 */

export async function up(knex) {
  const has = await knex.schema.hasTable('manufacturer_profiles');
  if (!has) return;

  const addCol = async (name, fn) => {
    const exists = await knex.schema.hasColumn('manufacturer_profiles', name);
    if (!exists) {
      await knex.schema.alterTable('manufacturer_profiles', (t) => fn(t));
    }
  };

  await addCol('region', (t) => t.string('region', 100));
  await addCol('postal_code', (t) => t.string('postal_code', 32));
}

export async function down(knex) {
  const has = await knex.schema.hasTable('manufacturer_profiles');
  if (!has) return;

  const dropCol = async (name) => {
    const exists = await knex.schema.hasColumn('manufacturer_profiles', name);
    if (exists) {
      await knex.schema.alterTable('manufacturer_profiles', (t) => t.dropColumn(name));
    }
  };

  await dropCol('region');
  await dropCol('postal_code');
}
