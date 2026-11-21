/**
 * Distinguish brand-operated depots from wholesaler receiving warehouses.
 * Backfill: any warehouse already linked to an account or CRM distributor → distributor.
 */

export async function up(knex) {
  const has = await knex.schema.hasColumn("warehouses", "kind");
  if (!has) {
    await knex.schema.alterTable("warehouses", (table) => {
      table.string("kind", 32).notNullable().defaultTo("brand");
    });
  }

  await knex.raw(`
    UPDATE warehouses
    SET kind = 'distributor'
    WHERE kind IS DISTINCT FROM 'distributor'
      AND (
        (linked_team_member_id IS NOT NULL AND trim(linked_team_member_id) <> '')
        OR (linked_account_id IS NOT NULL AND trim(linked_account_id) <> '')
      )
  `);

  await knex.raw(`
    ALTER TABLE warehouses
    DROP CONSTRAINT IF EXISTS warehouses_kind_check
  `);
  await knex.raw(`
    ALTER TABLE warehouses
    ADD CONSTRAINT warehouses_kind_check
    CHECK (kind IN ('brand', 'distributor'))
  `);

  console.log("[Migration 061] Added warehouses.kind (brand | distributor)");
}

export async function down(knex) {
  await knex.raw(`
    ALTER TABLE warehouses
    DROP CONSTRAINT IF EXISTS warehouses_kind_check
  `);
  const has = await knex.schema.hasColumn("warehouses", "kind");
  if (has) {
    await knex.schema.alterTable("warehouses", (table) => {
      table.dropColumn("kind");
    });
  }
  console.log("[Migration 061] Removed warehouses.kind");
}
