/** Canonical rep names — keep in sync with `src/data/team-roster.ts`. */
const SALES_REP_ROSTER = [
  { email: 'sarah.kim@hajime.jp', displayName: 'Sarah Kim' },
  { email: 'marcus.chen@hajime.jp', displayName: 'Marcus Chen' },
  { email: 'luca.moretti@hajime.jp', displayName: 'Luca Moretti' },
  { email: 'jordan.lee@hajime.jp', displayName: 'Jordan Lee' },
];

export function resolveSalesRepLabelForUser(user) {
  const email = String(user?.email || '')
    .trim()
    .toLowerCase();
  const hit = SALES_REP_ROSTER.find((r) => r.email === email);
  if (hit) return hit.displayName;
  const name = String(user?.displayName || user?.display_name || '').trim();
  return name || 'Unassigned';
}

export function normalizeRepLabel(label) {
  return String(label ?? '')
    .trim()
    .toLowerCase();
}
