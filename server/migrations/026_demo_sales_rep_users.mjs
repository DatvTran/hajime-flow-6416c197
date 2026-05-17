/**
 * Idempotent demo sales rep logins (Marcus Chen, etc.).
 * Runs on deploy via `knex migrate:latest` — does not require a destructive re-seed.
 */
import { authService } from '../services/auth.mjs';

const DEMO_PASSWORD = 'admin123!';

const DEMO_SALES_REPS = [
  { email: 'marcus.chen@hajime.jp', display_name: 'Marcus Chen' },
  { email: 'sarah.kim@hajime.jp', display_name: 'Sarah Kim' },
  { email: 'luca.moretti@hajime.jp', display_name: 'Luca Moretti' },
  { email: 'jordan.lee@hajime.jp', display_name: 'Jordan Lee' },
];

/** Seed account numbers → default rep for demo visibility */
const ACCOUNT_SALES_OWNER = [
  { account_number: 'ACC-001', sales_owner: 'Marcus Chen' },
  { account_number: 'ACC-002', sales_owner: 'Marcus Chen' },
  { account_number: 'ACC-003', sales_owner: 'Jordan Lee' },
];

export async function up(knex) {
  const tenant =
    (await knex('tenants').where({ subdomain: 'hajime' }).first()) ??
    (await knex('tenants').orderBy('created_at', 'asc').first());

  if (!tenant) {
    console.log('[026] No tenant found — skipping demo sales rep users');
    return;
  }

  const passwordHash = await authService.hashPassword(DEMO_PASSWORD);

  let distributorUserId = null;
  const distEmail = 'fulfillment@metrologistics.example';
  let distUser = await knex('users')
    .where({ tenant_id: tenant.id, email: distEmail })
    .whereNull('deleted_at')
    .first();
  if (!distUser) {
    [distUser] = await knex('users')
      .insert({
        tenant_id: tenant.id,
        email: distEmail,
        password_hash: passwordHash,
        role: 'distributor',
        display_name: 'Metro Logistics Ops',
        is_active: true,
        email_verified: true,
      })
      .returning('*');
    console.log(`[026] Created demo distributor user: ${distEmail}`);
  }
  distributorUserId = distUser?.id ?? null;

  for (const rep of DEMO_SALES_REPS) {
    const email = rep.email.toLowerCase();
    const existing = await knex('users')
      .where({ tenant_id: tenant.id, email })
      .whereNull('deleted_at')
      .first();

    const repPatch = {
      role: 'sales_rep',
      display_name: rep.display_name,
      password_hash: passwordHash,
      is_active: true,
      email_verified: true,
      ...(distributorUserId ? { managed_by_distributor_user_id: distributorUserId } : {}),
      updated_at: knex.fn.now(),
    };

    if (existing) {
      await knex('users').where({ id: existing.id }).update(repPatch);
      console.log(`[026] Updated sales rep user: ${email}`);
    } else {
      await knex('users').insert({
        tenant_id: tenant.id,
        email,
        ...repPatch,
      });
      console.log(`[026] Created sales rep user: ${email}`);
    }

    const tmExisting = await knex('team_members')
      .where({ tenant_id: tenant.id, email })
      .first();
    if (tmExisting) {
      await knex('team_members')
        .where({ id: tmExisting.id })
        .update({
          role: 'sales_rep',
          name: rep.display_name,
          managed_by_user_id: distributorUserId,
          updated_at: knex.fn.now(),
        });
    } else {
      await knex('team_members').insert({
        id: `tm-seed-rep-${email.split('@')[0]}`,
        tenant_id: tenant.id,
        name: rep.display_name,
        email,
        role: 'sales_rep',
        is_active: true,
        managed_by_user_id: distributorUserId,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      });
    }
  }

  for (const row of ACCOUNT_SALES_OWNER) {
    const updated = await knex('accounts')
      .where({ tenant_id: tenant.id, account_number: row.account_number })
      .whereNull('deleted_at')
      .where(function emptyOrMissingOwner() {
        this.whereNull('sales_owner').orWhere('sales_owner', '').orWhere('sales_owner', 'Unassigned');
      })
      .update({ sales_owner: row.sales_owner, updated_at: knex.fn.now() });
    if (updated > 0) {
      console.log(`[026] Set sales_owner on ${row.account_number} → ${row.sales_owner}`);
    }
  }
}

export async function down(knex) {
  const tenant =
    (await knex('tenants').where({ subdomain: 'hajime' }).first()) ??
    (await knex('tenants').orderBy('created_at', 'asc').first());
  if (!tenant) return;

  const emails = DEMO_SALES_REPS.map((r) => r.email.toLowerCase());
  await knex('users')
    .where({ tenant_id: tenant.id })
    .whereIn('email', emails)
    .whereNull('deleted_at')
    .update({ deleted_at: knex.fn.now(), is_active: false });
}
