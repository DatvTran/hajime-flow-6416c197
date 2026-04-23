/**
 * Migration 009: Phase 2 — Team Members, Support Tickets, Manufacturer Profiles,
 * Tasks, Opportunities, and Operational Settings
 *
 * Tables:
 *   - team_members          (Settings page)
 *   - operational_settings  (Settings page — singleton config)
 *   - support_tickets       (RetailSupport page)
 *   - support_ticket_replies(RetailSupport page)
 *   - manufacturer_profiles (ManufacturerProfile page)
 *   - tasks                 (SalesSection page)
 *   - opportunities         (SalesSection page)
 */

export async function up(knex) {

  // ── team_members ──────────────────────────────────────────────────────────
  const hasTeamMembers = await knex.schema.hasTable('team_members');
  if (!hasTeamMembers) {
    await knex.schema.createTable('team_members', (table) => {
      table.string('id', 32).primary();
      table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
      table.string('name', 255).notNullable();
      table.string('email', 255).notNullable();
      table.string('role', 50).notNullable();           // brand_operator, sales_rep, etc.
      table.string('phone', 50);
      table.string('department', 100);
      table.boolean('is_active').defaultTo(true);
      table.bigInteger('created_by').references('id').inTable('users');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.unique(['tenant_id', 'email']);
      table.index(['tenant_id', 'role']);
      table.index(['tenant_id', 'is_active']);
    });
    console.log('[Migration 009] Created team_members');
  }

  // ── operational_settings (singleton per tenant) ───────────────────────────
  const hasOpSettings = await knex.schema.hasTable('operational_settings');
  if (!hasOpSettings) {
    await knex.schema.createTable('operational_settings', (table) => {
      table.uuid('tenant_id').primary().references('id').inTable('tenants').onDelete('CASCADE');
      table.integer('lead_time_days').defaultTo(14);
      table.integer('safety_stock_days').defaultTo(7);
      table.decimal('shelf_threshold', 5, 2).defaultTo(10.00);   // %
      table.decimal('reorder_point_bottles', 10, 0).defaultTo(500);
      table.string('default_payment_terms', 50).defaultTo('Net 30');
      table.string('default_currency', 3).defaultTo('USD');
      table.boolean('auto_create_shipment').defaultTo(true);       // auto-ship on status=shipped
      table.boolean('auto_alert_low_stock').defaultTo(true);
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.index('tenant_id');
    });
    console.log('[Migration 009] Created operational_settings');
  }

  // ── support_tickets ─────────────────────────────────────────────────────
  const hasSupportTickets = await knex.schema.hasTable('support_tickets');
  if (!hasSupportTickets) {
    await knex.schema.createTable('support_tickets', (table) => {
      table.string('id', 32).primary();
      table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
      table.string('title', 255).notNullable();
      table.text('description').notNullable();
      table.string('status', 30).notNullable().defaultTo('open');   // open, in_progress, resolved, closed
      table.string('priority', 20).notNullable().defaultTo('medium'); // low, medium, high, urgent
      table.string('category', 50);                                   // product, order, payment, technical, other
      table.bigInteger('account_id').references('id').inTable('accounts').onDelete('SET NULL');
      table.bigInteger('created_by').references('id').inTable('users');
      table.bigInteger('assigned_to').references('id').inTable('users');
      table.timestamp('resolved_at');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.index(['tenant_id', 'status']);
      table.index(['tenant_id', 'priority']);
      table.index(['tenant_id', 'account_id']);
      table.index(['tenant_id', 'assigned_to']);
      table.index('created_at');
    });
    console.log('[Migration 009] Created support_tickets');
  }

  // ── support_ticket_replies ────────────────────────────────────────────────
  const hasTicketReplies = await knex.schema.hasTable('support_ticket_replies');
  if (!hasTicketReplies) {
    await knex.schema.createTable('support_ticket_replies', (table) => {
      table.bigIncrements('id').primary();
      table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
      table.string('ticket_id', 32).notNullable().references('id').inTable('support_tickets').onDelete('CASCADE');
      table.text('message').notNullable();
      table.bigInteger('created_by').references('id').inTable('users');
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.index(['tenant_id', 'ticket_id']);
      table.index('created_at');
    });
    console.log('[Migration 009] Created support_ticket_replies');
  }

  // ── manufacturer_profiles ───────────────────────────────────────────────
  const hasMfgProfiles = await knex.schema.hasTable('manufacturer_profiles');
  if (!hasMfgProfiles) {
    await knex.schema.createTable('manufacturer_profiles', (table) => {
      table.string('id', 32).primary();
      table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
      table.string('manufacturer_id', 32).notNullable().unique();   // links to users.role = 'manufacturer'
      // ── Company info ──
      table.string('company_name', 255);
      table.string('contact_name', 255);
      table.string('email', 255);
      table.string('phone', 50);
      table.text('address');
      table.string('city', 100);
      table.string('country', 100);
      table.string('website', 255);
      table.string('tax_id', 50);
      // ── Banking ──
      table.string('bank_name', 255);
      table.string('bank_account', 100);
      table.string('iban', 50);
      table.string('swift', 50);
      table.string('currency', 3).defaultTo('USD');
      // ── Capabilities ──
      table.integer('capacity_bottles_per_month').defaultTo(0);
      table.integer('min_order_bottles').defaultTo(0);
      table.integer('lead_time_days').defaultTo(30);
      table.string('payment_terms', 50).defaultTo('Net 30');
      table.text('certifications');   // free-text: ISO, organic, kosher, etc.
      table.text('notes');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.unique(['tenant_id', 'manufacturer_id']);
      table.index(['tenant_id', 'company_name']);
    });
    console.log('[Migration 009] Created manufacturer_profiles');
  }

  // ── tasks ───────────────────────────────────────────────────────────────
  const hasTasks = await knex.schema.hasTable('tasks');
  if (!hasTasks) {
    await knex.schema.createTable('tasks', (table) => {
      table.string('id', 32).primary();
      table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
      table.string('title', 255).notNullable();
      table.text('description');
      table.string('status', 30).notNullable().defaultTo('todo');     // todo, in_progress, done, cancelled
      table.string('priority', 20).notNullable().defaultTo('medium'); // low, medium, high
      table.bigInteger('assigned_to').references('id').inTable('users');
      table.bigInteger('account_id').references('id').inTable('accounts').onDelete('SET NULL');
      table.date('due_date');
      table.bigInteger('created_by').references('id').inTable('users');
      table.timestamp('completed_at');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.index(['tenant_id', 'status']);
      table.index(['tenant_id', 'assigned_to']);
      table.index(['tenant_id', 'due_date']);
      table.index(['tenant_id', 'account_id']);
    });
    console.log('[Migration 009] Created tasks');
  }

  // ── opportunities ───────────────────────────────────────────────────────
  const hasOpportunities = await knex.schema.hasTable('opportunities');
  if (!hasOpportunities) {
    await knex.schema.createTable('opportunities', (table) => {
      table.string('id', 32).primary();
      table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
      table.string('title', 255).notNullable();
      table.text('description');
      table.string('status', 30).notNullable().defaultTo('prospecting');
        // prospecting, qualified, proposal, negotiation, closed_won, closed_lost
      table.decimal('value', 14, 2).defaultTo(0);
      table.string('currency', 3).defaultTo('USD');
      table.bigInteger('account_id').references('id').inTable('accounts').onDelete('SET NULL');
      table.date('expected_close_date');
      table.bigInteger('assigned_to').references('id').inTable('users');
      table.bigInteger('created_by').references('id').inTable('users');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.index(['tenant_id', 'status']);
      table.index(['tenant_id', 'assigned_to']);
      table.index(['tenant_id', 'expected_close_date']);
      table.index(['tenant_id', 'account_id']);
    });
    console.log('[Migration 009] Created opportunities');
  }

  console.log('[Migration 009] All Phase 2 tables created');
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('opportunities');
  await knex.schema.dropTableIfExists('tasks');
  await knex.schema.dropTableIfExists('manufacturer_profiles');
  await knex.schema.dropTableIfExists('support_ticket_replies');
  await knex.schema.dropTableIfExists('support_tickets');
  await knex.schema.dropTableIfExists('operational_settings');
  await knex.schema.dropTableIfExists('team_members');
  console.log('[Migration 009] Dropped all Phase 2 tables');
}
