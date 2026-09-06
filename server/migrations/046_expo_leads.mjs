/**
 * Expo / trade-show buyer registration leads (public Connect form + HQ tracker).
 */
export async function up(knex) {
  const exists = await knex.schema.hasTable('expo_leads');
  if (exists) return;

  await knex.schema.createTable('expo_leads', (table) => {
    table.bigIncrements('id').primary();
    table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    table.string('event_code', 16).notNullable().defaultTo('HK26');
    table.integer('seq').notNullable();
    table.string('display_id', 32).notNullable();

    table.string('full_name', 255).notNullable();
    table.string('company_name', 255).notNullable();
    table.string('job_title', 255).notNullable();
    table.string('business_email', 255).notNullable();
    table.string('mobile', 80).nullable();
    table.string('country_market', 120).notNullable();
    table.string('company_website', 512).nullable();
    table.string('business_type', 64).notNullable();
    table.string('expression', 64).notNullable();
    table.jsonb('interests').notNullable().defaultTo('[]');
    table.string('bottle_format', 32).nullable();
    table.string('volume', 32).nullable();
    table.string('territory', 16).nullable();
    table.string('timing', 32).nullable();
    table.text('message').nullable();

    table.timestamp('consent_at').notNullable();
    table.timestamp('submitted_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('met_at').nullable();

    table.string('score', 1).nullable();
    table.bigInteger('staff_user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('staff_name', 255).nullable();
    table.boolean('tasting_completed').notNullable().defaultTo(false);
    table.boolean('sample_requested').notNullable().defaultTo(false);
    table.boolean('pricing_requested').notNullable().defaultTo(false);
    table.boolean('distributor_deck_sent').notNullable().defaultTo(false);
    table.text('next_action').nullable();
    table.date('follow_up_on').nullable();
    table.string('status', 32).notNullable().defaultTo('new');
    table.bigInteger('account_id').nullable().references('id').inTable('accounts').onDelete('SET NULL');

    table.timestamps(true, true);

    table.unique(['tenant_id', 'display_id']);
    table.unique(['tenant_id', 'event_code', 'seq']);
    table.index(['tenant_id', 'event_code', 'score']);
    table.index(['tenant_id', 'status']);
    table.index(['tenant_id', 'follow_up_on']);
  });

  await knex.raw(`
    ALTER TABLE expo_leads
      ADD CONSTRAINT expo_leads_business_type_check
      CHECK (business_type IN (
        'importer_distributor', 'retailer', 'hospitality',
        'duty_free', 'media', 'other'
      ))
  `);
  await knex.raw(`
    ALTER TABLE expo_leads
      ADD CONSTRAINT expo_leads_expression_check
      CHECK (expression IN ('first_press', 'yuzu_mint', 'both'))
  `);
  await knex.raw(`
    ALTER TABLE expo_leads
      ADD CONSTRAINT expo_leads_bottle_format_check
      CHECK (bottle_format IS NULL OR bottle_format IN ('750ml', '200ml', 'both'))
  `);
  await knex.raw(`
    ALTER TABLE expo_leads
      ADD CONSTRAINT expo_leads_volume_check
      CHECK (volume IS NULL OR volume IN (
        'exploring', 'under_25', '25_99', '100_249', '250_plus', 'na'
      ))
  `);
  await knex.raw(`
    ALTER TABLE expo_leads
      ADD CONSTRAINT expo_leads_territory_check
      CHECK (territory IS NULL OR territory IN ('yes', 'possibly', 'no'))
  `);
  await knex.raw(`
    ALTER TABLE expo_leads
      ADD CONSTRAINT expo_leads_timing_check
      CHECK (timing IS NULL OR timing IN (
        'immediately', '1_3_months', '3_6_months', '6_plus', 'exploring'
      ))
  `);
  await knex.raw(`
    ALTER TABLE expo_leads
      ADD CONSTRAINT expo_leads_score_check
      CHECK (score IS NULL OR score IN ('A', 'B', 'C', 'D'))
  `);
  await knex.raw(`
    ALTER TABLE expo_leads
      ADD CONSTRAINT expo_leads_status_check
      CHECK (status IN ('new', 'met', 'follow_up', 'converted', 'closed'))
  `);
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('expo_leads');
}
