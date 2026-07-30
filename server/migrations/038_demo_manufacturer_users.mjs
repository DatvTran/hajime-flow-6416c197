/**
 * Idempotent demo manufacturer logins (Kirin CRM contacts).
 * Runs on deploy via `knex migrate:latest` — does not require a destructive re-seed.
 */
import { authService } from '../services/auth.mjs';

const DEMO_PASSWORD = 'admin123!';

const DEMO_MANUFACTURERS = [
  {
    email: 'export@kirin.example',
    display_name: 'Kirin Production Liaison',
    team_member_id: 'tm-seed-9',
  },
  {
    email: 'scheduling@kirin.example',
    display_name: 'Kirin Export Scheduling',
    team_member_id: 'tm-seed-10',
  },
];

export async function up(knex) {
  const tenant =
    (await knex('tenants').where({ subdomain: 'hajime' }).first()) ??
    (await knex('tenants').orderBy('created_at', 'asc').first());

  if (!tenant) {
    console.log('[038] No tenant found — skipping demo manufacturer users');
    return;
  }

  const passwordHash = await authService.hashPassword(DEMO_PASSWORD);

  for (const mfg of DEMO_MANUFACTURERS) {
    const email = mfg.email.toLowerCase();
    const existing = await knex('users')
      .where({ tenant_id: tenant.id, email })
      .whereNull('deleted_at')
      .first();

    const userPatch = {
      role: 'manufacturer',
      display_name: mfg.display_name,
      password_hash: passwordHash,
      is_active: true,
      email_verified: true,
      updated_at: knex.fn.now(),
    };

    if (existing) {
      await knex('users').where({ id: existing.id }).update(userPatch);
      console.log(`[038] Updated manufacturer user: ${email}`);
    } else {
      await knex('users').insert({
        tenant_id: tenant.id,
        email,
        ...userPatch,
      });
      console.log(`[038] Created manufacturer user: ${email}`);
    }

    const tmExisting = await knex('team_members')
      .where({ tenant_id: tenant.id, email })
      .first();
    if (tmExisting) {
      await knex('team_members')
        .where({ id: tmExisting.id })
        .update({
          role: 'manufacturer',
          name: mfg.display_name,
          is_active: true,
          updated_at: knex.fn.now(),
        });
    } else {
      await knex('team_members').insert({
        id: mfg.team_member_id,
        tenant_id: tenant.id,
        name: mfg.display_name,
        email,
        role: 'manufacturer',
        is_active: true,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      });
    }
  }
}

export async function down(knex) {
  const tenant =
    (await knex('tenants').where({ subdomain: 'hajime' }).first()) ??
    (await knex('tenants').orderBy('created_at', 'asc').first());
  if (!tenant) return;

  const emails = DEMO_MANUFACTURERS.map((m) => m.email.toLowerCase());
  await knex('users')
    .where({ tenant_id: tenant.id })
    .whereIn('email', emails)
    .whereNull('deleted_at')
    .update({ deleted_at: knex.fn.now(), is_active: false });
}
