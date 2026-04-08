/**
 * Initial migration: Core schema for Hajime B2B Supply Chain OS
 * Creates: tenants, users, password_resets, refresh_tokens, auth_events
 */

export async function up(knex) {
  // Enable UUID extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Create updated_at trigger function
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql'
  `);

  // Tenants table
  await knex.schema.createTable('tenants', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 255).notNullable();
    table.string('subdomain', 100).unique();
    table.jsonb('settings').defaultTo('{}');
    table.timestamps(true, true);
  });

  // Users table
  await knex.schema.createTable('users', (table) => {
    table.bigIncrements('id').primary();
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants');
    table.string('email', 255).notNullable();
    table.string('password_hash', 255);
    table.string('auth_provider', 50).defaultTo('local');
    table.string('external_id', 255);
    table.string('role', 50).notNullable();
    table.boolean('is_active').defaultTo(true);
    table.boolean('email_verified').defaultTo(false);
    table.string('display_name', 255);
    table.timestamp('last_login_at');
    table.integer('failed_login_attempts').defaultTo(0);
    table.timestamp('locked_until');
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();

    // Unique constraint on email per tenant (soft delete aware)
    table.unique(['tenant_id', 'email']);
  });

  // Add partial index for active users
  await knex.raw(`
    CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL
  `);
  await knex.raw(`
    CREATE INDEX idx_users_tenant ON users(tenant_id) WHERE deleted_at IS NULL
  `);

  // Password resets table
  await knex.schema.createTable('password_resets', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').notNullable().references('id').inTable('users');
    table.string('token_hash', 64).notNullable();
    table.boolean('used').defaultTo(false);
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('token_hash');
  });

  // Refresh tokens table
  await knex.schema.createTable('refresh_tokens', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').notNullable().references('id').inTable('users');
    table.string('token_hash', 64).notNullable();
    table.jsonb('device_info').defaultTo('{}');
    table.timestamp('expires_at').notNullable();
    table.boolean('revoked').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('token_hash');
    table.index(['user_id', 'revoked']);
  });

  // Auth events audit log
  await knex.schema.createTable('auth_events', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').references('id').inTable('users');
    table.string('event_type', 50).notNullable();
    table.specificType('ip_address', 'inet');
    table.text('user_agent');
    table.jsonb('metadata').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['user_id', 'created_at']);
    table.index('event_type');
  });

  // Add updated_at triggers
  await knex.raw(`
    CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
  `);

  await knex.raw(`
    CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
  `);
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('auth_events');
  await knex.schema.dropTableIfExists('refresh_tokens');
  await knex.schema.dropTableIfExists('password_resets');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('tenants');

  await knex.raw('DROP FUNCTION IF EXISTS update_updated_at_column()');
}
