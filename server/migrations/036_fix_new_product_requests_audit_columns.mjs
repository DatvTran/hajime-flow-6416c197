/**
 * Migration 005 created created_by/updated_by as uuid; users.id is bigint.
 * Inserts from the API fail until these columns match the rest of the schema.
 */
export async function up(knex) {
  const has = await knex.schema.hasTable('new_product_requests');
  if (!has) return;

  const { rows } = await knex.raw(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'new_product_requests'
      AND column_name IN ('created_by', 'updated_by')
  `);

  const uuidCols = rows.filter((r) => r.data_type === 'uuid').map((r) => r.column_name);
  if (uuidCols.length === 0) return;

  for (const col of uuidCols) {
    await knex.schema.alterTable('new_product_requests', (table) => {
      table.dropColumn(col);
    });
    await knex.schema.alterTable('new_product_requests', (table) => {
      if (col === 'created_by') {
        table.bigInteger('created_by').nullable();
      } else {
        table.bigInteger('updated_by').nullable();
      }
    });
  }

  console.log('[Migration 036] Fixed new_product_requests audit columns (uuid → bigint)');
}

export async function down(knex) {
  const has = await knex.schema.hasTable('new_product_requests');
  if (!has) return;
  // Forward-only fix; no down migration.
  console.log('[Migration 036] down() is a no-op');
}
