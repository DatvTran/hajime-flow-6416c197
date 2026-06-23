import { platformDb } from '../config/database.mjs';

/** Attach platform `users.id` to CRM rows (matched by email) for client-side rep assignment UI. */
export async function attachPortalUserIds(tenantId, rows) {
  if (!Array.isArray(rows) || rows.length === 0) return rows;

  const emails = [
    ...new Set(
      rows
        .map((r) => String(r.email ?? '').trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
  if (emails.length === 0) return rows;

  const users = await platformDb('users')
    .where({ tenant_id: tenantId })
    .whereIn('email', emails)
    .whereNull('deleted_at')
    .select('id', 'email');

  const byEmail = new Map(
    users.map((u) => [String(u.email).trim().toLowerCase(), Number(u.id)]),
  );

  return rows.map((row) => {
    const email = String(row.email ?? '').trim().toLowerCase();
    const portalUserId = byEmail.get(email);
    return portalUserId != null ? { ...row, portal_user_id: portalUserId } : row;
  });
}
