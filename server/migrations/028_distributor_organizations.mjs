import { isPlatformKnex } from '../lib/migration-context.mjs';

/** DDL + nested DB creation must commit independently (avoid rolling back with 029). */
export const config = { transaction: false };

/**
 * Registry of isolated PostgreSQL databases — one per wholesaler/distributor org.
 * Platform DB holds users + auth; each distributor DB holds accounts, CRM, orders, etc.
 */
export async function up(knex) {
  if (!isPlatformKnex(knex)) {
    console.log('[028] Skipping platform registry tables on distributor database');
    return;
  }

  const hasOrgs = await knex.schema.hasTable('distributor_organizations');
  if (!hasOrgs) {
    await knex.schema.createTable('distributor_organizations', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('slug', 64).notNullable().unique();
      table.string('name', 255).notNullable();
      table.string('database_name', 128).notNullable().unique();
      table.uuid('tenant_id').notNullable();
      table.bigInteger('owner_user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
      table.boolean('is_active').notNullable().defaultTo(true);
      table.timestamps(true, true);
      table.index(['is_active']);
    });
    console.log('[028] Created distributor_organizations');
  }

  const hasUserOrg = await knex.schema.hasColumn('users', 'distributor_org_id');
  if (!hasUserOrg) {
    await knex.schema.alterTable('users', (table) => {
      table
        .uuid('distributor_org_id')
        .nullable()
        .references('id')
        .inTable('distributor_organizations')
        .onDelete('SET NULL');
    });
    await knex.raw(`
      CREATE INDEX IF NOT EXISTS users_distributor_org_idx
      ON users (distributor_org_id)
      WHERE distributor_org_id IS NOT NULL AND deleted_at IS NULL
    `);
    console.log('[028] users.distributor_org_id');
  }

  const hasRoutes = await knex.schema.hasTable('invite_token_routes');
  if (!hasRoutes) {
    await knex.schema.createTable('invite_token_routes', (table) => {
      table.string('token', 128).primary();
      table
        .uuid('distributor_org_id')
        .notNullable()
        .references('id')
        .inTable('distributor_organizations')
        .onDelete('CASCADE');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.index('distributor_org_id');
    });
    console.log('[028] Created invite_token_routes');
  }
}

export async function down(knex) {
  if (!isPlatformKnex(knex)) return;

  await knex.schema.dropTableIfExists('invite_token_routes');
  if (await knex.schema.hasColumn('users', 'distributor_org_id')) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('distributor_org_id');
    });
  }
  await knex.schema.dropTableIfExists('distributor_organizations');
}
