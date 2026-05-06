/**
 * Pending retail CRM contacts submitted by sales reps — approved by distributor / HQ.
 */
export async function up(knex) {
  const has = await knex.schema.hasColumn('team_members', 'pending_distributor_approval');
  if (!has) {
    await knex.schema.alterTable('team_members', (table) => {
      table.boolean('pending_distributor_approval').notNullable().defaultTo(false);
      table
        .bigInteger('crm_requested_by_user_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL');
    });
    await knex.raw(`
      CREATE INDEX IF NOT EXISTS team_members_pending_retail_idx
      ON team_members (tenant_id, pending_distributor_approval)
      WHERE pending_distributor_approval = true
    `);
    console.log('[Migration 017] Added team_members pending retail approval columns');
  }
}

export async function down(knex) {
  await knex.raw(`DROP INDEX IF EXISTS team_members_pending_retail_idx`);
  const has = await knex.schema.hasColumn('team_members', 'pending_distributor_approval');
  if (has) {
    await knex.schema.alterTable('team_members', (table) => {
      table.dropColumn('crm_requested_by_user_id');
      table.dropColumn('pending_distributor_approval');
    });
    console.log('[Migration 017] Removed pending retail approval columns');
  }
}
