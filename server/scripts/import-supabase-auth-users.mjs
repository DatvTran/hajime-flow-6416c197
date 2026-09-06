#!/usr/bin/env node
/**
 * Create Supabase Auth users for existing public.users rows and set external_id.
 * Passwords cannot be copied from Argon2 hashes.
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL
 * Optional: DEMO_PASSWORD=admin123!  (applied when email matches known demo accounts)
 *           DEFAULT_TEMP_PASSWORD=  (if set, used for non-demo users instead of invite/reset)
 */
import { createClient } from '@supabase/supabase-js';
import knexFactory from 'knex';
import { flyDatabaseConnection } from '../config/fly-database-url.mjs';

const DEMO_PASSWORDS = {
  'admin@hajime.jp': 'admin123!',
  'retail@hajime.jp': 'retail123!',
  'fulfillment@metrologistics.example': 'admin123!',
  'marcus.chen@hajime.jp': 'admin123!',
  'sarah.kim@hajime.jp': 'admin123!',
  'luca.moretti@hajime.jp': 'admin123!',
  'portal@kosapan.example': 'admin123!',
};

const url = process.env.SUPABASE_URL?.trim();
const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !service) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const db = knexFactory({
  client: 'postgresql',
  connection: flyDatabaseConnection({ ssl: { rejectUnauthorized: false } }),
  pool: { min: 0, max: 2 },
});

const demoPassword = process.env.DEMO_PASSWORD || 'admin123!';
const tempPassword = process.env.DEFAULT_TEMP_PASSWORD?.trim() || '';

async function findAuthUserByEmail(email) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users.find((u) => String(u.email || '').toLowerCase() === email) || null;
}

async function main() {
  const users = await db('users').whereNull('deleted_at').where({ is_active: true });
  console.log(`Importing ${users.length} active users into Supabase Auth`);

  for (const user of users) {
    const email = String(user.email || '').toLowerCase().trim();
    if (!email) continue;

    const password =
      DEMO_PASSWORDS[email] ||
      (email.endsWith('@hajime.jp') ? demoPassword : null) ||
      tempPassword ||
      null;

    let authUser = await findAuthUserByEmail(email);
    if (!authUser) {
      if (!password) {
        const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
          data: { display_name: user.display_name },
        });
        if (error) {
          console.warn(`invite failed ${email}:`, error.message);
          continue;
        }
        authUser = data.user;
        console.log(`invited ${email}`);
      } else {
        const { data, error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { display_name: user.display_name },
        });
        if (error) {
          console.warn(`create failed ${email}:`, error.message);
          continue;
        }
        authUser = data.user;
        console.log(`created ${email}`);
      }
    } else {
      console.log(`exists ${email}`);
    }

    if (authUser?.id) {
      await db('users').where({ id: user.id }).update({
        external_id: authUser.id,
        auth_provider: 'supabase',
        updated_at: db.fn.now(),
      });
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
