/**
 * Seed Kosapan Distillery portal login + manufacturer_profiles row so HQ
 * production requests with manufacturer_id=kosapan are visible when they log in.
 * Also backfill purchase_orders.manufacturer_id when supplier_name matches a known partner.
 */
import { authService } from '../services/auth.mjs';
import { canonicalizeManufacturerAssignmentId } from '../lib/npr-manufacturer-scope.mjs';

const DEMO_PASSWORD = 'admin123!';

const KOSAPAN = {
  email: 'portal@kosapan.example',
  display_name: 'Kosapan Distillery',
  team_member_id: 'tm-kosapan-portal',
  manufacturer_id: 'kosapan',
  company_name: 'Kosapan Distillery',
  legal_name: 'Kosapan Distillery Co., Ltd.',
};

export async function up(knex) {
  const tenant =
    (await knex('tenants').where({ subdomain: 'hajime' }).first()) ??
    (await knex('tenants').orderBy('created_at', 'asc').first());

  if (!tenant) {
    console.log('[045] No tenant found — skipping Kosapan distillery seed');
    return;
  }

  const passwordHash = await authService.hashPassword(DEMO_PASSWORD);
  const email = KOSAPAN.email.toLowerCase();

  const existingUser = await knex('users')
    .where({ tenant_id: tenant.id, email })
    .whereNull('deleted_at')
    .first();

  const userPatch = {
    role: 'manufacturer',
    display_name: KOSAPAN.display_name,
    password_hash: passwordHash,
    is_active: true,
    email_verified: true,
    updated_at: knex.fn.now(),
  };

  if (existingUser) {
    await knex('users').where({ id: existingUser.id }).update(userPatch);
    console.log(`[045] Updated Kosapan portal user: ${email}`);
  } else {
    await knex('users').insert({
      tenant_id: tenant.id,
      email,
      ...userPatch,
    });
    console.log(`[045] Created Kosapan portal user: ${email}`);
  }

  const tmExisting = await knex('team_members').where({ tenant_id: tenant.id, email }).first();
  if (tmExisting) {
    await knex('team_members').where({ id: tmExisting.id }).update({
      role: 'manufacturer',
      name: KOSAPAN.display_name,
      is_active: true,
      updated_at: knex.fn.now(),
    });
  } else {
    await knex('team_members').insert({
      id: KOSAPAN.team_member_id,
      tenant_id: tenant.id,
      name: KOSAPAN.display_name,
      email,
      role: 'manufacturer',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    });
  }

  if (await knex.schema.hasTable('manufacturer_profiles')) {
    const profileExisting = await knex('manufacturer_profiles')
      .where({ tenant_id: tenant.id })
      .where(function matchKosapan() {
        this.where({ manufacturer_id: KOSAPAN.manufacturer_id }).orWhere({ email });
      })
      .first();

    const profileRow = {
      manufacturer_id: KOSAPAN.manufacturer_id,
      company_name: KOSAPAN.company_name,
      contact_name: KOSAPAN.display_name,
      email,
      updated_at: knex.fn.now(),
    };

    if (profileExisting) {
      await knex('manufacturer_profiles').where({ id: profileExisting.id }).update(profileRow);
      console.log('[045] Updated Kosapan manufacturer_profiles row');
    } else {
      await knex('manufacturer_profiles').insert({
        id: 'mfp-kosapan',
        tenant_id: tenant.id,
        ...profileRow,
        created_at: knex.fn.now(),
      });
      console.log('[045] Created Kosapan manufacturer_profiles row');
    }
  }

  // Backfill production POs so existing "Kosapan Distillery" rows get manufacturer_id=kosapan
  if (await knex.schema.hasTable('purchase_orders')) {
    const rows = await knex('purchase_orders')
      .where({ tenant_id: tenant.id })
      .where(function needsBackfill() {
        this.whereNull('manufacturer_id')
          .orWhere('manufacturer_id', '')
          .orWhereNotIn('manufacturer_id', ['kosapan', 'kuramoto', 'echigo']);
      })
      .select('id', 'manufacturer_id', 'supplier_name');

    let fixed = 0;
    for (const row of rows) {
      const canonical = canonicalizeManufacturerAssignmentId(row.manufacturer_id, row.supplier_name);
      if (!canonical || canonical === row.manufacturer_id) continue;
      await knex('purchase_orders').where({ id: row.id }).update({
        manufacturer_id: canonical,
        updated_at: knex.fn.now(),
      });
      fixed += 1;
    }
    if (fixed) console.log(`[045] Backfilled manufacturer_id on ${fixed} purchase_orders`);
  }
}

export async function down(knex) {
  const tenant =
    (await knex('tenants').where({ subdomain: 'hajime' }).first()) ??
    (await knex('tenants').orderBy('created_at', 'asc').first());
  if (!tenant) return;

  await knex('users')
    .where({ tenant_id: tenant.id, email: KOSAPAN.email })
    .whereNull('deleted_at')
    .update({ deleted_at: knex.fn.now(), is_active: false });
}
