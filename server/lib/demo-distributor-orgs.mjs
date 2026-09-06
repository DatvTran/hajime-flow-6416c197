/** Seed / design-system wholesalers that must not appear in live HQ. */

const DEMO_SLUGS = new Set([
  'metro_logistics',
  'metro-logistics',
  'empire-wines',
  'empire_wines',
  'midwest-spirits',
  'midwest_spirits',
  'kanto-beverage',
  'kanto_beverage',
  'cave-lumiere',
  'cave_lumiere',
]);

const DEMO_NAME_NEEDLES = [
  'metro logistics',
  'empire wines',
  'midwest spirits',
  'kanto beverage',
  'cave lumiere',
  'cave lumière',
  'vino nord',
];

function fold(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isDemoDistributorOrg(org) {
  const id = fold(org?.id).replace(/:/g, '');
  const slug = fold(org?.slug).replace(/-/g, '_');
  if (DEMO_SLUGS.has(id) || DEMO_SLUGS.has(slug) || DEMO_SLUGS.has(id.replace(/-/g, '_'))) {
    return true;
  }
  const name = fold(org?.name);
  if (!name) return false;
  return DEMO_NAME_NEEDLES.some((needle) => name.includes(fold(needle)));
}
