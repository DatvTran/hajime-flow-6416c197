/**
 * Mobile trade enquiry (Connect layout 07): photo-picked business types, only
 * name / email / phone typed, marketing opt-in, retry-safe submission key, UTM attribution.
 */
const BUSINESS_TYPES = [
  'importer_distributor',
  'retailer',
  'hospitality',
  'duty_free',
  'media',
  'other',
  'restaurant',
  'bar',
  'hotel',
  'retail',
  'wholesale',
  'importer',
];

const LEGACY_BUSINESS_TYPES = BUSINESS_TYPES.slice(0, 6);

function businessTypeCheck(values) {
  return `CHECK (business_type IN (${values.map((v) => `'${v}'`).join(', ')}))`;
}

export async function up(knex) {
  if (!(await knex.schema.hasTable('expo_leads'))) return;

  await knex.raw(`
    ALTER TABLE expo_leads
      ALTER COLUMN company_name DROP NOT NULL,
      ALTER COLUMN job_title DROP NOT NULL,
      ALTER COLUMN country_market DROP NOT NULL
  `);

  await knex.raw('ALTER TABLE expo_leads DROP CONSTRAINT IF EXISTS expo_leads_business_type_check');
  await knex.raw(
    `ALTER TABLE expo_leads ADD CONSTRAINT expo_leads_business_type_check ${businessTypeCheck(BUSINESS_TYPES)}`,
  );

  const has = async (col) => knex.schema.hasColumn('expo_leads', col);
  const addMarketing = !(await has('marketing_opt_in'));
  const addKey = !(await has('submission_key'));
  const addUtm = !(await has('utm'));
  const addVersion = !(await has('form_version'));
  if (addMarketing || addKey || addUtm || addVersion) {
    await knex.schema.alterTable('expo_leads', (t) => {
      if (addMarketing) t.boolean('marketing_opt_in').notNullable().defaultTo(false);
      if (addKey) t.string('submission_key', 64).nullable();
      if (addUtm) t.jsonb('utm').nullable();
      if (addVersion) t.string('form_version', 32).nullable();
    });
  }
  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS expo_leads_tenant_submission_key_unique
      ON expo_leads (tenant_id, submission_key)
      WHERE submission_key IS NOT NULL
  `);
}

export async function down(knex) {
  if (!(await knex.schema.hasTable('expo_leads'))) return;
  await knex.raw('DROP INDEX IF EXISTS expo_leads_tenant_submission_key_unique');
  for (const col of ['marketing_opt_in', 'submission_key', 'utm', 'form_version']) {
    if (await knex.schema.hasColumn('expo_leads', col)) {
      await knex.schema.alterTable('expo_leads', (t) => t.dropColumn(col));
    }
  }
  await knex.raw('ALTER TABLE expo_leads DROP CONSTRAINT IF EXISTS expo_leads_business_type_check');
  await knex.raw(
    `ALTER TABLE expo_leads ADD CONSTRAINT expo_leads_business_type_check ${businessTypeCheck(LEGACY_BUSINESS_TYPES)}`,
  );
}
