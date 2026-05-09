/**
 * Audit: every URL in AppSidebar.tsx must map to a defined route in App.tsx.
 * Catches renames/removals that SWC/Vite won't surface at build time.
 *
 * Usage: node scripts/audit-sidebar-links.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return fs.readFileSync(path.join(rootDir, rel), 'utf8');
}

// ── Extract sidebar URLs ───────────────────────────────────────────────────
const sidebarSrc = read('src/components/AppSidebar.tsx');
// Matches: url: "/some/path" or url: "/some/path?query"
const sidebarUrls = [...sidebarSrc.matchAll(/url:\s*["']([^"']+)["']/g)].map(
  (m) => m[1],
);

// ── Extract declared route paths from App.tsx ──────────────────────────────
const appSrc = read('src/App.tsx');
// Matches: path="/foo/bar" — excludes the catch-all "*"
const routePaths = new Set(
  [...appSrc.matchAll(/\bpath=["']([^"'*][^"']*)["']/g)].map((m) => m[1]),
);
// Root route is defined as path="/" implicitly via <Route path="/" …>
routePaths.add('/');

// ── Cross-check ────────────────────────────────────────────────────────────
let failures = 0;
const seen = new Set();

for (const url of sidebarUrls) {
  const pathname = url.split('?')[0]; // strip query string before matching
  if (seen.has(pathname)) continue;
  seen.add(pathname);

  if (!routePaths.has(pathname)) {
    console.error(`❌  Sidebar link "${url}" → path "${pathname}" is not declared in App.tsx`);
    failures++;
  }
}

const checkedCount = seen.size;

if (failures === 0) {
  console.log(`✅  All ${checkedCount} sidebar link(s) resolve to declared routes.`);
} else {
  console.error(
    `\n${failures} unresolved sidebar link(s). Fix the route path in App.tsx or the URL in AppSidebar.tsx.`,
  );
  process.exit(1);
}
