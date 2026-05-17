/**
 * Multi-distributor scope: sales reps and retail accounts belong to a distributor (users.id).
 */
export async function up(knex) {
  const hasUsersCol = await knex.schema.hasColumn('users', 'managed_by_distributor_user_id');
  if (!hasUsersCol) {
    await knex.schema.alterTable('users', (table) => {
      table
        .bigInteger('managed_by_distributor_user_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL');
    });
    await knex.raw(`
      CREATE INDEX IF NOT EXISTS users_managed_by_distributor_idx
      ON users (tenant_id, managed_by_distributor_user_id)
      WHERE managed_by_distributor_user_id IS NOT NULL AND deleted_at IS NULL
    `);
    console.log('[027] users.managed_by_distributor_user_id');
  }

  const hasAccountsCol = await knex.schema.hasColumn('accounts', 'managed_by_distributor_user_id');
  if (!hasAccountsCol) {
    await knex.schema.alterTable('accounts', (table) => {
      table
        .bigInteger('managed_by_distributor_user_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL');
    });
    await knex.raw(`
      CREATE INDEX IF NOT EXISTS accounts_managed_by_distributor_idx
      ON accounts (tenant_id, managed_by_distributor_user_id)
      WHERE managed_by_distributor_user_id IS NOT NULL AND deleted_at IS NULL
    `);
    console.log('[027] accounts.managed_by_distributor_user_id');
  }

  const tenants = await knex('tenants').select('id');
  for (const { id: tenantId } of tenants) {
    const distributors = await knex('users')
      .where({ tenant_id: tenantId, role: 'distributor', is_active: true })
      .whereNull('deleted_at');
    if (distributors.length !== 1) continue;
    const distId = distributors[0].id;

    await knex('users')
      .where({ tenant_id: tenantId, role: 'sales_rep' })
      .whereNull('managed_by_distributor_user_id')
      .whereNull('deleted_at')
      .update({ managed_by_distributor_user_id: distId });

    await knex('team_members')
      .where({ tenant_id: tenantId, role: 'sales_rep' })
      .whereNull('managed_by_user_id')
      .update({ managed_by_user_id: distId });

    const retailRows = await knex('team_members')
      .where({ tenant_id: tenantId, role: 'retail' })
      .whereNull('managed_by_user_id')
      .select('id', 'linked_account_id', 'crm_requested_by_user_id');

    for (const row of retailRows) {
      await knex('team_members')
        .where({ id: row.id })
        .update({ managed_by_user_id: distId });
      if (row.linked_account_id) {
        await knex('accounts')
          .where({ id: row.linked_account_id, tenant_id: tenantId })
          .whereNull('managed_by_distributor_user_id')
          .update({ managed_by_distributor_user_id: distId });
      }
    }

    console.log(`[027] Backfilled distributor ${distId} scope for tenant ${tenantId}`);
  }
}

export async function down(knex) {
  await knex.raw('DROP INDEX IF EXISTS accounts_managed_by_distributor_idx');
  await knex.raw('DROP INDEX IF EXISTS users_managed_by_distributor_idx');
  if (await knex.schema.hasColumn('accounts', 'managed_by_distributor_user_id')) {
    await knex.schema.alterTable('accounts', (table) => {
      table.dropColumn('managed_by_distributor_user_id');
    });
  }
  if (await knex.schema.hasColumn('users', 'managed_by_distributor_user_id')) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('managed_by_distributor_user_id');
    });
  }
}
