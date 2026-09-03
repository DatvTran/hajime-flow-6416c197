import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { db } from '../config/database.mjs';

export function isSupabaseAuthEnabled() {
  return Boolean(
    process.env.SUPABASE_URL?.trim() &&
      (process.env.SUPABASE_JWT_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
  );
}

function supabaseUrl() {
  return process.env.SUPABASE_URL.trim();
}

export function getSupabaseAnonClient() {
  const anon = process.env.SUPABASE_ANON_KEY?.trim();
  if (!anon) {
    throw new Error('SUPABASE_ANON_KEY is required when Supabase Auth is enabled');
  }
  return createClient(supabaseUrl(), anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getSupabaseAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required when Supabase Auth is enabled');
  }
  return createClient(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function verifySupabaseAccessToken(token) {
  const secret = process.env.SUPABASE_JWT_SECRET?.trim();
  if (!secret) return null;
  try {
    return jwt.verify(token, secret, {
      algorithms: ['HS256'],
    });
  } catch {
    return null;
  }
}

/**
 * Resolve public.users from a Supabase JWT payload (`sub` / email).
 */
export async function findAppUserFromSupabasePayload(payload) {
  const sub = payload?.sub ? String(payload.sub) : '';
  const email = payload?.email ? String(payload.email).toLowerCase().trim() : '';

  if (sub) {
    const byExternal = await db('users')
      .where({ external_id: sub, is_active: true })
      .whereNull('deleted_at')
      .first();
    if (byExternal) return byExternal;
  }

  if (!email) return null;

  const byEmail = await db('users')
    .where({ email, is_active: true })
    .whereNull('deleted_at')
    .first();

  if (byEmail && sub && byEmail.external_id !== sub) {
    await db('users').where({ id: byEmail.id }).update({
      external_id: sub,
      auth_provider: 'supabase',
      updated_at: db.fn.now(),
    });
    byEmail.external_id = sub;
    byEmail.auth_provider = 'supabase';
  }

  return byEmail || null;
}

export async function ensureSupabaseAuthUser({ email, password, displayName, emailConfirm = true }) {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: email.toLowerCase().trim(),
    password,
    email_confirm: emailConfirm,
    user_metadata: displayName ? { display_name: displayName } : undefined,
  });
  if (error) {
    const msg = error.message || String(error);
    if (/already been registered|already exists/i.test(msg)) {
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existing = list?.users?.find(
        (u) => String(u.email || '').toLowerCase() === email.toLowerCase().trim(),
      );
      if (existing) return existing;
    }
    throw error;
  }
  return data.user;
}

export async function signInWithPassword(email, password) {
  const client = getSupabaseAnonClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  });
  if (error) {
    const err = new Error(error.message || 'Invalid credentials');
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }
  return {
    accessToken: data.session?.access_token,
    refreshToken: data.session?.refresh_token,
    supabaseUser: data.user,
  };
}

export async function refreshSupabaseSession(refreshToken) {
  const client = getSupabaseAnonClient();
  const { data, error } = await client.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session) return null;
  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  };
}

export async function signOutSupabase(accessToken) {
  if (!accessToken) return;
  try {
    const anon = process.env.SUPABASE_ANON_KEY?.trim();
    const client = createClient(supabaseUrl(), anon, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    await client.auth.signOut();
  } catch {
    /* ignore */
  }
}

export async function requestPasswordReset(email) {
  const client = getSupabaseAnonClient();
  const redirectTo = `${(process.env.CLIENT_URL || 'http://localhost:8080').replace(/\/$/, '')}/reset-password`;
  const { error } = await client.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
    redirectTo,
  });
  if (error) throw error;
}

export async function updatePasswordWithAccessToken(accessToken, newPassword) {
  const anon = process.env.SUPABASE_ANON_KEY?.trim();
  const client = createClient(supabaseUrl(), anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { error } = await client.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
