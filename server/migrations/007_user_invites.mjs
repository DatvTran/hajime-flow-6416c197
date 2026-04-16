/**
 * Migration 007: user_invites
 * Supports the invite-token flow for joining an existing tenant.
 * Required after fixing the open-registration security vulnerability.
 */

export async function up(knex) {
  await knex.schema.createTable('user_invites', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    t.bigInteger('invited_by_user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('email', 255).notNullable();
    t.string('intended_role', 50).notNullable();
    t.string('token', 128).notNullable().unique();
    t.boolean('used').notNullable().defaultTo(false);
    t.timestamp('expires_at', { useTz: true }).notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.table('user_invites', (t) => {
    t.index(['token'], 'idx_user_invites_token');
    t.index(['tenant_id'], 'idx_user_invites_tenant_id');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('user_invites');
}
